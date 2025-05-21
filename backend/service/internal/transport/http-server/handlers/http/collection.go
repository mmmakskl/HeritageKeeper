package handlers

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"
	"github.com/go-playground/validator/v10"
	"github.com/mmmakskl/HeritageKeeper/service/domain/models"
	"github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	resp "github.com/mmmakskl/HeritageKeeper/service/lib/api/response"
	"github.com/mmmakskl/HeritageKeeper/service/lib/jwt"
	"github.com/mmmakskl/HeritageKeeper/service/storage"
)

type CollectionRequest struct {
	CollectionID   int64  `json:"id,omitempty"`
	CollectionName string `json:"name,omitempty"`
	Description    string `json:"description,omitempty"`
	CategoryID     int64  `json:"category_id,omitempty"`
	IsPublic       bool   `json:"is_public,omitempty"`
	ImageURL       string `json:"cover_image_url,omitempty"`
}

type CollectionResponse struct {
	resp.Response
	UserID         int64               `json:"user_id,omitempty"`
	Collections    []models.Collection `json:"collections,omitempty"`
	CollectionID   int64               `json:"id,omitempty"`
	CollectionName string              `json:"name,omitempty"`
	CategoryID     int64               `json:"category_id,omitempty"`
	Description    string              `json:"description,omitempty"`
	IsPublic       bool                `json:"is_public,omitempty"`
	Message        string              `json:"message,omitempty"`
}

func (h *handler) CreateCollection(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.SetCollection"

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

		var req CollectionRequest

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

		//! Заглушка:
		ImageURL := "not found"

		collectionID, err := h.service.SetCollection(r.Context(), userIDInt, req.CollectionName, req.Description, ImageURL, req.CategoryID, req.IsPublic)
		if err != nil {
			log.Error("failed to set collection in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("collection set", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, CollectionResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:         userIDInt,
			CollectionID:   collectionID,
			CollectionName: req.CollectionName,
			CategoryID:     req.CategoryID,
			IsPublic:       req.IsPublic,
			Message:        "collection set",
		})
	}
}

func (h *handler) UpdateCollection(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.UpdateCollection"
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

		var req CollectionRequest
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

		err = h.service.UpdateCollection(r.Context(), userIDInt, req.CollectionID, req.CollectionName, req.Description, req.CategoryID, req.IsPublic)
		if err != nil {
			log.Error("failed to update collection in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}

		log.Info("collection updated", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, CollectionResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:         userIDInt,
			CollectionID:   req.CollectionID,
			CollectionName: req.CollectionName,
			CategoryID:     req.CategoryID,
			IsPublic:       req.IsPublic,
			Message:        "collection updated",
		})
	}
}

func (h *handler) Collections(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.GetCollection"

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

		collections, err := h.service.Collections(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get collections", slog.String("err", err.Error()))

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("collections", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, CollectionResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:      userIDInt,
			Collections: collections,
			Message:     "collections",
		})
	}
}

func (h *handler) Collection(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.GetCollection"

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

		var req CollectionRequest

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

		if req.CollectionID == 0 {
			id := chi.URLParam(r, "id")
			if id == "" {
				log.Error("collection id is empty")
				render.JSON(w, r, response.Error(fmt.Sprintf("collection id is empty %d", http.StatusBadRequest)))
				return
			}
			req.CollectionID, err = strconv.ParseInt(id, 10, 64)
			if err != nil {
				log.Error("failed to parse collection id", slog.String("err", err.Error()))
				render.JSON(w, r, response.Error(fmt.Sprintf("failed to parse collection id %d", http.StatusBadRequest)))
				return
			}
		}

		collection, err := h.service.Collection(r.Context(), userIDInt, req.CollectionID)
		if err != nil {
			log.Error("failed to get collection", slog.String("err", err.Error()))

			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("collection", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, CollectionResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:         userIDInt,
			CollectionID:   collection.CollectionID,
			CollectionName: collection.CollectionName,
			Description:    collection.Description,
			CategoryID:     collection.CategoryID,
			IsPublic:       collection.IsPublic,
			Message:        "collection",
		})
	}
}

func (h *handler) DeleteCollection(log *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		const op = "handlers.auth.DeleteCollection"

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

		var req CollectionRequest

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

		if req.CollectionID == 0 {
			id := chi.URLParam(r, "id")
			if id == "" {
				log.Error("collection id is empty")
				render.JSON(w, r, response.Error(fmt.Sprintf("collection id is empty %d", http.StatusBadRequest)))
				return
			}
			req.CollectionID, err = strconv.ParseInt(id, 10, 64)
			if err != nil {
				log.Error("failed to parse collection id", slog.String("err", err.Error()))
				render.JSON(w, r, response.Error(fmt.Sprintf("failed to parse collection id %d", http.StatusBadRequest)))
				return
			}
		}

		err = h.service.DeleteCollection(r.Context(), userIDInt, req.CollectionID)
		if err != nil {
			if errors.Is(err, storage.ErrCollectionNotFound) {
				log.Error("collection not found", slog.String("err", err.Error()))
				render.JSON(w, r, response.Error(fmt.Sprintf("collection not found %d", http.StatusNotFound)))
				return
			}
			log.Error("failed to delete collection in storage", slog.String("err", err.Error()))
			render.JSON(w, r, response.Error(fmt.Sprintf("internal server error %d", http.StatusInternalServerError)))
			return
		}
		log.Info("collection deleted", slog.Int64("user_id", userIDInt))
		render.JSON(w, r, CollectionResponse{
			Response: resp.Response{
				Status: response.OK().Status,
				Error:  response.OK().Error,
			},
			UserID:       userIDInt,
			CollectionID: req.CollectionID,
			Message:      "collection deleted",
		})
	}
}
