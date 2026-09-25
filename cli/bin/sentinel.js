#!/usr/bin/env node
import { createProgram } from '../src/index.js';

async function main() {
  try {
    const program = await createProgram();
    if (program) {
      await program.parseAsync(process.argv);
    }
  } catch (err) {
    console.error(`Sentinel CLI execution error: ${err.message}`);
    process.exit(1);
  }
}

main();
