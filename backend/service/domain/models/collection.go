package models

type Collection struct {
	CollectionID       int64  `json:"id"`
	UserID             int64  `json:"user_id"`
	CollectionName     string `json:"name"`
	Description        string `json:"description"`
	CollectionImageUrl string `json:"cover_image_url"`
	CategoryID         int64  `json:"category_id"`
	IsPublic           bool   `json:"is_public"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
}

type Category struct {
	CategoryID   int64  `json:"id"`
	CategoryName string `json:"name"`
	Description  string `json:"description"`
}
