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
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(3)
  @Matches(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/, {
    message: 'Name must contain only letters, with single spaces between words',
  })
  readonly name: string;

  @IsString()
  @IsEmail({}, { message: 'Please enter correct email' })
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  readonly password: string;
}
