export class MortgageResultDto {
    constructor(
        public monthlyPayment: number,
        public totalDebt: number,
        public overpayment: number,
    ) {}

}