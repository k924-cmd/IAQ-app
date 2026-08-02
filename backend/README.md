# 呼吸森林 AI 小助手 V1 后端

这是一个零第三方运行时依赖的 Node.js ESM 本地可信链路实现。默认配置只使用确定性的内存状态、Fake 模型、Mock 设备、Mock 环境和 Mock 优化器；不会联网，不会调用真实模型、MQTT、设备或 DQN `live_model`。

## 运行

要求 Node.js 20 或更高版本。

```powershell
cd backend
node src/demo.js
node --test
```

`demo.js` 只展示本地 Mock 环境查询，并在输出中明确标记其非真实来源。项目也提供 `npm start`、`npm test` 和 `npm run test:ac` 脚本。

## 可信链路

```text
输入/契约/幂等校验
  -> 当前会话待确认或待澄清优先
  -> 本地规则，必要时模型候选语义
  -> 候选结构校验与固定路由
  -> 可信设备解析/环境读取
  -> 确定性计划与计划哈希
  -> 策略裁决
  -> 120 秒确认与状态版本复核
  -> Mock 执行器
  -> 可信逐项回执
  -> 固定安全回复与脱敏事件
```

模型适配器不能生成 `DeviceCommand`，也不能决定设备 ID、执行计划、策略或执行结果。只有注册表解析、固定计划、策略和状态版本检查全部通过后，服务才会调用设备适配器。

## 入口

```js
import { createLocalAssistant } from "./src/index.js";

const assistant = createLocalAssistant();
const response = await assistant.sendMessage(request, {
  actorId: "trusted-transport-actor",
  scopeId: "trusted-home-scope",
});
```

`actorId` 和 `scopeId` 必须由可信传输层注入，不能从消息正文读取。`createLocalAssistant(overrides)` 可替换时钟、ID、状态仓库、模型、设备、环境、优化器、遥测和设备注册表适配器。

任务运行器提供两个显式入口，便于未来由受控调度器调用：

- `runDueTasks(scopeId)`：触发到期的当天烹饪守护；触发前复核任务版本，触发后复核设备版本与策略。
- `runOptimizationCycle(scopeId)`：让 Mock/Replay 产生候选动作，再经过设备解析、动作屏蔽、策略和执行回执链路。

## V1 边界

- 同一作用域至多一个 `scheduled`、`running` 或 `paused` 任务。
- 烹饪守护模板固定为抽油烟机和空气净化器开启；窗户只有用户本次明确选择时才加入。
- 优化只支持 `comfort`、`balanced`、`eco` 三种固定配置和 `mock`/`replay` 来源。
- 设备、环境和任务状态只来自当前可信适配器或状态仓库，不从聊天文本恢复。
- 状态仓库是本地内存实现，进程重启后不会恢复；生产持久化、认证传输层和外部服务接入不在本次范围。

验收映射见 [`tests/ac-coverage.md`](tests/ac-coverage.md)。
