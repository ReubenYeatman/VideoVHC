# ClipVault - Claude Code Guidelines

## Project Overview
ClipVault is a video hosting platform that provides embeddable URLs compatible with VHC (Virtual Health Consultations). Videos are stored in Supabase Storage with permanent public URLs.

---

## Critical Rules

1. **Git**: ALWAYS work on `dev` branch, NEVER commit directly to `main`
2. **Migrations**: You CAN use Supabase MCP `apply_migration`, but you MUST also create a matching Sequelize migration file in `db/migrations/` with the **exact same timestamp** as the MCP migration
3. **Supabase Dev Branch**: Use project ref `dfrtuwdhsliesokydwmd` for development
4. **TypeScript**: Use proper types from `web/src/lib/types.ts`
5. **Dev Server**: NEVER start/stop/restart the dev server - let user manage it

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Frontend | `web/src/` |
| Components | `web/src/components/` |
| Hooks | `web/src/hooks/` |
| Types | `web/src/lib/types.ts` |
| Supabase Client | `web/src/lib/supabase.ts` |
| Migrations | `db/migrations/` |
| Migration Config | `db/config/config.js` |

---

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Database Migrations**: Sequelize CLI
- **Deployment**: Render (static site)

---

## Commands

```bash
# Frontend
cd web && npm run dev      # Dev server (localhost:5173)
cd web && npm run build    # Production build
cd web && npm run lint     # Linting

# Migrations
cd db && npm run migration:create -- <name-in-kebab-case>
cd db && DATABASE_URL="..." npm run migrate
cd db && DATABASE_URL="..." npm run migrate:status
```

---

## Database Schema

**Tables**: `profiles`, `videos`, `shares`

**RPC Functions** (SECURITY DEFINER, bypass RLS):
- `create_share(video_id)` - Generate 8-char share code
- `get_public_video(share_code)` - Public video access
- `increment_view_count(share_code)` - Track views

**Reference**: See `db/migrations/20260112133643-create-tables-and-functions.js` for full schema.

---

## Frontend Architecture

```
web/src/
├── components/
│   ├── auth/       # AuthGuard, LoginForm
│   ├── layout/     # Header, Layout
│   ├── ui/         # Button, Input, Card (CVA-based)
│   └── videos/     # VideoCard, VideoList, VideoUploader, ShareDialog
├── context/        # AuthContext
├── hooks/          # useVideos, useUpload (React Query)
├── lib/            # supabase.ts, types.ts, utils.ts
└── pages/          # HomePage, LoginPage, DashboardPage, PlayerPage
```

**Key Files**:
- Auth context: `web/src/context/AuthContext.tsx`
- Video hooks: `web/src/hooks/useVideos.ts`
- Upload hook: `web/src/hooks/useUpload.ts`
- Types: `web/src/lib/types.ts`

---

## Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/v/:shareCode` | PlayerPage | Public |
| `/dashboard` | DashboardPage | Protected (AuthGuard) |

---

## Git Workflow

**ALWAYS work on the `dev` branch. NEVER commit directly to `main`.**

- All development work happens on `dev`
- Create PRs from `dev` to `main` for production releases
- GitHub Actions migrations only run when PRs are merged to `main`

```bash
# Ensure you're on dev before making changes
git checkout dev
```

---

## Environment Variables

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# For migrations - use DIRECT connection (port 5432)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

### Getting the DATABASE_URL
1. Go to Supabase Dashboard → Project → Settings → Database
2. Scroll to "Connection string" section
3. Select "URI" tab
4. Copy the **Direct connection** string (port 5432, NOT 6543)
5. The transaction pooler (6543) won't work for migrations

---

## Storage

- **Bucket**: `videos` (public)
- **Path format**: `{user_id}/{uuid}.mp4`
- **Size limit**: 50MB
- **Direct URL**: `https://<project-ref>.supabase.co/storage/v1/object/public/videos/{user_id}/{uuid}.mp4`

---

## RLS Policies

All tables have Row Level Security enabled:
- Users can only access their own data
- Public can view active shares via `get_public_video()` RPC
- Use `SECURITY DEFINER` functions to bypass RLS when needed

---

## Migration Best Practices

- Always include both `up` and `down` functions
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotent migrations
- Test migrations locally before pushing
- Never modify existing migration files after they've been applied to production
- Use `SECURITY DEFINER SET search_path = public` for functions that bypass RLS
