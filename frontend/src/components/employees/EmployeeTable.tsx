import React from 'react';
import { Employee } from '../../services/employee.service';
import { Button } from '../common';
import { Table, TableColumn } from '../ui/Table/Table';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  loading?: boolean;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onEdit, onDelete, loading = false }) => {
  const columns: TableColumn<Employee>[] = [
    {
      key: 'fullName',
      title: 'Full Name',
      dataIndex: 'fullName',
      sortable: true,
      render: (value, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {value?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: '500', color: 'hsl(var(--foreground))' }}>{value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
              {record.position}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      sortable: true,
      render: (value) => (
        <a 
          href={`mailto:${value}`} 
          style={{ 
            color: 'hsl(var(--go3net-blue))', 
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {value}
        </a>
      )
    },
    {
      key: 'department',
      title: 'Department',
      dataIndex: 'department',
      sortable: true,
      render: (value) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'hsl(var(--go3net-blue) / 0.1)',
          color: 'hsl(var(--go3net-blue))'
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, record) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: record.isActive 
            ? 'hsl(var(--go3net-green) / 0.1)' 
            : 'hsl(var(--muted) / 0.5)',
          color: record.isActive 
            ? 'hsl(var(--go3net-green))' 
            : 'hsl(var(--muted-foreground))'
        }}>
          {record.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(record)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Table<Employee>
      columns={columns}
      data={employees}
      loading={loading}
      rowKey="id"
      size="middle"
      emptyText="No employees found"
      onRow={(record) => ({
        onClick: () => {
          // Optional: Handle row click
        }
      })}
    />
  );
};

export default EmployeeTable;
