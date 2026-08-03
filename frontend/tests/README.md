# Frontend Tests

使用 Node.js 内置测试运行器，不新增第三方依赖：

```powershell
cd frontend
npm test
```

当前覆盖入口页独立注销旧 Service Worker/清理应用缓存与版本化动态导入、对话请求标识、locale/timezone/continuation、health/bootstrap 启动顺序、断线 UI Mock 降级、model 来源与结构化公开错误保留、四页面来源标识、快捷场景边界、任务状态和部分成功文案。
