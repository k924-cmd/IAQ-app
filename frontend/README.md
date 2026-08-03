# Frontend

静态 PWA 前端。页面只通过 `src/services/` 调用共享 HTTP 契约，不导入或依赖 `backend/` 内部模块。

启动时前端依次请求 `GET /v1/health` 和 `GET /v1/bootstrap`，连接成功后使用本地 HTTP 后端返回的 Mock 设备、环境和任务快照；对话发送到 `POST /v1/conversations/messages`。后端不可用时，页面明确降级为“本地 UI Mock / 未连接后端”，不会把浏览器旧状态当作后端事实。

## 对话展示与体验

- 免责声明：助手回复中的通用免责（`Luna 是 AI 工具噢，我的回答仅供参考。`）与医疗强化句随 `content` 渲染，前端以统一样式展示且不省略；UI Mock 降级文案不声称真实模型能力。
- 智能窗户免确认：明确开关请求直接展示执行回执，不再进入确认卡片；任务创建、任务替换、烹饪守护与模拟优化的确认卡片保持不变。
- 增量渲染：聊天消息按消息 ID 增量追加/更新并自动滚动到底部，长对话不整表重建。

## 本地启动顺序

要求 Node.js 20 或更高版本。先启动本地 Mock HTTP 后端：

```powershell
cd backend
npm run start:http
```

再开一个终端启动前端静态服务：

```powershell
cd frontend
python -m http.server 4173
```

访问 `http://127.0.0.1:4173` 或 `http://localhost:4173`。如果先打开前端、后启动后端，刷新页面即可重新执行 health/bootstrap。

本地入口页会在加载主模块前注销旧 Service Worker，并只清理名称以 `breath-forest-ui-` 开头的应用缓存；若当前页面仍由旧 Service Worker 控制，会执行一次带恢复标记的重载，然后动态导入版本化主模块。这一恢复路径不依赖 `main.js` 成功执行。

## 测试

```powershell
cd frontend
npm test
```

测试使用 Node.js 内置测试运行器，不新增第三方依赖。
