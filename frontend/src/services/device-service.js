import { findDevice } from '../mocks/devices.js';

export async function toggleMockDevice(deviceId, currentState) {
  const device = findDevice(deviceId);
  if (!device?.available) throw new Error('DEVICE_UNAVAILABLE');
  return { deviceId, on: !currentState, source: 'mock' };
}
