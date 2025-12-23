# Backend (NestJS) – Vamo Leads

NestJS API for:

- Lead creation (MongoDB)
- Presigned S3 uploads for pictures
- Attaching pictures to a lead

---

## Tech stack

- NestJS
- MongoDB (Mongoose)
- AWS S3 (presigned POST upload)
- Environment validation with Joi

---

## Key endpoints

### Health

- `GET /health`

### Lead

- `POST /leads`
  - Creates a lead
  - Returns `leadId` and `pictureToken`

### Pictures

- `POST /leads/:leadId/pictures/presign`
  - Returns S3 presigned POST (`url`, `fields`, `key`)
- `POST /leads/:leadId/pictures`
  - Attaches picture metadata to the lead after upload

> Note: When running with the Docker/nginx frontend, `/api/*` is proxied to the backend.
> Example: frontend calls `POST /api/leads` → backend receives `POST /leads`.

---

## Environment variables (REQUIRED)

The backend validates env vars at startup (Joi).
**Missing or invalid values will crash the service.**

### Runtime / App

- `NODE_ENV` (development|production|test)
- `PORT` (optional; Heroku provides this automatically)
- `CORS_ORIGIN`
  - Comma-separated list of allowed frontend URLs
  - Example:
    ```
    http://localhost:5173,http://localhost:8080
    ```

### Database

- `MONGODB_URI`
  - Local docker: `mongodb://mongo:27017/vamo`
  - Heroku: MongoDB Atlas connection string

### AWS S3 (required for image uploads)

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`

### Picture token (required)

- `LEAD_PICTURE_TOKEN_SECRET`
- `LEAD_PICTURE_TOKEN_TTL`
  - Number (seconds)
  - Example: `3600`

### CRM (challenge scope)

- `CRM_MODE` = `FAKE` or `SALESFORCE`
  - Default: `FAKE`
- Salesforce values required **only if** `CRM_MODE=SALESFORCE`:
  - `SALESFORCE_CLIENT_ID`
  - `SALESFORCE_CLIENT_SECRET`
  - `SALESFORCE_REDIRECT_URI`
  - `SALESFORCE_LOGIN_URL`

---

## Heroku deployment notes

You will run **two backend apps**:

- `vamo-leads-backend-dev`
- `vamo-leads-backend-prod`

For each backend app, you must set **all required env vars** in the Heroku dashboard.

`CORS_ORIGIN` must match the corresponding frontend app:

- Dev backend → frontend-dev URL
- Prod backend → frontend-prod URL

---

## Local development (without Docker)

```bash
npm ci
npm run start:dev
```
