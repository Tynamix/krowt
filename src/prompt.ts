const queuedLines: string[] = [];
let partial = "";
let ended = false;
let attached = false;
let pending: ((line: string | null) => void) | null = null;

function deliver(line: string): void {
  if (pending) {
    const resolve = pending;
    pending = null;
    process.stdin.pause();
    resolve(line);
  } else {
    queuedLines.push(line);
  }
}

function attach(): void {
  if (attached) return;
  attached = true;
  process.stdin.on("data", (chunk: Buffer | string) => {
    partial += chunk.toString();
    let idx: number;
    while ((idx = partial.indexOf("\n")) >= 0) {
      const line = partial.slice(0, idx).replace(/\r$/, "");
      partial = partial.slice(idx + 1);
      deliver(line);
    }
  });
  process.stdin.on("end", () => {
    ended = true;
    if (pending) {
      const resolve = pending;
      pending = null;
      resolve(partial.length > 0 ? partial : null);
      partial = "";
    }
  });
}

function askLine(question: string): Promise<string | null> {
  attach();
  process.stderr.write(question);
  const queued = queuedLines.shift();
  if (queued !== undefined) return Promise.resolve(queued);
  if (ended) return Promise.resolve(null);
  return new Promise((resolve) => {
    pending = resolve;
    process.stdin.resume();
  });
}

export async function confirm(question: string, defaultYes: boolean): Promise<boolean> {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]";
  for (;;) {
    const answer = (await askLine(`${question} ${suffix} `))?.trim().toLowerCase();
    if (answer === undefined || answer === null || answer === "") return defaultYes;
    if (answer === "y" || answer === "yes") return true;
    if (answer === "n" || answer === "no") return false;
    process.stderr.write("Please answer y or n.\n");
  }
}
