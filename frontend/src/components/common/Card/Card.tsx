import React from 'react'
import './Card.css'

export interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  hoverable?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
  header,
  footer,
}) => {
  const baseClass = 'card'
  const variantClass = `card-${variant}`
  const paddingClass = `card-padding-${padding}`
  const clickableClass = onClick ? 'card-clickable' : ''
  const hoverableClass = hoverable ? 'card-hoverable' : ''
  
  const classes = [
    baseClass,
    variantClass,
    paddingClass,
    clickableClass,
    hoverableClass,
    className
  ].filter(Boolean).join(' ')

  const CardComponent = onClick ? 'button' : 'div'

  return (
    <CardComponent
      className={classes}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {header && (
        <div className="card-header">
          {header}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </CardComponent>
  )
}

export default Card