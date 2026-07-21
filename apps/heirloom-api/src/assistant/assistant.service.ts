import { randomUUID } from 'node:crypto';
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TreeAccessService } from '../auth/tree-access.service';
import type { UserModel } from '../generated/prisma/models';
import { TreesService } from '../trees/trees.service';
import {
  AssistantContext,
  AssistantToolsService,
} from './assistant-tools.service';
import { ConversationStore } from './conversation-store.service';
import { ChatRequestDto } from './dto/chat.dto';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiCompatProvider } from './providers/openai-compat.provider';
import {
  AgentStreamEvent,
  AgentTool,
  ChatTurn,
  LlmAgentProvider,
} from './providers/provider.interface';

const SYSTEM_PROMPT = `You are the assistant of Heirloom, a self-hosted genealogy application.
You help the user explore and edit ONE family tree through the provided tools.

Guidelines:
- Answer questions about the family (who is who, parents, unions, children, life events) by looking the data up with the tools. Never invent facts: if the data is not in the tree, say so.
- When the user asks to record information (new family member, marriage, birth, death, occupation, notes...), use the tools to write it. Resolve the persons involved first with search_persons/get_person; if several persons match, ask the user which one they mean instead of guessing.
- Filiation goes through unions: to declare parents, create (or find) the union of the two parents and attach the child to it.
- Dates: store the user's wording in dateValue using GEDCOM style ("12 JAN 1875", "ABT 1850") and set dateSort to an approximate ISO date when possible.
- You cannot delete anything; tell the user deletions are done manually in the app.
- After writing, briefly confirm what was recorded.
- Keep replies short and conversational; no headers or long lists unless asked.
- Always reply in the language of the user.`;

const ANONYMOUS_CONTEXT = `The user is NOT authenticated, and you have no tools.
You may only:
- answer general questions about Heirloom itself (an open source, self-hosted genealogy application: family trees, persons, unions, life events, sources, media, GEDCOM compatibility, data stays on the user's own server);
- tell the user they must log in to talk about family data or use the assistant.
Never discuss, invent or guess any family data. Keep replies short.`;

export interface ChatResult {
  reply: string;
  actions: { tool: string; input: unknown; ok: boolean }[];
  treeId: string | null;
  conversationId: string;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly config: ConfigService,
    private readonly treesService: TreesService,
    private readonly toolsService: AssistantToolsService,
    private readonly store: ConversationStore,
    private readonly access: TreeAccessService,
  ) {}

  chat(request: ChatRequestDto, user?: UserModel): Promise<ChatResult> {
    return this.run(request, user, undefined);
  }

  chatStream(
    request: ChatRequestDto,
    user: UserModel | undefined,
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<ChatResult> {
    return this.run(request, user, onEvent);
  }

  private async run(
    { message, treeId, conversationId }: ChatRequestDto,
    user: UserModel | undefined,
    onEvent?: (event: AgentStreamEvent) => void,
  ): Promise<ChatResult> {
    const provider = this.buildProvider();
    const ctx: AssistantContext = {};

    let tools: AgentTool[] = [];
    let context: string;

    if (!user) {
      // Anonymous: no tools, general facts about Heirloom only
      context = ANONYMOUS_CONTEXT;
      treeId = undefined;
    } else {
      const allowedTreeIds = await this.access.accessibleTreeIds(user);
      const writableTreeIds = await this.access.writableTreeIds(user);
      const isAdmin = writableTreeIds === undefined;
      if (treeId) await this.access.assertView(user, treeId);
      const canWriteHere = treeId
        ? isAdmin || writableTreeIds.includes(treeId)
        : isAdmin || (writableTreeIds?.length ?? 0) > 0;

      tools = this.toolsService.buildTools({
        treeId,
        ctx,
        user,
        allowedTreeIds,
        writableTreeIds,
      });

      if (treeId) {
        const tree = await this.treesService.findOne(treeId);
        context = `Current family tree: "${tree.name}" (id ${tree.id}).`;
      } else if (isAdmin) {
        context = `No family tree is selected yet. Start by listing the existing trees (list_trees) or creating one (create_tree), then pass its treeId to the other tools. Guide the user step by step: create the tree, then their first persons, unions and events.`;
      } else {
        context = `No family tree is selected yet. List the trees the user can access (list_trees) and answer questions about them.`;
      }
      if (!canWriteHere) {
        context += `\nThe user has READ-ONLY access here: answer questions, but any request to add or modify data must be politely declined — an admin or a contributor must do it.`;
      } else if (!isAdmin) {
        context += `\nThe user is a CONTRIBUTOR: they can add and modify persons, unions and events on their trees, but deletions are reserved to admins.`;
      }
    }

    // Anonymous conversations are not persisted (no memory before login)
    const userId = user?.id ?? null;
    const convId = conversationId ?? randomUUID();
    const messages: ChatTurn[] = [
      ...(user ? await this.store.get(convId, userId) : []),
      { role: 'user', content: message },
    ];

    const options = {
      system: `${SYSTEM_PROMPT}\n\n${context}`,
      messages,
      tools,
    };

    const result =
      onEvent && provider.runAgentStream
        ? await provider.runAgentStream(options, onEvent)
        : await provider.runAgent(options);

    if (user) {
      await this.store.set(convId, userId, [
        ...messages,
        { role: 'assistant', content: result.reply },
      ]);
    }

    return {
      reply: result.reply,
      actions: result.actions,
      // The tree the conversation is (now) about, so the client can pin it
      treeId: treeId ?? ctx.createdTreeId ?? null,
      conversationId: convId,
    };
  }

  // Empty strings in .env (AI_BASE_URL=) must behave like unset variables
  private env(key: string): string | undefined {
    const value = this.config.get<string>(key)?.trim();
    return value ? value : undefined;
  }

  // AI_PROVIDER: anthropic | openai | ollama | llamacpp
  private buildProvider(): LlmAgentProvider {
    const provider = this.env('AI_PROVIDER');
    const apiKey = this.env('AI_API_KEY');
    const model = this.env('AI_MODEL');
    const reasoningEffort = this.env('AI_REASONING_EFFORT');

    switch (provider) {
      case 'anthropic':
        return new AnthropicProvider(apiKey, model ?? 'claude-opus-4-8');
      case 'openai':
        return new OpenAiCompatProvider(
          this.env('AI_BASE_URL') ?? 'https://api.openai.com/v1',
          apiKey,
          model ?? 'gpt-5-mini',
          reasoningEffort,
        );
      case 'ollama':
        return new OpenAiCompatProvider(
          this.env('AI_BASE_URL') ?? 'http://localhost:11434/v1',
          apiKey,
          model ?? 'qwen3:4b',
          reasoningEffort,
        );
      case 'llamacpp':
        return new OpenAiCompatProvider(
          this.env('AI_BASE_URL') ?? 'http://localhost:8080/v1',
          apiKey,
          // llama.cpp serves whatever model it was started with
          model ?? 'default',
          reasoningEffort,
        );
      default:
        throw new ServiceUnavailableException(
          'No AI provider configured. Set AI_PROVIDER to "anthropic", "openai", "ollama" or "llamacpp" in the environment.',
        );
    }
  }
}
