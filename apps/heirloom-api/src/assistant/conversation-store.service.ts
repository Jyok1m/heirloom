import { Injectable } from '@nestjs/common';
import { ChatTurn } from './providers/provider.interface';

const TTL_MS = 60 * 60 * 1000; // 1 hour of inactivity
const MAX_CONVERSATIONS = 200;
const MAX_TURNS = 40;

// In-memory conversation history, keyed by conversationId. Good enough for a
// single-instance self-hosted app; conversations don't survive a restart.
@Injectable()
export class ConversationStore {
  private readonly conversations = new Map<
    string,
    { turns: ChatTurn[]; updatedAt: number }
  >();

  get(id: string): ChatTurn[] {
    this.prune();
    return this.conversations.get(id)?.turns.slice() ?? [];
  }

  set(id: string, turns: ChatTurn[]): void {
    this.conversations.set(id, {
      turns: turns.slice(-MAX_TURNS),
      updatedAt: Date.now(),
    });
    this.prune();
  }

  private prune(): void {
    const now = Date.now();
    for (const [id, conv] of this.conversations) {
      if (now - conv.updatedAt > TTL_MS) this.conversations.delete(id);
    }
    // Oldest first eviction beyond the cap (Map preserves insertion order)
    while (this.conversations.size > MAX_CONVERSATIONS) {
      const oldest = this.conversations.keys().next().value;
      if (!oldest) break;
      this.conversations.delete(oldest);
    }
  }
}
