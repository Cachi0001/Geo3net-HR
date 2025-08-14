import React from 'react';
import { Employee } from '../../services/employee.service';
import { Button } from '../common';
import './EmployeeTable.css';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onEdit, onDelete }) => {
  return (
    <div className="employee-table-container">
      <table className="employee-table">
        <thead className="employee-table__header">
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="employee-table__body">
          {employees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.fullName}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.position}</td>
              <td className="employee-table__actions">
                <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(employee)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
