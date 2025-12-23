# Frontend (Vue + Vite) – Vamo Leads

Vue application with:

- Lead form submission
- Optional image upload
- Offline support using IndexedDB (single draft)

---

## What the UI does

### Step 1: Form

- Validates required fields
- Submits the lead online (or stores it offline if no internet)

### Step 2: Images (optional)

- User can upload images online
- If offline, images are stored locally and can be uploaded later

---

## Offline behavior (IndexedDB)

The app stores a **single draft** in IndexedDB:

- `formData`
- `images[]`
- optional `leadId` + `pictureToken` (when lead was created online)

Supported flows:

1. Online → submit form → upload images online
2. Online form submit → go offline → save images locally → go online → click upload
3. Offline from start → submit form offline → save images locally → go online → click upload (creates lead then uploads)

**Limitation:** Only one draft exists. A second offline submit overwrites the first.

---

## Environment variable

### `VITE_API_BASE_URL`

Controls where the frontend sends API requests.
This is **build-time** (Vite).

### Local dev (no nginx)

```env
VITE_API_BASE_URL=http://localhost:3000
```

```

```
