import { WhitelistService } from './whitelist.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WhiteListIp } from './entities/whitelist.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';

const CACHE_KEY = 'whitelist:set';
const TTL = 1000 * 60 * 5;

describe('WhitelistService', () => {
  let service: WhitelistService;
  let repo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    delete: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => x),
      merge: jest.fn((a, b) => Object.assign(a, b)),
      delete: jest.fn(),
    };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        WhitelistService,
        { provide: getRepositoryToken(WhiteListIp), useValue: repo },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(WhitelistService);
  });

  describe('isAllowed / loadSet', () => {
    it('при попадании в кэш возвращает результат и не читает БД', async () => {
      cache.get.mockResolvedValue(['1.2.3.4']);

      await expect(service.isAllowed('1.2.3.4')).resolves.toBe(true);
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('при промахе кэша читает БД и кладёт набор в кэш с TTL', async () => {
      cache.get.mockResolvedValue(undefined);
      repo.find.mockResolvedValue([{ ipAddress: '1.2.3.4' }]);

      await expect(service.isAllowed('1.2.3.4')).resolves.toBe(true);
      expect(cache.set).toHaveBeenCalledWith(CACHE_KEY, ['1.2.3.4'], TTL);
    });

    it('пустой список = allow-all: пропускает любой IP', async () => {
      cache.get.mockResolvedValue(undefined);
      repo.find.mockResolvedValue([]);

      await expect(service.isAllowed('203.0.113.55')).resolves.toBe(true);
    });

    it('непустой список: IP не входит в набор → false', async () => {
      cache.get.mockResolvedValue(undefined);
      repo.find.mockResolvedValue([{ ipAddress: '1.2.3.4' }]);

      await expect(service.isAllowed('9.9.9.9')).resolves.toBe(false);
    });
  });

  describe('create', () => {
    it('дубликат → ConflictException, save не вызывается', async () => {
      repo.findOneBy.mockResolvedValue({ id: 1, ipAddress: '1.2.3.4' });

      await expect(
        service.create({ ipAddress: '1.2.3.4' }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('успех: сохраняет, инвалидирует кэш, возвращает DTO', async () => {
      repo.findOneBy.mockResolvedValue(null);

      const result = await service.create({
        ipAddress: '1.2.3.4',
        label: 'office',
      });

      expect(repo.create).toHaveBeenCalledWith({
        ipAddress: '1.2.3.4',
        label: 'office',
      });
      expect(repo.save).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalledWith(CACHE_KEY);
      expect(result).toEqual(
        expect.objectContaining({ ipAddress: '1.2.3.4', label: 'office' }),
      );
    });

    it('label по умолчанию null', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await service.create({ ipAddress: '1.2.3.4' });

      expect(repo.create).toHaveBeenCalledWith({
        ipAddress: '1.2.3.4',
        label: null,
      });
    });
  });

  describe('findOne', () => {
    it('нет записи → NotFoundException', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow(NotFoundException);
    });

    it('запись есть → DTO', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 1,
        ipAddress: '1.2.3.4',
        label: null,
        createdAt: new Date('2026-08-28T10:00:00.000Z'),
      });

      await expect(service.findOne(1)).resolves.toEqual({
        id: 1,
        ipAddress: '1.2.3.4',
        label: null,
        createdAt: new Date('2026-08-28T10:00:00.000Z'),
      });
    });
  });

  describe('update', () => {
    it('нет записи → NotFoundException', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(42, { label: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('новый IP занят другой записью → ConflictException', async () => {
      repo.findOneBy
        .mockResolvedValueOnce({ id: 1, ipAddress: '1.1.1.1', label: null })
        .mockResolvedValueOnce({ id: 2, ipAddress: '2.2.2.2', label: null });

      await expect(
        service.update(1, { ipAddress: '2.2.2.2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('меняется только label: сохраняет, но кэш не трогает', async () => {
      repo.findOneBy.mockResolvedValueOnce({
        id: 1,
        ipAddress: '1.1.1.1',
        label: 'old',
      });

      await service.update(1, { label: 'new' });

      expect(repo.save).toHaveBeenCalled();
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('меняется IP: инвалидирует кэш', async () => {
      repo.findOneBy
        .mockResolvedValueOnce({ id: 1, ipAddress: '1.1.1.1', label: null })
        .mockResolvedValueOnce(null);

      await service.update(1, { ipAddress: '3.3.3.3' });

      expect(cache.del).toHaveBeenCalledWith(CACHE_KEY);
    });
  });

  describe('remove', () => {
    it('affected = 0 → NotFoundException, кэш не трогается', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(42)).rejects.toThrow(NotFoundException);
      expect(cache.del).not.toHaveBeenCalled();
    });

    it('affected = 1 → инвалидирует кэш', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(cache.del).toHaveBeenCalledWith(CACHE_KEY);
    });
  });
});
