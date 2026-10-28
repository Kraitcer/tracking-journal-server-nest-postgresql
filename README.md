# Tracking Journal API (PostgreSQL)

NestJS API backed by PostgreSQL through Prisma. Request validation and API routes are retained from the MongoDB server.

## Docker Compose

From the workspace root, copy `.env.example` to `.env`, set the database credentials and JWT secret, then start the stack:

```sh
docker compose up --build
```

The client is available at `http://localhost:5173`, the API at `http://localhost:5001/api`, and PostgreSQL data is kept in the `postgres_data` volume. The API synchronizes its persistent `api_node_modules` volume with `package-lock.json` using `npm ci`, generates the Prisma client, and applies migrations when it starts. This prevents stale dependencies in the volume from masking packages installed in a rebuilt image.

## Amvera

Deploy the workspace root using `amvera.yaml` and `Dockerfile.amvera`. The multi-stage build compiles the Vite client, copies its `dist` into the server's `public` directory, and runs a single NestJS container on port `5000`. NestJS serves the frontend and its SPA routes alongside `/api`. Without `public/index.html`, the server remains API-only for local development; Docker Compose still runs separate client and API containers.

Configure these runtime environment variables in Amvera:

- `DATABASE_URL`: the production PostgreSQL connection URL, reachable from the container.
- `trackingApp_jwtPrivateKey`: a random secret of at least 32 bytes.
- `GOOGLE_CLIENT_ID`: the public Google OAuth web client ID when Google login is used.

The startup command applies committed Prisma migrations before starting the API. Amvera mounts persistent storage at `/data`; uploaded files use `/data/uploads`.

The frontend API URL is `/api` at build time, so it uses the same origin as the deployed server. Before initializing Google Identity Services, the login page fetches the public client ID from `GET /api/users/login/google/config`. The server reads it from `GOOGLE_CLIENT_ID` and uses the same value to verify Google ID tokens. No frontend Google environment variable or Google Docker build argument is needed. Restart the server after changing the value; the frontend does not need rebuilding. Register the deployed origin in the Google OAuth client settings.

To check the deployment image locally from the workspace root:

```sh
docker build -f Dockerfile.amvera -t tracking-journal-amvera .
```

For Google login, set `GOOGLE_CLIENT_ID` on the running server container. Local `.env` files, dependencies, build output, and uploads are excluded from the root Docker build context.

## Manual Setup

1. Install dependencies with `npm install`.
2. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_SCHEMA`. Docker Compose combines these values into `DATABASE_URL` for both Prisma and the API.
3. Create/update the database schema with `npm run db:migrate`.
4. Start the API with `npm run start:dev`.

The API listens on port `5000` by default and uses the `/api` prefix. Set `PORT`, `DATABASE_POOL_MAX`, `trackingApp_jwtPrivateKey`, `GOOGLE_CLIENT_ID`, `UPLOADS_DIR`, or a comma-separated `CORS_ORIGINS` list for the deployed frontend origins. Each API instance defaults to at most 10 PostgreSQL connections; size this against the database connection budget before scaling replicas. Local development allows `http://localhost:5173` and `http://127.0.0.1:5173` by default.

For manual local Google sign-in, set `GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com` in the server directory's `.env`, set `VITE_API_URL=http://localhost:5000/api` in the client's `.env`, and allow `http://localhost:5173` in the OAuth client's Authorized JavaScript origins. With Docker Compose, set `GOOGLE_CLIENT_ID` only in the workspace root `.env`; Compose passes it to the API. The old `trackingApp_googleClientId` and `VITE_GOOGLE_CLIENT_ID` settings are no longer used. The configuration endpoint is public and returns HTTP 503 when Google login is not configured; email/password login remains available. Do not put a Client Secret in frontend settings or this endpoint.

## Prisma commands

- `npm run db:generate` regenerates Prisma Client after schema changes.
- `npm run db:migrate` creates and applies a development migration.
- `npm run db:deploy` applies committed migrations in deployment environments.
- Before deploying the password hardening to a database that may contain legacy plaintext passwords, run `npm run db:hash-legacy-passwords` once with the production `DATABASE_URL`. It reports only the number of updated accounts and does not print credentials.

The schema is in `prisma/schema.prisma`; the datasource URL for Prisma CLI is in `prisma.config.ts`, and the Nest runtime connects through Prisma's PostgreSQL driver adapter. Flexible journal/page payloads use PostgreSQL `JSONB` fields. Existing MongoDB records are not imported by these schema migrations and need a separate data-transfer step if they must be retained.

## Checks

- `npm run build`
- `npm test`
- `npm run lint`
