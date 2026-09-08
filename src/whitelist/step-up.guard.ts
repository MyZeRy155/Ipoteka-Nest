import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { VerificationService } from '../verification/verification.service';
import { WhitelistService } from './whitelist.service';
import { getClientIp } from '../common/get-client-ip';
import { Request } from 'express';

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(
    private readonly whitelistService: WhitelistService,
    private readonly verificationService: VerificationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (await this.whitelistService.isTrusted(getClientIp(request))) {
      return true;
    }

    await this.verificationService.requireVerification({
      request,
      reason: `${context.getClass().name}.${context.getHandler().name}`,
    });
    return true;
  }
}
