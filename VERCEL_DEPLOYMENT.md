# Vercel Deployment Guide

## Deploy Backend to Vercel

### Prerequisites
- Vercel account: https://vercel.com/signup
- Node.js 20.x or higher

### Step 1: Connect Repository

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository `bobyte-cli`
4. Select root directory: `/` (root)

### Step 2: Environment Variables

Add these environment variables in Vercel dashboard:

1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable (NOT as a Secret reference, but as plain text):

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | From your `.env` file |
| `BETTER_AUTH_SECRET` | `imyl507C5XrVucq5GeYSYRfJt2wOqVzO` | From your `.env` file |
| `BETTER_AUTH_URL` | `https://your-project.vercel.app` | Your deployed URL |
| `GH_CLIENT_ID` | `Ov23liRJlyJjiSQ1tWB3` | From your `.env` file |
| `GH_CLIENT_SECRET` | `c2c16ec04490f6bdbe0c8d2ca544b94cd6c010a7` | From your `.env` file |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSyDlMxK-P2NUHfRb6D5Z2IRvvxsNAz254xc` | From your `.env` file |
| `BOTBYTE_MODEL` | `gemini-2.5-flash` | From your `.env` file |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | Your frontend URL (if deployed) |

**Important**: Add these as regular environment variables, NOT as Secrets with the `@` prefix.

### Step 3: Configure Build Settings

- **Build Command**: `cd server && npm run build`
- **Output Directory**: `server/dist`
- **Install Command**: `npm install`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your backend will be available at: `https://your-project.vercel.app`

### Step 5: Update Frontend

Update `client/lib/auth-client.ts` with your Vercel API URL:

```typescript
export const authClient = createAuthClient({
  baseURL: "https://your-project.vercel.app",
});
```

### Step 6: Update GitHub OAuth

Update your GitHub OAuth app settings:
- **Authorization callback URL**: `https://your-project.vercel.app/api/auth/callback/github`

## Database Migrations

After deployment, run migrations:

```bash
npx prisma migrate deploy --skip-generate
```

Or use Vercel CLI:

```bash
vercel env pull
npx prisma migrate deploy
```

## Monitoring

Check logs in Vercel dashboard:
1. Go to your project
2. Click "Functions" tab
3. View logs for `api/index`

## Troubleshooting

**CORS errors**: Update `BETTER_AUTH_URL` and `CLIENT_URL` in environment variables

**Database connection**: Ensure `DATABASE_URL` has proper connection pooling enabled

**Build failures**: Check build logs in Vercel dashboard for detailed errors
