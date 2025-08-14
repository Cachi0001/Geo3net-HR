import React, { useState, useEffect } from 'react';
import { taskService, Task } from '../../services/task.service';
import { timeTrackingService, TimeTrackingSummary } from '../../services/timeTracking.service';
import MyTasksWidget from './widgets/MyTasksWidget';
import TimeLogWidget from './widgets/TimeLogWidget';
import QuickLinksWidget from './widgets/QuickLinksWidget';

const EmployeeDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeSummary, setTimeSummary] = useState<TimeTrackingSummary | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [timeSummaryLoading, setTimeSummaryLoading] = useState(true);
  // We could also have error states here to show in the UI

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userTasks = await taskService.getMyTasks();
        setTasks(userTasks.filter(task => task.status !== 'completed')); // Only show non-completed tasks
      } catch (error) {
        console.error('Failed to load tasks for dashboard', error);
      } finally {
        setTasksLoading(false);
      }
    };

    const fetchTimeSummary = async () => {
      try {
        const summary = await timeTrackingService.getTimeTrackingSummary();
        setTimeSummary(summary);
      } catch (error) {
        console.error('Failed to load time summary for dashboard', error);
      } finally {
        setTimeSummaryLoading(false);
      }
    };

    fetchTasks();
    fetchTimeSummary();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-6">
        <MyTasksWidget tasks={tasks} isLoading={tasksLoading} />
      </div>

      {/* Sidebar area */}
      <div className="space-y-6">
        <TimeLogWidget summary={timeSummary} isLoading={timeSummaryLoading} />
        <QuickLinksWidget />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
