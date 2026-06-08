package routes

import (
	"hangan/backend/controllers"

	"github.com/gofiber/fiber/v2"
)

// SetupRoutes registers all HTTP API routes on the Fiber application instance.
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Trip resource endpoints
	api.Post("/trips", controllers.CreateTrip)
	api.Get("/trips/:id", controllers.GetTrip)

	// Member resources nested under trip
	api.Post("/trips/:id/members", controllers.AddMember)

	// Expense resources nested under trip
	api.Post("/trips/:id/expenses", controllers.CreateExpense)

	// Settlement endpoint nested under trip
	api.Get("/trips/:id/settlement", controllers.GetSettlement)
}
