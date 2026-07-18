"use client";

import { Task, PriorityLevel } from '@taskforge/ai-core';

interface PriorityScoreProps {
  tasks: Task[];
}

export function PriorityScore({ tasks }: PriorityScoreProps) {
  const priorityCounts = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<PriorityLevel, number>);

  const totalTasks = tasks.length;
  const highPriorityPercentage = totalTasks > 0 ? (priorityCounts[PriorityLevel.HIGH] || 0) / totalTasks * 100 : 0;
  const mediumPriorityPercentage = totalTasks > 0 ? (priorityCounts[PriorityLevel.MEDIUM] || 0) / totalTasks * 100 : 0;
  const lowPriorityPercentage = totalTasks > 0 ? (priorityCounts[PriorityLevel.LOW] || 0) / totalTasks * 100 : 0;

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative inline-block">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${highPriorityPercentage + mediumPriorityPercentage + lowPriorityPercentage} 100`}
              className="text-blue-500"
              strokeDashoffset="25"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(highPriorityPercentage + mediumPriorityPercentage + lowPriorityPercentage / 3)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Priority Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Priority Distribution</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${highPriorityPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                {Math.round(highPriorityPercentage)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mediumPriorityPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                {Math.round(mediumPriorityPercentage)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${lowPriorityPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                {Math.round(lowPriorityPercentage)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Overall Assessment</span>
            <span className={`text-sm font-bold ${highPriorityPercentage >= 60 ? 'text-green-600 dark:text-green-400' : highPriorityPercentage >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {getScoreLabel(Math.round(highPriorityPercentage + mediumPriorityPercentage + lowPriorityPercentage / 3))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
