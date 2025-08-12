import React from 'react'
import { useLoading } from '../../../hooks/useLoading'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  size = 'md', 
  overlay = true 
}) => {
  const { message: contextMessage } = useLoading()
  const displayMessage = message || contextMessage

  if (overlay) {
    return (
      <div className="loading-overlay-brand">
        <div className="loading-container-brand">
          <div className={`loading-spinner-brand loading-spinner-${size}`}>
            <div className="loading-dots-brand">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          {displayMessage && (
            <p className="loading-text-brand">{displayMessage}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="loading-container-brand">
      <div className={`loading-spinner-brand loading-spinner-${size}`}>
        <div className="loading-dots-brand">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      {displayMessage && (
        <p className="loading-text-brand">{displayMessage}</p>
      )}
    </div>
  )
}

export default LoadingSpinner