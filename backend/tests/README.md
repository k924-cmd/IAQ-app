# Backend tests

运行全部后端测试：

```powershell
cd backend
node --test
```

测试名称直接包含产品 AC 编号；完整映射见 `ac-coverage.md`。测试只使用确定性 Fake/Mock/Replay，不访问网络、真实模型、真实 MQTT 或真实设备。
