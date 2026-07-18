export interface VoiceCommand {
    raw: string;
    intent: string;
    entities: Record<string, string>;
    confidence: number;
}
export declare class VoiceCommandProcessor {
    private aliases;
    process(transcript: string): VoiceCommand;
    private resolveAliases;
    private extractIntent;
    private extractEntities;
}
//# sourceMappingURL=commands.d.ts.map