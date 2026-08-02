import { state, addLog, addMessage, saveState } from './app/state.js';
import { icon } from './components/icons.js';
import { homePage } from './pages/home.js';
import { devicesPage } from './pages/devices.js';
import { chatPage } from './pages/chat.js';
import { profilePage } from './pages/profile.js';
import { sendConversationMessage } from './services/conversation-service.js';
import { toggleMockDevice } from './services/device-service.js';
import { getEnvironmentSnapshot } from './services/environment-service.js';
import { findDevice } from './mocks/devices.js';

const root = document.querySelector('#app');
let environment = await getEnvironmentSnapshot();
let activeDeviceId = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function tabs() {
  return `<nav class="tabs">${[
    ['home', 'home', '首页'], ['devices', 'devices', '设备'], ['chat', 'chat', 'AI 对话'], ['profile', 'user', '我的']
  ].map(([id, glyph, label]) => `<button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav>`;
}

function logsModal() {
  return `<div class="modal"><section class="log-sheet"><header><div><span class="eyebrow">ACTIVITY HISTORY</span><h2>本地操作日志</h2></div><button data-action="close">×</button></header><div class="log-list">${state.logs.map(log => `<article><i class="${log.type}"></i><div><span>${escapeHtml(log.time)} · ${log.type === 'ai' ? 'UI Mock' : '本地操作'}</span><b>${escapeHtml(log.text)}</b></div></article>`).join('')}</div></section></div>`;
}

function profileModal() {
  const avatar = state.profile.avatar ? `<img src="${state.profile.avatar}" alt="头像">` : icon('user');
  return `<div class="modal"><form class="profile-sheet" id="profile-form" data-avatar="${state.profile.avatar}"><header><div><span class="eyebrow">PERSONAL SPACE</span><h2>编辑资料</h2></div><button type="button" data-action="close">×</button></header><label class="avatar-picker"><span id="avatar-preview">${avatar}</span><b>更换头像</b><input id="avatar-input" type="file" accept="image/*"></label><label>昵称<input name="name" value="${escapeHtml(state.profile.name)}" maxlength="12"></label><label>家庭名称<input name="home" value="${escapeHtml(state.profile.home)}" maxlength="16"></label><label>所在城市<input name="city" value="${escapeHtml(state.profile.city)}" maxlength="16"></label><label>空气提醒<select name="reminder"><option ${state.profile.reminder === '开启' ? 'selected' : ''}>开启</option><option ${state.profile.reminder === '关闭' ? 'selected' : ''}>关闭</option></select></label><button class="save-profile" type="submit">保存资料</button></form></div>`;
}

function detailModal(kind) {
  const details = {
    home: ['家庭空间', state.profile.home, '当前空间仅展示本地 UI Mock 数据，不连接真实家庭设备。'],
    notice: ['通知提醒', `空气提醒已${state.profile.reminder}`, '通知能力将在运营规则和后端契约确认后接入。'],
    energy: ['我的能量树', '当前为演示数据', '节能和碳减排数字暂不代表真实统计结果。'],
    about: ['关于呼吸森林', 'UI Rebuild Baseline', '当前版本只保留产品界面，AI 与设备逻辑正在重新设计。']
  };
  const [title, headline, copy] = details[kind];
  return `<div class="modal"><section class="detail-sheet"><button data-action="close">×</button><span>${icon(kind === 'energy' ? 'leaf' : kind === 'notice' ? 'chat' : kind === 'home' ? 'home' : 'spark')}</span><h2>${title}</h2><b>${escapeHtml(headline)}</b><p>${copy}</p></section></div>`;
}

function deviceDetailModal(deviceId) {
  const device = findDevice(deviceId);
  const current = state.devices[deviceId];
  if (!device || !current) return '';
  return `<div class="modal device-detail-modal"><section class="device-detail-sheet" role="dialog" aria-modal="true"><header><span class="device-detail-icon">${icon(device.icon)}</span><div><span class="eyebrow">${escapeHtml(device.room.toUpperCase())} DEVICE</span><h2>${escapeHtml(device.name)}</h2><span class="connection-pill ${device.available ? 'connected' : ''}">${device.available ? '本地 UI Mock' : '待接入'}</span></div><button data-action="close" aria-label="关闭设备详情">×</button></header><p class="device-detail-copy">${device.available ? '该设备仅执行浏览器本地状态切换，不连接后端或真实设备。' : '该设备保留在产品界面中，等待后续产品与后端契约。'}</p><div class="device-detail-grid"><article><span>设备状态</span><b>${current.on ? '已开启' : '已关闭'}</b></article><article><span>数据来源</span><b>本地 Mock</b></article><article><span>真实连接</span><b>未连接</b></article><article><span>AI 控制</span><b>未接入</b></article></div>${device.available ? `<div class="device-detail-actions"><button data-device-action="toggle" data-device-id="${device.id}">${current.on ? '关闭演示状态' : '开启演示状态'}</button></div>` : '<div class="device-unavailable-note">等待新设备契约接入。</div>'}</section></div>`;
}

function renderMessages() {
  const container = document.querySelector('.messages');
  if (!container) return;
  const fragment = document.createDocumentFragment();
  state.messages.forEach(message => {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${message.role === 'user' ? 'user' : ''}${message.status === 'pending' ? ' streaming' : ''}`;
    bubble.textContent = message.content;
    fragment.append(bubble);
  });
  container.replaceChildren(fragment);
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

async function updateDevice(deviceId, requestedState = null) {
  const device = findDevice(deviceId);
  if (!device?.available) {
    toast('该设备等待后续接入');
    return;
  }
  const current = state.devices[deviceId];
  const result = requestedState === null
    ? await toggleMockDevice(deviceId, current.on)
    : { on: requestedState };
  current.on = result.on;
  addLog('manual', `${device.name}演示状态已${current.on ? '开启' : '关闭'}`);
  saveState();
  render();
  toast('已更新本地演示状态');
}

async function sendMessage(text) {
  if (state.isStreaming) return;
  addMessage('user', text);
  const pending = addMessage('assistant', 'Luna 正在整理回复');
  pending.status = 'pending';
  state.isStreaming = true;
  saveState();
  render();
  try {
    const response = await sendConversationMessage(text);
    pending.content = response.content;
    pending.status = 'complete';
  } catch {
    pending.content = '本地 Mock 暂时不可用，请稍后再试。';
    pending.status = 'error';
  } finally {
    state.isStreaming = false;
    saveState();
    render();
  }
}

function showSceneEffect(scene) {
  const styles = {
    '回家模式': ['home', '回家模式界面演示', '未连接真实设备'],
    '深呼吸模式': ['breathe', '深呼吸界面演示', '未连接真实设备'],
    '睡眠模式': ['sleep', '静享睡眠界面演示', '未连接真实设备'],
    '低碳模式': ['eco', '低碳模式界面演示', '未连接真实设备']
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
    input.onchange = () => updateDevice(input.dataset.device, input.checked);
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
