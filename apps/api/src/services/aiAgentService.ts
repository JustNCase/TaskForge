export type AIAgentRequest = {
  userId: string;
  message: string;
};

export type AIAgentResponse = {
  reply: string;
  suggestedAction?: string;
};

export async function runTaskForgeAgent(
  request: AIAgentRequest
): Promise<AIAgentResponse> {
  return {
    reply: `TaskForge AI received: ${request.message}`,
    suggestedAction: 'create_task',
  };
}
