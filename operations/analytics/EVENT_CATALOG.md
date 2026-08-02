# V1 事件字典与字段检查

## 1. 适用范围

- 权威来源：`shared/contracts/events.md` 和 `shared/contracts/ai-assistant-v1.schema.json` v1.0.0。
- 本目录只解释采集时机、最小字段和隐私检查，不扩展共享契约。
- 当前尚未接入生产采集服务；本地联调事件不是真实用户行为数据。
- 事件发送失败必须被隔离，不得改变会话响应、策略裁决、任务状态或设备执行结果。

## 2. 公共事件信封

| 字段 | 要求 | 检查口径 |
|---|---|---|
| `eventId` | 必需 | 不透露用户或设备语义的稳定标识 |
| `eventName` | 必需 | 只能是本文第 3 节的 9 个事件名 |
| `eventVersion` | 必需 | 固定为 `1.0.0` |
| `occurredAt` | 必需 | ISO-8601 date-time，表示事件实际发生时间 |
| `source` | 必需 | 只能是 `frontend` 或 `backend`；它表示事件发出端，不是 Mock/Replay 事实来源 |
| `requestId` | 可选 | 有对应请求时携带；不放入请求正文 |
| `conversationId` | 可选 | 只用不可读标识，不嵌入用户身份 |
| `taskId` | 可选 | 仅任务相关事件携带 |
| `properties` | 必需 | 只放当前事件必需且允许的属性；不放任意扩展或自由文本 |

顶层字段采用白名单：除上表 9 个字段外不得发送其他顶层字段。事实来源应在业务响应和回执中保留，不得通过改写事件 `source` 来隐去 Mock/Replay 属性。

## 3. V1 事件字典

| `eventName` | 何时发送 | `properties` 必需且仅允许字段 | 运营口径 |
|---|---|---|---|
| `assistant_request_received` | 请求通过传输层基础校验并进入助手链路 | `messageLength`, `locale` | 只记录长度和语言，不记录 `message` |
| `assistant_response_completed` | 一次结构化回复完成 | `responseType`, `outcome`, `durationMs` | `responseType` 按会话契约；不记录回复正文 |
| `clarification_presented` | 向用户展示待澄清问题 | `clarificationKind` | 仅记类型，不记提示文案、选项文本或原请求 |
| `confirmation_presented` | 向用户展示待确认计划 | `planKind`, `expiresInSeconds` | 不记录计划摘要、设备名或动作自由文本 |
| `confirmation_resolved` | 当前确认被确认、取消或失效 | `resolution` | 只记结果枚举，不记录用户原话 |
| `task_state_changed` | 任务状态实际迁移完成 | `taskType`, `fromStatus`, `toStatus`, `isSimulation` | 状态以后端可信任务为准；请求受理不等于迁移完成 |
| `device_action_completed` | 单项动作获得终态或当前可信回执 | `deviceType`, `action`, `receiptStatus`, `executionSource` | 使用 `deviceType`，不记录自由文本设备名；超时和未知不记为成功 |
| `dependency_degraded` | 依赖不可用且业务进入明确降级 | `dependency`, `errorCode` | 只记录稳定依赖类型与公开错误码，不记录 URL、异常消息或堆栈 |
| `public_error_returned` | 向用户返回公开错误 | `errorCode`, `surface`, `retryable` | 只记录公开错误码和展示面，不记录 `message` 或内部错误 |

上表字段由共享 Schema 按 `eventName` 逐事件限定，少字段或多字段都不合约。未经共享契约升级，不得在 `properties` 中增加计划摘要、错误消息、设备名、用户输入、助手回复或任意 `metadata`。

## 4. 共享契约约束的属性类型与枚举

下表是 `shared/contracts/ai-assistant-v1.schema.json` v1.0.0 中逐事件属性约束的运营视图。机器校验以共享 Schema 为准，本文不单独定义兼容规则。

| 属性 | 允许值或类型 |
|---|---|
| `messageLength` | 0–4000 的整数，且不得用长度外的方式编码原文 |
| `locale` | 符合 `^[a-z]{2,3}(-[A-Z]{2})?$`，例如 `zh-CN` |
| `responseType` | `chat`、`knowledge`、`environment_status`、`device_status`、`clarification`、`confirmation`、`task_status`、`execution_result`、`rejection`、`error` |
| `outcome` | `completed` 或 `shared/contracts/errors.md` 中的稳定公开错误码 |
| `durationMs` | 非负数值，不包含时间点或端点信息 |
| `clarificationKind` | `device`、`action`、`time`、`mode`、`task_conflict`、`reference` |
| `planKind` | `single_device`、`cooking_guard`、`optimization_task`、`task_replacement` |
| `expiresInSeconds` | 非负整数；V1 默认待确认有效期为 120 秒 |
| `resolution` | `confirmed`、`cancelled`、`expired`、`invalidated` |
| `taskType` | `cooking_guard` 或 `optimization` |
| `fromStatus` | `none`、`scheduled`、`running`、`paused`、`stopped`、`failed` |
| `toStatus` | `scheduled`、`running`、`paused`、`stopped`、`failed` |
| `isSimulation` | boolean；优化任务必须为 `true` |
| `deviceType` | `air_purifier`、`smart_window`、`range_hood`、`fresh_air`、`humidifier`、`circulation_fan` |
| `action` | `turn_on`、`turn_off`、`open`、`close` |
| `receiptStatus` | 单项动作回执口径：`succeeded`、`noop`、`failed`、`timed_out`、`unknown` |
| `executionSource` | 单项设备动作回执来源：`mock` 或 `device`；不用于表示优化任务的 `mock/replay` 来源 |
| `dependency` | `model`、`device`、`environment`、`optimizer`、`telemetry`、`http` |
| `errorCode` | `shared/contracts/errors.md` 中的稳定公开错误码，不得使用异常消息代替 |
| `surface` | `assistant`、`http`、`frontend` |
| `retryable` | boolean，应与当次公开错误一致 |

## 5. 允许/禁止字段检查表

| 检查项 | 通过标准 |
|---|---|
| 信封白名单 | 只有第 2 节允许的顶层字段，`eventVersion=1.0.0` |
| 属性白名单 | `properties` 精确包含当前 `eventName` 对应的必需且仅允许字段，没有多余字段 |
| 必需字段 | 信封和当前事件属性全部存在，类型正确 |
| 对话内容 | 不存在用户完整输入、助手完整回复、完整会话或其片段 |
| 凭据 | 不存在 API Key、Secret、Token、设备凭据或可执行连接信息 |
| 个人信息 | 不存在未脱敏姓名、联系方式、精确住址或其他可识别个人的信息 |
| 模型与内部错误 | 不存在模型原始提示词、模型原始输出、内部堆栈或异常消息 |
| 设备标识 | 不存在自由文本设备名；只使用 `deviceType` 或契约允许的稳定 ID 不可逆散列 |
| 客户端身份 | 不存在浏览器自报 `actorId`、`scopeId` 或任意身份头 |
| Mock/Replay 真实性 | 事件不会被用于声称真实模型、真实设备、真实 DQN 或真实收益 |
| 发送失败 | 事件网关断开、超时或抛错时，主响应和业务副作用与未启用事件时一致 |

## 6. 事件契约收口状态

main 提交 `9419a34` 已明确 `properties` 必需性、逐事件字段/类型/枚举白名单以及 `executionSource` 语义。原第 6 节四项待确认问题均已关闭；联调应直接使用 v1.0.0 共享 Schema 验证事件。
