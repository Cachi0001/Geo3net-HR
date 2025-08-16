import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { StatsCardProps, DashboardStats } from '../../../types/design-system'
import styles from './StatsCard.module.css'

export const StatsCard: React.FC<StatsCardProps> = ({ data }) => {
  const { title, value, icon: Icon, change, color = 'blue' } = data

  const getChangeIcon = () => {
    if (!change) return null
    
    switch (change.type) {
      case 'positive':
        return <TrendingUp className={styles.changeIcon} />
      case 'negative':
        return <TrendingDown className={styles.changeIcon} />
      default:
        return <Minus className={styles.changeIcon} />
    }
  }

  return (
    <div className={`${styles.statsCard} ${styles[color]}`}>
      <div className={styles.statsHeader}>
        <h3 className={styles.statsTitle}>{title}</h3>
        <div className={`${styles.statsIcon} ${styles[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className={styles.statsValue}>{value}</div>
      
      {change && (
        <div className={`${styles.statsChange} ${styles[change.type]}`}>
          {getChangeIcon()}
          <span>{Math.abs(change.value)}%</span>
          <span className={styles.changeText}>vs {change.period}</span>
        </div>
      )}
    </div>
  )
}

interface StatsGridProps {
  stats: DashboardStats[]
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className={styles.statsGrid}>
      {stats.map((stat, index) => (
        <StatsCard key={index} data={stat} />
      ))}
    </div>
  )
}