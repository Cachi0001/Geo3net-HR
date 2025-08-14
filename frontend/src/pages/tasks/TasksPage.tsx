import React, { useState, useEffect, useCallback } from 'react';
import { TaskList, TaskForm, TaskDetail, TaskAssignment, TaskNotification } from '../../components/tasks';
import { Modal, Button } from '../../components/common';
import { taskService, Task } from '../../services/task.service';
import { employeeService, Employee } from '../../services/employee.service';
import { useToast } from '../../hooks/useToast';
import './TasksPage.css';

const TasksPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reloadTasks, setReloadTasks] = useState(false); // State to trigger reload
  const { showToast } = useToast();

  const loadEmployees = useCallback(async () => {
    try {
      const { employees: fetchedEmployees } = await employeeService.getEmployees(1000); // Fetch all for dropdown
      setEmployees(fetchedEmployees);
    } catch (error) {
      showToast('error', 'Failed to load employees for task assignment.');
    }
  }, [showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskCreate = () => {
    setEditingTask(null);
    setShowCreateForm(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowCreateForm(true);
  };

  const handleTaskSave = async (data: Partial<Task>) => {
    setIsSaving(true);
    try {
      if (data.id) {
        await taskService.updateTask(data.id, data);
        showToast('success', 'Task updated successfully.');
      } else {
        await taskService.createTask(data as Task);
        showToast('success', 'Task created successfully.');
      }
      setShowCreateForm(false);
      setEditingTask(null);
      setReloadTasks(prev => !prev); // Trigger a reload in TaskList
    } catch (error) {
      showToast('error', 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
    setReloadTasks(prev => !prev);
  };

  const handleTaskDelete = () => {
    setSelectedTask(null); // Close detail view
    setReloadTasks(prev => !prev);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
  };

  return (
    <div className="tasks-page">
      <div className="tasks-page-header">
        <div className="page-title">
          <h1>Task Management</h1>
          <p>Organize, assign, and track tasks across your team</p>
        </div>
      </div>

      <div className="tasks-page-content">
        <div className="tasks-main-section">
          <TaskList
            key={reloadTasks ? 'reload' : 'initial'} // Force re-render and re-fetch
            onTaskSelect={handleTaskSelect}
            onTaskCreate={handleTaskCreate}
            selectedTaskId={selectedTask?.id}
          />
        </div>

        <div className="tasks-sidebar">
          {selectedTask ? (
            <TaskDetail
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onEdit={handleTaskEdit}
              onDelete={handleTaskDelete}
              onClose={handleCloseDetail}
            />
          ) : (
            <div className="task-detail-placeholder">
              <p>Select a task to see details</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateForm}
        onClose={handleCloseForm}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          employees={employees}
          onSave={handleTaskSave}
          onCancel={handleCloseForm}
          isSaving={isSaving}
        />
      </Modal>
    </div>
  );
};

export default TasksPage;
