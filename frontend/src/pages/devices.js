import { icon } from '../components/icons.js';
import { DEVICE_CATALOG } from '../mocks/devices.js';

function deviceCard(device, state) {
  const current = state.devices[device.id];
  const grid = state.deviceView === 'grid';
  return `<article class="device-card ${grid ? 'card-grid' : ''} ${device.available ? 'integrated' : 'not-integrated'}" data-device-detail="${device.id}" tabindex="0">
    ${grid ? `<span class="device-preview device-${device.id}">${icon(device.icon)}</span>` : ''}
    <span class="device-icon">${icon(device.icon)}</span><div class="device-copy"><strong>${device.name}</strong><small>${device.room} · ${current.on ? '已开启' : '已关闭'}</small></div>
    <span class="device-state ${device.available ? 'on' : ''}">${device.available ? '本地演示' : '待接入'}</span>
    <label class="switch"><input data-device="${device.id}" type="checkbox" ${current.on ? 'checked' : ''} ${device.available ? '' : 'disabled'} aria-label="${device.name}开关"><i></i></label>
  </article>`;
}

export function devicesPage(state) {
  const viewLabel = state.deviceView === 'list' ? '切换为双列卡片' : '切换为单列列表';
  return `<section class="page devices-page ${state.tab === 'devices' ? 'active' : ''}">
    <header class="page-header"><div><span class="eyebrow">AIRCARE SYSTEM</span><h1>设备与环境</h1><p>设备状态均为本地 UI 演示</p></div><div class="header-actions"><button class="circle-btn view-toggle" data-action="device-view" aria-label="${viewLabel}">${icon(state.deviceView === 'list' ? 'devices' : 'list')}</button><button class="circle-btn" data-action="logs" aria-label="操作日志">${icon('clock')}</button></div></header>
    <section class="system-brief glass"><span class="brief-orb">${icon('leaf')}</span><div><b>UI Mock 正在运行</b><p>不连接 AI、后端或真实设备</p></div></section>
    <div class="device-list ${state.deviceView}">${DEVICE_CATALOG.map(device => deviceCard(device, state)).join('')}</div>
    <section class="section-heading timeline-heading"><div><span class="eyebrow">ENVIRONMENT TIMELINE</span><h2>环境时间轴</h2></div><span>演示数据</span></section>
    <section class="environment-card glass"><div class="chart-top"><b>PM2.5 趋势</b><span>平均 12 μg/m³</span></div><svg viewBox="0 0 340 112"><defs><linearGradient id="airFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#9fcbb6" stop-opacity=".56"/><stop offset="1" stop-color="#9fcbb6" stop-opacity="0"/></linearGradient></defs><path class="gridline" d="M0 25H340M0 58H340M0 91H340"/><path class="area" d="M0 80C25 66 43 83 70 62s42 8 70-12 46 24 69 8 48-10 70-26 37 12 61-5v85H0Z"/><path class="line" d="M0 80C25 66 43 83 70 62s42 8 70-12 46 24 69 8 48-10 70-26 37 12 61-5"/></svg><div class="chart-times"><span>08:00</span><span>12:00</span><span>16:00</span><span>现在</span></div></section>
  </section>`;
}
