import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from '../verification/verification.service';
import { UserStatus } from '../users/entities/status.enum';
import { Role } from '../users/entities/role.enum';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findOne: jest.Mock;
    create: jest.Mock;
    setRefreshTokenHash: jest.Mock;
  };
  let verificationService: {
    verifyLoginLocation: jest.Mock;
    recordLocation: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  const request = { socket: { remoteAddress: '1.2.3.4' } } as Request;

  const existingUser = {
    id: 7,
    username: 'Alexandr',
    role: Role.User,
    status: UserStatus.Active,
    hashedPassword: 'hash',
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
      setRefreshTokenHash: jest.fn(),
    };
    verificationService = {
      verifyLoginLocation: jest.fn(),
      recordLocation: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'value') } },
        { provide: VerificationService, useValue: verificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
  });

  afterEach(() => jest.clearAllMocks());

  describe('signIn', () => {
    it('проверяет локацию входа и выдаёт пару токенов', async () => {
      usersService.findOne.mockResolvedValue(existingUser);

      const tokens = await service.signIn('Alexandr', 'strongpass', request);

      expect(verificationService.verifyLoginLocation).toHaveBeenCalledWith(
        existingUser,
        request,
      );
      expect(tokens).toEqual({
        access_token: 'token',
        refresh_token: 'token',
      });
    });

    it('не выдаёт токены, если верификация локации прервала вход', async () => {
      usersService.findOne.mockResolvedValue(existingUser);
      verificationService.verifyLoginLocation.mockRejectedValue(
        new UnauthorizedException('Требуется подтверждение'),
      );

      await expect(
        service.signIn('Alexandr', 'strongpass', request),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(usersService.setRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('не доходит до проверки локации при неверном пароле', async () => {
      usersService.findOne.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn('Alexandr', 'wrongpass', request),
      ).rejects.toThrow(UnauthorizedException);

      expect(verificationService.verifyLoginLocation).not.toHaveBeenCalled();
    });

    it('не доходит до проверки локации для заблокированного аккаунта', async () => {
      usersService.findOne.mockResolvedValue({
        ...existingUser,
        status: UserStatus.Blocked,
      });

      await expect(
        service.signIn('Alexandr', 'strongpass', request),
      ).rejects.toThrow(UnauthorizedException);

      expect(verificationService.verifyLoginLocation).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('записывает локацию регистрации, но не требует подтверждения', async () => {
      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockResolvedValue(existingUser);

      await service.register(
        { username: 'Alexandr', password: 'strongpass' },
        request,
      );

      expect(verificationService.recordLocation).toHaveBeenCalledWith(
        existingUser,
        request,
      );
      expect(verificationService.verifyLoginLocation).not.toHaveBeenCalled();
    });
  });
});
