import { createLocalAssistant } from "./index.js";

const assistant = createLocalAssistant();
const response = await assistant.sendMessage({
  contractVersion: "1.0.0",
  conversationId: "local-demo",
  clientMessageId: "demo-message-1",
  idempotencyKey: "demo-key-1",
  message: "现在空气怎么样",
  locale: "zh-CN",
  timezone: "Asia/Shanghai",
}, { actorId: "local-demo-user", scopeId: "local-demo-home" });

console.log(JSON.stringify({ notice: "本地确定性 Mock 演示，不代表真实设备或生产数据。", response }, null, 2));
