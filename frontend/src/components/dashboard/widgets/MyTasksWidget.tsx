import React from 'react';
import { Task } from '../../../services/task.service';
import Card from '../../common/Card/Card';
import './MyTasksWidget.css';

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
        <ul className="tasks-widget__list">
          {tasks.slice(0, 5).map(task => ( // Show top 5 tasks
            <li key={task.id} className="tasks-widget__item">
              <span className="tasks-widget__title">{task.title}</span> - <span className="tasks-widget__status">{task.status}</span>
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
