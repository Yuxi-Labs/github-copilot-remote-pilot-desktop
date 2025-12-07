const DEVICE_ID_KEY = 'copilot-device-id';
const SESSION_TOKEN_KEY = 'copilot-session-token';
const DEVICE_NAME_KEY = 'copilot-device-name';

/**
 * Get or generate device ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get device name
 */
export function getDeviceName(): string {
  let deviceName = localStorage.getItem(DEVICE_NAME_KEY);
  if (!deviceName) {
    // Generate default name based on platform/hostname if available
    deviceName = `Desktop Client`;
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  }
  return deviceName;
}

/**
 * Set device name
 */
export function setDeviceName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}

/**
 * Get session token
 */
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Save session token
 */
export function saveSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Clear session token (on logout or rejection)
 */
export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Check if device is paired
 */
export function isPaired(): boolean {
  return getSessionToken() !== null;
}
