# AI Assistant Lifecycle Contract v1.0.0

本契约定义模型理解之后、用户回复之前的固定安全链路。机器可读字段见 `ai-assistant-v1.schema.json`。

## SemanticCandidate

模型或本地规则只能产生候选语义：`intent`、`entities`、`evidence`、`source` 和 `confidence`。候选语义不得包含可直接执行的命令，也不得决定最终设备 ID、策略或执行结果。

V1 意图集合：

`chat`、`knowledge_query`、`environment_query`、`device_query`、`device_control`、`cooking_guard_create`、`optimization_create`、`task_query`、`task_pause`、`task_resume`、`task_stop`、`confirm`、`cancel`、`unknown`。

## ExecutionPlan

确定性计划至少包含：

- `planId`、`planHash`、`kind`、用户可见 `summary`；
- 规范化动作及其 `deviceId`、目标状态和 `expectedStateVersion`；
- `requiresConfirmation`、`createdAt`、`expiresAt`；
- 创建任务时的类型、模式、计划时间、时区、模拟标识和当前任务版本。

`planHash` 必须由规范化计划内容计算；模型文本不得参与执行哈希。

## PolicyDecision

策略结果只能是：

- `allow`：允许立即执行；
- `confirm`：保存一个待确认计划；
- `clarify`：只询问缺失或歧义信息；
- `reject`：不创建计划或执行动作。

每个结果必须包含稳定 `reasonCodes`，可附带安全替代建议。

## PendingConfirmation

| 字段 | 说明 |
|---|---|
| `confirmationId` | 唯一确认标识 |
| `conversationId` | 绑定当前会话 |
| `planId` / `planHash` | 绑定确定性计划 |
| `deviceStateVersions` | 相关设备状态版本映射 |
| `taskVersion` | 涉及任务时绑定当前版本 |
| `status` | `pending`、`confirmed`、`cancelled`、`expired`、`invalidated` |
| `createdAt` / `expiresAt` | 默认 120 秒有效期 |

后端保存的内部确认记录还必须绑定可信传输层提供的 `actorId` 和 `scopeId`，但这两个字段不返回前端。确认时必须重新校验身份、计划哈希、有效期、设备版本、任务版本和策略；任一不匹配均不得执行。

## AutomationTask

- 同一 `scopeId` 最多存在一个 `scheduled`、`running` 或 `paused` 任务。
- 类型为 `cooking_guard` 或 `optimization`。
- 优化模式为 `comfort`、`balanced` 或 `eco`，且 `isSimulation=true`、`executionSource` 只能为 `mock` 或 `replay`。
- 状态为 `scheduled`、`running`、`paused`、`stopped` 或 `failed`。
- 每次状态迁移递增 `taskVersion`；重复迁移返回幂等当前状态。
- 替换顺序固定为：确认替换 → 成功停止旧任务 → 创建新任务。停止失败时不得创建新任务。
- 当天调度必须使用请求中的 IANA 时区，且 `scheduledFor` 必须晚于当前时间并处于同一当地自然日。

## ExecutionReceipt

| 状态 | 含义 | 可否陈述成功 |
|---|---|---:|
| `succeeded` | 适配器确认达到目标状态 | 是 |
| `noop` | 执行前已经达到目标状态 | 只能陈述“已处于该状态” |
| `partial_success` | 多动作仅部分成功 | 不得陈述整体成功 |
| `failed` | 明确失败 | 否 |
| `timed_out` | 超时，最终状态未知 | 否 |
| `unknown` | 无法确定最终状态 | 否 |

回执至少包含 `receiptId`、`requestId`、`planId`、`status`、逐项动作结果、`source`、`startedAt` 和 `completedAt`。任务创建成功不能替代设备执行成功。

## 幂等与保留

- 请求和设备命令的幂等记录默认保留 24 小时。
- 同一作用域、同一幂等键和相同载荷返回原结果；载荷不同返回 `IDEMPOTENCY_CONFLICT`。
- 幂等只防重复执行，不允许绕过确认有效期、状态版本或策略复核。
