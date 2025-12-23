# Backend (NestJS) — Vamo Leads

NestJS API for:

- Lead creation (MongoDB via Mongoose)
- Presigned S3 uploads for pictures (presigned POST)
- Attaching pictures to a lead

---

## Tech stack

- NestJS
- MongoDB Atlas (Mongoose)
- AWS S3 (presigned POST + server-side verification)
- Env validation: Joi
- Rate limiting: @nestjs/throttler
- Input validation: class-validator

---

## Endpoints

### Health

- `GET /health`

### Lead

- `POST /leads`
  - Validates input (DTO)
  - Creates lead in MongoDB
  - Returns `{ leadId, pictureToken }`

### Pictures

- `POST /leads/:id/pictures/presign`
  - Requires `Authorization: Bearer <pictureToken>`
  - Returns S3 presigned POST: `{ url, fields, key, accessUrl }`

- `POST /leads/:id/pictures`
  - Requires `Authorization: Bearer <pictureToken>`
  - Verifies the object exists in S3 (HEAD) and matches constraints
  - Stores metadata in MongoDB
  - Forwards a signed GET URL to CRM (FAKE / Salesforce stub)

---

## Security model for picture upload

- `pictureToken` is a short-lived JWT scoped to one lead (`lead-pictures`)
- Guard validates:
  - token exists + valid
  - correct scope
  - leadId in token matches URL param

S3 server-side checks:

- content-type must match presign request
- max size limit enforced
- encryption-at-rest required (AES256)
- object must include metadata leadId matching the lead

---

## Rate limiting

Throttling is applied per IP:

- leads: limited requests per minute
- pictures: limited requests per minute

---

## Environment variables (required)

Backend validates env vars at startup (Joi). Missing/invalid values will crash the service.

### Runtime

- `NODE_ENV` = `development | production | test`
- `PORT` (optional; Heroku provides it)
- `CORS_ORIGIN` (required)
  - comma-separated allowlist, **exact origins, no trailing slash**
  - example:
    `http://localhost:5173,http://localhost:8080`

### Database

- `MONGODB_URI`

### AWS S3

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`

### Picture token

- `LEAD_PICTURE_TOKEN_SECRET`
- `LEAD_PICTURE_TOKEN_TTL` (seconds)

### CRM

- `CRM_MODE` = `FAKE` or `SALESFORCE`
- Salesforce vars required only if `CRM_MODE=SALESFORCE`:
  - `SALESFORCE_CLIENT_ID`
  - `SALESFORCE_CLIENT_SECRET`
  - `SALESFORCE_REDIRECT_URI`
  - `SALESFORCE_LOGIN_URL`

---

## Local development (without Docker)

```bash
npm ci
npm run start:dev
```
