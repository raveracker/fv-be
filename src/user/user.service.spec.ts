// apps/server/src/user/user.service.spec.ts

import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Mock bcryptjs methods
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock Resend client
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue(undefined) },
  })),
}));

describe('UserService', () => {
  let service: UserService;
  let userModel: Partial<Record<keyof Model<any>, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let configService: Partial<Record<keyof ConfigService, jest.Mock>>;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock Mongoose model methods
    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    // Mock JWT methods
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    // Mock ConfigService
    configService = {
      get: jest.fn(),
    };

    // Instantiate the service
    service = new UserService(
      userModel as any,
      jwtService as any,
      configService as any,
    );

    // Spy on the resendService.emails.send method
    sendSpy = jest
      .spyOn(service['resendService'].emails, 'send')
      .mockResolvedValue({
        data: { id: 'email-id' },
        error: null,
      });
  });

  describe('getUserById', () => {
    it('returns a user when found', async () => {
      const mockUser = {
        _id: '1',
        name: 'A',
        email: 'a@b',
        deletedAt: null,
        isVerified: false,
      };
      userModel.findById!.mockReturnValueOnce({
        lean: () => ({ exec: jest.fn().mockResolvedValue(mockUser) }),
      });

      await expect(service.getUserById('1')).resolves.toBe(mockUser);
    });

    it('throws NotFoundException when no user', async () => {
      userModel.findById!.mockReturnValueOnce({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      });

      await expect(service.getUserById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserById', () => {
    const dto: UpdateUserDto = { name: 'B' };

    it('returns updated user when found', async () => {
      const updated = { _id: '1', ...dto, deletedAt: null, isVerified: false };
      userModel.findByIdAndUpdate!.mockReturnValueOnce({
        lean: () => ({ exec: jest.fn().mockResolvedValue(updated) }),
      });

      await expect(service.updateUserById('1', dto)).resolves.toBe(updated);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ ...dto, updatedAt: expect.any(Date) }),
        { new: true, runValidators: true },
      );
    });

    it('throws NotFoundException when no doc to update', async () => {
      userModel.findByIdAndUpdate!.mockReturnValueOnce({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      });

      await expect(service.updateUserById('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUserById', () => {
    it('resolves when user found', async () => {
      userModel.findByIdAndUpdate!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({}),
      });

      await expect(service.deleteUserById('1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when no user', async () => {
      userModel.findByIdAndUpdate!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deleteUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyUserById', () => {
    const mockUser = { _id: '1', name: 'C', email: 'c@d' };

    beforeEach(() => {
      configService.get!.mockImplementation((key) =>
        key === 'FRONTEND_URL' ? 'https://app.test' : 'no-reply@test.com',
      );
      (jwtService.sign as jest.Mock).mockReturnValue('token123');
    });

    it('sends email when user exists', async () => {
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.verifyUserById('1');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser._id, email: mockUser.email },
        { expiresIn: '24h' },
      );
      expect(sendSpy).toHaveBeenCalledWith({
        from: 'no-reply@test.com',
        to: mockUser.email,
        subject: 'Please verify your e-mail',
        html: expect.stringContaining(
          'Click <a href="https://app.test/verify-email?token=token123',
        ),
      });
    });

    it('throws NotFoundException when user missing', async () => {
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.verifyUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePasswordById', () => {
    const dto: ChangePasswordDto = {
      oldPassword: 'old',
      newPassword: 'newpass',
    };

    it('throws NotFoundException when no user', async () => {
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.changePasswordById('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException on wrong old password', async () => {
      const userDoc = { password: 'hashed', save: jest.fn() };
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(userDoc),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePasswordById('1', dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('hashes & saves new password on match', async () => {
      const userDoc: any = { password: 'hashed', save: jest.fn() };
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(userDoc),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');

      await service.changePasswordById('1', dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
      expect(userDoc.password).toBe('newHashed');
      expect(userDoc.save).toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('throws BadRequestException on invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      await expect(service.confirmEmail('bad')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when user missing', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: '1',
        email: 'a@b',
      });
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.confirmEmail('tok')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns "already verified" when isVerified true', async () => {
      const userDoc: any = { isVerified: true, save: jest.fn() };
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: '1',
        email: 'a@b',
      });
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(userDoc),
      });

      await expect(service.confirmEmail('tok')).resolves.toEqual({
        message: 'Email is already verified',
      });
      expect(userDoc.save).not.toHaveBeenCalled();
    });

    it('marks verified and saves when first time', async () => {
      const userDoc: any = {
        isVerified: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: '1',
        email: 'a@b',
      });
      userModel.findById!.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(userDoc),
      });

      await expect(service.confirmEmail('tok')).resolves.toEqual({
        message: 'Email verified successfully',
      });
      expect(userDoc.isVerified).toBe(true);
      expect(userDoc.save).toHaveBeenCalled();
    });
  });
});
