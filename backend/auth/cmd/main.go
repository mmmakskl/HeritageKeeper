package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/mmmakskl/HeritageKeeper/sso/cmd/app"
	"github.com/mmmakskl/HeritageKeeper/sso/internal/config"
)

func main() {
	cfg := config.MustLoad()

	log := setupLogger(cfg.Env)

	log.Info("Starting HeritageKeeper application", slog.Any("config", cfg))

	application := app.New(log, cfg.GRPC.Port, *cfg, cfg.TockenTTL)

	go application.GRPCSrv.MustRun()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)

	sign := <-stop

	log.Info("Received signal", slog.String("signal", sign.String()))

	application.GRPCSrv.Stop()

	log.Info("HeritageKeeper application stopped")
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
