# Frontend (Vue 3 + Vite) — Vamo Leads

A high-performance lead intake application focused on reliability, offline resilience, and containerized deployment.

## 🚀 Tech Stack
- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **State & Storage:** Reactive state + IndexedDB (for offline persistence)
- **Web Server:** Nginx (configured for SPA routing and reverse proxying)
- **Deployment:** Dockerized, deployed via GitHub Actions to Heroku Container Registry

---

## 🛠 Features & UI Logic

### Step 1: Lead Form
- **Real-time Validation:** Client-side validation for required fields and formatting.
- **Online Flow:** Sends the lead to the NestJS API; receives a `leadId` and a `pictureToken` for secure image uploading.
- **Offline Flow:** Detects network failure and automatically persists the form to **IndexedDB** as a draft.

### Step 2: Images (Optional)
- **Secure Uploads:** Uses **AWS S3 Presigned POST** URLs. Images are sent directly from the browser to S3, reducing load on the backend server.
- **Metadata Sync:** After a successful S3 upload, the app notifies the backend to attach the image metadata to the lead.
- **Offline Images:** Stores images as **Blobs** in IndexedDB, allowing users to capture leads in "dead zones" and upload them later when back online.

---

## 📶 Offline Behavior (IndexedDB)

The app maintains a **single robust draft** in the browser's IndexedDB:
- **Stored Data:** `formData`, `images[]` (Binary Blobs), and optional `leadId`/`pictureToken` (if the lead was already created online).
- **Supported Flows:**
  1. **Online Start:** Submit form → upload images directly.
  2. **Partial Offline:** Online form submit → lose connection → save images locally → regain connection → upload.
  3. **Full Offline:** Save form + images locally → regain connection → creates lead then uploads everything.
- **Constraints:** - **Single Draft:** Only one draft exists; a second offline submission overwrites the first.
  - **20MB Cap:** Prevents excessive browser storage usage across stored image blobs.

---

## 🌍 Environment Variables (Build-time)

### `VITE_API_BASE_URL`

Controls where the frontend sends API requests. This value is **baked into the JavaScript bundle** during the build process (Build-time).

| Environment | Value / Source | Description |
| :--- | :--- | :--- |
| **Local (Direct)** | `http://localhost:3000` | Used when running `npm run dev` directly on your Mac. |
| **Local Docker** | `/api` | Used in `.env`. Nginx handles the proxy to the `backend` container. |
| **Heroku (Dev/Prod)** | `https://<your-backend>.herokuapp.com` | **Injected via GitHub Actions** using the `--arg` flag in `ci-cd.yml`. Do not set manually in Heroku Config Vars. |

---

## 🐳 Nginx Role

This project uses **Nginx** for two critical functions:
1. **SPA Routing:** Uses the `try_files` directive to support Vue's History Mode (preventing 404s on page refresh).
2. **Reverse Proxy (Local):** In the Docker Compose environment, Nginx proxies `/api` requests to the internal backend service to avoid CORS issues.

---

## 💻 Local Development

```bash
# Install dependencies
npm ci

# Run Vite Dev Server (Direct Mac access)
npm run dev

# Run Full Stack with Docker
# (Run from project root)
docker-compose up --build