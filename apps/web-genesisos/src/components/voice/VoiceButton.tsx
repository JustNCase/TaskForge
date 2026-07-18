"use client";

interface Props {
  listening: boolean;
  connected: boolean;
  error: string | null;
  onToggle: () => void;
}

export function VoiceButton({ listening, connected, error, onToggle }: Props) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={!connected && !listening}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          listening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
            : connected
              ? "bg-genesis-100 text-genesis-700 hover:bg-genesis-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={
          listening ? "Stop listening" :
          connected ? "Start voice command" :
          error || "Connecting..."
        }
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
      {error && (
        <div className="absolute top-12 right-0 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
