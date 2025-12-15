# GitHub Actions Setup Guide

## Required Secrets

To enable automated publishing and CI/CD, you need to add the following secrets to your GitHub repository:

### How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add each secret below

### Required Secrets

#### For npm Publishing (`NPM_TOKEN`)
1. Go to [npmjs.com](https://www.npmjs.com/) and login
2. Click your profile → `Access Tokens`
3. Click `Generate New Token` → `Classic Token`
4. Select `Automation` type
5. Copy the token and add it as `NPM_TOKEN` in GitHub secrets

#### For Development/Testing

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Your database provider (e.g., Neon, Supabase) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `GH_CLIENT_ID` | GitHub OAuth client ID | GitHub Settings → Developer settings → OAuth Apps |
| `GH_CLIENT_SECRET` | GitHub OAuth client secret | Same as above |
| `BETTER_AUTH_SECRET` | Better Auth secret key | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL of your app | e.g., `http://localhost:3001` or production URL |

**Note:** GitHub Actions reserves the `GITHUB_` prefix for system variables, so we use `GH_` instead.

## Workflows

### 1. CI/CD Workflow (`ci.yml`)

**Trigger:** On push or pull request to master/main branch

**What it does:**
- ✅ Runs tests for server and client
- ✅ Checks linting
- ✅ Builds the project
- ✅ Validates code quality

### 2. Publish Workflow (`publish.yml`)

**Trigger:** 
- When you create a new release on GitHub
- Manually via workflow dispatch

**What it does:**
- ✅ Builds the TypeScript code
- ✅ Runs tests
- ✅ Publishes to npm with provenance
- ✅ Creates release notes

## How to Publish a New Version

### Method 1: Using GitHub Releases (Recommended)

1. Update version in `server/package.json`:
   ```bash
   cd server
   npm version patch  # or minor, or major
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "chore: bump version to X.X.X"
   git push
   ```

3. Create a new release on GitHub:
   - Go to your repository → `Releases` → `Create a new release`
   - Click `Choose a tag` and create a new tag (e.g., `v1.1.3`)
   - Fill in release title and description
   - Click `Publish release`

4. The GitHub Action will automatically:
   - Build the project
   - Run tests
   - Publish to npm

### Method 2: Manual Workflow Dispatch

1. Go to `Actions` tab in your repository
2. Select `Publish to npm` workflow
3. Click `Run workflow`
4. Select the branch and click `Run workflow`

## Environment Variables

The package doesn't bundle environment variables. Users need to set up their own `.env` file after installation:

```env
GOOGLE_API_KEY=your_api_key
DATABASE_URL=your_database_url
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## CI/CD Badge

Add this badge to your README.md:

```markdown
![CI/CD](https://github.com/sanketbagad/bobyte-cli/actions/workflows/ci.yml/badge.svg)
```

## Troubleshooting

**Publishing fails with 403 error:**
- Make sure `NPM_TOKEN` is correctly set in GitHub secrets
- Verify the token has publish permissions
- Check if 2FA is enabled on your npm account

**Tests fail in CI:**
- Ensure all required secrets are added
- Check if dependencies are correctly specified in package.json
- Review the logs in the Actions tab

**Build fails:**
- Verify TypeScript compiles locally: `npm run build`
- Check for any missing dependencies
- Ensure `dist/` folder is being generated correctly
