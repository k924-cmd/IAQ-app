# 跨线变更记录

## 状态

`proposed → reviewed → accepted → scheduled → implemented → verified → closed`

## 记录模板

| 字段 | 内容 |
|---|---|
| ID | `DEP-YYYY-MM-DD-NNN` |
| 创建日期 |  |
| 提出线 | Frontend / Backend / Product / Operations |
| 受影响线 |  |
| 变更类型 | API / Schema / Event / Product / Security / Release |
| 用户场景 |  |
| 当前契约 |  |
| 建议变更 |  |
| 兼容性影响 |  |
| 安全与隐私影响 |  |
| 优先级 | P0 / P1 / P2 / P3 |
| 负责人 |  |
| 验收条件 |  |
| 状态 | proposed |
| 目标版本 |  |
| 最后更新 |  |

---

## DEP-2026-08-03-001 · AI 小助手 V1 共享契约

| 字段 | 内容 |
|---|---|
| ID | `DEP-2026-08-03-001` |
| 创建日期 | 2026-08-03 |
| 提出线 | Product |
| 受影响线 | Backend / Frontend / Operations |
| 变更类型 | API / Schema / Event / Product / Security |
| 用户场景 | 聊天、可信状态查询、单设备控制、烹饪守护、模拟优化和唯一任务管理 |
| 当前契约 | v0.1 只覆盖最小消息、展示设备、环境快照和基础错误 |
| 建议变更 | 升级至 AI 小助手契约 `1.0.0`，新增计划、策略、确认、任务、回执、来源和脱敏事件语义 |
| 兼容性影响 | major 破坏性升级；旧 v0.1 客户端不得调用 V1 后端 |
| 安全与隐私影响 | 禁止模型直连执行器；确认绑定版本与有效期；事件不记录完整对话和敏感信息 |
| 优先级 | P0 |
| 负责人 | Coordination / Backend |
| 验收条件 | 产品 AC-000 至 AC-094；JSON Schema 可解析；后端与前端测试通过；本地 HTTP 和浏览器联调通过；产品最终复核无 P0/P1 |
| 状态 | closed |
| 目标版本 | AI Assistant V1 |
| 最后更新 | 2026-08-03 |

### 协调窗口评审结论

- 产品方案通过，作为 V1 目标规格，不代表当前能力已经实现。
- 输入上限为 4000 字符，环境新鲜度为 300 秒，确认有效期为 120 秒，幂等记录保留 24 小时。
- 首轮后端实现仅使用本地 Mock/Replay、固定规则和可替换模型适配器；禁止真实模型、真实 MQTT 和真实设备调用。
- 后端不得自行缩减产品验收条件；发现契约缺口时新增变更记录，由协调窗口修订。
- 传输层采用 `GET /v1/health`、`GET /v1/bootstrap` 和 `POST /v1/conversations/messages`；V1 为非流式 JSON，本地身份由服务器配置注入。

### 关闭记录

- 后端本地可信链路与 HTTP 适配已实现，自动测试 89/89 通过。
- 前端已接入 health、bootstrap 和结构化对话接口，自动测试 10/10 通过；断线时明确降级为 UI Mock。
- 真实浏览器联调确认本地后端连接、Mock 环境快照、`environment_status` 回复与零控制台错误。
- 事件契约已收口逐事件字段、类型和枚举，运营字典与发布检查已同步。
- 产品最终只读复核通过，无 P0/P1；正式证据及未单独演练项见 `operations/release/INTEGRATION_ACCEPTANCE_V1.md`。
