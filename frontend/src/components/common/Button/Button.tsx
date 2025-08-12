import React, { forwardRef } from 'react'
import './Button.css'

interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

interface ButtonAsButton extends BaseButtonProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button'
  href?: never
}

interface ButtonAsAnchor extends BaseButtonProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {
  as: 'a'
  href: string
}

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  as = 'button',
  href,
  ...props
}, ref) => {
  const baseClass = 'btn'
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const fullWidthClass = fullWidth ? 'btn-full-width' : ''
  const loadingClass = loading ? 'btn-loading' : ''

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ')

  if (as === 'a') {
    const { href, ...anchorProps } = props as ButtonAsAnchor
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        href={href}
        {...anchorProps}
        >
        {!loading && leftIcon && (
          <span className="btn-icon btn-icon-left">
            {leftIcon}
          </span>
        )}

        <span className={`btn-content ${loading ? 'btn-content-loading' : ''}`}>
          {children}
        </span>

        {!loading && rightIcon && (
          <span className="btn-icon btn-icon-right">
            {rightIcon}
          </span>
        )}
      </a>
    )
  }

  const { disabled, ...buttonProps } = props as ButtonAsButton
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {loading && (
        <div className="btn-spinner">
          <div className="btn-spinner-dot"></div>
          <div className="btn-spinner-dot"></div>
          <div className="btn-spinner-dot"></div>
        </div>
      )}

      {!loading && leftIcon && (
        <span className="btn-icon btn-icon-left">
          {leftIcon}
        </span>
      )}

      <span className={`btn-content ${loading ? 'btn-content-loading' : ''}`}>
        {children}
      </span>

      {!loading && rightIcon && (
        <span className="btn-icon btn-icon-right">
          {rightIcon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button