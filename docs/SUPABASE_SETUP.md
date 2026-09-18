# Supabase Setup Guide for KFAB BASIC

This document provides complete instructions for manually configuring your Supabase project on [supabase.com](https://supabase.com) and linking it to the local **KFAB BASIC** applications.

> [!IMPORTANT]
> **No remote Supabase project was created or accessed during local initialization.**
> All remote project creation and dashboard management is handled manually by you.

---

## 1. What to Create Manually on Supabase.com

1. Sign in to your account at **https://supabase.com**.
2. Click **New project**.
3. Select your organization and enter:
   - **Name**: `KFAB-BASIC` (or your preferred project name)
   - **Database Password**: Set a strong, secure database password and store it safely in your password manager.
   - **Region**: Choose the region closest to your operational users (e.g., `ap-south-1` / Mumbai).
   - **Pricing Plan**: Free tier or Pro depending on your requirements.
4. Click **Create new project** and wait a couple of minutes for provisioning to complete.

---

## 2. Locating Your API Credentials

Once the project is created:
1. Navigate to **Project Settings** (gear icon in the left sidebar).
2. Go to **API** under the Configuration section.
3. You will find two client-safe values:
   - **Project URL**: (e.g., `https://[PROJECT_REF].supabase.co`)
   - **Project API Keys**:
     - `anon` / `public`: The public client key (safe for browsers and mobile apps).

---

## 3. Where Values Go Locally

### Web Application (`kfab-web`)
1. In the `kfab-web/` directory, create your local environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `kfab-web/.env.local` and paste your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
3. `.env.local` is listed in `kfab-web/.gitignore` and will never be committed to Git.

### Mobile Application (`kfab-mobile`)
To provide the credentials to the Flutter application at compile-time without checking them into source control:

**Option A: Command-line Dart Defines (Recommended)**
```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project-ref.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-actual-anon-key
```

**Option B: Local File with `--dart-define-from-file`**
Create a local file `kfab-mobile/.env` (which is in `.gitignore`):
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
```
Run with:
```bash
flutter run --dart-define-from-file=.env
```

---

## 4. Security: Keys That Must NEVER Be Exposed

> [!CAUTION]
> **The `service_role` key must NEVER be placed in:**
> - Next.js client-side code (`NEXT_PUBLIC_*`)
> - Flutter mobile application code or assets
> - Any Git repository or public files
> - Documentation files
>
> The `service_role` key bypasses all PostgreSQL Row Level Security (RLS) policies and provides unrestricted superuser access to your database. It should only be used in secure, isolated server environments if strictly required.

---

## 5. How Applications Will Connect

### Next.js Web (`kfab-web`)
* The official `@supabase/supabase-js` and `@supabase/ssr` packages are installed.
* Client utilities are configured at:
  - `src/lib/supabase/client.ts` (Browser components via `createClient()`)
  - `src/lib/supabase/server.ts` (Server Components, Server Actions, Route Handlers via `createServerSupabaseClient()`)
* The client utilities verify if environment variables are present; if empty, they log a clear warning without crashing the build.

### Flutter Mobile (`kfab-mobile`)
* The official `supabase_flutter` package is installed.
* Configuration helpers are established at:
  - `lib/core/config/supabase_config.dart` (Reads compile-time variables via `String.fromEnvironment`)
  - `lib/core/supabase/supabase_service.dart` (Safe initialization wrapper that guards against missing configuration during development)

### Local Backend Structure (`kfab-backend`)
* Contains standard Supabase configuration at `kfab-backend/supabase/`:
  - `config.toml`: Local development ports and service configurations.
  - `seed.sql`: Placeholder for initial database seed data.
  - `migrations/`: Ready to receive database migration scripts.
  - `functions/`: Ready for future Edge Functions.

---

## 6. What Has NOT Been Configured Yet

To maintain a clean separation of steps, the following items have intentionally **not** been implemented yet:
- Database tables and schema definitions
- Row Level Security (RLS) policies
- Authentication flows and providers
- Supabase Edge Functions
- Database queries or business logic
- Remote database migrations

These will be constructed in subsequent steps once you have provisioned the project and are ready to apply schemas.
