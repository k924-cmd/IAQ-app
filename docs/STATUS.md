# 四线协作状态（协调窗口维护）

> 本文件是「进度咨询窗口」的进度唯一入口，由协调窗口（集成窗口）维护。
> 更新触发：每次合并、验收、派发或契约变更完成后更新；带时间戳。

## 基线快照

- 最后更新：2026-08-04（Asia/Shanghai）
- 主线 HEAD：`fd4d5a3`（`docs: finalize four-item wrap-up status`）
- 说明：`3bc91a3`（`docs: sync status baseline with closed DEP-003/004/005`）为 DEP-003/004/005 关闭基线；其后的运营交付物并入（`b53e383`）、产品编号修正（`8339603`）、验收记录更新（`a3a7011`）与四项收尾（`fd4d5a3`）均已并入 main。
- 远端同步：本地与 `origin/main` 一致（`fd4d5a3`，已推送）
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
- AI 小助手 V1 免责统一、窗户免确认与对话缺陷修复：已完成并关闭。
  - 变更请求：`DEP-2026-08-03-003`（免责/E3/E4）、`DEP-2026-08-03-004`（窗户免确认）、`DEP-2026-08-03-005`（缺陷修复）→ 均 `closed`（见 `shared/CHANGE_REQUESTS.md`）
  - 验收记录：`operations/release/INTEGRATION_ACCEPTANCE_V1.md`（追加“人工回归验收记录 2026-08-04”）
  - 验收结论：后端 115/115、前端 25/25；API 回归覆盖 AC-013/015/019/023/E3/E4；前端呈现覆盖免责样式、时间可读化、增量渲染、回执中文化、窗户免确认、澄清链路，全部通过

## 四线状态

| 工作线 | 分支 | Worktree | 最近成果 | 测试 |
|---|---|---|---|---|
| 前端 | `codex/frontend-ui` | `C:\Users\Administrator\.codex\worktrees\5c6d\codex_IAQapp` | 免责样式、窗户免确认、回执/时间/滚动呈现、多设备澄清链路 | 25/25 |
| 后端 | `codex/backend-core` | `C:\Users\Administrator\.codex\worktrees\43a5\codex_IAQapp` | DEP-003 免责/E3/E4、窗户免确认、DEP-005 缺陷修复 | 115/115 |
| 产品 | `codex/product-spec` | `C:\Users\Administrator\.codex\worktrees\db02\codex_IAQapp` | DEP-003/004 定稿、呈现口径追加、AC 修订 | 无独立测试 |
| 运营 | `codex/operations` | `C:\Users\Administrator\.codex\worktrees\4047\codex_IAQapp` | 事件口径、发布检查、V1 验收记录（复核已并入） | 无独立测试 |

## 运营交付物并入记录（2026-08-04）

- 已并入 `d0ee55f`（`docs(operations): review DEP-003/004/005 operations impact`）至 main 为 `b53e383`。
- 内容：`operations/content/UI_COPY.md` 第 7 节（免责文案库与回执中文映射）；`operations/release/RELEASE_CHECKLIST.md` 第 8 节（窗户免确认与呈现披露检查）；`operations/release/INTEGRATION_ACCEPTANCE_V1.md` 追加运营复核记录。
- 合并冲突处理：与 main 已存在的“人工回归验收记录”叠加，两段均保留。
- 产品决策编号修正已并入（`8339603`）：`product/decisions/D-2026-08-04-DEP-005-PRESENTATION-APPEND.md`，标题与说明明确对应 DEP-005 呈现口径子项；验收记录「待协调确认」项已标记处理（`a3a7011`）。

## Worktree 说明

- `C:\Users\Administrator\.codex\worktrees\8cc0\codex_IAQapp`（原 HEAD `321e761`，detached）：只读咨询窗口工作目录已清理（2026-08-04）。

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
