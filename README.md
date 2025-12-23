# Vamo Leads — Full-Stack Challenge (Vue + NestJS)

A small lead-capture application with optional image upload and offline support.

- **Frontend:** Vue 3 + Vite + IndexedDB offline draft
- **Backend:** NestJS + MongoDB (Atlas) + AWS S3 (presigned POST uploads)
- **Local “prod-like” run:** Docker Compose (Mongo + backend + nginx serving frontend + `/api` proxy)

---

## Live environments (Heroku)

**Dev**

- Frontend: <https://vamo-leads-frontend-dev-e5d28a8571a9.herokuapp.com>
- Backend: <https://vamo-leads-backend-dev-26de9e99bc1d.herokuapp.com>

**Prod**

- Frontend: https://vamo-leads-frontend-prod-6b0719dede8c.herokuapp.com
- Backend: <https://vamo-leads-backend-prod-bacf33104bf6.herokuapp.com>

> Note: Backend URLs may include a random suffix when using Heroku container apps. Always use the “Open app” URL from Heroku.

---

## What the app does

### Step 1 — Lead form

Users enter:

- salutation, first name, last name
- postal code, email, phone
- privacy checkbox + optional newsletter opt-in

Backend creates a lead in MongoDB and returns:

- `leadId`
- short-lived `pictureToken` (JWT) used for picture endpoints

### Step 2 — Optional image upload

Images are uploaded via a secure 3-step flow:

1. **Frontend → Backend:** request presigned upload  
   `POST /leads/:id/pictures/presign`

2. **Frontend → S3:** upload directly (backend never receives image bytes)  
   Presigned POST upload to S3 with enforced:

   - content-type
   - size limit
   - SSE encryption
   - metadata lead id

3. **Frontend → Backend:** attach the uploaded image metadata  
   `POST /leads/:id/pictures`

Backend verifies the uploaded object exists and matches constraints (HEAD request) before saving metadata to MongoDB.

---

## Offline support (IndexedDB)

The frontend stores **one** offline draft (`draft/current`) in IndexedDB:

- `formData`
- `images[]` (as blobs)
- optional `leadId` + `pictureToken`

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

## Repository structure

.
├── backend/ # NestJS API
├── frontend/ # Vue + Vite app
├── docker-compose.yml # local prod-like setup (nginx + backend + mongo)
└── README.md # this file

---

## Local run (Docker Compose)

### Requirements

- Docker + Docker Compose

### Start

```bash
docker compose up --build

```
