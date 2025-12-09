/**
 * Performance Monitoring Utilities
 * 
 * Tracks key metrics:
 * - Message rendering time
 * - WebSocket latency
 * - UI responsiveness
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    try {
      const measureName = `${name}-measure`;
      performance.measure(measureName, startMark, endMark);
      const entries = performance.getEntriesByName(measureName, 'measure');
      
      if (entries.length > 0) {
        const duration = entries[0].duration;
        this.recordMetric(name, duration);
        
        // Clean up marks and measures
        performance.clearMarks(startMark);
        if (endMark) performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
        
        return duration;
      }
    } catch (err) {
      console.warn('Performance measurement failed:', err);
    }
    return 0;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get percentile value for a metric
   */
  getPercentile(name: string, percentile: number): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sorted = metrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(new Set(this.metrics.map(m => m.name)));
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }> {
    const summary: Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }> = {};
    
    for (const name of this.getMetricNames()) {
      const metrics = this.getMetrics(name);
      summary[name] = {
        avg: this.getAverage(name),
        p50: this.getPercentile(name, 50),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99),
        count: metrics.length,
      };
    }
    
    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to measure function execution time
 */
export function measurePerformance(metricName: string) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startMark = `${metricName}-start-${Date.now()}`;
      const endMark = `${metricName}-end-${Date.now()}`;
      
      performanceMonitor.mark(startMark);
      const result = await originalMethod.apply(this, args);
      performanceMonitor.mark(endMark);
      
      performanceMonitor.measure(metricName, startMark, endMark);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Hook to measure React component render time
 */
export function useMeasureRender(componentName: string) {
  const startMark = `${componentName}-render-start`;
  
  // Mark start before render
  performanceMonitor.mark(startMark);
  
  // Measure after render (next tick)
  setTimeout(() => {
    const endMark = `${componentName}-render-end`;
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${componentName}-render`, startMark, endMark);
  }, 0);
}
