package models

import "time"

type User struct {
	UserID    int64         `json:"id"`
	Username  string        `json:"username"`
	FullName  string        `json:"full_name"`
	Email     string        `json:"email"`
	CreatedAt time.Duration `json:"created_at"`
	LastLogin time.Duration `json:"updated_at"`
	ImageUrl  string        `json:"image_url"`
	IsActive  bool          `json:"is_active"`
	IsBlocked bool          `json:"is_blocked"`
}
