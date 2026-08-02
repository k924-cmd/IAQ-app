# Analytics Event Contract v1.0.0

## 公共事件信封

所有事件必须包含 `eventId`、`eventName`、`eventVersion`、`occurredAt`、`source` 和 `properties`。可按事件上下文包含 `requestId`、`conversationId`、`taskId`。顶层及 `properties` 均采用白名单，禁止任意扩展字段和自由文本。

| 事件 | `properties` 必需且仅允许字段 | 闭集或类型 |
|---|---|---|
| `assistant_request_received` | `messageLength`, `locale` | 非负整数；请求 locale 格式 |
| `assistant_response_completed` | `responseType`, `outcome`, `durationMs` | 响应类型；`completed` 或公开错误码；非负数值 |
| `clarification_presented` | `clarificationKind` | `ClarificationKind` |
| `confirmation_presented` | `planKind`, `expiresInSeconds` | `PlanKind`；非负整数 |
| `confirmation_resolved` | `resolution` | `confirmed` / `cancelled` / `expired` / `invalidated` |
| `task_state_changed` | `taskType`, `fromStatus`, `toStatus`, `isSimulation` | `TaskType`；`fromStatus` 可额外为 `none`；`TaskStatus`；布尔值 |
| `device_action_completed` | `deviceType`, `action`, `receiptStatus`, `executionSource` | 业务契约枚举；`mock` / `device` |
| `dependency_degraded` | `dependency`, `errorCode` | `model` / `device` / `environment` / `optimizer` / `telemetry` / `http`；公开错误码 |
| `public_error_returned` | `errorCode`, `surface`, `retryable` | 公开错误码；`assistant` / `http` / `frontend`；布尔值 |

字段类型、枚举和逐事件白名单以 `ai-assistant-v1.schema.json` 的 `AnalyticsEvent` 定义为机器可读权威来源。

## 来源语义

- 顶层 `source` 只表示事件发出端：`frontend` 或 `backend`。
- `device_action_completed.executionSource` 只表示单项设备动作回执来源：`mock` 或 `device`。
- 优化任务的 `mock` / `replay` 来源保存在 `AutomationTask.executionSource`，不得映射为设备动作来源。

## 禁止字段

- 用户完整输入、助手完整回复或完整会话；
- API Key、Secret、Token、设备凭据或可执行连接信息；
- 未脱敏姓名、联系方式、精确住址或其他个人信息；
- 内部堆栈、模型原始提示词或模型原始输出；
- 自由文本设备名称。设备分析仅使用契约中的 `deviceType`。

事件发送失败不得影响主链路，不得改变策略、任务或执行结果。
