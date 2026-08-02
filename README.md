# 呼吸森林四线重构基线

当前主线保留“呼吸森林”UI，并按产品、共享契约、前端、后端和运营边界重建 AI 小助手 V1。旧 Phase A、失败评测与 DQN 路线已退出活动工作树，可通过 Git 标签 `legacy-ai-v1-phase-a-20260802` 查阅。

## 目录

- `frontend/`：静态 PWA；优先连接本地 HTTP 后端，断开时明确降级为 UI Mock。
- `backend/`：本地可信 AI 链路、Mock/Replay 适配器和 HTTP 入口。
- `product/`：产品范围、用户流程和验收标准。
- `operations/`：内容、指标、发布与运行手册。
- `shared/`：API、事件、错误和数据结构契约。

## 本地联调

要求 Node.js 20 或更高版本。先启动后端：

```powershell
cd backend
npm.cmd run start:http
```

再启动前端：

```powershell
cd frontend
python -m http.server 4173
```

访问 `http://127.0.0.1:4173`。页面会连接 `http://127.0.0.1:8787/v1`；后端只使用本地确定性规则、Fake/Mock/Replay，不调用真实模型、MQTT、设备或 DQN `live_model`。后端不可用时，前端会显示“本地 UI Mock / 未连接后端”，且不会把旧浏览器状态当作后端事实。

## 验证

```powershell
cd backend
npm.cmd test

cd ..\frontend
npm.cmd test
```

## 协作原则

产品先定义行为和验收条件，共享契约定义跨线边界；前端可基于 Mock 开发，后端按同一契约实现，运营同步定义事件、文案和发布检查。
