import {
  Field,
  ID,
  InputType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Religion, Sex } from '../../generated/prisma/enums';

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

  @Field(() => Religion, { nullable: true })
  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// treeId is immutable: a person never moves to another tree. photoMediaId is
// update-only (a new person has no photo): null clears it, a value must be a
// UUID, and the scalar FK keeps the Prisma update on the unchecked path.
@InputType()
export class UpdatePersonInput extends PartialType(
  OmitType(CreatePersonInput, ['treeId'] as const),
) {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  photoMediaId?: string | null;
}
