import React from 'react'
import './HeaderBar.css'

interface HeaderBarProps {
  title?: string
  userName?: string
  onSearch?: (q: string) => void
  onExport?: () => void
}

const HeaderBar: React.FC<HeaderBarProps> = ({ title = 'Dashboard', userName, onSearch, onExport }) => {
  return (
    <div className="header">
      <div className="header__left">
        <h2 className="header__title">{title}</h2>
        {userName && <span className="header__welcome">Welcome back, {userName}!</span>}
      </div>
      <div className="header__right">
        {onSearch && (
          <input
            className="header__search"
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
        <button className="header__btn" onClick={onExport}>Export</button>
      </div>
    </div>
  )
}

export default HeaderBar
