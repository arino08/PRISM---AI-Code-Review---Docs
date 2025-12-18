# 11 - Docker & DevOps

## What is Docker?

Docker packages applications into **containers** - isolated environments that include:
- Your code
- Dependencies (node_modules, etc.)
- Runtime (Node.js, Python, etc.)

**Benefits:**
- Works the same on any computer
- Easy to deploy
- Services run in isolation

---

## Docker Compose

**File:** `docker-compose.yml`

Docker Compose runs multiple containers together:

```yaml
version: "3.8"

services:
  # Backend API server
  backend:
    build: ./backend          # Build from Dockerfile in backend/
    ports:
      - "3005:3005"           # Host:Container port mapping
    environment:
      - PORT=3005
      - OPENAI_API_KEY=${OPENAI_API_KEY}  # From .env
      - WEAVIATE_HOST=weaviate:8080       # Reference other service
    depends_on:
      - weaviate               # Start weaviate first

  # Frontend Next.js app
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev  # Development Dockerfile
    ports:
      - "3004:3004"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3005
    develop:                   # Hot-reload config
      watch:
        - action: sync+restart
          path: ./frontend/src
          target: /app/src

  # Weaviate vector database
  weaviate:
    image: semitechnologies/weaviate:1.28.0  # Pre-built image
    ports:
      - "8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 20
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: /var/lib/weaviate
      ENABLE_MODULES: text2vec-openai
      OPENAI_APIKEY: ${OPENAI_API_KEY}
    volumes:
      - ./weaviate_data:/var/lib/weaviate  # Persist data
```

---

## Key Concepts

### Services

Each service is a container:
- `backend` - Express API
- `frontend` - Next.js app
- `weaviate` - Vector database

### Port Mapping

```yaml
ports:
  - "3005:3005"  # host_port:container_port
```

Access `localhost:3005` → goes to container's port 3005.

### Environment Variables

```yaml
environment:
  - OPENAI_API_KEY=${OPENAI_API_KEY}  # From .env file
  - WEAVIATE_HOST=weaviate:8080       # Service name as hostname
```

### Volumes (Persistent Data)

```yaml
volumes:
  - ./weaviate_data:/var/lib/weaviate
```

Maps host folder to container folder. Data survives container restarts.

### depends_on

```yaml
depends_on:
  - weaviate  # Backend waits for weaviate to start
```

---

## Dockerfile Explained

**File:** `frontend/Dockerfile.dev`

```dockerfile
FROM node:22-alpine    # Base image (Node.js 22 on Alpine Linux)

WORKDIR /app           # Set working directory

COPY package.json ./   # Copy package.json first (for caching)

RUN npm install        # Install dependencies

COPY . .               # Copy rest of code

EXPOSE 3004            # Document which port we use

CMD ["npm", "run", "dev"]   # Start command
```

**Why copy `package.json` separately?**
Docker caches each layer. If only code changes (not dependencies), it reuses the cached `npm install` layer.

---

## Common Commands

```bash
# Start all services
docker compose up

# Start with rebuild
docker compose up --build

# Start in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Watch mode (hot-reload)
docker compose watch
```

---

## Watch Mode (Hot Reload)

```yaml
develop:
  watch:
    - action: sync+restart
      path: ./frontend/src
      target: /app/src
```

When files in `./frontend/src` change:
1. Sync them to `/app/src` in the container
2. Restart the service

Run with: `docker compose watch`

---

## .env File

```bash
# .env (in project root)
OPENAI_API_KEY=sk-your-key-here
```

Docker Compose automatically loads `.env` and substitutes `${VARIABLE}` values.

---

## Networking

Containers can talk to each other using service names:

```javascript
// In backend, connect to weaviate:
const client = weaviate.client({
  host: 'weaviate:8080'  // Service name, not localhost!
});
```

Docker creates a virtual network where `weaviate` resolves to that container's IP.

---

## Production vs Development

| Development | Production |
|-------------|------------|
| `Dockerfile.dev` | `Dockerfile` |
| `npm run dev` | `npm run build && npm start` |
| Hot-reload enabled | Optimized build |
| Source maps | Minified |

---

## Summary

```
docker compose watch     →  Start with hot-reload
                             ↓
┌─────────────────────────────────────────────────┐
│                  Docker Network                  │
├─────────────────────────────────────────────────┤
│  [frontend:3004]  ←→  [backend:3005]            │
│                          ↓                       │
│                    [weaviate:8080]               │
└─────────────────────────────────────────────────┘
                             ↓
Your browser at localhost:3004
```

---

## That's It!

You've learned how PRISM works from frontend to backend to deployment. 🎉

For questions or improvements, check the main [README](../README.md).
