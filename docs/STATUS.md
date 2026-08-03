# 四线协作状态（协调窗口维护）

> 本文件是「进度咨询窗口」的进度唯一入口，由协调窗口（集成窗口）维护。
> 更新触发：每次合并、验收、派发或契约变更完成后更新；带时间戳。

## 基线快照

- 最后更新：2026-08-03（Asia/Shanghai）
- 主线 HEAD：`71d7735`（`fix(backend): route greeting before generic knowledge fallback`）
- 远端同步：`main` 领先远端 9 个提交，待推送
- 工作树：干净

## 当前目标（已关闭）

- AI 小助手 V1：本地可信链路 + HTTP 接入 + 前端集成 + 运营事件字典 + 正式验收记录，已全部完成并关闭。
  - 变更请求：`DEP-2026-08-03-001` → `closed`（见 `shared/CHANGE_REQUESTS.md`）
  - 验收记录：`operations/release/INTEGRATION_ACCEPTANCE_V1.md`
  - 产品结论：最终只读复核通过，无 P0/P1
- AI 小助手 V1 真实模型 API（聊天与知识问答）：DeepSeek 适配器、AC-014～019、前端降级验证、运营事件/发布检查已完成。
  - 变更请求：`DEP-2026-08-03-002` → `closed`（见 `shared/CHANGE_REQUESTS.md`）
  - 验收记录：`operations/release/INTEGRATION_ACCEPTANCE_V1.md`（追加“真实模型 API 接入验收记录”）
  - 真实调用验证：`demo:model` 返回 `sources[0].type="model"`；测试后端 103/103、前端 14/14

## 四线状态

| 工作线 | 分支 | Worktree | 最近成果 | 测试 |
|---|---|---|---|---|
| 前端 | `codex/frontend-ui` | `C:\Users\Administrator\.codex\worktrees\5c6d\codex_IAQapp` | API 集成、旧 SW 恢复、model 来源与降级验证 | 14/14 |
| 后端 | `codex/backend-core` | `C:\Users\Administrator\.codex\worktrees\43a5\codex_IAQapp` | 本地 HTTP、DeepSeek 适配器、路由修复 | 103/103 |
| 产品 | `codex/product-spec` | `C:\Users\Administrator\.codex\worktrees\db02\codex_IAQapp` | PRD、AC-014～019、真实模型决策记录 | 无独立测试 |
| 运营 | `codex/operations` | `C:\Users\Administrator\.codex\worktrees\4047\codex_IAQapp` | 事件口径、发布检查第 7 节、V1 验收记录 | 无独立测试 |

## 共享契约（`shared/**`，协调窗口维护）

- AI 小助手契约：`1.0.0`，状态 `closed`
- 机器可读入口：`shared/contracts/ai-assistant-v1.schema.json`
- HTTP 传输：`shared/contracts/http.md`
- 事件契约：`shared/contracts/events.md`（逐事件字段/类型/枚举白名单已收口）
- 变更请求登记：`shared/CHANGE_REQUESTS.md`

## 已验证能力（本地 Mock 范围）

- 后端：环境查询、设备控制、确认/澄清、任务状态机、执行回执、依赖降级、HTTP 契约、事件脱敏
- 前端：health→bootstrap、结构化对话、断线降级、四页面、移动端、旧 SW 恢复
- 真实浏览器联调：`127.0.0.1:4173` 连接本地后端，控制台无错误
- 边界：全部为 Mock/Replay，不连接真实模型、MQTT、设备或生产服务

## 真实模型能力（已授权，仅聊天/知识生成文本）

- 供应商：DeepSeek（`https://api.deepseek.com`，模型 `deepseek-chat`），适配器默认关闭，需 `DEEPSEEK_ENABLED=1` + 本地密钥启用。
- 密钥：仅经环境变量或 `backend/.env`（已 gitignore）注入，不入库、不入日志、不入事件。
- 成本：max_tokens≤512、超时 15s、不自动重试。
- 安全：模型输出经 `reply-safety.js` 文本边界守卫，不进入 Executor；设备/环境/策略/回执仍由固定代码决定。
- 验证：`demo:model` 真实调用通过；`hello` 类问候路由已修复为 `chat`。

## 关键文档索引

- 项目规则：`AGENTS.md`
- 根说明与联调步骤：`README.md`
- 产品：`product/PRD.md`、`product/ACCEPTANCE_CRITERIA.md`、`product/USER_FLOWS.md`、`product/BACKEND_REQUIREMENTS_V1.md`
- 产品决策：`product/decisions/`
- 后端：`backend/README.md`、`backend/tests/ac-coverage.md`
- 前端：`frontend/README.md`、`frontend/tests/README.md`
- 运营：`operations/analytics/EVENT_CATALOG.md`、`operations/release/RELEASE_CHECKLIST.md`、`operations/release/INTEGRATION_ACCEPTANCE_V1.md`
- 集成测试说明：`tests/integration/README.md`

## 候选下一步（未排期）

- 局域网手机联调模式：前端 API 地址可配置 + 后端监听局域网地址 + 严格 CORS 白名单
- 本地 HTTP 入口的认证/持久化（当前为内存状态，重启不恢复）
- 生产化讨论（真实模型接入、设备接入）需另行立项，不在当前 Mock 范围
- 真实模型开放域回复的文本边界持续验收（AC-014～019）；发布前核验成本上限、密钥注入与对外披露口径
