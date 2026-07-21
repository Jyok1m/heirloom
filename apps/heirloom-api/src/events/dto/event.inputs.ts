import {
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EventType } from '../../generated/prisma/enums';

@InputType()
export class CreateEventInput {
  @Field(() => EventType)
  @IsEnum(EventType)
  type!: EventType;

  // Exactly one of personId / unionId, enforced in the service
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  unionId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(100)
  dateValue?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateSort?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  place?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(20_000)
  notes?: string;
}

// An event never moves to another person or union
@InputType()
export class UpdateEventInput extends PartialType(
  OmitType(CreateEventInput, ['personId', 'unionId'] as const),
) {}
