import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../utils/logger';

describe('logger', () => {
  beforeEach(() => {
    logger.clearHistory();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    logger.clearHistory();
    vi.restoreAllMocks();
  });

  it('should always log errors', () => {
    logger.error('test error');
    expect(console.error).toHaveBeenCalled();
    
    const history = logger.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].level).toBe('error');
  });

  it('should track log history', () => {
    logger.log('test log');
    logger.warn('test warn');
    logger.debug('test debug');
    
    const history = logger.getHistory();
    expect(history).toHaveLength(3);
  });

  it('should export logs as formatted string', () => {
    logger.log('Test message');
    logger.error('Error message');

    const exported = logger.exportLogs();

    expect(exported).toContain('[INFO] Test message');
    expect(exported).toContain('[ERROR] Error message');
  });

  it('should filter logs by level', () => {
    logger.log('Info 1');
    logger.warn('Warning 1');
    logger.log('Info 2');

    const infoLogs = logger.filterByLevel('info');
    expect(infoLogs).toHaveLength(2);
  });
});
