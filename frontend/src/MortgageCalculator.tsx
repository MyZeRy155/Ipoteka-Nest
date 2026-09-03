import { useState, type FormEvent } from 'react';
import { ApiError, calculateMortgage, type MortgageResult } from './api';

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export function MortgageCalculator({
  token,
  onUnauthorized,
}: {
  token: string;
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
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await calculateMortgage(
        {
          interestRate: Number(interestRate),
          mortgageAmount: Number(mortgageAmount),
          mortgageTermMonths: Number(mortgageTermMonths),
        },
        token,
      );
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
            type="number"
            step="0.1"
            min="0.1"
            max="50"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            required
          />
        </label>
        <label>
          Сумма займа, ₽
          <input
            type="number"
            min="1"
            value={mortgageAmount}
            onChange={(e) => setMortgageAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Срок, мес.
          <input
            type="number"
            min="1"
            max="360"
            value={mortgageTermMonths}
            onChange={(e) => setMortgageTermMonths(e.target.value)}
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

