import test from "node:test";
import assert from "node:assert/strict";
import { localRoute } from "../src/conversation/router.js";

test("问候开头优先于通用知识兜底，但不破坏既有意图", () => {
  const cases = [
    // 任务要求：问候开头 + 介绍/闲聊 → chat
    ["你好，简单介绍一下自己", "chat"],
    ["你好", "chat"],
    ["您好，介绍一下自己", "chat"],
    ["嗨，简单介绍一下", "chat"],
    ["早上好，介绍一下自己", "chat"],
    ["hi 简单介绍下你", "chat"],
    // 无问候前缀的纯知识问题保持 knowledge_query
    ["介绍一下自己", "knowledge_query"],
    ["介绍一下空气净化器", "knowledge_query"],
    ["二氧化碳为什么会升高", "knowledge_query"],
    ["今天天气怎么样", "weather_query"],
    ["室外 PM2.5 是多少", "weather_query"],
    ["现在空气怎么样", "environment_query"],
    ["室外 PM2.5 是什么", "knowledge_query"],
    ["为什么下雨天要通风", "knowledge_query"],
    // 主题明确的知识问答即使带问候前缀仍为 knowledge_query
    ["你好，二氧化碳为什么会升高", "knowledge_query"],
    ["你好，介绍一下 PM2.5 知识", "knowledge_query"],
    // 既有意图保持不变
    ["我呼吸困难并且胸痛", "knowledge_query"],
    ["你好，现在空气怎么样", "environment_query"],
    ["你好，打开空气净化器", "device_control"],
  ];
  for (const [message, intent] of cases) {
    assert.equal(localRoute(message)?.intent, intent, message);
  }
});
