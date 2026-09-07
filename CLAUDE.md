## Tech stack

- **Frontend**: React + TypeScript
- **Backend**: Bun + TypeScript
- **API layer**: tRPC (frontend ↔ backend communication)
- **Database**: Postgres
- **Auth**: Clerk
- **Image storage**: self-hosted MinIO (S3-compatible), used in both dev and prod; images are server-side compressed and thumbnailed on upload

## V1 scope

**In scope:**
- Manual recipe entry only (title, structured ingredients, ordered steps with optional photos, servings, notes, cover image)
- Browsing all recipes, filtered by album

**Explicitly out of scope for v1:**
- Recipe import/parsing (e.g. from a URL) — manual entry only
- Search (text search across titles/ingredients)
- Sharing — no public links or any cross-workspace visibility

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
