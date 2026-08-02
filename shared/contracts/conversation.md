# Conversation Contract v1.0.0

机器可读定义见 `ai-assistant-v1.schema.json`。响应中的自然语言只负责展示，结构化字段才是前端状态和后端流程的依据。

## 固定限制

| 项目 | V1 值 |
|---|---|
| `message` 最大长度 | 4000 个 Unicode 字符 |
| 当前会话上下文 | 最多最近 12 条消息 |
| 待确认有效期 | 120 秒 |
| 同一会话待确认 | 最多 1 个 |
| 同一会话待澄清 | 最多 1 个 |

## SendMessageRequest

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `contractVersion` | `1.0.0` | 是 | 契约版本 |
| `conversationId` | string | 是 | 当前会话稳定标识 |
| `clientMessageId` | string | 是 | 客户端消息标识 |
| `idempotencyKey` | string | 是 | 同一键和不同载荷返回 `IDEMPOTENCY_CONFLICT` |
| `message` | string | 是 | 去除首尾空白后必须非空，最长 4000 字符 |
| `locale` | string | 是 | 例如 `zh-CN` |
| `timezone` | IANA timezone | 是 | 例如 `Asia/Shanghai` |
| `continuation` | object | 否 | UI 操作关联的 `clarificationId` 或 `confirmationId` |

用户身份与家庭作用域由可信传输层注入为 `actorId` 和 `scopeId`，不得信任消息正文中的身份声明。

## SendMessageResponse

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `contractVersion` | `1.0.0` | 是 | 契约版本 |
| `requestId` | string | 是 | 全链路追踪标识 |
| `conversationId` | string | 是 | 当前会话 |
| `message` | `ConversationMessage` | 是 | 用户可见回复 |
| `responseType` | enum | 是 | `chat`、`knowledge`、`environment_status`、`device_status`、`clarification`、`confirmation`、`task_status`、`execution_result`、`rejection`、`error` |
| `sources` | `SourceRef[]` | 是 | 回复事实来源，可为空数组 |
| `clarification` | `PendingClarification` | 否 | 仅待澄清时出现 |
| `confirmation` | `PendingConfirmation` | 否 | 仅待确认时出现 |
| `task` | `AutomationTask` | 否 | 当前任务快照 |
| `receipt` | `ExecutionReceipt` | 否 | 可信执行结果 |
| `error` | `PublicError` | 否 | 稳定公开错误 |

## ConversationMessage

| 字段 | 类型 | 必需 |
|---|---|---:|
| `id` | string | 是 |
| `role` | `user` / `assistant` | 是 |
| `content` | string | 是 |
| `status` | `pending` / `complete` / `error` | 是 |
| `createdAt` | ISO-8601 string | 是 |

## 会话状态规则

- “确认”只处理当前唯一且有效的 `PendingConfirmation`；不存在时不得回放历史计划。
- “取消”优先取消当前待确认；没有待确认时才按当前语义处理。
- UI 按钮提交澄清或确认时必须携带并校验对应 ID；纯文本回复只允许作用于服务端当前唯一待处理状态。
- 最近设备只作为解析证据，任何控制仍须重新执行设备解析、计划和策略链路。
- 设备状态、环境事实和任务状态不得从历史消息正文恢复。
