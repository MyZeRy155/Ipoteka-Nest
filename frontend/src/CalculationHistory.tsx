import { useEffect, useState } from 'react';
import { ApiError, getCalculations, type MortgageResult } from './api';

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function CalculationHistory({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MortgageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCalculations(page, PAGE_SIZE, token)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить историю');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, token, onUnauthorized]);

  const hasNextPage = items.length === PAGE_SIZE;

  return (
    <div className="history">
      {loading && <p>Загрузка…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">Пока нет сохранённых расчётов</p>
      )}

      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Ставка</th>
              <th>Сумма</th>
              <th>Срок</th>
              <th>Платёж</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.interestRate}%</td>
                <td>{currency.format(item.mortgageAmount)}</td>
                <td>{item.mortgageTermMonths} мес.</td>
                <td>{currency.format(item.monthlyPayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pager">
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1 || loading}
        >
          Назад
        </button>
        <span>Стр. {page}</span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNextPage || loading}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
