import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';
import { UserStatus } from './entities/status.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    update: jest.Mock;
    findAndCount: jest.Mock;
  };

  const target = (role: Role) =>
    ({ id: 10, username: 'target', role, status: UserStatus.Active }) as User;

  const actor = (role: Role) => ({ sub: 1, role });

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: ConfigService, useValue: { get: jest.fn(() => 10) } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('иерархия ролей при блокировке', () => {
    it('админ блокирует обычного пользователя', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.User));

      await service.blockUser(10, actor(Role.Admin));

      expect(repo.update).toHaveBeenCalledWith(10, {
        status: UserStatus.Blocked,
        hashedRefreshToken: null,
      });
    });

    it('админ не может заблокировать суперадмина', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.SuperAdmin));

      await expect(service.blockUser(10, actor(Role.Admin))).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('админ не может заблокировать равного по роли админа', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.Admin));

      await expect(service.blockUser(10, actor(Role.Admin))).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('суперадмин блокирует админа', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.Admin));

      await service.blockUser(10, actor(Role.SuperAdmin));

      expect(repo.update).toHaveBeenCalled();
    });

    it('несуществующая роль инициатора не даёт прав', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.User));

      await expect(
        service.blockUser(10, { sub: 1, role: 'root' as Role }),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('несуществующего пользователя блокировать нельзя', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.blockUser(10, actor(Role.SuperAdmin)),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('иерархия ролей при разблокировке', () => {
    it('админ не может разблокировать суперадмина', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.SuperAdmin));

      await expect(service.unBlockUser(10, actor(Role.Admin))).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('суперадмин разблокирует админа', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.Admin));

      await service.unBlockUser(10, actor(Role.SuperAdmin));

      expect(repo.update).toHaveBeenCalledWith(10, {
        status: UserStatus.Active,
      });
    });
  });

  describe('иерархия ролей при сбросе пароля', () => {
    it('админ не может сбросить пароль суперадмину', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.SuperAdmin));

      await expect(
        service.resetPassword(10, actor(Role.Admin)),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('суперадмин сбрасывает пароль админу и обнуляет его сессию', async () => {
      repo.findOneBy.mockResolvedValue(target(Role.Admin));

      const result = await service.resetPassword(10, actor(Role.SuperAdmin));

      expect(result.temporaryPassword).toEqual(expect.any(String));
      expect(repo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ hashedRefreshToken: null }),
      );
    });
  });
});
