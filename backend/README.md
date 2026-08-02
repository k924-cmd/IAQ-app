# Backend

新后端从共享契约开始构建，目前不包含模型调用、设备执行或生产服务。

## 初始边界

- `src/api/`：HTTP 或其他传输适配。
- `src/conversation/`：对话用例编排。
- `src/ai/`：未来模型提供商适配。
- `src/devices/`：未来设备网关适配。
- `src/policies/`：安全与产品策略。
- `src/telemetry/`：脱敏事件和诊断。

后端实现不得直接被 `frontend/` 导入；双方只通过 `shared/contracts/` 协作。
