import React, { useState } from 'react'
import { TaskList, TaskForm, TaskDetail, Task } from '../../components/tasks'
import { Modal } from '../../components/common'
import './TasksPage.css'

const TasksPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTaskDetail, setShowTaskDetail] = useState(false)

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

        {showTaskDetail && selectedTask && (
          <div className="tasks-detail-section">
            <TaskDetail
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onEdit={handleTaskEdit}
              onClose={handleCloseDetail}
            />
          </div>
        )}
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
    </div>
  )
}

export default TasksPage