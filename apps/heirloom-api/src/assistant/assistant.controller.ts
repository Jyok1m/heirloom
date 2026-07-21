import { Body, Controller, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

// REST (not GraphQL): agentic loop with multi-second latency, and a natural
// place to add streaming later.
@Controller('api/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  chat(@Body() body: ChatRequestDto) {
    return this.assistantService.chat(body);
  }
}
