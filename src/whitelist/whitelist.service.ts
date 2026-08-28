import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WhiteListIp } from './entities/whitelist.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CreateWhitelistIpDto } from './dto/create-whitelist-ip.dto';
import { toWhiteListIpDto, WhiteListIpDto } from './dto/whitelist-ip.dto';
import { UpdateWhitelistIpDto } from './dto/update-whitelist-ip.dto';

@Injectable()
export class WhitelistService {
  private readonly logger = new Logger(WhitelistService.name);
  private readonly CACHE_KEY = 'whitelist:set';

  constructor(
    @InjectRepository(WhiteListIp)
    private readonly repo: Repository<WhiteListIp>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async loadSet(): Promise<string[]> {
    const cached = await this.cacheManager.get<string[]>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }
    const rows = await this.repo.find({ select: { ipAddress: true } });
    const ips = rows.map((r) => r.ipAddress);
    await this.cacheManager.set(this.CACHE_KEY, ips, 1000 * 60 * 5);
    return ips;
  }

  private async invalidate(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }

  async isAllowed(ip: string): Promise<boolean> {
    const set = await this.loadSet();
    if (set.length === 0) return true;
    return set.includes(ip);
  }

  // CRUD's whitelist's service
  async create(dto: CreateWhitelistIpDto): Promise<WhiteListIpDto> {
    if (await this.repo.findOneBy({ ipAddress: dto.ipAddress })) {
      throw new ConflictException('IP уже в белом списке');
    }
    const row = this.repo.create({
      ipAddress: dto.ipAddress,
      label: dto.label ?? null,
    });
    await this.repo.save(row);
    await this.invalidate();
    return toWhiteListIpDto(row);
  }

  async findAll() {
    const rows = await this.repo.find({
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map(toWhiteListIpDto);
  }

  async findOne(id: number): Promise<WhiteListIpDto> {
    const row = await this.repo.findOneBy({ id });
    if (!row) {
      throw new NotFoundException('IP-адреса в белом списке нет');
    }
    return toWhiteListIpDto(row);
  }

  async update(id: number, dto: UpdateWhitelistIpDto): Promise<WhiteListIpDto> {
    const row = await this.repo.findOneBy({ id });
    if (!row) {
      throw new NotFoundException('IP-адрес не найден');
    }
    const ipChanged =
      dto.ipAddress !== undefined && dto.ipAddress !== row.ipAddress;
    if (
      ipChanged &&
      (await this.repo.findOneBy({ ipAddress: dto.ipAddress }))
    ) {
      throw new ConflictException('IP уже в белом списке');
    }
    this.repo.merge(row, dto);
    await this.repo.save(row);
    if (ipChanged) await this.invalidate();
    return toWhiteListIpDto(row);
  }

  async remove(id: number) {
    const res = await this.repo.delete({ id });
    if (!res.affected) {
      throw new NotFoundException();
    }
    await this.invalidate();
  }
}
