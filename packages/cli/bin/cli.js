#!/usr/bin/env node
const { runCLI } = require('../dist/index.js');
const exitCode = runCLI(process.argv.slice(2));
process.exit(exitCode);
