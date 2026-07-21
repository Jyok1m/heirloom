import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Source {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  treeId!: string;

  @Field(() => String, { nullable: true })
  gedcomId!: string | null;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  author!: string | null;

  @Field(() => String, { nullable: true })
  publication!: string | null;

  @Field(() => String, { nullable: true })
  repository!: string | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class Citation {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  sourceId!: string;

  // GEDCOM PAGE: where in the source
  @Field(() => String, { nullable: true })
  page!: string | null;

  // GEDCOM QUAY 0-3: reliability of the citation
  @Field(() => Int, { nullable: true })
  quality!: number | null;
}
