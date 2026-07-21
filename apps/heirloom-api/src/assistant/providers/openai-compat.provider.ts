import {
  AgentAction,
  AgentRunOptions,
  AgentRunResult,
  AgentStreamEvent,
  executeToolSafely,
  LlmAgentProvider,
} from './provider.interface';

// Chat-completions wire types (the subset we use)
interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ChatCompletionResponse {
  choices: { message: ChatMessage; finish_reason: string }[];
}

interface StreamDelta {
  content?: string | null;
  tool_calls?: {
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }[];
}

// Covers OpenAI and any OpenAI-compatible server (Ollama, llama.cpp).
export class OpenAiCompatProvider implements LlmAgentProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
    private readonly model: string,
    // For reasoning models (gpt-5 family): minimal | low | medium | high
    private readonly reasoningEffort?: string,
  ) {}

  runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
    return this.run(options, undefined);
  }

  runAgentStream(
    options: AgentRunOptions,
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<AgentRunResult> {
    return this.run(options, onEvent);
  }

  private async run(
    options: AgentRunOptions,
    onEvent?: (event: AgentStreamEvent) => void,
  ): Promise<AgentRunResult> {
    const { system, tools, maxIterations = 12 } = options;
    const actions: AgentAction[] = [];
    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      ...options.messages.map(
        (turn): ChatMessage => ({ role: turn.role, content: turn.content }),
      ),
    ];
    const toolDefs = tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));

    for (let i = 0; i < maxIterations; i++) {
      const message = onEvent
        ? await this.completeStreaming(messages, toolDefs, onEvent)
        : await this.complete(messages, toolDefs);

      if (!message.tool_calls?.length) {
        return { reply: message.content ?? '', actions };
      }

      messages.push(message);
      for (const call of message.tool_calls) {
        const tool = options.tools.find(
          (t) => t.name === call.function.name,
        );
        let payload: string;
        let ok = false;
        if (!tool) {
          payload = JSON.stringify({
            error: `Unknown tool ${call.function.name}`,
          });
        } else {
          let input: Record<string, unknown>;
          try {
            input = JSON.parse(call.function.arguments || '{}') as Record<
              string,
              unknown
            >;
          } catch {
            input = {};
          }
          const result = await executeToolSafely(tool, input);
          ok = result.ok;
          actions.push({ tool: tool.name, input, ok });
          payload = result.payload;
        }
        onEvent?.({ type: 'tool', tool: call.function.name, ok });
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: payload,
        });
      }
    }

    return {
      reply: 'The assistant stopped: too many tool iterations.',
      actions,
    };
  }

  private requestBody(
    messages: ChatMessage[],
    tools: unknown[],
    stream: boolean,
  ) {
    return {
      model: this.model,
      messages,
      tools,
      ...(stream ? { stream: true } : {}),
      ...(this.reasoningEffort
        ? { reasoning_effort: this.reasoningEffort }
        : {}),
    };
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  private async complete(
    messages: ChatMessage[],
    tools: unknown[],
  ): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.requestBody(messages, tools, false)),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LLM provider error ${response.status}: ${body.slice(0, 500)}`,
      );
    }
    const data = (await response.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('LLM provider returned no choices');
    return message;
  }

  // Streams one completion, emitting text deltas and accumulating tool calls
  private async completeStreaming(
    messages: ChatMessage[],
    tools: unknown[],
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.requestBody(messages, tools, true)),
    });
    if (!response.ok || !response.body) {
      const body = await response.text();
      throw new Error(
        `LLM provider error ${response.status}: ${body.slice(0, 500)}`,
      );
    }

    let content = '';
    const calls = new Map<number, ToolCall>();
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        let delta: StreamDelta | undefined;
        try {
          delta = (
            JSON.parse(payload) as {
              choices?: { delta?: StreamDelta }[];
            }
          ).choices?.[0]?.delta;
        } catch {
          continue;
        }
        if (!delta) continue;
        if (delta.content) {
          content += delta.content;
          onEvent({ type: 'token', text: delta.content });
        }
        for (const part of delta.tool_calls ?? []) {
          const existing = calls.get(part.index) ?? {
            id: '',
            type: 'function' as const,
            function: { name: '', arguments: '' },
          };
          if (part.id) existing.id = part.id;
          if (part.function?.name) existing.function.name += part.function.name;
          if (part.function?.arguments)
            existing.function.arguments += part.function.arguments;
          calls.set(part.index, existing);
        }
      }
    }

    const tool_calls = [...calls.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, call]) => call);
    return {
      role: 'assistant',
      content: content || null,
      ...(tool_calls.length ? { tool_calls } : {}),
    };
  }
}
