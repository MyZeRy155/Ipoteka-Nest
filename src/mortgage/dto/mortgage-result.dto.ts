export class MortgageRecordResultDto {
    constructor(
        public interestRate: number,
        public mortgageAmount: number,
        public mortgageTermMonths: number,
        public monthlyPayment: number,
        public totalDebt: number,
        public overPayment: number,
        public id?: number,
    ) {}

}