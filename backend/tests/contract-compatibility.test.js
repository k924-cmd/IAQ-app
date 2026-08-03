import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DeepSeekModelAdapter } from "../src/index.js";
import { harness } from "./helpers.js";

const schemaPath = fileURLToPath(new URL("../../shared/contracts/ai-assistant-v1.schema.json", import.meta.url));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

// This intentionally validates representative backend responses against the
// subset of JSON Schema keywords used on those paths. It is not a complete
// Draft 2020-12 JSON Schema implementation.

function resolve(node) {
  if (!node?.$ref) return node;
  const name = node.$ref.split("/").at(-1);
  return schema.$defs[name];
}

function okFetch(content) {
  return async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "content-type": "application/json" } });
}

function validate(node, value, path = "value") {
  node = resolve(node);
  if (node.const !== undefined) assert.deepEqual(value, node.const, `${path} const`);
  if (node.enum) assert.ok(node.enum.includes(value), `${path} enum`);
  if (node.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${path} object`);
    for (const key of node.required ?? []) assert.ok(Object.hasOwn(value, key), `${path}.${key} required`);
    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) assert.ok(Object.hasOwn(node.properties ?? {}, key), `${path}.${key} defined`);
    }
    for (const [key, child] of Object.entries(node.properties ?? {})) if (Object.hasOwn(value, key)) validate(child, value[key], `${path}.${key}`);
    if (node.additionalProperties && typeof node.additionalProperties === "object") {
      for (const [key, child] of Object.entries(value)) validate(node.additionalProperties, child, `${path}.${key}`);
    }
  }
  if (node.type === "array") {
    assert.ok(Array.isArray(value), `${path} array`);
    if (node.minItems !== undefined) assert.ok(value.length >= node.minItems, `${path} minItems`);
    if (node.maxItems !== undefined) assert.ok(value.length <= node.maxItems, `${path} maxItems`);
    for (let index = 0; index < value.length; index += 1) validate(node.items, value[index], `${path}[${index}]`);
  }
  if (node.type === "string") {
    assert.equal(typeof value, "string", `${path} string`);
    if (node.minLength !== undefined) assert.ok([...value].length >= node.minLength, `${path} minLength`);
    if (node.maxLength !== undefined) assert.ok([...value].length <= node.maxLength, `${path} maxLength`);
    if (node.pattern) assert.match(value, new RegExp(node.pattern), `${path} pattern`);
    if (node.format === "date-time") assert.equal(Number.isNaN(new Date(value).getTime()), false, `${path} date-time`);
  }
  if (node.type === "number" || node.type === "integer") {
    assert.equal(typeof value, "number", `${path} number`);
    if (node.type === "integer") assert.equal(Number.isInteger(value), true, `${path} integer`);
    if (node.minimum !== undefined) assert.ok(value >= node.minimum, `${path} minimum`);
    if (node.maximum !== undefined) assert.ok(value <= node.maximum, `${path} maximum`);
  }
  if (node.type === "boolean") assert.equal(typeof value, "boolean", `${path} boolean`);
}

test("共享契约 v1.0.0 代表性响应样例兼容校验（非完整 JSON Schema 验证）", async () => {
  assert.equal(schema.$defs.SendMessageRequest.properties.contractVersion.const, "1.0.0");
  const { send } = harness();
  const environment = await send("现在空气怎么样");
  const confirmation = await send("打开智能窗户");
  const execution = await send("取消").then(() => send("打开空气净化器"));
  const taskConfirmation = await send("启动舒适优先优化");
  const task = await send("确认", { continuation: { type: "confirmation", id: taskConfirmation.confirmation.confirmationId } });
  for (const response of [environment, confirmation, execution, task]) validate(schema.$defs.SendMessageResponse, response, "response");

  const model = new DeepSeekModelAdapter({ apiKey: "contract-key", enabled: true, fetchImpl: okFetch("模型生成的一般知识文本。") });
  const { send: modelSend } = harness({ model });
  const modelChat = await modelSend("你好");
  const modelKnowledge = await modelSend("二氧化碳为什么会升高");
  for (const response of [modelChat, modelKnowledge]) validate(schema.$defs.SendMessageResponse, response, "response");
});
