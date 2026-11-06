'use client';
import { useRef } from 'react';
import { shrink } from '@/lib/utils';

// Photo capture box (camera on phones, file picker on computers).
export default function Capture({ title, value, onChange, facing = 'user', max = 480, button }) {
  const inp = useRef();
  return (
    <div className="capbox">
      <div className="capt">{title}</div>
      <div className="prev">{value ? <img src={value} alt={title} /> : 'Nothing captured yet'}</div>
      <button type="button" className="btn ghost" onClick={() => inp.current.click()}>{button}</button>
      <input ref={inp} type="file" accept="image/*" capture={facing} hidden
        onChange={async e => { const f = e.target.files[0]; if (f) onChange(await shrink(f, max)); e.target.value = ''; }} />
    </div>
  );
}
