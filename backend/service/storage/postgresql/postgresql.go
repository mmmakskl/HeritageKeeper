package postgresql

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
	"github.com/mmmakskl/HeritageKeeper/service/domain/models"
	"github.com/mmmakskl/HeritageKeeper/service/storage"
)

type DBstruct struct {
	Host     string
	Port     int
	User     string
	Password string
	DbName   string
	SSLMode  string
}

type Storage struct {
	db *sql.DB
}

func New(cfg DBstruct) (*Storage, error) {
	const op = "postgesql.New"

	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DbName, cfg.SSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return &Storage{db: db}, nil
}

func (s *Storage) Exists(query string) error {
	const op = "postgresql.Exists"

	var exists bool
	err := s.db.QueryRow(query).Scan(&exists)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	if !exists {
		return storage.ErrNotExists
	}

	return nil

}

// TODO: Сделать через транзакции
func (s *Storage) Register(ctx context.Context, userid int64, email string, username string) error {
	const op = "postgresql.Register"

	stmt, err := s.db.Prepare("INSERT INTO keeper.users_info (email, username, user_id, phone, birth_date) VALUES ($1, $2, $3, $4, $5);")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	birth_date := time.Time{}
	_, err = stmt.Exec(email, username, userid, "-", birth_date)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == pq.ErrorCode("23505") {
			return fmt.Errorf("%s: %w", op, storage.ErrUserExists)
		}

		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) UpdateUserInfo(
	ctx context.Context,
	userID int64,
	username string,
	email string,
	phone string,
	birth_date time.Time,
) error {
	const op = "postgresql.UpdateUserInfo"

	stmt, err := s.db.Prepare("UPDATE keeper.users_info SET username = $1, email = $2, phone = $3, birth_date = $4 WHERE user_id = $5")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(username, email, phone, birth_date, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrUserNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) Login(ctx context.Context, email string) error {
	const op = "postgresql.Login"

	stmt, err := s.db.Prepare("UPDATE keeper.users_info SET last_login = $1 WHERE email = $2")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	loginTime := time.Now()
	_, err = stmt.Exec(loginTime, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrUserNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) User(ctx context.Context, userID int64) (models.User, error) {
	const op = "postgresql.User"

	stmt, err := s.db.Prepare("SELECT user_id, username, email, phone, birth_date FROM keeper.users_info WHERE user_id = $1")
	if err != nil {
		return models.User{}, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	var user models.User
	err = stmt.QueryRow(userID).Scan(&user.UserID, &user.Username, &user.Email, &user.Phone, &user.Birth_date)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.User{}, fmt.Errorf("%s: %w", op, err)
		}
		return models.User{}, fmt.Errorf("%s: %w", op, err)
	}
	if user.Phone == "" {
		user.Phone = "-"
	}
	return user, nil
}

func (s *Storage) Users() ([]models.User, error) {
	const op = "postgresql.Users"

	rows, err := s.db.Query("SELECT user_id, username, email FROM keeper.users_info")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.UserID, &user.Username, &user.Email); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return users, nil
}

func (s *Storage) SetCollection(
	ctx context.Context,
	userID int64,
	collectionName string,
	description string,
	image_url string,
	categoryID int64,
	isPublic bool,
) (int64, error) {
	const op = "postgresql.SetCollection"
	// Проверяем, существует ли коллекция с таким именем
	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.collections WHERE name = '%s' AND user_id = %d AND description = '%s')", collectionName, userID, description)); err != nil {
		if !errors.Is(err, storage.ErrNotExists) {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrCollectionExists)
		}
	}

	stmt, err := s.db.Prepare("INSERT INTO keeper.collections (user_id, name, description, cover_image_url, category_id, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	// _, err = stmt.Exec(userID, collectionName, description, image_url, categoryID, isPublic)
	var collectionID int64
	err = stmt.QueryRow(userID, collectionName, description, image_url, categoryID, isPublic).Scan(&collectionID)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == pq.ErrorCode("23505") {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrCollectionExists)
		}

		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return collectionID, nil
}

func (s *Storage) Collection(ctx context.Context, userID, collectionID int64) (models.Collection, error) {
	const op = "postgresql.Collection"
	stmt, err := s.db.Prepare("SELECT * FROM keeper.collections WHERE id = $1 AND user_id = $2")
	if err != nil {
		return models.Collection{}, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()
	var collection models.Collection
	err = stmt.QueryRow(collectionID, userID).Scan(&collection.CollectionID, &collection.UserID, &collection.CollectionName, &collection.Description, &collection.CollectionImageUrl, &collection.CategoryID, &collection.IsPublic, &collection.CreatedAt, &collection.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Collection{}, fmt.Errorf("%s: %w", op, err)
		}
		return models.Collection{}, fmt.Errorf("%s: %w", op, err)
	}
	return collection, nil
}

func (s *Storage) Collections(ctx context.Context, userID int64) ([]models.Collection, error) {
	const op = "postgresql.Collections"

	stmt, err := s.db.Prepare("SELECT * FROM keeper.collections WHERE user_id = $1")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(userID)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()
	var collections []models.Collection
	for rows.Next() {
		var collection models.Collection
		if err := rows.Scan(&collection.CollectionID, &collection.UserID, &collection.CollectionName, &collection.Description, &collection.CollectionImageUrl, &collection.CategoryID, &collection.IsPublic, &collection.CreatedAt, &collection.UpdatedAt); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		collections = append(collections, collection)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return collections, nil
}

func (s *Storage) UpdateCollection(
	ctx context.Context,
	userID int64,
	collectionID int64,
	collectionName string,
	description string,
	categoryID int64,
	isPublic bool,
) error {
	const op = "postgresql.UpdateCollection"

	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.collections WHERE id = %d AND user_id = %d)", collectionID, userID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	stmt, err := s.db.Prepare("UPDATE keeper.collections SET name = $1, description = $2, category_id = $3, is_public = $4 WHERE id = $5 AND user_id = $6;")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(collectionName, description, categoryID, isPublic, collectionID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) DeleteCollection(ctx context.Context, userID, collectionID int64) error {
	const op = "postgresql.DeleteCollection"

	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.collections WHERE id = %d AND user_id = %d)", collectionID, userID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	stmt, err := s.db.Prepare("DELETE FROM keeper.collections WHERE id = $1 AND user_id = $2")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(collectionID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

// TODO: Продумать логику взаимодействия пользователя с предметами
func (s *Storage) SetItem(
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
	const op = "postgresql.CreateItem"

	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.collections WHERE id = %d AND user_id = %d)", collectionID, userID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.items WHERE title = '%s' AND collection_id = %d)", title, collectionID)); err != nil {
		if !errors.Is(err, storage.ErrNotExists) {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrItemExists)
		}
		// return 0, fmt.Errorf("%s: %s %w", op, "Item", storage.ErrExists)
	}

	stmt, err := s.db.Prepare("INSERT INTO keeper.items (collection_id, title, description, category_id, country, item_images_url, year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	pqImages := pq.StringArray(images)
	var itemID int64
	err = stmt.QueryRow(collectionID, title, description, category_id, country, pqImages, year).Scan(&itemID)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == pq.ErrorCode("23505") {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrItemExists)
		}
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return itemID, nil
}

func (s *Storage) UpdateItem(
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
	const op = "postgresql.UpdateItem"
	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.collections WHERE id = %d AND user_id = %d)", collectionID, userID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return fmt.Errorf("%s: %w", op, storage.ErrCollectionNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}

	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.items WHERE id = %d AND collection_id = %d)", itemID, collectionID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return fmt.Errorf("%s: %w", op, storage.ErrItemNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	stmt, err := s.db.Prepare("UPDATE keeper.items SET title = $1, description = $2, category_id = $3, country = $4, item_images_url = $5, year = $6, attributes = $7 WHERE id = $8 AND collection_id = $9")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(title, description, category_id, country, images, year, attributes, itemID, collectionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrItemNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Storage) DeleteItem(ctx context.Context, collectionID, itemID int64) error {
	const op = "postgresql.DeleteItem"
	if err := s.Exists(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM keeper.items WHERE id = %d AND collection_id = %d)", itemID, collectionID)); err != nil {
		if errors.Is(err, storage.ErrNotExists) {
			return fmt.Errorf("%s: %w", op, storage.ErrItemNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	stmt, err := s.db.Prepare("DELETE FROM keeper.items WHERE id = $1 AND collection_id = $2")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(itemID, collectionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("%s: %w", op, storage.ErrItemNotFound)
		}
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Storage) Item(ctx context.Context, collectionID, itemID int64) (models.Item, error) {
	const op = "postgresql.Item"
	stmt, err := s.db.Prepare("SELECT * FROM keeper.items WHERE collection_id = $1 AND id = $2")
	if err != nil {
		return models.Item{}, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()
	var item models.Item
	err = stmt.QueryRow(collectionID, itemID).Scan(&item.ItemID, &item.CollectionID, &item.Title, &item.Description, &item.CategoryID, &item.Country, &item.Images, &item.Year, &item.Attributes, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Item{}, fmt.Errorf("%s: %w", op, err)
		}
		return models.Item{}, fmt.Errorf("%s: %w", op, err)
	}
	return item, nil
}

func (s *Storage) Items(ctx context.Context, collectionID int64) ([]models.Item, error) {
	const op = "postgresql.Items"

	stmt, err := s.db.Prepare("SELECT * FROM keeper.items WHERE collection_id = $1")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(collectionID)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()
	var items []models.Item
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(&item.ItemID, &item.CollectionID, &item.Title, &item.Description, &item.CategoryID, &item.Country, &item.Images, &item.Year, &item.Attributes, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return items, nil
}

// TODO:
func (s *Storage) CreateCategory(
	ctx context.Context,
	categoryName string,
	description string,
) (int64, error) {
	const op = "postgresql.CreateCategory"

	stmt, err := s.db.Prepare("INSERT INTO keeper.categories (name, description) VALUES ($1, $2, $3) RETURNING category_id")
	if err != nil {
		return 0, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	var categoryID int64
	err = stmt.QueryRow(categoryName, description).Scan(&categoryID)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == pq.ErrorCode("23505") {
			return 0, fmt.Errorf("%s: %w", op, storage.ErrCategoryExists)
		}
		return 0, fmt.Errorf("%s: %w", op, err)
	}

	return categoryID, nil
}

// TODO:
func (s *Storage) Category(ctx context.Context) ([]models.Category, error) {
	const op = "postgresql.GetCategory"

	stmt, err := s.db.Prepare("SELECT * FROM keeper.categories")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		if err := rows.Scan(&category.CategoryID, &category.CategoryName, &category.Description); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		categories = append(categories, category)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return categories, nil
}
