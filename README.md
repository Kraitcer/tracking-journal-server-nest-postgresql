# Tracking Journal API (PostgreSQL)

NestJS API backed by PostgreSQL through Prisma. Request validation and API routes are retained from the MongoDB server.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database.
3. Create/update the database schema with `npm run db:migrate`.
4. Start the API with `npm run start:dev`.

The API listens on port `5000` by default and uses the `/api` prefix. Set `PORT`, `trackingApp_jwtPrivateKey`, `trackingApp_googleClientId`, or `UPLOADS_DIR` as needed.

## Prisma commands

- `npm run db:generate` regenerates Prisma Client after schema changes.
- `npm run db:migrate` creates and applies a development migration.
- `npm run db:deploy` applies committed migrations in deployment environments.

The schema is in `prisma/schema.prisma`; the datasource URL for Prisma CLI is in `prisma.config.ts`, and the Nest runtime connects through Prisma's PostgreSQL driver adapter. Flexible journal/page payloads use PostgreSQL `JSONB` fields. Existing MongoDB records are not imported by these schema migrations and need a separate data-transfer step if they must be retained.

## Checks

- `npm run build`
- `npm test`
- `npm run lint`
