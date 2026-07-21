import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @MaxLength(20_000)
  content!: string;
}

export class ChatRequestDto {
  // Omit to let the assistant list/create trees and drive the onboarding
  @IsOptional()
  @IsUUID()
  treeId?: string;

  // Full conversation history, last item being the new user message
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  messages!: ChatTurnDto[];
}
