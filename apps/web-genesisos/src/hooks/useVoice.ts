"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: string;
  sender: "user" | "genesis";
}

interface VoiceState {
  listening: boolean;
  connected: boolean;
  transcript: TranscriptEntry[];
  error: string | null;
}

const WS_URL = process.env.NEXT_PUBLIC_VOICE_URL || "ws://localhost:3002/ws";

export function useVoice(onCommand?: (intent: string, target: string) => void) {
  const [state, setState] = useState<VoiceState>({
    listening: false,
    connected: false,
    transcript: [],
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const entryIdRef = useRef(0);

  const addEntry = useCallback((text: string, sender: "user" | "genesis") => {
    entryIdRef.current++;
    setState((s) => ({
      ...s,
      transcript: [...s.transcript, {
        id: String(entryIdRef.current),
        text,
        timestamp: new Date().toLocaleTimeString(),
        sender,
      }],
    }));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true, error: null }));
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false, listening: false }));
      wsRef.current = null;
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, error: "WebSocket connection failed" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "transcript":
            addEntry(msg.text, "user");
            break;
          case "command":
            addEntry(`[Command: ${msg.command?.intent}] ${msg.text || ""}`, "genesis");
            if (onCommand && msg.command?.intent) {
              onCommand(msg.command.intent, msg.command.entities?.target || "");
            }
            break;
          case "tts_audio":
            playAudioResponse(msg.data, msg.format || "mp3");
            break;
          case "error":
            setState((s) => ({ ...s, error: msg.message }));
            break;
        }
      } catch { }
    };

    wsRef.current = ws;
  }, [addEntry, onCommand]);

  const playAudioResponse = (base64Data: string, format: string) => {
    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: `audio/${format}` });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch(() => {});
    } catch { }
  };

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        audioChunksRef.current = [];

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buffer) => {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const base64 = btoa(binary);

            wsRef.current?.send(JSON.stringify({
              type: "audio",
              data: base64,
              filename: `recording.${mediaRecorder.mimeType.includes("webm") ? "webm" : "mp4"}`,
            }));
          });
        }
      };

      mediaRecorder.start();
      setState((s) => ({ ...s, listening: true, error: null }));
    } catch (err: unknown) {
      const message = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Microphone access denied"
        : "Microphone not available";
      setState((s) => ({
        ...s,
        listening: false,
        error: message,
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setState((s) => ({ ...s, listening: false }));
  }, []);

  const speak = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: "tts", text }));
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wsRef.current?.close();
    };
  }, []);

  return {
    ...state,
    connect,
    startListening,
    stopListening,
    speak,
    clearTranscript: () => setState((s) => ({ ...s, transcript: [] })),
  };
}
