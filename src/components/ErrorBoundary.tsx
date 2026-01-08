'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary 捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              出现了错误
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              应用遇到了一个错误，请刷新页面重试。
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              错误信息: {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-700"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
