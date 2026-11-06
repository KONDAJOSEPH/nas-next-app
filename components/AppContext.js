'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { USERS, NAV } from '@/lib/config';
import { gather, pushItem, flushSms } from '@/lib/sync';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const ls = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
function beep() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.08; o.start();
    setTimeout(() => { o.stop(); a.close(); }, 180);
  } catch {}
}

// Holds the signed-in user, connection status, alerts and the sync engine for every page.
export function Providers({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [online, setOnline] = useState(true);
  const [msg, setMsg] = useState(''), [notes, setNotes] = useState([]), [pending, setPending] = useState(0);
  const [sync, setSync] = useState({ running: false, progress: 0, msg: '' }), [lastSync, setLastSync] = useState('');
  const notesRef = useRef([]), busy = useRef(false), run = useRef(null);

  const toast = useCallback(m => { setMsg(m); setTimeout(() => setMsg(''), 2600); }, []);
  const saveNotes = useCallback(n => { notesRef.current = n; setNotes(n); ls.set('nas_notes', JSON.stringify(n.slice(0, 100))); }, []);

  // Money alert: in-app list + vibration + sound + phone notification (if allowed).
  const notify = useCallback((title, body, kind = 'in') => {
    saveNotes([{ id: Date.now() + Math.random().toString(36).slice(2, 6), at: Date.now(), title, body, kind, read: false }, ...notesRef.current].slice(0, 100));
    try { navigator.vibrate?.([200, 100, 200]); } catch {}
    if (kind !== 'sync') beep();
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const o = { body, icon: '/icon-192.png' };
        if (navigator.serviceWorker?.controller) navigator.serviceWorker.ready.then(r => r.showNotification(title, o)); else new Notification(title, o);
      }
    } catch {}
  }, [saveNotes]);

  const refreshPending = useCallback(() => gather().then(i => {
    setPending(i.length);
    if (i.length && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then(r => r.sync?.register('nas-sync')).catch(() => {});
  }).catch(() => {}), []);

  const runSync = useCallback(async auto => {
    if (busy.current || !navigator.onLine) return;
    const items = await gather(); if (!items.length) return;
    busy.current = true; setSync({ running: true, progress: 0, msg: 'Connecting to Juba server…' });
    let done = 0, ok = true;
    for (const it of items) {
      if (!navigator.onLine) { ok = false; break; }
      try { await pushItem(it); done++; setSync({ running: true, progress: Math.round(done / items.length * 100), msg: `Pushed ${done} of ${items.length}` }); }
      catch { ok = false; break; }
    }
    busy.current = false;
    if (done) {
      const t = new Date().toLocaleString(); ls.set('nas_last_sync', t); setLastSync(t);
      notify(ok ? 'Sync complete' : 'Sync stopped', `${done} records pushed to the Juba server.${ok ? '' : ' The rest are still waiting.'}`, 'sync');
    }
    setSync({ running: false, progress: 0, msg: ok ? `Done. ${done} records pushed to the Juba server.` : `Connection lost or refused. ${done} pushed, the rest are still waiting.` });
    await refreshPending();
    if (auto && ok) toast(`Internet is back. ${done} records synced.`);
  }, [notify, refreshPending, toast]);
  run.current = runSync;

  useEffect(() => {
    const s = ls.get('nas_session'); if (s && USERS[s]) setUser({ key: s, ...USERS[s] });
    try { const n = JSON.parse(ls.get('nas_notes', '[]')); notesRef.current = n; setNotes(n); } catch {}
    setLastSync(ls.get('nas_last_sync', '')); setOnline(navigator.onLine); setReady(true);
    navigator.storage?.persist?.().catch(() => {});
    const on = () => { setOnline(true); flushSms().then(n => n && toast(`${n} queued SMS sent (simulated)`)); if (ls.get('nas_auto') !== 'off') run.current?.(true); };
    const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)
        .then(r => r.active?.postMessage({ type: 'warm', routes: NAV.map(n => n[0]) })).catch(() => {});
      navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'nas-sync') run.current?.(true); });
    }
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [toast]);
  useEffect(() => { if (user) refreshPending(); }, [user, refreshPending]);

  const login = (u, p) => {
    const k = u.trim().toLowerCase();
    if (!USERS[k] || USERS[k].p !== p) return false;
    ls.set('nas_session', k); setUser({ key: k, ...USERS[k] }); return true;
  };
  const logout = () => { ls.set('nas_session', ''); setUser(null); };

  return (
    <Ctx.Provider value={{ user, ready, online, toast, notify, notes, saveNotes, pending, refreshPending, sync, runSync, lastSync, login, logout }}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </Ctx.Provider>
  );
}
