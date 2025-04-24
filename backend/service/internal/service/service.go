package service

import (
	"context"
	"log/slog"
	"strconv"
	"time"

	"github.com/mmmakskl/HeritageKeeper/service/domain/models"
	ssogrpc "github.com/mmmakskl/HeritageKeeper/service/internal/clients/sso/grpc"
)

type Service struct {
	log           *slog.Logger
	read_storage  ReadStorage
	write_storage WriteStorage
	sso_client    ssogrpc.Client
	// tokenTTL time.Duration
}

type ReadStorage interface {
	User(ctx context.Context, userID int64) (models.User, error)
	Users() ([]models.User, error)
}

type WriteStorage interface {
	Register(ctx context.Context, userid int64, email string, username string) error
	UpdateUserInfo(
		ctx context.Context,
		userID int64,
		username string,
		email string,
		phone string,
		birth_date time.Time,
	) error
	Login(ctx context.Context, email string) error
	SetCollection(
		ctx context.Context,
		userID int64,
		collectionName string,
		description string,
		categoryID int64,
		isPublic bool,
	) error
}

func New(
	log *slog.Logger,
	read_storage ReadStorage,
	write_storage WriteStorage,
	sso_client ssogrpc.Client,
) *Service {
	return &Service{
		log:           log,
		read_storage:  read_storage,
		write_storage: write_storage,
		sso_client:    sso_client,
	}
}

func (s *Service) Register(ctx context.Context, user_id int64, email string, username string) error {
	s.log.Debug("Register user", slog.String("email", email))

	return s.write_storage.Register(ctx, user_id, email, username)
}

func (s *Service) User(ctx context.Context, userID int64) (models.User, error) {
	s.log.Debug("Get user", slog.String("user_id", strconv.Itoa(int(userID))))

	user, err := s.read_storage.User(ctx, userID)
	if err != nil {
		return models.User{}, err
	}

	return user, nil
}

func (s *Service) Login(ctx context.Context, email string) error {
	s.log.Debug("Login user", slog.String("email", email))

	return s.write_storage.Login(ctx, email)
}

func (s *Service) Users() ([]models.User, error) {
	s.log.Debug("Get users")

	users, err := s.read_storage.Users()
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *Service) UpdateUserInfo(
	ctx context.Context,
	userID int64,
	username string,
	email string,
	phone string,
	birth_date time.Time,
) error {
	s.log.Debug("Update user info", slog.String("user_id", strconv.Itoa(int(userID))))

	return s.write_storage.UpdateUserInfo(ctx, userID, username, email, phone, birth_date)
}

func (s *Service) SetCollection(
	ctx context.Context,
	userID int64,
	collectionName string,
	description string,
	categoryID int64,
	isPublic bool,
) error {
	s.log.Debug("Set collection", slog.String("user_id", strconv.Itoa(int(userID))))

	return s.write_storage.SetCollection(ctx, userID, collectionName, description, categoryID, isPublic)
}
