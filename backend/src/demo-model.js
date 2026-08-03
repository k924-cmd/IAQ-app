// Real-model verification demo: sends chat and knowledge questions to the
// configured DeepSeek adapter and prints the structured reply. The generated
// text is display-only and never represents device state or execution facts.

import { fileURLToPath } from "node:url";
import { createLocalAssistant, DeepSeekModelAdapter } from "./index.js";
import { loadDotEnvIfPresent } from "./config/env.js";

loadDotEnvIfPresent(fileURLToPath(new URL("../.env", import.meta.url)));

const model = new DeepSeekModelAdapter();
if (!model.available) {
  console.error("未启用真实模型：请在 backend/.env 或环境变量中配置 DEEPSEEK_ENABLED=1 与 DEEPSEEK_API_KEY。");
  process.exit(1);
}

const assistant = createLocalAssistant({ model });
const questions = ["你好，简单介绍一下自己", "二氧化碳为什么会升高"];

for (const [index, question] of questions.entries()) {
  const response = await assistant.sendMessage({
    contractVersion: "1.0.0",
    conversationId: "demo-model",
    clientMessageId: `demo-model-client-${index + 1}`,
    idempotencyKey: `demo-model-key-${index + 1}`,
    message: question,
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
  }, { actorId: "demo-actor", scopeId: "demo-scope" });
  console.log(JSON.stringify({ question, responseType: response.responseType, content: response.message.content, sources: response.sources }, null, 2));
}

console.log("演示说明：以上文本由真实模型生成，仅用于展示，不代表当前设备状态或执行结果。");
