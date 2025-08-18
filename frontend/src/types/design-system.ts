import { LucideIcon } from 'lucide-react'

export type ColorVariant = 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'pink'

export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'error'

export type UserRole = 'super-admin' | 'hr-admin' | 'manager' | 'hr-staff' | 'employee'

export interface DashboardStats {
  title: string
  value: string | number
  icon: LucideIcon
  change?: {
    value: number
    period: string
    type: 'positive' | 'negative' | 'neutral'
  }
  color?: ColorVariant
}

// Navigation item interface
export interface NavigationItem {
  icon: LucideIcon
  label: string
  path: string
  section: string
  permissions?: string[]
}

// Component props interfaces
export interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: string
  userName?: string
  userEmail?: string
}

export interface SidebarProps {
  userRole: string
  onCloseMobile?: () => void
}

export interface HeaderProps {
  userName: string
  userEmail: string
  userRole: string
  onMenuToggle: () => void
}

export interface StatsGridProps {
  stats: DashboardStats[]
}

export interface StatsCardProps {
  data: DashboardStats
}