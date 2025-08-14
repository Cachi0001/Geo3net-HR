import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TaskStatistics } from '../../../services/task.service';
import Card from '../../common/Card/Card';
import './TeamTasksWidget.css';

interface TeamTasksWidgetProps {
  stats: TaskStatistics | null;
  isLoading: boolean;
}

const TeamTasksWidget: React.FC<TeamTasksWidgetProps> = ({ stats, isLoading }) => {
  const chartData = stats ? [
    { name: 'Pending', count: stats.pending, fill: '#f59e0b' },
    { name: 'In Progress', count: stats.inProgress, fill: '#3b82f6' },
    { name: 'Completed', count: stats.completed, fill: '#22c55e' },
    { name: 'Overdue', count: stats.overdue, fill: '#ef4444' },
  ] : [];

  return (
    <Card title="Team Task Overview">
      {isLoading ? (
        <p>Loading task statistics...</p>
      ) : stats ? (
        <div className="team-tasks-widget__chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
              <Bar dataKey="count" name="Tasks" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>No task data available for your team.</p>
      )}
    </Card>
  );
};

export default TeamTasksWidget;
