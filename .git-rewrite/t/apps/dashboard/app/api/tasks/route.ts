import { NextRequest, NextResponse } from 'next/server';
import { taskEngine } from '@taskforge/ai-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let tasks = await taskEngine.getAllTasks();

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    if (category) {
      tasks = tasks.filter(task => task.category === category);
    }

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await taskEngine.createTask(body);

    if (body.subtasks && Array.isArray(body.subtasks)) {
      const updatedTask = await taskEngine.updateTask(task.id, {
        subtasks: body.subtasks,
      });
      return NextResponse.json(updatedTask, { status: 201 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
