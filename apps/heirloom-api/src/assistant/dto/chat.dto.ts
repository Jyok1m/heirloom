import { IsOptional, IsUUID, Length } from 'class-validator';

export class ChatRequestDto {
  // The new user message; history is kept server-side per conversationId
  @Length(1, 20_000)
  message!: string;

  // Omit to let the assistant list/create trees and drive the onboarding
  @IsOptional()
  @IsUUID()
  treeId?: string;

  // Returned by the previous response; omit to start a new conversation
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
