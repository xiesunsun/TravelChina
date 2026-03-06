---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "travelchina-4905b1ac02d8"
  active_states:
    - Todo
    - In Progress
    - Rework
    - Merging
  terminal_states:
    - Done
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
polling:
  interval_ms: 10000
workspace:
  root: ~/code/symphony-workspaces
hooks:
  after_create: |
    git clone --depth 1 "${SOURCE_REPO_URL:-git@github.com:xiesunsun/TravelChina.git}" .
  before_run: |
    bash scripts/symphony-preflight.sh
agent:
  max_concurrent_agents: 1
  max_turns: 1
  retry_on_failure: false
  failure_state: Human Review
codex:
  command: codex app-server -c model='"gpt-5.3-codex"'
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

You are handling one TravelChina Linear issue: `{{ issue.identifier }}`.

Issue title: `{{ issue.title }}`
Issue state: `{{ issue.state }}`
Issue description:
{% if issue.description %}
{{ issue.description }}
{% else %}
(none)
{% endif %}

{% if attempt %}
This is a retry/resume run (attempt={{ attempt }}). Continue from existing workspace changes. Do not repeat completed work.
{% endif %}

## Global Rules (mandatory)

1. Work only inside the current issue workspace.
2. Follow repository constraints in `AGENTS.md`, `ARCHITECTURE.md`, and `README.md`.
3. Keep exactly one persistent progress comment titled `## Codex Workpad` (update in place, never duplicate).
4. Do not move to `Human Review` before required validation passes.
5. If behavior changes, update docs and harness assets in the same issue.

## Linear State Machine (mandatory)

- `Backlog`: do nothing and stop.
- `Todo`: move issue to `In Progress` first, then start work.
- `In Progress`: implement and validate.
- `Rework`: address review feedback, then re-validate.
- `Merging`: finalize merge/landing tasks only.
- `Human Review`: no coding. If PR is merged, set issue to `Done` and stop.
- `Done` or any terminal state: stop immediately.

## Workpad Contract (mandatory)

The single `## Codex Workpad` comment must always contain:
- `Plan`
- `Acceptance Criteria`
- `Validation`
- `Notes/Blockers`

Record exact commands and outcomes under `Validation`.

## Development Loop

1. Check branch, dirty state, existing PR, and current issue state.
2. Reuse existing branch/PR when present; avoid opening duplicate PRs.
3. Make minimal, scoped code changes only for this issue.
4. Run validation:
   - default: `bash scripts/run-harness.sh`
   - docs-only or non-runtime-impact change: `HARNESS_SKIP_E2E=1 bash scripts/run-harness.sh`
5. If reduced validation is used, write the reason in Workpad `Validation`.
6. Push changes, update/create PR, and add PR link in Workpad.

## PR Feedback Loop (before Human Review)

1. Collect all review inputs: top-level comments, inline comments, and review summaries.
2. For each actionable item, either:
   - fix with code/test/docs, or
   - provide a clear technical response in the thread.
3. Re-run required validation after fixes.
4. Only move to `Human Review` when checks are green and no actionable feedback remains.

## Stop Conditions (anti-stall, mandatory)

Stop this run and report in Workpad `Notes/Blockers` when any of these happens:
- same failing command repeats twice with the same root cause;
- required credential/permission/service is missing;
- no file changes and no new actionable feedback remain.

Never idle-spin only to consume tokens.

## Completion Criteria

Set issue to `Human Review` only if all are true:
- Workpad is up to date;
- required validation completed;
- PR is updated and linked;
- no unresolved actionable review feedback.

If PR is merged, set issue to `Done` and stop.

## Final Response Format

Final output must contain only:
1. code/doc changes summary
2. validation commands and results
3. blockers (if any)
