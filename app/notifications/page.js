'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/AppContext';

export default function Notifications() {
  const { notes, saveNotes, notify } = useApp();
  const [perm, setPerm] = useState('default');
  useEffect(() => setPerm(typeof Notification === 'undefined' ? 'none' : Notification.permission), []);
  const text = perm === 'granted' ? 'Phone alerts are on. You are told when money arrives, even if the app is in the background.'
    : perm === 'denied' ? 'Phone alerts are blocked. Allow notifications for this site in your browser settings.'
    : perm === 'none' ? 'This browser does not support phone alerts. In-app alerts still work.' : 'Phone alerts are off. Turn them on to be told when money arrives.';
  const icon = n => (n.kind === 'warn' ? <span className="ic me">!</span> : n.kind === 'sync' ? <span className="ic ok">↻</span> : <span className="ic ok">+</span>);
  return (
    <>
      <h1 className="pt">Notifications</h1>
      <p className="sub">Money received, float and sync alerts</p>
      <div className="panel formcard">
        <div style={{ fontWeight: 600, fontSize: 14 }}>{text}</div>
        <div className="btns">
          {perm === 'default' && <button type="button" className="btn" onClick={() => Notification.requestPermission().then(setPerm)}>Turn on phone alerts</button>}
          <button type="button" className="btn ghost" onClick={() => notify('Test alert', 'This is how a money alert looks.', 'in')}>Send test alert</button>
          <button type="button" className="btn ghost" onClick={() => saveNotes(notes.map(n => ({ ...n, read: true })))}>Mark all read</button>
          <button type="button" className="btn ghost" onClick={() => saveNotes([])}>Clear all</button>
        </div>
      </div>
      <div className="panel formcard" style={{ marginTop: 14 }}>
        {notes.length ? notes.map(n => (
          <div className={`row ${n.read ? '' : 'unread'}`} key={n.id}>{icon(n)}<div className="rt">{n.title}<small>{n.body}<br />{new Date(n.at).toLocaleString()}</small></div></div>
        )) : <div className="empty">No notifications yet. You will see money received, float changes and sync results here.</div>}
      </div>
    </>
  );
}
