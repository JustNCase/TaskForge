"use client";

import { useState, useEffect } from 'react';
import { Task, TaskStatus, PriorityLevel } from '@taskforge/ai-core';
import { DashboardCard, TaskList, PriorityScore } from '@taskforge/ui';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priorityScore, setPriorityScore] = useState(0);

  const calculatePriorityScore = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;

    const highPriorityTasks = tasks.filter(t => t.priority === PriorityLevel.HIGH).length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const avgTimeSaved = tasks.reduce((sum, t) => sum + t.timeSaved, 0) / tasks.length;

    const score = Math.round(
      ((highPriorityTasks / tasks.length) * 40) +
      ((completedTasks / tasks.length) * 30) +
      (Math.min(avgTimeSaved, 60) / 60) * 30
    );

    return Math.min(score, 100);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
      
      const score = calculatePriorityScore(data);
      setPriorityScore(score);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completedToday = tasks.filter(
    task => task.status === TaskStatus.COMPLETED && 
    new Date(task.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  const totalTimeSaved = tasks.reduce((sum, task) => sum + task.timeSaved, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={() => window.location.href = '/tasks/new'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Tasks"
          value={tasks.length}
          icon="📋"
          color="blue"
        />
        <DashboardCard
          title="AI Priority Score"
          value={priorityScore}
          icon="🧠"
          color="purple"
          suffix="%"
        />
        <DashboardCard
          title="Completed Today"
          value={completedToday}
          icon="✅"
          color="green"
        />
        <DashboardCard
          title="Time Saved"
          value={totalTimeSaved}
          icon="⏱️"
          color="orange"
          suffix="min"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Priority Distribution</h2>
          <PriorityScore tasks={tasks} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
          <TaskList tasks={tasks} limit={5} />
        </div>
      </div>
    </div>
  );
}
