'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Signature pad. Use a ref: ref.current.isSigned(), .toDataURL(), .clear()
const Pad = forwardRef(function Pad({ label = 'Signature' }, ref) {
  const cv = useRef(), st = useRef({ drawing: false, signed: false });
  const clear = () => {
    const x = cv.current.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 200);
    x.strokeStyle = '#0f1b3d'; x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round';
    st.current.signed = false;
  };
  useEffect(() => { clear(); }, []);
  useImperativeHandle(ref, () => ({ clear, isSigned: () => st.current.signed, toDataURL: () => cv.current.toDataURL('image/png') }));
  const pt = e => { const r = cv.current.getBoundingClientRect(); return [(e.clientX - r.left) * 600 / r.width, (e.clientY - r.top) * 200 / r.height]; };
  const down = e => {
    const x = cv.current.getContext('2d'), p = pt(e);
    st.current.drawing = true; cv.current.setPointerCapture(e.pointerId);
    x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + 0.1, p[1] + 0.1); x.stroke(); st.current.signed = true;
  };
  const move = e => { if (!st.current.drawing) return; const x = cv.current.getContext('2d'), p = pt(e); x.lineTo(p[0], p[1]); x.stroke(); };
  const up = () => { st.current.drawing = false; };
  return (
    <div>
      <label>{label}</label>
      <canvas ref={cv} width={600} height={200} className="sig" aria-label={`${label} pad. Draw with finger or mouse.`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      <button type="button" className="btn ghost sm" onClick={clear}>Clear {label.toLowerCase()}</button>
    </div>
  );
});
export default Pad;
