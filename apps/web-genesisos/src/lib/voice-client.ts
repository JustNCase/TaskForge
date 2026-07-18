const WS_URL = process.env.NEXT_PUBLIC_VOICE_URL || "ws://localhost:3002/ws";

export class VoiceClient {
  private ws: WebSocket | null = null;
  private onTranscript?: (text: string) => void;
  private onCommand?: (command: unknown) => void;

  connect(callbacks: { onTranscript?: (text: string) => void; onCommand?: (command: unknown) => void }): void {
    this.onTranscript = callbacks.onTranscript;
    this.onCommand = callbacks.onCommand;

    this.ws = new WebSocket(WS_URL);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "transcript") this.onTranscript?.(msg.text);
      if (msg.command) this.onCommand?.(msg.command);
    };
  }

  sendAudio(audioData: ArrayBuffer): void {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioData)));
    this.ws?.send(JSON.stringify({ type: "audio", data: base64 }));
  }

  speak(text: string, voice?: string): void {
    this.ws?.send(JSON.stringify({ type: "tts", text, voice }));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
