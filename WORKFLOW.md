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
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
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
  max_concurrent_agents: 3
  max_turns: 30
codex:
  command: codex app-server --model gpt-5.3-codex
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

你正在处理 TravelChina 的 Linear 工单：`{{ issue.identifier }}`。

工单标题：`{{ issue.title }}`
工单状态：`{{ issue.state }}`
工单描述：
{% if issue.description %}
{{ issue.description }}
{% else %}
（无）
{% endif %}

{% if attempt %}
这是重试/续跑（attempt={{ attempt }}），请基于当前工作区已有变更继续，不要从头重复已完成事项。
{% endif %}

## 必须遵守的全局规则

1. 只在当前 issue 工作区内操作，不得访问或修改其他目录。
2. 所有实现必须遵循仓库约束：`AGENTS.md`、`ARCHITECTURE.md`、`README.md`。
3. 行为变化必须同步更新文档与 harness 资产（`docs/`、`harness/evals/`、`harness/scenarios/`）。
4. 每个工单只维护一个进度评论，标题固定为 `## Codex Workpad`，持续增量更新，不创建重复总结评论。
5. 未满足质量门禁前，不得将工单状态改为 `Human Review`。

## 工单状态机（必须执行）

- `Backlog`: 不执行开发，停止并等待人工切换状态。
- `Todo`: 先切到 `In Progress`，然后创建/复用 `## Codex Workpad`，再开始开发。
- `In Progress`: 正常执行开发流程。
- `Rework`: 按 reviewer 反馈重做并重新验证，不跳过验证门禁。
- `Human Review`: 不再提交新代码，仅等待人工反馈；若收到修改意见，切回 `Rework`。
- `Merging`: 仅执行合并收尾（保证主分支合并后再转 `Done`）。
- `Done` 及其他 terminal 状态: 不再执行任何改动。

## 开发与验证流程

1. 读取当前分支和工作区状态，确认是否已有 PR。
2. 在 `## Codex Workpad` 中维护以下内容：
   - Plan（分步骤待办）
   - Acceptance Criteria（验收点）
   - Validation（执行过的命令与结果）
   - Notes/Blockers（关键决策、阻塞项）
3. 实现最小可行改动，避免无关重构。
4. 根据变更范围执行验证：
   - 默认：`bash scripts/run-harness.sh`
   - 仅文档/非运行时改动可用：`HARNESS_SKIP_E2E=1 bash scripts/run-harness.sh`
   - 使用简化验证时，必须在 Workpad 的 Validation 里写明原因。
5. 创建或更新 PR，并把 PR 链接回填到 Linear。

## PR 反馈闭环（进入 Human Review 前必须完成）

1. 拉取并处理所有 reviewer 反馈（含顶层评论、inline 评论、review summary）。
2. 每条可执行反馈必须满足其一：
   - 已用代码/测试/文档修复；
   - 已在对应线程给出明确、可辩护的技术性回复。
3. 反馈处理后重新执行所需验证，直到通过。
4. 确认 PR checks 为绿色，再允许转 `Human Review`。

## 转 Human Review 的硬条件

只有全部满足才可转：

- Workpad 中 Plan/Acceptance/Validation 已更新到最新状态。
- 必要验证命令已通过（含原因充分的跳过说明）。
- PR 存在且已推送最新代码。
- 无未处理的可执行 PR 反馈。

## 阻塞处理

仅当缺少必要权限/密钥/外部服务导致无法完成时，才允许阻塞：

- 在 Workpad 的 Blockers 写清：缺什么、为何阻塞、需要人工做什么。
- 除阻塞说明外，不输出冗余内容。

## 最终输出格式

最终回复只包含：

1. 代码与文档改动摘要
2. 验证命令与结果
3. 阻塞项（若有）

不要输出泛化建议或与工单无关的内容。
