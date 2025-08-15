import React, { useState, useEffect, useCallback } from 'react';
import { employeeService, Employee, CreateEmployeeData } from '../../services/employee.service';
import { Button, Modal } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import EmployeeTable from '../../components/employees/EmployeeTable';
import EmployeeForm from '../../components/employees/EmployeeForm';
import './EmployeesPage.css';

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const { employees: fetchedEmployees, total } = await employeeService.getEmployees();
      setEmployees(fetchedEmployees);
      setTotalEmployees(total);
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
    <div className="employees-page">
      <header className="employees-page__header">
        <h1 className="employees-page__title">Employee Management</h1>
        <Button variant="primary" onClick={handleCreate}>Add Employee</Button>
      </header>

      {isLoading ? (
        <p>Loading employees...</p>
      ) : (
        <EmployeeTable employees={employees} onEdit={handleEdit} onDelete={handleDelete} />
      )}

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
  );
};

export default EmployeesPage;
