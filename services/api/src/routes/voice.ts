import type { IncomingMessage, ServerResponse } from "http";

export function handleVoice(req: IncomingMessage, res: ServerResponse, url: URL): void {
  const path = url.pathname.replace("/api/voice", "");

  if (path === "/status") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ready",
      stt: { model: "whisper-base", status: "loaded" },
      tts: { model: "tts-1", status: "ready" },
      webrtc: { status: "available" },
    }));
    return;
  }

  if (path === "/transcribe" && req.method === "POST") {
    res.writeHead(200);
    res.end(JSON.stringify({ text: "[transcription pending]", confidence: 0 }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Voice endpoint not found" }));
}
