import { v4 as uuidv4 } from 'uuid';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ScoringParameters {
  urgency: number;
  impact: number;
  effort: number;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  timeSaved: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  category: string;
  dueDate: Date;
  timeSaved: number;
  createdAt: Date;
  updatedAt: Date;
  scoring?: ScoringParameters;
  subtasks?: Subtask[];
}

export class TaskEngine {
  private tasks: Task[] = [];

  public async getAllTasks(): Promise<Task[]> {
    return [...this.tasks];
  }

  public async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData,
    };

    this.tasks.push(task);
    return task;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.tasks[index];
  }

  public async deleteTask(id: string): Promise<boolean> {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    return true;
  }

  public async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasks.filter(task => task.status === status);
  }

  public async getTasksByCategory(category: string): Promise<Task[]> {
    return this.tasks.filter(task => task.category === category);
  }

  public calculatePriorityScore(scoring: ScoringParameters): number {
    const { urgency, impact, effort } = scoring;

    if (urgency < 1 || urgency > 10) {
      throw new Error('Urgency must be between 1 and 10');
    }
    if (impact < 1 || impact > 10) {
      throw new Error('Impact must be between 1 and 10');
    }
    if (effort < 1 || effort > 10) {
      throw new Error('Effort must be between 1 and 10');
    }

    const score = (urgency * 0.4) + (impact * 0.5) - (effort * 0.1);

    return Math.max(0, Math.min(score, 10));
  }

  public determinePriorityLevel(score: number): PriorityLevel {
    if (score >= 7) return PriorityLevel.HIGH;
    if (score >= 4) return PriorityLevel.MEDIUM;
    return PriorityLevel.LOW;
  }

  public async createTaskWithScoring(
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    scoring: ScoringParameters
  ): Promise<Task> {
    const priorityScore = this.calculatePriorityScore(scoring);
    const priority = this.determinePriorityLevel(priorityScore);

    const task: Task = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData,
      priority,
      scoring,
    };

    this.tasks.push(task);
    return task;
  }
}

export function determinePriorityLevel(score: number): PriorityLevel {
  if (score >= 7) return PriorityLevel.HIGH;
  if (score >= 4) return PriorityLevel.MEDIUM;
  return PriorityLevel.LOW;
}

export const unitTestExamples = {
  highPriorityTask: {
    task: {
      title: 'Fix critical security vulnerability',
      description: 'Immediate action required to prevent data breach',
      category: 'security',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    scoring: {
      urgency: 10,
      impact: 10,
      effort: 2,
    },
    expectedScore: 10 * 0.4 + 10 * 0.5 - 2 * 0.1,
    expectedPriority: PriorityLevel.HIGH,
  },

  lowPriorityTask: {
    task: {
      title: 'Update documentation',
      description: 'Minor documentation improvements',
      category: 'documentation',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    scoring: {
      urgency: 2,
      impact: 3,
      effort: 9,
    },
    expectedScore: 2 * 0.4 + 3 * 0.5 - 9 * 0.1,
    expectedPriority: PriorityLevel.LOW,
  },

  mediumPriorityTask: {
    task: {
      title: 'Refactor legacy code',
      description: 'Improve code maintainability',
      category: 'development',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    scoring: {
      urgency: 6,
      impact: 7,
      effort: 5,
    },
    expectedScore: 6 * 0.4 + 7 * 0.5 - 5 * 0.1,
    expectedPriority: PriorityLevel.MEDIUM,
  },

  minValuesTask: {
    task: {
      title: 'Simple task',
      description: 'Basic task with minimum scores',
      category: 'general',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    scoring: {
      urgency: 1,
      impact: 1,
      effort: 1,
    },
    expectedScore: 1 * 0.4 + 1 * 0.5 - 1 * 0.1,
    expectedPriority: PriorityLevel.LOW,
  },

  maxValuesTask: {
    task: {
      title: 'Critical emergency fix',
      description: 'Immediate emergency response required',
      category: 'emergency',
      dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
    },
    scoring: {
      urgency: 10,
      impact: 10,
      effort: 1,
    },
    expectedScore: 10 * 0.4 + 10 * 0.5 - 1 * 0.1,
    expectedPriority: PriorityLevel.HIGH,
  },
};

export const taskBreakTemplates = {
  development: [
    'Create project setup and configuration',
    'Implement core functionality',
    'Add unit tests for critical components',
    'Set up CI/CD pipeline',
    'Create documentation and README',
    'Implement error handling and logging',
    'Add user authentication system',
    'Create API endpoints',
    'Implement data validation',
    'Add performance optimizations',
  ],

  writing: [
    'Create outline and structure',
    'Research and gather sources',
    'Write introduction and background',
    'Draft main body sections',
    'Write conclusion and summary',
    'Edit for clarity and flow',
    'Add citations and references',
    'Proofread and correct grammar',
    'Format according to guidelines',
    'Create title page and abstract',
  ],

  projectManagement: [
    'Define project scope and objectives',
    'Create timeline and milestones',
    'Identify required resources',
    'Set up communication channels',
    'Create risk management plan',
    'Establish quality control measures',
    'Plan budget and financial tracking',
    'Define roles and responsibilities',
    'Create stakeholder engagement plan',
    'Set up progress reporting system',
  ],

  homeImprovement: [
    'Plan and measure the space',
    'Gather tools and materials',
    'Prepare the area and protect surfaces',
    'Remove existing fixtures or structures',
    'Install new fixtures or structures',
    'Connect utilities and systems',
    'Finish and clean the area',
    'Set up safety and security measures',
    'Create maintenance plan',
    'Document the project',
  ],

  research: [
    'Define research question and objectives',
    'Conduct literature review',
    'Develop research methodology',
    'Collect and analyze data',
    'Interpret findings and results',
    'Write research report',
    'Create presentation materials',
    'Peer review and validation',
    'Disseminate findings',
    'Plan follow-up research',
  ],

  marketing: [
    'Define target audience and market',
    'Conduct market analysis',
    'Develop marketing strategy',
    'Create content and materials',
    'Set up social media presence',
    'Plan advertising campaigns',
    'Track and analyze metrics',
    'Optimize campaigns',
    'Report on performance',
    'Plan future initiatives',
  ],
};

export function generateSubtasks(parentTask: Partial<Task>, template: string[]): Subtask[] {
  const subtasks: Subtask[] = [];

  for (let i = 0; i < Math.min(template.length, 10); i++) {
    const subtask: Subtask = {
      id: uuidv4(),
      title: `${parentTask.title} - Step ${i + 1}: ${template[i]}`,
      description: `Subtask ${i + 1} of parent task: ${parentTask.title}`,
      status: TaskStatus.PENDING,
      priority: determinePriorityLevel(
        (Math.floor(Math.random() * 10) + 1) * 0.4 +
        (Math.floor(Math.random() * 10) + 1) * 0.5 -
        (Math.floor(Math.random() * 10) + 1) * 0.1
      ),
      timeSaved: Math.floor(Math.random() * 30),
      dueDate: new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    subtasks.push(subtask);
  }

  return subtasks;
}

export function getTemplateForCategory(category: string): string[] {
  const categoryKey = category.toLowerCase() as keyof typeof taskBreakTemplates;
  return taskBreakTemplates[categoryKey] || taskBreakTemplates.development;
}

export const taskEngine = new TaskEngine();
