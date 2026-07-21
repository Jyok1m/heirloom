import {
  AgentAction,
  AgentRunOptions,
  AgentRunResult,
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

// Covers OpenAI and any OpenAI-compatible server, including llama.cpp
// (llama-server exposes /v1/chat/completions with tool calling).
export class OpenAiCompatProvider implements LlmAgentProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
    private readonly model: string,
  ) {}

  async runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
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
      const message = await this.complete(messages, toolDefs);

      if (!message.tool_calls?.length) {
        return { reply: message.content ?? '', actions };
      }

      messages.push(message);
      for (const call of message.tool_calls) {
        const tool = options.tools.find(
          (t) => t.name === call.function.name,
        );
        let payload: string;
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
          actions.push({ tool: tool.name, input, ok: result.ok });
          payload = result.payload;
        }
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

  private async complete(
    messages: ChatMessage[],
    tools: unknown[],
  ): Promise<ChatMessage> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: this.model, messages, tools }),
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
}
