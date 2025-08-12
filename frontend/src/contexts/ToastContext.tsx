import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  isVisible: boolean
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (type: Toast['type'], message: string, duration?: number) => void
  hideToast: (id: string) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const showToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      type,
      message,
      duration,
      isVisible: true,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration)
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration)
  }, [showToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration)
  }, [showToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast('info', message, duration)
  }, [showToast])

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}