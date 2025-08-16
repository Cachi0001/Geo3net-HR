import React, { useEffect, useMemo } from 'react';
import { useForm } from '../../hooks/useForm';
import { Button, Input } from '../common';
import { CreateEmployeeData, Employee } from '../../services/employee.service';
import './EmployeeForm.css';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (data: CreateEmployeeData | Employee) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onCancel, isSaving }) => {
  const initialValues = useMemo(() => ({
    fullName: employee?.fullName || '',
    email: employee?.email || '',
    position: (employee as any)?.position || '',
    department: (employee as any)?.department || '',
  }), [
    employee?.fullName,
    employee?.email,
    (employee as any)?.position,
    (employee as any)?.department
  ])

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: initialValues,
    validationRules: {
      fullName: { required: true },
      email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
      position: { required: true },
      department: { required: true },
    },
    onSubmit: (formValues) => {
      if (employee) {
        onSave({ ...employee, ...formValues });
      } else {
        onSave({
          ...formValues,
          status: 'active' as const,
          isActive: true
        });
      }
    },
  });

  useEffect(() => {
    reset();
  }, [employee]);

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      <div className="employee-form__grid">
        <div className="employee-form__group">
          <label htmlFor="fullName">Full Name</label>
          <Input name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} />
          {touched.fullName && errors.fullName && <p className="employee-form__error">{errors.fullName}</p>}
        </div>
        <div className="employee-form__group">
          <label htmlFor="email">Email</label>
          <Input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
          {touched.email && errors.email && <p className="employee-form__error">{errors.email}</p>}
        </div>
        <div className="employee-form__group">
          <label htmlFor="department">Department</label>
          <Input name="department" value={values.department} onChange={handleChange} onBlur={handleBlur} />
          {touched.department && errors.department && <p className="employee-form__error">{errors.department}</p>}
        </div>
        <div className="employee-form__group">
          <label htmlFor="position">Position</label>
          <Input name="position" value={values.position} onChange={handleChange} onBlur={handleBlur} />
          {touched.position && errors.position && <p className="employee-form__error">{errors.position}</p>}
        </div>
      </div>
      <div className="employee-form__actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
