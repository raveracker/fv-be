import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
    maxLength: 255,
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(3)
  @Matches(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, {
    message: 'Name must contain only letters, with single spaces between words',
  })
  readonly name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'user@email.com',
  })
  @IsString()
  @IsEmail({}, { message: 'Please enter correct email' })
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  readonly password: string;
}
