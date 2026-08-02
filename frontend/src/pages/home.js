import { icon } from '../components/icons.js?v=20260803-4';
import { formatObservedAt, getConnectionPresentation, getSourceLabel } from '../presentation.js?v=20260803-4';
import { escapeHtml } from '../utils/html.js?v=20260803-4';

export function homePage(state, environment) {
  const connection = getConnectionPresentation(state.connection);
  const hasEnvironment = Boolean(environment);
  const metric = key => hasEnvironment ? escapeHtml(environment[key]) : '--';
  const source = hasEnvironment ? getSourceLabel(environment.source) : '暂无可信快照';
  const leafBits = [[24,-105,0,14,-18,2,30],[48,-150,70,-22,9,18,39],[74,-82,130,17,-12,35,28],[93,-126,180,-8,24,51,42],[36,-62,86,28,18,12,45],[62,-178,222,-18,-22,27,34],[12,-132,44,10,26,43,48],[82,-96,154,23,4,60,37]].map(([x,y,delay,turn,drift,pileX,pileY]) => `<i class="leaf-particle" style="--x:${x}px;--y:${y}px;--delay:${delay}ms;--turn:${turn}deg;--drift:${drift}px;--pile-x:${pileX}px;--pile-y:${pileY}px">${icon('leaf')}</i>`).join('');
  return `<section class="page home-page ${state.tab === 'home' ? 'active' : ''}">
    <header class="home-header"><div><span class="eyebrow">MY BREATHING SPACE</span><h1>${escapeHtml(state.profile.home)} <small>⌄</small></h1></div><span class="connection-badge ${connection.tone}"><i>${connection.icon}</i>${connection.label}</span></header>
    <section class="luna-stage"><div class="luna-copy"><span>${hasEnvironment ? `${metric('temperature')}℃ · ${escapeHtml(environment.status)}` : '环境快照不可用'}</span><h2>欢迎回家</h2><p>${connection.detail}</p></div><div class="luna-anchor"><button class="luna-walker" data-action="luna" aria-label="呼唤 Luna" aria-expanded="false"><span class="luna-bounce"><img class="luna-overlay" src="assets/luna-overlay-tight.webp" alt="Luna 呼吸精灵"></span></button></div><div class="luna-leaves" aria-hidden="true">${leafBits}</div><button class="luna-note" data-tab="chat"><b>Hi，我是 Luna</b><small>${connection.label}</small>${icon('chat')}</button></section>
    <section class="air-card glass"><div class="air-score"><b>${metric('score')}</b><span>${hasEnvironment ? escapeHtml(environment.status) : '数据不可用'}</span></div><div class="air-detail"><div><span>PM2.5</span><b>${metric('pm25')} <small>μg/m³</small></b></div><div><span>CO₂</span><b>${metric('co2')} <small>ppm</small></b></div><div><span>湿度</span><b>${metric('humidity')}<small>%</small></b></div></div><small class="data-provenance">${source} · ${hasEnvironment ? formatObservedAt(environment.observedAt) : '未观测'}</small></section>
    <section class="quick-dock"><div class="dock-head"><b>快捷场景 <small>仅 UI Mock，不创建后端任务</small></b><button data-tab="devices">全部设备 ${icon('arrow')}</button></div><div class="scene-grid"><button data-scene="回家模式"><span>${icon('home')}</span><b>回家</b><small>界面演示</small></button><button data-scene="深呼吸模式"><span>${icon('wind')}</span><b>深呼吸</b><small>界面演示</small></button><button data-scene="睡眠模式"><span>${icon('leaf')}</span><b>静享</b><small>界面演示</small></button><button data-scene="低碳模式"><span>${icon('spark')}</span><b>低碳</b><small>界面演示</small></button></div></section>
  </section>`;
}
