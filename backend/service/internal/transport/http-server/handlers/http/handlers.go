package handler

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"
	"github.com/go-playground/validator/v10"
	"github.com/mmmakskl/HeritageKeeper/service/domain/models"
	ssogrpc "github.com/mmmakskl/HeritageKeeper/service/internal/clients/sso/grpc"
	"github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	resp "github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	"github.com/mmmakskl/HeritageKeeper/service/lib/jwt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type service interface {
	Login(ctx context.Context, email string) error
	Register(ctx context.Context, userID int64, email string) error
	User(ctx context.Context, userID int64) (models.User, error)
	Users() ([]models.User, error)
	//TODO: UpdateUserInfo(ctx context.Context, userID int64, username string, fullName string, email string) error
	//TODO: CreateCollection(ctx context.Context, userID int64, collectionName string) (int64, error)
	//...
}

type Request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	AppID    int32  `json:"app_id,omitempty"`
}

type Response struct {
	resp.Response
	Users    []models.User `json:"users,omitempty"`
	UserID   int64         `json:"user_id,omitempty"`
	Username string        `json:"username,omitempty"`
	FullName string        `json:"full_name,omitempty"`
	Email    string        `json:"email,omitempty"`
	Message  string        `json:"message,omitempty"`
	Token    string        `json:"token,omitempty"`
}

type handler struct {
	service service
	client  *ssogrpc.Client
}

func NewHandlers(client *ssogrpc.Client, s service) *handler {
	return &handler{
		client:  client,
		service: s,
	}
}

// TODO: Проверка email на валидность
func (h *handler) Register(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.Register"

		log := log.With(
			slog.String("op", op),
			slog.String("request_id", middleware.GetReqID(r.Context())),
		)

		var req Request

		err := render.DecodeJSON(r.Body, &req)
		if err != nil {
			log.Error("failed to decode request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to decode request"))

			return
		}

		log.Info("request body decoded", slog.Any("request", req))

		if err := validator.New().Struct(req); err != nil {
			log.Error("invalid request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to validate request"))

			return
		}

		userID, err := h.client.Register(r.Context(), req.Email, req.Password)
		if err != nil {
			log.Error("failed to register user", slog.String("err", err.Error()))

			st, ok := status.FromError(err)
			if ok {
				switch st.Code() {
				case codes.AlreadyExists:
					render.JSON(w, r, response.Error(fmt.Sprintf("user already exists %d", http.StatusConflict)))
				case codes.InvalidArgument:
					render.JSON(w, r, response.Error(fmt.Sprintf("%s: %d", st.Message(), http.StatusBadRequest)))
				default:
					render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
				}
				return
			}

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("user registered", slog.Int64("user_id", userID))

		err = h.service.Register(r.Context(), userID, req.Email)
		if err != nil {
			log.Error("failed to register user in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		render.JSON(w, r, Response{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:  userID,
			Message: "user registered",
		})
	}
}

func (h *handler) Login(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.Login"

		log := log.With(
			slog.String("op", op),
			slog.String("request_id", middleware.GetReqID(r.Context())),
		)

		var req Request

		err := render.DecodeJSON(r.Body, &req)
		if err != nil {
			log.Error("failed to decode request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to decode request"))

			return
		}

		log.Info("request body decoded", slog.Any("request", req))

		if err := validator.New().Struct(req); err != nil {
			log.Error("invalid request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to validate request"))

			return
		}

		token, err := h.client.Login(r.Context(), req.Email, req.Password, req.AppID)
		if err != nil {
			log.Error("failed to login user", slog.String("err", err.Error()))

			if st, ok := status.FromError(err); ok {
				switch st.Code() {
				case codes.NotFound:
					render.JSON(w, r, response.Error(fmt.Sprintf("user not found %d", http.StatusNotFound)))
				case codes.InvalidArgument:
					render.JSON(w, r, response.Error(fmt.Sprintf("%s: %d", st.Message(), http.StatusBadRequest)))
				default:
					render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
				}
				return
			}

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		if err = h.service.Login(context.Background(), req.Email); err != nil {
			log.Error("failed to login user in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		w.Header().Set("Authorization", "Bearer "+token)
		w.Header().Set("Access-Control-Expose-Headers", "Authorization")

		render.JSON(w, r, Response{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			Message: "user logged in",
			Token:   token,
		})
	}
}

func (h *handler) Profile(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.Profile"

		log := log.With(
			slog.String("op", op),
			slog.String("request_id", middleware.GetReqID(r.Context())),
		)

		claims, err := jwt.GetClaimsFromContext(r.Context())
		if err != nil {
			log.Error("failed to get claims from context", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		userID, err := jwt.GetUserIDFromClaims(claims)
		if err != nil {
			log.Error("failed to get user id from claims", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		log.Info("user id from claims", slog.String("user_id", userID))

		userIDInt, err := strconv.ParseInt(userID, 10, 64)

		user, err := h.service.User(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get user", slog.String("err", err.Error()))

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		render.JSON(w, r, Response{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:   user.UserID,
			Username: user.Username,
			FullName: user.FullName,
			Email:    user.Email,
			Message:  "user profile",
		})
	}
}

func (h *handler) Users(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.Users"

		log := log.With(
			slog.String("op", op),
			slog.String("request_id", middleware.GetReqID(r.Context())),
		)

		users, err := h.service.Users()
		if err != nil {
			log.Error("failed to get users", slog.String("err", err.Error()))

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		render.JSON(w, r, Response{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			Message: "users",
			Users:   users,
		})
	}
}
