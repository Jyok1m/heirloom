import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MediaController } from './media.controller';
import { MediaStorageService } from './media-storage.service';
import {
  EventMediaResolver,
  MediaLinkResolver,
  MediaResolver,
  PersonMediaResolver,
  SourceMediaResolver,
  TreeMediaResolver,
} from './media.resolver';
import { MediaService } from './media.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      // Same tmp layout as MediaStorageService (providers of this module are
      // not injectable here); uploads land in tmp/ then move into the store
      useFactory: (config: ConfigService) => {
        const root = resolve(
          process.cwd(),
          config.get<string>('MEDIA_ROOT') ?? './data/media',
        );
        const tmpDir = join(root, 'tmp');
        mkdirSync(tmpDir, { recursive: true });
        return {
          storage: diskStorage({ destination: tmpDir }),
          limits: {
            fileSize:
              (config.get<number>('MAX_UPLOAD_MB') ?? 100) * 1024 * 1024,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [MediaController],
  providers: [
    MediaResolver,
    MediaLinkResolver,
    PersonMediaResolver,
    EventMediaResolver,
    SourceMediaResolver,
    TreeMediaResolver,
    MediaService,
    MediaStorageService,
  ],
  exports: [MediaService, MediaStorageService],
})
export class MediaModule {}
