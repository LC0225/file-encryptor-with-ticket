'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, type Toast as ToastType } from './Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastType, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<ToastType, 'id'>) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={handleClose} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
