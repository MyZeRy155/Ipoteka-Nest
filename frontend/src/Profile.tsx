import { useState, type FormEvent } from 'react';
import { ApiError, changePassword, type TokenPair } from './api';
import type { AccessTokenPayload } from './authStore';

export function Profile({
  session,
  onTokensRotated,
  onUnauthorized,
}: {
  session: AccessTokenPayload;
  onTokensRotated: (tokens: TokenPair) => void;
  onUnauthorized: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const tokens = await changePassword(currentPassword, newPassword);
      onTokensRotated(tokens);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="muted">
        Пользователь: <strong>{session.username}</strong>{' '}
        <span className={session.role === 'admin' ? 'badge admin' : 'badge'}>
          {session.role === 'admin' ? 'администратор' : 'пользователь'}
        </span>
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Текущий пароль
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Новый пароль
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">Пароль изменён</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Сохраняем…' : 'Сменить пароль'}
        </button>
      </form>
    </div>
  );
}
