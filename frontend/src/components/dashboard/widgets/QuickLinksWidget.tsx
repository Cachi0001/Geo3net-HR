import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../common/Card/Card';

const QuickLinksWidget: React.FC = () => {
  const links = [
    { name: 'My Profile', path: '/profile' },
    { name: 'View All My Tasks', path: '/tasks' },
    { name: 'Request Time Off', path: '/time-off' },
    { name: 'View My Payslips', path: '/payslips' },
  ];

  return (
    <Card title="Quick Links">
      <ul className="space-y-2">
        {links.map(link => (
          <li key={link.path}>
            <Link to={link.path} className="text-blue-600 hover:underline hover:text-blue-800">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default QuickLinksWidget;
