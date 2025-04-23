package middleware

import (
	"fmt"

	"github.com/go-chi/cors"
)

func CORSconfigure(address string) *cors.Cors {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{fmt.Sprintf("http://%s", address)}, // Укажите фронтенд
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		Debug:            true,
	})

	return c
}
