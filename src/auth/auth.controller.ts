import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './decorators/public.decorator';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VoidResponse } from './dto/void-response.dto';

@Controller('auth')
@ApiTags('User Auth And Onboarding Routes')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/signup')
  @ApiOkResponse({ type: AuthResponseDto })
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('/login')
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @ApiResponse({ status: HttpStatus.OK, description: 'Email sent' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<VoidResponse> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Patch('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<VoidResponse> {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization header missing or invalid');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.logout(token);
  }
}
