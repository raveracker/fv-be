// apps/server/src/user/user.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';
import { VoidResponse } from 'src/auth/dto/void-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('users')
@ApiTags('User Managed Routes')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  getUserById(@Param('id') id: string): Promise<UserDto> {
    return this.users.getUserById(id);
  }

  @Patch(':id')
  updateUserById(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.users.updateUserById(id, dto);
  }

  @Delete(':id')
  deleteUserById(@Param('id') id: string): Promise<VoidResponse> {
    return this.users.deleteUserById(id);
  }

  @Get(':id/verify')
  verifyUserById(@Param('id') id: string): Promise<VoidResponse> {
    return this.users.verifyUserById(id);
  }

  @Patch(':id/password')
  changePasswordById(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<VoidResponse> {
    return this.users.changePasswordById(id, dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<VoidResponse> {
    return this.users.confirmEmail(dto.token);
  }
}
