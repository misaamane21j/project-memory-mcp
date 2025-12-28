/**
 * Create spec from user message or file content
 * Ensures project memory is synced, validates against codebase, considers security/maintainability
 * Supports modular specs (≤200 lines each) to avoid token limits
 */
export const CREATE_SPEC_PROMPT = `# Create Specification

Create detailed, actionable spec from user requirements, validated against existing codebase.

**CRITICAL: Specs must be clear for coding agents, secure, maintainable, with test cases.**
**CRITICAL: Each spec file ≤200 lines (token limit). Use modular specs for complex features.**

---

## Step 1: Initialize & Sync Project Memory

**REQUIRED - Do NOT skip:**
1. Check if \`.project-memory/\` exists: \`ls -la .project-memory 2>/dev/null\`
2. If NOT exists → Run \`project-memory init\` first, then return to this workflow
3. If exists → Run \`project-memory sync\` to ensure latest codebase state
4. **CHECKPOINT:** Wait for sync completion before proceeding

---

## Step 2: Determine Spec Structure

**Ask user via AskUserQuestion:**
"Is this a large/complex feature that should be split into multiple spec files?

Options:
1. Single spec (simple features, ≤200 lines total)
2. Modular specs (complex features, multiple files ≤200 lines each)

Choose based on:
- Multiple domains (backend + frontend + infra)
- Large scope (authentication system, payment integration, admin dashboard)
- Cross-cutting concerns (security, testing, performance)"

**If modular (Option 2):**
Plan spec structure:
- \`[feature]-overview.md\` (≤100 lines) - Master spec with links
- \`[feature]-backend.md\` (≤200 lines) - API, database, business logic
- \`[feature]-frontend.md\` (≤200 lines) - UI components, user flows
- \`[feature]-security.md\` (≤200 lines) - Auth, validation, OWASP
- \`[feature]-tests.md\` (≤200 lines) - Test strategy, cases
- \`[feature]-tasks.md\` (≤200 lines) - Implementation plan

**If single spec (Option 1):**
Create one comprehensive spec ≤200 lines

---

## Step 3: Gather Requirements & Context

**Read user requirements:**
- If user provided file path → Read the file
- If user provided message → Use message content
- Extract: Feature description, user story, acceptance criteria, constraints

**Clarify ambiguity - Ask via AskUserQuestion:**
- Unclear requirements? Ask specific questions
- Missing user story? Ask: "What problem does this solve? Who is the user?"
- Vague acceptance criteria? Ask: "What defines 'done' for this feature?"
- Technology choices? Ask: "Any specific libraries/patterns to use or avoid?"

**Ask for larger context - MANDATORY:**
"To write a comprehensive spec, I need context:
1. Is this module part of a larger system/ecosystem? (microservices, monorepo, standalone)
2. Are there external integrations or APIs this will interact with?
3. Are there performance/security requirements? (SLA, compliance, data sensitivity)
4. Who are the users? (internal devs, end users, admins)
5. Any existing patterns/conventions I should follow?
6. What's the expected scale/load?"

**CHECKPOINT:** Get user answers before proceeding

---

## Step 4: Analyze Existing Codebase

**CRITICAL: Validate requirements against actual code implementation.**

**Required analysis:**
1. Read project memory:
   - .project-memory/architecture.md
   - .project-memory/conventions.md
   - .project-memory/useful-commands.md
   - .project-memory/tasks/tasks-active.json
2. Read actual code:
   - package.json, tsconfig.json (tech stack)
   - src/, lib/, components/ (structure)
   - tests/ (testing patterns)
   - Relevant modules that will interact with new feature
3. Identify:
   - Existing patterns (API design, error handling, validation)
   - Tech stack compatibility (does requirement fit?)
   - Integration points (where new feature connects)
   - Similar features (learn from existing implementations)

**Flag inconsistencies - OUTPUT REQUIRED:**
- **Conflicts:** [Requirements that contradict existing architecture]
- **Missing dependencies:** [New libraries needed]
- **Breaking changes:** [Existing code that needs modification]
- **Compatibility issues:** [Tech stack or pattern mismatches]

**CHECKPOINT:** If conflicts found, ask user: "Found X inconsistencies. How should we proceed?"

---

## Step 5: Design Specification Content

### For SINGLE SPEC (≤200 lines):

**Include these sections (concise):**
1. **Overview:** Purpose, scope, user story
2. **Requirements:** Functional, non-functional
3. **Technical Design:** Architecture, components, data flow, integration points
4. **Security:** Auth, validation, secrets, OWASP
5. **Edge Cases:** Error scenarios, fallbacks, logging
6. **Testing:** Unit/integration/E2E/security tests
7. **Tasks:** Implementation steps (brief)
8. **Maintainability:** Follow conventions, documentation strategy

**Keep ≤200 lines total**

---

### For MODULAR SPECS (multiple files ≤200 lines each):

**Create these files:**

**1. [feature]-overview.md (≤100 lines):**
- Purpose & user story
- Scope (included/excluded)
- Context (ecosystem fit)
- Related specs (link to other spec files)
- High-level architecture diagram (text)
- Success criteria

**2. [feature]-backend.md (≤200 lines):**
- API endpoints (routes, methods, auth)
- Database schema (tables, fields, indexes)
- Business logic (algorithms, validation rules)
- Data flow (request → processing → response)
- Integration with existing backend code
- Error handling
- Related: [Link to security.md, tests.md]

**3. [feature]-frontend.md (≤200 lines):**
- UI components (screens, forms, widgets)
- User flows (step-by-step interactions)
- State management (stores, contexts)
- API integration (endpoints called)
- UX considerations (loading, errors, feedback)
- Integration with existing frontend code
- Related: [Link to overview.md, tests.md]

**4. [feature]-security.md (≤200 lines):**
- Authentication & authorization (who can access)
- Input validation (sanitization, type checking)
- Data protection (encryption, PII, secrets)
- OWASP Top 10 review
- Secure coding practices
- Threat model
- Security testing requirements
- Related: [Link to backend.md, tests.md]

**5. [feature]-tests.md (≤200 lines):**
- Unit tests (backend logic, frontend components)
- Integration tests (API contracts, database)
- E2E tests (user flows)
- Security tests (auth, injection, XSS)
- Edge case tests (errors, limits, concurrency)
- Test data & mocks
- Coverage requirements
- Related: [Link to all spec files]

**6. [feature]-tasks.md (≤200 lines):**
- Implementation plan (phases)
- Task breakdown (small, actionable items)
- Dependencies (task ordering)
- Acceptance criteria per task
- Risks & blockers
- Related: [Link to overview.md]

**Each file must:**
- Start with "**Related Specs:**" section linking to other files
- Stay ≤200 lines
- Be independently readable
- Cross-reference related content

---

## Step 6: Validate Spec Against Codebase

**REQUIRED validation:**
1. **Architecture alignment:** Does design match existing patterns?
2. **Tech stack compatibility:** All dependencies available/compatible?
3. **Integration feasibility:** Can it connect to existing code without breaking changes?
4. **Security review:** Addresses auth, validation, secrets, OWASP?
5. **Test coverage:** Are all edge cases covered?
6. **Maintainability:** Follows conventions, reusable, documented?
7. **Line count:** Each file ≤200 lines (≤100 for overview)?

**OUTPUT REQUIRED - Show user:**
- ✅ **Validated:** [Aspects that align with codebase]
- ⚠️ **Warnings:** [Potential issues, needs user decision]
- ❌ **Blockers:** [Must be resolved before implementation]

**CHECKPOINT:** Get user approval on spec(s)

---

## Step 7: Write Spec File(s)

After approval:

### For SINGLE SPEC:

1. **Filename:** \`.project-memory/specs/[feature-name].md\`
2. **Header:**
\`\`\`markdown
# [Feature Name] Specification

**Status:** Draft | **Created:** [YYYY-MM-DD] | **Updated:** [YYYY-MM-DD]

> Immutable spec. Once approved, implementation follows this spec.

[... all sections from Step 5 ...]
\`\`\`
3. **Write using Write tool**
4. **Verify ≤200 lines**

### For MODULAR SPECS:

1. **Create each file:**
   - \`[feature]-overview.md\` (≤100 lines)
   - \`[feature]-backend.md\` (≤200 lines)
   - \`[feature]-frontend.md\` (≤200 lines)
   - \`[feature]-security.md\` (≤200 lines)
   - \`[feature]-tests.md\` (≤200 lines)
   - \`[feature]-tasks.md\` (≤200 lines)

2. **Each file header:**
\`\`\`markdown
# [Feature Name] - [Domain] Specification

**Status:** Draft | **Created:** [YYYY-MM-DD]

**Related Specs:**
- [Overview](./ [feature]-overview.md)
- [Backend](./ [feature]-backend.md)
- [Frontend](./ [feature]-frontend.md)
- [Security](./ [feature]-security.md)
- [Tests](./ [feature]-tests.md)
- [Tasks](./ [feature]-tasks.md)

[... content ...]
\`\`\`

3. **Write all files using Write tool**
4. **Verify each ≤200 lines**

**Confirm creation:** Show all file paths to user

---

## Step 8: Parse Tasks (Optional)

Ask user via AskUserQuestion: "Spec(s) created. Parse tasks now?"

If yes:
- **Single spec:** Run \`project-memory parse-tasks\` on the spec file
- **Modular specs:** Run \`project-memory parse-tasks\` on [feature]-tasks.md

---

## Rules

- **Always initialize/sync** project memory first (Step 1)
- **Ask user: single or modular?** Complex features need modular specs (Step 2)
- **Clarify ambiguity** - Ask questions, don't guess (Step 3)
- **Ask for context** - Ecosystem, integrations, scale, users (Step 3)
- **Validate against code** - Flag conflicts, check compatibility (Step 4)
- **Focus on security** - Auth, validation, secrets, OWASP Top 10 (all specs)
- **Consider edge cases** - Errors, limits, failures, concurrency (all specs)
- **Include tests** - Unit, integration, E2E, security, edge cases (all specs)
- **Keep maintainable** - Follow conventions, document, reusable (all specs)
- **Write for agents** - Clear, actionable, unambiguous (all specs)
- **Respect line limits** - Each file ≤200 lines (overview ≤100), use modular specs for complex features
- **Cross-reference** - Modular specs must link to related files

Done!
`.trim();
