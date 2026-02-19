# Villa Checklist App

Mobile-friendly app for staff to run inventory checks per villa. Data is stored in Google Sheets (Inventory Checklist).

## Ports

- **Frontend:** http://localhost:5173 (Vite)
- **Backend:** http://localhost:3002 (Node) — use 3002 to avoid clashing with other apps on 3000/3001

## Prerequisites

1. **Google Cloud:** Create a project, enable Google Sheets API, create a service account, download its JSON key. Share your Google Sheet (“Inventory Checklist”) with the service account email (e.g. `xxx@xxx.iam.gserviceaccount.com`) as **Editor**.
2. **Sheets:** Villas, Inventory, Check_Log, Check_Runs, Staff with the column names from the plan.

## Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set SHEET_ID and either GOOGLE_APPLICATION_CREDENTIALS (path to JSON) or GOOGLE_SERVICE_ACCOUNT_JSON (paste JSON string)
# Place villa-checklist-key.json in backend/ if using file path
npm install
npm start
```

Runs on http://localhost:3002. Health: http://localhost:3002/health

## Frontend

```bash
cd frontend
cp .env.example .env
# .env: VITE_API_URL=http://localhost:3002
npm install
npm run dev
```

Open http://localhost:5173. Log in with a Staff row (login + password), select a villa, complete the checklist, submit.

## Deploy

- **Frontend:** Build with `npm run build` in frontend, deploy `dist/` to Vercel or Netlify. Set env `VITE_API_URL` to your backend URL.
- **Backend:** Deploy to Railway or Render. Set `PORT`, `SHEET_ID`, and `GOOGLE_SERVICE_ACCOUNT_JSON` (paste full JSON). Allow CORS for your frontend origin.
