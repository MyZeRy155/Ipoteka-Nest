import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { SKIP_WHITELIST_KEY } from './skip-whitelist.decorator';
import { getClientIp } from '../common/get-client-ip';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class WhiteListGuard implements CanActivate {
  constructor(
    private readonly whitelistService: WhitelistService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_WHITELIST_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const ip = getClientIp(request);

    if (!(await this.whitelistService.isAllowed(ip))) {
      throw new ForbiddenException('IP-адрес не в белом списке');
    }
    return true;
  }
}
