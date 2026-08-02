#!/usr/bin/env node

import { runSession } from "./session.js";

async function main(argv: string[]): Promise<number> {
  const branch = argv[0];
  if (!branch) {
    process.stderr.write("usage: krowt <branch>\n");
    return 1;
  }
  return runSession(branch);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: Error) => {
    process.stderr.write(`krowt: ${err.message}\n`);
    process.exitCode = 1;
  });
