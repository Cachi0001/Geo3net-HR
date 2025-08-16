import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './Select.module.css'
import { cn } from '../../../utils/cn'

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
  const selectId = id || `select-${Math.random().toString(36).substring(2, 11)}`

  const wrapperClasses = cn(
    styles.selectWrapper,
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`size${selectSize.charAt(0).toUpperCase() + selectSize.slice(1)}`],
    fullWidth && styles.fullWidth,
    error && styles.error,
    className
  )

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={selectId} className={styles.selectLabel}>
          {label}
          {required && <span className={styles.selectRequired}>*</span>}
        </label>
      )}

      <div className={styles.selectContainer}>
        <select
          ref={ref}
          id={selectId}
          className={styles.selectField}
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

        <div className={styles.selectArrow}>
          <ChevronDown className={styles.selectArrowIcon} size={16} />
        </div>
      </div>

      {(error || helperText) && (
        <div className={styles.selectFeedback}>
          {error ? (
            <span className={styles.selectErrorText}>{error}</span>
          ) : (
            <span className={styles.selectHelperText}>{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select