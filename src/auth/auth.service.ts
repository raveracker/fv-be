import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { User } from '../model/user.schema';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { JWTDecodedInterface } from './types/auth.types';
import { ConfigService } from '@nestjs/config';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { Resend } from 'resend';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VoidResponse } from './dto/void-response.dto';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  private resendService: Resend;
  private resendPasswordJwt: string | undefined;
  private resendPasswordJwtExpiration: string | undefined;

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.resendService = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.resendPasswordJwt = this.config.get<string>(
      'JWT_RESET_PASSWORD_SECRET',
    );
    this.resendPasswordJwtExpiration = this.config.get<string>(
      'JWT_RESET_PASSWORD_EXPIRATION',
    );
  }

  async signUp(signupDto: SignUpDto): Promise<AuthResponseDto> {
    const { name, email, password } = signupDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1) check for an *active* user only
    const existing = await this.userModel
      .findOne({ email, deletedAt: null })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const { token, refreshToken, tokenJti, refreshJti } = await this.getTokens({
      _id: user._id,
      email: user.email,
      name: user.name,
    });

    return { user, token, refreshToken, tokenJti, refreshJti };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userModel
      .findOne({ email, deletedAt: null })
      .exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new NotFoundException('User does not exist');
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, refreshToken, tokenJti, refreshJti } = await this.getTokens({
      _id: user._id,
      email: user.email,
      name: user.name,
    });

    return { user, token, refreshToken, tokenJti, refreshJti };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<VoidResponse> {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const jti = uuid();

    const token = await this.jwtService.signAsync(
      { sub: user._id, email: user.email, jti },
      {
        secret: this.resendPasswordJwt,
        expiresIn: this.resendPasswordJwtExpiration,
      },
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.resendService.emails.send({
      from:
        this.config.get<string>('EMAIL_FROM') ||
        'donotreply@info.punkadillo.com',
      to: user.email,
      subject: 'Reset your password',
      html: `
        <p>Hey ${user.name},</p>
        <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>
      `,
    });

    return { message: 'Forgot Password Email Sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<VoidResponse> {
    let payload: { sub: string; email: string; jti: string };
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: this.resendPasswordJwt,
      });
    } catch (err) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const jti = payload.jti;
    if (!jti) throw new BadRequestException('Malformed reset token');

    const alreadyUsed = await this.cacheManager.get(`blacklist:${jti}`);
    if (alreadyUsed) {
      throw new BadRequestException(
        'Invalid Token: Reset link has already been used',
      );
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    const ttl = 7 * 24 * 60 * 60;
    if (ttl > 0) {
      await this.cacheManager.set(`blacklist:${jti}`, true, ttl);
    }

    return { message: 'Reset Password Successful' };
  }

  async logout(token: string): Promise<VoidResponse> {
    const decoded = this.jwtService.decode(token, { complete: true }) as any;
    if (!decoded?.payload?.jti) {
      throw new BadRequestException('Invalid token');
    }

    const expSec = decoded.payload.exp as number;
    const nowSec = Math.floor(Date.now() / 1000);
    const ttl = expSec - nowSec;
    if (ttl <= 0) {
      return { message: 'Token already expired' };
    }

    await this.cacheManager.set(`blacklist:${decoded.payload.jti}`, true, ttl);

    return { message: 'Logged out successfully' };
  }

  private async getTokens(payload: JWTDecodedInterface): Promise<{
    token: string;
    refreshToken: string;
    tokenJti: string;
    refreshJti: string;
  }> {
    const tokenJti = uuid();
    const refreshJti = uuid();

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRATION'),
        jwtid: tokenJti,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRATION'),
        jwtid: refreshJti,
      }),
    ]);

    return { token, refreshToken, tokenJti, refreshJti };
  }
}
