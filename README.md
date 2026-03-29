# Coup — Real-Time Multiplayer Card Game

A full-stack TypeScript implementation of the bluffing card game **Coup**, featuring real-time multiplayer via Socket.IO, a React + Material UI frontend, and an Express + PostgreSQL backend.

## Tech Stack

| Layer    | Technologies                                                    |
| -------- | --------------------------------------------------------------- |
| Backend  | Node.js, Express, Socket.IO, PostgreSQL (pg), Zod, TypeScript   |
| Frontend | React 19 (Vite), Material UI v6, Tailwind CSS v3, Framer Motion |
| Database | Supabase (PostgreSQL)                                            |
| Hosting  | Backend on Render, Frontend on Vercel                            |
| CI       | GitHub Actions                                                   |
| Tooling  | npm workspaces, concurrently, ESLint, tsx                        |

## Prerequisites

- **Node.js** >= 20
- **npm** >= 9
- **Docker** (optional — for local Postgres)

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Coup
npm install
```

This installs root, backend, and frontend dependencies via npm workspaces.

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.development
```

Edit `backend/.env`:
- For **local Postgres** (Docker): `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coup`
- For **Supabase dev project**: paste your Transaction pooler connection string

Edit `frontend/.env.development`:
```
VITE_API_URL=http://localhost:3001
VITE_SERVER_URL=http://localhost:3001
```

### 3. Start the database

**Option A: Local Postgres via Docker** (recommended for offline dev)

```bash
npm run db:local
```

This starts a Postgres 15 container with the schema auto-applied from `backend/schema.sql`.

**Option B: Supabase dev project**

Point `DATABASE_URL` in `backend/.env` to your Supabase connection string. Run the schema migration:

```bash
npm run migrate
```

### 4. Start development

```bash
npm run dev
```

This runs both the backend (port 3001) and frontend (port 5173) concurrently. The Vite dev server proxies `/api` and `/socket.io` to the backend.

## Project Structure

```
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
├── docker-compose.yml           # Local Postgres for development
├── render.yaml                  # Render deployment blueprint
├── backend/
│   ├── server.ts                # Express + Socket.IO entry point
│   ├── schema.sql               # Consolidated Supabase-compatible schema
│   ├── migrations/              # Incremental SQL migrations (up/down)
│   ├── scripts/                 # migrate.ts (schema runner)
│   └── src/
│       ├── config/              # db.ts, constants.ts
│       ├── game/                # Pure game engine (DeckManager, TurnManager, etc.)
│       ├── middleware/          # errorHandler, validate (Zod), rateLimiter
│       ├── models/              # DB model classes (Room, Player, PlayerCard, GameLog)
│       ├── routes/              # REST API routes (rooms, players)
│       ├── services/            # RoomService, PlayerService
│       ├── sockets/             # Socket.IO handlers (gameSocket, lobbySocket)
│       └── types/               # Shared TypeScript types, AppError
├── frontend/
│   ├── vercel.json              # Vercel SPA rewrites + security headers
│   └── src/
│       ├── api/                 # Typed Axios clients (roomApi, playerApi)
│       ├── components/          # UI components (Board, Cards, Actions, Lobby)
│       ├── context/             # SocketContext, GameContext
│       ├── hooks/               # useActions, useReducedMotion, useSoundEffects
│       ├── pages/               # Home, GameRoom
│       └── types/               # Client-side types, session helpers, env.d.ts
└── package.json                 # Root workspace config
```

## Available Scripts

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `npm run dev`               | Start backend + frontend concurrently      |
| `npm run dev:backend`       | Start backend only (tsx watch)             |
| `npm run dev:frontend`      | Start frontend only (Vite)                 |
| `npm run build`             | Build both backend and frontend            |
| `npm run typecheck`         | Type-check both workspaces                 |
| `npm run lint`              | Lint both workspaces                       |
| `npm run migrate`           | Run schema.sql against the database        |
| `npm run db:local`          | Start local Postgres via Docker            |
| `npm run db:migrate`        | Run incremental migrations                 |
| `npm run db:migrate:down`   | Roll back the last migration               |
| `npm run db:migrate:status` | Show migration status                      |
| `npm run db:seed`           | Seed database with sample dev data         |
| `npm run db:reset`          | Roll back, re-migrate, and re-seed         |

## API Endpoints

| Method | Path                    | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/api/health`           | Health check             |
| POST   | `/api/rooms`            | Create a room            |
| GET    | `/api/rooms/:code`      | Get room + players       |
| POST   | `/api/rooms/:code/join` | Join a room              |
| GET    | `/api/rooms/:code/log`  | Get game log             |
| GET    | `/api/players/:id`      | Get player details       |
| GET    | `/api/players/:id/cards`| Get player cards         |

## Socket.IO Events

**Client → Server:** `join_room`, `start_game`, `game_action`, `player_response`, `block_challenge`, `lose_influence`, `exchange_select`, `restart_game`

**Server → Client:** `room_joined`, `player_joined`, `game_started`, `state_update`, `await_response`, `challenge_result`, `block_declared`, `block_challenge_result`, `influence_lost`, `player_disconnected`, `game_over`, `game_restarted`, `error`

## CI Pipeline

GitHub Actions runs on every push/PR to `main`:

1. **typecheck-and-lint** — `npm run typecheck` + `npm run lint` (both workspaces)
2. **build** — `npm run build` (backend `tsc` + frontend `vite build`)

Render and Vercel handle their own deploys on push to `main` — CI validates the build is clean.

## Deployment

### Deployment Order

1. Push `schema.sql` to Supabase via the SQL editor or `npm run migrate` with the production `DATABASE_URL`
2. Deploy backend to Render → get the Render URL
3. Deploy frontend to Vercel with `VITE_API_URL` and `VITE_SERVER_URL` set to the Render URL
4. Set `CLIENT_URL` on Render to the Vercel URL
5. Redeploy backend on Render to pick up the updated CORS origin

### Backend — Render (Web Service)

A `render.yaml` blueprint is included at the repo root.

**Option A: Blueprint deploy**

1. Push to GitHub
2. Go to Render Dashboard → **New** → **Blueprint**
3. Connect the repo — Render reads `render.yaml` automatically
4. Fill in the `sync: false` env vars when prompted

**Option B: Manual setup**

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Build command:** `cd backend && npm install && npm run build`
   - **Start command:** `cd backend && npm start`
   - **Health check path:** `/api/health`
4. Add environment variables:
   | Variable       | Value                                                              |
   | -------------- | ------------------------------------------------------------------ |
   | `NODE_ENV`     | `production`                                                       |
   | `DATABASE_URL` | Supabase Transaction pooler connection string (port 6543)          |
   | `CLIENT_URL`   | Your Vercel frontend URL (e.g. `https://coup-game.vercel.app`)     |
5. Enable **Auto-Deploy** on the `main` branch

**Notes:**
- Render injects `PORT` automatically — the app reads `process.env.PORT`
- The Starter plan ($7/mo) is recommended for WebSocket stability; the Free plan spins down after inactivity and drops WebSocket connections
- Socket.IO is configured for `websocket` transport only (no long-polling) — ensure the frontend client matches: `transports: ['websocket']`

### Frontend — Vercel

A `vercel.json` in the `frontend/` directory handles SPA rewrites and security headers.

1. Go to Vercel Dashboard → **Add New** → **Project**
2. Import the GitHub repo
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables:
   | Variable           | Value                                          |
   | ------------------ | ---------------------------------------------- |
   | `VITE_API_URL`     | Your Render backend URL (e.g. `https://coup-backend.onrender.com`) |
   | `VITE_SERVER_URL`  | Same as above — Socket.IO upgrades `https://` to `wss://` automatically |
5. Enable **Auto-Deploy** on `main` branch pushes

**Notes:**
- Deploy the Render backend first to get its URL, then add it to Vercel env vars
- `VITE_` env vars are inlined at build time and are **public** — never put secrets here
- The `vercel.json` rewrites rule ensures React Router paths (e.g. `/room/ABC`) don't 404 on refresh
- Hashed assets under `/assets/` are cached for 1 year with `immutable`

## License

MIT
