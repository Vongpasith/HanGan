# --- Build Stage ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git and certificates
RUN apk update && apk add --no-cache git ca-certificates

# Copy go mod and sum files
COPY go.mod ./
COPY go.sum ./
# Since we don't have a go.sum yet, we can tidy/download dependencies
# Note: we will download directly
RUN go mod download

# Copy source code
COPY . .

# Build the Go app binary with optimization flags (remove debug info)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o main .

# --- Final Run Stage ---
FROM alpine:latest

# Install tzdata and ca-certificates
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Expose backend port
EXPOSE 8080

# Run the app
CMD ["./main"]
