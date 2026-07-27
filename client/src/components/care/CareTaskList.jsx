import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal, Input, Select, TextArea } from '..';
import careService from '../../services/care.service';

const CareTaskList = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carePlan, setCarePlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const loadCarePlanAndTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const planData = await careService.getCarePlan(elderId);

      if (planData && planData.id) {
        setCarePlan(planData);
        const tasksData = await careService.getCareTasks(planData.id);
        setTasks(tasksData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load care tasks');
    } finally {
      setLoading(false);
    }
  }, [elderId]);

  useEffect(() => {
    loadCarePlanAndTasks();
  }, [loadCarePlanAndTasks]);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await careService.updateCareTask(taskId, { status: newStatus });
      await loadCarePlanAndTasks();
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await careService.deleteCareTask(taskId);
      await loadCarePlanAndTasks();
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== targetStatus) {
      updateTaskStatus(draggedTask.id, targetStatus);
    }
    setDraggedTask(null);
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      LOW: { variant: 'default', text: 'Low' },
      MEDIUM: { variant: 'info', text: 'Medium' },
      HIGH: { variant: 'warning', text: 'High' },
      URGENT: { variant: 'danger', text: 'Urgent' },
    };
    return variants[priority] || { variant: 'default', text: priority };
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'default', text: 'Pending', icon: Clock },
      IN_PROGRESS: { variant: 'info', text: 'In Progress', icon: AlertCircle },
      COMPLETED: { variant: 'success', text: 'Completed', icon: CheckCircle },
      CANCELLED: { variant: 'danger', text: 'Cancelled', icon: AlertCircle },
    };
    return variants[status] || { variant: 'default', text: status, icon: Clock };
  };

  const groupTasksByStatus = () => {
    const grouped = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  };

  const tasksByStatus = groupTasksByStatus();

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading care tasks..." />;
  }

  if (!carePlan) {
    return (
      <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Care Plan Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create a care plan to start managing care tasks
          </p>
          <Button variant="primary" icon={Plus}>
            Create Care Plan
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Care Plan Header */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{carePlan.title}</h2>
            <p className="text-gray-400 text-sm">{carePlan.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-500">
                Start: {new Date(carePlan.startDate).toLocaleDateString()}
              </span>
              {carePlan.endDate && (
                <span className="text-gray-500">
                  End: {new Date(carePlan.endDate).toLocaleDateString()}
                </span>
              )}
              <Badge variant={carePlan.isActive ? 'success' : 'default'}>
                {carePlan.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingTask(null);
              setShowCreateModal(true);
            }}
          >
            Add Task
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-white">{tasks.length}</p>
        </Card>
        <Card padding="sm" className="bg-gray-500/20 border-gray-500/50">
          <p className="text-gray-200 text-sm">Pending</p>
          <p className="text-2xl font-bold text-white">{tasksByStatus.PENDING.length}</p>
        </Card>
        <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
          <p className="text-blue-200 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-white">{tasksByStatus.IN_PROGRESS.length}</p>
        </Card>
        <Card padding="sm" className="bg-green-500/20 border-green-500/50">
          <p className="text-green-200 text-sm">Completed</p>
          <p className="text-2xl font-bold text-white">{tasksByStatus.COMPLETED.length}</p>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
          const statusBadge = getStatusBadge(status);
          const StatusIcon = statusBadge.icon;

          return (
            <Card
              key={status}
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">{statusBadge.text}</h3>
                <Badge variant="default" className="ml-auto">
                  {tasksByStatus[status].length}
                </Badge>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {tasksByStatus[status].length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">
                    No {statusBadge.text.toLowerCase()} tasks
                  </p>
                ) : (
                  tasksByStatus[status].map((task) => {
                    const priorityBadge = getPriorityBadge(task.priority);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-move transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium flex-1">{task.title}</h4>
                          <Badge variant={priorityBadge.variant} className="text-xs">
                            {priorityBadge.text}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit}
                              onClick={() => {
                                setEditingTask(task);
                                setShowCreateModal(true);
                              }}
                              className="p-1 h-auto bg-white/5 text-white hover:bg-white/10"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => deleteTask(task.id)}
                              className="p-1 h-auto bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            />
                          </div>
                        </div>

                        {task.assignedTo && (
                          <p className="text-gray-500 text-xs mt-2">
                            Assigned to: {task.assignedTo}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Drag & Drop Instructions */}
      <Card padding="sm" className="bg-blue-500/10 border-blue-500/30">
        <p className="text-blue-200 text-sm">
          💡 <strong>Tip:</strong> Drag and drop tasks between columns to change their status
        </p>
      </Card>

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g., Medication review"
            defaultValue={editingTask?.title}
          />

          <TextArea
            label="Description"
            placeholder="Task details and instructions..."
            rows={3}
            defaultValue={editingTask?.description}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              defaultValue={editingTask?.priority || 'MEDIUM'}
            />

            <Select
              label="Status"
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              defaultValue={editingTask?.status || 'PENDING'}
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            defaultValue={
              editingTask?.dueDate
                ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                : ''
            }
          />

          <Input
            label="Assigned To"
            placeholder="e.g., Nurse Smith"
            defaultValue={editingTask?.assignedTo}
          />

          <TextArea
            label="Notes"
            placeholder="Additional notes..."
            rows={2}
            defaultValue={editingTask?.notes}
          />
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreateModal(false);
              setEditingTask(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary">
            {editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CareTaskList;
