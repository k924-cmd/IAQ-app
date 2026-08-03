// Fixed-code guard for generative model reply text.
//
// The real model only ever contributes display text for chat / knowledge.
// Without an ExecutionReceipt it must not carry device-execution claims,
// current device-state facts, or current environment readings; those are
// decided by fixed code from trusted adapters and receipts only.

export const MODEL_REPLY_MAX_CHARS = 4000;

const HEALTH_TOPIC_PATTERN = /健康|症状|医疗|诊断|疾病|哮喘|过敏|呼吸(道|系统|困难|急促|不畅)|肺|胸(闷|痛)|心(脏病|悸|慌)|头晕|头痛|咳嗽|鼻炎|不适|体感|中毒|一氧化碳|血压|体温|缺氧|窒息|皮疹|乏力|恶心|呕吐/;

const EXECUTION_CLAIM_PATTERNS = [
  /(已|已经)(开启|打开|关闭|关掉|启动|停止|执行|处理|完成)/,
  /(开启|打开|关闭|关掉|启动|执行|处理|完成|搞定)(了|完毕|成功|完成)/,
  /(替你|为您|帮你|给您)(处理|执行|完成|开启|打开|关闭|启动)/,
  /(操作|处理|执行|任务|计划)\s*(完成|完毕|成功|好了)/,
  /设备\s*(现在|目前|已经)?\s*(正在|处于)?\s*(开启|打开|关闭|运行|启动|停止)/,
  /(空气净化器|净化器|智能窗户|窗户|抽油烟机|油烟机|新风系统|新风|加湿器)\s*(现在|目前|已经)?\s*(正在|处于)?\s*(开启|打开|关闭|运行|启动|停止|开着|关着|已启动|已停止)/,
];

const CURRENT_READING_PATTERNS = [
  /(当前|现在|目前|你家|家里)\s*(PM2\.5|PM25|二氧化碳|CO2|湿度|温度|空气(质量|评分))\s*[^。；，]{0,10}\s*\d+/i,
  /(PM2\.5|PM25|二氧化碳|CO2|湿度|温度)\s*[^\d。；，]{0,4}\s*=\s*\d+/i,
];

/**
 * Returns the trimmed, safe model reply text, or null when the reply cannot
 * be surfaced (empty, too long, or carrying execution / current-state facts).
 */
export function guardModelReply(raw) {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text || [...text].length > MODEL_REPLY_MAX_CHARS) return null;
  if (EXECUTION_CLAIM_PATTERNS.some((pattern) => pattern.test(text))) return null;
  if (CURRENT_READING_PATTERNS.some((pattern) => pattern.test(text))) return null;
  return text;
}

/**
 * Detects whether any of the given texts touch health, symptoms or medical
 * topics, in which case the medical reinforcement disclaimer must be added.
 */
export function detectHealthTopic(...texts) {
  return texts.some((text) => typeof text === "string" && HEALTH_TOPIC_PATTERN.test(text));
}
