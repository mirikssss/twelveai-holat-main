## Backend (Map API) – Quick Start

### Install & Run

- **Install deps**

```bash
cd backend
npm install
```

- **Dev mode (with nodemon)**

```bash
npm run dev
```

- **Prod mode**

```bash
npm start
```

Server listens on `http://localhost:4000` by default (configurable via `PORT` in `.env` at `backend/.env`).

### Data source: generated map dataset

- **Primary source**: `backend/data/generated/map-objects.json` (map-ready objects with fallbacks and image paths).
- If that file is missing or empty, the backend **builds it automatically** on first request from:
  - `backend/data/enriched-objects.json` (seed: id, name, type, coords, image),
  - **image matching**: for each object with empty `image`, looks for a photo in `backend/public/schools`, `universities`, or `medical` by fuzzy name match;
  - **deterministic fallbacks** (from id/type/name): district, address, status, summary, established, capitalRepair, water, internet, totalInspections, promiseCount.
- Status is distributed so the map looks alive: e.g. 1–2 good, 1–2 bad, 1–2 mixed, rest unverified.

### Static files (images)

- Static files are served from `backend/public`.
- Expected subfolders:
  - `backend/public/schools`
  - `backend/public/universities`
  - `backend/public/medical`
- Image matching: for each object with empty `image`, the backend looks in `public/schools`, `public/universities`, or `public/medical` by object type. It matches by **name**: normalized file name (no extension) must equal normalized object name (lowercase, no `№`, no parentheses). So put e.g. `Омегамед Центр.jpg` in `medical/`, `Школа 42.jpg` in `schools/`. After adding photos, run `npm run build:map` and restart the server (or delete `data/generated/map-objects.json` so the next API request rebuilds).

### API Endpoints

- **`GET /api/health`**

  - Simple health check.
  - Response: `{ "ok": true }`

- **`GET /api/map/objects`**

  - Returns an array of “map-ready” objects (from generated dataset): `id`, `externalId`, `name`, `type`, `coords`, `image`, `district`, `address`, `status`, `summary`, `established`, `capitalRepair`, `water`, `internet`, `totalInspections`, `promiseCount`, `categories`, `observations`. When requested with `lat`/`lng`, each object also includes `distanceMeters`.
  - **Query params:**
    - `q` – search by name (case-insensitive substring)
    - `type` – `school | university | medical | all` (default: `all`)
    - `status` – `good | mixed | bad | unverified | all` (default: `all`)
    - `lat` / `lng` – user location (numbers)
    - `radius` – radius in meters (default: `2000`)
  - **Nearby logic:**
    - if `lat`/`lng` are provided, backend:
      - computes `distanceMeters` (Haversine)
      - keeps only objects within radius
      - sorts by distance
      - adds `distanceMeters` to each object
    - if `lat`/`lng` are not provided, returns all objects without distance filtering.

- **`GET /api/map/objects/:id`**

  - Returns a single map-ready object by `id`.
  - 404 if not found.

- **`GET /api/map/meta`**

  - Returns simple meta:
  - `{ totalObjects, countsByType, countsByStatus }`

### Updating seed data

- Edit `backend/data/enriched-objects.json` (add/change objects: id, name, type, coords, image).
- To regenerate the map dataset (e.g. after adding photos to `public/`): delete `backend/data/generated/map-objects.json` and restart the server; the backend will rebuild it on first request.

### Frontend integration (Map screen – done)

- The main map page uses `GET /api/map/objects` with query params `q`, `type`, `status`, and when user location is available also `lat`, `lng`, `radius=2000`. Response is converted to `InfraObject` via `toInfraObject`; backend type `medical` is shown as `hospital` in filters. `distanceMeters` from the response is used in the carousel when present.

