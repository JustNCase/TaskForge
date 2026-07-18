"use client";

import { useState, useEffect } from 'react';
import { Task, TaskStatus, PriorityLevel } from '@taskforge/ai-core';
import { TaskList } from '@taskforge/ui';

export default function IncomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncomeTasks = async () => {
    try {
      const response = await fetch('/api/tasks?category=income');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch income tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeTasks();
  }, []);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        fetchIncomeTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  const totalTimeSaved = tasks.reduce((sum, task) => sum + task.timeSaved, 0);
  const totalPriorityScore = tasks.reduce((sum, task) => sum + (task.priority === PriorityLevel.HIGH ? 100 : task.priority === PriorityLevel.MEDIUM ? 50 : 25), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Income Tasks</h1>
        <button
          onClick={() => window.location.href = '/tasks/new?category=income'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          New Income Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTimeSaved}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPriorityScore}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Income Task List</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
