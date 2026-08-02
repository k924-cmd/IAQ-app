import test from "node:test";
import assert from "node:assert/strict";
import { FakeDeviceAdapter, FakeOptimizerAdapter } from "../src/index.js";
import { confirm, harness } from "./helpers.js";

async function createOptimization(send, mode = "舒适优先") {
  const pending = await send(`启动${mode}优化`);
  return confirm(send, pending.confirmation);
}

test("AC-040 AC-041 烹饪摘要固定且确认前不创建任务", async () => {
  const { app, send } = harness();
  const pending = await send("现在开始火锅空气守护");
  assert.equal(pending.responseType, "confirmation");
  assert.match(pending.message.content, /抽油烟机.*空气净化器.*不改变智能窗户.*立即开始.*持续至用户停止.*Mock/);
  assert.equal(app.taskService.current("home-1"), null);
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-042 AC-045 有效确认使用固定模板且默认不改变窗户", async () => {
  const { app, send } = harness();
  const pending = await send("现在开始烹饪空气守护");
  const result = await confirm(send, pending.confirmation);
  assert.equal(result.task.type, "cooking_guard");
  assert.deepEqual(app.adapters.devices.commands.map((item) => item.deviceId).sort(), ["hood-kitchen", "purifier-living"]);
  assert.equal(app.adapters.devices.commands.some((item) => item.deviceId === "window-living"), false);
});

test("AC-043 当天未来明确时间按时区回显、确认后进入 scheduled", async () => {
  const { send } = harness();
  const pending = await send("今天18点开始火锅空气守护");
  assert.match(pending.message.content, /2026-08-03T10:00:00\.000Z（Asia\/Shanghai）/);
  const result = await confirm(send, pending.confirmation);
  assert.equal(result.task.status, "scheduled");
  assert.equal(result.task.scheduledFor, "2026-08-03T10:00:00.000Z");
  const query = await send("当前是什么任务");
  assert.match(query.message.content, /创建时间：2026-08-03T04:00:00\.000Z.*计划时间：2026-08-03T10:00:00\.000Z/);
});

test("AC-044 过去、含糊、跨日时间均不创建任务", async () => {
  for (const text of ["今天10点开始火锅空气守护", "晚上开始火锅空气守护", "明天18点开始火锅空气守护"]) {
    const { app, send } = harness();
    const result = await send(text);
    assert.equal(result.responseType, "clarification");
    assert.equal(app.taskService.current("home-1"), null);
  }
});

test("AC-046 必要设备不可用时不创建烹饪任务", async () => {
  const { app, send } = harness();
  const hood = app.adapters.registry.get("hood-kitchen");
  app.adapters.registry.replace({ ...hood, connectionStatus: "offline" });
  const result = await send("现在开始火锅空气守护");
  assert.equal(result.error.code, "DEVICE_UNAVAILABLE");
  assert.equal(app.taskService.current("home-1"), null);
});

test("AC-047 烹饪动作部分成功逐项展示且不称整体成功", async () => {
  const devices = new FakeDeviceAdapter();
  devices.setOutcome("purifier-living", "failed");
  const { send } = harness({ devices });
  const pending = await send("现在开始火锅空气守护");
  const result = await confirm(send, pending.confirmation);
  assert.equal(result.receipt.status, "partial_success");
  assert.equal(result.receipt.actions.length, 2);
  assert.match(result.message.content, /部分成功.*不能视为整体成功/);
});

test("AC-050 AC-052 三种模式摘要完整且确认前不创建任务", async () => {
  for (const [label, mode] of [["舒适优先", "comfort"], ["均衡自动", "balanced"], ["低碳优先", "eco"]]) {
    const { app, send } = harness();
    const pending = await send(`启动${label}优化`);
    assert.match(pending.message.content, new RegExp(`${label}.*设备范围.*模拟优化.*持续至用户停止.*Mock`));
    assert.equal(app.taskService.current("home-1"), null);
    assert.equal(pending.confirmation.plan.isSimulation, true);
    assert.match(pending.confirmation.plan.summary, new RegExp(label));
    assert.equal(mode, pending.confirmation.plan.summary.includes(label) ? mode : "missing");
  }
});

test("AC-051 未选优化模式时列出三种模式", async () => {
  const { send } = harness();
  const result = await send("优化一下");
  assert.equal(result.clarification.kind, "mode");
  assert.deepEqual(result.clarification.options, ["舒适优先", "均衡自动", "低碳优先"]);
});

test("AC-053 有效确认只创建 Mock 或 Replay 模拟任务", async () => {
  for (const source of ["mock", "replay"]) {
    const optimizer = new FakeOptimizerAdapter({ source });
    const { send } = harness({ optimizer });
    const result = await createOptimization(send, "均衡自动");
    assert.equal(result.task.type, "optimization");
    assert.equal(result.task.mode, "balanced");
    assert.equal(result.task.isSimulation, true);
    assert.equal(result.task.executionSource, source);
  }
});

test("AC-054 离线、未接入、非法动作与需确认候选分别被屏蔽", async (context) => {
  const cases = [
    { name: "offline", candidate: { deviceId: "purifier-living", action: "turn_on" }, arrange(app) { const device = app.adapters.registry.get("purifier-living"); app.adapters.registry.replace({ ...device, connectionStatus: "offline" }); } },
    { name: "not-integrated", candidate: { deviceId: "humidifier", action: "turn_on" } },
    { name: "illegal-action", candidate: { deviceId: "purifier-living", action: "open" } },
    { name: "confirmation-required", candidate: { deviceId: "window-living", action: "open" } },
  ];
  for (const item of cases) {
    await context.test(item.name, async () => {
      const optimizer = new FakeOptimizerAdapter({ candidates: [item.candidate] });
      const { app, send } = harness({ optimizer });
      await createOptimization(send);
      item.arrange?.(app);
      const cycle = await app.runOptimizationCycle("home-1");
      assert.equal(cycle.executed, false);
      assert.equal(cycle.reason, "NO_LEGAL_CANDIDATE");
      assert.equal(app.adapters.devices.commands.length, 0);
    });
  }
});

test("AC-055 没有合法候选动作时明确本轮无执行", async () => {
  const optimizer = new FakeOptimizerAdapter({ candidates: [{ deviceId: "humidifier", action: "turn_on" }] });
  const { app, send } = harness({ optimizer });
  await createOptimization(send);
  const cycle = await app.runOptimizationCycle("home-1");
  assert.deepEqual({ executed: cycle.executed, reason: cycle.reason }, { executed: false, reason: "NO_LEGAL_CANDIDATE" });
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-056 自定义权重、真实 DQN/MQTT 和真实收益声明均拒绝", async () => {
  for (const text of ["自定义优化权重", "启动真实 DQN", "连接真实 MQTT", "告诉我真实节能收益"]) {
    const { send } = harness();
    const result = await send(text);
    assert.equal(result.responseType, "rejection");
    assert.match(result.message.content, /V1 不支持/);
  }
});

test("AC-057 模拟任务摘要、创建与状态回复始终标识模拟优化", async () => {
  const { send } = harness();
  const pending = await send("启动低碳优先优化");
  assert.match(pending.message.content, /模拟优化/);
  const created = await confirm(send, pending.confirmation);
  assert.match(created.message.content, /模拟优化/);
  assert.match((await send("当前是什么模式")).message.content, /模拟优化/);
  assert.match((await send("暂停")).message.content, /模拟优化/);
});

test("AC-060 AC-061 新任务冲突需询问，保留时旧任务不变", async () => {
  const { app, send } = harness();
  const oldTask = await createOptimization(send);
  const conflict = await send("现在开始火锅空气守护");
  assert.equal(conflict.confirmation.plan.kind, "task_replacement");
  assert.match(conflict.message.content, /先停止旧任务/);
  const keep = await send("保留");
  assert.match(keep.message.content, /已保留当前任务/);
  assert.equal(app.taskService.current("home-1").taskId, oldTask.task.taskId);
});

test("AC-062 替换顺序为先停旧任务后建新任务，停止失败不创建", async () => {
  const success = harness();
  const old = await createOptimization(success.send);
  const replacement = await success.send("现在开始火锅空气守护");
  const created = await confirm(success.send, replacement.confirmation);
  assert.equal(created.task.type, "cooking_guard");
  assert.notEqual(created.task.taskId, old.task.taskId);

  const failure = harness();
  const original = await createOptimization(failure.send);
  const pending = await failure.send("现在开始火锅空气守护");
  failure.app.taskService.stopForReplacement = () => ({ found: true, changed: false, task: original.task });
  const failed = await confirm(failure.send, pending.confirmation);
  assert.equal(failed.error.code, "INVALID_TASK_TRANSITION");
  assert.equal(failure.app.adapters.repository.getTask("home-1").taskId, original.task.taskId);
});

test("AC-063 暂停后优化任务不再产生动作", async () => {
  const optimizer = new FakeOptimizerAdapter({ candidates: [{ deviceId: "purifier-living", action: "turn_on" }] });
  const { app, send } = harness({ optimizer });
  await createOptimization(send);
  const paused = await send("暂停");
  assert.equal(paused.task.status, "paused");
  assert.equal((await app.runOptimizationCycle("home-1")).reason, "NO_RUNNING_OPTIMIZATION");
});

test("AC-063 优化器 await 期间暂停、停止、替换或版本变化均丢弃候选", async (context) => {
  async function startDeferredCycle() {
    const optimizer = new FakeOptimizerAdapter();
    let release;
    optimizer.propose = () => new Promise((resolve) => { release = resolve; });
    const instance = harness({ optimizer });
    await createOptimization(instance.send);
    const cycle = instance.app.runOptimizationCycle("home-1");
    assert.equal(typeof release, "function");
    return { ...instance, release, cycle };
  }

  await context.test("pause-and-resume-version-change", async () => {
    const running = await startDeferredCycle();
    await running.send("暂停");
    await running.send("恢复");
    running.release([{ deviceId: "purifier-living", action: "turn_on" }]);
    const result = await running.cycle;
    assert.equal(result.reason, "TASK_CHANGED_DURING_OPTIMIZATION");
    assert.equal(running.app.adapters.devices.commands.length, 0);
  });

  await context.test("stop", async () => {
    const running = await startDeferredCycle();
    await running.send("停止");
    running.release([{ deviceId: "purifier-living", action: "turn_on" }]);
    const result = await running.cycle;
    assert.equal(result.reason, "TASK_CHANGED_DURING_OPTIMIZATION");
    assert.equal(running.app.adapters.devices.commands.length, 0);
  });

  await context.test("replace", async () => {
    const running = await startDeferredCycle();
    const replacement = await running.send("现在开始火锅空气守护");
    await confirm(running.send, replacement.confirmation);
    const replacementCommandCount = running.app.adapters.devices.commands.length;
    running.release([{ deviceId: "purifier-living", action: "turn_off" }]);
    const result = await running.cycle;
    assert.equal(result.reason, "TASK_CHANGED_DURING_OPTIMIZATION");
    assert.equal(running.app.adapters.devices.commands.length, replacementCommandCount);
    assert.equal(running.app.taskService.current("home-1").type, "cooking_guard");
  });
});

test("AC-064 恢复按保存规格复核依赖、设备版本、能力和可选窗户", async (context) => {
  await context.test("optimizer dependency", async () => {
    const optimizer = new FakeOptimizerAdapter();
    const { send } = harness({ optimizer });
    await createOptimization(send);
    await send("暂停");
    optimizer.available = false;
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "OPTIMIZER_UNAVAILABLE");
  });

  await context.test("optimization device state version", async () => {
    const { app, send } = harness();
    await createOptimization(send);
    await send("暂停");
    app.adapters.registry.updateState("purifier-living", "on");
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "CONFIRMATION_INVALIDATED");
  });

  await context.test("optimization capability policy", async () => {
    const { app, send } = harness();
    await createOptimization(send);
    await send("暂停");
    const hood = app.adapters.registry.get("hood-kitchen");
    app.adapters.registry.replace({ ...hood, availableActions: [] });
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "POLICY_REJECTED");
  });

  await context.test("optimization fixed policy configuration", async () => {
    const { app, send } = harness();
    const created = await createOptimization(send);
    await send("暂停");
    app.taskSpecs.get(created.task.taskId).policyConfigHash = "tampered";
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "POLICY_REJECTED");
  });

  await context.test("cooking optional window constraint", async () => {
    const { app, send } = harness();
    const pending = await send("现在开始火锅空气守护并打开窗户");
    await confirm(send, pending.confirmation);
    await send("暂停");
    app.adapters.registry.updateState("window-living", "closed");
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "CONFIRMATION_INVALIDATED");
  });

  await context.test("cooking fixed action policy", async () => {
    const { app, send } = harness();
    const pending = await send("现在开始火锅空气守护");
    const created = await confirm(send, pending.confirmation);
    await send("暂停");
    const specification = app.taskSpecs.get(created.task.taskId);
    specification.actions[0].action = "turn_off";
    specification.actions[0].targetState = "off";
    const result = await send("恢复");
    assert.equal(result.task.status, "paused");
    assert.equal(result.error.code, "POLICY_REJECTED");
  });
});

test("AC-065 停止任务不宣称反转历史设备动作", async () => {
  const { app, send } = harness();
  const pending = await send("现在开始火锅空气守护");
  await confirm(send, pending.confirmation);
  const before = app.adapters.devices.commands.length;
  const stopped = await send("停止");
  assert.equal(stopped.task.status, "stopped");
  assert.match(stopped.message.content, /不会自动反转/);
  assert.equal(app.adapters.devices.commands.length, before);
});

test("AC-066 无当前任务时查询、暂停、恢复、停止均返回无任务", async () => {
  for (const text of ["当前是什么任务", "暂停", "恢复", "停止"]) {
    const { send } = harness();
    const result = await send(text);
    assert.equal(result.error.code, "TASK_NOT_FOUND");
    assert.match(result.message.content, /没有活动任务/);
  }
});

test("AC-067 重复暂停、恢复、停止保持幂等状态版本", async () => {
  const { app, send } = harness();
  await createOptimization(send);
  const paused = await send("暂停");
  const pausedAgain = await send("暂停");
  assert.equal(pausedAgain.task.taskVersion, paused.task.taskVersion);
  const resumed = await send("恢复");
  const resumedAgain = await send("恢复");
  assert.equal(resumedAgain.task.taskVersion, resumed.task.taskVersion);
  const stopped = await send("停止");
  assert.equal(stopped.task.status, "stopped");
  const stoppedVersion = stopped.task.taskVersion;
  const transitionEvents = app.adapters.telemetry.events.filter((event) => event.eventName === "task_state_changed").length;
  const stoppedAgain = await send("停止");
  assert.equal(stoppedAgain.task.status, "stopped");
  assert.equal(stoppedAgain.task.taskVersion, stoppedVersion);
  assert.equal(stoppedAgain.error, undefined);
  assert.equal(app.adapters.telemetry.events.filter((event) => event.eventName === "task_state_changed").length, transitionEvents);
  assert.equal(app.taskService.current("home-1"), null);
  const query = await send("当前是什么任务");
  assert.equal(query.error.code, "TASK_NOT_FOUND");
});

test("AC-070 AC-071 确认只执行当前待确认计划，无计划不回放", async () => {
  const { app, send } = harness();
  assert.equal((await send("确认")).error.code, "CONFIRMATION_NOT_FOUND");
  const pending = await send("打开智能窗户");
  await confirm(send, pending.confirmation);
  assert.equal(app.adapters.devices.commands.length, 1);
  assert.equal((await send("确认")).error.code, "CONFIRMATION_NOT_FOUND");
  assert.equal(app.adapters.devices.commands.length, 1);
});

test("AC-072 取消清除待确认且不执行", async () => {
  const { app, send } = harness();
  await send("打开智能窗户");
  const result = await send("不用了");
  assert.match(result.message.content, /已取消/);
  assert.equal(app.adapters.repository.getConversation("conversation-1").pendingConfirmation, null);
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-073 最近唯一设备指代重新经过安全链路", async () => {
  const { app, send } = harness();
  await send("打开空气净化器");
  const result = await send("把它关掉");
  assert.equal(result.receipt.status, "succeeded");
  assert.equal(app.adapters.devices.commands.length, 2);
});

test("AC-074 无最近设备或跨会话指代要求重新选择", async () => {
  const { app, send } = harness();
  assert.equal((await send("把它关掉")).clarification.kind, "reference");
  await send("空气净化器状态怎么样", { conversationId: "conversation-a" });
  const cross = await send("把它关掉", { conversationId: "conversation-b" });
  assert.equal(cross.clarification.kind, "reference");
  assert.equal(app.adapters.devices.commands.length, 0);
});

test("AC-075 澄清补充与原请求合并后重新走完整链路", async () => {
  const { app, send } = harness();
  const pending = await send("打开");
  const result = await send("空气净化器", { continuation: { type: "clarification", id: pending.clarification.clarificationId } });
  assert.equal(result.receipt.status, "succeeded");
  assert.equal(app.adapters.devices.commands.length, 1);
});

test("AC-076 明确改变话题时清除旧澄清", async () => {
  const { app, send } = harness();
  await send("打开");
  const result = await send("现在空气怎么样");
  assert.equal(result.responseType, "environment_status");
  assert.equal(app.adapters.repository.getConversation("conversation-1").pendingClarification, null);
});

test("AC-077 跨日或跨会话历史方案不恢复", async () => {
  const { app, send } = harness();
  const result = await send("按三天前那个方案来");
  assert.equal(result.responseType, "rejection");
  assert.match(result.message.content, /不恢复.*历史方案.*重新选择/);
  assert.equal(app.adapters.devices.commands.length, 0);
});
