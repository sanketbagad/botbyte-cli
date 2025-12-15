# NPM Publishing with 2FA - Solutions

## Problem
The `npm publish` command requires a one-time password (OTP) when your npm account has 2FA enabled, even when using an automation token.

## Solutions

### Solution 1: Use npm Granular Access Token (Recommended)
Instead of a "Classic Token", use a "Granular Access Token" which can bypass OTP requirements for CI/CD:

1. Go to [npmjs.com](https://www.npmjs.com/) → Login
2. Click your profile → **Access Tokens**
3. Click **Generate New Token** → **Granular Access Token**
4. Configure:
   - **Token name**: `github-actions-publish`
   - **Expiration**: 30 days (or longer)
   - **Permissions**: 
     - `Read and publish packages`
     - `Automation with read and publish access`
5. In **Allowed IP Ranges**: Leave empty or add GitHub Actions IP ranges
6. Copy the token and update `NPM_TOKEN` secret in GitHub

### Solution 2: Disable 2FA for Automation (Not Recommended)
If you only need to publish from CI/CD:
1. Disable 2FA temporarily
2. Generate a new "Classic Token" with type "Automation"
3. Enable 2FA again
4. Update the `NPM_TOKEN` secret

### Solution 3: Use GitHub Packages Registry (Alternative)
Publish to GitHub Packages instead of npm:
- No 2FA authentication issues
- Native GitHub integration
- Manual: `npm publish --registry=https://npm.pkg.github.com`

## Current Status
Your GitHub Actions workflow is correctly configured with:
- ✅ `NODE_AUTH_TOKEN` properly set
- ✅ `--provenance` flag for signed publishing
- ✅ Proper permissions with `id-token: write`

The issue is the token type, not the workflow configuration.

## Next Steps
1. Create a **Granular Access Token** from npm
2. Update the `NPM_TOKEN` secret in GitHub with the new token
3. Re-run the publish workflow

The workflow will then publish successfully without requiring OTP input!
