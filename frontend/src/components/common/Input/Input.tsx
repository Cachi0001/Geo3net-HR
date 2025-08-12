import React, { forwardRef } from 'react'
import './Input.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    variant?: 'default' | 'filled' | 'outline'
    inputSize?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    inputSize = 'md',
    fullWidth = false,
    required = false,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseClass = 'input-wrapper'
    const variantClass = `input-wrapper-${variant}`
    const sizeClass = `input-wrapper-${inputSize}`
    const fullWidthClass = fullWidth ? 'input-wrapper-full-width' : ''
    const errorClass = error ? 'input-wrapper-error' : ''
    const hasIconsClass = (leftIcon || rightIcon) ? 'input-wrapper-has-icons' : ''

    const wrapperClasses = [
        baseClass,
        variantClass,
        sizeClass,
        fullWidthClass,
        errorClass,
        hasIconsClass,
        className
    ].filter(Boolean).join(' ')

    return (
        <div className={wrapperClasses}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className="input-container">
                {leftIcon && (
                    <div className="input-icon input-icon-left">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={`input-field ${leftIcon ? 'input-field-left-icon' : ''} ${rightIcon ? 'input-field-right-icon' : ''}`}
                    {...props}
                />

                {rightIcon && (
                    <div className="input-icon input-icon-right">
                        {rightIcon}
                    </div>
                )}
            </div>

            {(error || helperText) && (
                <div className="input-feedback">
                    {error ? (
                        <span className="input-error-text">{error}</span>
                    ) : (
                        <span className="input-helper-text">{helperText}</span>
                    )}
                </div>
            )}
        </div>
    )
})

Input.displayName = 'Input'

export default Input