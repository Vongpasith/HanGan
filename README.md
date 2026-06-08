# 💸 HanGan (หารกัน) — Trip Bill Splitter

[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Fiber](https://img.shields.io/badge/Fiber-0091FF?style=for-the-badge&logo=gofiber&logoColor=white)](https://gofiber.io/)
[![GORM](https://img.shields.io/badge/GORM-33A6FF?style=for-the-badge)](https://gorm.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**HanGan (หารกัน)** is a production-ready, zero-authentication web application designed to simplify trip expense splits among friends. With **zero setup** required for users, friends can jump in, list expenses, customize how bills are split, and compute the most optimal way to settle debts using an intelligent minimization algorithm.

Designed with modern full-stack development best practices to serve as a high-quality portfolio piece.

---

## ✨ Features

- 👤 **Zero Authentication (No Auth)**: Users can create a trip instantly. The trip's access is secured by a randomized, unguessable UUID.
- 🍕 **Unequal Splits**: Support for splitting bills unevenly (e.g., Alice pays 100, but Bob only owes 30, and Charlie owes 70).
- 🧠 **Debt Simplification**: An optimized greedy algorithm runs on the Go backend to compute the absolute minimum transaction path for settling up (reducing overall bank transfer tasks).
- 🐳 **Production Docker Configurations**: Optimized multi-stage builds for both Next.js and Go services for minimal deployment footprints.

---

## 📂 Project Directory Structure

```text
HanGan/
├── backend/                   # Golang Backend API
│   ├── models/                # GORM Database Models (Trip, Member, Expense, ExpenseSplit)
│   ├── utils/                 # Utility helpers (Debt Simplifier Algorithm & Tests)
│   ├── Dockerfile             # Multi-stage Docker deployment build file
│   ├── main.go                # API entrypoint (Fiber Framework)
│   └── go.mod                 # Go dependencies
├── frontend/                  # Next.js Frontend Web App
│   ├── src/app/               # App router layout and home view
│   ├── next.config.mjs        # Next.js stand-alone output configuration
│   ├── package.json           # Frontend dependencies
│   └── Dockerfile             # Standalone production container config
├── docker-compose.yml         # Dev/Prod orchestrator (Postgres + Backend + Frontend)
├── git-commands.md            # Helper git command sequence guide
└── README.md                  # Beautiful Project Portfolio Hub
```

---

## ⚡ Quick Start (Run with 1 Command)

Ensure you have [Docker & Docker Compose](https://www.docker.com/) installed, then run the entire stack with:

```bash
docker compose up --build
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Database (PostgreSQL)**: Port `5432`

---

## 🧪 Testing the Debt Solver

To run the unit tests written for the Debt Simplifier algorithm:

```bash
cd backend && go test ./utils/... -v
```

---

## 🛠️ Architecture Details

### 1. Database Schema (GORM Models)
- **Trips**: Holds the trip's unique string ID/UUID and name.
- **Members**: Associated with a single Trip ID.
- **Expenses**: Keeps track of the payer, original transaction cost, description, and timestamp.
- **ExpenseSplits**: Enables unequal distributions by binding a specific member to a specific expense and recording exactly how much they owe.

### 2. Debt Solver Algorithm (Greedy Approach)
The simplification helper uses a **greedy selection method** to process debts:
- Calculates the total net balance of each user (`Paid Amount - Owning Amount`).
- Segregates people into positive balance holders (**Creditors**) and negative balance holders (**Debtors**).
- Successively pair-matches the largest debtor with the largest creditor to resolve balances. This reduces the number of payments to $N-1$ where $N$ is the number of participants.
