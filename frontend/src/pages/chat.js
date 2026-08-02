import { icon } from '../components/icons.js';

export function chatPage(state) {
  return `<section class="page chat-page ${state.tab === 'chat' ? 'active' : ''}">
    <header class="chat-header"><img src="assets/luna-hero.webp" alt="Luna"><div><span class="eyebrow">LUNA · BREATH COMPANION</span><h1>和 Luna 聊聊</h1><p>本地 UI Mock · 新 AI 框架待接入</p></div><button class="circle-btn" data-toast="AI 框架正在重建">${icon('more')}</button></header>
    <div class="messages"></div>
    <div class="prompt-row"><button class="prompt">你好 Luna</button><button class="prompt">现在空气怎么样</button><button class="prompt">设备可以使用吗</button></div>
    <form id="chat-form" class="composer glass"><input id="chat-input" maxlength="500" autocomplete="off" placeholder="告诉 Luna 你的需求…" ${state.isStreaming ? 'disabled' : ''}><button type="submit" ${state.isStreaming ? 'disabled' : ''}>${icon('arrow')}</button></form>
  </section>`;
}
