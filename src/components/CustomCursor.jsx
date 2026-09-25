import { useRef, useEffect } from 'react';

// ─── Custom cursor — dot + trailing ring, grows on hover over clickables.
// Mounted once at the app root (see App.jsx) so it follows across every
// route. Scoped via the .custom-cursor-zone class, which also restores a
// normal text cursor over inputs/textareas/selects so typing still feels
// right on forms (booking flow, admin, contact).
export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dotRef.current) { dotRef.current.style.left = mx + 'px'; dotRef.current.style.top = my + 'px'; }
    };
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      if (ringRef.current) { ringRef.current.style.left = rx + 'px'; ringRef.current.style.top = ry + 'px'; }
      raf = requestAnimationFrame(loop);
    };
    const isClickable = (el) => el?.closest?.('a, button, [role="button"], .faq-item, .clickable');
    const onOver = (e) => { if (isClickable(e.target)) ringRef.current?.classList.add('big'); };
    const onOut  = (e) => { if (isClickable(e.target)) ringRef.current?.classList.remove('big'); };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  );
}
