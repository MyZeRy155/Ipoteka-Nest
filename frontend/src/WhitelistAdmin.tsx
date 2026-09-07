import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  createWhitelistIp,
  deleteWhitelistIp,
  getWhitelist,
  updateWhitelistIp,
  type WhitelistIp,
} from './api';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function WhitelistAdmin({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [items, setItems] = useState<WhitelistIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const [ipAddress, setIpAddress] = useState('');
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getWhitelist()
      .then(setItems)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить список');
      })
      .finally(() => setLoading(false));
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await createWhitelistIp(ipAddress, label);
      setIpAddress('');
      setLabel('');
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setCreateError(err instanceof ApiError ? err.message : 'Не удалось добавить IP');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    setPendingId(id);
    setError(null);
    try {
      await deleteWhitelistIp(id);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить запись');
    } finally {
      setPendingId(null);
    }
  }

  async function handleSaveLabel(id: number) {
    setPendingId(id);
    setError(null);
    try {
      await updateWhitelistIp(id, editLabel);
      setEditingId(null);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить метку');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="data-table">
      <p className="muted">
        Пустой список = доступ разрешён всем IP. Добавь хотя бы свой текущий IP,
        прежде чем добавлять чужие, иначе рискуешь отрезать себе доступ.
      </p>

      <form className="inline-form" onSubmit={handleCreate}>
        <label>
          IP-адрес
          <input
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="203.0.113.10"
            required
          />
        </label>
        <label>
          Метка
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="офис, статический"
          />
        </label>
        <button type="submit" disabled={creating}>
          {creating ? 'Добавляем…' : 'Добавить'}
        </button>
      </form>
      {createError && <p className="error">{createError}</p>}

      {loading && <p>Загрузка…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="muted">Белый список пуст — ограничений по IP нет</p>
      )}

      {items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Метка</th>
              <th>Добавлен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.ipAddress}</td>
                <td>
                  {editingId === row.id ? (
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    row.label ?? '—'
                  )}
                </td>
                <td>{dateFormat.format(new Date(row.createdAt))}</td>
                <td>
                  <div className="actions">
                    {editingId === row.id ? (
                      <>
                        <button
                          type="button"
                          className="btn-sm"
                          disabled={pendingId === row.id}
                          onClick={() => handleSaveLabel(row.id)}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditLabel(row.label ?? '');
                        }}
                      >
                        Изменить метку
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      disabled={pendingId === row.id}
                      onClick={() => handleDelete(row.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
