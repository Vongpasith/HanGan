package utils

import (
	"math"
	"sort"

	"hangan/backend/models"
)

// Transaction represents a payment transfer from one member to another to settle debts.
type Transaction struct {
	FromMemberID string  `json:"from_member_id"`
	ToMemberID   string  `json:"to_member_id"`
	Amount       float64 `json:"amount"`
}

// BalanceEntry is a helper struct for sorting members by their net balance.
type BalanceEntry struct {
	MemberID string
	Balance  float64
}

// SimplifyDebts calculates the net balance for each member of a trip
// and returns a minimized list of transactions using a Greedy approach.
func SimplifyDebts(members []models.Member, expenses []models.Expense) []Transaction {
	// 1. Initialize balances map for all members to 0
	balances := make(map[string]float64)
	for _, m := range members {
		balances[m.ID] = 0.0
	}

	// 2. Compute net balances from expenses and their splits
	for _, exp := range expenses {
		// The person who paid gets credited the full expense amount
		balances[exp.PaidByID] += exp.Amount

		// Each participant in the split owes their split amount (negative balance)
		for _, split := range exp.Splits {
			balances[split.MemberID] -= split.Amount
		}
	}

	// 3. Separate members into debtors (owe money < 0) and creditors (owed money > 0)
	var debtors []BalanceEntry
	var creditors []BalanceEntry
	const epsilon = 0.01 // Ignore tiny fractional cents differences

	for mID, bal := range balances {
		// Round to 2 decimal places to avoid floating point precision issues
		bal = math.Round(bal*100) / 100
		if bal < -epsilon {
			// Save debtor balance as absolute value for easier comparison
			debtors = append(debtors, BalanceEntry{MemberID: mID, Balance: -bal})
		} else if bal > epsilon {
			creditors = append(creditors, BalanceEntry{MemberID: mID, Balance: bal})
		}
	}

	// Sort debtors and creditors descending by amount
	sortBalancesDesc(debtors)
	sortBalancesDesc(creditors)

	var transactions []Transaction

	// 4. Greedy match debtors and creditors
	i, j := 0, 0
	for i < len(debtors) && j < len(creditors) {
		debtor := &debtors[i]
		creditor := &creditors[j]

		// Find minimum transfer amount
		amountToTransfer := debtor.Balance
		if creditor.Balance < amountToTransfer {
			amountToTransfer = creditor.Balance
		}

		// Round to 2 decimal places
		amountToTransfer = math.Round(amountToTransfer*100) / 100

		if amountToTransfer > 0 {
			transactions = append(transactions, Transaction{
				FromMemberID: debtor.MemberID,
				ToMemberID:   creditor.MemberID,
				Amount:       amountToTransfer,
			})
		}

		// Deduct the transferred amount
		debtor.Balance -= amountToTransfer
		creditor.Balance -= amountToTransfer

		// Advance index if balance is settled
		if debtor.Balance <= epsilon {
			i++
		}
		if creditor.Balance <= epsilon {
			j++
		}
	}

	return transactions
}

// sortBalancesDesc sorts a slice of BalanceEntry in descending order of Balance
func sortBalancesDesc(entries []BalanceEntry) {
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Balance > entries[j].Balance
	})
}
