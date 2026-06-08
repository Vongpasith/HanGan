# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy package configurations
COPY package*.json ./

# Install dependencies (using legacy peer deps to bypass beta peer conflicts)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the TanStack Start project
# This compiles the frontend assets and generates the Nitro server in .output/
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy output server from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Start the Nitro standalone server
CMD ["node", ".output/server/index.mjs"]
