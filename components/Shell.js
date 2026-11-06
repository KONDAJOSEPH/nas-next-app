'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV } from '@/lib/config';
import { useApp } from './AppContext';

function Login() {
  const { login } = useApp();
  const [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('');
  const go = () => setErr(login(u, p) ? '' : 'Wrong username or password. Check the demo accounts below and try again.');
  return (
    <div className="loginwrap">
      <div className="lbox" onKeyDown={e => e.key === 'Enter' && go()}>
        <div className="brand"><span className="logo">N</span><span><b>Nas Transaction Company</b><small>Offline-First • Agent Banking &amp; Case Management</small></span></div>
        <label htmlFor="u">Username</label><input id="u" value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoCapitalize="none" />
        <label htmlFor="p">Password</label><input id="p" type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" />
        <div className="err" role="alert">{err}</div>
        <button type="button" className="btn full" style={{ marginTop: 6 }} onClick={go}>Sign in</button>
        <div className="demo">Demo accounts (work offline): <b>admin / admin123</b> (Super Admin) · <b>agent / agent123</b> (Agent)</div>
      </div>
    </div>
  );
}

const strip = s => (s.length > 1 ? s.replace(/\/$/, '') : s);

export default function Shell({ children }) {
  const { user, ready, online, pending, notes, lastSync, logout } = useApp();
  const path = strip(usePathname() || '/');
  if (!ready) return null;
  if (!user) return <Login />;
  const unread = notes.filter(n => !n.read).length;
  return (
    <>
      <header className="hdr">
        <div className="hdr-top">
          <Link href="/" className="brand"><span className="logo">N</span><span><b>Nas Transaction Company</b><small>Offline-First • Agent Banking &amp; Case Management</small></span></Link>
          <div className="who">
            <Link href="/notifications/" className="btn ghost bell" aria-label="Notifications">🔔{unread > 0 && <span className="bcount">{unread > 9 ? '9+' : unread}</span>}</Link>
            <span className={`net ${online ? 'on' : ''}`}>{online ? 'Online' : 'Offline Mode'}</span>
            <span>{user.name} • {user.role}</span>
            <button type="button" className="btn ghost" style={{ padding: '6px 14px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={logout}>Sign out</button>
          </div>
        </div>
        <nav className="hnav" aria-label="Main">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={strip(href) === path ? 'on' : ''}>
              {label}{href === '/sync/' && pending > 0 && <span className="soon">{pending}</span>}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">{children}</main>
      <footer className="foot">
        <span>{online ? `Connected • ${pending} records waiting to sync` : `Offline-First System • Working offline. ${pending} records pending sync. Data stays safely on this device.`}</span>
        <b>Last synced: {lastSync || 'Never'}</b>
      </footer>
    </>
  );
}
