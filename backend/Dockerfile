# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (incl dev deps for building)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install ONLY production deps
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled output only
COPY --from=build /app/dist ./dist

# Optional: run as non-root (nice-to-have)
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/main.js"]
