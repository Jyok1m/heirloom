import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { UserModel } from '../generated/prisma/models';
import { TreeRole } from '../generated/prisma/enums';
import { AuthService } from './auth.service';
import { CurrentUser, Public, Roles } from './decorators';
import {
  CreateAccountDto,
  CreateInvitationDto,
  LoginDto,
} from './dto/auth.dto';

const COOKIE = 'heirloom_token';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000,
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // First run only: creates the initial admin account
  @Public()
  @Post('setup')
  async setup(
    @Body() body: CreateAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.setupFirstAdmin(
      body.email,
      body.password,
      body.displayName,
    );
    res.cookie(COOKIE, result.token, COOKIE_OPTS);
    return result;
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie(COOKIE, result.token, COOKIE_OPTS);
    return result;
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: UserModel) {
    return this.authService.safe(user);
  }

  @Roles('ADMIN')
  @Post('admins')
  createAdmin(@Body() body: CreateAccountDto) {
    return this.authService.createAdmin(
      body.email,
      body.password,
      body.displayName,
    );
  }

  // ------------------------------------------------------------ invitations

  @Roles('ADMIN')
  @Post('invitations')
  createInvitation(
    @CurrentUser() user: UserModel,
    @Body() body: CreateInvitationDto,
  ) {
    return this.authService.createInvitation(
      user,
      body.treeId,
      body.role as TreeRole,
      body.expiresInDays,
    );
  }

  @Public()
  @Get('invitations/:token')
  async getInvitation(@Param('token') token: string) {
    const invitation = await this.authService.getInvitation(token);
    return {
      treeName: invitation.tree.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  // Anonymous: body carries email/password to create the account.
  // Logged in: empty body, the membership is added to the current user.
  @Public()
  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: UserModel | undefined,
    @Body() body: Partial<CreateAccountDto>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvitation(
      token,
      user,
      body.email && body.password
        ? {
            email: body.email,
            password: body.password,
            displayName: body.displayName,
          }
        : undefined,
    );
    if (result.token) res.cookie(COOKIE, result.token, COOKIE_OPTS);
    return result;
  }
}
