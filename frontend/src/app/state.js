import { createMockDevices } from '../mocks/devices.js';

export const STORAGE_KEY = 'breathForestUiV2';

function readStoredState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function createMessage(role, text) {
  return {
    id: crypto.randomUUID?.() || `msg-${Date.now()}-${Math.random()}`,
    role,
    content: text,
    status: 'complete',
    createdAt: new Date().toISOString()
  };
}

const stored = readStoredState();

export const state = {
  tab: 'home',
  deviceView: stored.deviceView === 'grid' ? 'grid' : 'list',
  devices: createMockDevices(stored.devices),
  messages: Array.isArray(stored.messages) && stored.messages.length
    ? stored.messages.slice(-100)
    : [createMessage('assistant', '你好，我是 Luna。当前运行在全新的 UI Mock 基线中。')],
  profile: {
    name: stored.profile?.name || '林知夏',
    home: stored.profile?.home || '我的家',
    city: stored.profile?.city || '杭州',
    reminder: stored.profile?.reminder === '关闭' ? '关闭' : '开启',
    avatar: stored.profile?.avatar || ''
  },
  logs: Array.isArray(stored.logs) ? stored.logs.slice(0, 100) : [
    { time: '10:00', type: 'ai', text: 'UI Mock 已准备就绪。' },
    { time: '09:25', type: 'manual', text: '当前所有设备操作仅保存在本地。' }
  ],
  isStreaming: false
};

export function addMessage(role, content) {
  const message = createMessage(role, content);
  state.messages.push(message);
  state.messages = state.messages.slice(-100);
  return message;
}

export function addLog(type, text) {
  state.logs.unshift({
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    type,
    text
  });
  state.logs = state.logs.slice(0, 100);
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    deviceView: state.deviceView,
    devices: state.devices,
    messages: state.messages,
    profile: state.profile,
    logs: state.logs
  }));
}
