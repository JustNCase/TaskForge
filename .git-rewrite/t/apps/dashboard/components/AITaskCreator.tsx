"use client";

import { useState } from "react";

export default function AITaskCreator() {
  const [prompt, setPrompt] = useState("");

  async function createTask() {
    await fetch("/api/aiTasks/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  }

  return (
    <div>
      <h2>Create AI Task</h2>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What should AI create?"
      />
      <button onClick={createTask}>Generate</button>
    </div>
  );
}
