import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '60f7c0d2b3a4f12d4c8e2f90',
  })
  id: string;

  @ApiProperty({
    description: 'The user’s email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Has the user completed email verification?',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2025-07-05T14:23:30.123Z',
  })
  updatedAt: Date;
}
