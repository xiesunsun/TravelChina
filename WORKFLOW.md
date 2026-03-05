---
tracker:
  kind: linear
  project_slug: "travelchina-4905b1ac02d8"
workspace:
  root: ~/code/symphony-workspaces
hooks:
  after_create: |
    git clone git@github.com:你的用户名/TravelChina.git .
agent:
  max_concurrent_agents: 3
  max_turns: 30
codex:
  command: codex app-server --model gpt-5.3-codex
---

你正在为 TravelChina 项目开发工具程序。

Issue: {{ issue.identifier }} - {{ issue.title }}
描述: {{ issue.description }}

请严格按照 Harness Engineering 原则（结构化文档、完整测试、CI 通过）完成这个功能。
完成后自动创建 PR 并把 Linear 状态更新为 Human Review。
