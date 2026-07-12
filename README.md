# AssetFlow

Enterprise Asset & Resource Management System — see `docs/AssetFlow_8hr_buildplan.md`
for the full timeline, team split, and scope decisions.

## Project layout

```
AssetFlow/
├── backend/     Express + Mongoose API (port 5000)
└── frontend/    React + Vite app (port 5173)
```

## First-time setup (do this together, hour 0)

**1. Start MongoDB locally**

```bash
# Docker (recommended, fastest):
docker run -d --name assetflow-mongo -p 27017:27017 mongo:7

# OR if you have mongodb-community installed:
mongod
```

**2. Backend**

```bash
cd backend
npm install
cp .env.example .env      # defaults already point at localhost mongo
npm run seed               # creates the one bootstrap Admin account
npm run dev                 # starts on http://localhost:5000
```

Bootstrap admin login: `admin@assetflow.local` / `Admin@123` — change this before
any real use, it's only for getting into Org Setup to promote real people.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

**4. Sanity check**

- Visit `http://localhost:5000/api/health` → should return `{"status":"ok"}`
- Visit `http://localhost:5173` → should redirect to `/login`
- Sign up a new employee, log in, confirm the Dashboard loads live (zeroed) KPI cards

If all four of those work, hour 0 is done and you're both clear to branch off and build.

## What's already built vs. what's a TODO

Already wired and working end-to-end:
- Signup (Employee-only) / Login / JWT auth
- All Mongoose models for the full data model
- Dashboard KPI cards (live from DB)
- **Allocation double-allocation block** (`POST /api/allocations`) + transfer request/approve
- **Booking overlap validation** (`POST /api/bookings`)
- Maintenance approval workflow with asset status auto-flip
- Audit cycle create/checklist/discrepancy-report/close
- Role-based route guards on the frontend, role-based middleware on the backend

Every backend route above exists and is functional. What's left is mostly **frontend
forms and tables** wired to those routes — each page file under `frontend/src/pages/`
has a `TODO` comment at the top listing the exact endpoints to call. Start there.

## Git workflow

```bash
git init
git add .
git commit -m "chore: project scaffold - models, auth, allocation conflict + booking overlap logic, routing shell"
git remote add origin <your-repo-url>
git push -u origin main

# each person branches off main:
git checkout -b feature/setup-assets      # Member A
git checkout -b feature/operations        # Member B
```

Commit small and often on your own branch (every 20-40 min), then merge back into
`main` at the checkpoints in the build plan:

```bash
git add .
git commit -m "assets: add registration form with validation"
git push origin feature/setup-assets

# at a merge checkpoint:
git checkout main
git pull origin main
git merge feature/setup-assets --no-ff
git merge feature/operations --no-ff
git push origin main
```

See `docs/AssetFlow_8hr_buildplan.md` for the full hour-by-hour schedule and module split.
