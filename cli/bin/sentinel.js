#!/usr/bin/env node
'use strict';

const { createProgram } = require('../src/index');

async function main() {
  const program = createProgram();
  if (program) {
    try {
      await program.parseAsync(process.argv);
    } catch (err) {
      console.error(`Sentinel CLI execution error: ${err.message}`);
      process.exit(1);
    }
  }
}

main();
