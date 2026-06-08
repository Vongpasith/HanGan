package models

import (
	"time"
)

// Trip represents a shared trip among friends.
// We use a custom string ID (like a UUID) to prevent ID scanning/enumeration.
type Trip struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Title     string    `gorm:"type:varchar(100);not null" json:"title"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	Members   []Member  `gorm:"constraint:OnDelete:CASCADE;" json:"members,omitempty"`
	Expenses  []Expense `gorm:"constraint:OnDelete:CASCADE;" json:"expenses,omitempty"`
}

// Member represents a participant in a trip.
type Member struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	TripID    string    `gorm:"type:varchar(36);not null;index" json:"trip_id"`
	Name      string    `gorm:"type:varchar(50);not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// Expense represents a single transaction or bill paid during the trip.
type Expense struct {
	ID          string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	TripID      string         `gorm:"type:varchar(36);not null;index" json:"trip_id"`
	PaidByID    string         `gorm:"type:varchar(36);not null;index" json:"paid_by_id"`
	PaidBy      *Member        `gorm:"foreignKey:PaidByID" json:"paid_by,omitempty"`
	Amount      float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	Description string         `gorm:"type:varchar(255);not null" json:"description"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"created_at"`
	Splits      []ExpenseSplit `gorm:"constraint:OnDelete:CASCADE;" json:"splits,omitempty"`
}

// ExpenseSplit maps how much a specific member owes for a given expense.
// This supports unequal split amounts (e.g., A owes 100, B owes 50).
type ExpenseSplit struct {
	ID        string  `gorm:"primaryKey;type:varchar(36)" json:"id"`
	ExpenseID string  `gorm:"type:varchar(36);not null;index" json:"expense_id"`
	MemberID  string  `gorm:"type:varchar(36);not null;index" json:"member_id"`
	Member    *Member `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Amount    float64 `gorm:"type:decimal(12,2);not null" json:"amount"` // The share this member owes
}
