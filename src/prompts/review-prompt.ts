import { TASK_JSON_SCHEMA } from '../schemas/task-schema.js';

/**
 * Fallback prompt for review tool
 * Used when project-specific review.md doesn't exist
 */
export const REVIEW_PROMPT = `# Code Review

You are helping review code changes.

**IMPORTANT: Use extended thinking for this review.**
- Think carefully and thoroughly before providing feedback
- Analyze each file/change methodically
- Consider edge cases, security implications, and architectural impact
- Do not rush - a thorough review catches issues early

## Review Scope

Before proceeding, ask the user what they want to review:

**Use AskUserQuestion with these options:**
- "Review recent uncommitted changes" - Reviews git diff (staged and unstaged)
- "Review entire codebase" - Comprehensive review of all code against architecture and standards
- "Review specific file or directory" - Focused review of user-selected area

Get user's choice before proceeding.

---

## Task Schema

${TASK_JSON_SCHEMA}

## Detect Task Structure

Check if tasks-index.json exists:
- **Single-file**: Use tasks-active.json and tasks-completed.json
- **Multi-file**: Use tasks-active_{domain}.json and tasks-completed_{domain}.json

## Instructions (based on chosen scope)

### For Recent Changes:
1. Get git diff: \`git diff\` and \`git diff --cached\`
2. Read context:
   - Tasks: tasks-active.json (or tasks-active_{domain}.json if multi-file)
   - .project-memory/architecture.md
   - .project-memory/specs/*.md (if relevant)
3. **OUTPUT REQUIRED - Change Context:**
   \`\`\`
   📝 Change Summary:
   - Files modified: [list]
   - Purpose: [what problem does this solve / what feature does it add]
   - Benefit: [why is this change valuable]
   - Related task: [TASK-XXX if applicable]
   \`\`\`
4. **Assess codebase relevancy:**
   - Does change align with architecture? [yes/no + explanation]
   - Does change follow conventions? [yes/no + explanation]
   - Impact on existing code: [none/low/medium/high + areas affected]
5. Analyze for issues:
   - Code quality, bugs, security violations
   - **Security**: hardcoded secrets, .env committed, API keys in code
   - Task progress alignment

### For Entire Codebase:
1. Read: architecture.md, conventions.md, tasks-active.json
2. Scan codebase: src/, lib/, tests/, config files
3. **OUTPUT REQUIRED - Codebase Overview:**
   \`\`\`
   🏗️ Implementation Overview:

   Architecture:
   - Pattern: [e.g., MVC, microservices, monolith]
   - Key components: [list main modules/services]
   - Data flow: [how data moves through system]

   Tech Stack:
   - Language: [with version]
   - Framework: [if any]
   - Key dependencies: [major libraries]

   Code Health:
   - Test coverage: [high/medium/low/none]
   - Documentation: [inline/external/missing]
   - Technical debt: [areas needing attention]
   \`\`\`
4. Analyze for:
   - Architectural consistency
   - Convention adherence
   - **Security violations**: secrets, .env in git, API keys, port conflicts
   - Unfinished task implementations

### For Specific Area:
1. Ask user for file/directory path
2. Read files, compare against conventions/architecture
3. **Provide context:** What this area does, how it fits in the system
4. Check for security violations
5. Check if part of active tasks

## Final Step

4. Propose updates via AskUserQuestion:
   - Task status changes
     **CRITICAL: Mark task as COMPLETED only when:**
     • Implementation is verified to work (code exists and functions as intended)
     • Tests pass (unit tests, integration tests, or manual verification completed)
     • No blocking issues remain
   - Architecture updates
   - Issues found (with severity: critical/high/medium/low)
5. After approval, apply changes using Write/Edit tools

Remember: Get user approval before writing any files.
`.trim();
