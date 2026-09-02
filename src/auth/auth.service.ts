import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { hashRefreshToken, refreshTokensMatch } from './refresh-token.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserStatus } from '../users/entities/status.enum';

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
    if (user.status === UserStatus.Blocked) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }
    const isMatch = await bcrypt.compare(pass, user.hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Неверные логин или пароль');
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

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!(await bcrypt.compare(dto.currentPassword, user.hashedPassword))) {
      throw new UnauthorizedException('Введен неверный пароль');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      this.configService.get('BCRYPT_SALT_ROUNDS', 10),
    );
    await this.usersService.refreshPassword(userId, hashedPassword);
    return this.issueTokens(user);
  }

  private async issueTokens(
    user: Pick<User, 'id' | 'username' | 'role'>,
  ): Promise<TokenPair> {
    const accessPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const refreshPayload = { sub: user.id };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
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
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (!user.hashedRefreshToken) {
      throw new UnauthorizedException('Активная сессия отсутствует');
    }
    if (!refreshTokensMatch(rawRefreshToken, user.hashedRefreshToken)) {
      throw new UnauthorizedException('Refresh-токен недействителен');
    }
    return this.issueTokens(user);
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }
}
