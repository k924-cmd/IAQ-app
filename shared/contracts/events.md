# Analytics Event Contract v0.1

| 事件 | 必需字段 | 禁止字段 |
|---|---|---|
| `page_viewed` | `page`, `occurredAt` | 用户完整输入 |
| `mock_device_toggled` | `deviceId`, `displayState`, `occurredAt` | 真实设备凭据 |
| `mock_message_sent` | `messageLength`, `occurredAt` | 完整消息正文 |
| `ui_error_shown` | `errorCode`, `surface`, `occurredAt` | Token、Secret、内部堆栈 |
