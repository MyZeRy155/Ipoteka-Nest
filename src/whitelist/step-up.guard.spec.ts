import { ExecutionContext } from '@nestjs/common';
import { StepUpGuard } from './step-up.guard';

class UsersController {}
function blockUserByAdmin() {}

describe('StepUpGuard', () => {
  let guard: StepUpGuard;
  let whitelistService: { isTrusted: jest.Mock };
  let verificationService: { requireVerification: jest.Mock };

  beforeEach(() => {
    whitelistService = { isTrusted: jest.fn() };
    verificationService = { requireVerification: jest.fn() };
    guard = new StepUpGuard(
      whitelistService as any,
      verificationService as any,
    );
  });

  function ctx(remoteAddress: string): ExecutionContext {
    return {
      getHandler: () => blockUserByAdmin,
      getClass: () => UsersController,
      switchToHttp: () => ({
        getRequest: () => ({ socket: { remoteAddress } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('IP доверенный — доп. подтверждение не запрашивается', async () => {
    whitelistService.isTrusted.mockResolvedValue(true);

    await expect(guard.canActivate(ctx('1.2.3.4'))).resolves.toBe(true);
    expect(verificationService.requireVerification).not.toHaveBeenCalled();
  });

  it('IP недоверенный — запрашивает подтверждение, но не блокирует', async () => {
    whitelistService.isTrusted.mockResolvedValue(false);

    await expect(guard.canActivate(ctx('9.9.9.9'))).resolves.toBe(true);
    expect(verificationService.requireVerification).toHaveBeenCalledTimes(1);
  });

  it('передаёт в подтверждение контроллер и хендлер как причину', async () => {
    whitelistService.isTrusted.mockResolvedValue(false);

    await guard.canActivate(ctx('9.9.9.9'));

    expect(verificationService.requireVerification).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'UsersController.blockUserByAdmin' }),
    );
  });

  it('разворачивает IPv4-mapped адрес перед проверкой', async () => {
    whitelistService.isTrusted.mockResolvedValue(true);

    await guard.canActivate(ctx('::ffff:1.2.3.4'));

    expect(whitelistService.isTrusted).toHaveBeenCalledWith('1.2.3.4');
  });

  it('прерывает запрос, если подтверждение не пройдено', async () => {
    whitelistService.isTrusted.mockResolvedValue(false);
    verificationService.requireVerification.mockRejectedValue(
      new Error('verification required'),
    );

    await expect(guard.canActivate(ctx('9.9.9.9'))).rejects.toThrow(
      'verification required',
    );
  });
});
