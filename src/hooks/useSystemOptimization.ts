import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface SystemStatus {
  batteryLevel: number;
  isCharging: boolean;
  onBattery: boolean;
  networkQuality: 'high' | 'medium' | 'low';
}

export function useSystemOptimization() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    batteryLevel: 100,
    isCharging: true,
    onBattery: false,
    networkQuality: 'high',
  });

  useEffect(() => {
    // Check battery status
    const updateBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateStatus = () => {
            setSystemStatus(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
              isCharging: battery.charging,
              onBattery: !battery.charging && battery.level < 0.9,
            }));
          };

          updateStatus();
          
          battery.addEventListener('levelchange', updateStatus);
          battery.addEventListener('chargingchange', updateStatus);

          return () => {
            battery.removeEventListener('levelchange', updateStatus);
            battery.removeEventListener('chargingchange', updateStatus);
          };
        } catch (err) {
          logger.log('Battery API not supported:', err);
        }
      }
    };

    updateBatteryStatus();

    // Check network quality via connection API
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        let quality: 'high' | 'medium' | 'low' = 'high';
        
        if (effectiveType === '4g') quality = 'high';
        else if (effectiveType === '3g') quality = 'medium';
        else if (effectiveType === '2g' || effectiveType === 'slow-2g') quality = 'low';

        setSystemStatus(prev => ({ ...prev, networkQuality: quality }));
      }
    };

    updateNetworkStatus();

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
      return () => connection.removeEventListener('change', updateNetworkStatus);
    }
  }, []);

  const shouldOptimize = systemStatus.onBattery || systemStatus.networkQuality !== 'high';

  const getBandwidthMode = (): 'high' | 'medium' | 'low' => {
    if (systemStatus.networkQuality === 'low' || (systemStatus.onBattery && systemStatus.batteryLevel < 20)) {
      return 'low';
    }
    if (systemStatus.networkQuality === 'medium' || (systemStatus.onBattery && systemStatus.batteryLevel < 50)) {
      return 'medium';
    }
    return 'high';
  };

  return {
    systemStatus,
    shouldOptimize,
    batteryMode: systemStatus.onBattery,
    bandwidthMode: getBandwidthMode(),
  };
}
