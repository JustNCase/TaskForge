"use client";

export function VoiceWaveform() {
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-genesis-400 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 24 + 8}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
