
@Module({

})
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