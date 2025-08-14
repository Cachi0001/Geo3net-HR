import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, LoadingSpinner, Select, Input } from '../../common';
import { taskService, Task, TaskSearchFilters } from '../../../services/task.service';
import { useToast } from '../../../hooks/useToast';
import TaskItem from '../TaskItem/TaskItem';
import './TaskList.css';

interface TaskListProps {
  onTaskSelect?: (task: Task) => void;
  onTaskCreate?: () => void;
  selectedTaskId?: string;
}

const TaskList: React.FC<TaskListProps> = ({ onTaskSelect, onTaskCreate, selectedTaskId }) => {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<TaskSearchFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'dueDate',
    sortOrder: 'asc',
    limit: 20,
    offset: 0,
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters: TaskSearchFilters = { ...filters };
      if (apiFilters.status === 'all') delete apiFilters.status;
      if (apiFilters.priority === 'all') delete apiFilters.priority;

      const { tasks: fetchedTasks, total } = await taskService.searchTasks(apiFilters);
      setTasks(fetchedTasks);
      setTotalTasks(total);
    } catch (error: any) {
      showToast( 'error',  error.message || 'Failed to load tasks' );
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 500); // Debounce search input
    return () => clearTimeout(timer);
  }, [loadTasks]);

  const handleFilterChange = (key: keyof TaskSearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setTotalTasks(prev => prev - 1);
  };

  const statusOptions = [ { value: 'all', label: 'All Status' }, { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' } ];
  const priorityOptions = [ { value: 'all', label: 'All Priorities' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' } ];
  const sortOptions = [ { value: 'dueDate', label: 'Due Date' }, { value: 'priority', label: 'Priority' }, { value: 'title', label: 'Title' } ];

  if (loading && tasks.length === 0) {
    return (
      <div className="task-list-loading">
        <LoadingSpinner size="lg" />
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <div className="task-list-title">
          <h2>Tasks</h2>
          <span className="task-count">({totalTasks})</span>
        </div>
        {onTaskCreate && (
          <Button variant="primary" onClick={onTaskCreate} className="create-task-btn">
            + New Task
          </Button>
        )}
      </div>

      <Card className="task-filters" padding="md">
        <div className="filter-row">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={statusOptions}
            className="filter-select"
          />
          <Select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            options={priorityOptions}
            className="filter-select"
          />
        </div>
        <div className="sort-row">
          <label>Sort by:</label>
          <Select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            options={sortOptions}
            className="sort-select"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </Card>

      <div className="task-items">
        {loading && <p className="task-list-refreshing">Refreshing...</p>}
        {!loading && tasks.length === 0 ? (
          <Card className="empty-state" padding="lg">
            <h3>No tasks found</h3>
            <p>Try adjusting your filters or create a new task.</p>
            {onTaskCreate && <Button variant="primary" onClick={onTaskCreate}>Create Task</Button>}
          </Card>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onClick={() => onTaskSelect?.(task)}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
export type { Task } from '../../../services/task.service';
