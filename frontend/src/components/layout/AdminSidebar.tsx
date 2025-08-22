import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Shield, 
  Settings, 
  BarChart3,
  UserCheck,
  FileText,
  Clock,
  Briefcase,
  CheckSquare,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

interface AdminSidebarProps {}

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationItems: NavigationSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Time Tracking', url: '/dashboard/time-tracking', icon: Clock },
      { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3, roles: ['super-admin', 'hr-admin', 'manager'] },
    ]
  },
  {
    title: 'User Management',
    items: [
      { title: 'Employees', url: '/dashboard/employees', icon: Users, roles: ['super-admin', 'hr-admin', 'manager'] },
      { title: 'Departments', url: '/dashboard/departments', icon: Building2, roles: ['super-admin', 'hr-admin'] },
      { title: 'Task Assignment', url: '/dashboard/task-assignment', icon: CheckSquare, roles: ['super-admin', 'hr-admin', 'manager'] },
      { title: 'Roles', url: '/dashboard/roles', icon: UserCheck, roles: ['super-admin', 'hr-admin'] },
    ]
  },
  {
    title: 'HR Operations',
    items: [
      { title: 'Recruitment', url: '/dashboard/recruitment', icon: Briefcase, roles: ['super-admin', 'hr-admin', 'hr-staff'] },
      { title: 'Payroll', url: '/dashboard/payroll', icon: FileText, roles: ['super-admin', 'hr-admin'] },
      { title: 'Leave Requests', url: '/dashboard/leave-request', icon: Calendar, roles: ['super-admin', 'hr-admin', 'manager', 'employee'] },
      { title: 'Performance', url: '/dashboard/performance', icon: Target, roles: ['super-admin', 'hr-admin', 'manager'] },
    ]
  },
  {
    title: 'Personal',
    items: [
      { title: 'My Profile', url: '/dashboard/profile', icon: UserCheck },
      { title: 'My Activities', url: '/dashboard/activities', icon: Activity },
      { title: 'Schedule', url: '/dashboard/schedule', icon: Calendar, roles: ['super-admin', 'hr-admin', 'manager'] },
    ]
  },
  {
    title: 'System',
    items: [
      { title: 'Security', url: '/dashboard/security', icon: Shield, roles: ['super-admin'] },
      { title: 'Settings', url: '/dashboard/settings', icon: Settings, roles: ['super-admin', 'hr-admin'] },
    ]
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const isCollapsed = state === 'collapsed';

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.roles || (user && item.roles.includes(user.role))
    )
  })).filter(section => section.items.length > 0);
  
  const isActive = (path: string) => {
    // For exact dashboard route, only match exactly
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // For other routes, match exactly or with sub-paths
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? 'bg-primary text-primary-foreground shadow-md' 
      : 'text-foreground hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              alt="Go3net Logo" 
              className="h-8 w-auto"
            />
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-foreground">Go3net</h1>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'super-admin' ? 'Super Admin' :
                   user?.role === 'hr-admin' ? 'HR Admin' :
                   user?.role === 'manager' ? 'Manager' :
                   user?.role === 'hr-staff' ? 'HR Staff' :
                   user?.role === 'employee' ? 'Employee' : 'User'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          {filteredNavigationItems.map((section) => (
            <SidebarGroup key={section.title} className="px-3 mb-6">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {section.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(item.url)}`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!isCollapsed && (
                            <span className="font-medium">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};