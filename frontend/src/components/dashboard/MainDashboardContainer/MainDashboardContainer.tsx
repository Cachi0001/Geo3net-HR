import React from 'react'
import './MainDashboardContainer.css'

interface MainDashboardContainerProps {
  header?: React.ReactNode
  stats?: React.ReactNode
  charts?: React.ReactNode
  main?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
}

const MainDashboardContainer: React.FC<MainDashboardContainerProps> = ({
  header,
  stats,
  charts,
  main,
  sidebar,
  footer
}) => {
  return (
    <div className="dash">
      {header && <div className="dash__header glass">{header}</div>}
      {stats && <div className="dash__stats">{stats}</div>}
      {charts && <div className="dash__charts">{charts}</div>}
      <div className="dash__content">
        <div className="dash__main">{main}</div>
        {sidebar && <aside className="dash__sidebar">{sidebar}</aside>}
      </div>
      {footer && <div className="dash__footer glass">{footer}</div>}
    </div>
  )
}

export default MainDashboardContainer
