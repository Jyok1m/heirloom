import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Pedigree, UnionType } from '../../generated/prisma/enums';

@ObjectType()
export class Union {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  treeId!: string;

  @Field(() => String, { nullable: true })
  gedcomId!: string | null;

  @Field(() => UnionType)
  type!: UnionType;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

// A child link carries its pedigree (birth, adopted, foster)
@ObjectType()
export class UnionChild {
  @Field(() => ID)
  unionId!: string;

  @Field(() => ID)
  personId!: string;

  @Field(() => Pedigree)
  pedigree!: Pedigree;
}
