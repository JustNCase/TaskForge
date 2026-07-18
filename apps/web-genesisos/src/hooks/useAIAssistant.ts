"use client";

import { useState, useCallback } from "react";

interface AIMessage {
  role: "user" | "genesis";
  content: string;
  timestamp: Date;
}

interface VisualData {
  image?: string;
  detected?: string;
  confidence?: number;
}

export interface AIMessageWithVision extends AIMessage {
  visual?: VisualData;
}

export function useAIAssistant() {
  const [messages, setMessages] = useState<AIMessageWithVision[]>([]);
  const [loading, setLoading] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);

  const send = useCallback(async (text: string, visual?: VisualData) => {
    const userMsg: AIMessageWithVision = { role: "user", content: text, timestamp: new Date() };
    if (visual) userMsg.visual = visual;
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, visual }),
      });
      const data = await res.json();
      const aiMsg: AIMessageWithVision = { role: "genesis", content: data.response, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: AIMessageWithVision = { role: "genesis", content: "I encountered an error. Please try again.", timestamp: new Date() };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeImage = useCallback(async (base64Image: string) => {
    setVisionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/vision/detect/objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error("Vision analysis failed");
    } finally {
      setVisionLoading(false);
    }
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  return { messages, loading, visionLoading, send, analyzeImage, clear };
}

export interface UseAIAssistantReturn {
  messages: AIMessageWithVision[];
  loading: boolean;
  visionLoading: boolean;
  send: (text: string, visual?: VisualData) => Promise<void>;
  analyzeImage: (base64Image: string) => Promise<unknown>;
  clear: () => void;
}
