import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { LoadingSpinner } from '../../common'

interface PublicRouteProps {
  children: React.ReactNode
  redirectPath?: string
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectPath = '/dashboard' }) => {
  const { user, loading } = useAuth()

  console.log('🔍 PublicRoute: Render check:', {
    hasUser: !!user,
    loading,
    redirectPath,
    currentPath: window.location.pathname
  })

  if (loading) {
    console.log('🔍 PublicRoute: Showing loading spinner')
    return (
      <div className="public-route-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    console.log('🚀 PublicRoute: User authenticated, redirecting to:', redirectPath)
    return <Navigate to={redirectPath} replace />
  }

  console.log('🔍 PublicRoute: No user, showing children (login form)')
  return <>{children}</>
}

export default PublicRoute
