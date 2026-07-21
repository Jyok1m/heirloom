import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID, Length, MaxLength } from 'class-validator';
import { MediaType } from '../../generated/prisma/enums';

@InputType()
export class CreateMediaInput {
  @Field(() => ID)
  @IsUUID()
  treeId!: string;

  @Field(() => MediaType)
  @IsEnum(MediaType)
  type!: MediaType;

  @Field()
  @Length(1, 1000)
  filePath!: string;

  @Field()
  @Length(1, 255)
  mimeType!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// treeId is immutable: a media item never moves to another tree
@InputType()
export class UpdateMediaInput extends PartialType(
  OmitType(CreateMediaInput, ['treeId'] as const),
) {}

@InputType()
export class LinkMediaInput {
  @Field(() => ID)
  @IsUUID()
  mediaId!: string;

  // Exactly one target, enforced in the service
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
