"use client";

import { useState } from "react";

export default function AIAssistantWidget() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  async function askAI() {
    const response = await fetch("/api/aiAgent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    setReply(data.reply || "");
  }

  return (
    <section>
      <h2>TaskForge AI Assistant</h2>
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask TaskForge AI"
      />
      <button onClick={askAI}>Ask</button>
      <p>{reply}</p>
    </section>
  );
}
