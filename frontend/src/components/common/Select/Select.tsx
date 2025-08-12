import React, { forwardRef } from 'react'
import './Select.css'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  variant?: 'default' | 'filled' | 'outline'
  selectSize?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  required?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  placeholder,
  variant = 'default',
  selectSize = 'md',
  fullWidth = false,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClass = 'select-wrapper'
  const variantClass = `select-wrapper-${variant}`
  const sizeClass = `select-wrapper-${selectSize}`
  const fullWidthClass = fullWidth ? 'select-wrapper-full-width' : ''
  const errorClass = error ? 'select-wrapper-error' : ''
  
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
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      
      <div className="select-container">
        <select
          ref={ref}
          id={selectId}
          className="select-field"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="select-arrow">
          <svg
            className="select-arrow-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      
      {(error || helperText) && (
        <div className="select-feedback">
          {error ? (
            <span className="select-error-text">{error}</span>
          ) : (
            <span className="select-helper-text">{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select