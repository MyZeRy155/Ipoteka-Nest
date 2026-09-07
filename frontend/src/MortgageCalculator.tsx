import { useState, type FormEvent } from 'react';
import { ApiError, calculateMortgage, type MortgageResult } from './api';
import { formatThousands, sanitizeNumericInput } from './format';

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

function validate(
  interestRate: string,
  mortgageAmount: string,
  mortgageTermMonths: string,
): string | null {
  const rate = Number(interestRate);
  const amount = Number(mortgageAmount);
  const term = Number(mortgageTermMonths);

  if (!interestRate || Number.isNaN(rate) || rate < 0.1 || rate > 50) {
    return 'Процентная ставка должна быть от 0.1 до 50%';
  }
  if (!mortgageAmount || Number.isNaN(amount) || amount < 1) {
    return 'Сумма займа должна быть больше 0';
  }
  if (!mortgageTermMonths || Number.isNaN(term) || term < 1 || term > 360) {
    return 'Срок должен быть от 1 до 360 месяцев';
  }
  return null;
}

export function MortgageCalculator({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [interestRate, setInterestRate] = useState('12');
  const [mortgageAmount, setMortgageAmount] = useState('5000000');
  const [mortgageTermMonths, setMortgageTermMonths] = useState('240');
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);

    const validationError = validate(interestRate, mortgageAmount, mortgageTermMonths);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await calculateMortgage({
        interestRate: Number(interestRate),
        mortgageAmount: Number(mortgageAmount),
        mortgageTermMonths: Number(mortgageTermMonths),
      });
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось посчитать');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Процентная ставка, %
          <input
            type="text"
            inputMode="decimal"
            value={formatThousands(interestRate)}
            onChange={(e) => setInterestRate(sanitizeNumericInput(e.target.value, true))}
            required
          />
        </label>
        <label>
          Сумма займа, ₽
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(mortgageAmount)}
            onChange={(e) => setMortgageAmount(sanitizeNumericInput(e.target.value, false))}
            required
          />
        </label>
        <label>
          Срок, мес.
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(mortgageTermMonths)}
            onChange={(e) => setMortgageTermMonths(sanitizeNumericInput(e.target.value, false))}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Считаем…' : 'Рассчитать'}
        </button>
      </form>

      {result && (
        <dl className="result">
          <dt>Ежемесячный платёж</dt>
          <dd>{currency.format(result.monthlyPayment)}</dd>
          <dt>Общая сумма выплат</dt>
          <dd>{currency.format(result.totalDebt)}</dd>
          <dt>Переплата</dt>
          <dd>{currency.format(result.overPayment)}</dd>
        </dl>
      )}
    </div>
  );
}
