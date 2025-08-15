import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../common/Card/Card';
import './AdminActionsWidget.css';

const AdminActionsWidget: React.FC = () => {
  const links = [
    { name: 'Manage All Employees', path: '/employees' },
    { name: 'Manage All Tasks', path: '/tasks' },
    // Removed links to unimplemented pages like /settings and /reports
  ];

  return (
    <Card header={<h3>Admin Actions</h3>}>
      <ul className="admin-actions-widget__list">
        {links.map(link => (
          <li key={link.path}>
            <Link to={link.path} className="admin-actions-widget__link">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default AdminActionsWidget;
