const DEVICE_ID_KEY = 'copilot-device-id';
const SESSION_TOKEN_KEY = 'copilot-session-token';
const DEVICE_NAME_KEY = 'copilot-device-name';
const PAIRED_DEVICES_KEY = 'copilot-paired-devices';

export interface PairedDevice {
  id: string;
  name: string;
  pairedAt: number;
}

/**
 * Get all paired devices
 */
export function getPairedDevices(): PairedDevice[] {
  try {
    const stored = localStorage.getItem(PAIRED_DEVICES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load paired devices:', error);
    return [];
  }
}

/**
 * Add a paired device
 */
export function addPairedDevice(device: PairedDevice): void {
  const devices = getPairedDevices();
  // Check if device already exists
  if (devices.some(d => d.id === device.id)) {
    return; // Don't add duplicates
  }
  devices.push(device);
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
}

/**
 * Remove a paired device by ID
 */
export function removePairedDevice(deviceId: string): void {
  const devices = getPairedDevices().filter(d => d.id !== deviceId);
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
}

/**
 * Check if a specific device is paired
 */
export function isPaired(deviceId?: string): boolean {
  if (deviceId) {
    const devices = getPairedDevices();
    return devices.some(d => d.id === deviceId);
  }
  // Original behavior: check if current device has session token
  return getSessionToken() !== null;
}

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
