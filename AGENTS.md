# Agent Configuration for GudangKu Starter Repo Build

## Workflow

Use the Superpowers workflow for this entire project:

1. **Brainstorm** — Refine requirements from CLAUDE.md through questions
2. **Plan** — Break into micro-tasks (2–5 min each) with exact file paths
3. **Execute** — Dispatch subagents per task with code review after each
4. **Ship** — Merge, verify, clean up

## Agent assignments

### Orchestrator (main session)
- **Model:** Opus
- **Role:** Brainstorming, planning, reviewing subagent output, architectural decisions
- **Constraint:** Never write implementation code directly. Always dispatch to subagents.

### Implementation subagents
- **Default model:** Sonnet
- **Use Haiku for:** Project init (T1), lint config (T2), MSW browser setup (T11), stats endpoint (T12), placeholder pages (T15), env config (T16), final cleanup (T20)
- **Use Sonnet for:** Everything else (types, handlers, theme, flawed component, docs)
- **Use Opus for:** Flawed component design (T13) — this needs careful planning

### Code reviewer subagent
- **Model:** Sonnet
- **Two-stage review:**
  1. **Spec compliance:** Does the implementation match the task description in the plan?
  2. **Code quality:** TypeScript strict, no `any`, consistent naming, proper error handling

## Serena usage guidelines

- Use Serena's `find_symbol` and `insert_after_symbol` for editing existing files
- Use regular file creation for new files
- Serena becomes more useful after T5 (types) when the codebase has structure to navigate
- Do NOT use Serena for the initial project scaffold (T1–T3) — there's nothing to index yet

## Superpowers preferences

- Prefer `subagent-driven-development` over `executing-plans` (subagents get fresh context)
- Each task gets its own git commit with a descriptive message
- Follow Superpowers conventions from CLAUDE.md over any defaults
- Do NOT use TDD for this project (we are explicitly not writing tests — candidates do that)
- Do NOT create worktree — work directly on main branch (this is a simple starter repo)

## Human review checkpoints

Pause and ask the human to review after these tasks:
- **T5** (api/types.ts) — Foundation types must be correct
- **T10** (AI streaming handler) — The ambiguous requirement logic must be realistic
- **T14** (Flawed component) — Issues must be subtle and span all categories
- **T18** (README.md) — Candidate-facing docs must be clear and complete

## Quality gates

Before marking any task as complete, verify:
- `npx tsc --noEmit` passes (no TypeScript errors)
- No `any` types anywhere except in the deliberately flawed component
- No `console.log` statements (except in mock API handlers for debugging)
- File follows the naming convention in CLAUDE.md file structure
- Import paths are consistent (use `@/` alias if configured, otherwise relative)

## Files to NEVER modify after creation

Once these are approved at checkpoint, do not change them:
- `src/api/types.ts` (after T5 approval)
- `CLAUDE.md` (project context — read-only reference)

## Completion criteria

The repo is done when:
1. `npm install && npm run dev` works from a fresh clone
2. `npm run lint` passes with 0 warnings
3. `npm run build` completes without errors
4. All 5 mock API endpoints respond correctly
5. SSE stream emits events every 3–8 seconds
6. AI streaming sends tokens one at a time
7. Flawed component renders without crashing
8. README.md is clear enough for a candidate to start in < 5 minutes
9. DECISIONS.md template has all required sections
