import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
}
