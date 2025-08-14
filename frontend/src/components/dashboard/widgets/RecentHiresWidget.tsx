import React from 'react';
import { Employee } from '../../../services/employee.service';
import Card from '../../common/Card/Card';
import './RecentHiresWidget.css';

interface RecentHiresWidgetProps {
  hires: Employee[];
  isLoading: boolean;
}

const RecentHiresWidget: React.FC<RecentHiresWidgetProps> = ({ hires, isLoading }) => {
  return (
    <Card title="Recent Hires">
      {isLoading ? (
        <p>Loading recent hires...</p>
      ) : hires.length > 0 ? (
        <ul className="recent-hires-widget__list">
          {hires.map(hire => (
            <li key={hire.id} className="recent-hires-widget__item">
              <div className="recent-hires-widget__info">
                <span className="recent-hires-widget__name">{hire.fullName}</span>
                <span className="recent-hires-widget__position">{hire.position}</span>
              </div>
              <span className="recent-hires-widget__date">
                {new Date(hire.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No new hires found recently.</p>
      )}
    </Card>
  );
};

export default RecentHiresWidget;
