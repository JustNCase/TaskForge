"use client";

import { useState } from "react";

export default function AITaskGenerator() {
  const [goal, setGoal] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);

  async function generate() {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal }),
    });

    const data = await res.json();

    setTasks(data.tasks || []);
  }

  return (
    <div>
      <h2>AI Task Generator</h2>

      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Describe your project..."
      />

      <button onClick={generate}>
        Generate Tasks
      </button>

      <ul>
        {tasks.map((task, i) => (
          <li key={i}>
            {task.title} - {task.priority}
          </li>
        ))}
      </ul>
    </div>
  );
}
