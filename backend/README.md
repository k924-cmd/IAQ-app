# 呼吸森林 AI 小助手 V1 后端

这是一个零第三方运行时依赖的 Node.js ESM 本地可信链路实现。默认配置只使用确定性的内存状态、Fake 模型、Mock 设备、Mock 环境和 Mock 优化器；不会联网，不会调用真实模型、MQTT、设备或 DQN `live_model`。

## 运行

要求 Node.js 20 或更高版本。

```powershell
cd backend
node src/demo.js
node --test
npm run start:http
```

`demo.js` 只展示本地 Mock 环境查询，并在输出中明确标记其非真实来源。项目也提供 `npm start`、`npm test` 和 `npm run test:ac` 脚本。

`npm run start:http` 使用 Node.js 内置 HTTP 服务，默认只监听 `127.0.0.1:8787`。它提供 `GET /v1/health`、`GET /v1/bootstrap`、`POST /v1/conversations/messages` 与 CORS 预检；默认只接受来自 `http://localhost:4173` 和 `http://127.0.0.1:4173` 的浏览器请求。命令行可用非敏感环境变量 `HOST`、`PORT`、`ALLOWED_ORIGINS` 覆盖本地配置。请求体限制为 64 KiB，处理期限为 15 秒；本地 `actorId` 与 `scopeId` 始终由服务端配置注入，客户端身份头不会被信任。该入口仍只连接确定性 Fake/Mock/Replay 适配器，不会联网或连接真实模型、设备。

代码内可通过 `createHttpAssistantServer({ port: 0 })` 创建服务；`await service.start()` 返回实际随机端口，`await service.close()` 可完成关闭，适合本地联调与测试。

## 真实模型适配器（DeepSeek，可选）

真实模型仅用于 V1 普通聊天与空气健康知识问答的回复文本生成（DEP-2026-08-03-002）。它**默认关闭**：`createLocalAssistant()` 仍使用确定性 `FakeModelAdapter`，不会联网。模型输出只参与 `message.content`，`responseType`、设备、环境、策略、回执与来源结构仍由固定代码决定；没有 `ExecutionReceipt` 时，模型文本不得携带设备执行或当前状态事实，命中该边界的文本会被固定模板替换并按 `MODEL_UNAVAILABLE` 降级。

启用方式（二选一）：

- 环境变量：设置 `DEEPSEEK_ENABLED=1` 与 `DEEPSEEK_API_KEY=...`，再运行 `npm run start:http` 或 `npm run demo:model`。
- 本地文件：复制 `backend/.env.example` 为 `backend/.env` 并填入密钥。`backend/.env` 已被 `.gitignore` 忽略，禁止提交。

可用变量：`DEEPSEEK_ENABLED`、`DEEPSEEK_API_KEY`、`DEEPSEEK_ENDPOINT`（默认 `https://api.deepseek.com`）、`DEEPSEEK_MODEL`（默认 `deepseek-chat`）、`DEEPSEEK_MAX_TOKENS`（上限 512）、`DEEPSEEK_TIMEOUT_MS`（上限 15 秒）。适配器不自动重试，密钥不会写入日志、遥测或错误响应。

真实调用验证：

```powershell
cd backend
npm run demo:model
```

`demo:model` 会向 DeepSeek 发送一条聊天与一条知识问题，输出 `responseType`、`content` 与 `sources`；正常时应看到 `sources[0].type` 为 `model`。该演示输出只代表模型生成文本，不代表当前设备状态或执行结果。也可以通过 `start:http` 启动后向 `POST /v1/conversations/messages` 发送普通聊天观察相同结构。代码内注入 `fetchImpl` 的测试（`tests/deepseek-model.test.js`）可在不联网的情况下验证请求结构、超时、限额与降级。

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

当前本地 V1 不向用户透传聊天或知识模型的自由文本：模型候选只允许选择意图，所有实体重新从用户原话提取；普通聊天使用固定非执行模板，知识问答由可审计的本地主题库按原话选择内容，来源均为 `template`。知识库覆盖 PM2.5、CO2、湿度、温度、通风、三类 V1 设备、Mock/Replay 模拟优化及一般安全边界。这样在没有 `ExecutionReceipt` 时，模型文本无法携带设备执行结果或当前设备状态事实。

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

优化器返回候选后会再次读取任务，并验证 `taskId`、`taskVersion` 与 `running` 状态；优化器等待期间发生暂停、停止、恢复或替换时，本轮候选会被丢弃。多动作执行还会在每个设备命令发出前重复执行同一任务守卫；前一个设备等待期间状态变化时，剩余动作不会发送，并在回执中标记中止。暂停任务会保存恢复约束快照，恢复前复核任务规格、固定策略、设备集合、能力、连接状态和状态版本。

## V1 边界

- 同一作用域至多一个 `scheduled`、`running` 或 `paused` 任务。
- 烹饪守护模板固定为抽油烟机和空气净化器开启；窗户只有用户本次明确选择时才加入。
- 优化只支持 `comfort`、`balanced`、`eco` 三种固定配置和 `mock`/`replay` 来源。
- 设备、环境和任务状态只来自当前可信适配器或状态仓库，不从聊天文本恢复。
- 状态仓库是本地内存实现，进程重启后不会恢复；生产持久化、认证传输层和外部服务接入不在本次范围。

验收映射见 [`tests/ac-coverage.md`](tests/ac-coverage.md)。
