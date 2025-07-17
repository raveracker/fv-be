import { IsString } from 'class-validator';
import { User } from '../../model/user.schema';

export class AuthResponseDto {
  readonly user: User;


  @IsString()
  token: string;


  @IsString()
  refreshToken: string;
  @IsString()
  tokenJti: string;
  @IsString()
  refreshJti: string;
}
