const ART = [
  "  _                      _   ",
  " | | ___ __ _____      _| |_ ",
  " | |/ / '__/ _ \\ \\ /\\ / / __|",
  " |   <| | | (_) \\ V  V /| |_ ",
  " |_|\\_\\_|  \\___/ \\_/\\_/  \\__|",
];

const TAGLINE = "AI coding sessions in isolated git worktrees";

const ACCENT = "\x1b[1;36m";
const RESET = "\x1b[0m";

const ART_WIDTH = Math.max(...ART.map((line) => line.length));

export interface SplashOptions {
  isTTY: boolean;
  columns: number;
  noColor: boolean;
  enabled: boolean;
  version: string;
}

export function renderSplash(opts: SplashOptions): string | null {
  if (!opts.isTTY || !opts.enabled) return null;
  const oneLiner = `krowt ${opts.version} — ${TAGLINE}`;
  if (opts.columns < ART_WIDTH) return `${oneLiner}\n`;
  const art = opts.noColor ? ART : ART.map((line) => `${ACCENT}${line}${RESET}`);
  const lines = [...art, "", oneLiner];
  return `${lines.join("\n")}\n`;
}
