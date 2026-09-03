import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { MortgageCalculator } from './MortgageCalculator';
import { CalculationHistory } from './CalculationHistory';
import './App.css';

const TOKEN_KEY = 'ipoteka:access_token';

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [tab, setTab] = useState<'calculator' | 'history'>('calculator');

  function handleLoggedIn(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (!token) {
    return (
      <main className="app">
        <AuthForm onLoggedIn={handleLoggedIn} />
      </main>
    );
  }

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
          <button
            type="button"
            className={tab === 'calculator' ? 'tab active' : 'tab'}
            onClick={() => setTab('calculator')}
          >
            Калькулятор
          </button>
          <button
            type="button"
            className={tab === 'history' ? 'tab active' : 'tab'}
            onClick={() => setTab('history')}
          >
            История
          </button>
        </div>
        {tab === 'calculator' ? (
          <MortgageCalculator token={token} onUnauthorized={handleLogout} />
        ) : (
          <CalculationHistory token={token} onUnauthorized={handleLogout} />
        )}
      </div>
    </main>
  );
}

export default App;
