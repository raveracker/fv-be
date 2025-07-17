// apps/server/src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    // create a mock AuthService
    authService = {
      signUp: jest.fn(),
      login: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('signUp', () => {
    it('should call authService.signUp and return its result', async () => {
      const dto: SignUpDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '1',
        name: dto.name,
        email: dto.email,
        password: dto.password,
        isVerified: false,
        deletedAt: null,
      } as any;

      const mockResponse: AuthResponseDto = {
        user: mockUser,
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      authService.signUp!.mockResolvedValueOnce(mockResponse);

      const result = await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockResponse);
    });

    it('should propagate errors from authService.signUp', async () => {
      const dto: SignUpDto = { name: '', email: '', password: '' };
      const err = new Error('sign up failed');
      authService.signUp!.mockRejectedValueOnce(err);

      await expect(controller.signUp(dto)).rejects.toThrow('sign up failed');
      expect(authService.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return its result', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '1',
        name: 'Test',
        email: dto.email,
        password: dto.password,
        isVerified: false,
        deletedAt: null,
      } as any;

      const mockResponse: AuthResponseDto = {
        user: mockUser,
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      authService.login!.mockResolvedValueOnce(mockResponse);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockResponse);
    });

    it('should propagate errors from authService.login', async () => {
      const dto: LoginDto = { email: '', password: '' };
      const err = new Error('login failed');
      authService.login!.mockRejectedValueOnce(err);

      await expect(controller.login(dto)).rejects.toThrow('login failed');
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    const dto: ForgotPasswordDto = { email: 'test@example.com' };

    it('should call service and return void', async () => {
      await expect(controller.forgotPassword(dto)).resolves.toBeUndefined();
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });

    it('should propagate NotFoundException', async () => {
      authService.forgotPassword!.mockRejectedValueOnce(
        new NotFoundException(),
      );
      await expect(controller.forgotPassword(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resetPassword', () => {
    const dto: ResetPasswordDto = { token: 'abc', newPassword: 'newPass123' };

    it('should call service and return void', async () => {
      await expect(controller.resetPassword(dto)).resolves.toBeUndefined();
      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });

    it('should propagate BadRequestException', async () => {
      authService.resetPassword!.mockRejectedValueOnce(
        new BadRequestException(),
      );
      await expect(controller.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
