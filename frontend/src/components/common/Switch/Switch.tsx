import React from 'react'
import './Switch.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  label?: string
  className?: string
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  color = 'primary',
  label,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <div className={`switch-container ${className}`}>
      <div
        className={`switch ${size} ${color} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="switch-track">
          <div className="switch-thumb" />
        </div>
      </div>
      {label && (
        <label 
          className={`switch-label ${disabled ? 'disabled' : ''}`}
          onClick={handleClick}
        >
          {label}
        </label>
      )}
    </div>
  )
}

export default Switch