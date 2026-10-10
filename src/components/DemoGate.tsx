import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';

const KEY = 'gm:demo-access';

export function hasDemoAccess() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** Écran d'accès du site de démonstration (projet de fin d'études) : code transmis par l'étudiant. */
export function DemoGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/site/unlock', { method: 'POST', body: { code } });
      try { localStorage.setItem(KEY, '1'); } catch { /* navigation privée */ }
      onUnlock();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Serveur injoignable, réessayez.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--ivory)' }}>
      <form onSubmit={submit} style={{ width: 'min(420px,100%)', background: '#fff', border: '1px solid var(--line)', padding: 'clamp(24px,5vw,40px)', display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center', alignItems: 'center' }}>
        <img src="/logo.png" alt="GMBIJOUX" style={{ width: 88, height: 88, objectFit: 'contain', mixBlendMode: 'multiply' }} />
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em' }}>Projet de fin d’études</span>
        <h1 className="display" style={{ margin: 0, fontSize: 26, lineHeight: 1.1 }}>Site de démonstration</h1>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--muted)' }}>Accès réservé. Saisissez le code qui vous a été communiqué. Aucune vente n’est effectuée sur ce site.</p>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code d’accès" aria-label="Code d’accès" autoFocus required
          style={{ width: '100%', height: 50, padding: '0 16px', border: '1px solid var(--line-strong)', background: '#fff', fontSize: 15, textAlign: 'center', letterSpacing: '.08em' }} />
        {error && <span role="alert" style={{ fontSize: 13, color: 'oklch(0.55 0.15 25)' }}>{error}</span>}
        <button className="btn btn-primary" disabled={busy || !code.trim()} style={{ width: '100%', height: 50, opacity: busy || !code.trim() ? 0.5 : 1 }}>{busy ? 'Vérification…' : 'Entrer'}</button>
      </form>
    </div>
  );
}
