package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"hangan/backend/database"
	"hangan/backend/models"
	"hangan/backend/utils"

	"github.com/gofiber/fiber/v2"
)

// GenerateRandomID creates a hex-encoded secure random string.
func GenerateRandomID(bytes int) string {
	b := make([]byte, bytes)
	_, err := rand.Read(b)
	if err != nil {
		return "fallback-id"
	}
	return hex.EncodeToString(b)
}

// CreateTripRequest defines payload structure for creating a trip.
type CreateTripRequest struct {
	Title   string   `json:"title"`
	Members []string `json:"members"` // Optional initial list of names
}

// CreateTrip handles HTTP POST requests to create a new Trip.
func CreateTrip(c *fiber.Ctx) error {
	var req CreateTripRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Trip title is required"})
	}

	tripID := GenerateRandomID(8) // 16-character unique string

	trip := models.Trip{
		ID:    tripID,
		Title: req.Title,
	}

	tx := database.DB.Begin()

	if err := tx.Create(&trip).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create trip"})
	}

	// Create initial members if provided
	var createdMembers []models.Member
	for _, name := range req.Members {
		if name == "" {
			continue
		}
		m := models.Member{
			ID:     GenerateRandomID(8),
			TripID: trip.ID,
			Name:   name,
		}
		if err := tx.Create(&m).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create trip members"})
		}
		createdMembers = append(createdMembers, m)
	}

	tx.Commit()
	trip.Members = createdMembers

	return c.Status(fiber.StatusCreated).JSON(trip)
}

// GetTrip preloads all members, expenses, and splits for a single trip.
func GetTrip(c *fiber.Ctx) error {
	tripID := c.Params("id")
	var trip models.Trip

	// Preload all relational data
	err := database.DB.Preload("Members").Preload("Expenses.PaidBy").Preload("Expenses.Splits.Member").First(&trip, "id = ?", tripID).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Trip not found"})
	}

	return c.JSON(trip)
}

// AddMemberRequest defines payload for adding a member.
type AddMemberRequest struct {
	Name string `json:"name"`
}

// AddMember adds a new member/friend to a trip.
func AddMember(c *fiber.Ctx) error {
	tripID := c.Params("id")
	var req AddMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Member name is required"})
	}

	// Verify trip exists
	var count int64
	database.DB.Model(&models.Trip{}).Where("id = ?", tripID).Count(&count)
	if count == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Trip not found"})
	}

	member := models.Member{
		ID:     GenerateRandomID(8),
		TripID: tripID,
		Name:   req.Name,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add member"})
	}

	return c.Status(fiber.StatusCreated).JSON(member)
}

// SplitRequest defines how an expense is split among participants.
type SplitRequest struct {
	MemberID string  `json:"member_id"`
	Amount   float64 `json:"amount"`
}

// CreateExpenseRequest defines the payload structure for adding an expense.
type CreateExpenseRequest struct {
	PaidByID    string         `json:"paid_by_id"`
	Amount      float64        `json:"amount"`
	Description string         `json:"description"`
	Splits      []SplitRequest `json:"splits"`
}

// CreateExpense creates a single bill and record its breakdown.
func CreateExpense(c *fiber.Ctx) error {
	tripID := c.Params("id")
	var req CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if req.PaidByID == "" || req.Amount <= 0 || req.Description == "" || len(req.Splits) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing or invalid required expense fields"})
	}

	// Verify all splits sum up to the total expense amount (within safety limits)
	var splitSum float64
	for _, split := range req.Splits {
		splitSum += split.Amount
	}

	// Compare with threshold of 0.05 to account for minor roundings
	if splitSum < req.Amount-0.05 || splitSum > req.Amount+0.05 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Splits sum (%.2f) must match total expense amount (%.2f)", splitSum, req.Amount),
		})
	}

	tx := database.DB.Begin()

	expense := models.Expense{
		ID:          GenerateRandomID(8),
		TripID:      tripID,
		PaidByID:    req.PaidByID,
		Amount:      req.Amount,
		Description: req.Description,
	}

	if err := tx.Create(&expense).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create expense"})
	}

	var createdSplits []models.ExpenseSplit
	for _, splitReq := range req.Splits {
		s := models.ExpenseSplit{
			ID:        GenerateRandomID(8),
			ExpenseID: expense.ID,
			MemberID:  splitReq.MemberID,
			Amount:    splitReq.Amount,
		}
		if err := tx.Create(&s).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create expense splits"})
		}
		createdSplits = append(createdSplits, s)
	}

	tx.Commit()
	expense.Splits = createdSplits

	return c.Status(fiber.StatusCreated).JSON(expense)
}

// GetSettlement computes the simplified transaction path for the trip.
func GetSettlement(c *fiber.Ctx) error {
	tripID := c.Params("id")

	// 1. Fetch all members of the trip
	var members []models.Member
	if err := database.DB.Where("trip_id = ?", tripID).Find(&members).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve members"})
	}

	// 2. Fetch all expenses with their splits
	var expenses []models.Expense
	if err := database.DB.Preload("Splits").Where("trip_id = ?", tripID).Find(&expenses).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve expenses"})
	}

	// 3. Compute simplified debts
	settlements := utils.SimplifyDebts(members, expenses)

	return c.JSON(fiber.Map{
		"trip_id":      tripID,
		"transactions": settlements,
	})
}
