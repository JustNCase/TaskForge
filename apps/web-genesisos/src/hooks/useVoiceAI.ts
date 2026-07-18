"use client";

import { useVoice } from "./useVoice";

export function useVoiceAI(onCommand?: (intent: string, target: string) => void) {
  return useVoice(onCommand);
}

export type UseVoiceAIReturn = ReturnType<typeof useVoice>;
