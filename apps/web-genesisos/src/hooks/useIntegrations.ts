"use client";

import { useState, useCallback, useRef } from "react";
import { useAIAssistant } from "@/hooks/useAIAssistant";

interface IntegrationStatus {
  connected: boolean;
  lastSync: string;
  provider: string;
}

interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  processed: boolean;
}

export function useIntegrations() {
  const { messages, loading, visionLoading, send, analyzeImage, clear } = useAIAssistant();
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});n  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncIntegration = useCallback(async (provider: string, config: any) => {
    setSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integration/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setIntegrations(prev => ({
        ...prev,
        [provider]: {
          connected: true,
          lastSync: new Date().toISOString(),
          provider,
        }
      }));
      return data;
    } catch (err) {
      console.error(`Failed to sync ${provider}:`, err);
      setIntegrations(prev => ({
        ...prev,
        [provider]: {
          connected: false,
          lastSync: new Date().toISOString(),
          provider,
        }
      }));
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const sendToIntegration = useCallback(async (provider: string, endpoint: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/integration/${provider}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }, []);

  const registerWebhook = useCallback((event: string, handler: (payload: any) => void) => {
    if (typeof window === "undefined") return;
    
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"}/webhooks`);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === event) {
          handler(payload);
          setWebhooks(prev => [...prev, { ...payload, processed: true }]);
        }
      } catch (err) {
        console.error("Webhook parsing error:", err);
      }
    };
    
    ws.onerror = (err) => {
      console.error(`Webhook connection error for ${event}:`, err);
    };
    
    return ws;
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      setIsAnalyzing(true);
      try {
        await analyzeImage(base64Image);
        await syncIntegration("vision", { image: base64Image });
      } catch (error) {
        console.error("Integration processing failed:", error);
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

  return {
    messages,
    loading,
    visionLoading,
    syncing,
    isAnalyzing,
    integrations,
    webhooks,
    send,
    analyzeImage,
    syncIntegration,
    sendToIntegration,
    registerWebhook,
    triggerImageUpload,
    handleImageUpload,
    clear,
  };
}

export interface UseIntegrationsReturn {
  messages: any[];
  loading: boolean;
  visionLoading: boolean;
  syncing: boolean;
  isAnalyzing: boolean;
  integrations: Record<string, IntegrationStatus>;
  webhooks: WebhookEvent[];
  send: (text: string, visual?: any) => Promise<void>;
  analyzeImage: (base64Image: string) => Promise<unknown>;
  syncIntegration: (provider: string, config: any) => Promise<unknown>;
  sendToIntegration: (provider: string, endpoint: string, data: any) => Promise<unknown>;
  registerWebhook: (event: string, handler: (payload: any) => void) => WebSocket | null;
  triggerImageUpload: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clear: () => void;
}