import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatTurn } from './providers/provider.interface';

const MAX_TURNS = 40;

// Conversation history persisted in Postgres. A conversation belongs to the
// user who started it (or to the anonymous visitor when userId is null).
@Injectable()
export class ConversationStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string, userId: string | null): Promise<ChatTurn[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    // Wrong owner: behave like a fresh conversation instead of leaking it
    if (!conversation || conversation.userId !== userId) return [];
    return conversation.turns as unknown as ChatTurn[];
  }

  // Most recent conversation of a user, to resume where they left off
  async latest(
    userId: string,
  ): Promise<{ id: string; turns: ChatTurn[] } | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conversation) return null;
    return {
      id: conversation.id,
      turns: conversation.turns as unknown as ChatTurn[],
    };
  }

  async set(id: string, userId: string | null, turns: ChatTurn[]) {
    const payload = turns.slice(-MAX_TURNS) as unknown as Prisma.InputJsonValue;
    await this.prisma.conversation.upsert({
      where: { id },
      create: { id, userId, turns: payload },
      update: { turns: payload },
    });
  }
}
