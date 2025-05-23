package handlers

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"
	"github.com/go-playground/validator/v10"
	"github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	resp "github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	"github.com/mmmakskl/HeritageKeeper/service/lib/jwt"
)

type ItemRequest struct {
	CollectionID int64 `json:"collection_id" validate:"required"`
	ItemID       int64 `json:"item_id"`
	// CollectionName string   `json:"collection_name"`
	Description string   `json:"description" validate:"required"`
	CategoryID  int64    `json:"category_id" validate:"required"`
	IsPublic    bool     `json:"is_public" validate:"required"`
	Title       string   `json:"title" validate:"required"`
	Country     string   `json:"country" validate:"required"`
	Year        string   `json:"year" validate:"required"`
	Images      []string `json:"item_images_url" validate:"required"`
	Attributes  []string `json:"attributes"`
}

type ItemResponse struct {
	resp.Response
	CollectionID int64  `json:"collection_id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	CategoryID   int64  `json:"category_id"`
	IsPublic     bool   `json:"is_public"`
	Message      string `json:"message"`
	ItemID       int64  `json:"item_id"`
}

func (h *handler) CreateItem(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.CreateItem"

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

		var req ItemRequest

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

		itemID, err := h.service.SetItem(r.Context(), userIDInt, req.CollectionID, req.Title, req.Description, req.CategoryID, req.Country, req.Images, req.Year, req.Attributes)
		if err != nil {
			log.Error("failed to create item in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("item created", slog.Int64("item_id", itemID))
		render.JSON(w, r, ItemResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			CollectionID: req.CollectionID,
			Title:        req.Title,
			Description:  req.Description,
			CategoryID:   req.CategoryID,
			IsPublic:     req.IsPublic,
			Message:      "item created",
			ItemID:       itemID,
		})
	}
}

func (h *handler) UpdateItem(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.UpdateItem"

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

		var req ItemRequest

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

		if req.ItemID == 0 {
			id := chi.URLParam(r, "item_id")
			if id == "" {
				log.Error("item id is required", slog.String("err", "item id is required"))
				render.JSON(w, r, resp.Error("item id is required"))
				return
			}
			req.ItemID, err = strconv.ParseInt(id, 10, 64)
			if err != nil {
				log.Error("failed to parse item id", slog.String("err", err.Error()))
				render.JSON(w, r, resp.Error("failed to parse item id"))
				return
			}
		}

		err = h.service.UpdateItem(r.Context(), userIDInt, req.CollectionID, req.ItemID, req.Title, req.Description, req.CategoryID, req.Country, req.Images, req.Year, req.Attributes)
		if err != nil {
			log.Error("failed to update item in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("item updated", slog.Int64("item_id", req.ItemID))
		render.JSON(w, r, ItemResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			CollectionID: req.CollectionID,
			Title:        req.Title,
			Description:  req.Description,
			CategoryID:   req.CategoryID,
			IsPublic:     req.IsPublic,
			Message:      "item updated",
			ItemID:       req.ItemID,
		})
	}
}
