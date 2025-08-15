import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TeamAttendanceStatistics } from '../../../services/timeTracking.service';
import Card from '../../common/Card/Card';
import './TeamAttendanceWidget.css';

interface TeamAttendanceWidgetProps {
  stats: TeamAttendanceStatistics | null;
  isLoading: boolean;
}

const COLORS = {
  present: '#22c55e', // green
  absent: '#ef4444',  // red
  onLeave: '#f59e0b', // amber
  late: '#eab308',   // yellow
};

const TeamAttendanceWidget: React.FC<TeamAttendanceWidgetProps> = ({ stats, isLoading }) => {
  const chartData = stats ? [
    { name: 'Present', value: stats.present },
    { name: 'Absent', value: stats.absent },
    { name: 'On Leave', value: stats.onLeave },
    { name: 'Late', value: stats.late },
  ].filter(item => item.value > 0) : []; // Only show categories with data

  return (
    <Card header={<h3>Team Attendance Today</h3>}>
      {isLoading ? (
        <p>Loading attendance data...</p>
      ) : stats ? (
        <div className="team-attendance-widget__container">
          <div className="team-attendance-widget__chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => {
                    const colorKey = entry.name.toLowerCase().replace(' ', '') as keyof typeof COLORS;
                    return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || '#8884d8'} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p>No attendance data available for your team.</p>
      )}
    </Card>
  );
};

export default TeamAttendanceWidget;
