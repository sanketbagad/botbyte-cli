#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const { execSync } = require('child_process');
const path = require('path');

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
