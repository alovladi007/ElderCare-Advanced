# Port map

Every port this project binds lives in one contiguous block: **24610–24699**.

## Why this range

- **High**, so it does not collide with anything conventional (3000, 5000, 8000, 8080 and friends are the busiest ports on a developer machine — port 3000 in particular is claimed by a great many tools).
- **Below 32768.** On Linux, `/proc/sys/net/ipv4/ip_local_port_range` is typically `32768–60999`; the kernel hands those out for *outgoing* connections. A service that binds inside that range will intermittently fail to start with "address already in use" for no visible reason. Picking a high port is right; picking one that high is not.
- **Not IANA-registered** for any common service.

## Assignments

| Port | Service | Where it is set |
|---|---|---|
| **24610** | Web app (React client) | `client/.env` → `PORT` |
| **24611** | REST API (NestJS backend) | `backend/.env` → `PORT` |
| **24612** | WebSocket | `backend/.env` → `WS_PORT` |
| 24613 | Monitoring backend | `monitoring-backend/.env` → `PORT` |
| 24614 | Legacy Express server | `server/` → `PORT` |
| 24615 | Platform backend | `platform/backend/` → `PORT` |
| 24616 | Smart-home platform frontend | `smart-home-platform/frontend/vite.config.ts` |
| 24617 | Secondary frontend (docker) | `docker-compose.yml` |
| 24618 | Platform frontend (docker) | `platform/infra/docker-compose.yml` |

### Docker host bindings

Container-internal ports are unchanged (Postgres still listens on 5432 *inside* its container); only the host side moved, so nothing on your machine is claimed at a conventional number.

| Host port | Container | File |
|---|---|---|
| 24620 | postgres:5432 | `docker-compose.yml` |
| 24621 | mongo:27017 | `docker-compose.yml` |
| 24622 | redis:6379 | `docker-compose.yml` |
| 24623 | postgres:5432 | `platform/infra/docker-compose.yml` |
| 24624 | redis:6379 | `platform/infra/docker-compose.yml` |
| 24625 | postgres:5432 | `smart-home-platform/docker-compose.yml` |
| 24626 | smart-home api:9000 | `smart-home-platform/docker-compose.yml` |
| 24627 | smart-home hub:9001 | `smart-home-platform/docker-compose.yml` |
| 24680 | nginx:80 | `docker-compose.yml` |
| 24643 | nginx:443 | `docker-compose.yml` |

**A local Postgres installed directly on the host still uses 5432.** That is the default in `backend/.env` and is deliberate — it is not this project claiming the port, it is the standard location of an existing database. Change `DATABASE_URL` if yours differs.

## Running locally

`.env` files are gitignored, so a fresh clone has none. Without `client/.env`, create-react-app falls back to **port 3000** — the collision this map exists to prevent. Copy the templates first:

```bash
cd backend && cp .env.example .env    # then set DATABASE_URL and JWT_SECRET
cd ../client && cp .env.example .env
```

Then:

```bash
cd backend && npm run dev    # → http://localhost:24611
cd client  && npm start      # → http://localhost:24610
```

## Changing the block

If 24610–24699 collides with something on your machine, these are the only files that need editing:

- `backend/.env`, `backend/.env.example`
- `client/.env`, `client/.env.example`, `client/package.json` (the `proxy` field)
- `docker-compose.yml`, `platform/infra/docker-compose.yml`, `smart-home-platform/docker-compose.yml`
- `.github/workflows/ci.yml`
- `start-dev.sh`

Source files read these values from the environment. The hardcoded `http://localhost:24611` strings that remain in source are **fallbacks only**, used when the env var is absent — they exist so a misconfigured clone fails somewhere obvious rather than silently pointing at a stale port, which is exactly how this project ended up with three different ones (7501, 8080, 3001) referenced simultaneously.

## Checking a port is free before you claim it

```bash
ss -tlnp | grep :24610      # or: lsof -nP -iTCP:24610 -sTCP:LISTEN
```
