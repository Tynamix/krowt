export const HELP_TEXT = `krowt — AI coding sessions in isolated git worktrees

USAGE
  krowt <branch> [flags]     Start or resume a session for <branch>
  krowt list                 Show all sessions of this repository
  krowt init                 Create .krowt/config.toml and check tools
  krowt --help               Show this help
  krowt --version            Show the version

SESSION WORKFLOW
  Ensures a worktree exists for <branch> at <worktree_dir>/<branch-with-dashes>
  (creating the branch from the Base — the freshly fetched remote default
  branch, or the local default branch with a warning when offline), runs the
  agent inside it in the foreground, opens the git UI when work is
  uncommitted or unpushed, and finally asks whether to delete the worktree.
  The local branch is never deleted.

FLAGS
  --base <ref>          Branch off <ref> instead of the Base
  --agent <cmd>         Agent command (default: opencode)
  --git-ui <cmd>        Git UI command (default: lazygit)
  --worktree-dir <dir>  Session worktree location (default: sibling directory
                        <repo>-worktrees; relative paths resolve against the
                        repository root)
  -h, --help            Show this help
  --version             Show the version

ENVIRONMENT
  KROWT_AGENT         Overrides the agent command
  KROWT_GIT_UI        Overrides the git UI command
  KROWT_WORKTREE_DIR  Overrides the session worktree location
  KROWT_SPLASH        "false" or "0" hides the splash shown at session start
  NO_COLOR            Disables colors in the splash
  KROWT_BRANCH        Set by krowt inside the agent process
  KROWT_WORKTREE      Set by krowt inside the agent process

CONFIGURATION
  .krowt/config.toml at the repository root (created by 'krowt init',
  never created implicitly during a normal run):

    agent = "opencode"
    git_ui = "lazygit"
    worktree_dir = "../myrepo-worktrees"
    splash = true

  Precedence: CLI flag > environment variable > config file > defaults.
`;
