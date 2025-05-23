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
	Collections(ctx context.Context, userID int64) ([]models.Collection, error)
	Collection(ctx context.Context, userID, collectionID int64) (models.Collection, error)
	Category(ctx context.Context) ([]models.Category, error)
	Item(ctx context.Context, collectionID, itemID int64) (models.Item, error)
	Items(ctx context.Context, collectionID int64) ([]models.Item, error)
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
		image_url string,
		categoryID int64,
		isPublic bool,
	) (int64, error)
	UpdateCollection(
		ctx context.Context,
		userID int64,
		collectionID int64,
		collectionName string,
		description string,
		categoryID int64,
		isPublic bool,
	) error
	DeleteCollection(ctx context.Context, userID, collectionID int64) error
	CreateCategory(
		ctx context.Context,
		categoryName string,
		description string,
	) (int64, error)
	SetItem(
		ctx context.Context,
		userID int64,
		collectionID int64,
		title string,
		description string,
		category_id int64,
		country string,
		images []string,
		year string,
		attributes []string,
	) (int64, error)
	UpdateItem(
		ctx context.Context,
		userID int64,
		collectionID int64,
		itemID int64,
		title string,
		description string,
		category_id int64,
		country string,
		images []string,
		year string,
		attributes []string,
	) error
	DeleteItem(ctx context.Context, collectionID, itemID int64) error
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
	image_url string,
	categoryID int64,
	isPublic bool,
) (int64, error) {
	s.log.Debug("Set collection", slog.String("user_id", strconv.Itoa(int(userID))))

	collectionID, err := s.write_storage.SetCollection(ctx, userID, collectionName, description, image_url, categoryID, isPublic)

	return collectionID, err
}

func (s *Service) UpdateCollection(
	ctx context.Context,
	userID int64,
	collectionID int64,
	collectionName string,
	description string,
	categoryID int64,
	isPublic bool,
) error {
	s.log.Debug("Update collection", slog.String("collection_id", strconv.Itoa(int(collectionID))))

	return s.write_storage.UpdateCollection(ctx, userID, collectionID, collectionName, description, categoryID, isPublic)
}

func (s *Service) DeleteCollection(ctx context.Context, userID, collectionID int64) error {
	s.log.Debug("Delete collection", slog.String("collection_id", strconv.Itoa(int(collectionID))))

	return s.write_storage.DeleteCollection(ctx, userID, collectionID)
}

func (s *Service) Collections(ctx context.Context, userID int64) ([]models.Collection, error) {
	s.log.Debug("Get collections", slog.String("user_id", strconv.Itoa(int(userID))))

	collections, err := s.read_storage.Collections(ctx, userID)
	if err != nil {
		return nil, err
	}

	return collections, nil
}

func (s *Service) Collection(ctx context.Context, userID, collectionID int64) (models.Collection, error) {
	s.log.Debug("Get collection", slog.String("collection_id", strconv.Itoa(int(collectionID))))

	collection, err := s.read_storage.Collection(ctx, userID, collectionID)
	if err != nil {
		return models.Collection{}, err
	}

	return collection, nil
}

func (s *Service) SetItem(
	ctx context.Context,
	userID int64,
	collectionID int64,
	title string,
	description string,
	category_id int64,
	country string,
	images []string,
	year string,
	attributes []string,
) (int64, error) {
	s.log.Debug("Set item", slog.String("collection_id", strconv.Itoa(int(collectionID))))

	itemID, err := s.write_storage.SetItem(ctx, userID, collectionID, title, description, category_id, country, images, year, attributes)
	if err != nil {
		return 0, err
	}

	return itemID, nil
}

func (s *Service) UpdateItem(
	ctx context.Context,
	userID int64,
	collectionID int64,
	itemID int64,
	title string,
	description string,
	category_id int64,
	country string,
	images []string,
	year string,
	attributes []string,
) error {
	s.log.Debug("Update item", slog.String("item_id", strconv.Itoa(int(itemID))))
	return s.write_storage.UpdateItem(ctx, userID, collectionID, itemID, title, description, category_id, country, images, year, attributes)
}

func (s *Service) DeleteItem(ctx context.Context, collectionID, itemID int64) error {
	s.log.Debug("Delete item", slog.String("item_id", strconv.Itoa(int(itemID))))

	return s.write_storage.DeleteItem(ctx, collectionID, itemID)
}

func (s *Service) Item(ctx context.Context, collectionID, itemID int64) (models.Item, error) {
	s.log.Debug("Get item", slog.String("item_id", strconv.Itoa(int(itemID))))

	item, err := s.read_storage.Item(ctx, collectionID, itemID)
	if err != nil {
		return models.Item{}, err
	}

	return item, nil
}

func (s *Service) Items(ctx context.Context, collectionID int64) ([]models.Item, error) {
	s.log.Debug("Get items", slog.String("collection_id", strconv.Itoa(int(collectionID))))

	items, err := s.read_storage.Items(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) Category(ctx context.Context) ([]models.Category, error) {
	s.log.Debug("Get category")

	category, err := s.read_storage.Category(ctx)
	if err != nil {
		return []models.Category{}, err
	}

	return category, nil
}

func (s *Service) CreateCategory(
	ctx context.Context,
	categoryName string,
	description string,
) (int64, error) {
	s.log.Debug("Create category", slog.String("category_name", categoryName))

	categoryID, err := s.write_storage.CreateCategory(ctx, categoryName, description)
	if err != nil {
		return 0, err
	}

	return categoryID, nil
}
