import React from 'react';
import { TimeTrackingSummary } from '../../../services/timeTracking.service';
import Card from '../../common/Card/Card';

interface TimeLogWidgetProps {
  summary: TimeTrackingSummary | null;
  isLoading: boolean;
}

const TimeLogWidget: React.FC<TimeLogWidgetProps> = ({ summary, isLoading }) => {
  return (
    <Card title="My Time Log Summary">
      {isLoading ? (
        <p>Loading summary...</p>
      ) : summary ? (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{summary.today.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{summary.thisWeek.toFixed(1)}</p>
            <p className="text-sm text-gray-500">This Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{summary.thisMonth.toFixed(1)}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </div>
      ) : (
        <p>No time tracking data available.</p>
      )}
    </Card>
  );
};

export default TimeLogWidget;
