import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TreesService } from '../trees/trees.service';
import {
  AssistantContext,
  AssistantToolsService,
} from './assistant-tools.service';
import { ChatRequestDto } from './dto/chat.dto';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiCompatProvider } from './providers/openai-compat.provider';
import { LlmAgentProvider } from './providers/provider.interface';

const SYSTEM_PROMPT = `You are the assistant of Heirloom, a self-hosted genealogy application.
You help the user explore and edit ONE family tree through the provided tools.

Guidelines:
- Answer questions about the family (who is who, parents, unions, children, life events) by looking the data up with the tools. Never invent facts: if the data is not in the tree, say so.
- When the user asks to record information (new family member, marriage, birth, death, occupation, notes...), use the tools to write it. Resolve the persons involved first with search_persons/get_person; if several persons match, ask the user which one they mean instead of guessing.
- Filiation goes through unions: to declare parents, create (or find) the union of the two parents and attach the child to it.
- Dates: store the user's wording in dateValue using GEDCOM style ("12 JAN 1875", "ABT 1850") and set dateSort to an approximate ISO date when possible.
- You cannot delete anything; tell the user deletions are done manually in the app.
- After writing, briefly confirm what was recorded.
- Always reply in the language of the user.`;

@Injectable()
export class AssistantService {
  constructor(
    private readonly config: ConfigService,
    private readonly treesService: TreesService,
    private readonly toolsService: AssistantToolsService,
  ) {}

  async chat({ treeId, messages }: ChatRequestDto) {
    const provider = this.buildProvider();

    let context: string;
    if (treeId) {
      const tree = await this.treesService.findOne(treeId);
      context = `Current family tree: "${tree.name}" (id ${tree.id}).`;
    } else {
      context = `No family tree is selected yet. Start by listing the existing trees (list_trees) or creating one (create_tree), then pass its treeId to the other tools. Guide the user step by step: create the tree, then their first persons, unions and events.`;
    }

    const ctx: AssistantContext = {};
    const tools = this.toolsService.buildTools(treeId, ctx);

    const result = await provider.runAgent({
      system: `${SYSTEM_PROMPT}\n\n${context}`,
      messages,
      tools,
    });

    return {
      reply: result.reply,
      actions: result.actions,
      // The tree the conversation is (now) about, so the client can pin it
      treeId: treeId ?? ctx.createdTreeId ?? null,
    };
  }

  // AI_PROVIDER: anthropic | openai | llamacpp (OpenAI-compatible server)
  private buildProvider(): LlmAgentProvider {
    const provider = this.config.get<string>('AI_PROVIDER');
    const apiKey = this.config.get<string>('AI_API_KEY');
    const model = this.config.get<string>('AI_MODEL');

    switch (provider) {
      case 'anthropic':
        return new AnthropicProvider(apiKey, model ?? 'claude-opus-4-8');
      case 'openai':
        return new OpenAiCompatProvider(
          this.config.get<string>('AI_BASE_URL') ?? 'https://api.openai.com/v1',
          apiKey,
          model ?? 'gpt-4.1',
        );
      case 'ollama':
        return new OpenAiCompatProvider(
          this.config.get<string>('AI_BASE_URL') ??
            'http://localhost:11434/v1',
          apiKey,
          model ?? 'qwen3:8b',
        );
      case 'llamacpp':
        return new OpenAiCompatProvider(
          this.config.get<string>('AI_BASE_URL') ?? 'http://localhost:8080/v1',
          apiKey,
          // llama.cpp serves whatever model it was started with
          model ?? 'default',
        );
      default:
        throw new ServiceUnavailableException(
          'No AI provider configured. Set AI_PROVIDER to "anthropic", "openai" or "llamacpp" in the environment.',
        );
    }
  }
}
