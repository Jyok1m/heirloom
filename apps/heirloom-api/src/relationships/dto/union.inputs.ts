import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Pedigree, UnionType } from '../../generated/prisma/enums';

@InputType()
export class CreateUnionInput {
  @Field(() => ID)
  @IsUUID()
  treeId!: string;

  @Field(() => UnionType, { nullable: true })
  @IsOptional()
  @IsEnum(UnionType)
  type?: UnionType;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// treeId is immutable: a union never moves to another tree
@InputType()
export class UpdateUnionInput extends PartialType(
  OmitType(CreateUnionInput, ['treeId'] as const),
) {}

@InputType()
export class UnionChildInput {
  @Field(() => ID)
  @IsUUID()
  unionId!: string;

  @Field(() => ID)
  @IsUUID()
  personId!: string;

  @Field(() => Pedigree, { nullable: true })
  @IsOptional()
  @IsEnum(Pedigree)
  pedigree?: Pedigree;
}
