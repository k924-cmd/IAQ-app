import { MOCK_ENVIRONMENT } from '../mocks/environment.js';

export async function getEnvironmentSnapshot() {
  return { ...MOCK_ENVIRONMENT, source: 'mock', observedAt: new Date().toISOString() };
}
