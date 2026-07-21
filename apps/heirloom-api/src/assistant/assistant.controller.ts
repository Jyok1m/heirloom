import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, Public } from '../auth/decorators';
import type { UserModel } from '../generated/prisma/models';
import { AssistantService } from './assistant.service';
import { ConversationStore } from './conversation-store.service';
import { ChatRequestDto } from './dto/chat.dto';

// REST (not GraphQL): agentic loop with multi-second latency, SSE streaming.
// Public on purpose: anonymous visitors get a no-tools assistant that only
// talks about Heirloom and asks them to log in.
@Controller('api/assistant')
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly store: ConversationStore,
  ) {}

  // Most recent conversation of the user, to resume on page load.
  // Declared before :id so "latest" is not parsed as a UUID.
  @Get('conversations/latest')
  async latestConversation(@CurrentUser() user: UserModel) {
    const latest = await this.store.latest(user.id);
    return latest ?? { id: null, turns: [] };
  }

  // History of one of the user's conversations (empty if not theirs)
  @Get('conversations/:id')
  async conversation(
    @CurrentUser() user: UserModel,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { turns: await this.store.get(id, user.id) };
  }

  @Public()
  @Post('chat')
  chat(@CurrentUser() user: UserModel | undefined, @Body() body: ChatRequestDto) {
    return this.assistantService.chat(body, user);
  }

  // Server-Sent Events: `token` (text delta), `tool` (executed action),
  // then `done` (same payload as POST /chat) or `error`.
  @Public()
  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: UserModel | undefined,
    @Body() body: ChatRequestDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.assistantService.chatStream(
        body,
        user,
        (event) => {
          if (event.type === 'token') send('token', { text: event.text });
          else send('tool', { tool: event.tool, ok: event.ok });
        },
      );
      send('done', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send('error', { message });
    } finally {
      res.end();
    }
  }
}
