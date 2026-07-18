import { describe, expect, it } from 'vitest';
import * as taskCompletion from '../taskCompletionService';

describe('task completion rewards', () => {
  it('exports completeTask function', () => {
    expect(typeof taskCompletion.completeTask).toBe('function');
  });
});
