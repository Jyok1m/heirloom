import { registerEnumType } from '@nestjs/graphql';
import {
  EventType,
  MediaType,
  Pedigree,
  Sex,
  UnionType,
} from '../generated/prisma/enums';

registerEnumType(Sex, { name: 'Sex' });
registerEnumType(UnionType, { name: 'UnionType' });
registerEnumType(Pedigree, { name: 'Pedigree' });
registerEnumType(EventType, { name: 'EventType' });
registerEnumType(MediaType, { name: 'MediaType' });
