import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Refresh-Токен отсутствует');
    }
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    let payload: { sub: number; username: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh-Токен недействителен');
    }
    request.user = payload;
    request.refreshToken = token;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
