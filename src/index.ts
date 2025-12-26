#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { INIT_PROMPT } from './prompts/init-prompt.js';
import { ORGANIZE_PROMPT } from './prompts/organize-prompt.js';
import { composePrompt, getProjectRoot } from './utils/prompt-loader.js';
import { TASK_JSON_SCHEMA } from './schemas/task-schema.js';

/**
 * Project Memory MCP Server
 *
 * A pure prompt provider that returns instructions for Claude to execute.
 * Never reads/writes project files directly - only loads prompt templates.
 */

const server = new Server(
  {
    name: 'project-memory-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'init',
        description:
          'Initialize project memory system. Creates folder structure, generates project-specific prompts, and sets up claude.md instructions. Only run once per project.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'parse-tasks',
        description:
          'Parse tasks from spec files or implementation plans. Extracts tasks with IDs, descriptions, acceptance criteria, dependencies, and adds them to tasks-active.json after user approval.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'review',
        description:
          'Review uncommitted code changes. Analyzes git diff, checks against current tasks and architecture, identifies issues, and proposes task/architecture updates for user approval.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'sync',
        description:
          'Sync project memory with recent commits. Updates tasks (marks completed), prunes commit log to last 20 commits, updates architecture if needed, and extracts new commands.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'organize',
        description:
          'Organize existing CLAUDE.md into project-memory structure. Migrates architecture, conventions, commands, tasks, and specs from CLAUDE.md to .project-memory/ files while keeping minimal references. Requires user approval.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls - returns prompts only, never executes operations
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const projectRoot = getProjectRoot();

  try {
    let prompt: string;

    switch (name) {
      case 'init':
        // Only hardcoded prompt in the system
        prompt = INIT_PROMPT;
        break;

      case 'parse-tasks':
        prompt = await composePrompt(
          projectRoot,
          'parse-tasks.md',
          `# Task Parsing

You are helping parse tasks from a spec or implementation plan.

## Task Schema

${TASK_JSON_SCHEMA}

## Instructions

### Step 1: Detect Task Storage Structure

Check .project-memory/tasks/ to determine file organization:

**Single-file structure (small/medium projects):**
- \`tasks-active.json\` - Contains all active tasks
- \`tasks-completed.json\` - Contains all completed tasks

**Multi-file structure (large projects):**
- \`tasks-index.json\` - Domain registry and metadata
- \`tasks-active_{domain}.json\` - Domain-specific active tasks
- \`tasks-completed_{domain}.json\` - Domain-specific completed tasks

If \`tasks-index.json\` exists, use multi-file structure. Otherwise use single-file.

### Step 2: Parse Tasks from Spec

1. Read the spec file from .project-memory/specs/ or from the user's message
2. Extract tasks with unique IDs (TASK-001, TASK-002, etc.)
3. Assign to domains if multi-file structure (infer from task description/type)
4. Include: title, description, acceptance criteria, dependencies, priority, subtasks if needed
5. Set specReference field to the spec file path

### Step 3: Check for Duplicates

**For single-file structure:**
- Check existing tasks in .project-memory/tasks/tasks-active.json

**For multi-file structure:**
- Check all relevant \`tasks-active_{domain}.json\` files to avoid duplicate IDs
- Update tasks-index.json to register new domains if needed

### Step 4: Show Parsed Tasks to User

- Display parsed tasks via AskUserQuestion for approval
- Show which file(s) they will be written to

### Step 5: Update Task Files After Approval

**For single-file structure:**
- Update tasks-active.json using Write or Edit tool

**For multi-file structure:**
- Update relevant \`tasks-active_{domain}.json\` file(s)
- Update \`tasks-index.json\` with new task counts and domains

Remember: Get user approval before writing any files.
`.trim()
        );
        break;

      case 'review':
        prompt = await composePrompt(
          projectRoot,
          'review.md',
          `# Code Review

You are helping review code changes.

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
1. Get git diff using Bash: \`git diff\` and \`git diff --cached\`
2. Read current context:
   - Tasks: Single-file (tasks-active.json) or multi-file (all tasks-active_{domain}.json)
   - .project-memory/architecture.md
   - .project-memory/specs/*.md (if relevant)
3. Analyze changes for:
   - Code quality issues
   - Potential bugs or security issues
   - Alignment with architecture
   - Task progress

### For Entire Codebase:
1. Read codebase structure from .project-memory/architecture.md
2. Review key files and components against:
   - .project-memory/conventions.md (coding standards)
   - .project-memory/architecture.md (design compliance)
   - Tasks: Single-file (tasks-active.json) or multi-file (relevant tasks-active_{domain}.json)
3. Analyze for:
   - Architectural consistency
   - Adherence to conventions
   - Technical debt
   - Unfinished tasks implementation

### For Specific Area:
1. Ask user to specify file/directory path
2. Read relevant files in that area
3. Compare against conventions and architecture
4. Check if files are part of any active tasks

## Final Step

4. Propose updates via AskUserQuestion:
   - Task status changes
   - Architecture updates
   - Issues found (with severity: critical/high/medium/low)
5. After approval, apply changes using Write/Edit tools

Remember: Get user approval before writing any files.
`.trim()
        );
        break;

      case 'sync':
        prompt = await composePrompt(
          projectRoot,
          'sync.md',
          `# Post-Commit Sync

You are helping sync project memory with recent commits.

## Task Schema

${TASK_JSON_SCHEMA}

## Detect Task Structure

Check if tasks-index.json exists:
- **Single-file**: Use tasks-active.json and tasks-completed.json
- **Multi-file**: Use tasks-active_{domain}.json and tasks-completed_{domain}.json

## Instructions

1. Get commit history using Bash: \`git log --oneline -20\`
2. Read current state:
   - Tasks: Single-file (tasks-active.json, tasks-completed.json) or multi-file (all tasks-active/completed_{domain}.json)
   - tasks-index.json (if multi-file)
   - .project-memory/commit-log.md
   - .project-memory/architecture.md
3. Determine task completions based on commits
4. Propose updates via AskUserQuestion:
   - Move completed tasks to appropriate completed file(s)
   - Update tasks-index.json if multi-file (adjust task counts)
   - Update commit-log.md (keep last 20 commits)
   - Update architecture.md if structure changed
   - Add new commands to useful-commands.md
5. After approval, apply changes using Write/Edit tools (respecting task file structure)

Remember: Get user approval before writing any files.
`.trim()
        );
        break;

      case 'organize':
        // Organize/migrate existing CLAUDE.md into project-memory
        prompt = ORGANIZE_PROMPT;
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Project Memory MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
