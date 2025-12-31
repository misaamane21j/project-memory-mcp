/**
 * Refresh project-specific prompts with new templates while preserving customizations
 * Used when prompt system evolves and users want to update their projects
 */
export const REFRESH_PROMPTS_PROMPT = `# Refresh Project Memory Prompts

Update prompt templates with latest improvements while preserving project-specific customizations.

**CRITICAL: Backup existing prompts before any changes. Get user approval for all modifications.**

---

## Step 1: Verify & Backup

**REQUIRED checks:**
1. Check if \`.project-memory/prompts/\` exists: \`ls -la .project-memory/prompts/ 2>/dev/null\`
2. If NOT exists → **STOP**: "Project memory not initialized. Run \`project-memory init\` first."
3. **Create backup:** \`cp -r .project-memory/prompts .project-memory/prompts.backup-$(date +%Y%m%d-%H%M%S)\`
4. **Confirm backup:** Show backup path to user

**CHECKPOINT:** Wait for backup confirmation before proceeding

---

## Step 2: Load & Compare Prompts

**IMPORTANT: Only refresh workflow prompts (parse-tasks.md, review.md, sync.md)**
- **SKIP base.md** - It's always project-specific (generated from codebase during init)
- base.md should only be updated manually or via \`project-memory sync\`

**For each workflow prompt (parse-tasks.md, review.md, sync.md):**

1. **Read current prompt** from \`.project-memory/prompts/[file]\`
2. **Load new template** from fallback (same templates used in init)
3. **Compare by sections** (not line-by-line) to identify differences

**OUTPUT REQUIRED - For each file:**

\`\`\`
📄 [filename] Analysis:

✅ Template sections (standard workflow steps):
- [section name]: matches template

🔧 Customizations found (project-specific additions):
- [section]: "[custom rule or check]"

⚠️ Deprecated (removed in new template):
- [section or rule]

📊 New improvements (in new template):
- [section]: [what it adds]
\`\`\`

**Note:** Skipping base.md (always project-specific)

**CHECKPOINT:** Show analysis before proceeding

---

## Step 3: Ask User How to Proceed

**MANDATORY QUESTION - Ask via AskUserQuestion:**

"Analyzed prompt files. Found:
- X customizations across Y files
- Z deprecated sections
- N new template improvements

How should we refresh the prompts?

1. **Regenerate with new templates + preserve customizations** (Recommended)
   - Merges your customizations into updated templates
   - Re-analyzes codebase for project-specific content
   - You review merged result before applying

2. **Regenerate with new templates only**
   - Uses latest templates without customizations
   - Faster, but loses your project-specific rules
   - ⚠️ Warning: All customizations will be discarded

3. **Keep current prompts**
   - No changes made
   - Skip refresh entirely

4. **Show detailed diff first**
   - See side-by-side comparison for each file
   - Then choose option 1, 2, or 3"

**CHECKPOINT:** Get user choice

---

## Step 4a: If Option 1 - Merge Customizations

**Re-analyze codebase (same as init Step 2):**

1. Read: package.json OR requirements.txt OR go.mod OR Cargo.toml
2. Scan: src/, lib/, components/, tests/ directories
3. Find: config files (.eslintrc, tsconfig.json, etc.)
4. Read: CLAUDE.md for existing context

**For each prompt file:**

1. **Start with NEW template** as base structure
2. **Identify customization insertion points:**
   - Language-specific rules → Add to relevant sections
   - Review checklists → Add to review.md checklist section
   - Task patterns → Add to parse-tasks.md task structure section
   - Special attention areas → Add to appropriate prompt sections

3. **Inject preserved customizations:**
   - Match customization purpose to new template sections
   - Preserve custom language (user's words, not paraphrased)
   - Add comment markers: \`<!-- CUSTOM: [description] -->\` for future refreshes

4. **Show merged result - OUTPUT REQUIRED:**
   \`\`\`
   📝 Merged [filename]:

   New template sections: [list]
   Preserved customizations: [list with line numbers]
   Deprecated sections removed: [list]

   [Show full merged content or key sections]
   \`\`\`

**CHECKPOINT:** Ask user: "Review merged prompts. Approve to write files?"

5. **After approval - OVERWRITE existing files:**
   - **CRITICAL:** Write directly to \`.project-memory/prompts/[filename]\`
   - **DO NOT** create \`.new\` files or any other suffix
   - **DO NOT** create backup copies here (already done in Step 1)
   - Use Write tool to overwrite: parse-tasks.md, review.md, sync.md
   - **SKIP base.md** - Do not modify it
6. **Verify line counts:** Each prompt ≤200 lines

---

## Step 4b: If Option 2 - Regenerate Without Customizations

**Warn user:**
"⚠️ This will discard all customizations. Are you sure?
- Lost customizations: [list what will be discarded]
- You can restore from backup at: [backup path]

Proceed?"

**If yes:**
1. Re-analyze codebase (same as Step 4a, items 1-4)
2. Generate fresh prompts with new templates + codebase analysis
3. **OVERWRITE existing files** - Write directly to \`.project-memory/prompts/[filename]\`
   - **DO NOT** create \`.new\` files
   - Only write: parse-tasks.md, review.md, sync.md
   - **SKIP base.md**
4. **Do NOT include** old customizations

---

## Step 4c: If Option 3 - Keep Current

**Confirm:** "Keeping current prompts. No changes made. Backup preserved at: [backup path]"

**STOP** - Exit workflow

---

## Step 4d: If Option 4 - Show Detailed Diff

**For each file, show side-by-side comparison:**

\`\`\`
📊 Diff for [filename]:

CURRENT (your version)          NEW TEMPLATE
─────────────────────          ────────────────
[line 1]                       [line 1]
[line 2] 🔧 CUSTOM             [line 2]
[line 3]                       [line 3]
...                            ...

Legend:
✅ Same in both
🔧 Custom (only in current)
📊 New (only in new template)
⚠️ Deprecated (removed in new)
\`\`\`

**After showing all diffs, return to Step 3**

---

## Step 5: Verify & Summarize

1. **List updated prompts:** \`ls -lh .project-memory/prompts/\`
2. **Show summary:**

\`\`\`
✅ Prompt refresh complete!

Updated files:
- parse-tasks.md ([X] lines)
- review.md ([Y] lines)
- sync.md ([Z] lines)

Skipped: base.md (project-specific, not refreshed)

Customizations preserved: [list]
New improvements added: [list]
Backup location: .project-memory/prompts.backup-[timestamp]/

Next steps:
- Test prompts with: project-memory parse-tasks, review, sync
- Restore from backup if needed: cp -r [backup path] .project-memory/prompts/
\`\`\`

---

## Rules

- **Skip base.md** - It's always project-specific, never refresh it
- **Only refresh workflow prompts** - parse-tasks.md, review.md, sync.md
- **OVERWRITE files directly** - Do NOT create .new files or any suffix
- **Always backup first** - Never modify without backup
- **Get user approval** - For analysis results and merged content
- **Preserve exact custom language** - Don't paraphrase user's customizations
- **Re-analyze codebase** - Ensure project-specific content is current
- **Line limits** - Each prompt ≤200 lines
- **Verify before writing** - Show merged result, get approval

Done!
`.trim();
