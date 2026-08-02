import { createHttpAssistantServer, DEFAULT_ALLOWED_ORIGINS, DEFAULT_HTTP_HOST, DEFAULT_HTTP_PORT } from "./api/http-server.js";

const host = process.env.HOST || DEFAULT_HTTP_HOST;
const configuredPort = Number(process.env.PORT ?? DEFAULT_HTTP_PORT);
const port = Number.isInteger(configuredPort) && configuredPort >= 0 && configuredPort <= 65_535 ? configuredPort : DEFAULT_HTTP_PORT;
const allowedOrigins = process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS;
const service = createHttpAssistantServer({ host, port, allowedOrigins });
const address = await service.start();

console.log(`呼吸森林本地 Mock HTTP 服务监听 ${address.url}`);

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await service.close();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
