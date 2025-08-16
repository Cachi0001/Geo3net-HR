import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './contexts/ToastContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { AuthProvider } from './contexts/AuthContext'
import { registerSW } from './utils/serviceWorker'
import './styles/design-system.css'
import './styles/base/global.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Register service worker for offline capabilities
registerSW()