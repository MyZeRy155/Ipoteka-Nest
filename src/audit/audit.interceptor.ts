import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { getClientIp } from '../common/get-client-ip';
import { AuditService } from './audit.service';
import type { Request, Response } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly ignoredPrefixes = ['/currency/health', '/docs'];

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: { sub: number } }>();
    const response = http.getResponse<Response>();

    if (this.isIgnored(request)) {
      return next.handle();
    }

    const base = {
      userId: request.user?.sub ?? null,
      ip: getClientIp(request),
      method: request.method,
      url: request.originalUrl.slice(0, 255),
    };

    return next.handle().pipe(
      tap({
        next: () =>
          this.auditService.record({
            ...base,
            statusCode: response.statusCode,
          }),
        error: (err) =>
          this.auditService.record({
            ...base,
            statusCode: err instanceof HttpException ? err.getStatus() : 500,
          }),
      }),
    );
  }
  private isIgnored(request: Request): boolean {
    return this.ignoredPrefixes.some((p) => request.path.startsWith(p));
  }
}
