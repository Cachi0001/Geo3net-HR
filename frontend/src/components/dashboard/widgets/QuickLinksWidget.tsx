import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../common/Card/Card';
import './QuickLinksWidget.css';

const QuickLinksWidget: React.FC = () => {
  const links = [
    { name: 'My Profile', path: '/profile' },
    { name: 'View All My Tasks', path: '/tasks' },
    { name: 'Time & Attendance', path: '/time-tracking' },
  ];

  return (
    <Card title="Quick Links">
      <ul className="quick-links-widget__list">
        {links.map(link => (
          <li key={link.path}>
            <Link to={link.path} className="quick-links-widget__link">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default QuickLinksWidget;
