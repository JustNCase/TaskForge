export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class WebhookHandler {
  private handlers: Map<string, (payload: WebhookPayload) => Promise<void>> = new Map();

  on(event: string, handler: (payload: WebhookPayload) => Promise<void>): void {
    this.handlers.set(event, handler);
  }

  async handle(payload: WebhookPayload): Promise<void> {
    const handler = this.handlers.get(payload.event);
    if (handler) {
      await handler(payload);
    }
  }
}
