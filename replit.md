# Lakshmi Ladies Hostel

A full-stack hostel registration web application for Lakshmi Ladies Hostel, Guntur, Andhra Pradesh.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hostel-app run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Wouter routing
- API: Express 5 + OpenAPI contract-first
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: JWT (jsonwebtoken + bcryptjs)
- File uploads: Multer (disk storage under `/uploads/`)
- QR Code: `qrcode` npm package
- Export: jsPDF + jspdf-autotable (PDF), CSV via native Blob
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/admins.ts` — Admin table schema
- `lib/db/src/schema/registrations.ts` — Registration table schema
- `artifacts/api-server/src/routes/` — Backend routes (auth, registrations, uploads, qr)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/hostel-app/src/pages/` — Frontend pages

## Architecture decisions

- Contract-first OpenAPI: All endpoints defined in `lib/api-spec/openapi.yaml` before implementation
- JWT stored in `localStorage` under key `hostel_admin_token`, passed via `setAuthTokenGetter` from the custom-fetch
- File uploads stored on disk under `/uploads/` directory, served statically at `/api/uploads/:filename`
- QR code generated server-side using `qrcode` package, returned as base64 PNG
- PostgreSQL `date` column used for `dateOfBirth` (stored as string `YYYY-MM-DD`)

## Product

- **Landing page** (`/`): Hostel info, facilities grid, about section, Google Maps embed, contact details
- **Registration** (`/register`): Full form with file upload (photo + ID proof), duplicate phone prevention
- **Admin Login** (`/admin/login`): JWT-based secure login
- **Admin Dashboard** (`/admin/dashboard`): Stats cards, searchable/filterable registrations table, approve/reject/delete, QR code display, PDF/CSV export

## User preferences

- Admin email: narendrareddy83677@gmail.com
- Admin password: Admin@123
- Feminine rose/mauve color palette

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after schema changes
- Always run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI spec changes
- File uploads directory is `/uploads/` relative to the API server process CWD
- JWT secret defaults to a hardcoded string; set `JWT_SECRET` env var in production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
