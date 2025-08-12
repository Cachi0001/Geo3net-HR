import React, { createContext, useContext, useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  message?: string
  component?: string
}

interface LoadingContextType {
  isLoading: boolean
  message?: string
  component?: string
  show: (message?: string, component?: string) => void
  hide: () => void
  setMessage: (message: string) => void
  getLoadingState: () => LoadingState
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    component: undefined,
  })

  const show = useCallback((message?: string, component?: string) => {
    setLoadingState({
      isLoading: true,
      message,
      component,
    })
  }, [])

  const hide = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      component: undefined,
    })
  }, [])

  const setMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message,
    }))
  }, [])

  const getLoadingState = useCallback(() => loadingState, [loadingState])

  const value: LoadingContextType = {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    component: loadingState.component,
    show,
    hide,
    setMessage,
    getLoadingState,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}