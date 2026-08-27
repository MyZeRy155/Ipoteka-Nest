import { Injectable } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ResilientHttpService {
  constructor(private httpService: HttpService) {}

  async fetchWithRetry<T = any>(url: string, maxAttempts: number) {
    const baseDelay: number = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await firstValueFrom(this.httpService.get<T>(url));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        } else {
          const delay: number = baseDelay * Math.pow(2, attempt);
          const jitter = delay * Math.random();
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        }
      }
    }
    throw new Error('Количество попыток повтора исчерпаны');
  }
}
