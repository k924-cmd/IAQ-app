import { state, addLog, addMessage, saveState } from './app/state.js';
import { icon } from './components/icons.js';
import { homePage } from './pages/home.js';
import { devicesPage } from './pages/devices.js';
import { chatPage } from './pages/chat.js';
import { profilePage } from './pages/profile.js';
import { loadBackendSnapshot, sendConversationMessage } from './services/conversation-service.js';
import { toggleMockDevice } from './services/device-service.js';
import { getEnvironmentSnapshot } from './services/environment-service.js';
import { createMockDevices, findDevice, getDeviceMeta, normalizeBackendDevices } from './mocks/devices.js';
import { escapeHtml } from './utils/html.js';
import {
  formatObservedAt,
  getActionLabel,
  getDeviceStateLabel,
  getReceiptPresentation,
  getResponsePresentation,
  getSourceLabel,
  getTaskName,
  getTaskPresentation
} from './presentation.js';

const root = document.querySelector('#app');
let environment = await getEnvironmentSnapshot();
let activeDeviceId = null;

function tabs() {
  return `<nav class="tabs">${[
    ['home', 'home', '首页'], ['devices', 'devices', '设备'], ['chat', 'chat', 'AI 对话'], ['profile', 'user', '我的']
  ].map(([id, glyph, label]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav>`;
}

function logsModal() {
  return `<div class="modal"><section class="log-sheet"><header><div><span class="eyebrow">ACTIVITY HISTORY</span><h2>前端状态日志</h2></div><button data-action="close">×</button></header><div class="log-list">${state.logs.map(log => `<article><i class="${escapeHtml(log.type)}"></i><div><span>${escapeHtml(log.time)} · ${log.type === 'ai' ? '联调状态' : '本地操作'}</span><b>${escapeHtml(log.text)}</b></div></article>`).join('')}</div></section></div>`;
}

function profileModal() {
  const avatar = state.profile.avatar ? `<img src="${state.profile.avatar}" alt="头像">` : icon('user');
  return `<div class="modal"><form class="profile-sheet" id="profile-form" data-avatar="${state.profile.avatar}"><header><div><span class="eyebrow">PERSONAL SPACE</span><h2>编辑资料</h2></div><button type="button" data-action="close">×</button></header><label class="avatar-picker"><span id="avatar-preview">${avatar}</span><b>更换头像</b><input id="avatar-input" type="file" accept="image/*"></label><label>昵称<input name="name" value="${escapeHtml(state.profile.name)}" maxlength="12"></label><label>家庭名称<input name="home" value="${escapeHtml(state.profile.home)}" maxlength="16"></label><label>所在城市<input name="city" value="${escapeHtml(state.profile.city)}" maxlength="16"></label><label>空气提醒<select name="reminder"><option ${state.profile.reminder === '开启' ? 'selected' : ''}>开启</option><option ${state.profile.reminder === '关闭' ? 'selected' : ''}>关闭</option></select></label><button class="save-profile" type="submit">保存资料</button></form></div>`;
}

function detailModal(kind) {
  const details = {
    home: ['家庭空间', state.profile.home, '个人资料保存在本机；设备、环境和任务仅在连接后采用后端快照。'],
    notice: ['通知提醒', `空气提醒已${state.profile.reminder}`, '通知能力尚未接入后端。'],
    energy: ['我的能量树', '当前为演示数据', '节能和碳减排数字不代表真实统计结果。'],
    about: ['关于呼吸森林', 'AI 小助手 V1 联调', '当前仅连接本地 Mock 后端，不连接真实模型、第三方服务或真实设备。']
  };
  const [title, headline, copy] = details[kind];
  return `<div class="modal"><section class="detail-sheet"><button data-action="close">×</button><span>${icon(kind === 'energy' ? 'leaf' : kind === 'notice' ? 'chat' : kind === 'home' ? 'home' : 'spark')}</span><h2>${title}</h2><b>${escapeHtml(headline)}</b><p>${copy}</p></section></div>`;
}

function deviceDetailModal(deviceId) {
  const device = findDevice(deviceId, state.devices);
  if (!device) return '';
  const meta = getDeviceMeta(device);
  const localInteractive = state.connection.status !== 'connected' && device.controlSupport === 'supported';
  const source = getSourceLabel(device.source);
  const connection = device.connectionStatus === 'online' ? '在线' : device.connectionStatus === 'offline' ? '离线' : '不可用';
  const support = device.controlSupport === 'supported' ? 'V1 支持' : device.controlSupport === 'read_only' ? '只读' : '待接入';
  return `<div class="modal device-detail-modal"><section class="device-detail-sheet" role="dialog" aria-modal="true"><header><span class="device-detail-icon">${icon(meta.icon)}</span><div><span class="eyebrow">${escapeHtml(device.room.toUpperCase())} DEVICE</span><h2>${escapeHtml(device.name)}</h2><span class="connection-pill ${device.connectionStatus === 'online' ? 'connected' : ''}">${source} · ${connection}</span></div><button data-action="close" aria-label="关闭设备详情">×</button></header><p class="device-detail-copy">${state.connection.status === 'connected' ? '这是本地后端返回的可信 Mock 快照。设备控制请通过 AI 对话进入确认、策略和回执链路。' : '这是本地 UI Mock，仅供浏览器界面演示，不连接后端或真实设备。'}</p><div class="device-detail-grid"><article><span>设备状态</span><b>${getDeviceStateLabel(device.state)}</b></article><article><span>数据来源</span><b>${source}</b></article><article><span>连接状态</span><b>${connection}</b></article><article><span>控制能力</span><b>${support}</b></article></div><div class="device-constraint-panel"><span class="constraint-chip">${state.connection.status === 'connected' ? '后端快照' : 'UI Mock'}</span><div><span>观测时间</span><b>${formatObservedAt(device.observedAt)}</b></div></div>${localInteractive ? `<div class="device-detail-actions"><button data-device-action="toggle" data-device-id="${escapeHtml(device.id)}">切换本地演示状态</button></div>` : '<div class="device-unavailable-note">当前页面不直接创建或映射后端任务。</div>'}</section></div>`;
}

function taskHtml(task) {
  if (!task) return '';
  const status = getTaskPresentation(task.status);
  const schedule = task.scheduledFor ? `<small>计划时间：${formatObservedAt(task.scheduledFor)}</small>` : '';
  return `<section class="message-card task-message ${status.tone}"><header><span>${status.icon}</span><b>${getTaskName(task)}</b><strong>${status.icon} ${status.label}</strong></header>${schedule}<small>版本 ${task.taskVersion} · 来源 ${getSourceLabel(task.executionSource)}${task.isSimulation ? ' · 模拟优化' : ''}</small></section>`;
}

function confirmationHtml(confirmation) {
  if (!confirmation) return '';
  const pending = confirmation.status === 'pending';
  const resolution = {
    pending: '✓ 待确认',
    confirmed: '✓ 已确认',
    cancelled: '× 已取消',
    expired: '⌛ 已过期',
    invalidated: '! 已失效'
  }[confirmation.status] || '? 状态未知';
  return `<section class="message-card confirmation-card"><header><span>✓</span><b>确认计划</b><strong>${resolution}</strong></header><p>${escapeHtml(confirmation.plan?.summary || '请确认是否继续。')}</p><small>有效至 ${formatObservedAt(confirmation.expiresAt)}</small>${pending ? `<div class="message-actions"><button data-continuation-type="confirmation" data-continuation-id="${escapeHtml(confirmation.confirmationId)}" data-continuation-message="确认">确认</button><button class="secondary" data-continuation-type="confirmation" data-continuation-id="${escapeHtml(confirmation.confirmationId)}" data-continuation-message="取消">取消</button></div>` : ''}</section>`;
}

function clarificationHtml(clarification) {
  if (!clarification) return '';
  const options = Array.isArray(clarification.options) ? clarification.options : [];
  return `<section class="message-card clarification-card"><header><span>?</span><b>需要补充信息</b><strong>${clarification.resolved ? '✓ 已补充' : '? 待澄清'}</strong></header><p>${escapeHtml(clarification.prompt)}</p>${options.length && !clarification.resolved ? `<div class="message-actions option-actions">${options.map(option => `<button data-continuation-type="clarification" data-continuation-id="${escapeHtml(clarification.clarificationId)}" data-continuation-message="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div>` : ''}</section>`;
}

function receiptHtml(receipt) {
  if (!receipt) return '';
  const result = getReceiptPresentation(receipt.status);
  const actions = Array.isArray(receipt.actions) ? receipt.actions : [];
  return `<section class="message-card receipt-card ${result.tone}"><header><span>${result.icon}</span><b>执行回执</b><strong>${result.icon} ${result.label}</strong></header><div class="receipt-actions">${actions.map(action => {
    const actionResult = getReceiptPresentation(action.status);
    const device = findDevice(action.deviceId, state.devices);
    return `<article><span>${actionResult.icon}</span><div><b>${escapeHtml(device?.name || action.deviceId)} · ${escapeHtml(getActionLabel(action.requestedAction))}</b><small>${actionResult.label}${action.actualState ? ` · ${getDeviceStateLabel(action.actualState)}` : ''}${action.errorCode ? ` · ${escapeHtml(action.errorCode)}` : ''}</small></div></article>`;
  }).join('')}</div><small>来源 ${getSourceLabel(receipt.source)} · ${formatObservedAt(receipt.completedAt)}</small></section>`;
}

function errorHtml(error, responseType) {
  if (!error && !['rejection', 'error'].includes(responseType)) return '';
  const isRejection = responseType === 'rejection';
  return `<section class="message-card error-card ${isRejection ? 'rejection' : 'error'}"><header><span>${isRejection ? '×' : '!'}</span><b>${isRejection ? '请求已拒绝' : '请求出错'}</b><strong>${escapeHtml(error?.code || (isRejection ? 'REJECTED' : 'ERROR'))}</strong></header>${error?.message ? `<p>${escapeHtml(error.message)}</p>` : ''}${error?.retryable ? '<small>可以稍后重试</small>' : '<small>请调整请求后重试</small>'}</section>`;
}

function sourcesHtml(sources, sourceMode) {
  const items = Array.isArray(sources) ? sources : [];
  if (!items.length && sourceMode !== 'ui_mock') return '';
  return `<div class="source-chips">${sourceMode === 'ui_mock' ? '<span>本地 UI Mock · 未连接后端</span>' : ''}${items.map(source => `<span>${getSourceLabel(source.type)} · ${formatObservedAt(source.observedAt)}</span>`).join('')}</div>`;
}

function structuredMessageHtml(message) {
  const presentation = message.role === 'assistant' ? getResponsePresentation(message.responseType) : null;
  return `<div class="message-block ${message.role === 'user' ? 'user' : 'assistant'}"><div class="bubble ${message.role === 'user' ? 'user' : ''}${message.status === 'pending' ? ' streaming' : ''}${message.status === 'error' ? ' bubble-error' : ''}">${presentation ? `<span class="response-label ${presentation.tone}">${presentation.icon} ${presentation.label}</span>` : ''}<p>${escapeHtml(message.content)}</p></div>${confirmationHtml(message.confirmation)}${clarificationHtml(message.clarification)}${taskHtml(message.task)}${receiptHtml(message.receipt)}${errorHtml(message.error, message.responseType)}${sourcesHtml(message.sources, message.sourceMode)}</div>`;
}

function renderMessages() {
  const container = document.querySelector('.messages');
  if (!container) return;
  container.innerHTML = state.messages.map(structuredMessageHtml).join('');
}

function render() {
  root.innerHTML = `<main class="app ${state.tab === 'home' ? 'home-mode' : ''} ${state.tab === 'chat' ? 'chat-mode' : ''}">${homePage(state, environment)}${devicesPage(state)}${chatPage(state)}${profilePage(state)}</main>${tabs()}<div id="toast" class="toast"></div><div id="modal-root"></div><div id="effect-root"></div>`;
  renderMessages();
  bind();
  if (activeDeviceId) openDeviceDetail(activeDeviceId);
  if (state.tab === 'chat') requestAnimationFrame(() => scrollChat(true));
}

function toast(text) {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = text;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2200);
}

function scrollChat(force = false) {
  const messages = document.querySelector('.messages');
  if (!messages) return;
  const distance = messages.scrollHeight - messages.scrollTop - messages.clientHeight;
  if (force || distance < 80) messages.scrollTop = messages.scrollHeight;
}

function openDeviceDetail(deviceId) {
  activeDeviceId = deviceId;
  const modalRoot = document.querySelector('#modal-root');
  modalRoot.innerHTML = deviceDetailModal(deviceId);
  bindModal();
}

async function useUiMockSnapshot() {
  state.connection = { status: 'disconnected', mode: 'ui_mock', label: '本地 UI Mock / 未连接后端' };
  state.devices = createMockDevices();
  state.activeTask = null;
  environment = await getEnvironmentSnapshot();
  const intro = state.messages[0];
  if (intro?.role === 'assistant') {
    intro.content = '你好，我是 Luna。当前为本地 UI Mock / 未连接后端，不会把浏览器旧状态当作后端事实。';
    intro.sourceMode = 'ui_mock';
    intro.sources = [];
  }
}

async function connectBackend({ quiet = false } = {}) {
  try {
    const { bootstrap } = await loadBackendSnapshot();
    state.connection = { status: 'connected', mode: bootstrap.mode, label: '已连接本地后端 Mock' };
    state.devices = normalizeBackendDevices(bootstrap.devices);
    environment = bootstrap.environment ? { ...bootstrap.environment, uiMockOnly: false } : null;
    state.activeTask = bootstrap.activeTask;
    const intro = state.messages[0];
    if (intro?.role === 'assistant') {
      intro.content = '你好，我是 Luna。已连接本地后端 Mock，设备、环境与任务已从后端快照同步。';
      intro.sourceMode = 'backend';
      intro.sources = [];
    }
    if (!quiet) addLog('ai', '已从本地后端同步设备、环境与活动任务快照。');
  } catch {
    await useUiMockSnapshot();
    if (!quiet) addLog('ai', '后端不可用，已降级为本地 UI Mock；未沿用旧设备或任务状态。');
  }
  saveState();
  render();
}

async function updateDevice(deviceId) {
  const device = findDevice(deviceId, state.devices);
  if (!device || state.connection.status === 'connected') {
    toast('后端快照只读，请通过 AI 对话操作');
    return;
  }
  if (device.controlSupport !== 'supported') {
    toast('该设备仅展示待接入状态');
    return;
  }
  const updated = await toggleMockDevice(device);
  state.devices = state.devices.map(item => item.id === deviceId ? updated : item);
  addLog('manual', `${device.name}本地 UI Mock 已切换为${getDeviceStateLabel(updated.state)}`);
  saveState();
  render();
  toast('仅更新本地 UI Mock');
}

function applyReceipt(receipt) {
  if (!receipt?.actions || state.connection.status !== 'connected') return;
  const states = new Map(receipt.actions.filter(action => action.actualState).map(action => [action.deviceId, action.actualState]));
  state.devices = state.devices.map(device => states.has(device.id)
    ? { ...device, state: states.get(device.id), stateVersion: device.stateVersion + 1, observedAt: receipt.completedAt, source: receipt.source }
    : device);
}

function applyConversationResponse(pending, response) {
  const reply = response.message || {};
  Object.assign(pending, {
    id: reply.id || pending.id,
    content: reply.content || '后端没有返回可展示内容。',
    status: reply.status || 'complete',
    createdAt: reply.createdAt || new Date().toISOString(),
    responseType: response.responseType,
    sources: response.sources || [],
    clarification: response.clarification,
    confirmation: response.confirmation,
    task: response.task,
    receipt: response.receipt,
    error: response.error,
    sourceMode: response.transportMode
  });
  if (response.task) state.activeTask = response.task;
  applyReceipt(response.receipt);
}

function resolveContinuation(continuation, response, submittedText) {
  if (!continuation?.id) return;
  if (continuation.type === 'confirmation') {
    const owner = state.messages.find(message => message.confirmation?.confirmationId === continuation.id);
    if (!owner?.confirmation) return;
    const errorStatus = {
      CONFIRMATION_EXPIRED: 'expired',
      CONFIRMATION_INVALIDATED: 'invalidated',
      CONFIRMATION_NOT_FOUND: 'invalidated'
    }[response.error?.code];
    owner.confirmation.status = errorStatus || (submittedText === '取消' ? 'cancelled' : 'confirmed');
  }
  if (continuation.type === 'clarification') {
    const owner = state.messages.find(message => message.clarification?.clarificationId === continuation.id);
    if (owner?.clarification) owner.clarification.resolved = true;
  }
}

async function sendMessage(text, continuation) {
  if (state.isStreaming) return;
  addMessage('user', text, { continuation });
  const pending = addMessage('assistant', 'Luna 正在整理回复', { responseType: 'chat' });
  pending.status = 'pending';
  state.isStreaming = true;
  render();
  try {
    const response = await sendConversationMessage(text, { continuation });
    if (response.transportMode === 'ui_mock') {
      await useUiMockSnapshot();
    } else if (state.connection.status !== 'connected') {
      await connectBackend({ quiet: true });
    }
    if (response.transportMode === 'backend') resolveContinuation(continuation, response, text);
    applyConversationResponse(pending, response);
  } catch {
    await useUiMockSnapshot();
    pending.content = '本地 UI Mock / 未连接后端：暂时无法生成演示回复，请稍后再试。';
    pending.status = 'error';
    pending.responseType = 'error';
    pending.sourceMode = 'ui_mock';
  } finally {
    state.isStreaming = false;
    saveState();
    render();
  }
}

function showSceneEffect(scene) {
  const styles = {
    '回家模式': ['home', '回家模式 · UI Mock', '未创建后端任务'],
    '深呼吸模式': ['breathe', '深呼吸 · UI Mock', '未创建后端任务'],
    '睡眠模式': ['sleep', '静享睡眠 · UI Mock', '未创建后端任务'],
    '低碳模式': ['eco', '低碳模式 · UI Mock', '未创建后端任务']
  };
  const [kind, title, copy] = styles[scene];
  document.querySelector('#effect-root').innerHTML = `<div class="scene-effect ${kind}"><div><span>${icon(kind === 'sleep' ? 'leaf' : kind === 'eco' ? 'spark' : kind === 'breathe' ? 'wind' : 'home')}</span><b>${title}</b><small>${copy}</small></div></div>`;
  setTimeout(() => { document.querySelector('#effect-root').innerHTML = ''; }, 1700);
}

function bindModal() {
  document.querySelectorAll('[data-action="close"]').forEach(button => {
    button.onclick = () => { activeDeviceId = null; document.querySelector('#modal-root').innerHTML = ''; };
  });
  document.querySelectorAll('[data-device-action="toggle"]').forEach(button => {
    button.onclick = () => updateDevice(button.dataset.deviceId);
  });
  document.querySelector('#avatar-input')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 180;
        const side = Math.min(image.width, image.height);
        canvas.getContext('2d').drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 180, 180);
        const avatar = canvas.toDataURL('image/jpeg', .82);
        document.querySelector('#profile-form').dataset.avatar = avatar;
        document.querySelector('#avatar-preview').innerHTML = `<img src="${avatar}" alt="新头像">`;
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  document.querySelector('#profile-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    state.profile = {
      name: form.elements.name.value.trim() || '林知夏',
      home: form.elements.home.value.trim() || '我的家',
      city: form.elements.city.value.trim() || '杭州',
      reminder: form.elements.reminder.value,
      avatar: form.dataset.avatar || state.profile.avatar
    };
    activeDeviceId = null;
    saveState();
    render();
    toast('资料已保存');
  });
}

function bind() {
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.onclick = () => { state.tab = button.dataset.tab; render(); };
  });
  document.querySelectorAll('[data-device]').forEach(input => {
    input.onchange = () => updateDevice(input.dataset.device);
  });
  document.querySelectorAll('[data-device-detail]').forEach(card => {
    const open = event => {
      if (event.target.closest('.switch')) return;
      openDeviceDetail(card.dataset.deviceDetail);
    };
    card.onclick = open;
    card.onkeydown = event => {
      if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open(event);
      }
    };
  });
  document.querySelectorAll('[data-scene]').forEach(button => {
    button.onclick = () => showSceneEffect(button.dataset.scene);
  });
  document.querySelector('[data-action="device-view"]')?.addEventListener('click', () => {
    state.deviceView = state.deviceView === 'list' ? 'grid' : 'list';
    saveState();
    render();
  });
  document.querySelectorAll('[data-action="logs"]').forEach(button => {
    button.onclick = () => { document.querySelector('#modal-root').innerHTML = logsModal(); bindModal(); };
  });
  document.querySelectorAll('[data-action="profile"]').forEach(button => {
    button.onclick = () => { document.querySelector('#modal-root').innerHTML = profileModal(); bindModal(); };
  });
  [['home-detail', 'home'], ['notice-detail', 'notice'], ['energy-detail', 'energy'], ['about-detail', 'about']].forEach(([action, kind]) => {
    document.querySelectorAll(`[data-action="${action}"]`).forEach(button => {
      button.onclick = () => { document.querySelector('#modal-root').innerHTML = detailModal(kind); bindModal(); };
    });
  });
  document.querySelectorAll('[data-action="luna"]').forEach(button => {
    button.onclick = () => {
      const anchor = button.closest('.luna-anchor');
      const leaves = anchor.nextElementSibling;
      const isOut = button.classList.toggle('is-out');
      anchor.classList.toggle('is-out', isOut);
      button.setAttribute('aria-expanded', String(isOut));
      leaves.classList.toggle('is-active', isOut);
      toast(isOut ? 'Luna 走出来和你打招呼' : 'Luna 回到森林角落');
    };
  });
  document.querySelectorAll('.prompt').forEach(button => {
    button.onclick = () => sendMessage(button.textContent);
  });
  document.querySelectorAll('[data-continuation-id]').forEach(button => {
    button.onclick = () => sendMessage(button.dataset.continuationMessage, {
      type: button.dataset.continuationType,
      id: button.dataset.continuationId
    });
  });
  document.querySelector('#chat-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#chat-input');
    if (input.value.trim()) sendMessage(input.value.trim());
  });
  document.querySelectorAll('[data-toast]').forEach(button => {
    button.onclick = () => toast(button.dataset.toast);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const local = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
    if (local) {
      navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister())));
    } else {
      navigator.serviceWorker.register('./sw.js');
    }
  });
}

render();
await connectBackend();
