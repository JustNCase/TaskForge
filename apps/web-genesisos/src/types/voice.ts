export interface VoiceCommand {
  raw: string;
  intent: string;
  entities: Record<string, string>;
  confidence: number;
}

export interface VoiceTranscript {
  text: string;
  language: string;
  confidence: number;
  duration: number;
}

export interface VoiceState {
  connected: boolean;
  listening: boolean;
  processing: boolean;
  transcript: string;
  lastCommand: VoiceCommand | null;
}
