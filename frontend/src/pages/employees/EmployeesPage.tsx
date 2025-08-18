import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { employeeService, Employee, CreateEmployeeData } from '../../services/employee.service';
import { Button, Modal } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { StatsGrid } from '../../components/ui/StatsCard/StatsCard';
import EmployeeTable from '../../components/employees/EmployeeTable';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { DashboardStats } from '../../types/design-system';
import styles from './EmployeesPage.module.css';

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [employeeStats, setEmployeeStats] = useState<DashboardStats[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Get user role with super admin recognition
  const getUserRole = () => {
    if (user?.email === 'kayode@go3net.com.ng') {
      return 'super-admin';
    }
    const rawRole = (user as any)?.role;
    if (typeof rawRole === 'string') return rawRole;
    if (rawRole && typeof rawRole === 'object') {
      return rawRole.slug || rawRole.name || rawRole.role || rawRole.title || 'employee';
    }
    return 'employee';
  };

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const { employees: fetchedEmployees, total } = await employeeService.getEmployees();
      setEmployees(fetchedEmployees);
      setTotalEmployees(total);
      
      const activeEmployees = fetchedEmployees.filter(emp => emp.status === 'active').length;
      const inactiveEmployees = fetchedEmployees.filter(emp => emp.status === 'inactive').length;
      const newThisMonth = fetchedEmployees.filter(emp => {
        const createdDate = new Date(emp.createdAt || '');
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length;
      
      const stats: DashboardStats[] = [
        {
          title: 'Total Employees',
          value: total.toString(),
          icon: Users,
          color: 'blue',
          change: {
            type: 'positive',
            value: 5.2,
            period: 'last month'
          }
        },
        {
          title: 'Active Employees',
          value: activeEmployees.toString(),
          icon: UserCheck,
          color: 'green',
          change: {
            type: 'positive',
            value: 2.1,
            period: 'last month'
          }
        },
        {
          title: 'New This Month',
          value: newThisMonth.toString(),
          icon: UserPlus,
          color: 'purple',
          change: {
            type: 'positive',
            value: 12.5,
            period: 'last month'
          }
        },
        {
          title: 'Inactive',
          value: inactiveEmployees.toString(),
          icon: UserX,
          color: 'orange',
          change: {
            type: 'negative',
            value: 1.2,
            period: 'last month'
          }
        }
      ];
      
      setEmployeeStats(stats);
    } catch (error) {
      showToast('error', 'Failed to fetch employees.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
      try {
        await employeeService.deleteEmployee(employee.id);
        showToast('success', 'Employee deleted successfully.');
        fetchEmployees(); // Refresh list
      } catch (error) {
        showToast('error', 'Failed to delete employee.');
      }
    }
  };

  const handleSave = async (data: CreateEmployeeData | Employee) => {
    setIsSaving(true);
    try {
      if ('id' in data) {
        // Update employee
        await employeeService.updateEmployee(data.id, data);
        showToast('success', 'Employee updated successfully.');
      } else {
        // Create employee
        await employeeService.createEmployee(data);
        showToast('success', 'Employee created successfully.');
      }
      setIsModalOpen(false);
    } catch (error) {
      showToast('error', 'Failed to save employee.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout 
      userRole={getUserRole()}
      userName={user?.fullName || 'User'}
      userEmail={user?.email || ''}
    >
      <div className={styles.employeesPage}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>Employee Management</h1>
              <p className={styles.pageDescription}>
                Manage your workforce, track employee information, and oversee HR operations.
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button 
                variant="primary" 
                leftIcon={<UserPlus size={16} />}
                onClick={handleCreate}
              >
                Add Employee
              </Button>
            </div>
          </div>
        </div>

        {/* Employee Statistics */}
        <div className={styles.statsSection}>
          <StatsGrid stats={employeeStats} />
        </div>

        {/* Employee Table Section */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h2 className={styles.sectionTitle}>All Employees</h2>
            <div className={styles.tableActions}>
              <Button variant="ghost" leftIcon={<TrendingUp size={16} />}>
                Export
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading employees...</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <EmployeeTable employees={employees} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          size="lg"
        >
          <EmployeeForm
            employee={editingEmployee}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            isSaving={isSaving}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;
