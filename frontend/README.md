````md
# Frontend (Vue + Vite) — Vamo Leads

Vue application with:

- lead form submission
- optional image upload
- offline support using IndexedDB (single draft)

---

## What the UI does

### Step 1: Lead Form

- Validates required fields
- If online: sends the lead to backend and receives `leadId + pictureToken`
- If offline: stores the form in IndexedDB as a draft

### Step 2: Images (optional)

- Online: uploads images to S3 (via presigned POST) then attaches metadata via backend
- Offline: stores images locally (IndexedDB) and can upload later when online

---

## Offline behavior (IndexedDB)

The app stores a **single draft** in IndexedDB:

- `formData`
- `images[]` (blobs)
- optional `leadId` + `pictureToken` (if lead was created online)

Supported flows:

1. Online → submit form → upload images online
2. Online form submit → go offline → save images locally → go online → upload
3. Offline start → save form + images locally → go online → upload (creates lead then uploads)

**Limitation:** Only one draft exists. A second offline submit overwrites the first.

Offline size cap: **20MB total** (across stored images).

---

## Environment variable (build-time)

### `VITE_API_BASE_URL`

Controls where the frontend sends API requests.
This is **build-time** for Vite (baked into the JS bundle).

Examples:

- Local (direct to backend):
  `VITE_API_BASE_URL=http://localhost:3000`

- Local Docker (nginx proxies `/api` to backend):
  `VITE_API_BASE_URL=/api`

- Heroku:
  set in `.env.production` to the backend URL, e.g.
  `VITE_API_BASE_URL=https://<backend-heroku-domain>`

---

## Local development

```bash
npm ci
npm run dev
```
````
