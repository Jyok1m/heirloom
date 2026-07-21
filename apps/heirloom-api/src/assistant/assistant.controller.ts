import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

// REST (not GraphQL): agentic loop with multi-second latency, SSE streaming.
@Controller('api/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  chat(@Body() body: ChatRequestDto) {
    return this.assistantService.chat(body);
  }

  // Server-Sent Events: `token` (text delta), `tool` (executed action),
  // then `done` (same payload as POST /chat) or `error`.
  @Post('chat/stream')
  async chatStream(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.assistantService.chatStream(body, (event) => {
        if (event.type === 'token') send('token', { text: event.text });
        else send('tool', { tool: event.tool, ok: event.ok });
      });
      send('done', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send('error', { message });
    } finally {
      res.end();
    }
  }
}
