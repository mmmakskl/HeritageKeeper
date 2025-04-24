package models

import "time"

// TODO: Добавть рядом структуры коллекций и лотов
// TODO: Изменить элементы
type User struct {
	UserID     int64         `json:"id"`
	Username   string        `json:"username"`
	Email      string        `json:"email"`
	Phone      string        `json:"phone"`
	Birth_date time.Time     `json:"birth_date"`
	CreatedAt  time.Duration `json:"created_at"`
	LastLogin  time.Duration `json:"updated_at"`
	ImageUrl   string        `json:"profile_image_url"`
	IsActive   bool          `json:"is_active"`
	IsBlocked  bool          `json:"is_blocked"`
}
