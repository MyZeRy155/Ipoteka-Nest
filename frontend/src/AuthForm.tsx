import { useState, type FormEvent } from 'react';
import { ApiError, login, register, type TokenPair } from './api';

export function AuthForm({
  onLoggedIn,
}: {
  onLoggedIn: (tokens: TokenPair) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const tokens =
        mode === 'login'
          ? await login(username, password)
          : await register(username, password);
      onLoggedIn(tokens);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : mode === 'login'
            ? 'Не удалось войти'
            : 'Не удалось зарегистрироваться',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
      <label>
        Логин
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={40}
          autoFocus
          required
        />
      </label>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {mode === 'register' && (
        <label>
          Подтвердите пароль
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading
          ? 'Подождите…'
          : mode === 'login'
            ? 'Войти'
            : 'Зарегистрироваться'}
      </button>
      <button
        type="button"
        className="link"
        onClick={() => {
          setError(null);
          setConfirmPassword('');
          setMode(mode === 'login' ? 'register' : 'login');
        }}
      >
        {mode === 'login'
          ? 'Нет аккаунта? Зарегистрироваться'
          : 'Уже есть аккаунт? Войти'}
      </button>
    </form>
  );
}
