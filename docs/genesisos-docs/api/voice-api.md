# Genesis-OS Voice API

## Endpoints

### WebSocket: `/ws`

Real-time voice communication channel.

**Messages:**
- `{ type: "audio", data: "<base64-audio>" }` — Send audio for transcription
- `{ type: "tts", text: "Hello", voice: "nova" }` — Request text-to-speech
- `{ type: "ping" }` — Health check

**Responses:**
- `{ type: "transcript", text: "...", confidence: 0.9, command: {...}, emotion: {...} }`
- `{ type: "tts_audio", data: "<base64-audio>" }`
- `{ type: "pong", timestamp: ... }`

### REST: `/health`

Returns service health status.

## Voice Commands

| Command | Intent |
|---------|--------|
| "Show analytics" | display analytics |
| "Navigate to dashboard" | navigate dashboard |
| "Enable voice mode" | enable voice |
| "Search for reports" | search reports |
