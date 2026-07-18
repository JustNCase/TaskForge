import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { goal } = body;

    if (!goal) {
      return NextResponse.json(
        { error: "Goal required" },
        { status: 400 }
      );
    }

    const tasks = [
      {
        title: "Analyze project requirements",
        priority: "High",
      },
      {
        title: "Break project into smaller milestones",
        priority: "High",
      },
      {
        title: "Create action checklist",
        priority: "Medium",
      },
      {
        title: "Estimate completion time",
        priority: "Medium",
      },
      {
        title: "Review and optimize workflow",
        priority: "Low",
      },
    ];

    return NextResponse.json({
      success: true,
      goal,
      tasks,
    });
  } catch {
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
