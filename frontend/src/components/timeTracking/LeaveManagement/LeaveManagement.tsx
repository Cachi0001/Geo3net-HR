import React from 'react';
import { Card } from '../../common';
import './LeaveManagement.css';

const LeaveManagement: React.FC = () => {
  return (
    <div className="leave-management">
      <Card className="leave-management-placeholder" padding="lg">
        <div className="placeholder-icon">✈️</div>
        <h3>Leave & Time Off Management</h3>
        <p>This feature is currently under development.</p>
        <p>Soon, you'll be able to request time off, see your leave balances, and view your request history right here.</p>
      </Card>
    </div>
  );
};

export default LeaveManagement;
