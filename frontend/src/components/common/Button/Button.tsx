import React, { forwardRef } from 'react'
import './Button.css'

interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
}

type ButtonAsButton = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  BaseButtonProps & {
    as?: 'button'
    href?: never
    children?: React.ReactNode
  }

type ButtonAsAnchor = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> &
  BaseButtonProps & {
    as: 'a'
    href: string
    children?: React.ReactNode
  }

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

// Avoid using generics on forwardRef to satisfy Babel/ESLint parser
const Button = forwardRef((props: ButtonProps, ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>) => {
  const {
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
    ...rest
  } = props as any
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
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
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

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>
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