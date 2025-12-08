#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wake-up.js";

dotenv.config();

// Display banner
console.log(
  chalk.red(figlet.textSync("Botbyte CLI AI", { horizontalLayout: "full" }))
);

const program = new Command("botbyte");

program
  .name("botbyte")
  .description("Botbyte CLI AI - Your AI-powered command line magic")
  .version("1.1.1");

// Auth commands
program.addCommand(login);
program.addCommand(logout);
program.addCommand(whoami);

// ai commands
program.addCommand(wakeUp);

// Parse and execute
program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red("Error:"), error.message);
  process.exit(1);
});