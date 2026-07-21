import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { EventType } from '../../generated/prisma/enums';

@ObjectType()
export class Event {
  @Field(() => ID)
  id!: string;

  @Field(() => EventType)
  type!: EventType;

  @Field(() => String, { nullable: true })
  description!: string | null;

  // Verbatim GEDCOM date ("ABT 1850", "BET 1912 AND 1914")
  @Field(() => String, { nullable: true })
  dateValue!: string | null;

  // Derived approximate date, only for sorting and range queries
  @Field(() => GraphQLISODateTime, { nullable: true })
  dateSort!: Date | null;

  @Field(() => String, { nullable: true })
  place!: string | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field(() => ID, { nullable: true })
  personId!: string | null;

  @Field(() => ID, { nullable: true })
  unionId!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
