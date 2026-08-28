import { WhiteListGuard } from './whitelist.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('WhitelistGuard', () => {
  let guard: WhiteListGuard;
  let whitelistService: { isAllowed: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    whitelistService = { isAllowed: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };
    guard = new WhiteListGuard(whitelistService as any, reflector as any);
  });

  function ctx(remoteAddress: string): ExecutionContext {
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ socket: { remoteAddress } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('пропускает без проверки IP, если стоит @SkipWhiteList', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(ctx('1.2.3.4'))).resolves.toBe(true);
    expect(whitelistService.isAllowed).not.toHaveBeenCalled();
  });

  it('пропускает, когда IP в белом списке', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    whitelistService.isAllowed.mockResolvedValue(true);
    await expect(guard.canActivate(ctx('1.2.3.4'))).resolves.toBe(true);
    expect(whitelistService.isAllowed).toHaveBeenCalledWith('1.2.3.4');
  });

  it('бросает ForbiddenException, если IP не в списке', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    whitelistService.isAllowed.mockResolvedValue(false);

    await expect(guard.canActivate(ctx('9.9.9.9'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('передаёт в isAllowed развёрнутый IPv4 из ::ffff:', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    whitelistService.isAllowed.mockResolvedValue(true);

    await guard.canActivate(ctx('::ffff:1.2.3.4'));

    expect(whitelistService.isAllowed).toHaveBeenCalledWith('1.2.3.4');
  });
});
