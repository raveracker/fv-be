import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JwtTokens {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    maxLength: 2048,
    minLength: 100,
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    maxLength: 2048,
    minLength: 100,
  })
  @IsString()
  refreshToken: string;
}
