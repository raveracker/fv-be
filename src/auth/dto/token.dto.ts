import { IsString } from 'class-validator';

export class JwtTokens {
  @IsString()
  token: string;

  @IsString()
  refreshToken: string;
}
