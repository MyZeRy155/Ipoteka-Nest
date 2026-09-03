import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { toUserResponse } from './dto/user.mapper';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserStatus } from './entities/status.enum';
import { paginate } from '../common/paginate';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(username: string, hashedPassword: string) {
    return this.userRepository.save({ username, hashedPassword });
  }

  async findOne(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async setRefreshTokenHash(id: number, hash: string | null): Promise<void> {
    await this.userRepository.update(id, { hashedRefreshToken: hash });
  }

  async refreshPassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { hashedPassword });
  }

  async resetPassword(
    id: number,
  ): Promise<{ username: string; temporaryPassword: string }> {
    const user = await this.getById(id);

    const temporaryPassword = crypto.randomBytes(9).toString('base64');
    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      this.configService.get('BCRYPT_SALT_ROUNDS', 10),
    );

    await this.userRepository.update(id, {
      hashedPassword,
      hashedRefreshToken: null,
    });
    return { username: user.username, temporaryPassword };
  }

  async blockUser(id: number) {
    await this.getById(id);
    await this.userRepository.update(id, {
      status: UserStatus.Blocked,
      hashedRefreshToken: null,
    });
  }

  async unBlockUser(id: number) {
    await this.getById(id);
    await this.userRepository.update(id, { status: UserStatus.Active });
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async findAll(query: GetUsersQueryDto) {
    const [rows, total] = await this.userRepository.findAndCount({
      order: { id: 'ASC' },
      ...paginate(query.page, query.limit),
    });
    return {
      data: rows.map(toUserResponse),
      total: total,
      page: query.page,
      limit: query.limit,
    };
  }
}
