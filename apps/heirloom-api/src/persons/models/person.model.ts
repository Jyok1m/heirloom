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

  // Preferred given name ("prénom usuel") among firstName
  @Field(() => String, { nullable: true })
  usualName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;

  // Everyday / married name ("nom d'usage"), shown in place of lastName
  @Field(() => String, { nullable: true })
  usedName!: string | null;

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

  // Media id of the chosen profile picture, served via /api/media/:id/file
  @Field(() => ID, { nullable: true })
  photoMediaId!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
