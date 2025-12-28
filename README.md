# Full-Stack Challenge (Vue + NestJS)

A small lead-capture application with optional image upload and offline support.

- **Frontend:** Vue 3 + Vite + IndexedDB (offline draft)
- **Backend:** NestJS + MongoDB (Mongoose) + AWS S3 (presigned POST uploads)
- **Local “prod-like” run:** Docker Compose (Mongo + backend + nginx serving frontend + `/api` proxy)

---

## Live environments (Heroku)

**Prod (auto-deploy on push to `main` branch)**

- Frontend: https://vamo-leads-frontend-prod-6b0719dede8c.herokuapp.com/
- Backend: https://vamo-leads-backend-prod-bacf33104bf6.herokuapp.com/

**Dev (auto-deploy on push to `develop` branch)**

- Frontend: https://vamo-leads-frontend-dev-e5d28a8571a9.herokuapp.com/
- Backend: https://vamo-leads-backend-dev-26de9e99bc1d.herokuapp.com/

> Note: Heroku “container” apps may include a random suffix in the public URL. Always use the **Heroku “Open app”** URL for the correct domain.

---

## What the app does

### Step 1 — Lead form

Users enter:

- salutation, first name, last name
- postal code, email, phone
- privacy checkbox + optional newsletter opt-in

When submitted **online**, the backend creates a lead in MongoDB and returns:

- `leadId`
- short-lived `pictureToken` (JWT) used for picture endpoints

When submitted **offline**, the frontend stores the form as an **offline draft** in IndexedDB.

### Step 2 — Optional image upload

Images are uploaded via a secure 3-step flow:

1. **Frontend → Backend:** request presigned upload  
   `POST /leads/:id/pictures/presign` (requires `Authorization: Bearer <pictureToken>`)

2. **Frontend → S3:** upload directly (backend never receives image bytes)  
   Presigned POST upload to S3 with enforced constraints:

   - content-type
   - size limit
   - server-side encryption (AES256)
   - metadata lead id

3. **Frontend → Backend:** attach the uploaded image metadata  
   `POST /leads/:id/pictures` (requires `Authorization: Bearer <pictureToken>`)

Backend verifies the uploaded object exists (S3 `HEAD`) and matches constraints before saving metadata to MongoDB.

---

## Offline support (IndexedDB)

The frontend stores **one** offline draft (`draft/current`) in IndexedDB:

- `formData`
- `images[]` (as blobs)
- optional `leadId` + `pictureToken` (if lead was created while online)

Supported flows:

### A) Fully online

- Submit form online → lead created
- Upload images online → uploaded & attached

### B) Online form submit → offline during images

- Submit form online → lead created and `leadId/pictureToken` saved to IndexedDB
- Go offline → select images → “Save locally”
- Go online → click “Upload” → images upload using stored lead identity

### C) Offline from the start

- Submit form offline → draft saved
- Save images offline (optional)
- Go online → click “Upload” → creates lead once then uploads & attaches images

**Limitation (intentional for challenge scope):** Only one draft is stored. A second offline submission overwrites the first.

---

## Prereqs

- Node 20+
- Docker & Docker Compose
- AWS S3 bucket (private, Block Public Access)

## Local dev (without Docker)

Backend:
cd backend
cp dotenv.example .env # fill required vars
npm ci
npm run start:devFrontend:
cd frontend
cp dotenv.example .env # set VITE_API_BASE_URL
npm ci
npm run dev## Local “prod-like” (Docker Compose)
From repo root:
docker compose down --remove-orphans
docker compose build
docker compose up- Frontend: http://localhost:8080

- Backend: http://localhost:3000 (or via nginx proxy at http://localhost:8080/api)
  Env files: `backend/.env`, `frontend/.env` (see examples).

## Deploy (Heroku, example model)

- Four apps (recommended): backend-dev, frontend-dev, backend-prod, frontend-prod
- Set backend config vars per env (see backend/README)
- Build frontend with `VITE_API_BASE_URL` pointing to the matching backend URL
- Ensure CORS_ORIGIN on backend matches frontend URL(s)

## Repository structure

```text
.
├── backend/                  # NestJS API
├── frontend/                 # Vue + Vite app
├── docker-compose.yml        # local prod-like setup (nginx + backend + mongo)
└── README.md                 # this file
```
