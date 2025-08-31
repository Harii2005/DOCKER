# Dockerized Node + Mongo + Mongo Express

## Stack

- Node/Express API (`server.js`)
- MongoDB (root user: admin / pass)
- Mongo Express (web UI on :8081)

## Quick Start

```bash
docker compose up --build -d
# Wait a few seconds, then check:
open http://localhost:8081
curl http://localhost:3030/health
```

## API

- GET /getUsers
- POST /addUser (JSON body)
- GET /health

## Override Connection (host run)

If you want to run the API directly on your host:

```bash
MONGO_URL=mongodb://admin:pass@localhost:27017/admin npm start
```

## Troubleshooting

1. Auth failed from host but works in containers -> you used `mongo` hostname on host. Switch to `localhost` or set `MONGO_URL` env var.
2. Still auth failing -> remove volume to recreate root user:

```bash
docker compose down -v
```

3. Recreate:

```bash
docker compose up --build -d
```

4. Logs:

```bash
docker compose logs -f api
```

## Graceful Shutdown

```bash
docker compose down
```
