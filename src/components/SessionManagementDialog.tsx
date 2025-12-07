import { useState, useEffect } from 'react';
import { X, Trash2, Clock, Smartphone, Monitor, Tablet } from 'lucide-react';

interface PairedDevice {
  deviceId: string;
  deviceName: string;
  lastActive: number;
  sessionToken: string;
}

interface SessionManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionManagementDialog({ isOpen, onClose }: SessionManagementDialogProps) {
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = () => {
    // Load all paired devices from localStorage
    const keys = Object.keys(localStorage);
    const deviceList: PairedDevice[] = [];
    
    // Get current device ID
    const currentId = localStorage.getItem('deviceId') || '';
    setCurrentDeviceId(currentId);

    keys.forEach(key => {
      if (key.startsWith('session_token_')) {
        const deviceId = key.replace('session_token_', '');
        const sessionToken = localStorage.getItem(key) || '';
        const deviceName = localStorage.getItem(`device_name_${deviceId}`) || `Device ${deviceId.slice(0, 8)}`;
        const lastActive = parseInt(localStorage.getItem(`device_last_active_${deviceId}`) || '0');
        
        deviceList.push({
          deviceId,
          deviceName,
          lastActive: lastActive || Date.now(),
          sessionToken,
        });
      }
    });

    // Sort by last active (most recent first)
    deviceList.sort((a, b) => b.lastActive - a.lastActive);
    setDevices(deviceList);
  };

  const handleRevokeDevice = (deviceId: string) => {
    // Remove from localStorage
    localStorage.removeItem(`session_token_${deviceId}`);
    localStorage.removeItem(`device_name_${deviceId}`);
    localStorage.removeItem(`device_last_active_${deviceId}`);
    
    // Reload list
    loadDevices();
  };

  const formatLastActive = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) return Smartphone;
    if (name.includes('tablet') || name.includes('ipad')) return Tablet;
    return Monitor;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-bg-secondary border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Session Management</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-text-secondary mb-4">
            Manage paired devices that have access to this controller. Current device is highlighted.
          </p>

          {devices.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Monitor size={48} className="mx-auto mb-3 opacity-50" />
              <p>No paired devices found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.deviceName);
                const isCurrentDevice = device.deviceId === currentDeviceId;
                
                return (
                  <div
                    key={device.deviceId}
                    className={`flex items-center justify-between p-4 border ${ 
                      isCurrentDevice 
                        ? 'border-accent bg-accent/5' 
                        : 'border-border bg-bg-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <DeviceIcon size={20} className="text-text-secondary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {device.deviceName}
                          </p>
                          {isCurrentDevice && (
                            <span className="text-xs px-2 py-0.5 bg-accent text-white">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-text-secondary truncate">
                            ID: {device.deviceId.slice(0, 16)}...
                          </p>
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Clock size={12} />
                            {formatLastActive(device.lastActive)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!isCurrentDevice && (
                      <button
                        onClick={() => handleRevokeDevice(device.deviceId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-error hover:bg-error/10 border border-error/30 transition-colors"
                        title="Revoke access for this device"
                      >
                        <Trash2 size={14} />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
