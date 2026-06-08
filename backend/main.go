package main

import (
	"log"
	"os"

	"hangan/backend/database"
	"hangan/backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	// 1. Connect to PostgreSQL and run AutoMigrate
	database.ConnectDB()

	// 2. Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "HanGan API v1.0",
	})

	// 3. Setup CORS middleware
	app.Use(cors.New())

	// 4. Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "healthy",
			"message": "Welcome to HanGan API",
		})
	})

	// 5. Setup Router endpoints
	routes.SetupRoutes(app)

	// 6. Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting HanGan API server on port %s...", port)
	log.Fatal(app.Listen(":" + port))
}
