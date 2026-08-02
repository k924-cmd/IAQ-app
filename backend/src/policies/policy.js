export function decideSingleDevice(device, action, targetState) {
  if (!device) return reject("DEVICE_NOT_FOUND", "未找到该设备。");
  if (device.controlSupport !== "supported") return reject("ACTION_UNSUPPORTED", "该设备在 V1 中尚未接入控制。");
  if (device.connectionStatus !== "online" || device.state === "unknown") return reject("DEVICE_UNAVAILABLE", "设备离线或状态未知，不能执行。");
  if (!device.availableActions.includes(action) || !targetState) return reject("ACTION_UNSUPPORTED", "设备不支持该动作。");
  if (device.state === targetState) return { outcome: "allow", reasonCodes: ["TARGET_ALREADY_SATISFIED"], alternatives: [] };
  if (device.type === "smart_window") return { outcome: "confirm", reasonCodes: ["WINDOW_STATE_CHANGE"], alternatives: [] };
  return { outcome: "allow", reasonCodes: ["EXPLICIT_IDEMPOTENT_CONTROL"], alternatives: [] };
}

export function validatePlannedActions(actions, registry) {
  for (const action of actions) {
    const device = registry.get(action.deviceId);
    if (!device || device.stateVersion !== action.expectedStateVersion) return reject("STATE_VERSION_MISMATCH", "设备状态已变化。");
    const decision = decideSingleDevice(device, action.action, action.targetState);
    if (decision.outcome === "reject") return decision;
  }
  return { outcome: "allow", reasonCodes: ["PLAN_REVALIDATED"], alternatives: [] };
}

export function reject(reasonCode, message, alternatives = []) {
  return { outcome: "reject", reasonCodes: [reasonCode], alternatives, message };
}

export function clarify(reasonCode, message, alternatives = []) {
  return { outcome: "clarify", reasonCodes: [reasonCode], alternatives, message };
}
