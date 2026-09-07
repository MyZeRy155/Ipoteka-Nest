import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, getAuditLogs, type AuditLogEntry, type AuditLogQuery } from './api';

const PAGE_SIZE = 20;

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

type Filters = {
  userId: string;
  ipAddress: string;
  statusCode: string;
  method: string;
  from: string;
  to: string;
};

const emptyFilters: Filters = {
  userId: '',
  ipAddress: '',
  statusCode: '',
  method: '',
  from: '',
  to: '',
};

export function AuditLog({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const query: AuditLogQuery = {
      page,
      limit: PAGE_SIZE,
      userId: appliedFilters.userId ? Number(appliedFilters.userId) : undefined,
      ipAddress: appliedFilters.ipAddress || undefined,
      statusCode: appliedFilters.statusCode ? Number(appliedFilters.statusCode) : undefined,
      method: appliedFilters.method || undefined,
      from: appliedFilters.from ? new Date(appliedFilters.from).toISOString() : undefined,
      to: appliedFilters.to ? new Date(appliedFilters.to).toISOString() : undefined,
    };
    getAuditLogs(query)
      .then((result) => {
        setItems(result.data);
        setTotal(result.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить журнал');
      })
      .finally(() => setLoading(false));
  }, [page, appliedFilters, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  function handleApply(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function handleReset() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="data-table">
      <form className="filters" onSubmit={handleApply}>
        <label>
          ID пользователя
          <input
            value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
            inputMode="numeric"
          />
        </label>
        <label>
          IP-адрес
          <input
            value={filters.ipAddress}
            onChange={(e) => setFilters((f) => ({ ...f, ipAddress: e.target.value }))}
          />
        </label>
        <label>
          HTTP-статус
          <input
            value={filters.statusCode}
            onChange={(e) => setFilters((f) => ({ ...f, statusCode: e.target.value }))}
            inputMode="numeric"
          />
        </label>
        <label>
          Метод
          <select
            value={filters.method}
            onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}
          >
            <option value="">любой</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>
        <label>
          С
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </label>
        <label>
          По
          <input
            type="datetime-local"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </label>
        <div className="actions">
          <button type="submit" className="btn-sm">
            Применить
          </button>
          <button type="button" className="btn-sm" onClick={handleReset}>
            Сбросить
          </button>
        </div>
      </form>

      {loading && <p>Загрузка…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">Записей не найдено</p>
      )}

      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Когда</th>
              <th>Юзер</th>
              <th>IP</th>
              <th>Страна</th>
              <th>Метод</th>
              <th>URL</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{dateFormat.format(new Date(row.createdAt))}</td>
                <td>{row.userId ?? '—'}</td>
                <td>{row.ipAddress}</td>
                <td>{row.countryCode ?? '—'}</td>
                <td>{row.method}</td>
                <td>{row.requestedUrl}</td>
                <td>{row.statusCode}</td>
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
        <span>
          Стр. {page} из {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages || loading}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
