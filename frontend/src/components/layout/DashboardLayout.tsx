import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  Clock, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Home,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  LogOut,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Time Tracking', href: '/dashboard/time-tracking', icon: Clock },
  { name: 'Tasks', href: '/dashboard/tasks', icon: UserCheck },
  { name: 'Leave Management', href: '/dashboard/leave', icon: Calendar },
  { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign, roles: ['super-admin', 'hr-admin'] },
  { name: 'Recruitment', href: '/dashboard/recruitment', icon: FileText, roles: ['super-admin', 'hr-admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['super-admin', 'hr-admin', 'manager'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super-admin', 'hr-admin'] },
]

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
  }

  const filteredSidebarItems = sidebarItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  )

  if (!user) {
    return null // This should not happen due to ProtectedRoute, but just in case
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpeg" 
              alt="Go3net Logo" 
              className="h-10 w-10 rounded-lg object-cover shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Go3net</h1>
              <p className="text-xs text-gray-500 font-medium">HR System</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-8 px-8">
          <ul className="space-y-2">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Top header */}
          <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6 sm:px-8">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search bar */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees, tasks..."
                    className="w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ''} alt={user.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      <Link
                        to="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="inline mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-x-hidden">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout