"use client";

interface Props {
  connected: boolean;
  listening: boolean;
}

export function VoiceStatus({ connected, listening }: Props) {
  const color = listening ? "bg-red-500" : connected ? "bg-green-500" : "bg-gray-400";
  const text = listening ? "Listening..." : connected ? "Voice service connected" : "Disconnected";

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className={`w-2 h-2 rounded-full ${color} ${listening ? "animate-pulse" : ""}`} />
      <span>{text}</span>
    </div>
  );
}
