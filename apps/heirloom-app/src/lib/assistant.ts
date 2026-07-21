// Client for POST /api/assistant/chat/stream (Server-Sent Events over fetch)

export interface AssistantAction {
  tool: string;
  ok: boolean;
}

export interface AssistantDone {
  reply: string;
  actions: { tool: string; input: unknown; ok: boolean }[];
  treeId: string | null;
  conversationId: string;
}

export interface StreamHandlers {
  onToken(text: string): void;
  onTool(action: AssistantAction): void;
  onDone(result: AssistantDone): void;
  onError(message: string): void;
}

export async function streamChat(
  body: { message: string; treeId?: string; conversationId?: string },
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetch('/api/assistant/chat/stream', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) {
    handlers.onError(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (block: string) => {
    const eventMatch = block.match(/^event: (.+)$/m);
    const dataMatch = block.match(/^data: (.+)$/m);
    if (!eventMatch || !dataMatch) return;
    const data: unknown = JSON.parse(dataMatch[1]);
    switch (eventMatch[1]) {
      case 'token':
        handlers.onToken((data as { text: string }).text);
        break;
      case 'tool':
        handlers.onTool(data as AssistantAction);
        break;
      case 'done':
        handlers.onDone(data as AssistantDone);
        break;
      case 'error':
        handlers.onError((data as { message: string }).message);
        break;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let separator: number;
    while ((separator = buffer.indexOf('\n\n')) !== -1) {
      dispatch(buffer.slice(0, separator));
      buffer = buffer.slice(separator + 2);
    }
  }
}
