# Integration Tests

此目录用于前后端共享契约和本地集成环境测试。当前前端连接 `127.0.0.1:8787` 的本地 HTTP 后端；后端只使用确定性 Fake/Mock/Replay，不连接真实模型、MQTT、设备或生产服务。后端断开时，前端明确降级为 UI Mock。

当前可执行测试分别位于 `backend/tests/` 和 `frontend/tests/`。正式联调证据记录在 `operations/release/INTEGRATION_ACCEPTANCE_V1.md`。
