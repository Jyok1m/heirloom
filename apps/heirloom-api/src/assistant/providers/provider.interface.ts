// Provider-neutral contract for the genealogy agent loop.
// Each provider owns its wire format (tool_use blocks vs tool_calls) and
// runs the request -> execute tools -> loop cycle itself.

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: Record<string, unknown>): Promise<unknown>;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentAction {
  tool: string;
  input: unknown;
  ok: boolean;
}

export interface AgentRunResult {
  reply: string;
  actions: AgentAction[];
}

export interface AgentRunOptions {
  system: string;
  messages: ChatTurn[];
  tools: AgentTool[];
  maxIterations?: number;
}

// Incremental events emitted while the agent works
export type AgentStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool'; tool: string; ok: boolean };

export interface LlmAgentProvider {
  runAgent(options: AgentRunOptions): Promise<AgentRunResult>;
  // Optional: providers without native streaming fall back to runAgent
  runAgentStream?(
    options: AgentRunOptions,
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<AgentRunResult>;
}

export async function executeToolSafely(
  tool: AgentTool,
  input: Record<string, unknown>,
): Promise<{ ok: boolean; payload: string }> {
  try {
    const result = await tool.execute(input);
    return { ok: true, payload: JSON.stringify(result ?? { ok: true }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, payload: JSON.stringify({ error: message }) };
  }
}
