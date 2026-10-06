# Tracking Journal API (PostgreSQL)

NestJS API backed by PostgreSQL through Prisma. Request validation and API routes are retained from the MongoDB server.

## Docker Compose

From the workspace root, copy `.env.example` to `.env`, set the database credentials and JWT secret, then start the stack:

```sh
docker compose up --build
```

The client is available at `http://localhost:5173`, the API at `http://localhost:5001/api`, and PostgreSQL data is kept in the `postgres_data` volume. The API generates the Prisma client and applies migrations when it starts.

## Manual Setup

1. Install dependencies with `npm install`.
2. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_SCHEMA`. Docker Compose combines these values into `DATABASE_URL` for both Prisma and the API.
3. Create/update the database schema with `npm run db:migrate`.
4. Start the API with `npm run start:dev`.

The API listens on port `5000` by default and uses the `/api` prefix. Set `PORT`, `DATABASE_POOL_MAX`, `trackingApp_jwtPrivateKey`, `trackingApp_googleClientId`, `UPLOADS_DIR`, or a comma-separated `CORS_ORIGINS` list for the deployed frontend origins. Each API instance defaults to at most 10 PostgreSQL connections; size this against the database connection budget before scaling replicas. Local development allows `http://localhost:5173` and `http://127.0.0.1:5173` by default.

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
