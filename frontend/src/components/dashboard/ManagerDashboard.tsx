import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { taskService, TaskStatistics } from '../../services/task.service';
import { timeTrackingService, TeamAttendanceStatistics } from '../../services/timeTracking.service';
import TeamTasksWidget from './widgets/TeamTasksWidget';
import TeamAttendanceWidget from './widgets/TeamAttendanceWidget';
import PendingApprovalsWidget from './widgets/PendingApprovalsWidget';
import './ManagerDashboard.css';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<TeamAttendanceStatistics | null>(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(true);
  const [attendanceStatsLoading, setAttendanceStatsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!user?.departmentId) return;
      try {
        const stats = await taskService.getTaskStatistics(user.departmentId);
        setTaskStats(stats);
      } catch (error) {
        console.error('Failed to load task statistics for manager dashboard', error);
      } finally {
        setTaskStatsLoading(false);
      }
    };

    const fetchAttendanceStats = async () => {
      try {
        const stats = await timeTrackingService.getTeamAttendanceStatistics();
        setAttendanceStats(stats);
      } catch (error) {
        console.error('Failed to load team attendance statistics for manager dashboard', error);
      } finally {
        setAttendanceStatsLoading(false);
      }
    };

    fetchTaskStats();
    fetchAttendanceStats();
  }, [user]);

  return (
    <div className="manager-dashboard">
      {/* Main content area */}
      <div className="manager-dashboard__main">
        <TeamTasksWidget stats={taskStats} isLoading={taskStatsLoading} />
      </div>

      {/* Sidebar area */}
      <div className="manager-dashboard__sidebar">
        <TeamAttendanceWidget stats={attendanceStats} isLoading={attendanceStatsLoading} />
        <PendingApprovalsWidget isLoading={false} />
      </div>
    </div>
  );
};

export default ManagerDashboard;
