import { Link, useNavigate } from 'react-router-dom';
import { COLLECTIONS, badgeOf, fmt, stars, type Product } from '../data';
import { useCatalog } from '../catalog';
import { useLayout } from '../layout';
import { productPath, shopPath } from '../routes';
import { useStore } from '../store';
import { ArrowIcon, BagIcon, HeartIcon } from './icons';

/** Visuel provisoire d'une montre (cadran) — à remplacer par la photo produit. */
export function Dial({ size = '50%', dark }: { size?: string; dark?: boolean }) {
  const c = dark ? 'rgba(255,255,255,.16)' : 'rgba(17,17,17,.17)';
  const c2 = dark ? 'rgba(255,255,255,.08)' : 'rgba(17,17,17,.08)';
  return (
    <div style={{ width: size, aspectRatio: '1', borderRadius: '50%', border: `1px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '70%', aspectRatio: '1', borderRadius: '50%', border: `1px solid ${c2}` }} />
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const navigate = useNavigate();
  const { add, favs, toggleFav } = useStore();
  const fav = favs.includes(p.id);
  const badge = p.inStock ? badgeOf(p) : 'Épuisé';
  const needsChoice = p.variants.length > 1;
  return (
    <article className="card" onClick={() => navigate(productPath(p.id))} style={{ display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', minWidth: 0 }}>
      <div className="ph" style={{ aspectRatio: '4/5', backgroundImage: 'none', overflow: 'hidden' }}>
        <div className="ph zoom-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.image ? '#f5f4f1' : 'transparent' }}>
          {p.image
            ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .6s var(--ease)' }} onMouseEnter={(e) => { (e.currentTarget.style.transform = 'scale(1.06)'); }} onMouseLeave={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }} />
            : <Dial />
          }
        </div>
        {p.brand && (
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#111', fontWeight: 600 }}>{p.brand}</span>
        )}
        {badge && !p.brand && (
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '6px 10px', borderRadius: 999, background: p.old && p.inStock ? '#111' : '#fff', color: p.old && p.inStock ? '#fff' : '#111', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{badge}</span>
        )}
        {badge && p.brand && (
          <span style={{ position: 'absolute', top: 12, right: 56, padding: '6px 10px', borderRadius: 999, background: p.old ? '#111' : 'rgba(255,255,255,.9)', color: p.old ? '#fff' : '#111', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{badge}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
          aria-label={fav ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`} aria-pressed={fav}
          style={{ position: 'absolute', top: 8, right: 8, width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <HeartIcon fill={fav ? '#111' : 'none'} />
        </button>
        {p.inStock && <button
          // Avec plusieurs déclinaisons, le choix (couleur, bracelet…) se fait sur la fiche.
          onClick={(e) => { e.stopPropagation(); if (needsChoice) navigate(productPath(p.id)); else add(p.id, 1, p.variants[0]?.id); }}
          aria-label={needsChoice ? `Choisir les options de ${p.name}` : `Ajouter ${p.name} au panier`}
          style={{ position: 'absolute', right: 10, bottom: 10, width: 44, height: 44, borderRadius: '50%', border: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform .35s' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <BagIcon color="#fff" size={18} />
        </button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em' }}>{p.kind}</span>
        <h3 style={{ margin: 0, fontStretch: '115%', fontWeight: 600, fontSize: 15, textTransform: 'uppercase', letterSpacing: '.01em' }}>{p.name}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, fontSize: 15 }}>
          <span>{p.hasRange ? 'dès ' : ''}{fmt(p.price)}</span>
          {p.old && <span style={{ fontSize: 13, color: 'var(--graphite)', textDecoration: 'line-through' }}>{fmt(p.old)}</span>}
        </div>
        {p.swatches.length > 1 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} aria-label={`Coloris : ${p.swatches.map((s) => s.label).join(', ')}`}>
            {p.swatches.slice(0, 5).map((s) => (
              <span key={s.label} title={s.label} style={{ width: 12, height: 12, borderRadius: '50%', background: s.colorHex ?? '#fff', boxShadow: 'inset 0 0 0 1px rgba(17,17,17,.18)' }} />
            ))}
            {p.swatches.length > 5 && <span style={{ fontSize: 11.5, color: 'var(--graphite)' }}>+{p.swatches.length - 5}</span>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--graphite)' }}>
          <span style={{ color: '#111', letterSpacing: '.1em' }} aria-label={`Note ${p.rating} sur 5`}>{stars(p.rating)}</span>
          <span>({p.reviews})</span>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  const L = useLayout();
  const { status, reload } = useCatalog();
  if (status === 'loading' && !items.length) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: L.g4, columnGap: L.gap, rowGap: L.rowGap }} aria-busy="true" aria-label="Chargement des montres">
        {[0, 1, 2, 3].map((i) => <div key={i} className="ph" style={{ aspectRatio: '4/5', opacity: 0.6 }} />)}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: 15.5, color: 'var(--muted)' }}>Le catalogue est momentanément indisponible.</p>
        <button className="btn btn-outline" onClick={reload} style={{ height: 48, padding: '0 24px' }}>Réessayer</button>
      </div>
    );
  }
  return (
    <div data-reveal style={{ display: 'grid', gridTemplateColumns: L.g4, columnGap: L.gap, rowGap: L.rowGap }}>
      {items.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

export function CollectionsGrid() {
  const L = useLayout();
  const { imageFor } = useCatalog();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: L.g3, gap: L.gap }}>
      {COLLECTIONS.map((c) => {
        const img = c.id === 'all' ? undefined : imageFor(c.id);
        return (
        <Link key={c.id} to={shopPath(c.id)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ph" style={{ width: '100%', aspectRatio: L.collRatio, backgroundImage: 'none', overflow: 'hidden' }}>
            {img ? (
              <img className="zoom-hover" src={img} alt={c.label} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <div className="ph zoom-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '40%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(17,17,17,.16)' }} />
                </div>
                <span className="ph-caption" style={{ left: 14, bottom: 12, fontSize: 9.5, letterSpacing: '.12em' }}>photo · {c.img}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontStretch: '125%', fontWeight: 600, fontSize: L.cardT, textTransform: 'uppercase', letterSpacing: '.01em', color: '#111' }}>{c.label}</span>
              {L.desktop && <span style={{ fontSize: 13.5, color: 'var(--graphite)' }}>{c.sub}</span>}
            </div>
            <span style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowIcon size={14} />
            </span>
          </div>
        </Link>
        );
      })}
    </div>
  );
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span className="mono" style={style}>{children}</span>;
}

export function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Fil d’Ariane" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--graphite)' }}>
      {items.map(([label, to], i) => (
        <span key={label} style={{ display: 'flex', gap: 10 }}>
          {i > 0 && <span>/</span>}
          {to ? <Link to={to} style={{ color: 'var(--graphite)' }}>{label}</Link> : <span style={{ color: '#111' }}>{label}</span>}
        </span>
      ))}
    </nav>
  );
}
