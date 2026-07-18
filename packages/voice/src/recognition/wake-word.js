export class WakeWordDetector {
    wakeWord;
    isListening = false;
    constructor(wakeWord = "genesis") {
        this.wakeWord = wakeWord.toLowerCase();
    }
    start(callback) {
        this.isListening = true;
        console.log(`Wake word detector listening for "${this.wakeWord}"`);
    }
    stop() {
        this.isListening = false;
    }
    detect(transcript) {
        return transcript.toLowerCase().includes(this.wakeWord);
    }
}
//# sourceMappingURL=wake-word.js.map