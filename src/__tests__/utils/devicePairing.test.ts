import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPairedDevices,
  addPairedDevice,
  removePairedDevice,
  isPaired
} from '../../utils/devicePairing';

describe('devicePairing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addPairedDevice', () => {
    it('should add a new paired device', () => {
      const device = {
        id: 'device-1',
        name: 'My Phone',
        pairedAt: Date.now()
      };

      addPairedDevice(device);
      const devices = getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual(device);
    });

    it('should not add duplicate device ids', () => {
      const device = {
        id: 'device-1',
        name: 'My Phone',
        pairedAt: Date.now()
      };

      addPairedDevice(device);
      addPairedDevice(device);
      const devices = getPairedDevices();

      expect(devices).toHaveLength(1);
    });
  });

  describe('getPairedDevices', () => {
    it('should return empty array when no devices paired', () => {
      const devices = getPairedDevices();
      expect(devices).toEqual([]);
    });

    it('should return all paired devices', () => {
      addPairedDevice({ id: 'device-1', name: 'Phone', pairedAt: Date.now() });
      addPairedDevice({ id: 'device-2', name: 'Tablet', pairedAt: Date.now() });

      const devices = getPairedDevices();
      expect(devices).toHaveLength(2);
    });
  });

  describe('removePairedDevice', () => {
    it('should remove a paired device by id', () => {
      addPairedDevice({ id: 'device-1', name: 'Phone', pairedAt: Date.now() });
      addPairedDevice({ id: 'device-2', name: 'Tablet', pairedAt: Date.now() });

      removePairedDevice('device-1');
      const devices = getPairedDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe('device-2');
    });
  });

  describe('isPaired', () => {
    it('should return true for paired device', () => {
      addPairedDevice({ id: 'device-1', name: 'Phone', pairedAt: Date.now() });

      expect(isPaired('device-1')).toBe(true);
    });

    it('should return false for non-paired device', () => {
      expect(isPaired('device-999')).toBe(false);
    });
  });
});
