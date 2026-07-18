export type AIRequest = {
  prompt: string;
};

export async function createAITask(request: AIRequest) {
  return {
    title: `AI Generated: ${request.prompt}`,
    source: 'TaskForge AI'
  };
}
