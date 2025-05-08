package storage

import "errors"

var (
	ErrUserExists         = errors.New("user already exists")
	ErrUserNotFound       = errors.New("user not found")
	ErrCollectionExists   = errors.New("collection already exists")
	ErrCollectionNotFound = errors.New("collection not found")
	ErrCategoryExists     = errors.New("category already exists")
	ErrCategoryNotFound   = errors.New("category not found")
	ErrItemExists         = errors.New("item already exists")
	ErrItemNotFound       = errors.New("item not found")
	ErrNotExists          = errors.New("not exists")
)
