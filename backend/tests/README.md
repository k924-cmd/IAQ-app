# Backend tests

运行全部后端测试：

```powershell
cd backend
node --test
```

测试名称直接包含产品 AC 编号；完整映射见 `ac-coverage.md`。测试只使用确定性 Fake/Mock/Replay，不访问网络、真实模型、真实 MQTT 或真实设备。

`contract-compatibility.test.js` 是对环境、确认、执行与任务等代表性响应的样例兼容校验，仅实现这些路径使用到的 JSON Schema 关键字子集，不是完整的 Draft 2020-12 JSON Schema 验证器。
