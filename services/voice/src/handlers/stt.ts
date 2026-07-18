import type { WebSocket } from "ws";

export function handleSTT(_ws: WebSocket, audioData: Buffer): void {
  console.log(`[stt] Processing ${audioData.length} bytes of audio`);
}

export function handleTTS(_ws: WebSocket, text: string): void {
  console.log(`[tts] Synthesizing: "${text}"`);
}
