package app

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	ssoGRPC "github.com/mmmakskl/HeritageKeeper/service/internal/clients/sso/grpc"
	"github.com/mmmakskl/HeritageKeeper/service/internal/config"
	"github.com/mmmakskl/HeritageKeeper/service/internal/service"
	handler "github.com/mmmakskl/HeritageKeeper/service/internal/transport/http-server/handlers/http"
	mw "github.com/mmmakskl/HeritageKeeper/service/internal/transport/http-server/middleware"
	"github.com/mmmakskl/HeritageKeeper/service/storage/postgresql"
)

type App struct {
	server *http.Server
	log    *slog.Logger
	client *ssoGRPC.Client
}

func New(
	log *slog.Logger,
	cfg *config.Config,
) *App {
	storage, err := postgresql.New(postgresql.DBstruct(cfg.Storage))
	if err != nil {
		log.Error("failed to create storage", slog.String("err", err.Error()))
		os.Exit(1)
	}

	client, err := ssoGRPC.New(
		context.Background(),
		log,
		cfg.Clients.SSO.Address,
		cfg.Clients.SSO.Timeout,
		cfg.Clients.SSO.RetriesCount,
	)
	if err != nil {
		log.Error("failed to create sso client", slog.String("err", err.Error()))
		os.Exit(1)
	}

	serv := service.New(log, storage, storage, *client)

	router := chi.NewRouter()

	secret := cfg.AppSecret

	authMiddleware := mw.JWTAuthMiddleware(secret)

	//TODO: сделать это более красиво, разобраться
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://127.0.0.1:3000"}, // Укажите фронтенд
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	router.Use(middleware.Logger)
	router.Use(mw.New(log))
	router.Use(middleware.RequestID)
	router.Use(middleware.Recoverer)
	router.Use(middleware.URLFormat)
	router.Use(c.Handler)

	handlers := handler.NewHandlers(client, serv)

	router.Route("/api", func(r chi.Router) {
		r.Post("/register", handlers.Register(log))
		r.Post("/login", handlers.Login(log))
		r.Get("/users", handlers.Users(log))
	})

	router.Group(func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/api/profile", handlers.Profile(log))
	})

	srv := &http.Server{
		Addr:         cfg.HTTPServer.Address,
		Handler:      router,
		ReadTimeout:  cfg.HTTPServer.Timeout,
		WriteTimeout: cfg.HTTPServer.Timeout,
		IdleTimeout:  cfg.HTTPServer.IdleTimeout,
	}

	return &App{
		server: srv,
		log:    log,
		client: client,
	}
}

func (a *App) Run() error {
	a.log.Info("Starting server", slog.String("address", a.server.Addr))
	return a.server.ListenAndServe()
}

// TODO: если grpc выключен
func (a *App) Shutdown(ctx context.Context) error {
	// if err := a.client; err != nil {
	// 	a.log.Error("failed to close gRPC client", slog.String("error", err.Error()))
	// }

	if err := a.server.Shutdown(ctx); err != nil {
		return err
	}

	a.log.Info("Server stopped")
	return nil
}
