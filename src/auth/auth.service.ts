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
import { User } from '../users/entities/user.entity';
import { hashRefreshToken, refreshTokensMatch } from './refresh-token.util';
export type TokenPair = { access_token: string; refresh_token: string };
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(username: string, pass: string): Promise<TokenPair> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isMatch = await bcrypt.compare(pass, user.hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(user);
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.usersService.findOne(dto.username);
    if (existing) {
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );
    const user = await this.usersService.create(dto.username, hashedPassword);
    return this.issueTokens(user);
  }

  private async issueTokens(
    user: Pick<User, 'id' | 'username'>,
  ): Promise<TokenPair> {
    const payload = { sub: user.id, username: user.username };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TTL'),
      }),
    ]);
    const hash = hashRefreshToken(refresh_token);
    await this.usersService.setRefreshTokenHash(user.id, hash);
    return { access_token, refresh_token };
  }
  async refreshTokens(
    userId: number,
    rawRefreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }
    if (!refreshTokensMatch(rawRefreshToken, user.hashedRefreshToken)) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(user);
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }
}
