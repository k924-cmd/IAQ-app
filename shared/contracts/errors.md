# Error Contract v1.0.0

公开错误结构为 `code`、`message`、`retryable`、`requestId`。不得包含内部堆栈、凭据、完整对话或未脱敏个人信息。

| 代码 | 可重试 | 含义 |
|---|---:|---|
| `INVALID_REQUEST` | 否 | 字段、空输入或格式无效 |
| `INPUT_TOO_LONG` | 否 | 输入超过 4000 字符 |
| `CONTRACT_VERSION_UNSUPPORTED` | 否 | major 版本不兼容 |
| `IDEMPOTENCY_CONFLICT` | 否 | 同一幂等键对应不同载荷 |
| `INTENT_UNCLEAR` | 否 | 无法可靠识别意图 |
| `CLARIFICATION_REQUIRED` | 否 | 缺少或存在歧义信息 |
| `CONFIRMATION_REQUIRED` | 否 | 计划必须确认 |
| `CONFIRMATION_NOT_FOUND` | 否 | 当前无待确认计划 |
| `CONFIRMATION_EXPIRED` | 否 | 确认超过有效期 |
| `CONFIRMATION_INVALIDATED` | 否 | 计划、设备或任务版本已变化 |
| `TASK_CONFLICT` | 否 | 已有唯一活动任务 |
| `TASK_NOT_FOUND` | 否 | 当前无可管理任务 |
| `INVALID_TASK_TRANSITION` | 否 | 不允许的任务状态迁移 |
| `DEVICE_NOT_FOUND` | 否 | 设备不存在 |
| `DEVICE_AMBIGUOUS` | 否 | 设备名称不唯一 |
| `DEVICE_UNAVAILABLE` | 是 | 设备离线、未知或服务不可用 |
| `ACTION_UNSUPPORTED` | 否 | 设备或 V1 不支持该动作 |
| `ENVIRONMENT_UNAVAILABLE` | 是 | 环境数据缺失或无效 |
| `ENVIRONMENT_STALE` | 是 | 环境数据超过 300 秒 |
| `POLICY_REJECTED` | 否 | 安全或产品策略拒绝 |
| `EXECUTION_FAILED` | 视情况 | 执行器明确失败 |
| `EXECUTION_TIMEOUT` | 是 | 执行超时且状态未知 |
| `MODEL_UNAVAILABLE` | 是 | 模型适配器不可用 |
| `OPTIMIZER_UNAVAILABLE` | 是 | Mock/Replay 优化器不可用 |
| `SERVICE_UNAVAILABLE` | 是 | 依赖服务暂不可用 |
| `INTERNAL_ERROR` | 是 | 未公开的内部错误 |

错误码不直接决定用户文案；前端或固定回复模板按 `code`、上下文和 `retryable` 生成安全文案。
