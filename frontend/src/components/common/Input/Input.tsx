import React, { forwardRef } from 'react'
import styles from './Input.module.css'
import { cn } from '../../../utils/cn'

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

    const wrapperClasses = cn(
        styles.inputWrapper,
        styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`size${inputSize.charAt(0).toUpperCase() + inputSize.slice(1)}`],
        fullWidth && styles.fullWidth,
        error && styles.error,
        (leftIcon || rightIcon) && styles.hasIcons,
        className
    )

    return (
        <div className={wrapperClasses}>
            {label && (
                <label htmlFor={inputId} className={styles.inputLabel}>
                    {label}
                    {required && <span className={styles.inputRequired}>*</span>}
                </label>
            )}

            <div className={styles.inputContainer}>
                {leftIcon && (
                    <div className={cn(styles.inputIcon, styles.inputIconLeft)}>
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        styles.inputField,
                        leftIcon && styles.inputFieldLeftIcon,
                        rightIcon && styles.inputFieldRightIcon
                    )}
                    {...props}
                />

                {rightIcon && (
                    <div className={cn(styles.inputIcon, styles.inputIconRight)}>
                        {rightIcon}
                    </div>
                )}
            </div>

            {(error || helperText) && (
                <div className={styles.inputFeedback}>
                    {error ? (
                        <span className={styles.inputErrorText}>{error}</span>
                    ) : (
                        <span className={styles.inputHelperText}>{helperText}</span>
                    )}
                </div>
            )}
        </div>
    )
})

Input.displayName = 'Input'

export default Input