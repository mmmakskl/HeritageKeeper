package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

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
	Register(ctx context.Context, userID int64, email string, username string, phone string) error
	User(ctx context.Context, userID int64) (models.User, error)
	Users() ([]models.User, error)
	UpdateUserInfo(ctx context.Context, userID int64, username string, email string, phone string, birth_date time.Time) error
	SetCollection(ctx context.Context, userID int64, collectionName string, description string, image_url string, categoryID int64, isPublic bool) (int64, error)
	UpdateCollection(ctx context.Context, userID, collectionID int64, collectionName string, description string, categoryID int64, isPublic bool) error
	DeleteCollection(ctx context.Context, userID, collectionID int64) error
	Collection(ctx context.Context, userID, collectionID int64) (models.Collection, error)
	Collections(ctx context.Context, userID int64) ([]models.Collection, error)
	SetItem(ctx context.Context, collectionID int64, title string, description string, category_id int64, country string, images []string, year string, attributes []string) (int64, error)
	UpdateItem(ctx context.Context, collectionID int64, itemID int64, title string, description string, category_id int64, country string, images []string, year string, attributes []string) error
	DeleteItem(ctx context.Context, collectionID, itemID int64) error
	Item(ctx context.Context, collectionID, itemID int64) (models.Item, error)
	Items(ctx context.Context, collectionID int64) ([]models.Item, error)
}

type Request struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	AppID     int32  `json:"app_id,omitempty"`
	Username  string `json:"username,omitempty"`
	Phone     string `json:"phone,omitempty"`
	BirthDate string `json:"birth_date,omitempty"`
	ImageURL  string `json:"profile_image_url,omitempty"`
}

type Response struct {
	resp.Response
	Users     []models.User `json:"users,omitempty"`
	UserID    int64         `json:"user_id,omitempty"`
	Username  string        `json:"username,omitempty"`
	Phone     string        `json:"phone,omitempty"`
	BirthDate *time.Time    `json:"birth_date,omitempty"`
	Email     string        `json:"email,omitempty"`
	Message   string        `json:"message,omitempty"`
	Token     string        `json:"token,omitempty"`
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

		err = h.service.Register(r.Context(), userID, req.Email, req.Username, req.Phone)
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
			UserID:    user.UserID,
			Username:  user.Username,
			Phone:     user.Phone,
			BirthDate: &user.Birth_date,
			Email:     user.Email,
			Message:   "user profile",
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

// TODO: Нет такого юзераб exists
func (h *handler) UpdateUserInfo(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.UpdateUserInfo"

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
		if err != nil {
			log.Error("failed to parse user id", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		var req Request

		err = render.DecodeJSON(r.Body, &req)
		if err != nil {
			log.Error("failed to decode request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to decode request"))

			return
		}

		if err := validator.New().Struct(req); err != nil {
			log.Error("invalid request", slog.String("err", err.Error()))

			render.JSON(w, r, resp.Error("failed to validate request"))

			return
		}

		birthDate, err := time.Parse("02-01-2006", req.BirthDate)
		if err != nil {
			log.Error("failed to parse birth date", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("invalid birth date format %d", http.StatusBadRequest)))
			return
		}
		if birthDate.After(time.Now()) {
			log.Error("birth date is in the future")
			render.JSON(w, r, response.Error(fmt.Sprintf("birth date is in the future %d", http.StatusBadRequest)))
			return
		}

		err = h.service.UpdateUserInfo(r.Context(), userIDInt, req.Username, req.Email, req.Phone, birthDate)
		if err != nil {
			log.Error("failed to update user info in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("user info updated", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, Response{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:    userIDInt,
			Username:  req.Username,
			Phone:     req.Phone,
			BirthDate: &birthDate,
			Email:     req.Email,
			Message:   "user info updated",
		})
	}
}

// Get, uprate collection
