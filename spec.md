# Project: `project-memory-mcp` (AI-Orchestrated MCP)

## Type

**MCP Server (Model Context Protocol) – Orchestration Layer**

---

## Purpose

`project-memory-mcp` is a **pure prompt provider** that exposes MCP tools which return instructions, while **all file operations and logic are performed by Claude using its standard tools (Read, Write, Edit, Bash)**.

Goals:

* Keep `claude.md` lean, only reference project memory
* Maintain project memory in `.project-memory/` via Claude-executed instructions
* Ensure tasks, specs, architecture, and commit logs are **updated by Claude with user approval**
* Provide standardized prompts for code review and project sync workflows
* Enable Claude to proactively manage project context

**Key Principle:** MCP server never reads, writes, or executes anything. It only returns prompt text.

---

## Core Principles

1. **MCP is purely a prompt provider**

   * MCP never reads, writes, parses, or executes anything
   * MCP only returns **prompt text with instructions** to Claude
   * Claude uses its standard tools (Read, Write, Edit, Bash) to execute instructions

2. **Claude performs all operations**

   * Reading files → Claude uses `Read` tool
   * Writing files → Claude uses `Write` or `Edit` tools
   * Git operations → Claude uses `Bash` tool
   * Parsing → Claude's reasoning capabilities
   * All operations visible in Claude's tool usage

3. **User consent required**

   * Tasks are **never auto-completed**
   * Prompts instruct Claude to use `AskUserQuestion` for approval before writing changes
   * User sees exactly what Claude will change before it happens

4. **Project memory ownership**

   * Spec files (`specs/*.md`) are **append-only snapshots**
   * Claude parses tasks from specs using `Read`, **does not overwrite specs**
   * Claude handles migration from `claude.md` using `Read` and `Edit` tools

5. **Commit log pruning**

   * Only **last 20 commits** are retained
   * Claude handles pruning using `Bash` (git log) and `Edit` tools

---

## Interface & Subscription Agnostic

**The MCP server is a pure data provider** and works with any Claude interface, regardless of subscription or API access method:

### Supported Interfaces

* **Claude Desktop** (Claude Pro/Team subscription)
* **Claude Code CLI** (Claude Pro/Team subscription)
* **Custom MCP clients** (Anthropic API key)
* **AWS-based clients** (AWS Bedrock)
* **Any other MCP-compatible interface**

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ User's Claude Interface (any):                              │
│ - Claude Desktop (subscription)                             │
│ - Claude Code CLI (subscription)                            │
│ - Custom app (Anthropic API key)                            │
│ - Custom app (AWS Bedrock)                                  │
│                                                              │
│ Claude uses standard tools:                                 │
│ - Read (to read .project-memory files)                      │
│ - Write/Edit (to update files after approval)               │
│ - Bash (to run git commands)                                │
│ - AskUserQuestion (to get approval)                         │
└──────────────┬──────────────────────────────────────────────┘
               │ MCP protocol
               ▼
┌─────────────────────────────────────────────────────────────┐
│  project-memory-mcp Server                                  │
│  - Exposes tools (review, sync, init)                       │
│  - Returns ONLY prompt text with instructions               │
│  - NO file access (read/write)                              │
│  - NO git commands                                          │
│  - NO Claude API calls                                      │
│  - NO API key management                                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

1. **MCP server is a pure prompt provider**
   * Only returns text (prompts and instructions)
   * No file system access whatsoever
   * No git command execution
   * No JSON parsing or data processing
   * Zero API costs from the MCP server

2. **Claude does all the work**
   * User's existing Claude instance (any interface) executes instructions
   * Claude uses Read, Write, Edit, Bash tools for all file operations
   * User sees every tool call Claude makes
   * User approves changes via AskUserQuestion tool

3. **Interface-agnostic design**
   * Same MCP server works with all Claude interfaces
   * No configuration needed for different subscription types
   * No API key management required
   * Works wherever Claude works

---

## Folder & File Structure (Managed by Claude)

```
.project-memory/
├── architecture.md           # Project architecture documentation
├── conventions.md            # Coding conventions and standards
├── useful-commands.md        # Common commands for this project
├── commit-log.md             # Last 20 commits (pruned automatically)
├── tasks/
│   ├── tasks-active.json     # Tasks with status: pending/in_progress
│   └── tasks-completed.json  # Tasks with status: completed
├── specs/
│   └── *.md                  # Immutable spec snapshots (user-created)
└── prompts/
    ├── base.md               # Core instructions (≤200 lines)
    ├── parse-tasks.md        # Task parsing workflow (≤200 lines)
    ├── review.md             # Code review workflow (≤200 lines)
    ├── sync.md               # Post-commit sync workflow (≤200 lines)
    └── languages/            # Optional language-specific extensions
        ├── typescript.md     # (≤200 lines each)
        ├── python.md
        └── go.md
```

**Note:** MCP only provides prompts. **Claude creates this structure** using Write/Bash tools when user calls the `init` tool and approves the setup. Users manually add spec files to `specs/` which are then parsed by the `parse-tasks` tool.

---

## Claude.md Handling

* MCP provides initialization prompt that instructs Claude to add workflow instructions to `claude.md`
* MCP **never reads or modifies** `claude.md` directly
* Claude uses `Read` and `Edit` tools to:

  * Add proactive review/sync prompting instructions (on init)
  * Optionally move sections of existing `claude.md` into `.project-memory/` files
  * Keep `claude.md` minimal and focused
* User approves all changes via `AskUserQuestion`

---

## Task Lifecycle

* Active tasks stored in `tasks/tasks-active.json`
* Completed tasks stored in `tasks/tasks-completed.json`
* **MCP never reads or writes these files**
* MCP prompts instruct Claude to:
  * Use `Read` to load current tasks
  * Parse task structures
  * Determine updates based on commits/specs
  * Use `AskUserQuestion` for user approval
  * Use `Write` or `Edit` to update task files after approval

### Task JSON Schema

**MCP prompts include this schema so Claude knows the correct format:**

```json
{
  "tasks": [
    {
      "id": "string (unique identifier, e.g., TASK-001)",
      "title": "string (brief task description)",
      "description": "string (detailed description)",
      "status": "pending | in_progress | completed",
      "priority": "low | medium | high | critical",
      "acceptanceCriteria": ["string array of criteria"],
      "dependencies": ["array of task IDs this depends on"],
      "subtasks": [
        {
          "id": "string (e.g., TASK-001-1)",
          "title": "string",
          "status": "pending | in_progress | completed",
          "acceptanceCriteria": ["optional criteria"]
        }
      ],
      "specReference": "string (path to spec file, e.g., specs/feature-auth.md)",
      "complexity": "string (optional: simple, moderate, complex)",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "completedAt": "ISO 8601 timestamp (null if not completed)"
    }
  ]
}
```

**Notes:**
- `tasks-active.json` contains tasks with status: pending or in_progress
- `tasks-completed.json` contains tasks with status: completed
- Claude moves tasks between files when status changes
- `subtasks` can be nested for breaking down complex tasks
- `specReference` tracks which spec file the task originated from
- Schema is included in all relevant prompts (parse-tasks, review, sync)

---

## Spec Mutability

* Spec files in `specs/*.md` are **immutable snapshots**
* **MCP never accesses spec files**
* MCP prompts instruct Claude to:
  * Use `Read` to parse tasks from spec files
  * Extract task definitions, requirements, acceptance criteria
  * Never overwrite or modify spec files
  * Keep specs as historical reference

---

## Prompt System

### How Prompts Work

1. **MCP has only one hardcoded prompt:** `init` (bootstrap only)

2. **After initialization, all prompts are project-specific:**
   * `prompts/base.md` - Core instructions (created and customized during init)
   * `prompts/parse-tasks.md` - Task parsing workflow (project-specific)
   * `prompts/review.md` - Review workflow (project-specific)
   * `prompts/sync.md` - Sync workflow (project-specific)
   * Optional: `prompts/languages/` - Additional language-specific extensions

3. **MCP loads and composes prompts** at runtime:
   * `init` tool → Returns hardcoded bootstrap instructions
   * `parse-tasks` tool → Reads `base.md` + `parse-tasks.md` from `.project-memory/prompts/`
   * `review` tool → Reads `base.md` + `review.md` from `.project-memory/prompts/`
   * `sync` tool → Reads `base.md` + `sync.md` from `.project-memory/prompts/`
   * Returns composed prompt text to Claude
   * Claude executes the instructions using its tools

### Prompt Creation (Init Flow)

**Step 1: Create generic prompt templates**
* MCP provides init instructions for Claude to create:
  * `prompts/base.md` - Generic core instructions
  * `prompts/parse-tasks.md` - Generic task parsing workflow
  * `prompts/review.md` - Generic review workflow
  * `prompts/sync.md` - Generic sync workflow

**Step 2: Analyze and customize for project**
* Init instructions tell Claude to:
  * Detect project language (TypeScript, Python, Go, etc.)
  * Analyze project structure and conventions
  * Read existing `claude.md` for project context
  * Update `parse-tasks.md`, `review.md`, and `sync.md` with project-specific instructions
  * Add language-specific guidelines
  * Tailor workflows to project architecture
  * Define task structure schema appropriate for project type

**Step 3: Use project-specific prompts**
* When `parse-tasks`, `review`, or `sync` are called, MCP reads project-specific prompts
* No hardcoded defaults used after initialization
* User can edit prompts anytime to refine behavior

### **HARD RULE: Prompt Size Limit**

**CRITICAL CONSTRAINT:**
* **Each prompt file (.md) MUST NOT exceed 200 lines**
* This prevents context bloat when prompts are sent to Claude
* Init instructions MUST enforce this limit
* If customization requires more content, split into multiple focused prompts in `languages/` folder

**Enforcement:**
* Init prompt instructs Claude to keep prompts concise
* `base.md` - Max 200 lines (core instructions only)
* `parse-tasks.md` - Max 200 lines (task parsing workflow only)
* `review.md` - Max 200 lines (review workflow only)
* `sync.md` - Max 200 lines (sync workflow only)
* Language-specific extensions - Max 200 lines each

**If prompts grow too large:**
* Claude should warn user during init
* Suggest splitting into language-specific files
* Keep instructions focused and actionable

---

## MCP Tools (Pure Prompt Providers)

The MCP server **only provides prompts and instructions**. It never reads, writes, or modifies files.

### 1. `init`

**Returns:** System prompt + instructions for first-time setup

**Prompt contains instructions for Claude to:**
* Check if `.project-memory/` exists
* Create folder structure if needed
* Generate initial prompt templates in `.project-memory/prompts/`
* Analyze project (language, structure, conventions)
* Customize `review.md`, `sync.md`, `parse-tasks.md` for this project
* Add instructions to `claude.md` for proactive review/sync prompting
* Create empty `tasks-active.json`, `tasks-completed.json`, `architecture.md`, etc.

---

### 2. `parse-tasks`

**Returns:** System prompt + instructions for parsing tasks from specs/plans

**Prompt contains instructions for Claude to:**
* Use `Read` tool to read spec files from `.project-memory/specs/*.md`
* Use `Read` tool to read implementation plans (if provided by user)
* Parse and extract tasks with structure:
  * Task ID
  * Title/description
  * Acceptance criteria
  * Dependencies
  * Estimated complexity
  * Status (always "pending" for newly parsed tasks)
* Use `Read` to check existing `tasks-active.json` to avoid duplicates
* Generate new tasks in proper JSON schema format
* Use `AskUserQuestion` to show parsed tasks and get approval
* Use `Write` or `Edit` to update `tasks-active.json` with new tasks
* Optionally update `architecture.md` if spec implies architectural changes

---

### 3. `review`

**Returns:** System prompt + instructions for code review

**Prompt contains instructions for Claude to:**
* Use `Bash` tool to get `git diff` and `git diff --cached`
* Use `Read` tool to read `.project-memory/tasks/tasks-active.json`
* Use `Read` tool to read `.project-memory/specs/*.md`
* Use `Read` tool to read `.project-memory/architecture.md`
* Analyze code changes against project context
* Identify issues, propose task/architecture updates
* Use `AskUserQuestion` for approval
* Use `Write` or `Edit` tools to apply approved changes

---

### 4. `sync`

**Returns:** System prompt + instructions for post-commit sync

**Prompt contains instructions for Claude to:**
* Use `Bash` tool to get recent commit history (`git log`)
* Use `Read` tool to read current tasks, architecture, commit log
* Determine which tasks were completed based on commits
* Move completed tasks from `tasks-active.json` to `tasks-completed.json`
* Prune `.project-memory/commit-log.md` to last 20 commits
* Update `.project-memory/architecture.md` if code structure changed
* Extract new commands to `.project-memory/useful-commands.md`
* Use `AskUserQuestion` for approval
* Use `Write` or `Edit` tools to apply approved changes

---

**Key Point:** The MCP server itself **never executes these instructions**. It only provides them to Claude, who uses standard tools (Read, Write, Bash, Edit, AskUserQuestion) to complete the work.

---

## Workflow Integration (Claude-Driven)

**No git hooks required.** Instead, Claude proactively prompts users at the right times.

### Initialization: Claude.md Instructions

On first run, MCP instructs Claude to add to `claude.md`:

```markdown
## Project Memory Protocol

**When user provides a new spec or implementation plan:**
- Ask user: "Would you like me to parse tasks from this spec/plan?"
- If yes, use `project-memory parse-tasks` tool
- Extract tasks with IDs, descriptions, acceptance criteria, dependencies
- Show parsed tasks to user for approval
- Add to tasks-active.json after approval

**Before every commit:**
- Ask user: "Would you like me to review your changes before committing?"
- If yes, use `project-memory review` tool
- Show proposed architecture/task updates
- Get user approval before applying

**After every commit (or when session starts):**
- Check for uncommitted syncs
- Ask user: "Would you like me to sync project memory with your latest commits?"
- If yes, use `project-memory sync` tool
- Update tasks, architecture, commit log
- Get user approval before applying

**Session Start:**
- Check for pending reviews/syncs
- Check if new specs exist without parsed tasks
- Proactively remind user if project memory is out of sync
```

### Why This Works

* ✅ Uses existing Claude subscription (no API key needed)
* ✅ Claude proactively reminds users at the right times
* ✅ User has full control (can skip if busy)
* ✅ Works in Claude Desktop, Claude Code CLI, any interface
* ✅ No cost beyond subscription

---

## Operations Delegated to Claude (All File Operations)

| Operation                   | Tool Claude Uses               | Requires User Approval | Via MCP Tool    |
| --------------------------- | ------------------------------ | ---------------------- | --------------- |
| Get git diff                | `Bash` (git diff)              | No                     | review          |
| Read project memory files   | `Read`                         | No                     | all tools       |
| Create folder structure     | `Bash` (mkdir) or `Write`      | Yes                    | init            |
| Parse tasks from spec       | `Read` + Claude reasoning      | Yes                    | parse-tasks     |
| Add tasks to active list    | `Write` or `Edit`              | Yes                    | parse-tasks     |
| Update tasks (mark done)    | `Write` or `Edit`              | Yes                    | sync            |
| Move content from Claude.md | `Read` + `Edit`                | Yes                    | init            |
| Prune commit-log            | `Read` + `Edit`                | Yes                    | sync            |
| Update architecture         | `Read` + `Edit`                | Yes                    | review/sync     |
| Generate prompts            | `Write`                        | Yes                    | init            |
| Get commit history          | `Bash` (git log)               | No                     | sync            |

**MCP's role:** Only provides instructions. Claude does all execution.

---

## MCP Responsibilities (Pure Prompt Provider)

**The MCP server is EXTREMELY limited in what it does:**

### What MCP NEVER Does:
- ❌ Reads project files (code, tasks, specs, architecture, commit-log, etc.)
- ❌ Writes project files
- ❌ Executes git commands
- ❌ Parses JSON or any data
- ❌ Updates tasks or project memory
- ❌ Makes decisions about code

### What MCP DOES Do:

1. **Exposes four MCP tools:**
   - `init` → Returns prompt/instructions for first-time setup
   - `parse-tasks` → Returns prompt/instructions for parsing tasks from specs/plans
   - `review` → Returns prompt/instructions for code review workflow
   - `sync` → Returns prompt/instructions for post-commit sync workflow

2. **Loads and composes prompt templates:**
   - Has ONE hardcoded prompt: `init` (bootstrap only)
   - After init, reads project-specific prompts from `.project-memory/prompts/`
   - `parse-tasks` → loads `base.md` + `parse-tasks.md`
   - `review` → loads `base.md` + `review.md`
   - `sync` → loads `base.md` + `sync.md`
   - Validates each prompt file is ≤ 200 lines (warns if exceeded)
   - Combines and returns composed prompt text to Claude
   - Only reads prompt files (NEVER reads project code, tasks, specs, etc.)

3. **Provides schemas and formats:**
   - Includes JSON schemas for tasks, architecture, etc. in prompts
   - Defines expected file structures
   - Claude uses these schemas when writing files

---

## Installation

* Single command install via npm/MCP registry
* Public repository
* Minimal config
* On first run: adds proactive instructions to `claude.md`
* No git hooks required (Claude-driven workflow)

---

## Key Design Decisions (Summary)

| Concern            | Decision                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| MCP role           | **Pure prompt provider** - returns instructions only, never touches files     |
| File operations    | **Claude uses Read/Write/Edit/Bash tools** - MCP provides zero file access   |
| Task parsing       | User adds specs to `.project-memory/specs/`; parse-tasks tool extracts tasks |
| Task lifecycle     | Claude asks user for approval; MCP never completes tasks                      |
| Task schema        | Defined in prompts; includes ID, title, status, priority, dependencies, etc.  |
| Spec mutability    | Spec files are immutable; Claude parses tasks from them                       |
| Claude.md          | MCP provides init prompt to add proactive instructions; Claude executes       |
| Commit log pruning | Last 20 commits; Claude uses Edit tool after user approval                    |
| Prompt generation  | Init creates base/parse-tasks/review/sync.md; Claude customizes per project  |
| Prompt structure   | Base + specific (parse-tasks/review/sync); composed at runtime                |
| Prompt size limit  | **HARD RULE: Each .md file ≤ 200 lines** - prevents context bloat            |
| Workflow trigger   | Claude-driven: proactively prompts user before/after commits                  |
| Git hooks          | Not required; Claude handles prompting via claude.md instructions             |
| API access         | Uses user's Claude subscription; no separate API key needed                   |
| Folder structure   | Claude creates using Bash/Write tools; MCP just provides instructions         |
| MCP tools          | `init`, `parse-tasks`, `review`, `sync` - each returns prompt text only       |

