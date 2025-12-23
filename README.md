# Vamo Leads – Full-Stack Challenge

This repo contains a small lead-capture application with optional image upload.

- **Frontend**: Vue + Vite (offline-capable)
- **Backend**: NestJS + MongoDB + AWS S3 (presigned uploads)
- **Local “prod-like” run**: Docker Compose (nginx serves frontend + proxies `/api` → backend)

---

## What the app does

### 1) Lead submission (Form step)

Users enter:

- salutation, first name, last name
- postal code, email, phone
- privacy checkbox + optional newsletter opt-in

When submitted **online**, the backend creates a Lead in MongoDB.

When submitted **offline**, the frontend stores the form as an **offline draft** in IndexedDB.

### 2) Optional image upload (Images step)

Images are uploaded using:

1. Backend returns **S3 presigned POST** (no image file goes through backend).
2. Frontend uploads file directly to S3 using the presigned POST.
3. Frontend calls backend to **attach** the uploaded file metadata to the Lead.

---

## Offline support (Frontend)

The frontend stores a **single** offline draft in IndexedDB:

- It includes `formData`
- It can include `images[]`
- It can include `leadId` + `pictureToken` (if the lead was created while online)

Supported flows:

### Flow A — Fully online

- Submit form online → lead is created
- Upload images online → images are uploaded/attached

### Flow B — Online form submit, offline during images

- Submit form online → lead is created and **leadId/pictureToken are saved in IndexedDB**
- Go offline → save images locally
- Go online → click “Bilder hochladen” → uploads saved images using stored lead identity

### Flow C — Offline from the beginning

- Submit form offline → draft saved locally
- Save images locally (optional)
- Go online → click “Bilder hochladen” → creates lead once, then uploads/attaches images

**Important limitation:** Only **one** offline draft is stored (`draft/current`). A second offline submission overwrites the first. This is intentional for the challenge scope.

---

## Deployment model (Heroku)

This project is designed to run as **four Heroku apps**:

### Development environment

- `vamo-leads-backend-dev`
- `vamo-leads-frontend-dev`

### Production environment

- `vamo-leads-backend-prod`
- `vamo-leads-frontend-prod`

Reasons:

- Clean separation between dev and prod
- Safer testing without affecting production
- Clear demonstration of real-world deployment practices

Each frontend app communicates with its matching backend app via environment configuration.

---

## Repository structure

```text
.
├── backend/                 # NestJS API
├── frontend/                # Vue + Vite app
├── docker-compose.yml        # local prod-like setup (nginx + backend + mongo)
└── README.md                 # this file
```
