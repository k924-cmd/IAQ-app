// Real generative model adapter for local V1 development.
//
// Opt-in only: the default backend keeps FakeModelAdapter and never calls out.
// When enabled, the adapter only generates display text for chat / knowledge;
// routing, entities, device resolution, environment facts, policy and
// execution receipts remain fixed code. The API key is read from local
// configuration and is never logged, emitted, or included in errors.

import { fileURLToPath } from "node:url";
import { loadDotEnvIfPresent } from "../config/env.js";

export const DEEPSEEK_DEFAULT_ENDPOINT = "https://api.deepseek.com";
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";
export const DEEPSEEK_MAX_TOKENS_CAP = 512;
export const DEEPSEEK_TIMEOUT_MS_CAP = 15_000;

const SYSTEM_PROMPTS = Object.freeze({
  chat: "你是“呼吸森林”的本地 AI 小助手 Luna。你可以进行一般性聊天，并介绍空气与设备知识。你必须只依据用户给出的信息回答：不得编造或声称当前设备状态、当前环境读数或任何执行结果；不得声称已经操作设备或将要自动操作设备；不得提供医疗诊断或紧急救助建议。请使用中文，回答简洁自然。",
  knowledge: "你是“呼吸森林”的空气健康知识助手。请使用中文简洁、客观地解释空气健康和 V1 设备的一般知识。不得编造或声称当前设备状态、当前环境读数或任何执行结果；不得声称已经执行任何操作；不得提供医疗诊断或替代专业医疗建议。",
});

function clampInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

export class DeepSeekModelAdapter {
  constructor(options = {}) {
    loadDotEnvIfPresent(fileURLToPath(new URL("../../.env", import.meta.url)));
    this.endpoint = (options.endpoint ?? process.env.DEEPSEEK_ENDPOINT ?? DEEPSEEK_DEFAULT_ENDPOINT).replace(/\/+$/, "");
    if (!this.endpoint.startsWith("https://")) throw new Error("DeepSeek endpoint must use https");
    this.apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY ?? "";
    this.model = options.model ?? process.env.DEEPSEEK_MODEL ?? DEEPSEEK_DEFAULT_MODEL;
    this.maxTokens = clampInteger(options.maxTokens ?? process.env.DEEPSEEK_MAX_TOKENS, DEEPSEEK_MAX_TOKENS_CAP, 1, DEEPSEEK_MAX_TOKENS_CAP);
    this.timeoutMs = clampInteger(options.timeoutMs ?? process.env.DEEPSEEK_TIMEOUT_MS, DEEPSEEK_TIMEOUT_MS_CAP, 1_000, DEEPSEEK_TIMEOUT_MS_CAP);
    this.enabled = options.enabled ?? parseEnabled(process.env.DEEPSEEK_ENABLED);
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.referenceId = options.referenceId ?? this.model;
    this.responseCalls = 0;
  }

  get available() {
    return this.enabled === true && typeof this.apiKey === "string" && this.apiKey.length > 0 && typeof this.fetchImpl === "function";
  }

  get generative() {
    return this.available;
  }

  // Candidate extraction stays deterministic fixed code in V1; the real model
  // is never asked to choose intents, devices, actions, modes or times.
  async extractCandidate() {
    return { intent: "unknown", entities: {}, evidence: "", source: "model", confidence: 0 };
  }

  async respond(input = {}) {
    if (!this.available) throw new Error("deepseek model unavailable");
    const kind = input.kind === "knowledge" ? "knowledge" : "chat";
    const userMessage = typeof input.message === "string" ? input.message : "";
    if (!userMessage) throw new Error("deepseek model unavailable");
    this.responseCalls += 1;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    timer.unref?.();
    try {
      const response = await this.fetchImpl(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[kind] },
            { role: "user", content: userMessage },
          ],
          max_tokens: this.maxTokens,
          temperature: kind === "knowledge" ? 0.3 : 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!response || typeof response.ok !== "boolean") throw new Error("deepseek model unavailable");
      if (!response.ok) throw new Error("deepseek model unavailable");
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("deepseek model unavailable");
      return content;
    } catch (error) {
      // Never leak the key, request body or provider details.
      throw new Error("deepseek model unavailable");
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseEnabled(value) {
  return value === true || value === 1 || ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}
