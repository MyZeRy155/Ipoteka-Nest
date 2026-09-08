import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { UserTrustedLocation } from './entities/user-trusted-location';
import { GeoService } from '../geo/geo.service';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';

describe('VerificationService', () => {
  let service: VerificationService;
  let repo: { existsBy: jest.Mock; create: jest.Mock; save: jest.Mock };
  let geoService: { getGeoLocation: jest.Mock };

  const user = { id: 7 } as User;
  const request = { socket: { remoteAddress: '203.0.113.7' } } as Request;

  const known = { countryCode: 'RU', city: 'Moscow', isFallback: false };
  const fallback = {
    countryCode: 'UNKNOWN',
    city: 'Unknown',
    isFallback: true,
  };

  beforeEach(async () => {
    repo = {
      existsBy: jest.fn(),
      create: jest.fn((x: unknown) => x),
      save: jest.fn((x: unknown) => x),
    };
    geoService = { getGeoLocation: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: getRepositoryToken(UserTrustedLocation), useValue: repo },
        { provide: GeoService, useValue: geoService },
      ],
    }).compile();

    service = module.get(VerificationService);
  });

  describe('verifyLoginLocation', () => {
    it('город уже доверенный — ни верификации, ни записи', async () => {
      geoService.getGeoLocation.mockResolvedValue(known);
      repo.existsBy.mockResolvedValue(true);
      const requireVerification = jest.spyOn(service, 'requireVerification');

      await service.verifyLoginLocation(user, request);

      expect(requireVerification).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('новый город — требует подтверждение и записывает локацию', async () => {
      geoService.getGeoLocation.mockResolvedValue(known);
      repo.existsBy.mockResolvedValue(false);
      const requireVerification = jest.spyOn(service, 'requireVerification');

      await service.verifyLoginLocation(user, request);

      expect(requireVerification).toHaveBeenCalledWith({
        request,
        reason: 'login-from-new-location',
      });
      expect(repo.save).toHaveBeenCalledWith({
        user: { id: 7 },
        city: 'Moscow',
      });
    });

    it('город записывается строго ПОСЛЕ подтверждения', async () => {
      geoService.getGeoLocation.mockResolvedValue(known);
      repo.existsBy.mockResolvedValue(false);
      // будущая реальная реализация прервёт запрос исключением —
      // непроверенный город не должен попасть в список доверенных
      jest
        .spyOn(service, 'requireVerification')
        .mockRejectedValue(new Error('verification required'));

      await expect(service.verifyLoginLocation(user, request)).rejects.toThrow(
        'verification required',
      );

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('гео-данных нет — решение не принимается, БД не трогается', async () => {
      geoService.getGeoLocation.mockResolvedValue(fallback);
      const requireVerification = jest.spyOn(service, 'requireVerification');

      await service.verifyLoginLocation(user, request);

      expect(repo.existsBy).not.toHaveBeenCalled();
      expect(requireVerification).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('определяет IP по сокету, а не по заголовкам', async () => {
      geoService.getGeoLocation.mockResolvedValue(fallback);

      await service.verifyLoginLocation(user, {
        socket: { remoteAddress: '::ffff:203.0.113.7' },
        headers: { 'x-forwarded-for': '9.9.9.9' },
      } as unknown as Request);

      expect(geoService.getGeoLocation).toHaveBeenCalledWith('203.0.113.7');
    });
  });

  describe('recordLocation', () => {
    it('записывает город без запроса подтверждения', async () => {
      geoService.getGeoLocation.mockResolvedValue(known);
      repo.existsBy.mockResolvedValue(false);
      const requireVerification = jest.spyOn(service, 'requireVerification');

      await service.recordLocation(user, request);

      expect(requireVerification).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith({
        user: { id: 7 },
        city: 'Moscow',
      });
    });

    it('повторный вызов для того же города не создаёт дубль', async () => {
      geoService.getGeoLocation.mockResolvedValue(known);
      repo.existsBy.mockResolvedValue(true);

      await service.recordLocation(user, request);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('гео-данных нет — ничего не записывает', async () => {
      geoService.getGeoLocation.mockResolvedValue(fallback);

      await service.recordLocation(user, request);

      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
