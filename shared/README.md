# Shared

`shared/**` 保存四条线共同依赖的稳定边界，由协调窗口最终维护。

## 当前版本

- AI 小助手契约：`1.0.0`
- 状态：`accepted`
- 产品输入：`product/PRD.md`、`product/USER_FLOWS.md`、`product/ACCEPTANCE_CRITERIA.md`
- 机器可读入口：`contracts/ai-assistant-v1.schema.json`

## 兼容规则

- 契约采用 SemVer；新增可选字段为 minor，删除字段、改变必需性或枚举语义为 major。
- 所有请求和响应必须携带 `contractVersion`；V1 固定为 `1.0.0`。
- 未知可选字段应忽略；未知枚举值、缺少必需字段或 major 版本不匹配必须拒绝。
- 破坏性变更必须先登记到 `CHANGE_REQUESTS.md`，说明迁移与回滚方案。

## V1 实现边界

- 首轮后端只使用本地 Mock/Replay、固定规则和可替换模型适配器，不调用真实模型、真实 MQTT 或真实设备。
- `mock`、`replay`、`sensor`、`device`、`rule`、`model`、`template` 是来源，不等同于可信等级；是否可用于执行由策略决定。
- 设备执行成功只能由执行适配器返回的 `succeeded` 回执证明。
