# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time inputs
ARG VITE_MODE=production
ARG VITE_API_BASE_URL

# Make Vite see it during build (VITE_* is exposed)
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build -- --mode $VITE_MODE

# ---- runtime stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.heroku.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
