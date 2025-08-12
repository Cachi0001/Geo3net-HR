import React, { forwardRef } from 'react'
import './Textarea.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'filled' | 'outline'
  textareaSize?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  required?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  textareaSize = 'md',
  fullWidth = false,
  required = false,
  resize = 'vertical',
  className = '',
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClass = 'textarea-wrapper'
  const variantClass = `textarea-wrapper-${variant}`
  const sizeClass = `textarea-wrapper-${textareaSize}`
  const fullWidthClass = fullWidth ? 'textarea-wrapper-full-width' : ''
  const errorClass = error ? 'textarea-wrapper-error' : ''
  const resizeClass = `textarea-resize-${resize}`
  
  const wrapperClasses = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    errorClass,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={textareaId} className="textarea-label">
          {label}
          {required && <span className="textarea-required">*</span>}
        </label>
      )}
      
      <div className="textarea-container">
        <textarea
          ref={ref}
          id={textareaId}
          className={`textarea-field ${resizeClass}`}
          rows={rows}
          {...props}
        />
      </div>
      
      {(error || helperText) && (
        <div className="textarea-feedback">
          {error ? (
            <span className="textarea-error-text">{error}</span>
          ) : (
            <span className="textarea-helper-text">{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea