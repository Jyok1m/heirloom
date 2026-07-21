import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MediaType } from '../../generated/prisma/enums';

@ObjectType()
export class Media {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  treeId!: string;

  @Field(() => String, { nullable: true })
  gedcomId!: string | null;

  @Field(() => MediaType)
  type!: MediaType;

  // Relative to the media root configured in the API; upload goes through REST
  @Field()
  filePath!: string;

  @Field()
  mimeType!: string;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class MediaLink {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  mediaId!: string;

  @Field(() => ID, { nullable: true })
  personId!: string | null;

  @Field(() => ID, { nullable: true })
  eventId!: string | null;

  @Field(() => ID, { nullable: true })
  sourceId!: string | null;
}
