"use client";

import { useRef, useEffect } from "react";

interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: string;
  sender: "user" | "genesis";
}

interface Props {
  entries: TranscriptEntry[];
}

export function VoiceTranscript({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Voice Transcript</h2>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className={`flex ${entry.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                entry.sender === "user"
                  ? "bg-genesis-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p>{entry.text}</p>
              <p className="text-xs opacity-60 mt-1">{entry.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
