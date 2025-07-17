import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Old/Existing Password of the user',
    example: 'abc123',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New Password of the user',
    example: 'abc123443',
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  newPassword: string;
}
