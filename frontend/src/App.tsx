import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Dashboard layouts and pages
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
// import EmployeesPage from './pages/dashboard/EmployeesPage'
// import TimeTrackingPage from './pages/dashboard/TimeTrackingPage'
// import TasksPage from './pages/dashboard/TasksPage'
// import ReportsPage from './pages/dashboard/ReportsPage'
// import SettingsPage from './pages/dashboard/SettingsPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Dashboard Routes - Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="employees" element={<div>Employees Page Placeholder</div>} />
              <Route path="time-tracking" element={<div>Time Tracking Page Placeholder</div>} />
              <Route path="tasks" element={<div>Tasks Page Placeholder</div>} />
              <Route path="reports" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin', 'manager']}>
                  <div>Reports Page Placeholder</div>
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <div>Settings Page Placeholder</div>
                </ProtectedRoute>
              } />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            } />
          </Routes>
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  )
}

export default App