"use client";

import { useState } from 'react';
import { Task, TaskStatus, PriorityLevel } from '@taskforge/ai-core';

interface TaskListProps {
  tasks: Task[];
  limit?: number;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  showActions?: boolean;
}

export function TaskList({
  tasks,
  limit,
  onTaskUpdate,
  onDeleteTask,
  showActions = false
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());

  const displayTasks = limit ? tasks.slice(0, limit) : tasks;

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!onTaskUpdate) return;

    setUpdatingTasks(prev => new Set(prev).add(taskId));

    try {
      await onTaskUpdate(taskId, { status: newStatus });
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: PriorityLevel) => {
    if (!onTaskUpdate) return;

    setUpdatingTasks(prev => new Set(prev).add(taskId));

    try {
      await onTaskUpdate(taskId, { priority: newPriority });
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!onDeleteTask) return;

    setDeletingTasks(prev => new Set(prev).add(taskId));

    try {
      await onDeleteTask(taskId);
    } finally {
      setDeletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      [TaskStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    const colors = {
      [PriorityLevel.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      [PriorityLevel.MEDIUM]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [PriorityLevel.HIGH]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date) > new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) ? 'numeric' : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {displayTasks.map((task) => (
        <div
          key={task.id}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{task.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>⏱️ {task.timeSaved} min saved</span>
                <span>🏷️ {task.category}</span>
                <span>📅 {formatDate(task.dueDate)}</span>
              </div>

              {expandedTasks.has(task.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      {showActions && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          disabled={updatingTasks.has(task.id)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        >
                          {Object.values(TaskStatus).map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      {showActions && (
                        <select
                          value={task.priority}
                          onChange={(e) => handlePriorityChange(task.id, e.target.value as PriorityLevel)}
                          disabled={updatingTasks.has(task.id)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        >
                          {Object.values(PriorityLevel).map(priority => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => toggleExpanded(task.id)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {expandedTasks.has(task.id) ? '−' : '+'}
              </button>

              {showActions && (
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingTasks.has(task.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50"
                >
                  {deletingTasks.has(task.id) ? '⏳' : '🗑️'}
                </button>
              )}

              {updatingTasks.has(task.id) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>
      ))}

      {displayTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
        </div>
      )}
    </div>
  );
}
