import {
  Field,
  ID,
  InputType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Sex } from '../../generated/prisma/enums';

@InputType()
export class CreatePersonInput {
  @Field(() => ID)
  @IsUUID()
  treeId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(200)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(200)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  namePrefix?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  nameSuffix?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(200)
  nickname?: string;

  @Field(() => Sex, { nullable: true })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// treeId is immutable: a person never moves to another tree
@InputType()
export class UpdatePersonInput extends PartialType(
  OmitType(CreatePersonInput, ['treeId'] as const),
) {}
