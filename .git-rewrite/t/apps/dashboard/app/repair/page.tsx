"use client";

import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@taskforge/ai-core';
import { TaskList } from '@taskforge/ui';

export default function RepairPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRepairTasks = async () => {
    try {
      const response = await fetch('/api/tasks?category=repair');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch repair tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairTasks();
  }, []);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        fetchRepairTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  // const pendingTasks = tasks.filter(task => task.status === TaskStatus.PENDING); // Not used but kept for potential future use

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Repair Tasks</h1>
        <button
          onClick={() => window.location.href = '/tasks/new?category=repair'}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          New Repair Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Repair Task List</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <TaskList 
            tasks={tasks} 
            onTaskUpdate={handleTaskUpdate}
            showActions={true}
          />
        )}
      </div>
    </div>
  );
}
