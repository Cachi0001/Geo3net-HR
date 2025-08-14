import React from 'react';
import { Task } from '../../../services/task.service';
import Card from '../../common/Card/Card';

interface MyTasksWidgetProps {
  tasks: Task[];
  isLoading: boolean;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ tasks, isLoading }) => {
  return (
    <Card title="My Pending Tasks">
      {isLoading ? (
        <p>Loading tasks...</p>
      ) : tasks.length > 0 ? (
        <ul>
          {tasks.slice(0, 5).map(task => ( // Show top 5 tasks
            <li key={task.id} className="border-b last:border-b-0 py-2">
              <span className="font-semibold">{task.title}</span> - <span className="text-sm text-gray-500">{task.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending tasks. Great job!</p>
      )}
    </Card>
  );
};

export default MyTasksWidget;
