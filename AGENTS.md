# AGENTS.md — 呼吸森林重构规则

## 当前目标

项目已终止旧 AI V1、Architecture V2 Phase A、旧评测与 DQN 接入路线。当前主线以现有 UI 为基线，从共享契约开始重建前端、后端、产品和运营能力。

## 四线所有权

- 前端：`frontend/**`
- 后端：`backend/**`
- 产品：`product/**`
- 运营：`operations/**`
- 共享契约与跨线协调：`shared/**`

每条线可以独立开发，但不得单方面修改 `shared/contracts/**`。共享契约变更必须在 `shared/CHANGE_REQUESTS.md` 登记，并由受影响线共同确认。

## 基本纪律

- 前端通过服务接口访问数据，不直接依赖后端内部模块。
- 后端不得把模型输出直接当作可信执行结果。
- 产品行为、安全边界或破坏性 Schema 变化必须先记录决策。
- 运营事件不得记录密钥、完整敏感对话或未脱敏个人信息。
- 不输出、记录或提交任何 API Key、Secret 或 Token。
- 中文文本和 JSON 显式使用 UTF-8。
- 不把 Mock、演示数据或本地测试描述为真实设备、生产 AI 或正式验收结果。

## 历史

旧 AI、Phase A、验收报告和 DQN 路线保存在 Git 标签 `legacy-ai-v1-phase-a-20260802`，不再参与当前主线开发。
