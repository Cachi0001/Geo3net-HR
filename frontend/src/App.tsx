import React, { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useLoading } from './hooks/useLoading'
import { notificationService } from './services/notification.service'
import { useAuth } from './hooks/useAuth'
import Layout from './components/common/Layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner/LoadingSpinner'
import Toast from './components/common/Toast/Toast'

import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import EmailVerificationPage from './pages/auth/EmailVerificationPage'

// Protected pages
import DashboardPage from './pages/dashboard/DashboardPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import TasksPage from './pages/tasks/TasksPage'
import TimeTrackingPage from './pages/timeTracking/TimeTrackingPage'
import MobileTimeTrackingPage from './pages/timeTracking/MobileTimeTrackingPage'
import ProfilePage from './pages/profile/ProfilePage'

import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute/PublicRoute'

const App: React.FC = () => {
  const { isLoading } = useLoading()
  const notifInitRef = useRef(false)
  const { user } = useAuth()

  // Initialize notification service
  useEffect(() => {
    const enabled = process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true'
    if (!enabled) {
      return
    }
    if (user && !notifInitRef.current) {
      notifInitRef.current = true
      notificationService.initialize()
    }
  }, [user])

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <Toast />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } />
        <Route path="/verify-email" element={
          <PublicRoute>
            <EmailVerificationPage />
          </PublicRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute>
            <Layout>
              <EmployeesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Layout>
              <TasksPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/time-tracking" element={
          <ProtectedRoute>
            <Layout>
              <TimeTrackingPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mobile-time-tracking" element={
          <ProtectedRoute>
            <MobileTimeTrackingPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Landing route */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App