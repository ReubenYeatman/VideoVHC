# ClipVault - Claude Code Guidelines

## Project Overview
ClipVault is a video hosting platform that provides embeddable URLs compatible with VHC (Virtual Health Consultations). Videos are stored in Supabase Storage with permanent public URLs.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Database Migrations**: Sequelize CLI
- **Deployment**: Render (static site)

## Git Workflow - IMPORTANT

**ALWAYS work on the `dev` branch. NEVER commit directly to `main`.**

- All development work happens on `dev`
- Create PRs from `dev` to `main` for production releases
- GitHub Actions migrations only run when PRs are merged to `main`

```bash
# Ensure you're on dev before making changes
git checkout dev
```

## Supabase Branch Workflow

**ALWAYS use the Supabase dev branch for development.**

- Dev branch project ref: `dfrtuwdhsliesokydwmd`
- Use Supabase MCP tools for querying/exploring the dev branch
- Migrations go through Sequelize files, NOT the MCP `apply_migration` tool

## Database Migrations - IMPORTANT

### Always Use Sequelize for Migrations
**DO NOT use Supabase MCP `apply_migration` tool for database changes.**

All database schema changes MUST be done through Sequelize migration files:

1. **Create a new migration:**
   ```bash
   cd db
   npm run migration:create -- <migration-name-in-kebab-case>
   ```

2. **Migration file location:** `db/migrations/`

3. **Migration file format:**
   ```javascript
   'use strict';

   /** @type {import('sequelize-cli').Migration} */
   module.exports = {
     async up(queryInterface, Sequelize) {
       await queryInterface.sequelize.query(`
         -- Your SQL here
       `);
     },

     async down(queryInterface, Sequelize) {
       await queryInterface.sequelize.query(`
         -- Rollback SQL here
       `);
     }
   };
   ```

4. **Run migrations locally:**
   ```bash
   cd db
   DATABASE_URL="postgresql://..." npm run migrate
   ```

5. **Check migration status:**
   ```bash
   cd db
   DATABASE_URL="postgresql://..." npm run migrate:status
   ```

### GitHub Actions Auto-Migration
- Migrations automatically run on push to `main` when files in `db/migrations/` change
- Manual trigger available via GitHub Actions workflow dispatch
- Requires `DATABASE_URL` secret configured in GitHub repository settings

### Migration Best Practices
- Always include both `up` and `down` functions
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotent migrations
- Test migrations locally before pushing
- Never modify existing migration files after they've been applied to production
- Use `SECURITY DEFINER SET search_path = public` for functions that bypass RLS

## Supabase Configuration

### Environment Variables
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

### Storage Bucket
- Bucket name: `videos`
- Public bucket with obfuscated UUID paths
- 50MB file size limit
- Path format: `{user_id}/{uuid}.mp4`

### RLS Policies
All tables have Row Level Security enabled. Key patterns:
- Users can only access their own data
- Public can view active shares via `get_public_video()` RPC
- Use `SECURITY DEFINER` functions to bypass RLS when needed

## Frontend Structure
```
web/
├── src/
│   ├── components/
│   │   ├── auth/       # AuthGuard, LoginForm
│   │   ├── layout/     # Header, Layout
│   │   ├── ui/         # Button, Input, Card
│   │   └── videos/     # VideoCard, VideoList, VideoUploader, ShareDialog
│   ├── context/        # AuthContext
│   ├── hooks/          # useVideos, useUpload
│   ├── lib/            # supabase client, types, utils
│   └── pages/          # HomePage, LoginPage, DashboardPage, PlayerPage
```

## Key URLs
- Share player: `/watch/:shareCode`
- Dashboard: `/dashboard`
- Direct video URL format: `https://<project-ref>.supabase.co/storage/v1/object/public/videos/{user_id}/{uuid}.mp4`
