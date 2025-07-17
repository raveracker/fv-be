import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token provided in the email for verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cC',
  })
  @IsString()
  token: string;
}
