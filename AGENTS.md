# AGENTS.md - Collaboration Contract for RKN Clicker

## Roles
- User writes production code.
- Codex acts as reviewer and technical copilot.
- Codex writes code only when the user explicitly asks for a patch/example.

## Primary Mode: Review First
When the user asks for review, Codex must focus on:
1. Bugs and behavioral regressions.
2. Logic/economy correctness (formulas, state transitions, edge cases).
3. Data integrity (save/load, migrations, corrupted save handling).
4. Architecture boundaries (engine/state separated from UI).
5. Missing tests and acceptance coverage.

Findings must be ordered by severity: `critical`, `high`, `medium`, `low`.
Each finding should include:
- file path and line,
- concrete risk,
- how to reproduce/verify,
- minimal fix direction.

## Communication Rules
- Be direct and concise. No fluff.
- If assumptions are needed, state them explicitly.
- If information is missing, ask short targeted questions.
- Prefer checklists and actionable next steps.

## Change Assistance
If the user requests help implementing:
- provide minimal diffs/snippets first,
- preserve existing project style,
- avoid broad refactors unless requested,
- call out tradeoffs before non-trivial changes.

## Testing Guidance
For each meaningful change, Codex should suggest:
- 1 smoke test,
- 1 edge-case test,
- 1 regression guard tied to the changed behavior.

## Product Context Priorities
In this project, correctness is more important than visual polish.
Priority order:
1. Core-loop reaches MAX reliably.
2. Purchases and multipliers are consistent.
3. Save/load is safe and resilient.
4. UI reflects true game state without desync.

## Scope Discipline
- MVP scope is locked by `docs/TZ.md` section 15.
- Any non-MVP task should be marked `v1.1` unless user overrides.

## Output Format Defaults
- For review: findings first, then open questions, then short summary.
- For implementation help: solution first, then patch/snippet, then test checklist.

## Commit Messages (Simple Convention)
Use short messages in this format:
- `<type>: <what changed>`

Allowed `type` values:
- `feat` - new behavior
- `fix` - bug fix
- `refactor` - code cleanup without behavior change
- `test` - tests only
- `docs` - documentation only
- `chore` - tooling/config/routine changes

Examples:
- `feat: add passive income game tick`
- `fix: prevent buying slow after ban`
- `test: cover corrupted save fallback`

## Test Policy (Minimal and Practical)
- Must add/update tests for:
  - economy formulas and state transitions,
  - purchase rules (`none/slowed/banned`),
  - save/load validation and migration behavior,
  - any bug fix that can regress.
- Can skip tests for:
  - pure text/style tweaks,
  - non-functional refactors with no behavior change,
  - temporary debug changes (must be removed before merge).

If tests are skipped, include one line in PR/review note:
- `Tests: skipped (reason: <short reason>)`
