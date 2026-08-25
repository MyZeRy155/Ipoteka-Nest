import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';

@Injectable()
export class ParseService {
  constructor(private resilientHttpService: ResilientHttpService) {}

  async parseCbRFCurrencyRate(): Promise<{
    rates: Record<string, number>;
    updatedAt: Date;
  }> {
    const url: string = 'https://cbr.ru/currency_base/daily/';
    const response = await this.resilientHttpService.fetchWithRetry(url, 4);
    const $ = cheerio.load(response.data);
    const result: Record<string, number> = {};

    $('table.data tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length === 0) return;

      const code = $(cells[1]).text().trim();
      const units = parseFloat($(cells[2]).text().trim().replace(',', '.'));
      const rate = parseFloat($(cells[4]).text().trim().replace(',', '.'));
      if (!code || isNaN(units) || isNaN(rate) || units === 0) {
        return;
      }
      result[code] = rate / units;
    });
    if (Object.keys(result).length === 0) {
      throw new Error(
        'ЦБР не вернул ни одного курса — возможно, изменилась разметка ',
      );
    }
    return { rates: result, updatedAt: this.extractSourceUpdatedAt($) };
  }
  private extractSourceUpdatedAt($: cheerio.CheerioAPI): Date {
    const text = $('.datepicker-filter_button').text().trim();
    const match = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);

    if (!match) {
      throw new Error(
        'Не удалось найти дату обновления курсов на странице ЦБР',
      );
    }

    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
}
