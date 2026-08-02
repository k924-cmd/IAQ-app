# Conversation Contract v0.1

当前契约只描述前端与未来后端之间的最小消息边界，不继承旧 Intent、Receipt 或 Prompt 字段。

## ConversationMessage

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 消息唯一标识 |
| `role` | `user` / `assistant` | 是 | 消息角色 |
| `content` | string | 是 | 展示内容 |
| `status` | `pending` / `complete` / `error` | 是 | 展示状态 |
| `createdAt` | ISO-8601 string | 是 | 创建时间 |

## SendMessageRequest

| 字段 | 类型 | 必需 |
|---|---|---:|
| `conversationId` | string | 是 |
| `message` | string | 是 |

## SendMessageResponse

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `message` | ConversationMessage | 是 | 助手消息 |
| `requestId` | string | 是 | 请求追踪标识 |

设备操作、工具调用、确认、来源和执行结果暂不纳入 v0.1，必须通过后续产品决策新增。
