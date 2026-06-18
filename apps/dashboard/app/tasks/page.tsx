"use client";

import { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, PriorityLevel, ScoringParameters, Subtask, generateSubtasks, getTemplateForCategory } from '@taskforge/ai-core';
import { TaskList } from '@taskforge/ui';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBreakdownForm, setShowBreakdownForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'general',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  const [scoring, setScoring] = useState<ScoringParameters>({
    urgency: 5,
    impact: 5,
    effort: 5,
  });

  // Calculate default due date after initial render to avoid Date.now() in render
  const [defaultDueDate, setDefaultDueDate] = useState<Date | null>(null);
  
  useEffect(() => {
    setDefaultDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const calculatePriorityScore = (scoring: ScoringParameters): number => {
    const { urgency, impact, effort } = scoring;
    return (urgency * 0.4) + (impact * 0.5) - (effort * 0.1);
  };

  const determinePriorityLevel = (score: number): PriorityLevel => {
    if (score >= 7) return PriorityLevel.HIGH;
    if (score >= 4) return PriorityLevel.MEDIUM;
    return PriorityLevel.LOW;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title?.trim()) return;
    
    const priorityScore = calculatePriorityScore(scoring);
    const priority = determinePriorityLevel(priorityScore);
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          priority,
          scoring,
        }),
      });
      
      if (response.ok) {
        await fetchTasks();
        setShowCreateForm(false);
        setNewTask({
          title: '',
          description: '',
          category: 'general',
          dueDate: defaultDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        setScoring({ urgency: 5, impact: 5, effort: 5 });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleBreakDownTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title?.trim()) return;
    
    const priorityScore = calculatePriorityScore(scoring);
    const priority = determinePriorityLevel(priorityScore);
    
    try {
      // Generate subtasks using mock AI
      const template = getTemplateForCategory(newTask.category || 'general');
      const subtasks = generateSubtasks(newTask, template);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          priority,
          scoring,
          subtasks,
        }),
      });
      
      if (response.ok) {
        await fetchTasks();
        setShowBreakdownForm(false);
        setNewTask({
          title: '',
          description: '',
          category: 'general',
          dueDate: defaultDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        setScoring({ urgency: 5, impact: 5, effort: 5 });
      }
    } catch (error) {
      console.error('Failed to break down task:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  const totalTimeSaved = tasks.reduce((sum, task) => sum + (task.timeSaved || 0), 0);
  const highPriorityTasks = tasks.filter(task => task.priority === PriorityLevel.HIGH);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TaskForge AI</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Task'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urgency (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scoring.urgency}
                  onChange={(e) => setScoring({ ...scoring, urgency: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-center mt-1">{scoring.urgency}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Impact (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scoring.impact}
                  onChange={(e) => setScoring({ ...scoring, impact: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-center mt-1">{scoring.impact}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Effort (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scoring.effort}
                  onChange={(e) => setScoring({ ...scoring, effort: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-center mt-1">{scoring.effort}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="urgent">Urgent</option>
                <option value="important">Important</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Priority Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tasks.length > 0 ? Math.round(
                  ((highPriorityTasks.length / tasks.length) * 40) +
                  ((completedTasks.length / tasks.length) * 30) +
                  ((totalTimeSaved / (tasks.length * 60)) * 30)
                ) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTimeSaved}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">minutes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Task Management</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <TaskList 
            tasks={tasks} 
            onTaskUpdate={handleTaskUpdate}
            onDeleteTask={handleDeleteTask}
            showActions={true}
          />
        )}
      </div>
    </div>
  );
}
