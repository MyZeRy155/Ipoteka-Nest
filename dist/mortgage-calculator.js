"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hundredPercent = 100;
const year = 12;
const calcTotalDebt = (monthlyPayment, mortgageTerm) => monthlyPayment * mortgageTerm;
const calcOverPayment = (totalDebt, mortgageAmount) => totalDebt - mortgageAmount;
const calcMonthlyPayment = (interestRate, mortgageAmount, mortgageTerm) => {
    const monthlyRate = interestRate / hundredPercent / year;
    let monthlyPayment;
    const amountOfPayments = mortgageTerm;
    if (monthlyRate > 0) {
        monthlyPayment = (mortgageAmount * monthlyRate * (1 + monthlyRate) ** amountOfPayments) / ((1 + monthlyRate) ** amountOfPayments - 1);
    }
    else {
        monthlyPayment = mortgageAmount / amountOfPayments;
    }
    return monthlyPayment;
};
const calculateMortgage = (input) => {
    const monthlyPayment = calcMonthlyPayment(input.interestRate, input.mortgageAmount, input.mortgageTermMonths);
    const totalDebt = calcTotalDebt(monthlyPayment, input.mortgageTermMonths);
    const overPayment = calcOverPayment(totalDebt, input.mortgageAmount);
    return { monthlyPayment, totalDebt, overpayment: overPayment };
};
if (require.main === module) {
    console.log(calculateMortgage({ interestRate: 10, mortgageAmount: 100000, mortgageTermMonths: 36 }));
}
//# sourceMappingURL=mortgage-calculator.js.map