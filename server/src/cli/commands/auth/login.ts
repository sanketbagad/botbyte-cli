import {
  confirm,
  intro,
  outro,
  isCancel,
  spinner,
  note,
  log,
  cancel,
} from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";

dotenv.config();

const SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:3001";
const CLIENT_ID = "botbyte-cli";
const CONFIG_DIR = path.join(os.homedir(), ".botbyte");
const TOKEN_FILE = path.join(CONFIG_DIR, "credentials.json");

// ============================================
// TYPE DEFINITIONS
// ============================================

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================
// TOKEN MANAGEMENT (Exported for use in other commands)
// ============================================

async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Get the stored authentication token
 * @returns The stored token data or null if not found
 */
export async function getStoredToken(): Promise<TokenData | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(data) as TokenData;
  } catch {
    // File doesn't exist or can't be read
    return null;
  }
}

/**
 * Store the authentication token
 * @param token - Token data from the auth server
 * @returns True if stored successfully, false otherwise
 */
export async function storeToken(token: {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  user?: { id: string; name: string; email: string };
}): Promise<boolean> {
  try {
    await ensureConfigDir();

    const tokenData: TokenData = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type || "Bearer",
      scope: token.scope,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      createdAt: new Date().toISOString(),
      user: token.user,
    };

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(chalk.red("Failed to store token:"), message);
    return false;
  }
}

/**
 * Clear the stored authentication token
 * @returns True if cleared successfully, false otherwise
 */
export async function clearStoredToken(): Promise<boolean> {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch {
    // File doesn't exist or can't be deleted
    return false;
  }
}

/**
 * Check if the stored token is expired
 * @returns True if expired or no token exists
 */
export async function isTokenExpired(): Promise<boolean> {
  const token = await getStoredToken();
  if (!token || !token.expiresAt) {
    return true;
  }

  const expiresAt = new Date(token.expiresAt);
  const now = new Date();

  // Consider expired if less than 5 minutes remaining
  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

/**
 * Require authentication - exits if not authenticated
 * @returns The valid token data
 */
export async function requireAuth(): Promise<TokenData> {
  const token = await getStoredToken();

  if (!token) {
    console.log(
      chalk.red("❌ Not authenticated. Please run 'botbyte login' first.")
    );
    process.exit(1);
  }

  if (await isTokenExpired()) {
    console.log(
      chalk.yellow("⚠️  Your session has expired. Please login again.")
    );
    console.log(chalk.gray("   Run: botbyte login\n"));
    process.exit(1);
  }

  return token;
}

/**
 * Get token file path (for display purposes)
 */
export function getTokenFilePath(): string {
  return TOKEN_FILE;
}

// ============================================
// LOGIN COMMAND
// ============================================

export async function loginAction(opts: { serverUrl?: string }): Promise<void> {
  const serverUrl = opts.serverUrl || SERVER_URL;

  console.log();
  intro(chalk.bold.magenta("🚀 Botbyte CLI AI - Authentication"));

  // Check for existing token
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    log.success(
      chalk.green(
        `Already logged in as ${chalk.bold(
          existingToken.user?.name || existingToken.user?.email || "User"
        )}`
      )
    );

    const shouldReLogin = await confirm({
      message: "Do you want to log in with a different account?",
      initialValue: false,
    });

    if (isCancel(shouldReLogin) || !shouldReLogin) {
      cancel("Login cancelled");
      process.exit(0);
    }

    await clearStoredToken();
    log.info(chalk.dim("Previous session cleared."));
  }

  const s = spinner();
  s.start(chalk.cyan("🔗 Initiating device authorization..."));

  try {
    // Request device code from server
    const deviceResponse = await fetch(`${serverUrl}/api/auth/device/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: "openid profile email",
      }),
    });

    if (!deviceResponse.ok) {
      console.log(chalk.red("Failed to initiate device authorization"));
      console.log(deviceResponse);
      const errorText = await deviceResponse.text();
      throw new Error(`Failed to initiate device authorization: ${errorText}`);
    }

    const deviceData = await deviceResponse.json();
    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in = 900,
      interval = 5,
    } = deviceData;

    s.stop(chalk.green("✓ Device authorization initiated"));

    const verifyUrl = verification_uri_complete || verification_uri;

    // Display user instructions
    console.log();
    note(
      `${chalk.bold("Step 1:")} Open ${chalk.underline.cyan(verifyUrl)}\n` +
        `${chalk.bold("Step 2:")} Enter code: ${chalk.bold.yellow(
          user_code
        )}\n` +
        `${chalk.bold("Step 3:")} Authorize with GitHub`,
      chalk.bold("🔐 Authentication Required")
    );

    // Try to open browser
    const shouldOpen = await confirm({
      message: "Open browser automatically?",
      initialValue: true,
    });

    if (isCancel(shouldOpen)) {
      cancel("Login cancelled");
      process.exit(0);
    }

    if (shouldOpen) {
      await open(verifyUrl);
      log.info(chalk.dim("Browser opened. Complete authorization there."));
    }

    console.log();
    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )} minutes)...`
      )
    );
    s.start(chalk.cyan("⏳ Waiting for authorization..."));

    // Poll for token
    const token = await pollForToken(
      serverUrl,
      device_code,
      CLIENT_ID,
      interval,
      expires_in,
      s
    );

    s.stop();

    if (token) {
      // Store the token
      const saved = await storeToken(token);

      if (!saved) {
        console.log(
          chalk.yellow("\n⚠️  Warning: Could not save authentication token.")
        );
        console.log(
          chalk.yellow("   You may need to login again on next use.")
        );
      }

      console.log();
      log.success(chalk.green.bold("✓ Successfully authenticated!"));

      if (token.user) {
        console.log();
        console.log(chalk.dim("  ┌─────────────────────────────────────┐"));
        console.log(
          chalk.dim("  │") +
            chalk.bold("  👤 User Profile                     ") +
            chalk.dim("│")
        );
        console.log(chalk.dim("  ├─────────────────────────────────────┤"));
        console.log(
          chalk.dim("  │") +
            `  ${chalk.cyan("Name:")}  ${token.user.name || "N/A"}`.padEnd(38) +
            chalk.dim("│")
        );
        console.log(
          chalk.dim("  │") +
            `  ${chalk.cyan("Email:")} ${token.user.email || "N/A"}`.padEnd(
              38
            ) +
            chalk.dim("│")
        );
        console.log(
          chalk.dim("  │") +
            `  ${chalk.cyan("ID:")}    ${token.user.id.slice(0, 20)}...`.padEnd(
              38
            ) +
            chalk.dim("│")
        );
        console.log(chalk.dim("  └─────────────────────────────────────┘"));
      }

      console.log();
      console.log(chalk.gray(`📁 Token saved to: ${TOKEN_FILE}`));
      console.log(
        chalk.gray("   You can now use AI commands without logging in again.")
      );
      console.log();
      outro(chalk.green("🎉 You're all set! Happy coding with Botbyte CLI AI!"));
    }
  } catch (error: unknown) {
    s.stop(chalk.red("✗ Authentication failed"));

    console.log();
    log.error(
      chalk.red(
        error instanceof Error ? error.message : "An unexpected error occurred"
      )
    );

    console.log();
    console.log(chalk.dim("Troubleshooting tips:"));
    console.log(
      chalk.dim("  • Make sure the server is running at ") + chalk.cyan(serverUrl)
    );
    console.log(chalk.dim("  • Check your internet connection"));
    console.log(chalk.dim("  • Try again with: ") + chalk.cyan("botbyte login"));

    outro(chalk.yellow("Login failed. See above for details."));
    process.exit(1);
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  user?: { id: string; name: string; email: string };
}

async function pollForToken(
  serverUrl: string,
  deviceCode: string,
  clientId: string,
  initialInterval: number,
  expiresIn: number,
  s: ReturnType<typeof spinner>
): Promise<TokenResponse | null> {
  const startTime = Date.now();
  const expiresInMs = expiresIn * 1000;
  let pollInterval = initialInterval * 1000;
  let dots = 0;

  while (Date.now() - startTime < expiresInMs) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    dots = (dots + 1) % 4;
    s.message(
      chalk.cyan(
        `⏳ Waiting for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
      )
    );

    try {
      const tokenResponse = await fetch(`${serverUrl}/api/auth/device/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Botbyte CLI",
        },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
        }),
      });

      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        if (data.access_token) {
          return data as TokenResponse;
        }
      } else {
        const error = await tokenResponse.json().catch(() => ({}));
        switch (error.error) {
          case "authorization_pending":
            // Continue polling
            break;
          case "slow_down":
            pollInterval += 5000;
            break;
          case "access_denied":
            throw new Error("Access was denied by the user");
          case "expired_token":
            throw new Error("The device code has expired. Please try again.");
          default:
            if (error.error && error.error !== "authorization_pending") {
              throw new Error(
                error.error_description || error.error || "Authorization failed"
              );
            }
        }
      }
    } catch (fetchError: unknown) {
      if (
        fetchError instanceof Error &&
        !fetchError.message.includes("pending")
      ) {
        throw fetchError;
      }
    }
  }

  return null;
}

// ============================================
// LOGOUT COMMAND
// ============================================

export async function logoutAction(): Promise<void> {
  console.log();
  intro(chalk.bold("👋 Botbyte CLI - Logout"));

  const token = await getStoredToken();

  if (!token) {
    console.log(chalk.yellow("You're not logged in."));
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled");
    process.exit(0);
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.green("✅ Successfully logged out!"));
  } else {
    console.log(chalk.yellow("⚠️  Could not clear token file."));
  }
}

// ============================================
// WHOAMI COMMAND
// ============================================

export async function whoamiAction(): Promise<void> {
  const token = await requireAuth();

  if (!token?.accessToken) {
    console.log(chalk.red("No access token found. Please login."));
    process.exit(1);
  }

  const s = spinner();
  s.start(chalk.cyan("Fetching user info..."));

  try {
    // Try to get user from database using the session token
    const user = await prisma.user.findFirst({
      where: {
        sessions: {
          some: {
            token: token.accessToken,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    s.stop();

    if (user) {
      console.log();
      console.log(chalk.bold.cyan("┌────────────────────────────────────────┐"));
      console.log(chalk.bold.cyan("│") + chalk.bold("         👤 Current User               ") + chalk.bold.cyan("│"));
      console.log(chalk.bold.cyan("├────────────────────────────────────────┤"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Name:")}   ${user.name || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Email:")}  ${user.email || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("ID:")}     ${user.id.slice(0, 24)}...`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.bold.cyan("└────────────────────────────────────────┘"));
      console.log();
    } else if (token.user) {
      // Fallback to cached user info
      console.log();
      console.log(chalk.bold.cyan("┌────────────────────────────────────────┐"));
      console.log(chalk.bold.cyan("│") + chalk.bold("         👤 Current User (cached)      ") + chalk.bold.cyan("│"));
      console.log(chalk.bold.cyan("├────────────────────────────────────────┤"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Name:")}   ${token.user.name || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Email:")}  ${token.user.email || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("ID:")}     ${token.user.id.slice(0, 24)}...`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.bold.cyan("└────────────────────────────────────────┘"));
      console.log();
    } else {
      console.log(chalk.yellow("Could not fetch user information."));
    }
  } catch (error: unknown) {
    s.stop();
    // Fallback to cached user info if database lookup fails
    if (token.user) {
      console.log();
      console.log(chalk.bold.cyan("┌────────────────────────────────────────┐"));
      console.log(chalk.bold.cyan("│") + chalk.bold("         👤 Current User (cached)      ") + chalk.bold.cyan("│"));
      console.log(chalk.bold.cyan("├────────────────────────────────────────┤"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Name:")}   ${token.user.name || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("Email:")}  ${token.user.email || "N/A"}`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.cyan("│") + `  ${chalk.bold("ID:")}     ${token.user.id.slice(0, 24)}...`.padEnd(39) + chalk.cyan("│"));
      console.log(chalk.bold.cyan("└────────────────────────────────────────┘"));
      console.log();
    } else {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(chalk.red(`Failed to fetch user info: ${message}`));
    }
  }
}

// ============================================
// COMMANDER SETUP
// ============================================

export const login = new Command("login")
  .description("Authenticate with Botbyte CLI AI using GitHub OAuth")
  .option("-s, --server-url <url>", "Authentication server URL", SERVER_URL)
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored credentials")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("Show current authenticated user")
  .action(whoamiAction);
