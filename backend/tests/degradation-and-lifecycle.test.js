import test from "node:test";
import assert from "node:assert/strict";
import { FakeDeviceAdapter, FakeModelAdapter, FakeOptimizerAdapter } from "../src/index.js";
import { confirm, harness } from "./helpers.js";

test("AC-080 模型不可用不阻断本地唯一状态查询和控制", async () => {
  const { app, send } = harness({ model: new FakeModelAdapter({ available: false }) });
  const environment = await send("现在空气怎么样");
  const device = await send("打开空气净化器");
  assert.equal(environment.responseType, "environment_status");
  assert.equal(device.receipt.status, "succeeded");
  assert.equal(app.adapters.devices.commands.length, 1);
});

test("AC-081 模型不可用且本地无法可靠识别时不执行", async () => {
  const { app, send } = harness({ model: new FakeModelAdapter({ available: false }) });
  const result = await send("帮我弄得舒服点");
  assert.equal(result.responseType, "rejection");
  assert.equal(result.error.code, "INTENT_UNCLEAR");
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-082 回复模型失败时可信结果仍由固定模板展示", async () => {
  const model = new FakeModelAdapter({ responder: () => { throw new Error("reply failed"); } });
  const { send } = harness({ model });
  const result = await send("打开空气净化器");
  assert.equal(result.receipt.status, "succeeded");
  assert.match(result.message.content, /Mock 执行器确认完成/);
  assert.doesNotMatch(result.message.content, /reply failed/);
});

test("AC-083 设备服务不可用禁止动作但聊天仍独立工作", async () => {
  const devices = new FakeDeviceAdapter();
  devices.available = false;
  const { send } = harness({ devices });
  const failed = await send("打开空气净化器");
  assert.equal(failed.receipt.status, "failed");
  assert.equal(failed.receipt.actions[0].errorCode, "SERVICE_UNAVAILABLE");
  assert.doesNotMatch(failed.message.content, /确认完成/);
  assert.equal((await send("你好")).responseType, "chat");
});

test("AC-084 Mock/Replay 不可用时不创建任务也不继续候选动作", async () => {
  const optimizer = new FakeOptimizerAdapter();
  optimizer.available = false;
  const { app, send } = harness({ optimizer });
  const rejected = await send("启动舒适优先优化");
  assert.equal(rejected.error.code, "OPTIMIZER_UNAVAILABLE");
  assert.equal(app.taskService.current("home-1"), null);

  optimizer.available = true;
  const pending = await send("启动舒适优先优化");
  await confirm(send, pending.confirmation);
  optimizer.available = false;
  const cycle = await app.runOptimizationCycle("home-1");
  assert.equal(cycle.reason, "OPTIMIZER_UNAVAILABLE");
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-085 依赖故障恢复后仍复核期限、状态版本和策略", async (context) => {
  await context.test("state version", async () => {
    const devices = new FakeDeviceAdapter();
    devices.available = false;
    const { app, send } = harness({ devices });
    const pending = await send("打开智能窗户");
    app.adapters.registry.updateState("window-living", "open");
    devices.available = true;
    const invalidated = await confirm(send, pending.confirmation);
    assert.equal(invalidated.error.code, "CONFIRMATION_INVALIDATED");
    assert.equal(devices.commands.length, 0);
  });

  await context.test("expiry", async () => {
    const devices = new FakeDeviceAdapter();
    devices.available = false;
    const instance = harness({ devices });
    const pending = await instance.send("打开智能窗户");
    instance.app.adapters.clock.advance(121_000);
    devices.available = true;
    const expired = await confirm(instance.send, pending.confirmation);
    assert.equal(expired.error.code, "CONFIRMATION_EXPIRED");
    assert.equal(devices.commands.length, 0);
  });

  await context.test("policy", async () => {
    const devices = new FakeDeviceAdapter();
    devices.available = false;
    const { app, send } = harness({ devices });
    const pending = await send("打开智能窗户");
    const window = app.adapters.registry.get("window-living");
    app.adapters.registry.replace({ ...window, connectionStatus: "offline" });
    devices.available = true;
    const rejected = await confirm(send, pending.confirmation);
    assert.equal(rejected.error.code, "CONFIRMATION_INVALIDATED");
    assert.equal(devices.commands.length, 0);
  });
});

test("当天调度到期后重新校验并执行固定烹饪动作", async () => {
  const { app, send } = harness();
  const pending = await send("今天18点开始火锅空气守护");
  await confirm(send, pending.confirmation);
  assert.equal((await app.runDueTasks("home-1")).triggered, false);
  app.adapters.clock.set("2026-08-03T10:00:00.000Z");
  const due = await app.runDueTasks("home-1");
  assert.equal(due.triggered, true);
  assert.equal(due.receipt.status, "succeeded");
  assert.equal(due.receipt.actions.length, 2);
});

test("到期调度状态版本变化时失败且不执行", async () => {
  const { app, send } = harness();
  const pending = await send("今天18点开始火锅空气守护");
  await confirm(send, pending.confirmation);
  app.adapters.registry.updateState("hood-kitchen", "on");
  app.adapters.clock.set("2026-08-03T10:00:00.000Z");
  const due = await app.runDueTasks("home-1");
  assert.equal(due.errorCode, "POLICY_REJECTED");
  assert.equal(due.task.status, "failed");
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("会话结束清除最小会话临时状态", async () => {
  const { app, send } = harness();
  await send("打开智能窗户");
  assert.ok(app.adapters.repository.getConversation("conversation-1").pendingConfirmation);
  assert.equal(app.endConversation("conversation-1"), true);
  assert.equal(app.adapters.repository.conversations.has("conversation-1"), false);
});
