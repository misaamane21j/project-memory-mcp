import { TASK_JSON_SCHEMA } from '../schemas/task-schema.js';

/**
 * Fallback prompt for sync tool
 * Used when project-specific sync.md doesn't exist
 */
export const SYNC_PROMPT = `# Post-Commit Sync

You are helping sync project memory with recent commits.

## Task Schema

${TASK_JSON_SCHEMA}

## Detect Task Structure

Check if tasks-index.json exists:
- **Single-file**: Use tasks-active.json and tasks-completed.json
- **Multi-file**: Use {task sequence}-{tasks status active / pending }_{domain}.json files

## Instructions

1. Get commit history using Bash: \`git log --oneline -20\`. Check for new commits since last sync.

2. Check current codebase state and progress

3. Read current state:
   - Tasks: Single-file (tasks-active.json, tasks-completed.json) or multi-file (all tasks-active/completed_{domain}.json)
   - tasks-index.json (if multi-file)
   - .project-memory/commit-log.md
   - .project-memory/architecture.md
   - CLAUDE.md (project instructions)
   - All spec files in .project-memory/specs/*.md

4. Validate consistency between documentation in project-memory, Claude.md and codebase:

   **Check CLAUDE.md - CRITICAL:**
   - **NEVER leave outdated references in CLAUDE.md**
   - CLAUDE.md MUST always reflect current code implementation
   - Verify: file paths, function names, architectural references, commands
   - Check for: renamed files, deleted modules, changed APIs, deprecated patterns
   - **OUTPUT REQUIRED - Show all inconsistencies found:**
     \`\`\`
     ⚠️ CLAUDE.md Inconsistencies:
     - Line X: References [old path] but file is now at [new path]
     - Line Y: Describes [old pattern] but code now uses [new pattern]
     - Line Z: Command [old cmd] no longer works, should be [new cmd]
     \`\`\`
   - If ANY inconsistencies found → **MUST update CLAUDE.md** (ask user approval first)

   **Check Task System:**
   - Compare active tasks against actual codebase implementation
   - Identify tasks marked "in_progress" but already completed in code
   - Identify tasks marked "pending" but already implemented
   - Identify tasks that are outdated or no longer relevant
   - If inconsistencies found → ask user for approval to update task statuses

   **Check Spec System:**
   - Compare specs (.project-memory/specs/*.md) against implemented features
   - Identify specs that have been fully implemented but not marked complete
   - Identify specs that are outdated or contradicted by current code
   - If spec is outdated → ask user to either:
     * Update spec to match current implementation
     * Mark spec as deprecated (add "DEPRECATED" to filename or frontmatter)
     * Mark spec as impediment if it blocks current work

5. Determine task completions based on commits
   **CRITICAL: Mark task as COMPLETED only when:**
   - Implementation is verified to work (code exists and functions as intended)
   - Tests pass (unit tests, integration tests, or manual verification completed)
   - No blocking issues remain

6. Propose updates via AskUserQuestion:
   - **Documentation updates:**
     * CLAUDE.md corrections (if outdated references found)
     * Spec updates or deprecations (if inconsistencies found)
   - **Task updates:**
     * Update task statuses (completed / pending / outdated)
     * Move completed tasks to appropriate completed file(s)
     * Update tasks-index.json if multi-file (adjust task counts). 
     * In multi-file task system, rename file with the following convention {seq}.{status}.{domain}.json depending on status
   - **Project memory updates:**
     * Update commit-log.md (keep last 20 commits)
     * Update architecture.md if structure changed (keep concise, ≤200 lines)
     * Add new commands, new scripts, new cronjob to useful-commands.md (keep ≤200 lines)
     * Update conventions.md if new patterns established (keep ≤200 lines)

7. After approval, apply changes using Write/Edit tools (respecting task file structure)

**CRITICAL RULES:**

**CLAUDE.md must NEVER be outdated:**
- Sync MUST fix all outdated references in CLAUDE.md
- If code changed → CLAUDE.md MUST be updated to match
- Outdated documentation is worse than no documentation
- Every sync should verify CLAUDE.md accuracy

**Documentation conciseness:**
- Keep all .md files concise (≤100 lines)
- Implementation details belong in code docstrings/comments, NOT markdown
- Only update markdown for essential architecture/setup changes

Remember: Get user approval before writing any files.
`.trim();
