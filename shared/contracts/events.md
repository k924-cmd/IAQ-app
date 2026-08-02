# Analytics Event Contract v1.0.0

## 公共事件信封

所有事件必须包含 `eventId`、`eventName`、`eventVersion`、`occurredAt`、`source`；可包含 `requestId`、`conversationId`、`taskId` 和允许的事件属性。

| 事件 | 必需属性 |
|---|---|
| `assistant_request_received` | `messageLength`, `locale` |
| `assistant_response_completed` | `responseType`, `outcome`, `durationMs` |
| `clarification_presented` | `clarificationKind` |
| `confirmation_presented` | `planKind`, `expiresInSeconds` |
| `confirmation_resolved` | `resolution` |
| `task_state_changed` | `taskType`, `fromStatus`, `toStatus`, `isSimulation` |
| `device_action_completed` | `deviceType`, `action`, `receiptStatus`, `executionSource` |
| `dependency_degraded` | `dependency`, `errorCode` |
| `public_error_returned` | `errorCode`, `surface`, `retryable` |

## 禁止字段

- 用户完整输入、助手完整回复或完整会话；
- API Key、Secret、Token、设备凭据或可执行连接信息；
- 未脱敏姓名、联系方式、精确住址或其他个人信息；
- 内部堆栈、模型原始提示词或模型原始输出；
- 自由文本设备名称。设备分析使用稳定 ID 的不可逆散列或 `deviceType`。

事件发送失败不得影响主链路，不得改变策略、任务或执行结果。
