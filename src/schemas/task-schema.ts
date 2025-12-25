/**
 * Task JSON Schema for project-memory-mcp
 * Defines the structure for tasks in tasks-active.json and tasks-completed.json
 */

export interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  acceptanceCriteria?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  acceptanceCriteria: string[];
  dependencies: string[];
  subtasks?: Subtask[];
  specReference?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TaskList {
  tasks: Task[];
}

/**
 * JSON Schema as a string to be included in prompts
 */
export const TASK_JSON_SCHEMA = `
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

Notes:
- tasks-active.json contains tasks with status: pending or in_progress
- tasks-completed.json contains tasks with status: completed
- Claude moves tasks between files when status changes
- subtasks can be nested for breaking down complex tasks
- specReference tracks which spec file the task originated from
`.trim();
