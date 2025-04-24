package models

type Item struct {
	ItemID       int64    `json:"id"`
	CollectionID int64    `json:"collection_id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	CategoryID   int64    `json:"category_id"`
	Country      string   `json:"country"`
	Year         string   `json:"year"`
	Attributes   []string `json:"attributes"`
	Images       []string `json:"item_images_url"`
	CreatedAt    string   `json:"created_at"`
	UpdatedAt    string   `json:"updated_at"`
}
