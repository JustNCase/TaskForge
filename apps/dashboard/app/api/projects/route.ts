import { NextRequest, NextResponse } from 'next/server';
import { Task } from '@taskforge/ai-core';

interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

const projects: Project[] = [];

export async function GET() {
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project: Project = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      tasks: body.tasks || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    projects.push(project);
    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
