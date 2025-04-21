package postgresql

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/mmmakskl/HeritageKeeper/service/domain/models"
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

// TODO: Query ...

// TODO: User exists / user not exists
func (s *Storage) Register(ctx context.Context, userid int64, email string) error {
	const op = "postgresql.Register"

	stmt, err := s.db.Prepare("INSERT INTO keeper.users_info (email, username, user_id, full_name) VALUES ($1, $2, $3, $4);")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(email, email, userid, "")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) UpdateUserInfo(
	ctx context.Context,
	userID int64,
	username string,
	full_name string,
	email string,
) error {
	const op = "postgresql.UpdateUserInfo"

	stmt, err := s.db.Prepare("UPDATE keeper.users_info SET username = $1, full_name = $2 WHERE email = $3")
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(username, full_name, email)
	if err != nil {
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
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (s *Storage) User(ctx context.Context, userID int64) (models.User, error) {
	const op = "postgresql.User"

	stmt, err := s.db.Prepare("SELECT user_id, username, full_name, email FROM keeper.users_info WHERE user_id = $1")
	if err != nil {
		return models.User{}, fmt.Errorf("%s: %w", op, err)
	}
	defer stmt.Close()

	var user models.User
	err = stmt.QueryRow(userID).Scan(&user.UserID, &user.Username, &user.FullName, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.User{}, fmt.Errorf("%s: %w", op, err)
		}
		return models.User{}, fmt.Errorf("%s: %w", op, err)
	}
	return user, nil
}

func (s *Storage) Users() ([]models.User, error) {
	const op = "postgresql.Users"

	rows, err := s.db.Query("SELECT user_id, username, full_name, email FROM keeper.users_info")
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.UserID, &user.Username, &user.FullName, &user.Email); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return users, nil
}
