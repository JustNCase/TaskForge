"use client";

import { useState, useRef } from "react";
import { useAIAssistant } from "@/hooks/useAIAssistant";

export function AIAssistant() {
  const { messages, loading, visionLoading, send, analyzeImage, clear } = useAIAssistant();
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      setIsAnalyzing(true);
      try {
        await analyzeImage(base64Image);
      } catch (error) {
        console.error("Image analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Genesis AI Assistant</h2>
        {messages.length > 0 && (
          <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-600">
            Clear
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">
            Ask Genesis anything about your data...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : ""}`}>
            <span className={`inline-block px-3 py-1 rounded-lg ${
              msg.role === "user" ? "bg-genesis-600 text-white" : "bg-gray-100"
            }`}>
              {msg.content}
            </span>
            {msg.visual?.detected && (
              <div className="mt-2 text-xs text-gray-500 italic">
                Detected: {msg.visual.detected} ({Math.round((msg.visual.confidence || 0) * 100)}% confidence)
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-left">
            <span className="inline-block px-3 py-1 rounded-lg bg-gray-100 text-gray-400">
              Thinking...
            </span>
          </div>
        )}
        {isAnalyzing && (
          <div className="text-sm text-left">
            <span className="inline-block px-3 py-1 rounded-lg bg-blue-100 text-blue-400">
              Analyzing image...
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={triggerImageUpload}
          disabled={visionLoading || isAnalyzing}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📷 Analyze Image
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Genesis..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-genesis-400"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || isAnalyzing}
          className="px-4 py-2 bg-genesis-600 text-white rounded-lg text-sm hover:bg-genesis-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
