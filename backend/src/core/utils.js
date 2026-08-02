import { createHash } from "node:crypto";

export const CONTRACT_VERSION = "1.0.0";
export const CONFIRMATION_TTL_MS = 120_000;
export const IDEMPOTENCY_TTL_MS = 86_400_000;
export const ENVIRONMENT_FRESHNESS_MS = 300_000;

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value), "utf8").digest("hex");
}

export const clone = (value) => structuredClone(value);

export function addMilliseconds(iso, milliseconds) {
  return new Date(new Date(iso).getTime() + milliseconds).toISOString();
}

export function sourceRef(type, observedAt, referenceId) {
  return referenceId ? { type, observedAt, referenceId } : { type, observedAt };
}

export function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return typeof timezone === "string" && timezone.length <= 64;
  } catch {
    return false;
  }
}

export function localDateParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

export function zonedTodayAt(now, timezone, hour, minute) {
  const today = localDateParts(now, timezone);
  let guess = Date.UTC(today.year, today.month - 1, today.day, hour, minute, 0);
  for (let index = 0; index < 3; index += 1) {
    const actual = localDateParts(new Date(guess), timezone);
    const desiredUtc = Date.UTC(today.year, today.month - 1, today.day, hour, minute, 0);
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    guess += desiredUtc - actualUtc;
  }
  const candidate = new Date(guess);
  const check = localDateParts(candidate, timezone);
  if (check.year !== today.year || check.month !== today.month || check.day !== today.day || check.hour !== hour || check.minute !== minute) return null;
  return candidate;
}

export function hasSuccessStatement(content) {
  return /已开启|已关闭|执行成功|已打开/.test(content);
}
