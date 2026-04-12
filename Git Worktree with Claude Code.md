# Git Worktree 与 Claude Code

---

## 1. Git Worktree 与分支切换对比

当需要在多个功能之间切换时，有三种常见做法：

| | 同目录顺序切换分支（单会话） | 同目录不同分支（多会话并行） | Worktree |
|---|---|---|---|
| 能否并行 | 不能，只能顺序执行 | 不能，会互相覆盖文件 | 可以，完全隔离 |
| 共享 Git 历史 | 是 | 是 | 是 |
| 独立磁盘文件 | 否，切换前需 stash/commit | 否 | 是 |
| 能否独立构建/测试 | 否 | 否 | 是 |
| 上下文混淆风险 | 中等：Claude 仍记得上一个分支的内容 | 高：活跃冲突 | 无 |
| 配置成本 | 无 | 无 | 一个参数（`--worktree`） |
| 适用场景 | 小任务，逐个完成 | 不推荐 | 并发或长时间运行的任务 |

---

## 2. 使用方式

```bash
# 创建命名 worktree（自动创建分支 worktree-feature-auth）
claude --worktree feature-auth

# 另一个隔离会话
claude --worktree bugfix-123

# 自动生成名称
claude --worktree
```

---

## 3. Worktree 生命周期流程

```
┌─────────────────────────────────────────────────────┐
│                    Main Repo                         │
│                  (main branch)                       │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Terminal 1   │ │  Terminal 2   │ │   Terminal 3      │
│              │ │              │ │                  │
│ claude       │ │ claude       │ │ claude           │
│ --worktree   │ │ --worktree   │ │ --worktree       │
│ feature-auth │ │ bugfix-123   │ │                  │
└──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
       ▼                ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ .claude/     │ │ .claude/     │ │ .claude/          │
│ worktrees/   │ │ worktrees/   │ │ worktrees/        │
│ feature-auth/│ │ bugfix-123/  │ │ bright-running-fox│
│              │ │              │ │ (auto-named)      │
│ branch:      │ │ branch:      │ │ branch:           │
│ worktree-    │ │ worktree-    │ │ worktree-bright-  │
│ feature-auth │ │ bugfix-123   │ │ running-fox       │
└──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
       │                │                  │
       ▼                ▼                  ▼
   Edit, build,     Edit, build,       Edit, build,
   test here        test here          test here
   (isolated)       (isolated)         (isolated)
       │                │                  │
       ▼                ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Exit session │ │ Exit session │ │ Exit session      │
└──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
       │                │                  │
       ▼                ▼                  ▼
  Has changes?     Has changes?       Has changes?
   │       │        │       │          │       │
   No     Yes       No     Yes        No     Yes
   │       │        │       │          │       │
   ▼       ▼        ▼       ▼          ▼       ▼
 Auto    Prompt:  Auto    Prompt:    Auto    Prompt:
 remove  Keep or  remove  Keep or    remove  Keep or
         remove?          remove?            remove?
           │                │                  │
     ┌─────┴─────┐   ┌─────┴─────┐     ┌─────┴─────┐
     ▼           ▼   ▼           ▼     ▼           ▼
   Keep:      Remove: Keep:    Remove: Keep:     Remove:
   Push/PR    Discard Push/PR  Discard Push/PR   Discard
```

### 生命周期总结

1. **创建** — `claude --worktree <name>` → 新目录 + 新分支
2. **工作** — Claude 在隔离副本中编辑、构建、测试
3. **完成** — 推送 commit，按需创建 PR
4. **清理** — 无改动自动删除；有改动则提示是否保留

---

## 4. 注意事项

- Worktree 创建在 `<repo>/.claude/worktrees/<name>/`，基于 `origin/HEAD` 分支
- 退出时无改动则自动清理；有改动会询问是否保留
- `.env` 等 gitignore 文件不会自动复制，需在项目根目录创建 `.worktreeinclude` 指定
- 建议将 `.claude/worktrees/` 加入 `.gitignore`
- SubAgent 也可使用 worktree 隔离：在 agent frontmatter 中添加 `isolation: worktree`

---

## 5. 手动管理 Worktree

如需更多控制（指定分支、自定义目录位置）：

```bash
# 基于新分支创建 worktree
git worktree add ../project-feature-a -b feature-a

# 基于已有分支创建 worktree
git worktree add ../project-bugfix bugfix-123

# 在 worktree 中启动 Claude
cd ../project-feature-a && claude

# 查看所有 worktree
git worktree list

# 清理
git worktree remove ../project-feature-a
```
