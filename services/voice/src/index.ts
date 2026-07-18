import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { WhisperSTT } from "@taskforge/voice";
import { OpenAITTS } from "@taskforge/voice";
import { VoiceCommandProcessor } from "@taskforge/voice";
import { EmotionDetector } from "@taskforge/voice";

const PORT = parseInt(process.env.VOICE_PORT || "3002");
const stt = new WhisperSTT(process.env.WHISPER_MODEL || "whisper-1");
const tts = new OpenAITTS();
const commandProcessor = new VoiceCommandProcessor();
const emotionDetector = new EmotionDetector();

const httpServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "genesis-voice" }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  console.log("[voice] Client connected");

  ws.on("message", async (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "audio": {
          const audioBuffer = Buffer.from(msg.data, "base64");
          const transcript = await stt.transcribe(audioBuffer, msg.filename || "audio.webm");
          const command = commandProcessor.process(transcript.text);
          const emotion = emotionDetector.detectFromText(transcript.text);

          ws.send(JSON.stringify({
            type: "transcript",
            text: transcript.text,
            language: transcript.language,
            confidence: transcript.confidence,
            duration: transcript.duration,
            command,
            emotion,
          }));
          break;
        }

        case "tts": {
          const audioResult = await tts.synthesize(msg.text, {
            voice: msg.voice || "nova",
            speed: msg.speed || 1.0,
          });
          ws.send(JSON.stringify({
            type: "tts_audio",
            data: audioResult.toString("base64"),
            format: "mp3",
          }));
          break;
        }

        case "ping": {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
        }

        default:
          ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
      }
    } catch (err: any) {
      console.error("[voice] Error processing message:", err?.message);
      ws.send(JSON.stringify({
        type: "error",
        message: err?.message || "Failed to process voice data",
      }));
    }
  });

  ws.on("close", () => {
    console.log("[voice] Client disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`[genesis:voice] WebSocket server ready on ws://localhost:${PORT}/ws`);
});
