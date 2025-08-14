import React, { useState } from 'react'
import { TaskList, TaskForm, TaskDetail, TaskAssignment, TaskNotification, Task } from '../../components/tasks'
import { Modal } from '../../components/common'
import './TasksPage.css'

const TasksPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentTask, setAssignmentTask] = useState<Task | null>(null)
  const [notifications, setNotifications] = useState<any[]>([]) // In real app, this would come from API/WebSocket

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  const handleTaskCreate = () => {
    setEditingTask(null)
    setShowCreateForm(true)
  }

  const handleTaskEdit = () => {
    if (selectedTask) {
      setEditingTask(selectedTask)
      setShowTaskDetail(false)
      setShowCreateForm(true)
    }
  }

  const handleTaskSave = (task: Task) => {
    setShowCreateForm(false)
    setEditingTask(null)
    
    // If we were editing the currently selected task, update it
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(task)
    }
  }

  const handleTaskUpdate = (task: Task) => {
    // Update the selected task if it matches
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(task)
    }
  }

  const handleCloseDetail = () => {
    setShowTaskDetail(false)
    setSelectedTask(null)
  }

  const handleCloseForm = () => {
    setShowCreateForm(false)
    setEditingTask(null)
  }

  const handleTaskAssign = (task: Task) => {
    setAssignmentTask(task)
    setShowAssignmentModal(true)
  }

  const handleAssignmentComplete = (updatedTask: Task) => {
    setShowAssignmentModal(false)
    setAssignmentTask(null)
    
    // Update the selected task if it matches
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask)
    }
  }

  const handleCloseAssignment = () => {
    setShowAssignmentModal(false)
    setAssignmentTask(null)
  }

  const handleNotificationClick = (notification: any) => {
    // In real implementation, navigate to the task
    console.log('Notification clicked:', notification)
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

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
            onTaskSelect={handleTaskSelect}
            onTaskCreate={handleTaskCreate}
            selectedTaskId={selectedTask?.id}
          />
        </div>

        <div className="tasks-sidebar">
          {/* Notifications Panel */}
          <div className="notifications-panel">
            <TaskNotification
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAllNotifications}
              maxVisible={3}
            />
          </div>

          {/* Task Detail Panel */}
          {showTaskDetail && selectedTask && (
            <div className="task-detail-panel">
              <TaskDetail
                task={selectedTask}
                onUpdate={handleTaskUpdate}
                onEdit={handleTaskEdit}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={handleCloseForm}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onSave={handleTaskSave}
          onCancel={handleCloseForm}
        />
      </Modal>

      {/* Task Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={handleCloseAssignment}
        title="Assign Task"
        size="lg"
      >
        <TaskAssignment
          task={assignmentTask}
          mode="assign"
          onAssignmentComplete={handleAssignmentComplete}
          onCancel={handleCloseAssignment}
        />
      </Modal>
    </div>
  )
}

export default TasksPage