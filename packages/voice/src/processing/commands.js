export class VoiceCommandProcessor {
    aliases = new Map([
        ["open", "navigate"],
        ["go to", "navigate"],
        ["show me", "display"],
        ["bring up", "display"],
        ["turn on", "enable"],
        ["turn off", "disable"],
    ]);
    process(transcript) {
        const lower = transcript.toLowerCase().trim();
        const resolved = this.resolveAliases(lower);
        return {
            raw: transcript,
            intent: this.extractIntent(resolved),
            entities: this.extractEntities(resolved),
            confidence: 0.8,
        };
    }
    resolveAliases(text) {
        let result = text;
        for (const [alias, canonical] of this.aliases) {
            if (result.startsWith(alias)) {
                result = result.replace(alias, canonical);
                break;
            }
        }
        return result;
    }
    extractIntent(text) {
        if (text.startsWith("navigate"))
            return "navigate";
        if (text.startsWith("display"))
            return "display";
        if (text.startsWith("enable"))
            return "enable";
        if (text.startsWith("disable"))
            return "disable";
        if (text.startsWith("search"))
            return "search";
        return "unknown";
    }
    extractEntities(text) {
        const entities = {};
        const words = text.split(" ");
        if (words.length > 1) {
            entities.target = words.slice(1).join(" ");
        }
        return entities;
    }
}
//# sourceMappingURL=commands.js.map