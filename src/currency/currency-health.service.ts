import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';
import { ParseService } from '../parser/parse-currency-rate.cbrf';

export interface SourceHealth {
  status: 'up' | 'down';
  latencyMs: number;
  checkedAt: Date;
  totalChecks: number;
  totalFailures: number;
  consecutiveFailures: number;
  availability: number;
}

export interface SourceStat {
  totalChecks: number;
  totalFailures: number;
  consecutiveFailures: number;
}

@Injectable()
export class CurrencyHealthService {
  private readonly stats = new Map<string, SourceStat>();

  constructor(
    private configService: ConfigService,
    private resilientHttpService: ResilientHttpService,
    private parseService: ParseService,
  ) {}

  async checkHealth(): Promise<Record<string, SourceHealth>> {
    const [primary, fallback] = await Promise.all([
      this.probe('Exchange_API', () => this.checkPrimary()),
      this.probe('Parser-CBRF', () => this. parseService.parseCbRFCurrencyRate())
    ]);
    return { Exchange_API: primary, 'Parser-CBRF': fallback}
  }


  private checkPrimary(): Promise<unknown> {
    const url =
      this.configService.get('EXCHANGERATE_API_BASE_URL') +
      this.configService.get('EXCHANGERATE_API_KEY') +
      '/latest/USD';
    return this.resilientHttpService.fetchWithRetry(url, 1)
  }
  private async probe(
    source: string,
    fn:() => Promise<unknown>,
  ): Promise<SourceHealth>{
    const startedAt = Date.now();
    const stat = this.stats.get(source) ?? {
      totalChecks: 0,
      totalFailures: 0,
      consecutiveFailures: 0,
    };

    let status: 'up' | 'down';
    try {
      await fn();
      status = 'up';
      stat.consecutiveFailures=0;
    } catch {
      status = 'down';
      stat.consecutiveFailures += 1;
      stat.totalFailures += 1;
    }
    stat.totalChecks += 1
    this.stats.set(source, stat);

    return {
      status,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date(),
      totalChecks: stat.totalChecks,
      totalFailures: stat.totalFailures,
      consecutiveFailures: stat.consecutiveFailures,
      availability:
        stat.totalChecks > 0 ? Number(
          (
            ((stat.totalChecks - stat.totalFailures) / stat.totalChecks) * 100
          ).toFixed(2)
        ) : 100,
    }
  }
}
