# Vamo – Lead Intake Funnel (Prototype)

Prototype of a multi-channel lead intake funnel with:

- **Frontend**: Vue.js form for capturing lead data
- **Backend**: NestJS REST API with validation + MongoDB persistence
- **CRM Forwarding**: Phase A uses a "Fake CRM" (logged + stored). Phase B can integrate HubSpot.

This is built as part of the "Experience Day" challenge. The goal is to demonstrate design + implementation decisions, not a production-ready system.

## Tech Stack

- Frontend: Vue.js (TypeScript)
- Backend: NestJS (TypeScript)
- Database: MongoDB
- Local dev: Docker Compose
- Deployment target: Heroku (Docker containers)

## Scope (Phase A)

### Frontend form fields

- salutation: "Herr" | "Frau" | "Divers"
- firstName
- lastName
- postalCode
- email
- phone

### Backend

- `POST /leads`
  - validates payload (frontend + backend)
  - stores lead in MongoDB
  - forwards lead to CRM adapter (Fake CRM for now)

## Assumptions

- The public form collects only basic contact fields + postal code, while the official Lead Creation API supports a much larger schema.
- Phase A backend API will accept the simplified form payload and store it.
- When forwarding to an external CRM / partner API, the backend will map the simplified payload to the required structure.
- Country defaults to `DE` unless otherwise specified.

## Local Development (later)

- `docker-compose up` starts: frontend, backend, mongodb

## Deployment (later)

- Deploy frontend + backend as dockerized services on Heroku.
