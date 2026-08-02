# Environment Contract v1.0.0

## EnvironmentSnapshot

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `pm25` | number | 是 | `μg/m³`，不得为负数 |
| `co2` | number | 是 | `ppm`，不得为负数 |
| `humidity` | number | 是 | 百分比，0–100 |
| `temperature` | number | 是 | 摄氏度 |
| `score` | number | 是 | 0–100 |
| `status` | string | 是 | 用户可见综合状态 |
| `observedAt` | ISO-8601 string | 是 | 观测时间 |
| `source` | `mock` / `replay` / `sensor` | 是 | 数据来源 |
| `freshness` | `fresh` / `stale` | 是 | 后端计算结果 |

## 新鲜度与失败语义

- V1 默认新鲜度上限为 300 秒，以服务端当前时间与 `observedAt` 比较。
- 超过上限必须标记 `stale`，并返回 `ENVIRONMENT_STALE`；不得作为“当前环境”事实。
- 缺失、无效或读取失败返回 `ENVIRONMENT_UNAVAILABLE`，不得由模型、聊天历史或预测值补齐。
- `mock` 和 `replay` 必须传播到最终回复和前端展示。
