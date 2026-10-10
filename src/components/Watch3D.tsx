import { useEffect, useRef, useState } from 'react';
import { Dial } from './Catalog';

/**
 * Montre en 3D (three.js, chargé à la demande) : boîtier acier, lunette, cadran, bracelet à maillons
 * et aiguilles à l'heure réelle. Tourne doucement, se fait pivoter à la souris ou au doigt.
 * Sans WebGL, le cadran dessiné habituel reste affiché.
 */
export function Watch3D({ size = '100%' }: { size?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cleanup = () => {};
    let cancelled = false;
    import('./watch-scene').then(({ mountWatch }) => {
      if (cancelled) return;
      const stop = mountWatch(el);
      if (stop) { cleanup = stop; setReady(true); }
    }).catch(() => { /* WebGL ou chargement indisponible : on garde le cadran dessiné */ });
    return () => { cancelled = true; cleanup(); };
  }, []);

  return (
    <div style={{ position: 'relative', width: size, aspectRatio: '1' }}>
      {!ready && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Dial size="62%" dark /></div>}
      <div ref={host} role="img" aria-label="Montre en 3D, faites-la pivoter" style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'pan-y' }} />
    </div>
  );
}
