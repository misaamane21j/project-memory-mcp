import { TASK_JSON_SCHEMA } from '../schemas/task-schema.js';

/**
 * Hardcoded init prompt - the ONLY hardcoded prompt in the system
 * All other prompts are project-specific and created during initialization
 */
export const INIT_PROMPT = `
# Project Memory Initialization

Initialize project-memory system: create structure, analyze project, generate prompts, populate memory files.

**CRITICAL:**
- All prompts ≤ 200 lines
- Get user approval before writing files
- Customize everything for this project's tech stack

---

## Step 1: Create Folder Structure

\`\`\`bash
mkdir -p .project-memory/tasks .project-memory/specs .project-memory/prompts
\`\`\`

Full structure will be:
- \`.project-memory/tasks/\` - Task JSON files
- \`.project-memory/specs/\` - Spec markdown files
- \`.project-memory/prompts/\` - Prompt templates
- \`.project-memory/architecture.md\` - Architecture doc
- \`.project-memory/conventions.md\` - Coding conventions
- \`.project-memory/useful-commands.md\` - Common commands
- \`.project-memory/commit-log.md\` - Recent commits

---

## Step 2: Analyze Project

Detect and record:
- **Language(s)**: package.json, requirements.txt, go.mod, Cargo.toml, etc. (note if multi-language)
- **Framework**: React, Next.js, Django, FastAPI, etc.
- **Conventions**: Code style, testing framework, file naming patterns
- **Commands**: npm scripts, make targets, build/test commands
- **Project Scope & Complexity**:
  - Count total lines of code (rough estimate from file count and structure)
  - Estimate task volume: small (<20 tasks), medium (20-100 tasks), large (>100 tasks)
  - Complexity indicators: multi-module/monorepo, external APIs, complex state, deployment stages
  - Check for existing task/work tracking patterns (JIRA, Trello, task files, TODO lists)

**CRITICAL: Check for existing task system:**
- Look for: \`.github/tasks/\`, \`tasks/\`, \`work-items.json\`, \`.tasks/\`, existing \`.project-memory/tasks/\`
- Examine file naming patterns, folder structure, JSON schema if they exist
- Record the pattern to use for consistency

---

## Step 3: Create Generic Prompt Templates

Create 4 files with generic content (customize in Step 4):

### .project-memory/prompts/base.md
Include sections:
- Core Responsibilities (Read/analyze files, git commands, task management)
- Project Memory Structure (list all file paths)
- Task Schema: ${TASK_JSON_SCHEMA}
- Important Rules (user approval, no spec modifications, 200-line limit, JSON format, timestamps)

### .project-memory/prompts/parse-tasks.md
Workflow steps:
1. Detect task storage structure (single-file vs. multi-file based on tasks-index.json presence)
2. Read spec from .project-memory/specs/ or user message
3. Extract tasks (ID, title, description, criteria, dependencies, priority, subtasks)
4. For multi-file projects, assign tasks to appropriate domains
5. Check existing tasks to avoid duplicate IDs (check all relevant domain files if multi-file)
6. Show parsed tasks to user via AskUserQuestion (with target file(s))
7. After approval, update tasks-active.json or tasks-active_{domain}.json files
8. If multi-file, update tasks-index.json with new task counts and domains

### .project-memory/prompts/review.md
Workflow steps:
1. Detect task storage structure (single-file vs. multi-file based on tasks-index.json presence)
2. Ask user for review scope via AskUserQuestion:
   - "Review recent uncommitted changes" (git diff)
   - "Review entire codebase" (full code against architecture/standards)
   - "Review specific file/directory" (focused review of selected area)
3. Based on user choice:
   - Recent changes: Get git diff (unstaged and staged)
   - Full codebase: Read architecture, conventions, key files
   - Specific area: Ask for path, review that section
4. Read context:
   - Tasks: Check single-file (tasks-active.json) or multi-file (relevant tasks-active_{domain}.json)
   - architecture.md, conventions.md, specs/
5. Analyze changes/code for quality, bugs, security, architecture alignment, task progress
6. Propose updates via AskUserQuestion (task status, architecture changes, issues)
7. Apply approved changes (update appropriate task files based on detected structure)

### .project-memory/prompts/sync.md
Workflow steps:
1. Detect task storage structure (single-file vs. multi-file based on tasks-index.json presence)
2. Get commit history (last 20 commits)
3. Read current state:
   - Tasks: Single-file (tasks-active.json, tasks-completed.json) or multi-file (all tasks-active/completed_{domain}.json)
   - commit-log.md, architecture.md, conventions.md
4. Determine task completions (match commits to task IDs, check criteria)
5. Propose updates via AskUserQuestion:
   - Move completed tasks to appropriate completed file(s)
   - Update commit-log.md (keep last 20 commits)
   - Update architecture.md if structure changed
   - Add new commands to useful-commands.md
6. Apply approved changes (update files based on detected task structure)

---

## Step 4: Customize Prompts for This Project

Update the 4 prompt files with project-specific details:
- **Language guidelines**: TypeScript (types, ESLint), Python (PEP 8, type hints), Go (gofmt, go vet), etc.
- **Framework patterns**: React hooks, Django apps, etc.
- **Testing approach**: Jest, pytest, testing patterns
- **Build commands**: Project-specific build/deploy commands
- **Review checklist**: Performance, security patterns from existing claude.md

Keep each file ≤ 200 lines. If multi-language project detected, create .project-memory/prompts/languages/ with language-specific extensions.

---

## Step 5: Create Project Memory Files

Create with content from Step 2 analysis:

### Task Files Structure (Choose Based on Project Scope)

**If existing task pattern found:**
- Use the same pattern/naming convention from Step 2 analysis
- Maintain consistency with existing project structure

**If no existing pattern, choose based on project scope:**

#### Small/Medium Projects (<100 tasks):
Use single files (original pattern):
- \`.project-memory/tasks/tasks-active.json\` - \`{"tasks": []}\`
- \`.project-memory/tasks/tasks-completed.json\` - \`{"tasks": []}\`

#### Large Projects (>100 tasks or complex multi-module):
Use modular structure with domain-specific files:
- \`.project-memory/tasks/tasks-active_{domain}.json\` (e.g., auth, api, ui, database)
- \`.project-memory/tasks/tasks-completed_{domain}.json\`
- \`.project-memory/tasks/tasks-index.json\` - Maps domains and summary stats

Example structure for large project:
\`\`\`
.project-memory/tasks/
├── tasks-index.json                    # Domain registry & stats
├── tasks-active_auth.json              # Auth domain tasks
├── tasks-completed_auth.json
├── tasks-active_api.json               # API domain tasks
├── tasks-completed_api.json
├── tasks-active_ui.json                # UI domain tasks
├── tasks-completed_ui.json
├── tasks-active_database.json          # Database domain tasks
└── tasks-completed_database.json
\`\`\`

**Domains suggested:** Infer from project structure (modules, packages, features)

### architecture.md
Populate with:
- Language & Framework (detected)
- Project Structure (key directories)
- Key Components (entry points, config, tests)
- Dependencies (major libs from package.json/etc.)
- Notes (architectural patterns observed)

### conventions.md
Populate with:
- File Naming (kebab-case, PascalCase, etc.)
- Code Style (formatter: Prettier, Black, gofmt; linter: ESLint, Pylint)
- Testing (framework, file patterns)
- Imports/Modules (style patterns)
- Documentation (JSDoc, docstrings)

### useful-commands.md
Populate with:
- Development (dev server commands)
- Build (build commands)
- Test (test commands)
- Lint/Format (lint/format commands)
- Other (detected commands from package.json scripts or make targets)

### commit-log.md
\`# Commit Log (Last 20 Commits)\\n\\n(Will be populated during first sync)\`

---

## Step 6: Check for Existing CLAUDE.md Content

1. Check if CLAUDE.md or claude.md exists and is >50 lines
2. Analyze for sections: Architecture, Conventions, Commands, Tasks, Specs
3. If substantial content found, ask user via AskUserQuestion:
   - Show detected sections with line counts
   - Offer to organize now using \`project-memory organize\` tool
   - Options: "Yes, organize now (recommended)" or "No, I'll do it manually later"
4. If approved, invoke \`project-memory organize\` tool before Step 7
5. If declined or minimal content, proceed to Step 7

---

## Step 7: Update claude.md

Add this section to CLAUDE.md or claude.md:

\`\`\`markdown
## IMPORTANT: Project Memory System

This project uses \`.project-memory/\` for AI-managed task and context tracking.

**Always check these files at session start:**
- \`.project-memory/tasks/tasks-active.json\` - Current work and priorities
- \`.project-memory/architecture.md\` - System design and structure
- \`.project-memory/conventions.md\` - Coding standards
- \`.project-memory/prompts/base.md\` - Full workflow instructions

**Proactive prompts:** Ask user to parse tasks (new specs), review (before commits), and sync (after commits).
\`\`\`

---

## Final Steps

1. Show summary: folders, prompts, memory files, CLAUDE.md update (including organize if done)
2. Get user confirmation before writing files
3. Write all approved files
4. Confirm success and explain next steps (parse-tasks, review, sync usage)

Done! Project has customized project-memory system.
`.trim();
