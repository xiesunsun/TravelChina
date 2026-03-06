# Symphony Workflow V1 Design

## Goal
Harden unattended Symphony runs for TravelChina by making ticket execution, PR handling, and handoff criteria deterministic.

## Scope
- Linear state-machine policy for agent routing.
- Single Workpad protocol (`## Codex Workpad`) for progress tracking.
- PR feedback sweep requirements before `Human Review`.
- Quality gate mapping to repository harness commands.
- Runtime preflight checks for required tools/auth/workspace layout.

## State Policy
- `Backlog`: do nothing.
- `Todo`: transition to `In Progress` before any coding.
- `In Progress`: implement and validate.
- `Rework`: address review feedback and re-validate.
- `Human Review`: no new code changes unless moved back to `Rework`.
- `Merging`: merge/land only.
- Terminal states (`Done`, `Closed`, `Cancelled`, `Canceled`, `Duplicate`): stop.

## Workpad Contract
Every issue keeps exactly one persistent comment headed by `## Codex Workpad` with:
- Plan
- Acceptance Criteria
- Validation
- Notes/Blockers

The comment is updated in place throughout execution.

## Quality Gates
Default verification command:
- `bash scripts/run-harness.sh`

Allowed reduced gate:
- `HARNESS_SKIP_E2E=1 bash scripts/run-harness.sh`

Reduced gate is only acceptable for docs-only or non-runtime-impact changes, and the reason must be recorded in Workpad Validation.

## Runtime Preflight
Before each unattended run attempt, Symphony executes:
- `bash scripts/symphony-preflight.sh`

Fail-fast checks include:
- Required workspace structure (docs/harness/scripts/backend/frontend)
- Required commands (`git`, `uv`, `node`, `npm`, `bash`)
- Git repository and `origin` remote presence
- `gh` availability and authentication by default (configurable via env)

Optional checks:
- `LINEAR_API_KEY` can be made mandatory by setting `SYMPHONY_PREFLIGHT_REQUIRE_LINEAR_API_KEY=1`.

## PR Feedback Loop
Before moving to `Human Review`:
- Collect top-level comments, inline comments, and review summaries.
- Resolve each actionable item by code/test/doc updates or explicit technical response.
- Re-run required validation and ensure PR checks are green.

## Success Criteria
- Symphony workflow prompt enforces deterministic state transitions.
- Human Review handoff has explicit objective pass/fail checks.
- Review feedback does not bypass validation.
