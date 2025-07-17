// apps/server/src/user/user.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resend } from 'resend';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../model/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserDto } from './dto/user.dto';
import { VoidResponse } from 'src/auth/dto/void-response.dto';
import { IUserLean } from './types/IUserLean';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  private resendService: Resend;
  private verifyEmailJwt: string | undefined;
  private verifyEmailJwtExpiration: string | undefined;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.resendService = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.verifyEmailJwt = this.config.get<string>('JWT_VERIFY_EMAIL_SECRET');
    this.verifyEmailJwtExpiration = this.config.get<string>(
      'JWT_VERIFY_EMAIL_EXPIRATION',
    );
  }

  async getUserById(id: string): Promise<UserDto> {
    const user = await this.userModel
      .findById({ _id: id, deletedAt: null })
      .lean<IUserLean>()
      .select('-password -__v')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    const { _id, ...rest } = user;
    return { id: _id.toString(), ...rest };
  }

  async updateUserById(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        { _id: id, deletedAt: null },
        { ...dto, updatedAt: new Date() },
        { new: true, runValidators: true },
      )
      .lean<IUserLean>()
      .select('-password -__v')
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    const { _id, ...rest } = updated;
    return {
      id: _id.toString(),
      ...rest,
    };
  }

  async deleteUserById(id: string): Promise<VoidResponse> {
    const result = await this.userModel
      .findByIdAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
      )
      .exec();
    if (!result) throw new NotFoundException('User not found');
    return { message: 'User removed successfully' };
  }

  async changePasswordById(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<VoidResponse> {
    const user = await this.userModel
      .findById({ _id: userId, deletedAt: null })
      .exec();
    if (!user) throw new NotFoundException('User not found');

    const matches = await bcrypt.compare(dto.oldPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async verifyUserById(id: string): Promise<VoidResponse> {
    const user = await this.userModel
      .findById({ _id: id, deletedAt: null })
      .exec();
    if (!user) throw new NotFoundException('User not found');

    const jti = uuid();

    const token = await this.jwtService.signAsync(
      { sub: user._id, email: user.email, jti },
      { expiresIn: this.verifyEmailJwtExpiration, secret: this.verifyEmailJwt },
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.resendService.emails.send({
      from:
        this.config.get<string>('EMAIL_FROM') ||
        'donotreply@info.punkadillo.com',
      to: user.email,
      subject: 'Please verify your e-mail',
      html: `
        <p>Hey ${user.name},</p>
        <p>Click <a href="${verifyLink}">here</a> to confirm your e-mail address.</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    return { message: 'Email Verfication Sent' };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    let payload: { sub: string; email: string; jti: string };
    try {
      payload = await this.jwtService.verify(token, {
        secret: this.verifyEmailJwt,
      });
    } catch (err) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const jti = payload.jti;
    if (!jti) {
      throw new BadRequestException('Malformed verification token');
    }

    const used = await this.cacheManager.get(`blacklist:${jti}`);
    if (used) {
      throw new BadRequestException(
        'This verification link has already been used',
      );
    }

    const user = await this.userModel
      .findById({ _id: payload.sub, deletedAt: null })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    user.isVerified = true;
    await user.save();

    console.log('User', user);

    const ttl = 7 * 24 * 60 * 60;
    await this.cacheManager.set(`blacklist:${jti}`, true, ttl);

    return { message: 'Email verified successfully' };
  }
}
