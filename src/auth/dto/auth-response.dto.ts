import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from '../../model/user.schema';

export class AuthResponseDto {
  @ApiProperty({
    description: 'The User object containing user details',
    example: {
      email: 'johndoe@email.com',
      password: '$2b$10$YGCj0MtSslt8u4k7a.qoIeBbzIhJFpwiZEQNB4FnRQwdKkyEbN9P6',
      name: 'John Doe',
      isVerified: false,
      deletedAt: null,
      _id: '6834d14acc346ad3772bc3ba',
      updatedAt: '2025-05-26T20:38:34.193Z',
      createdAt: '2025-05-26T20:38:34.193Z',
    },
    type: User,
  })
  readonly user: User;

  @ApiProperty({
    description: 'The JWT access token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    maxLength: 2048,
    minLength: 100,
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The JWT refresh token for the user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    maxLength: 2048,
    minLength: 100,
  })
  @IsString()
  refreshToken: string;
  @IsString()
  tokenJti: string;
  @IsString()
  refreshJti: string;
}
