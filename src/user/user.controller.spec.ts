import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;

  beforeEach(async () => {
    userService = {
      getUserById: jest.fn(),
      updateUserById: jest.fn(),
      deleteUserById: jest.fn(),
      verifyUserById: jest.fn(),
      changePasswordById: jest.fn(),
      confirmEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('getUserById', () => {
    it('returns user from service', async () => {
      const result = { id: '1', name: 'Test' };
      userService.getUserById!.mockResolvedValue(result);

      await expect(controller.getUserById('1')).resolves.toBe(result);
      expect(userService.getUserById).toHaveBeenCalledWith('1');
    });

    it('propagates errors', async () => {
      userService.getUserById!.mockRejectedValue(new NotFoundException());

      await expect(controller.getUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserById', () => {
    it('returns updated user', async () => {
      const dto: UpdateUserDto = { name: 'New', email: 'new@example.com' };
      const result = { id: '1', ...dto };
      userService.updateUserById!.mockResolvedValue(result);

      await expect(controller.updateUserById('1', dto)).resolves.toBe(result);
      expect(userService.updateUserById).toHaveBeenCalledWith('1', dto);
    });

    it('propagates errors', async () => {
      const dto: UpdateUserDto = { name: '', email: '' };
      userService.updateUserById!.mockRejectedValue(new NotFoundException());

      await expect(controller.updateUserById('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUserById', () => {
    it('calls service and resolves', async () => {
      userService.deleteUserById!.mockResolvedValue(undefined);

      await expect(controller.deleteUserById('1')).resolves.toBeUndefined();
      expect(userService.deleteUserById).toHaveBeenCalledWith('1');
    });

    it('propagates errors', async () => {
      userService.deleteUserById!.mockRejectedValue(new NotFoundException());

      await expect(controller.deleteUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyUserById', () => {
    it('calls verify on service', async () => {
      userService.verifyUserById!.mockResolvedValue(undefined);

      await expect(controller.verifyUserById('1')).resolves.toBeUndefined();
      expect(userService.verifyUserById).toHaveBeenCalledWith('1');
    });

    it('propagates errors', async () => {
      userService.verifyUserById!.mockRejectedValue(new NotFoundException());

      await expect(controller.verifyUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePasswordById', () => {
    it('calls changePassword on service', async () => {
      const dto: ChangePasswordDto = {
        oldPassword: 'old',
        newPassword: 'new1234',
      };
      userService.changePasswordById!.mockResolvedValue(undefined);

      await expect(
        controller.changePasswordById('1', dto),
      ).resolves.toBeUndefined();
      expect(userService.changePasswordById).toHaveBeenCalledWith('1', dto);
    });

    it('propagates errors', async () => {
      const dto: ChangePasswordDto = { oldPassword: '', newPassword: '' };
      userService.changePasswordById!.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.changePasswordById('1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('calls confirmEmail on service', async () => {
      userService.confirmEmail!.mockResolvedValue({ message: 'ok' });

      await expect(controller.verifyEmail('tok123')).resolves.toEqual({
        message: 'ok',
      });
      expect(userService.confirmEmail).toHaveBeenCalledWith('tok123');
    });

    it('propagates errors', async () => {
      userService.confirmEmail!.mockRejectedValue(new NotFoundException());

      await expect(controller.verifyEmail('tok123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
