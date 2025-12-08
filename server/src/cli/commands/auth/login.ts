import { confirm, intro, outro, isCancel, spinner, note, log } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:3001";
const CLIENT_ID = "botbyte-cli";
const CONFIG_DIR = path.join(os.homedir(), ".botbyte");
const TOKEN_FILE = path.join(CONFIG_DIR, "credentials.json");

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function saveToken(tokenData: TokenData) {
  await ensureConfigDir();
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
}

async function loadToken(): Promise<TokenData | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function clearToken() {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch {
    // File doesn't exist
  }
}

function isTokenExpired(token: TokenData): boolean {
  return Date.now() > token.expiresAt;
}

export async function loginCommand(opts: { serverUrl?: string }) {
  const serverUrl = opts.serverUrl || SERVER_URL;

  console.log();
  intro(chalk.bold.magenta("🚀 Botbyte CLI AI - Authentication"));

  // Check for existing token
  const existingToken = await loadToken();

  if (existingToken && !isTokenExpired(existingToken)) {
    log.success(chalk.green(`Already logged in as ${chalk.bold(existingToken.user?.name || existingToken.user?.email || "User")}`));
    
    const shouldReLogin = await confirm({
      message: "Do you want to log in with a different account?",
      initialValue: false,
    });

    if (isCancel(shouldReLogin) || !shouldReLogin) {
      outro(chalk.dim("Session kept. Happy coding! 🎉"));
      return;
    }
    
    await clearToken();
    log.info(chalk.dim("Previous session cleared."));
  }

  const s = spinner();
  s.start(chalk.cyan("🔗 Initiating device authorization..."));

  try {
    // Request device code from server - correct endpoint: /api/auth/device/code
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
      console.log(deviceResponse)
      const errorText = await deviceResponse.text();
      throw new Error(`Failed to initiate device authorization: ${errorText}`);
    }

    const deviceData = await deviceResponse.json();
    // Response uses snake_case
    const { 
      device_code, 
      user_code, 
      verification_uri,
      verification_uri_complete,
      expires_in = 900, 
      interval = 5 
    } = deviceData;

    s.stop(chalk.green("✓ Device authorization initiated"));

    const verifyUrl = verification_uri_complete || verification_uri;

    // Display user instructions
    console.log();
    note(
      `${chalk.bold("Step 1:")} Open ${chalk.underline.cyan(verifyUrl)}\n` +
      `${chalk.bold("Step 2:")} Enter code: ${chalk.bold.yellow(user_code)}\n` +
      `${chalk.bold("Step 3:")} Authorize with GitHub`,
      chalk.bold("🔐 Authentication Required")
    );

    // Try to open browser
    const shouldOpen = await confirm({
      message: "Open browser automatically?",
      initialValue: true,
    });

    if (isCancel(shouldOpen)) {
      outro(chalk.yellow("Login cancelled."));
      return;
    }

    if (shouldOpen) {
      await open(verifyUrl);
      log.info(chalk.dim("Browser opened. Complete authorization there."));
    }

    console.log();
    s.start(chalk.cyan("⏳ Waiting for authorization..."));

    // Poll for token
    const startTime = Date.now();
    const expiresInMs = expires_in * 1000;
    let pollInterval = interval * 1000;
    let tokenData: TokenData | null = null;
    let dots = 0;

    while (Date.now() - startTime < expiresInMs) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      
      dots = (dots + 1) % 4;
      s.message(chalk.cyan(`⏳ Waiting for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`));

      try {
        const tokenResponse = await fetch(`${serverUrl}/api/auth/device/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            device_code: device_code,
            client_id: CLIENT_ID,
          }),
        });

        if (tokenResponse.ok) {
          const data = await tokenResponse.json();
          if (data.access_token) {
            tokenData = {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
              user: data.user,
            };
            break;
          }
        } else {
          const error = await tokenResponse.json().catch(() => ({}));
          if (error.error === "slow_down") {
            pollInterval += 5000; // Increase polling interval
          } else if (error.error && error.error !== "authorization_pending") {
            throw new Error(error.error_description || error.error || "Authorization failed");
          }
        }
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.message && !fetchError.message.includes("pending")) {
          throw fetchError;
        }
      }
    }

    s.stop();

    if (!tokenData) {
      log.error(chalk.red("⏰ Authorization timed out."));
      outro(chalk.yellow("Please try again with: ") + chalk.cyan("botbyte login"));
      process.exit(1);
    }

    // Save token
    await saveToken(tokenData);

    console.log();
    log.success(chalk.green.bold("✓ Successfully authenticated!"));
    
    if (tokenData.user) {
      console.log();
      console.log(chalk.dim("  ┌─────────────────────────────────────┐"));
      console.log(chalk.dim("  │") + chalk.bold("  👤 User Profile                     ") + chalk.dim("│"));
      console.log(chalk.dim("  ├─────────────────────────────────────┤"));
      console.log(chalk.dim("  │") + `  ${chalk.cyan("Name:")}  ${tokenData.user.name || "N/A"}`.padEnd(38) + chalk.dim("│"));
      console.log(chalk.dim("  │") + `  ${chalk.cyan("Email:")} ${tokenData.user.email || "N/A"}`.padEnd(38) + chalk.dim("│"));
      console.log(chalk.dim("  │") + `  ${chalk.cyan("ID:")}    ${tokenData.user.id.slice(0, 20)}...`.padEnd(38) + chalk.dim("│"));
      console.log(chalk.dim("  └─────────────────────────────────────┘"));
    }

    console.log();
    outro(chalk.green("🎉 You're all set! Happy coding with Botbyte CLI AI!"));

  } catch (error: unknown) {
    s.stop(chalk.red("✗ Authentication failed"));
    
    console.log();
    log.error(chalk.red(error instanceof Error ? error.message : "An unexpected error occurred"));
    
    console.log();
    console.log(chalk.dim("Troubleshooting tips:"));
    console.log(chalk.dim("  • Make sure the server is running at ") + chalk.cyan(serverUrl));
    console.log(chalk.dim("  • Check your internet connection"));
    console.log(chalk.dim("  • Try again with: ") + chalk.cyan("botbyte login"));
    
    outro(chalk.yellow("Login failed. See above for details."));
    process.exit(1);
  }
}

export const login = new Command("login")
  .description("Authenticate with Botbyte CLI AI using GitHub OAuth")
  .option("-s, --server-url <url>", "Authentication server URL", SERVER_URL)
  .action(async (opts) => {
    await loginCommand(opts);
  });
