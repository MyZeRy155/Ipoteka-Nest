import {Inject, Injectable, ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";
import {CACHE_MANAGER, Cache} from "@nestjs/cache-manager";


@Injectable()
export class CurrencyService {
    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}


    async getExchangeCurrencyRate(currency: string): Promise<any>{
        const key = `currency-${currency}`;
       const cached = await this.cacheManager.get(key)
        if(cached){
            return cached
        }else{
            const url = this.configService.get('EXCHANGERATE_API_BASE_URL') + this.configService.get('EXCHANGERATE_API_KEY') + '/latest/' + currency
            try{
                const response = await this.fetchWithRetry(url,4);
                if(!response.data || typeof response.data.conversion_rates !== 'object'){
                    throw new Error('Получен некорректный ответ от API')
                }
                await this.cacheManager.set(key, response.data, this.configService.get('REDIS_CACHE_TTL'))
                return response.data
            }catch(error){
                throw new ServiceUnavailableException('Не удалось получить данные: источник недоступен', {cause: error})
            }
        }
    }

    async fetchWithRetry(url: string, maxAttempts: number) {
        const baseDelay: number = 1000
        for (let attempt = 0;  attempt < maxAttempts; attempt++) {
            try{
                return await firstValueFrom(this.httpService.get(url))
            }catch(error){
                if(attempt === maxAttempts - 1){
                    throw error
                }else{
                    let delay: number = baseDelay * Math.pow(2, attempt)
                    let jitter = delay * Math.random()
                    await new Promise(resolve => setTimeout(resolve, delay + jitter))
                }
            }
        }
        throw new Error('Количество попыток повтора исчерпаны')
    }

}

