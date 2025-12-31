import { TASK_JSON_SCHEMA } from '../schemas/task-schema.js';

/**
 * Organize/migrate existing CLAUDE.md into project-memory structure
 * This is a one-time migration tool for existing projects
 */
export const ORGANIZE_PROMPT = `
# Organize CLAUDE.md into Project Memory

Migrate existing CLAUDE.md into project-memory structure, ONLY migrating content validated against actual codebase.

**CRITICAL: Code is source of truth. DISCARD outdated documentation.**

---

## Step 1: Check Initialization

Run: \`ls -la .project-memory 2>/dev/null || echo "Not initialized"\`

If not initialized, run \`project-memory init\` first, then return.

---

## Step 2: Analyze & Validate

1. **Read CLAUDE.md** (or claude.md, check both)
2. **Identify sections:** Architecture, Conventions, Commands, Tasks, Specs (mark line numbers)
   - architecture: system design, diagrams, components
   - conventions: coding standards, style guides, patterns
   - commands: dev/build/test commands, scripts, cronjobs
   - specs/documentation: identify individual specs in .md format
   - tasks: identify task lists, statuses, acceptance criteria
3. **Validate against actual code:**
   - Read: package.json, tsconfig.json, src/, tests/, scripts/
   - Check tech stack vs actual dependencies
   - Check commands vs package.json scripts/Makefile
   - Check conventions vs .eslintrc/.prettierrc/actual code
   - Check tasks vs actual implementation (completed or not)
   - Check specs vs implemented features

**OUTPUT REQUIRED - Show user:**
- Sections found: [with line numbers]
- **Tasks found:** [list ALL tasks with IDs, descriptions, status]
- **Specs found:** [list ALL specs with titles, line numbers]
- Outdated content: [specific items that contradict code]
- Valid content: [passes validation]
- Content to DISCARD: [fails validation]

**MANDATORY QUESTION - Ask via AskUserQuestion:**
"Found X tasks and Y specs and CLAUDE.md is over X lines. How should we organize them?
1. Migrate all tasks to .project-memory/tasks/
2. Migrate all specs to .project-memory/specs/
3. Migrate only validated tasks/specs (discard outdated)
4. Skip task/spec migration (organize architecture/conventions/commands only)"

**CHECKPOINT: Get user approval on what to migrate vs discard** 
**AWLAYS: offer to migrate specs / task if found**

---

## Step 3: Migration Plan & Approval

Present migration plan via AskUserQuestion:

\`\`\`
📐 Architecture (X lines) → .project-memory/architecture.md
📋 Conventions (X lines) → .project-memory/conventions.md
⚡ Commands (X lines) → .project-memory/useful-commands.md
✅ Tasks (X items) → .project-memory/tasks/tasks-active.json, .project-memory/tasks/tasks-completed.json
📄 Specs (X files) → .project-memory/specs/*.md

❌ DISCARDING: [outdated tech, deprecated commands, outdated conventions, irrelevant specs]
✅ MIGRATING: [validated content only]

Proceed?
\`\`\`

**Get explicit approval before proceeding.**

---

## Step 4: Migrate Validated Content

**CRITICAL: Migrate ALL approved tasks/specs - do NOT skip any**

For each validated section, migrate to appropriate file:

**Architecture/Conventions/Commands:**
1. Read validated content from CLAUDE.md (skip outdated parts)
2. Check if target file exists in \`.project-memory/\`
3. If exists → Ask user: "Replace or merge with existing file?"
4. Write validated content only (architecture.md, conventions.md, useful-commands.md)
5. **Keep concise (≤100 lines)** - Implementation details belong in code, not markdown

**Tasks - REQUIRED if user approved task migration:**
1. **MUST migrate ALL approved tasks** - Track progress: "Migrating task X of Y"
2. Parse each task to JSON format: ${TASK_JSON_SCHEMA}
3. Read existing tasks-active.json (or tasks-active_{domain}.json if multi-file)
4. Merge (avoid duplicate IDs)
5. Task rules: unique IDs (TASK-001), status based on validation ("pending" or "completed")
6. **OUTPUT REQUIRED:** Show migrated count: "Migrated X tasks to .project-memory/tasks/"
7. Ask user for permission to delete existing task files/folder in CLAUDE.md

**Specs - REQUIRED if user approved spec migration:**
1. **MUST migrate ALL approved specs** - Track progress: "Migrating spec X of Y"
2. Create .md file per spec in \`.project-memory/specs/\`
3. Descriptive filenames (feature-auth.md, api-redesign.md)
4. Add header: "This is an immutable spec"
5. **Keep each spec ≤200 lines** - Split if needed (use modular spec pattern)
6. **OUTPUT REQUIRED:** Show migrated count: "Migrated Y specs to .project-memory/specs/"
---

## Step 5: Update CLAUDE.md

Replace migrated sections with references using \`Edit\` tool:

- Architecture → "See .project-memory/architecture.md"
- Conventions → "See .project-memory/conventions.md"
- Commands → "See .project-memory/useful-commands.md"
- Tasks → "See .project-memory/tasks/tasks-active.json"
- Specs → "See .project-memory/specs/"

**CRITICAL:** Keep "Project Memory System" section from init!

---

## Step 6: Verify & Summarize

**CRITICAL: Verify all tasks/specs were organized**

1. **Re-read CLAUDE.md** - Check if any tasks/specs remain
2. **If tasks/specs still in CLAUDE.md:**
   - **STOP** - Ask user: "Found unmigrated tasks/specs in CLAUDE.md. Should I migrate them now?"
   - If yes → Return to Step 4
   - If no → Document in summary which tasks/specs were intentionally left
3. **List \`.project-memory/\` contents**
4. **Show summary:**

\`\`\`
✅ Migration complete!

Migrated:
- Architecture: [X lines] → .project-memory/architecture.md
- Conventions: [Y lines] → .project-memory/conventions.md
- Commands: [Z lines] → .project-memory/useful-commands.md
- Tasks: [N tasks] → .project-memory/tasks/tasks-active.json
- Specs: [M specs] → .project-memory/specs/*.md

Discarded: [outdated content items]
CLAUDE.md reduced from X to Y lines

✅ Verification: No orphaned tasks/specs remain in CLAUDE.md

Next: review, parse-tasks, sync workflows
\`\`\`

---

## Rules

- Get user approval before changes
- Validate against code (ONLY migrate matching content)
- DISCARD outdated (old tech, deprecated commands, existing tasks system already in project-memory)
- Keep .md files concise (≤100 lines) - implementation details go in code docstrings/comments
- Ask before merging existing files
- Code is source of truth

Done!
`.trim();
