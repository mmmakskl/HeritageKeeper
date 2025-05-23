package main

import (
	"errors"
	"flag"
	"fmt"

	"github.com/golang-migrate/migrate/v4"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	var storagePath, migratoionsPath, migratoionsTable string

	flag.StringVar(&storagePath, "storage-path", "", "Path to the storage directory")
	flag.StringVar(&migratoionsPath, "migrations-path", "", "Path to the migrations directory")
	flag.StringVar(&migratoionsTable, "migrations-table", "", "Name of the migrations table")
	flag.Parse()

	if storagePath == "" {
		panic("storage-path is required")
	}
	if migratoionsPath == "" {
		panic("migrations-path is required")
	}

	m, err := migrate.New(
		"file://"+migratoionsPath,
		fmt.Sprintf("postgres://admin:12345678@localhost:5432/OSS_Keeper?sslmode=disable&search_path=%s", storagePath),
	)
	if err != nil {
		panic(err)
	}

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			fmt.Println("No new migrations to apply")

			return
		}

		panic(err)
	}
}
