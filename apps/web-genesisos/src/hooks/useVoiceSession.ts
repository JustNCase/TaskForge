"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface VoiceSession {
  id: string;
  userId?: string;
  startedAt: number;
  lastActivity: number;
  commandCount: number;
  status: "idle" | "active" | "ended";
}

export function useVoiceSession(userId?: string) {
  const [session, setSession] = useState<VoiceSession>({
    id: "",
    userId,
    startedAt: 0,
    lastActivity: 0,
    commandCount: 0,
    status: "idle",
  });
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 300000;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setSession((s) => ({ ...s, status: "idle" }));
    }, INACTIVITY_TIMEOUT);
  }, []);

  const start = useCallback(() => {
    const newSession: VoiceSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      startedAt: Date.now(),
      lastActivity: Date.now(),
      commandCount: 0,
      status: "active",
    };
    setSession(newSession);
    resetInactivityTimer();
    return newSession;
  }, [userId, resetInactivityTimer]);

  const end = useCallback(() => {
    setSession((s) => ({ ...s, status: "ended" }));
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const recordActivity = useCallback(() => {
    setSession((s) => ({
      ...s,
      lastActivity: Date.now(),
      commandCount: s.commandCount + 1,
      status: "active",
    }));
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const isExpired = useCallback(() => {
    return Date.now() - session.lastActivity > INACTIVITY_TIMEOUT;
  }, [session.lastActivity]);

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  return {
    session,
    start,
    end,
    recordActivity,
    isExpired,
  };
}
