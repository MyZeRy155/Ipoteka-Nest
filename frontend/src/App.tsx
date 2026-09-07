import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { MortgageCalculator } from './MortgageCalculator';
import { CalculationHistory } from './CalculationHistory';
import { Profile } from './Profile';
import { UsersAdmin } from './UsersAdmin';
import { WhitelistAdmin } from './WhitelistAdmin';
import { AuditLog } from './AuditLog';
import { CurrencyRates } from './CurrencyRates';
import {
  clearTokens,
  decodeAccessToken,
  getAccessToken,
  setTokens,
  type AccessTokenPayload,
} from './authStore';
import { logout as apiLogout, type TokenPair } from './api';
import './App.css';

type Tab =
  | 'calculator'
  | 'history'
  | 'currency'
  | 'profile'
  | 'users'
  | 'whitelist'
  | 'audit';

function sessionFromStorage(): AccessTokenPayload | null {
  const token = getAccessToken();
  return token ? decodeAccessToken(token) : null;
}

function App() {
  const [session, setSession] = useState<AccessTokenPayload | null>(
    sessionFromStorage,
  );
  const [tab, setTab] = useState<Tab>('calculator');

  function handleLoggedIn(tokens: TokenPair) {
    setTokens(tokens);
    setSession(decodeAccessToken(tokens.access_token));
    setTab('calculator');
  }

  function handleTokensRotated(tokens: TokenPair) {
    setTokens(tokens);
    setSession(decodeAccessToken(tokens.access_token));
  }

  function handleSessionExpired() {
    clearTokens();
    setSession(null);
  }

  function handleLogout() {
    apiLogout().catch(() => {});
    clearTokens();
    setSession(null);
  }

  if (!session) {
    return (
      <main className="app">
        <AuthForm onLoggedIn={handleLoggedIn} />
      </main>
    );
  }

  const isAdmin = session.role === 'admin';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'calculator', label: 'Калькулятор' },
    { key: 'history', label: 'История' },
    { key: 'currency', label: 'Курс валют' },
    { key: 'profile', label: 'Профиль' },
    ...(isAdmin
      ? ([
          { key: 'users', label: 'Пользователи' },
          { key: 'whitelist', label: 'Whitelist' },
          { key: 'audit', label: 'Аудит' },
        ] as { key: Tab; label: string }[])
      : []),
  ];

  return (
    <main className="app">
      <div className="card wide">
        <div className="header-row">
          <h1>Ипотека</h1>
          <button type="button" className="link" onClick={handleLogout}>
            Выйти
          </button>
        </div>
        <div className="tabs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'tab active' : 'tab'}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'calculator' && (
          <MortgageCalculator onUnauthorized={handleSessionExpired} />
        )}
        {tab === 'history' && (
          <CalculationHistory onUnauthorized={handleSessionExpired} />
        )}
        {tab === 'currency' && (
          <CurrencyRates onUnauthorized={handleSessionExpired} />
        )}
        {tab === 'profile' && (
          <Profile
            session={session}
            onTokensRotated={handleTokensRotated}
            onUnauthorized={handleSessionExpired}
          />
        )}
        {tab === 'users' && isAdmin && (
          <UsersAdmin onUnauthorized={handleSessionExpired} />
        )}
        {tab === 'whitelist' && isAdmin && (
          <WhitelistAdmin onUnauthorized={handleSessionExpired} />
        )}
        {tab === 'audit' && isAdmin && (
          <AuditLog onUnauthorized={handleSessionExpired} />
        )}
      </div>
    </main>
  );
}

export default App;
