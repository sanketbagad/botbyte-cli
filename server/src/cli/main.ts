#!/usr/bin/env node

import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from "figlet";
import { Command } from 'commander';
import { login } from './commands/auth/login';

dotenv.config();

// Display banner
console.log(chalk.red(figlet.textSync('Botbyte CLI AI', { horizontalLayout: 'full' })));

const program = new Command("botbyte");

program
    .name("botbyte")
    .description("Botbyte CLI AI - Your AI-powered command line magic")
    .version("1.1.1");

program.addCommand(login);

// Parse and execute
program.parseAsync(process.argv).catch((error) => {
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
});