import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import styles from './Button.module.css'
import { cn } from '../../../utils/cn'
import { ButtonVariant, SizeVariant } from '../../../types/design-system'

interface BaseButtonProps {
  variant?: ButtonVariant
  size?: SizeVariant
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

type ButtonAsButton = BaseButtonProps & 
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    as?: 'button'
    href?: never
  }

type ButtonAsAnchor = BaseButtonProps & 
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    as: 'a'
    href: string
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
  const classes = cn(
    styles.btn,
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className
  )

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
          <span className={cn(styles.btnIcon, styles.btnIconLeft)}>
            {leftIcon}
          </span>
        )}

        <span className={cn(styles.btnContent, loading && styles.btnContentLoading)}>
          {children}
        </span>

        {!loading && rightIcon && (
          <span className={cn(styles.btnIcon, styles.btnIconRight)}>
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
        <Loader2 className={cn(styles.btnSpinner, styles.btnIcon, styles.btnIconLeft)} size={16} />
      )}

      {!loading && leftIcon && (
        <span className={cn(styles.btnIcon, styles.btnIconLeft)}>
          {leftIcon}
        </span>
      )}

      <span className={cn(styles.btnContent, loading && styles.btnContentLoading)}>
        {children}
      </span>

      {!loading && rightIcon && (
        <span className={cn(styles.btnIcon, styles.btnIconRight)}>
          {rightIcon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button