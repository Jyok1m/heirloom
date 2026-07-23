import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Religion, Sex } from '../../generated/prisma/enums';

@ObjectType()
export class Person {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  treeId!: string;

  @Field(() => String, { nullable: true })
  gedcomId!: string | null;

  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;

  // Birth / maiden surname ("nom de naissance")
  @Field(() => String, { nullable: true })
  birthName!: string | null;

  @Field(() => String, { nullable: true })
  namePrefix!: string | null;

  @Field(() => String, { nullable: true })
  nameSuffix!: string | null;

  @Field(() => String, { nullable: true })
  nickname!: string | null;

  @Field(() => Sex)
  sex!: Sex;

  @Field(() => Religion)
  religion!: Religion;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field(() => String, { nullable: true })
  address!: string | null;

  @Field(() => String, { nullable: true })
  email!: string | null;

  @Field(() => String, { nullable: true })
  phone!: string | null;

  // Media id of the chosen profile picture, served via /api/media/:id/file
  @Field(() => ID, { nullable: true })
  photoMediaId!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
