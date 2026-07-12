# AssetFlow — 8-Hour Build Plan (2-Person Team)

## Reality check first

The problem statement describes a 10-screen ERP with 4 roles and 6 workflows. That's a
multi-week build. In 8 hours with 2 people, you cannot build all of it well — trying to
will get you 10 broken screens instead of 5 working ones. This plan picks the subset that:

- Satisfies every **must-have** rule from the requirements card (dynamic data, responsive
  clean UI, robust validation, intuitive nav, real Git history with both members committing)
- Demonstrates the workflows the problem statement actually cares about: **asset lifecycle,
  allocation conflict, booking overlap, maintenance approval, audit cycle**
- Cuts scope elsewhere on purpose (see "What we're cutting" below) so what remains actually works

If judges ask why Reports/Analytics is thin — that's the honest answer: prioritized
correctness of the core workflows over breadth.

---

## Tech stack (fast to build, satisfies "no cloud lock-in / offline-friendly")

- **Frontend:** React + Vite + plain CSS or Tailwind (no design system setup overhead)
- **Backend:** Node.js + Express
- **Database:** MongoDB, run **locally** (`mongod` on localhost, or a local Docker container) — not Atlas
- **Auth:** JWT, bcrypt for password hashing
- **ODM:** Mongoose (schema + validation layer on top of Mongo, both of you can read the schema files easily)

Run Mongo locally rather than on Atlas: zero dependency on internet access during the
hackathon, satisfies the "don't rely entirely on cloud-based tools" nice-to-have, and
avoids losing time to connection-string/whitelisting issues mid-build.

```bash
# quickest local option if Docker is available
docker run -d --name assetflow-mongo -p 27017:27017 mongo:7
# otherwise install mongodb-community and run `mongod` directly
```

Why this satisfies "avoid static JSON": all data lives in a real DB queried live through
Express routes — nothing is a hardcoded JSON file except optional seed data.

**One thing to know going in — Mongo is not relational.** There's no foreign-key
enforcement, and the two big "must-have" rules (no double-allocation, no overlapping
bookings) are relational constraints in spirit. In Mongo you enforce them **in application
code**, not the DB schema — see the notes under each collection below and the
"Non-negotiables" section at the end.

---

## What we're building (in scope) vs. cutting (out of scope)

**In scope — build these for real:**
1. Login/Signup (Employee self-signup only, JWT auth)
2. Dashboard with live KPI cards (queried from DB, not hardcoded)
3. Organization Setup — Departments, Asset Categories, Employee Directory + role promotion
4. Asset Registration & Directory (with lifecycle status)
5. Asset Allocation with the double-allocation block + transfer request
6. Resource Booking with overlap validation
7. Maintenance request → approval → status flip workflow
8. Basic Audit Cycle (create cycle, mark Verified/Missing/Damaged, close cycle)

**Out of scope / stubbed — mention as "future work" in your demo:**
- Reports & Analytics: one simple table (e.g. department allocation counts), skip heatmaps/charts
- Activity Logs: a simple flat table of recent actions, not a full searchable log
- Email notifications: in-app notification list only, no real email sending
- Forgot password: UI present, backend can be a stub that logs a reset token to console
- QR code scanning: skip; search by Asset Tag/text is enough

---

## Database schema — MongoDB collections (agree on this in the first 30 minutes, then don't change it)

Keep it close to the relational shape — reference by ObjectId rather than embedding, so
each collection stays simple and both of you can query independently without worrying
about nested-document conflicts.

- `User` { name, email (unique index), passwordHash, role: enum[Employee/DeptHead/AssetManager/Admin], departmentId (ref), status }
- `Department` { name, headUserId (ref User), parentDepartmentId (ref Department, optional), status }
- `AssetCategory` { name, extraFields: Mixed/object for category-specific fields }
- `Asset` { name, categoryId (ref), assetTag (unique index, auto-generated e.g. AF-0001), serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable: Boolean, status: enum[Available/Allocated/Reserved/UnderMaintenance/Lost/Retired/Disposed] }
- `Allocation` { assetId (ref), userId (ref), departmentId (ref), allocatedAt, expectedReturnDate, returnedAt, status: enum[Active/Returned] }
- `TransferRequest` { assetId (ref), fromUserId (ref), toUserId (ref), status: enum[Requested/Approved/Rejected] }
- `Booking` { assetId (ref), bookedByUserId (ref), startTime, endTime, status: enum[Upcoming/Ongoing/Completed/Cancelled] }
- `MaintenanceRequest` { assetId (ref), raisedByUserId (ref), issue, priority, status: enum[Pending/Approved/Rejected/Assigned/InProgress/Resolved] }
- `AuditCycle` { scopeDepartmentId (ref), startDate, endDate, status: enum[Open/Closed] }
- `AuditItem` { auditCycleId (ref), assetId (ref), result: enum[Verified/Missing/Damaged] }
- `Notification` { userId (ref), message, isRead: Boolean, createdAt }

**Enforcing the two critical business rules in application code (not the DB):**
- *No double-allocation*: before creating an `Allocation`, query `Allocation.findOne({ assetId, status: 'Active' })` — if found, reject with "currently held by X" and surface the transfer-request option. Wrap the check + insert as tightly as possible (or use a Mongo transaction if you have a replica-set-enabled local instance) to avoid a race if both of you are testing at once.
- *No overlapping bookings*: before creating a `Booking`, query for any existing booking on the same `assetId` where `startTime < newEnd AND endTime > newStart`. That's a plain Mongoose `.find()` with `$lt`/`$gt`, no special Mongo feature needed.

Lock this schema before anyone writes a route — schema churn mid-build is what kills
8-hour timelines.

---

## Team split (parallel, minimal merge conflicts)

Split by **vertical module ownership** — each person owns backend route + frontend screen
for their modules, so you're rarely editing the same file.

**Member A — "Setup & Assets" track**
- Auth (signup/login/JWT middleware)
- Organization Setup screen (Departments, Categories, Employee Directory, role promotion)
- Asset Registration & Directory screen
- Asset Allocation & Transfer screen (the conflict-blocking logic)

**Member B — "Operations" track**
- Dashboard screen (KPI queries)
- Resource Booking screen (overlap validation logic)
- Maintenance Management screen (approval workflow + status auto-flip)
- Audit Cycle screen + Notifications list

Both of you touch the shared Prisma schema — that's the one file to coordinate on
verbally before editing.

---

## Git workflow (realistic for 8 hours, still "proper Git use")

```
main                    ← always deployable, only merged into via PR/merge
 ├── feature/setup-assets   (Member A)
 └── feature/operations     (Member B)
```

**Rules:**
- Nobody commits directly to `main` after hour 0.
- Commit small and often — every working increment (e.g. "add allocation conflict check"),
  not one giant end-of-day commit. This is literally graded ("one member managing the
  repo is not enough" — both of you need commit history).
- Pull `main` before you branch, and merge back into `main` at each checkpoint below —
  don't let both branches drift for 4+ hours or the merge will hurt.
- Commit message format: `<module>: <what changed>` e.g. `alloc: block double-allocation, return currently-held-by error`

**Setup (hour 0):**
```bash
git init
git remote add origin <repo-url>
git add .
git commit -m "chore: project scaffold, prisma schema, express skeleton"
git push -u origin main

# each person:
git checkout -b feature/setup-assets      # Member A
git checkout -b feature/operations        # Member B
```

**During work — commit every 20-40 min:**
```bash
git add .
git commit -m "assets: add asset registration form with validation"
git push origin feature/setup-assets
```

**At each merge checkpoint (see timeline):**
```bash
git checkout main
git pull origin main
git merge feature/setup-assets --no-ff
git merge feature/operations --no-ff
# resolve conflicts if any, test locally
git push origin main

# then both re-branch from updated main
git checkout feature/setup-assets
git merge main
```

Using `--no-ff` keeps merge commits visible in history, so it's obvious both branches
contributed — useful if anyone reviews your commit graph.

---

## Hour-by-hour timeline

**0:00–0:30 — Setup (together)**
- Repo created, both added as collaborators
- Start local Mongo (`docker run` or `mongod`), confirm both machines can connect to their own local instance
- Agree and write the Mongoose schemas together (one person types, both decide) — put each collection in its own file under `models/`
- `npm init`, Express skeleton, React+Vite skeleton, install deps (`mongoose`, `jsonwebtoken`, `bcrypt`, `express`, `cors`)
- First commit + push to `main`, both branch off

**0:30–1:15 — Auth + skeleton routes**
- Member A: signup/login endpoints, JWT middleware, password hashing
- Member B: Express route scaffolding for all "Operations" endpoints (empty handlers), basic React routing/shell + role-based nav guard
- Commit checkpoint

**1:15–3:45 — Core build (longest block, work independently)**
- Member A: Org Setup screen (3 tabs) + Employee Directory role promotion + Asset Registration/Directory + Allocation screen with the conflict-block logic (`already held by X` + transfer request button)
- Member B: Dashboard KPI cards (live queries) + Booking screen with overlap validation + Maintenance workflow (Pending→Approved→...→Resolved with asset status auto-flip)
- Commit every 20–40 min on your own branch

**3:45–4:15 — Merge checkpoint #1**
- Merge both branches into `main`, resolve conflicts, run the app end-to-end once
- Fix anything broken by the merge before continuing

**4:15–6:00 — Second build block**
- Member A: input validation pass on all Member A forms, asset lifecycle status transitions, per-asset history view
- Member B: Audit Cycle screen (create cycle, mark items, close cycle → auto-update Lost status) + Notifications list + wire Dashboard's overdue-returns section
- Commit every 20–40 min

**6:00–6:30 — Merge checkpoint #2**
- Merge, resolve conflicts, full click-through test as a team

**6:30–7:15 — Polish & responsive pass**
- Consistent color scheme/spacing pass across all screens (this is an explicit grading criterion — don't skip it)
- Seed realistic demo data (a few departments, employees, assets, one overlapping booking attempt to show it gets rejected, one allocation conflict to show it gets blocked)

**7:15–7:45 — End-to-end demo rehearsal**
- Walk through: signup → admin promotes someone → register asset → allocate → try double-allocate (blocked) → book resource → try overlapping booking (blocked) → raise maintenance → approve it → run an audit cycle
- Fix any breakage found during rehearsal only — no new features now

**7:45–8:00 — Final commit, README, submit**
- Write a short README: setup steps, what's implemented, what's stubbed/future work
- Final `git push`, tag if your hackathon wants a release tag

---

## Non-negotiables from the must-have list (don't skip these under time pressure)

- **Real-time/dynamic data**: every screen queries the DB live — no hardcoded arrays standing in for real data past the setup phase
- **Robust validation**: required fields, date logic (end time after start time, expected return date not in the past), duplicate email checks on signup (unique index on `User.email` plus a friendly error message, since Mongo will throw a raw duplicate-key error otherwise)
- **Allocation conflict & booking overlap**: since Mongo won't enforce these for you, the application-level checks described in the schema section above are not optional — test them explicitly during rehearsal (try to double-book, confirm it's rejected)
- **Both members in commit history**: the branch structure above guarantees this naturally — don't let one person "just push everything" at the end
- **No self-assigned admin roles**: signup must only ever create an Employee; seed one Admin manually via a seed script, not through the UI

Good luck — if you get through checkpoint #1 on time, you're in good shape for the rest.
