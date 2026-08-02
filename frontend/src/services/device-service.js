export async function toggleMockDevice(device) {
  if (!device?.uiMockOnly || device.controlSupport !== 'supported') throw new Error('DEVICE_UNAVAILABLE');
  const isWindow = device.type === 'smart_window';
  const active = isWindow ? device.state === 'open' : device.state === 'on';
  return {
    ...device,
    state: isWindow ? (active ? 'closed' : 'open') : (active ? 'off' : 'on'),
    stateVersion: device.stateVersion + 1,
    observedAt: new Date().toISOString(),
    source: 'mock'
  };
}
