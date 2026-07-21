import { randomBytes } from 'node:crypto';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { TreeAccessService } from './tree-access.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => {
        let secret = config.get<string>('AUTH_JWT_SECRET')?.trim();
        if (!secret) {
          // Sessions won't survive a restart without a configured secret
          secret = randomBytes(32).toString('hex');
          new Logger('AuthModule').warn(
            'AUTH_JWT_SECRET is not set: using a random secret, all sessions will be invalidated on restart',
          );
        }
        return { secret, signOptions: { expiresIn: '7d' } };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TreeAccessService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService, TreeAccessService],
})
export class AuthModule {}
