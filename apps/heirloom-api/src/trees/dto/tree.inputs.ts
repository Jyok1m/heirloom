import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, Length, MaxLength } from 'class-validator';

@InputType()
export class CreateTreeInput {
  @Field()
  @Length(1, 200)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(10_000)
  description?: string;

  // Preset keys (validated softly by length; the frontend restricts the choice).
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(40)
  icon?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(40)
  color?: string;
}

@InputType()
export class UpdateTreeInput extends PartialType(CreateTreeInput) {}
