import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from './entities/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as any);
  });

  function ctx(user?: { role?: string }): ExecutionContext {
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('без @Roles пропускает кого угодно', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(ctx({ role: Role.User }))).toBe(true);
  });

  it('роль ровно того же ранга проходит', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(guard.canActivate(ctx({ role: Role.Admin }))).toBe(true);
  });

  it('старшая роль проходит туда, где требуется младшая', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(guard.canActivate(ctx({ role: Role.SuperAdmin }))).toBe(true);
  });

  it('младшая роль не проходит', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(() => guard.canActivate(ctx({ role: Role.User }))).toThrow(
      ForbiddenException,
    );
  });

  it('при перечислении нескольких ролей порог берётся по младшей', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SuperAdmin, Role.User]);

    expect(guard.canActivate(ctx({ role: Role.User }))).toBe(true);
  });

  it('запрос без пользователя отклоняется, а не пропускается', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });

  it('неизвестная роль в токене отклоняется', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Admin]);

    expect(() => guard.canActivate(ctx({ role: 'root' }))).toThrow(
      ForbiddenException,
    );
  });
});
