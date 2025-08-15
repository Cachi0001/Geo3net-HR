import React from 'react';
import { TimeTrackingSummary } from '../../../services/timeTracking.service';
import Card from '../../common/Card/Card';
import './TimeLogWidget.css';

interface TimeLogWidgetProps {
  summary: TimeTrackingSummary | null;
  isLoading: boolean;
}

const TimeLogWidget: React.FC<TimeLogWidgetProps> = ({ summary, isLoading }) => {
  return (
    <Card header={<h3>My Time Log Summary</h3>}>
      {isLoading ? (
        <p>Loading summary...</p>
      ) : summary ? (
        <div className="time-log-widget__grid">
          <div>
            <p className="time-log-widget__value">{summary.today.toFixed(1)}</p>
            <p className="time-log-widget__label">Today</p>
          </div>
          <div>
            <p className="time-log-widget__value">{summary.thisWeek.toFixed(1)}</p>
            <p className="time-log-widget__label">This Week</p>
          </div>
          <div>
            <p className="time-log-widget__value">{summary.thisMonth.toFixed(1)}</p>
            <p className="time-log-widget__label">This Month</p>
          </div>
        </div>
      ) : (
        <p>No time tracking data available.</p>
      )}
    </Card>
  );
};

export default TimeLogWidget;
