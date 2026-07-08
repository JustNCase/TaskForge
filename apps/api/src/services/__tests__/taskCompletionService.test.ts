import { describe, expect, it } from 'vitest';
import { completeTask } from '../taskCompletionService';

describe('task completion rewards', () => {
  it('returns completion reward data', async () => {
    const result = await completeTask('test-user', 'task-1');

    expect(result.completed).toBe(true);
    expect(result.taskId).toBe('task-1');
  });
});
