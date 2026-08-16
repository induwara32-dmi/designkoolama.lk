# DesignKoolama Engineering Guide

## Scope

This repository contains the public website and private CMS for DesignKoolama (Pvt) Ltd.

## Structure

- `frontend/`: Next.js App Router application.
- `backend/`: NestJS REST API and Prisma schema.
- `docs/`: architecture, API, database, and deployment documents.
- `design-reference/`: source design exports and a reference inventory.

## Working rules

- Preserve the black/orange visual system and central tokens in `frontend/src/app/globals.css`.
- Keep editable content behind API contracts; temporary fallback content must be clearly isolated.
- Public and admin endpoints must be separated. All admin routes except auth recovery routes require authentication.
- Never commit secrets. Add new variables to `.env.example`.
- Validate incoming data at both application boundaries.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before completing a phase.
- Update `PROJECT_STATUS.md` when a phase changes.
