# 呼吸森林 UI 重构基线

当前主线只保留“呼吸森林”产品 UI，并从零重建 AI、设备、数据和运营逻辑。旧 AI V1、Phase A、评测报告与 DQN 路线已退出活动工作树，可通过 Git 标签 `legacy-ai-v1-phase-a-20260802` 查阅。

## 目录

- `frontend/`：可独立运行的静态 PWA 与本地 Mock。
- `backend/`：新后端边界，等待共享契约驱动实现。
- `product/`：产品范围、用户流程和验收标准。
- `operations/`：内容、指标、发布与运行手册。
- `shared/`：API、事件、错误和数据结构契约。

## 本地预览

```powershell
cd frontend
python -m http.server 4173
```

访问 `http://localhost:4173`。当前所有空气、设备、聊天和成就数据均为本地 UI Mock，不调用模型、不访问后端、不控制真实设备。

## 协作原则

产品先定义行为和验收条件，共享契约定义跨线边界；前端可基于 Mock 开发，后端按同一契约实现，运营同步定义事件、文案和发布检查。
