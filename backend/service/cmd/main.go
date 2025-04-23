package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mmmakskl/HeritageKeeper/service/cmd/app"
	"github.com/mmmakskl/HeritageKeeper/service/internal/config"
)

func main() {
	cfg := config.MustLoad()
	log := setupLogger(cfg.ENV)
	log.Info("Starting HeritageKeeper application", slog.Any("grpc", cfg.Clients.SSO.Address), slog.Any("server", cfg.HTTPServer.Address), slog.Any("frontend", cfg.Frontend.Address))

	application := app.New(log, cfg)

	go func() {
		if err := application.Run(); err != nil {
			log.Error("failed to run application", slog.String("err", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down application")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := application.Shutdown(ctx); err != nil {
		log.Error("failed to shutdown application", slog.String("err", err.Error()))
		os.Exit(1)
	}
	log.Info("Application shutdown complete")
}

func setupLogger(env string) *slog.Logger {
	var level slog.Level
	var logger *slog.Logger
	switch env {
	case "local":
		level = slog.LevelDebug
	case "prod":
		level = slog.LevelInfo
	case "dev":
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	default:
		level = slog.LevelDebug
	}

	logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	}))

	return logger
}
