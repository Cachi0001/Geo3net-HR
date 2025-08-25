import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { Toaster as RadixToaster } from './components/ui/toaster'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Dashboard layouts and pages
import { AdminLayout } from './components/layout/AdminLayout'
import { RoleBasedDashboard } from './components/dashboard/RoleBasedDashboard'
import EmployeesPage from './pages/admin/EmployeesPage'
import AddEmployeeForm from './components/forms/AddEmployeeForm'
import { EmployeeDetailView, EmployeeEditForm } from './components/employee'
import RoleBasedTimeTracking from './components/RoleBasedTimeTracking'
import TasksPage from './pages/employee/TasksPage'
import TaskAssignmentPage from './pages/admin/TaskAssignmentPage.tsx'
import TimeTrackingPage from './pages/dashboard/TimeTrackingPage.tsx'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import RolesPage from './pages/admin/RolesPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import AttendanceMonitorPage from './pages/admin/AttendanceMonitorPage'
import PayrollPage from './pages/admin/PayrollPage'
import SettingsPage from './pages/admin/SettingsPage'
import RecruitmentPage from './pages/dashboard/RecruitmentPage'
import SecurityPage from './pages/dashboard/SecurityPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import ActivitiesPage from './pages/dashboard/ActivitiesPage'
import LeaveRequestPage from './pages/dashboard/LeaveRequestPage'
import PerformancePage from './pages/dashboard/PerformancePage.tsx'
import SchedulePage from './pages/dashboard/SchedulePage.tsx'
import CompliancePage from './pages/dashboard/CompliancePage.tsx'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Toaster position="top-right" richColors />
          <RadixToaster />
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
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RoleBasedDashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/add" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <AddEmployeeForm />
                </ProtectedRoute>
              } />
              <Route path="employees/:id" element={
                <ProtectedRoute>
                  <EmployeeDetailView />
                </ProtectedRoute>
              } />
              <Route path="employees/:id/edit" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <EmployeeEditForm />
                </ProtectedRoute>
              } />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="task-assignment" element={<TaskAssignmentPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="time-tracking" element={<RoleBasedTimeTracking />} />
              <Route path="attendance-monitor" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <AttendanceMonitorPage />
                </ProtectedRoute>
              } />
              <Route path="leave-request" element={<LeaveRequestPage />} />
              <Route path="tasks" element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              } />
              <Route path="payroll" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin', 'finance-admin']}>
                  <PayrollPage />
                </ProtectedRoute>
              } />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:tab" element={<ProfilePage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="performance" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin', 'manager']}>
                  <PerformancePage />
                </ProtectedRoute>
              } />
              <Route path="schedule" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin', 'manager']}>
                  <SchedulePage />
                </ProtectedRoute>
              } />
              <Route path="compliance" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <CompliancePage />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin', 'manager']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="settings/:tab" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="recruitment" element={
                <ProtectedRoute requiredRoles={['super-admin', 'hr-admin']}>
                  <RecruitmentPage />
                </ProtectedRoute>
              } />
              <Route path="security" element={
                <ProtectedRoute requiredRoles={['super-admin']}>
                  <SecurityPage />
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