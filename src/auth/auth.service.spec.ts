// apps/server/src/auth/auth.service.spec.ts
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';

import { AuthService } from './auth.service';
import { User } from '../model/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// 1) Mock bcryptjs & Resend
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-1' }) },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;
  let configService: any;
  let resendSendSpy: jest.SpyInstance;

  beforeEach(async () => {
    // 2) stub out the Mongoose model
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    // 3) stub JwtService & ConfigService
    jwtService = {
      signAsync: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'RESEND_API_KEY':
            return 're_abc';
          case 'FRONTEND_URL':
            return 'https://front.test';
          case 'EMAIL_FROM':
            return 'no-reply@test.com';
          case 'JWT_SECRET':
            return 'sec';
          case 'JWT_EXPIRATION':
            return '15m';
          case 'JWT_REFRESH_SECRET':
            return 'rsec';
          case 'JWT_REFRESH_EXPIRATION':
            return '7d';
          default:
            return '';
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
    // capture the service’s own resendService.emails.send
    resendSendSpy = jest.spyOn(service['resendService'].emails, 'send');
  });

  afterEach(() => jest.clearAllMocks());

  // ----- signUp() -----
  describe('signUp()', () => {
    const dto: SignUpDto = {
      name: 'Alice',
      email: 'a@b.com',
      password: 'pw1234',
    };

    it('throws ConflictException if active user found', async () => {
      userModel.findOne.mockReturnValueOnce({
        lean: () => ({ exec: () => Promise.resolve({}) }),
      });

      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: dto.email,
        deletedAt: null,
      });
    });

    it('creates user and returns tokens', async () => {
      // no existing user
      userModel.findOne.mockReturnValueOnce({
        lean: () => ({ exec: () => Promise.resolve(null) }),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hPw');
      const fakeUser = {
        _id: 'u1',
        name: dto.name,
        email: dto.email,
        password: 'hPw',
      };
      userModel.create.mockResolvedValueOnce(fakeUser);
      // token generation
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('t1')
        .mockResolvedValueOnce('rt1');

      const res = await service.signUp(dto);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(userModel.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: 'hPw',
      });
      expect(res).toEqual({ user: fakeUser, token: 't1', refreshToken: 'rt1' });
    });
  });

  // ----- login() -----
  describe('login()', () => {
    const dto: LoginDto = { email: 'x@y.com', password: 'pw' };

    it('throws UnauthorizedException if no user', async () => {
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve(null),
      });
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException if deletedAt set', async () => {
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve({ password: 'h', deletedAt: new Date() }),
      });
      await expect(service.login(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException on bad password', async () => {
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve({ password: 'h', deletedAt: null }),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on valid creds', async () => {
      const userRec = {
        _id: 'u2',
        name: 'Bob',
        email: dto.email,
        password: 'h',
        deletedAt: null,
      };
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve(userRec),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('t2')
        .mockResolvedValueOnce('rt2');

      const res = await service.login(dto);
      expect(res).toEqual({ user: userRec, token: 't2', refreshToken: 'rt2' });
    });
  });

  // ----- forgotPassword() -----
  describe('forgotPassword()', () => {
    const dto: ForgotPasswordDto = { email: 'c@d.com' };

    it('throws NotFoundException if no user', async () => {
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve(null),
      });
      await expect(service.forgotPassword(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('sends reset link when user exists', async () => {
      const userRec = { _id: 'u3', name: 'Carol', email: dto.email };
      userModel.findOne.mockReturnValueOnce({
        exec: () => Promise.resolve(userRec),
      });
      (jwtService.signAsync as jest.Mock).mockResolvedValue('rTk');

      await service.forgotPassword(dto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: userRec._id, email: userRec.email },
        { expiresIn: '1h' },
      );
      expect(resendSendSpy).toHaveBeenCalledWith({
        from: 'no-reply@test.com',
        to: userRec.email,
        subject: 'Reset your password',
        html: expect.stringContaining(
          `<a href="https://front.test/reset-password?token=rTk"`,
        ),
      });
    });
  });

  // ----- resetPassword() -----
  describe('resetPassword()', () => {
    const dto: ResetPasswordDto = { token: 'bad.tok', newPassword: 'newpw' };

    it('throws BadRequestException on invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error();
      });
      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if user missing', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'u4',
        email: 'e',
      });
      userModel.findById.mockReturnValueOnce({
        exec: () => Promise.resolve(null),
      });
      await expect(service.resetPassword(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('hashes & saves new password', async () => {
      const doc: any = { save: jest.fn() };
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'u5',
        email: 'e',
      });
      userModel.findById.mockReturnValueOnce({
        exec: () => Promise.resolve(doc),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('newH');

      await service.resetPassword(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
      expect(doc.password).toBe('newH');
      expect(doc.save).toHaveBeenCalled();
    });
  });

  // ----- getTokens() -----
  describe('getTokens()', () => {
    it('signs two tokens with correct secrets/expirations', async () => {
      const p = { _id: 'u6', email: 'z@z', name: 'Zed' };
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('tok1')
        .mockResolvedValueOnce('rtok1');

      const out = await service.getTokens(p);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, p, {
        secret: 'sec',
        expiresIn: '15m',
      });
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, p, {
        secret: 'rsec',
        expiresIn: '7d',
      });
      expect(out).toEqual({ token: 'tok1', refreshToken: 'rtok1' });
    });
  });
});
