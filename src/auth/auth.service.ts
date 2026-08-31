import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isMatch = await bcrypt.compare(pass, user.hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findOne(dto.username);
    if (existing) {
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );
    const user = await this.usersService.create(dto.username, hashedPassword);
    const payload = { sub: user.id, username: user.username };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
