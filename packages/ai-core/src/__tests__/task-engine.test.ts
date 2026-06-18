import { describe, it, expect } from 'vitest';
import {
  TaskEngine,
  TaskStatus,
  PriorityLevel,
  determinePriorityLevel,
  generateSubtasks,
  getTemplateForCategory,
  unitTestExamples,
} from '../task-engine';

describe('TaskEngine', () => {
  it('creates a task with required fields', async () => {
    const engine = new TaskEngine();
    const task = await engine.createTask({
      title: 'Test task',
      description: 'A test',
      status: TaskStatus.PENDING,
      priority: PriorityLevel.MEDIUM,
      category: 'general',
      dueDate: new Date(),
      timeSaved: 0,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test task');
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('returns all tasks', async () => {
    const engine = new TaskEngine();
    await engine.createTask({
      title: 'A', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });
    await engine.createTask({
      title: 'B', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });

    const tasks = await engine.getAllTasks();
    expect(tasks).toHaveLength(2);
  });

  it('updates a task', async () => {
    const engine = new TaskEngine();
    const task = await engine.createTask({
      title: 'Original', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });

    const updated = await engine.updateTask(task.id, { title: 'Updated' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
  });

  it('returns null when updating nonexistent task', async () => {
    const engine = new TaskEngine();
    const result = await engine.updateTask('nonexistent', { title: 'X' });
    expect(result).toBeNull();
  });

  it('deletes a task', async () => {
    const engine = new TaskEngine();
    const task = await engine.createTask({
      title: 'To delete', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });

    const deleted = await engine.deleteTask(task.id);
    expect(deleted).toBe(true);
    expect(await engine.getAllTasks()).toHaveLength(0);
  });

  it('returns false when deleting nonexistent task', async () => {
    const engine = new TaskEngine();
    const result = await engine.deleteTask('nonexistent');
    expect(result).toBe(false);
  });

  it('filters tasks by status', async () => {
    const engine = new TaskEngine();
    await engine.createTask({
      title: 'Pending', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });
    await engine.createTask({
      title: 'Done', description: '', status: TaskStatus.COMPLETED,
      priority: PriorityLevel.LOW, category: 'general', dueDate: new Date(), timeSaved: 0,
    });

    const pending = await engine.getTasksByStatus(TaskStatus.PENDING);
    expect(pending).toHaveLength(1);
    expect(pending[0].title).toBe('Pending');
  });

  it('filters tasks by category', async () => {
    const engine = new TaskEngine();
    await engine.createTask({
      title: 'Dev', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'development', dueDate: new Date(), timeSaved: 0,
    });
    await engine.createTask({
      title: 'Market', description: '', status: TaskStatus.PENDING,
      priority: PriorityLevel.LOW, category: 'marketing', dueDate: new Date(), timeSaved: 0,
    });

    const dev = await engine.getTasksByCategory('development');
    expect(dev).toHaveLength(1);
  });
});

describe('calculatePriorityScore', () => {
  it('scores within 0-10 range', () => {
    const engine = new TaskEngine();

    const max = engine.calculatePriorityScore({ urgency: 10, impact: 10, effort: 1 });
    expect(max).toBeLessThanOrEqual(10);

    const min = engine.calculatePriorityScore({ urgency: 1, impact: 1, effort: 10 });
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('throws on out-of-range values', () => {
    const engine = new TaskEngine();
    expect(() => engine.calculatePriorityScore({ urgency: 0, impact: 5, effort: 5 })).toThrow();
    expect(() => engine.calculatePriorityScore({ urgency: 11, impact: 5, effort: 5 })).toThrow();
  });

  it('produces correct score for known inputs', () => {
    const engine = new TaskEngine();
    const score = engine.calculatePriorityScore({ urgency: 8, impact: 7, effort: 3 });
    expect(score).toBeCloseTo(8 * 0.4 + 7 * 0.5 - 3 * 0.1, 1);
  });
});

describe('determinePriorityLevel', () => {
  it('returns HIGH for score >= 7', () => {
    expect(determinePriorityLevel(7)).toBe(PriorityLevel.HIGH);
    expect(determinePriorityLevel(10)).toBe(PriorityLevel.HIGH);
  });

  it('returns MEDIUM for score 4-6.9', () => {
    expect(determinePriorityLevel(4)).toBe(PriorityLevel.MEDIUM);
    expect(determinePriorityLevel(6.9)).toBe(PriorityLevel.MEDIUM);
  });

  it('returns LOW for score < 4', () => {
    expect(determinePriorityLevel(0)).toBe(PriorityLevel.LOW);
    expect(determinePriorityLevel(3.9)).toBe(PriorityLevel.LOW);
  });
});

describe('createTaskWithScoring', () => {
  it('creates task with computed priority', async () => {
    const engine = new TaskEngine();
    const task = await engine.createTaskWithScoring(
      {
        title: 'Scored task', description: '', status: TaskStatus.PENDING,
        category: 'test', dueDate: new Date(), timeSaved: 0,
      },
      { urgency: 10, impact: 10, effort: 1 }
    );

    expect(task.priority).toBe(PriorityLevel.HIGH);
    expect(task.scoring).toEqual({ urgency: 10, impact: 10, effort: 1 });
  });
});

describe('generateSubtasks', () => {
  it('generates up to 10 subtasks', () => {
    const subtasks = generateSubtasks(
      { title: 'Parent' },
      ['Step 1', 'Step 2', 'Step 3']
    );

    expect(subtasks).toHaveLength(3);
    expect(subtasks[0].title).toContain('Parent');
    expect(subtasks[0].id).toBeDefined();
    expect(subtasks[0].status).toBe(TaskStatus.PENDING);
    expect(subtasks[0].dueDate).toBeInstanceOf(Date);
  });

  it('respects template length cap', () => {
    const subtasks = generateSubtasks(
      { title: 'Big' },
      Array.from({ length: 20 }, (_, i) => `Step ${i + 1}`)
    );

    expect(subtasks).toHaveLength(10);
  });
});

describe('getTemplateForCategory', () => {
  it('returns matching template', () => {
    const template = getTemplateForCategory('development');
    expect(template).toHaveLength(10);
    expect(template[0]).toContain('setup');
  });

  it('falls back to development for unknown categories', () => {
    const template = getTemplateForCategory('unknown');
    expect(template).toEqual(getTemplateForCategory('development'));
  });

  it('is case insensitive', () => {
    const a = getTemplateForCategory('Writing');
    const b = getTemplateForCategory('writing');
    expect(a).toEqual(b);
  });
});

describe('unitTestExamples', () => {
  it('highPriorityTask has correct expected score', () => {
    const { task, scoring, expectedScore } = unitTestExamples.highPriorityTask;
    const engine = new TaskEngine();
    expect(engine.calculatePriorityScore(scoring)).toBeCloseTo(expectedScore, 1);
  });

  it('lowPriorityTask has correct expected priority', () => {
    const { scoring, expectedPriority } = unitTestExamples.lowPriorityTask;
    const engine = new TaskEngine();
    const score = engine.calculatePriorityScore(scoring);
    expect(engine.determinePriorityLevel(score)).toBe(expectedPriority);
  });

  it('all examples produce consistent results', () => {
    const engine = new TaskEngine();
    for (const key of Object.keys(unitTestExamples) as Array<keyof typeof unitTestExamples>) {
      const ex = unitTestExamples[key];
      const score = engine.calculatePriorityScore(ex.scoring);
      const level = engine.determinePriorityLevel(score);
      expect(level).toBe(ex.expectedPriority);
    }
  });
});
