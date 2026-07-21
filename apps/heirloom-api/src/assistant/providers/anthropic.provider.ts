import Anthropic from '@anthropic-ai/sdk';
import {
  AgentAction,
  AgentRunOptions,
  AgentRunResult,
  executeToolSafely,
  LlmAgentProvider,
} from './provider.interface';

export class AnthropicProvider implements LlmAgentProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string | undefined,
    private readonly model: string,
  ) {
    // The SDK also resolves ANTHROPIC_API_KEY from the environment
    this.client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  }

  async runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
    const { system, tools, maxIterations = 12 } = options;
    const actions: AgentAction[] = [];
    const toolDefs: Anthropic.Tool[] = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));
    const messages: Anthropic.MessageParam[] = options.messages.map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 16000,
        system,
        thinking: { type: 'adaptive' },
        tools: toolDefs,
        messages,
      });

      if (response.stop_reason === 'refusal') {
        return { reply: 'The model declined to answer this request.', actions };
      }

      if (response.stop_reason !== 'tool_use') {
        const reply = response.content
          .filter(
            (block): block is Anthropic.TextBlock => block.type === 'text',
          )
          .map((block) => block.text)
          .join('\n');
        return { reply, actions };
      }

      // Echo the full assistant content back (thinking blocks included),
      // then answer every tool_use block in a single user turn
      messages.push({ role: 'assistant', content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        const tool = options.tools.find((t) => t.name === block.name);
        if (!tool) {
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({ error: `Unknown tool ${block.name}` }),
            is_error: true,
          });
          continue;
        }
        const input = block.input as Record<string, unknown>;
        const { ok, payload } = await executeToolSafely(tool, input);
        actions.push({ tool: block.name, input, ok });
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: payload,
          is_error: !ok,
        });
      }
      messages.push({ role: 'user', content: results });
    }

    return {
      reply: 'The assistant stopped: too many tool iterations.',
      actions,
    };
  }
}
