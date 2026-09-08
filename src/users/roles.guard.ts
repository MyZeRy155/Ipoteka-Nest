import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLE_RANK } from './entities/role.enum';
import { ROLES_KEY } from './roles-decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;

    const requiredRank = Math.min(
      ...requiredRoles.map((role) => ROLE_RANK[role]),
    );
    const userRank = ROLE_RANK[request.user?.role];

    if (userRank === undefined || userRank < requiredRank) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return true;
  }
}
