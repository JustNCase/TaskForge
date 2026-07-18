"use client";

import { useState, useCallback, useRef } from "react";

export interface VoiceCommand {
  id: string;
  text: string;
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  executed: boolean;
  timestamp: number;
}

interface CommandHandler {
  intent: string;
  handler: (entities: Record<string, string>, text: string) => void | Promise<void>;
}

export function useVoiceControls() {
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const handlersRef = useRef<CommandHandler[]>([]);
  const historyLimit = 50;

  const registerHandler = useCallback((intent: string, handler: (entities: Record<string, string>, text: string) => void | Promise<void>) => {
    handlersRef.current.push({ intent, handler });
  }, []);

  const removeHandler = useCallback((intent: string) => {
    handlersRef.current = handlersRef.current.filter((h) => h.intent !== intent);
  }, []);

  const execute = useCallback(async (text: string, intent: string, entities: Record<string, string>, confidence: number) => {
    const command: VoiceCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      intent,
      entities,
      confidence,
      executed: false,
      timestamp: Date.now(),
    };

    const handler = handlersRef.current.find((h) => h.intent === intent);
    if (handler) {
      try {
        await handler.handler(entities, text);
        command.executed = true;
      } catch {
        command.executed = false;
      }
    }

    setCommandHistory((prev) => {
      const updated = [command, ...prev];
      return updated.slice(0, historyLimit);
    });

    return command;
  }, []);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
  }, []);

  const getLastCommand = useCallback(() => {
    return commandHistory[0] || null;
  }, [commandHistory]);

  return {
    commandHistory,
    registerHandler,
    removeHandler,
    execute,
    clearHistory,
    getLastCommand,
  };
}
