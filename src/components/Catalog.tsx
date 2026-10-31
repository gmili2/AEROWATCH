import { Link, useNavigate } from 'react-router-dom';
import { COLLECTIONS, badgeOf, fmt, stars, type Product } from '../data';
import { useCatalog } from '../catalog';
import { useLayout } from '../layout';
import { productPath, shopPath } from '../routes';
import { useTilt } from '../tilt';
import { useStore } from '../store';
import { ArrowIcon, BagIcon, HeartIcon } from './icons';

/** Visuel provisoire d'une montre (cadran) — à remplacer par la photo produit. */
export function Dial({ size = '50%', dark }: { size?: string; dark?: boolean }) {
  const c = dark ? 'rgba(255,255,255,.16)' : 'rgba(239,232,216,.17)';
  const c2 = dark ? 'rgba(255,255,255,.08)' : 'rgba(239,232,216,.08)';
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
  const tilt = useTilt<HTMLDivElement>();
  return (
    <article className="card pcard" onClick={() => navigate(productPath(p.id))} style={{ display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', minWidth: 0 }}>
      <div ref={tilt} className="ph tilt" style={{ aspectRatio: '4/5', backgroundImage: 'none', overflow: 'hidden' }}>
        <div className="ph zoom-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.image ? 'var(--stone)' : 'transparent' }}>
          {p.image
            ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform .6s var(--ease)' }} onMouseEnter={(e) => { (e.currentTarget.style.transform = 'scale(1.06)'); }} onMouseLeave={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }} />
            : <Dial />
          }
        </div>
        <span className="tilt-glare" />
        {p.brand && (
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(12,12,11,.8)', backdropFilter: 'blur(8px)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 600 }}>{p.brand}</span>
        )}
        {badge && !p.brand && (
          <span style={{ position: 'absolute', top: 12, left: 12, padding: '6px 10px', borderRadius: 999, background: p.old && p.inStock ? 'var(--gold)' : 'var(--surface)', color: p.old && p.inStock ? 'var(--deep)' :  'var(--ink)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{badge}</span>
        )}
        {badge && p.brand && (
          <span style={{ position: 'absolute', top: 12, right: 56, padding: '6px 10px', borderRadius: 999, background: p.old ? 'var(--gold)' : 'rgba(12,12,11,.8)', color: p.old ? 'var(--deep)' :  'var(--ink)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{badge}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
          aria-label={fav ? `Retirer ${p.name} des favoris` : `Ajouter ${p.name} aux favoris`} aria-pressed={fav}
          style={{ position: 'absolute', top: 8, right: 8, width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(12,12,11,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <HeartIcon fill={fav ? 'var(--ink)' : 'none'} />
        </button>
        {p.inStock && p.purchasable && <button
          // Avec plusieurs déclinaisons, le choix (couleur, bracelet…) se fait sur la fiche.
          onClick={(e) => { e.stopPropagation(); if (needsChoice) navigate(productPath(p.id)); else add(p.id, 1, p.variants[0]?.id); }}
          aria-label={needsChoice ? `Choisir les options de ${p.name}` : `Ajouter ${p.name} au panier`}
          style={{ position: 'absolute', right: 10, bottom: 10, width: 44, height: 44, borderRadius: '50%', border: 0, background: 'var(--gold-grad)', boxShadow: '0 6px 18px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform .35s' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <BagIcon color="#141310" size={18} />
        </button>}
      </div>
      <div className="pcard-body" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em' }}>{p.kind}</span>
        {/* Vrai lien (et pas seulement le clic sur la carte) : les moteurs de recherche suivent les liens pour trouver les fiches. */}
        <h3 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 21, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '.03em' }}>
          <Link to={productPath(p.id)} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{p.name}</Link>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, fontSize: 15 }}>
          <span className="price">{p.hasRange ? 'dès ' : ''}{fmt(p.price)}</span>
          {p.old && <span style={{ fontSize: 13, color: 'var(--graphite)', textDecoration: 'line-through' }}>{fmt(p.old)}</span>}
        </div>
        {p.swatches.length > 1 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} aria-label={`Coloris : ${p.swatches.map((s) => s.label).join(', ')}`}>
            {p.swatches.slice(0, 5).map((s) => (
              <span key={s.label} title={s.label} style={{ width: 12, height: 12, borderRadius: '50%', background: s.colorHex ?? '#fff', boxShadow: 'inset 0 0 0 1px rgba(239,232,216,.18)' }} />
            ))}
            {p.swatches.length > 5 && <span style={{ fontSize: 11.5, color: 'var(--graphite)' }}>+{p.swatches.length - 5}</span>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--graphite)' }}>
          <span style={{ color: 'var(--gold)', letterSpacing: '.1em' }} aria-label={`Note ${p.rating} sur 5`}>{stars(p.rating)}</span>
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
  const { imageFor, hidden } = useCatalog();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: L.g3, gap: L.gap }}>
      {COLLECTIONS.filter((c) => !hidden(c.id)).map((c) => {
        const img = c.id === 'all' ? undefined : imageFor(c.id);
        return (
        <Link key={c.id} to={shopPath(c.id)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ph" style={{ width: '100%', aspectRatio: L.collRatio, backgroundImage: 'none', overflow: 'hidden' }}>
            {img ? (
              <img className="zoom-hover" src={img} alt={c.label} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <div className="ph zoom-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '40%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(239,232,216,.16)' }} />
                </div>
                <span className="ph-caption" style={{ left: 14, bottom: 12, fontSize: 9.5, letterSpacing: '.12em' }}>photo · {c.img}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontStretch: '125%', fontWeight: 600, fontSize: L.cardT, textTransform: 'uppercase', letterSpacing: '.01em', color: 'var(--ink)' }}>{c.label}</span>
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
          {to ? <Link to={to} style={{ color: 'var(--graphite)' }}>{label}</Link> : <span style={{ color: 'var(--ink)' }}>{label}</span>}
        </span>
      ))}
    </nav>
  );
}
