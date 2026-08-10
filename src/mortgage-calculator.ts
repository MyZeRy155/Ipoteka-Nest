interface MortgageCalculationInput {
    interestRate: number;
    mortgageAmount: number;
    mortgageTermMonths: number;
}

interface MortgageCalculationResult {
    monthlyPayment: number;
    totalDebt: number;
    overpayment: number;
}
const hundredPercent: number = 100
const year: number = 12

const calcTotalDebt = (monthlyPayment: number, mortgageTerm: number): number => monthlyPayment * mortgageTerm;

const calcOverPayment = (totalDebt: number, mortgageAmount: number): number => totalDebt - mortgageAmount;

const calcMonthlyPayment = (interestRate: number, mortgageAmount: number, mortgageTerm: number): number => {
    const monthlyRate: number = interestRate / hundredPercent / year;

    let monthlyPayment: number

    const amountOfPayments = mortgageTerm

    if (monthlyRate > 0) {
        monthlyPayment = (mortgageAmount * monthlyRate * (1 + monthlyRate) ** amountOfPayments) / ((1 + monthlyRate) ** amountOfPayments - 1)
    }
    else {
        monthlyPayment = mortgageAmount / amountOfPayments
    }
    return monthlyPayment;
};

const calculateMortgage = (input: MortgageCalculationInput): MortgageCalculationResult => {
    const monthlyPayment: number = calcMonthlyPayment(input.interestRate, input.mortgageAmount, input.mortgageTermMonths);
    const totalDebt: number = calcTotalDebt(monthlyPayment, input.mortgageTermMonths);
    const overPayment: number = calcOverPayment(totalDebt, input.mortgageAmount)
    return { monthlyPayment, totalDebt, overpayment: overPayment };
}

if (require.main === module) {
    console.log(calculateMortgage({ interestRate: 10, mortgageAmount: 100000, mortgageTermMonths: 36 }));
}