export declare class WakeWordDetector {
    private wakeWord;
    private isListening;
    constructor(wakeWord?: string);
    start(callback: () => void): void;
    stop(): void;
    detect(transcript: string): boolean;
}
//# sourceMappingURL=wake-word.d.ts.map