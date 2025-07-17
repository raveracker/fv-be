import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'abc@efg.ere',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
