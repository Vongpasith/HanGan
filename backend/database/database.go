package database

import (
	"fmt"
	"log"
	"os"

	"hangan/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ConnectDB connects the backend to the PostgreSQL database.
func ConnectDB() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Bangkok",
		dbHost, dbUser, dbPassword, dbName, dbPort, dbSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established successfully.")

	// Run migrations
	err = db.AutoMigrate(
		&models.Trip{},
		&models.Member{},
		&models.Expense{},
		&models.ExpenseSplit{},
	)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	log.Println("Database migration completed.")
	DB = db
}
