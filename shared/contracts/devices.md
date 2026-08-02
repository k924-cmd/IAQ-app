# Device Contract v0.1

## Device

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 稳定设备 ID |
| `name` | string | 是 | 用户可见名称 |
| `room` | string | 是 | 所属空间 |
| `icon` | string | 是 | UI 图标标识 |
| `connectionStatus` | `mock` / `offline` / `online` | 是 | 连接状态 |
| `displayState` | string | 是 | 仅用于展示的状态 |
| `availableActions` | string[] | 是 | 当前允许展示的动作 |

v0.1 不定义真实设备执行协议。前端 Mock 切换不代表设备命令成功。
