# Treasury Distributor

## Structure
```
treasury-distributor/
  backend/        ← Single Express API (port 3001)
  frontend/       ← Next.js UI (port 3000)
  docker-compose.yml
  .env
```

## Quick Start
```bash
# 1. Start ScyllaDB + redis + rabbitmq
docker compose up -d scylladb redis rabbitmq

# 2. Backend
cd backend && npm install && npm run dev

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev
```

If port `3000` is already in use, the frontend dev server will automatically start on the next available port instead.

ScyllaDB now listens on `9042`, and the backend auto-creates its keyspace and auth/session tables on startup.

## Default Users
| Email | Password | Role |
|-------|----------|------|
| admin@treasury.local | admin123456 | ADMIN |
| operator@treasury.local | operator123 | OPERATOR |
| viewer@treasury.local | viewer12345 | VIEWER |

## API
```
POST /api/auth/login        { email, password }
POST /api/auth/register     { email, password, role }
POST /api/auth/refresh      { refreshToken }
POST /api/auth/logout       { refreshToken }
GET  /api/auth/me           (requires Bearer token)

GET  /api/users             (ADMIN only)
POST /api/users             (ADMIN only)
PUT  /api/users/:id/role    (ADMIN only)
PUT  /api/users/:id/status  (ADMIN only)

GET  /api/wallets           (OPERATOR+)
GET  /api/campaigns         (any auth)
GET  /api/logs              (any auth)
```

## Auth System
- JWT access token (15 min) + refresh token (7 days)
- 3 roles: ADMIN > OPERATOR > VIEWER
- Rate limiting: 5 failed logins per 15 min
- Auto-suspend after 10 consecutive failures
- Refresh token rotation on each use
- Fresh auth required for sensitive operations (< 5 min old token)
