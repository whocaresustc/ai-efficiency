# Terminal Tools

WezTerm
vim
tmux
warp
Paperwm.spoon
textream

---

## Neovim + LazyVim Setup (Ghostty)

Terminal-based code editor setup to replace IDE (e.g. VS Code). Installed on 2026-03-19.

### What was installed

| Tool | Version | Purpose |
|------|---------|---------|
| Neovim | 0.11.6 | Terminal code editor |
| LazyVim | starter | Pre-configured Neovim distribution (plugins, keybindings, UI) |
| git | 2.53.0 | Version control (LazyVim dependency) |
| ripgrep | 15.1.0 | Fast text search across files |
| fd | 10.4.2 | Fast file finder |
| lazygit | 0.60.0 | Terminal UI for git |
| JetBrainsMono Nerd Font | 3.4.0 | Font with icon support for LazyVim |

### Install commands used

```bash
# 1. Install neovim and dependencies
brew install neovim git ripgrep fd lazygit

# 2. Clone LazyVim starter config
git clone https://github.com/LazyVim/starter ~/.config/nvim

# 3. Remove .git so you can customize freely
rm -rf ~/.config/nvim/.git

# 4. Install Nerd Font for icons
brew install --cask font-jetbrains-mono-nerd-font
```

### Ghostty font config

Created `~/.config/ghostty/config`:

```
font-family = JetBrainsMono Nerd Font
font-size = 14
```

Restart Ghostty after changing the font.

### Key config paths

- Neovim config: `~/.config/nvim/`
- Ghostty config: `~/.config/ghostty/config`
- LazyVim plugins: `~/.local/share/nvim/`

### Key shortcuts

| Key | Action |
|-----|--------|
| `Space` | Leader key (opens command menu) |
| `Space f f` | Find files (fuzzy search) |
| `Space f g` | Search text in files (grep) |
| `Space e` | File explorer (sidebar) |
| `Space b b` | Switch between open buffers |
| `Space g g` | Open lazygit |
| `g d` | Go to definition |
| `K` | Hover docs |
| `:q` | Quit |

### First launch

Run `nvim` — all plugins auto-install on first launch (~30 seconds).
