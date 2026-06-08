package utils

import (
	"testing"

	"hangan/backend/models"
)

func TestSimplifyDebts_BasicEqualSplit(t *testing.T) {
	// A, B, C are members
	members := []models.Member{
		{ID: "A", Name: "Alice"},
		{ID: "B", Name: "Bob"},
		{ID: "C", Name: "Charlie"},
	}

	// Alice paid 300. Alice, Bob, and Charlie split it equally (100 each).
	expenses := []models.Expense{
		{
			ID:       "E1",
			PaidByID: "A",
			Amount:   300,
			Splits: []models.ExpenseSplit{
				{ExpenseID: "E1", MemberID: "A", Amount: 100},
				{ExpenseID: "E1", MemberID: "B", Amount: 100},
				{ExpenseID: "E1", MemberID: "C", Amount: 100},
			},
		},
	}

	txs := SimplifyDebts(members, expenses)

	if len(txs) != 2 {
		t.Fatalf("Expected 2 transactions, got %d", len(txs))
	}

	// Expected transactions:
	// Bob pays Alice 100
	// Charlie pays Alice 100
	for _, tx := range txs {
		if tx.ToMemberID != "A" {
			t.Errorf("Expected recipient to be Alice (A), got %s", tx.ToMemberID)
		}
		if tx.Amount != 100.0 {
			t.Errorf("Expected amount to be 100, got %f", tx.Amount)
		}
		if tx.FromMemberID != "B" && tx.FromMemberID != "C" {
			t.Errorf("Expected sender to be B or C, got %s", tx.FromMemberID)
		}
	}
}

func TestSimplifyDebts_MultipleExpenses(t *testing.T) {
	members := []models.Member{
		{ID: "A", Name: "Alice"},
		{ID: "B", Name: "Bob"},
		{ID: "C", Name: "Charlie"},
	}

	// Expense 1: Alice paid 90, split equally (30 each).
	// Net: Alice +60, Bob -30, Charlie -30
	// Expense 2: Bob paid 60, split equally (20 each).
	// Net change: Alice -20, Bob +40, Charlie -20
	// Total Net: Alice +40, Bob +10, Charlie -50
	expenses := []models.Expense{
		{
			ID:       "E1",
			PaidByID: "A",
			Amount:   90,
			Splits: []models.ExpenseSplit{
				{ExpenseID: "E1", MemberID: "A", Amount: 30},
				{ExpenseID: "E1", MemberID: "B", Amount: 30},
				{ExpenseID: "E1", MemberID: "C", Amount: 30},
			},
		},
		{
			ID:       "E2",
			PaidByID: "B",
			Amount:   60,
			Splits: []models.ExpenseSplit{
				{ExpenseID: "E2", MemberID: "A", Amount: 20},
				{ExpenseID: "E2", MemberID: "B", Amount: 20},
				{ExpenseID: "E2", MemberID: "C", Amount: 20},
			},
		},
	}

	txs := SimplifyDebts(members, expenses)

	// Expected:
	// Charlie pays Alice 40
	// Charlie pays Bob 10
	if len(txs) != 2 {
		t.Fatalf("Expected 2 transactions, got %d", len(txs))
	}

	hasAliceTx := false
	hasBobTx := false

	for _, tx := range txs {
		if tx.FromMemberID != "C" {
			t.Errorf("Expected sender to be Charlie (C), got %s", tx.FromMemberID)
		}
		if tx.ToMemberID == "A" {
			hasAliceTx = true
			if tx.Amount != 40.0 {
				t.Errorf("Expected Charlie to pay Alice 40, got %f", tx.Amount)
			}
		} else if tx.ToMemberID == "B" {
			hasBobTx = true
			if tx.Amount != 10.0 {
				t.Errorf("Expected Charlie to pay Bob 10, got %f", tx.Amount)
			}
		} else {
			t.Errorf("Unexpected recipient: %s", tx.ToMemberID)
		}
	}

	if !hasAliceTx || !hasBobTx {
		t.Errorf("Did not find expected transactions. Alice: %t, Bob: %t", hasAliceTx, hasBobTx)
	}
}
