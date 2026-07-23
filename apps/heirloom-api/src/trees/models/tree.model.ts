import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Tree {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  icon!: string | null;

  @Field(() => String, { nullable: true })
  color!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
