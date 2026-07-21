import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @Length(1, 200)
  password!: string;
}

export class CreateAccountDto {
  @IsEmail()
  email!: string;

  @Length(8, 200)
  password!: string;

  @IsOptional()
  @MaxLength(200)
  displayName?: string;
}

export class CreateInvitationDto {
  @IsUUID()
  treeId!: string;

  @IsIn(['VIEWER', 'CONTRIBUTOR'])
  role!: 'VIEWER' | 'CONTRIBUTOR';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  expiresInDays?: number;
}
