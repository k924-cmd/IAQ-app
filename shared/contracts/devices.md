# Device Contract v1.0.0

## Device

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 稳定设备 ID |
| `type` | enum | 是 | `air_purifier`、`smart_window`、`range_hood`、`fresh_air`、`humidifier`、`circulation_fan` |
| `name` | string | 是 | 用户可见名称 |
| `aliases` | string[] | 是 | 规范化别名 |
| `room` | string | 是 | 所属空间 |
| `connectionStatus` | enum | 是 | `online`、`offline`、`unknown`、`unavailable` |
| `controlSupport` | enum | 是 | `supported`、`read_only`、`not_integrated` |
| `availableActions` | `DeviceAction[]` | 是 | 当前可执行动作 |
| `state` | string | 是 | 类型对应状态或 `unknown` |
| `stateVersion` | non-negative integer | 是 | 每次可信状态变化递增 |
| `observedAt` | ISO-8601 string | 是 | 状态观测时间 |
| `source` | `mock` / `device` | 是 | 状态来源 |

## V1 设备与动作

| 类型 | 状态 | 动作 | 控制策略 |
|---|---|---|---|
| `air_purifier` | `on` / `off` | `turn_on` / `turn_off` | 明确且策略允许时可直接执行 |
| `range_hood` | `on` / `off` | `turn_on` / `turn_off` | 明确且策略允许时可直接执行 |
| `smart_window` | `open` / `closed` | `open` / `close` | 状态改变必须确认 |
| 其他三类 | `unknown` | 无 | V1 只读展示“待接入” |

## DeviceCommand

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `requestId` | string | 是 | 请求追踪标识 |
| `idempotencyKey` | string | 是 | 24 小时内保证同作用域幂等 |
| `planId` | string | 是 | 已通过策略的确定性计划 |
| `deviceId` | string | 是 | 注册表解析后的 ID |
| `action` | `DeviceAction` | 是 | 规范动作 |
| `expectedStateVersion` | integer | 是 | 乐观并发校验 |
| `issuedAt` | ISO-8601 string | 是 | 发出时间 |

- 模型输出不得构造或直接提交 `DeviceCommand`。
- 状态已满足时返回 `noop` 回执，不产生新的设备动作记录。
- 状态版本不匹配时拒绝执行，并使相关确认失效。
