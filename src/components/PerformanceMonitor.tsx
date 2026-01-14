'use client';

import { useState, useEffect } from 'react';

interface PerformanceMonitorProps {
  isActive: boolean;
  currentProgress: number;
  processedBytes: number;
  totalBytes?: number;
  startTime: number | null;
}

interface PerformanceData {
  elapsedSeconds: number;
  speedMBps: number;
  processedMB: number;
  estimatedTimeRemaining: number;
  memoryUsageMB: number | null;
}

export function PerformanceMonitor({
  isActive,
  currentProgress,
  processedBytes,
  totalBytes,
  startTime,
}: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    elapsedSeconds: 0,
    speedMBps: 0,
    processedMB: 0,
    estimatedTimeRemaining: 0,
    memoryUsageMB: null,
  });

  useEffect(() => {
    if (!isActive || !startTime) {
      setPerformanceData({
        elapsedSeconds: 0,
        speedMBps: 0,
        processedMB: 0,
        estimatedTimeRemaining: 0,
        memoryUsageMB: null,
      });
      return;
    }

    const updatePerformance = () => {
      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;
      const processedMB = processedBytes / (1024 * 1024);
      const speedMBps = elapsedSeconds > 0 ? processedMB / elapsedSeconds : 0;

      let estimatedTimeRemaining = 0;
      if (totalBytes && totalBytes > 0 && speedMBps > 0) {
        const remainingBytes = totalBytes - processedBytes;
        const remainingMB = remainingBytes / (1024 * 1024);
        estimatedTimeRemaining = remainingMB / speedMBps;
      }

      // 尝试获取内存使用信息（仅在支持的浏览器中可用）
      let memoryUsageMB: number | null = null;
      if (typeof (performance as any).memory !== 'undefined') {
        memoryUsageMB = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      }

      setPerformanceData({
        elapsedSeconds,
        speedMBps,
        processedMB,
        estimatedTimeRemaining,
        memoryUsageMB,
      });
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 100);

    return () => clearInterval(interval);
  }, [isActive, startTime, processedBytes, totalBytes]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = (seconds % 60).toFixed(0);
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">已处理:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatBytes(processedBytes)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">耗时:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(performanceData.elapsedSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">速度:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {performanceData.speedMBps.toFixed(2)} MB/s
              </span>
            </div>

            {totalBytes && totalBytes > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">剩余:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatTime(performanceData.estimatedTimeRemaining)}
                </span>
              </div>
            )}

            {performanceData.memoryUsageMB !== null && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">内存:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {performanceData.memoryUsageMB.toFixed(1)} MB
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                处理中
              </span>
            </div>
            <div className="h-4 w-0.5 bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              进度: {currentProgress.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
