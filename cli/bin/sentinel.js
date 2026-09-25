#!/usr/bin/env node
import { createProgram } from '../src/index.js';

async function main() {
  try {
    const program = await createProgram(process.argv);
    if (program) {
      await program.parseAsync(program.normalizedArgv || process.argv);
    }
  } catch (err) {
    console.error(`Sentinel CLI execution error: ${err.message}`);
    process.exit(1);
  }
}

main();
