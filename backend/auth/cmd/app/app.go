package app

import (
	"log/slog"
	"time"

	grpcapp "github.com/mmmakskl/HeritageKeeper/sso/cmd/app/grpc"
	"github.com/mmmakskl/HeritageKeeper/sso/internal/config"
	"github.com/mmmakskl/HeritageKeeper/sso/internal/service/auth"
	"github.com/mmmakskl/HeritageKeeper/sso/storage/postgresgl"
)

type App struct {
	GRPCSrv *grpcapp.App
}

func New(
	log *slog.Logger,
	grpcPort int,
	storageCfg config.Config,
	tokenTTL time.Duration,
) *App {
	storage, err := postgresgl.New(postgresgl.DBstruct(storageCfg.Storage))
	if err != nil {
		log.Error("failed to open storage", slog.String("err", err.Error()))
		panic(err)
	}

	authService := auth.New(log, storage, storage, storage, tokenTTL)

	grpcApp := grpcapp.New(log, authService, grpcPort)

	return &App{
		GRPCSrv: grpcApp,
	}
}
