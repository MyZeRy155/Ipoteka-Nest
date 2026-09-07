import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  blockUser,
  getUsers,
  resetUserPassword,
  unblockUser,
  type UserSummary,
} from './api';

const PAGE_SIZE = 20;

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function UsersAdmin({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getUsers(page, PAGE_SIZE)
      .then((result) => {
        setItems(result.data);
        setTotal(result.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить пользователей');
      })
      .finally(() => setLoading(false));
  }, [page, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(id: number, action: () => Promise<void>, doneMessage: string) {
    setPendingId(id);
    setNotice(null);
    setError(null);
    try {
      await action();
      setNotice(doneMessage);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Действие не выполнено');
    } finally {
      setPendingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="data-table">
      <p className="muted">
        Бэкенд пока не отдаёт роль/статус в списке пользователей — кнопки
        применяют действие независимо от текущего состояния (блокировка/разблокировка
        идемпотентны).
      </p>
      {loading && <p>Загрузка…</p>}
      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}

      {!loading && items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Создан</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{dateFormat.format(new Date(user.createdAt))}</td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn-sm"
                      disabled={pendingId === user.id}
                      onClick={() =>
                        runAction(
                          user.id,
                          () => resetUserPassword(user.id),
                          `Пароль пользователя ${user.username} сброшен`,
                        )
                      }
                    >
                      Сбросить пароль
                    </button>
                    <button
                      type="button"
                      className="btn-sm"
                      disabled={pendingId === user.id}
                      onClick={() =>
                        runAction(
                          user.id,
                          () => blockUser(user.id),
                          `Пользователь ${user.username} заблокирован`,
                        )
                      }
                    >
                      Заблокировать
                    </button>
                    <button
                      type="button"
                      className="btn-sm"
                      disabled={pendingId === user.id}
                      onClick={() =>
                        runAction(
                          user.id,
                          () => unblockUser(user.id),
                          `Пользователь ${user.username} разблокирован`,
                        )
                      }
                    >
                      Разблокировать
                    </button>
                  </div>
                </td>
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
