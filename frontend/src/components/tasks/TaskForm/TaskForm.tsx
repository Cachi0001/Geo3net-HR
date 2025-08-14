import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Select, LoadingSpinner } from '../../common';
import { useForm } from '../../../hooks/useForm';
import { Task } from '../../../services/task.service';
import { Employee } from '../../../services/employee.service';
import './TaskForm.css';

interface TaskFormProps {
  task?: Task | null;
  employees: Employee[];
  onSave: (data: Partial<Task>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, employees, onSave, onCancel, isSaving }) => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      assignedTo: task?.assignedTo || '',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    },
    validationRules: {
      title: { required: true },
      description: { required: true },
      assignedTo: { required: true },
    },
    onSubmit: (formValues) => {
      onSave({ ...task, ...formValues });
    },
  });

  useEffect(() => {
    reset();
  }, [task, reset]);

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.fullName} (${emp.email})`,
  }));

  return (
    <Card className="task-form" padding="lg">
      <form onSubmit={handleSubmit} className="task-form-content">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <Input id="title" name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={touched.title && errors.title} />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            className={`form-textarea ${touched.description && errors.description ? 'error' : ''}`}
          />
          {touched.description && errors.description && <span className="error-message">{errors.description}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignedTo">Assign To *</label>
            <Select
              id="assignedTo"
              name="assignedTo"
              value={values.assignedTo}
              onChange={handleChange}
              onBlur={handleBlur}
              options={[{ value: '', label: 'Select an employee...' }, ...employeeOptions]}
              error={touched.assignedTo && errors.assignedTo}
            />
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <Select id="priority" name="priority" value={values.priority} onChange={handleChange} options={priorityOptions} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <Input id="dueDate" name="dueDate" type="date" value={values.dueDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving}>
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TaskForm;
