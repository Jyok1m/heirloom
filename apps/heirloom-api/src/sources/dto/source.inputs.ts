import {
  Field,
  ID,
  InputType,
  Int,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateSourceInput {
  @Field(() => ID)
  @IsUUID()
  treeId!: string;

  @Field()
  @Length(1, 500)
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  author?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  publication?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  repository?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// treeId is immutable: a source never moves to another tree
@InputType()
export class UpdateSourceInput extends PartialType(
  OmitType(CreateSourceInput, ['treeId'] as const),
) {}

@InputType()
export class CreateCitationInput {
  @Field(() => ID)
  @IsUUID()
  eventId!: string;

  @Field(() => ID)
  @IsUUID()
  sourceId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  page?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  quality?: number;
}

@InputType()
export class UpdateCitationInput extends PartialType(
  OmitType(CreateCitationInput, ['eventId', 'sourceId'] as const),
) {}
