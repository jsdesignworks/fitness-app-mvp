# Setup Guide

Complete setup instructions for your fitness app MVP.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm installed
- Supabase account (free tier is fine)
- Anthropic API key (Claude)
- Git installed

## Step 1: Clone and Install

```bash
# Navigate to your project directory
cd fitness-app-mvp

# Install dependencies
npm install

# or if you prefer pnpm
pnpm install
```

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key
4. Note your service role key (for admin operations)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Initialize Supabase locally

```bash
supabase init
supabase start
```

### Link to your cloud project

```bash
supabase link --project-ref your-project-ref
```

## Step 3: Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_PROVIDER=anthropic

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# License Encryption (generate with: openssl rand -base64 32)
LICENSE_ENCRYPTION_KEY=your-encryption-key

# Google Calendar (optional for MVP)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 4: Database Migrations

Run all migrations to set up your database schema:

```bash
supabase db push
```

Or run migrations one by one:

```bash
supabase migration up
```

### Seed development data (optional)

```bash
supabase db reset --with-seed
```

## Step 5: Set Up shadcn/ui

Initialize shadcn:

```bash
npx shadcn-ui@latest init
```

Choose these options:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Add initial components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 7: Set Up Supabase Edge Functions (Background Jobs)

### Deploy Edge Functions

```bash
# Deploy nutrition update function
supabase functions deploy daily-nutrition-update

# Deploy streak reminder function
supabase functions deploy streak-reminders

# Deploy calendar sync function
supabase functions deploy calendar-sync
```

### Set up cron triggers

In Supabase dashboard:
1. Go to Database → Extensions
2. Enable `pg_cron`
3. Create cron jobs in SQL editor:

```sql
-- Run nutrition updates daily at 2 AM UTC
SELECT cron.schedule(
  'daily-nutrition-update',
  '0 2 * * *',
  $$ SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/daily-nutrition-update',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) $$
);

-- Run streak reminders daily at 6 PM UTC
SELECT cron.schedule(
  'streak-reminders',
  '0 18 * * *',
  $$ SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/streak-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) $$
);
```

## Step 8: Verify Setup

### Test authentication

1. Go to `/signup`
2. Create a test account
3. Verify email (check Supabase dashboard)
4. Log in

### Test API routes

```bash
# Test workout creation
curl -X POST http://localhost:3000/api/workouts/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "workoutId": "test-workout-id"}'
```

### Test AI chat

1. Go to `/chat`
2. Send a message
3. Verify response from Claude

## Development Workflow

### Project Structure

```
lib/
├── domain/     ← Add new types here
├── services/   ← Add business logic here
├── providers/  ← Add external integrations here
└── db/         ← Add database queries here

app/
├── api/        ← Add API routes here (thin wrappers)
└── (dashboard) ← Add UI pages here
```

### Adding a New Feature

1. **Define types** in `/lib/domain/[domain].types.ts`
2. **Implement service** in `/lib/services/[domain].service.ts`
3. **Create API route** in `/app/api/[feature]/route.ts`
4. **Build UI** in `/app/(dashboard)/[feature]/page.tsx`

Example: Adding habit tracking

```typescript
// 1. lib/domain/habit.types.ts
export interface Habit {
  id: string
  userId: string
  name: string
  // ...
}

// 2. lib/services/habit.service.ts
export class HabitService {
  static async logHabit(habitId: string, value: number) {
    // Business logic
  }
}

// 3. app/api/habits/log/route.ts
export async function POST(req: Request) {
  const { habitId, value } = await req.json()
  return Response.json(await HabitService.logHabit(habitId, value))
}

// 4. app/(dashboard)/habits/page.tsx
export default function HabitsPage() {
  // UI implementation
}
```

## Troubleshooting

### Supabase connection issues

```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start
```

### Type errors

```bash
# Regenerate Supabase types
npx supabase gen types typescript --local > lib/db/supabase.types.ts
```

### AI provider errors

- Verify `ANTHROPIC_API_KEY` in `.env.local`
- Check API key hasn't expired
- Verify rate limits: https://console.anthropic.com

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Point to your production Supabase project
```

### Deploy Supabase

```bash
# Push migrations to production
supabase db push --linked

# Deploy edge functions to production
supabase functions deploy --no-verify-jwt
```

## Next Steps

1. ✅ Complete setup
2. 🔨 Implement workout session service
3. 🔨 Implement nutrition logging service
4. 🔨 Build calendar UI
5. 🔨 Implement AI chat interface
6. 🔨 Add messaging system
7. 🚀 Deploy MVP

## Getting Help

- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- Anthropic docs: https://docs.anthropic.com
- shadcn/ui docs: https://ui.shadcn.com

## License Management

To add a new license:

```sql
INSERT INTO licenses (user_id, tier, status, expires_at)
VALUES (
  'user-id',
  'pro',
  'active',
  NOW() + INTERVAL '1 year'
);
```

To check license in code:

```typescript
import { requireActiveLicense } from '@/lib/middleware/license'

const license = await requireActiveLicense(userId)
// Proceed if license is active
```
