# Linear Issue Template (TravelChina)

Use this template in Linear issue descriptions to keep Symphony runs deterministic.

## Summary

One-sentence problem statement.

## Scope

- In scope:
  - item 1
  - item 2
- Out of scope:
  - item A
  - item B

## Repro / Context

1. Step 1
2. Step 2
3. Observed result

## Expected Result

Describe the expected behavior in measurable terms.

## Acceptance Criteria

- [ ] AC1: user-visible behavior is correct
- [ ] AC2: backend/frontend contracts remain compatible
- [ ] AC3: docs/harness are updated when behavior changes
- [ ] AC4: PR includes issue identifier in title and body

## Validation Commands

- `bash scripts/run-harness.sh`
- `cd backend && uv run --with pytest pytest tests -q`
- `cd frontend && npm test`

If e2e must be skipped, explicitly state why and use:
- `HARNESS_SKIP_E2E=1 bash scripts/run-harness.sh`

## Constraints

- Keep changes minimal and scoped to this issue.
- Do not refactor unrelated modules.
- Do not introduce new infrastructure dependencies.

## Deliverables

- Code changes
- Updated docs (if behavior changed)
- Workpad validation records
- PR URL

## Handoff Rule

Move to `Human Review` only when:
- acceptance criteria are all checked;
- required validation passed;
- no unresolved actionable PR feedback remains.
