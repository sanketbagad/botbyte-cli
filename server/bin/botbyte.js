#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'src', 'cli', 'main.ts');

// Get arguments passed to the CLI (skip node and script path)
const args = process.argv.slice(2).join(' ');

try {
  execSync(`npx tsx "${cliPath}" ${args}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  process.exit(error.status || 1);
}
