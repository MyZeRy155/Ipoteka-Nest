import { Fragment, useState, type FormEvent } from 'react';
import {
  ApiError,
  compareCurrencySources,
  getCurrencyHealth,
  getCurrencyRate,
  type CompareReport,
  type SourceHealth,
  type CurrencyRates as CurrencyRatesData,
} from './api';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const sourceLabels: Record<string, string> = {
  Exchange_API: 'ExchangeRate API',
  'Parser-CBRF': 'Парсер ЦБ РФ',
};

function sourceLabel(source: string): string {
  return sourceLabels[source] ?? source;
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={ok ? 'status-dot ok' : 'status-dot down'} aria-hidden />;
}

export function CurrencyRates({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState<CurrencyRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<Record<string, SourceHealth> | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [compare, setCompare] = useState<CompareReport | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await getCurrencyRate(currency.toUpperCase());
      setRates(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось получить курс');
    } finally {
      setLoading(false);
    }
  }

  async function handleHealthCheck() {
    setHealthError(null);
    setHealthLoading(true);
    try {
      setHealth(await getCurrencyHealth());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setHealthError(err instanceof ApiError ? err.message : 'Не удалось проверить источники');
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleCompare() {
    setCompareError(null);
    setCompareLoading(true);
    try {
      setCompare(await compareCurrencySources());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setCompareError(err instanceof ApiError ? err.message : 'Не удалось сравнить источники');
    } finally {
      setCompareLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Валюта (база RUB)
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            placeholder="USD"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка…' : 'Получить курс'}
        </button>
      </form>

      {rates && (
        <dl className="result">
          <dt>Источник</dt>
          <dd>{sourceLabel(rates.source)}</dd>
          {Object.entries(rates.rates).map(([code, value]) => (
            <Fragment key={code}>
              <dt>{code}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
          <dt>Обновлено источником</dt>
          <dd>{dateFormat.format(new Date(rates.sourceUpdatedAt))}</dd>
        </dl>
      )}

      <div className="diagnostics-block">
        <div className="header-row">
          <h2>Здоровье источников</h2>
          <button type="button" className="btn-sm" disabled={healthLoading} onClick={handleHealthCheck}>
            {healthLoading ? 'Проверяем…' : 'Проверить'}
          </button>
        </div>
        {healthError && <p className="error">{healthError}</p>}
        {health && (
          <ul className="status-list">
            {Object.entries(health).map(([source, s]) => (
              <li key={source}>
                <div className="status-list-row">
                  <StatusDot ok={s.status === 'up'} />
                  <strong>{sourceLabel(source)}</strong>
                  <span className="muted">
                    {s.status === 'up' ? 'в норме' : 'недоступен'} · {s.latencyMs} мс ·
                    доступность {s.availability}%
                    {s.consecutiveFailures > 0 &&
                      ` · подряд неудач: ${s.consecutiveFailures}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="diagnostics-block">
        <div className="header-row">
          <h2>Сравнение источников (RUB)</h2>
          <button type="button" className="btn-sm" disabled={compareLoading} onClick={handleCompare}>
            {compareLoading ? 'Сравниваем…' : 'Сравнить'}
          </button>
        </div>
        {compareError && <p className="error">{compareError}</p>}
        {compare && (
          <>
            <ul className="status-list">
              {compare.sources.map((row) => {
                const isFreshest = row.source === compare.moreActual;
                return (
                  <li key={row.source}>
                    <div className="status-list-row">
                      <StatusDot ok={row.available} />
                      <strong>{sourceLabel(row.source)}</strong>
                      {isFreshest && <span className="badge admin">свежее</span>}
                      <span className="muted">
                        {row.available && row.data
                          ? `обновлено ${dateFormat.format(new Date(row.data.sourceUpdatedAt))}`
                          : 'недоступен'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!compare.moreActual && (
              <p className="muted">
                Сравнить свежесть нельзя — хотя бы один источник недоступен.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
