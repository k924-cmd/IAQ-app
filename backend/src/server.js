import { fileURLToPath } from "node:url";
import { createHttpAssistantServer, DEFAULT_ALLOWED_ORIGINS, DEFAULT_HTTP_HOST, DEFAULT_HTTP_PORT } from "./api/http-server.js";
import { createLocalAssistant, DeepSeekModelAdapter } from "./index.js";
import { loadDotEnvIfPresent } from "./config/env.js";

loadDotEnvIfPresent(fileURLToPath(new URL("../.env", import.meta.url)));
const host = process.env.HOST || DEFAULT_HTTP_HOST;
const configuredPort = Number(process.env.PORT ?? DEFAULT_HTTP_PORT);
const port = Number.isInteger(configuredPort) && configuredPort >= 0 && configuredPort <= 65_535 ? configuredPort : DEFAULT_HTTP_PORT;
const allowedOrigins = process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS;

function resolveModel() {
  const enabled = ["1", "true", "yes", "on"].includes(String(process.env.DEEPSEEK_ENABLED ?? "").toLowerCase());
  if (!enabled || !process.env.DEEPSEEK_API_KEY) return null;
  return new DeepSeekModelAdapter();
}

const model = resolveModel();
const assistant = createLocalAssistant(model ? { model } : {});
const service = createHttpAssistantServer({ assistant, host, port, allowedOrigins });
const address = await service.start();

console.log(`呼吸森林本地 HTTP 服务监听 ${address.url}${model ? `；真实模型适配器已启用（${model.model}，密钥不显示）` : ""}`);

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await service.close();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
