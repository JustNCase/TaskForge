"use client";

import { useState } from 'react';
import { TaskStatus, PriorityLevel, Subtask } from '@taskforge/ai-core';

interface SubtaskListProps {
  subtasks: Subtask[];
  onSubtaskUpdate?: (subtaskId: string, updates: Partial<Subtask>) => void;
  onSubtaskDelete?: (subtaskId: string) => void;
  showActions?: boolean;
}

export function SubtaskList({
  subtasks,
  onSubtaskUpdate,
  onSubtaskDelete,
  showActions = false
}: SubtaskListProps) {
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [updatingSubtasks, setUpdatingSubtasks] = useState<Set<string>>(new Set());
  const [deletingSubtasks, setDeletingSubtasks] = useState<Set<string>>(new Set());

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

  const handleStatusChange = async (subtaskId: string, newStatus: TaskStatus) => {
    if (!onSubtaskUpdate) return;

    setUpdatingSubtasks(prev => new Set(prev).add(subtaskId));

    try {
      await onSubtaskUpdate(subtaskId, { status: newStatus });
    } finally {
      setUpdatingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handlePriorityChange = async (subtaskId: string, newPriority: PriorityLevel) => {
    if (!onSubtaskUpdate) return;

    setUpdatingSubtasks(prev => new Set(prev).add(subtaskId));

    try {
      await onSubtaskUpdate(subtaskId, { priority: newPriority });
    } finally {
      setUpdatingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!onSubtaskDelete) return;

    setDeletingSubtasks(prev => new Set(prev).add(subtaskId));

    try {
      await onSubtaskDelete(subtaskId);
    } finally {
      setDeletingSubtasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (subtaskId: string) => {
    setExpandedSubtasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtaskId)) {
        newSet.delete(subtaskId);
      } else {
        newSet.add(subtaskId);
      }
      return newSet;
    });
  };

  const getCompletionPercentage = (subtasks: Subtask[]): number => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  return (
    <div className="space-y-4">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">📋 {subtask.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(subtask.priority)}`}>
                  {subtask.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subtask.status)}`}>
                  {subtask.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{subtask.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>⏱️ {subtask.timeSaved} min saved</span>
                <span>📅 {formatDate(subtask.dueDate)}</span>
              </div>

              {expandedSubtasks.has(subtask.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      {showActions && (
                        <select
                          value={subtask.status}
                          onChange={(e) => handleStatusChange(subtask.id, e.target.value as TaskStatus)}
                          disabled={updatingSubtasks.has(subtask.id)}
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
                          value={subtask.priority}
                          onChange={(e) => handlePriorityChange(subtask.id, e.target.value as PriorityLevel)}
                          disabled={updatingSubtasks.has(subtask.id)}
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
                onClick={() => toggleExpanded(subtask.id)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {expandedSubtasks.has(subtask.id) ? '−' : '+'}
              </button>

              {showActions && (
                <button
                  onClick={() => handleDelete(subtask.id)}
                  disabled={deletingSubtasks.has(subtask.id)}
                  className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50"
                >
                  {deletingSubtasks.has(subtask.id) ? '⏳' : '🗑️'}
                </button>
              )}

              {updatingSubtasks.has(subtask.id) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>
      ))}

      {subtasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 dark:text-gray-400">No subtasks found</p>
        </div>
      )}
    </div>
  );
}
