export const DEVICE_CATALOG = [
  { id: 'fresh', name: '新风系统', room: '全屋', icon: 'wind', available: false, defaultOn: false },
  { id: 'purifier', name: '空气净化器', room: '客厅', icon: 'spark', available: true, defaultOn: true },
  { id: 'humidifier', name: '加湿器', room: '卧室', icon: 'drop', available: false, defaultOn: false },
  { id: 'window', name: '智能窗户', room: '客厅', icon: 'window', available: true, defaultOn: false },
  { id: 'hood', name: '抽油烟机', room: '厨房', icon: 'filter', available: true, defaultOn: false },
  { id: 'fan', name: '循环风机', room: '客厅', icon: 'fan', available: false, defaultOn: false }
];

export function createMockDevices(savedDevices = {}) {
  return Object.fromEntries(DEVICE_CATALOG.map(device => [
    device.id,
    { on: Boolean(savedDevices[device.id]?.on ?? device.defaultOn) }
  ]));
}

export function findDevice(deviceId) {
  return DEVICE_CATALOG.find(device => device.id === deviceId) || null;
}
