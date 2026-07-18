export class WakeWordDetector {
  private wakeWord: string;
  private isListening: boolean = false;

  constructor(wakeWord: string = "genesis") {
    this.wakeWord = wakeWord.toLowerCase();
  }

  start(callback: () => void): void {
    this.isListening = true;
    console.log(`Wake word detector listening for "${this.wakeWord}"`);
  }

  stop(): void {
    this.isListening = false;
  }

  detect(transcript: string): boolean {
    return transcript.toLowerCase().includes(this.wakeWord);
  }
}
