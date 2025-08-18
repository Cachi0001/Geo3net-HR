import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/dashboard" style={{ color: 'var(--primary)' }}>Go back to dashboard</Link>
    </div>
  );
};

export default UnauthorizedPage;
