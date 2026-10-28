# Terminal Setup: Ghostty + Yazi + Lazygit + zoxide + fzf

A minimal, composable terminal workflow built on purpose-driven tools. Each handles one concern — terminal rendering, file navigation, git operations, directory jumping, and fuzzy search — with no overlap and no wasted abstraction.

## Philosophy

This stack follows a Unix-style approach: small, fast tools that do one thing well and compose through the shell. All are built with modern languages, prioritize performance, and use vim-style keybindings by default.

| Layer              | Tool     | Language | Role                          |
| ------------------ | -------- | -------- | ----------------------------- |
| Terminal           | Ghostty  | Zig      | GPU-accelerated rendering     |
| File management    | Yazi     | Rust     | Async terminal file manager   |
| Version control    | Lazygit  | Go       | Interactive git TUI           |
| Directory jumping  | zoxide   | Rust     | Smart `cd` replacement        |
| Fuzzy search       | fzf      | Go       | General-purpose fuzzy finder  |

---

## Ghostty

**What it is:** A fast, open-source terminal emulator created by Mitchell Hashimoto (co-founder of HashiCorp). Uses platform-native UI (AppKit on macOS, GTK4 on Linux) and GPU acceleration via Metal/OpenGL.

**Version:** 1.3.0 (released March 9, 2026)

**Why this terminal:**

- GPU-accelerated rendering eliminates lag when scrolling large logs or build output
- Native macOS integration — proper tabs, splits, keyboard shortcuts, Retina font rendering
- Simple text-based config file, easy to version control
- Shell integration for Zsh/Bash/Fish out of the box
- Scrollback search (`Cmd+F` on macOS) added in 1.3.0
- Supports Kitty graphics protocol for inline image rendering (used by Yazi)

### Installation

```bash
# macOS — download from ghostty.org or:
brew install --cask ghostty

# Linux (Ubuntu 26.04+)
sudo apt install ghostty
```

### Configuration

Config file location: `~/.config/ghostty/config`

```ini
# Font
font-family = "JetBrains Mono"
font-size = 13

# Theme
theme = catppuccin-mocha

# Window
window-padding-x = 8
window-padding-y = 8
window-decoration = auto

# Shell integration
shell-integration = detect

# Scrollback
scrollback-limit = 10000

# Required for fzf Alt+C to work on macOS
macos-option-as-alt = true

# Keybindings (examples)
# keybind = cmd+shift+h=split:horizontal
# keybind = cmd+shift+v=split:vertical
```

List available themes:

```bash
ghostty +list-themes
```

### Key shortcuts

| Action              | Shortcut           |
| ------------------- | ------------------ |
| New tab             | `Cmd+T`            |
| Close tab           | `Cmd+W`            |
| Split horizontal    | `Cmd+Shift+H`      |
| Split vertical      | `Cmd+Shift+V`      |
| Search scrollback   | `Cmd+F`            |
| Navigate splits     | `Cmd+Option+Arrow`  |

---

## Yazi

**What it is:** A blazing-fast terminal file manager written in Rust with fully async I/O. Uses a three-pane layout (parent / current / preview) with vim keybindings. Supports inline image previews, syntax-highlighted file previews, and a Lua plugin system.

**Why this tool:**

- Fully async — directories with thousands of files load without blocking the UI
- Native image preview via Kitty graphics protocol (works seamlessly in Ghostty)
- Built-in syntax highlighting and preview for text, PDF, images, video, archives
- Lua plugin system with a built-in package manager (`ya pkg`)
- Bulk rename, archive extraction, visual mode, git integration
- Vim-style navigation (`h/j/k/l`), tabs, marks, yanking
- Integrates with zoxide (press `z` inside Yazi to jump) and uses `fd`, `rg`, `fzf` internally

### Installation

```bash
# macOS
brew install yazi ffmpeg sevenzip jq poppler fd ripgrep fzf zoxide imagemagick font-symbols-only-nerd-font

# Linux (build from source)
cargo install --locked yazi-fm yazi-cli
```

### Configuration

Config directory: `~/.config/yazi/`

**Main config** — `~/.config/yazi/yazi.toml`:

```toml
[manager]
ratio = [1, 4, 3]
sort_by = "natural"
sort_dir_first = true
show_hidden = false
show_symlink = true
linemode = "size"

[preview]
tab_size = 2
max_width = 600
max_height = 900
image_filter = "triangle"
image_quality = 75

[opener]
edit = [
  { run = '$EDITOR "$@"', block = true, for = "unix" },
]
open = [
  { run = 'open "$@"', desc = "Open", for = "macos" },
]
```

### Key shortcuts

| Action               | Key           |
| -------------------- | ------------- |
| Navigate             | `h/j/k/l`    |
| Open file            | `Enter` / `l` |
| Go up                | `h`           |
| Toggle hidden files  | `.`           |
| Select file          | `Space`       |
| Visual mode          | `v`           |
| Yank (copy)          | `y`           |
| Cut (move)           | `x`           |
| Paste                | `p`           |
| Delete               | `d`           |
| Rename               | `r`           |
| New tab              | `t`           |
| Switch tabs          | `1-9`         |
| Search               | `/`           |
| Jump (zoxide)        | `z`           |
| Task manager         | `w`           |
| Quit                 | `q`           |

---

## Lazygit

**What it is:** A terminal UI for git commands, written in Go by Jesse Duffield. Provides a panel-based visual interface for staging, committing, branching, rebasing, cherry-picking, and conflict resolution — all from keyboard shortcuts.

**Why this tool:**

- Turns multi-step git operations into single keystrokes
- Visual interactive rebase (squash, fixup, drop, reorder) without editing TODO files
- Line-level and hunk-level staging from a diff view
- Built-in merge conflict resolution
- Custom patch building from old commits
- GitHub PR integration (with `gh` CLI installed)
- Worktree support for parallel branch work
- Custom commands system for project-specific workflows

### Installation

```bash
# macOS
brew install lazygit

# Linux (Arch)
sudo pacman -S lazygit

# Linux (Ubuntu — from binary)
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit
sudo install lazygit /usr/local/bin

# Go
go install github.com/jesseduffield/lazygit@latest
```

### Configuration

Config location: `~/Library/Application Support/lazygit/config.yml` (macOS) or `~/.config/lazygit/config.yml` (Linux)

```yaml
gui:
  showIcons: true
  nerdFontsVersion: "3"
  theme:
    activeBorderColor:
      - green
      - bold
    inactiveBorderColor:
      - white
git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never
  autoFetch: true
```

### Key shortcuts

| Action                  | Key              |
| ----------------------- | ---------------- |
| Stage / unstage file    | `Space`          |
| Stage all               | `a`              |
| Commit                  | `c`              |
| Commit with editor      | `C`              |
| Push                    | `P`              |
| Pull                    | `p`              |
| Switch panel            | `Tab` / `h/l`    |
| Navigate within panel   | `j/k`            |
| Interactive rebase      | `i`              |
| Squash commit           | `s`              |
| Fixup commit            | `f`              |
| Drop commit             | `d`              |
| Reword commit           | `r`              |
| Cherry-pick (copy)      | `c` (on commit)  |
| Cherry-pick (paste)     | `v`              |
| Open file diff          | `Enter`          |
| Stage individual lines  | `Space` (in diff)|
| Create branch           | `n`              |
| Checkout branch         | `Space`          |
| Merge                   | `M`              |
| Open help               | `?`              |
| Quit                    | `q`              |

---

## zoxide

**What it is:** A smarter `cd` command written in Rust. Tracks every directory you visit and ranks them by "frecency" (frequency + recency). After a short learning period, you can jump to any directory with a partial match.

**Why this tool:**

- Eliminates typing long paths — `z emission` instead of `cd ~/projects/sap/sustainability/emission-factor-mapping`
- Self-learning — no manual configuration of bookmarks
- Interactive mode (`zi`) integrates with fzf for visual directory selection
- Tab completion with fuzzy matching
- Works as a drop-in `cd` replacement

### Installation

```bash
# macOS
brew install zoxide

# Linux
# Available in most package managers, or:
curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
```

### How it learns

Just use `z` instead of `cd` for a few days. zoxide silently records every directory you visit:

```bash
z ~/projects/sap/sustainability/emission-factor-mapping
z ~/projects/sap/ai-core
z /etc/ssh
z ~/Documents
```

After this, the database knows your habits.

### Basic usage

```bash
# Works exactly like cd
z ~/projects              # absolute path
z ..                      # go up one level
z -                       # go to previous directory

# The magic — partial matching
z emission                # → ~/projects/sap/sustainability/emission-factor-mapping
z ai-core                 # → ~/projects/sap/ai-core
z doc                     # → ~/Documents

# Multiple keywords narrow the match
z sap emission            # matches both "sap" AND "emission" in the path

# Trailing slash triggers subdirectory match
z emission/               # lists subdirectories of the matched path
```

### Interactive mode (requires fzf)

```bash
# zi opens an fzf picker with all tracked directories
zi                        # browse all directories ranked by frecency
zi proj                   # pre-filter to directories matching "proj"
```

This is where zoxide and fzf work together — `zi` pipes the zoxide database into fzf for interactive selection.

### Tab completion

```bash
z emission<SPACE><TAB>    # shows fzf picker with matching directories
```

When there are multiple matches, pressing `Space` then `Tab` triggers an interactive fzf selection.

### Useful commands

```bash
zoxide query emission     # show what z would match (without jumping)
zoxide query --list       # list all tracked directories with scores
zoxide edit               # manually edit directory scores
```

### Key shortcuts

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `z foo`                 | Jump to highest-ranked match for "foo"    |
| `z foo bar`             | Match must contain both "foo" and "bar"   |
| `z ..`                  | Go up one directory                       |
| `z -`                   | Go to previous directory                  |
| `zi`                    | Interactive directory picker (fzf)        |
| `zi foo`                | Interactive picker pre-filtered to "foo"  |
| `z foo<Space><Tab>`     | Tab completion with fzf                   |
| `zoxide query --list`   | Show all tracked directories              |
| `zoxide edit`           | Edit directory scores                     |

---

## fzf

**What it is:** A general-purpose command-line fuzzy finder written in Go. On its own it reads from stdin, lets you search interactively, and outputs the selection. Its power comes from three shell keybindings, the `**` completion trigger, and piping.

**Why this tool:**

- `Ctrl+R` for fuzzy command history search is transformative on its own
- `Ctrl+T` finds files without knowing their exact path
- `Alt+C` jumps to any subdirectory instantly
- Pipes into anything — git branches, processes, environment variables
- Used internally by Yazi for search and filtering

### Installation

```bash
# macOS
brew install fzf

# Enable shell integration (keybindings + completion) — say yes to all
$(brew --prefix)/opt/fzf/install
```

### The three keybindings

These are the core of fzf. Memorize these three and you'll use them constantly.

#### `Ctrl+R` — Search command history

The most useful one. Replaces the default reverse-search with a fuzzy, interactive version.

```
# Press Ctrl+R, then start typing
# Example: type "docker" to find all docker commands you've run
# Press Enter to paste the selected command onto your command line
# Press Ctrl+R again to toggle between relevance and chronological sort
```

You don't need to remember exact syntax. Typing `npm deploy prod` will find a command like `npm run deploy -- --env=production` even though the words don't appear consecutively.

#### `Ctrl+T` — Find files and paste path

Recursively searches files under the current directory. Selected paths get pasted at your cursor position.

```bash
# Example: open a file in your editor
vim <Ctrl+T>
# Type "schema" → finds src/types/schema.ts
# Press Enter → command becomes: vim src/types/schema.ts

# Works with any command
cat <Ctrl+T>
git add <Ctrl+T>
cp <Ctrl+T> ~/backup/
```

Multi-select with `Tab`:

```bash
git add <Ctrl+T>
# Use Tab to select multiple files, then Enter
```

#### `Alt+C` (or `Option+C` on macOS) — cd into directory

Fuzzy-searches directories and immediately `cd`s into the selection.

```bash
# Press Alt+C (Option+C on macOS)
# Type "src" → shows matching directories
# Press Enter → you're now in that directory
```

> **Note on macOS:** Requires `macos-option-as-alt = true` in your Ghostty config.

### The `**` completion trigger

Type `**` then press `Tab` to trigger fzf completion for commands that support it:

```bash
# File completion
vim **<Tab>               # fuzzy search files
cat src/**<Tab>           # search files under src/

# Directory completion
cd **<Tab>                # fuzzy search directories
cd ~/proj**<Tab>          # search directories under ~/proj

# Process completion
kill -9 **<Tab>           # search running processes by name

# SSH completion
ssh **<Tab>               # search SSH hosts

# Environment variables
export **<Tab>            # search env variable names
```

### fzf as a pipe

fzf reads from stdin, so you can pipe anything into it:

```bash
# Search git branches
git branch | fzf

# Search git log
git log --oneline | fzf

# Search environment variables
env | fzf

# Find and open a file
vim $(fzf)

# Kill a process interactively
kill -9 $(ps aux | fzf | awk '{print $2}')

# Checkout a branch interactively
git branch | fzf | xargs git checkout

# Interactive git log with preview
git log --oneline | fzf --preview 'git show {1}' | awk '{print $1}'
```

### Navigation inside fzf

| Key              | Action                           |
| ---------------- | -------------------------------- |
| `↑` / `↓`       | Move cursor                      |
| `Enter`          | Select and confirm               |
| `Tab`            | Select item (multi-select mode)  |
| `Shift+Tab`      | Deselect item                    |
| `Ctrl+C` / `Esc` | Cancel                           |
| `Ctrl+J/K`       | Move up/down (vim-style alt)     |

---

## How the tools compose

```
┌───────────────────────────────────────────────────────────────┐
│  Ghostty                                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Shell (zsh)                                            │  │
│  │                                                         │  │
│  │  z / zi .............. jump to directories (zoxide)     │  │
│  │  Ctrl+R .............. search command history (fzf)     │  │
│  │  Ctrl+T .............. find files (fzf)                 │  │
│  │  Alt+C ............... cd into subdirectory (fzf)       │  │
│  │  ** + Tab ............ fuzzy completion (fzf)           │  │
│  │                                                         │  │
│  │  $ yy ................ Yazi file manager                │  │
│  │      └─ uses fd, rg, fzf, zoxide internally            │  │
│  │  $ lg ................ Lazygit git TUI                  │  │
│  │  $ claude ............ Claude Code                      │  │
│  │  $ nvim .............. Editor (if used)                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│  Ghostty native splits for parallel sessions                  │
└───────────────────────────────────────────────────────────────┘
```

The workflow loop:

1. **Navigate** — `z project-name` to jump directly, or `yy` to open Yazi for browsing
2. **Find** — `Ctrl+T` to fuzzy-find a file, `Ctrl+R` to recall a command
3. **Edit** — use your editor of choice from the shell
4. **Commit** — `lg` to open Lazygit, stage changes, write commit, push
5. **Repeat** — Ghostty splits let you keep multiple sessions visible simultaneously

No tool depends on or wraps another. Each reads your shell environment and Nerd Font, and that's the only shared configuration surface.

---

## Dependencies

### Required

| Dependency                      | Used by          | Purpose                          |
| ------------------------------- | ---------------- | -------------------------------- |
| Nerd Font (e.g. JetBrains Mono) | All tools       | Icons in Yazi, Lazygit; ligatures in Ghostty |
| `$EDITOR` env variable          | Yazi, Lazygit   | Opens your preferred editor      |

### Recommended

| Dependency | Used by               | Purpose                         |
| ---------- | --------------------- | ------------------------------- |
| `fd`       | fzf, Yazi             | Faster file search (replaces `find`) |
| `bat`      | fzf                   | Syntax-highlighted file preview |
| `ripgrep`  | Yazi                  | Fast content search             |
| `delta`    | Lazygit               | Better diff rendering           |

### Optional

| Dependency   | Used by   | Purpose                         |
| ------------ | --------- | ------------------------------- |
| `gh` CLI     | Lazygit   | GitHub PR integration           |
| `imagemagick`| Yazi      | Image processing for previews   |
| `poppler`    | Yazi      | PDF preview                     |
| `ffmpeg`     | Yazi      | Video thumbnail preview         |
| `sevenzip`   | Yazi      | Archive preview                 |
| `jq`         | Yazi      | JSON preview                    |

### One-line install (macOS)

```bash
brew install ghostty yazi lazygit zoxide fzf fd bat ripgrep delta \
  ffmpeg sevenzip jq poppler imagemagick font-symbols-only-nerd-font

# Enable fzf shell integration
$(brew --prefix)/opt/fzf/install
```

---

## Version control this setup

Back up all configs in a dotfiles repo:

```bash
~/.config/ghostty/config
~/.config/yazi/yazi.toml
~/.config/yazi/keymap.toml
~/.config/yazi/theme.toml
~/.config/lazygit/config.yml
~/.zshrc
```

---

## Complete ~/.zshrc

```bash
# ──────────────────────────────────────
# fzf
# ──────────────────────────────────────
source <(fzf --zsh)

export FZF_DEFAULT_COMMAND="fd --hidden --follow --exclude .git"
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND="fd --type d --hidden --follow --exclude .git"
export FZF_DEFAULT_OPTS="--height 40% --border --layout=reverse --info=inline"
export FZF_CTRL_T_OPTS="--preview 'bat --style=numbers --color=always --line-range :300 {}'"
export FZF_ALT_C_OPTS="--preview 'ls -la {}'"

# ──────────────────────────────────────
# zoxide (must come after compinit)
# ──────────────────────────────────────
eval "$(zoxide init zsh)"

# ──────────────────────────────────────
# Aliases
# ──────────────────────────────────────
alias lg="lazygit"
alias cd="z"
alias cdi="zi"

# ──────────────────────────────────────
# Yazi (cd on exit)
# ──────────────────────────────────────
function yy() {
  local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
  yazi "$@" --cwd-file="$tmp"
  if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
    cd -- "$cwd"
  fi
  rm -f -- "$tmp"
}
```

---

## Potential additions

| Tool       | What it adds                                     | When to consider                            |
| ---------- | ------------------------------------------------ | ------------------------------------------- |
| **tmux**   | Session persistence, detach/reattach, remote SSH  | If you work on remote servers               |
| **cmux**   | Agent-aware terminal with notification rings      | If you run 3+ Claude Code agents in parallel |
| **Starship** | Cross-shell prompt with git status, runtime info | If you want richer prompt context           |
| **Zellij** | Modern tmux alternative with Rust, better defaults | If you want multiplexing without tmux's config overhead |
| **Neovim** | Terminal-native editor with Lua plugin ecosystem  | If you want to stay fully in the terminal    |
