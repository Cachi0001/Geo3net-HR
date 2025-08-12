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

  if (loading) {
    return (
      <div className="public-route-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}

export default PublicRoute
