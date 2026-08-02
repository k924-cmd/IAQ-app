# UI 基线验收标准

- 四个主页面可访问，无控制台运行错误。
- 导航、设备列表切换、设备详情、Mock 开关、聊天和资料弹窗可交互。
- 页面不调用旧 AI、后端或 DQN 模块。
- 页面文案明确区分 Mock 与真实能力。
- 刷新后使用 `breathForestUiV2` 恢复本地 UI 状态。
- PWA Manifest 和 Service Worker 不引用已删除文件。
