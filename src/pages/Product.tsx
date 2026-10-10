import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCatalog } from '../catalog';
import { Crumbs, ProductGrid } from '../components/Catalog';
import { QtyStepper } from '../components/Shell';
import { fmt, ratingF, stars, type Product as P, type Variant } from '../data';
import { useLayout } from '../layout';
import { PATHS, shopPath } from '../routes';
import { useStore } from '../store';

const VIEWS = ['Face', 'Trois-quarts', 'Fond saphir', 'Au poignet'];
const REASSURE = [
  { t: 'Livraison', d: 'Incluse · 2 à 4 jours' },
  { t: 'Retours', d: 'Gratuits · 30 jours' },
  { t: 'Écrin & certificat', d: 'Inclus' },
];
type Review = { id: string; author: string; rating: number; title: string | null; comment: string; createdAt: string };
const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });
const pct = (price: number, old: number) => '−' + Math.round((1 - price / old) * 100) + ' %';

/** Valeurs choisies par défaut : la première déclinaison disponible. */
function defaultSelection(p: P): Record<string, string> {
  const v = p.variants.find((x) => x.inStock) ?? p.variants[0];
  return v ? Object.fromEntries((p.options ?? []).map((o, i) => [o.name, v.values[i]?.label ?? o.values[0].label])) : {};
}
const matches = (p: P, v: Variant, sel: Record<string, string>) => (p.options ?? []).every((o, i) => v.values[i]?.label === sel[o.name]);

export default function Product() {
  const L = useLayout();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const catalog = useCatalog();
  const p = catalog.find(id);
  const { add } = useStore();
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zxy, setZxy] = useState({ x: 50, y: 50 });
  const [qty, setQty] = useState(1);
  // Choix d'options, mémorisé par montre : changer de fiche repart des valeurs par défaut.
  const [choice, setChoice] = useState<{ id: string; sel: Record<string, string> }>({ id: '', sel: {} });
  const [reviews, setReviews] = useState<{ id: string; list: Review[] }>({ id: '', list: [] });

  useEffect(() => { setImg(0); setZoom(false); setQty(1); }, [id]);
  useEffect(() => { if (p) document.title = `${p.name} — GMBIJOUX`; }, [p]);
  useEffect(() => {
    let live = true;
    api<{ data: { reviews: Review[] } }>(`/products/${encodeURIComponent(id)}`)
      .then((r) => { if (live) setReviews({ id, list: r.data.reviews }); })
      .catch(() => { if (live) setReviews({ id, list: [] }); });
    return () => { live = false; };
  }, [id]);

  if (!p) {
    if (catalog.status === 'ready') return <Navigate to={shopPath('all')} replace />;
    return (
      <section style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        {catalog.status === 'error' ? (
          <>
            <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Cette montre est momentanément indisponible.</p>
            <button className="btn btn-outline" onClick={catalog.reload} style={{ height: 48, padding: '0 24px' }}>Réessayer</button>
          </>
        ) : <div className="ph" aria-busy="true" style={{ width: '100%', maxWidth: 620, aspectRatio: '1', opacity: 0.6 }} />}
      </section>
    );
  }

  const sel = choice.id === p.id ? choice.sel : defaultSelection(p);
  const choose = (name: string, label: string) => {
    let next = { ...sel, [name]: label };
    // Si la combinaison n'existe pas, on bascule sur la première déclinaison qui porte cette valeur.
    if (!p.variants.some((v) => matches(p, v, next))) {
      const i = (p.options ?? []).findIndex((o) => o.name === name);
      const alt = p.variants.find((v) => v.values[i]?.label === label && v.inStock) ?? p.variants.find((v) => v.values[i]?.label === label);
      if (alt) next = Object.fromEntries((p.options ?? []).map((o, k) => [o.name, alt.values[k].label]));
    }
    setChoice({ id: p.id, sel: next });
  };
  const variant = p.variants.find((v) => matches(p, v, sel));
  /** Une valeur est disponible si, combinée aux autres choix actuels, elle donne une déclinaison en stock. */
  const available = (name: string, label: string) => p.variants.some((v) => v.inStock && matches(p, v, { ...sel, [name]: label }));
  const price = variant?.price ?? p.price;
  const old = variant ? variant.old : p.old;
  const canBuy = p.variants.length ? !!variant?.inStock : p.inStock;
  const stockText = !p.variants.length ? p.stock : !variant ? 'Combinaison indisponible' : !variant.inStock ? 'Épuisé dans cette version' : variant.lowStock ? 'Dernières pièces disponibles' : 'En stock — expédiée sous 24 h';
  const photos = p.photos.length ? p.photos : p.image ? [p.image] : [];
  const mainPhoto = photos[Math.min(img, Math.max(0, photos.length - 1))];
  const ref = variant?.sku ?? p.sku;
  const buy = () => { if (canBuy) add(p.id, qty, variant?.id); };

  const pos = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const similar = catalog.products.filter((x) => x.id !== p.id && x.cats.some((c) => p.cats.includes(c) && c !== 'new')).slice(0, 4);
  const specs = [
    ['Mouvement', p.movement], ['Dimensions', p.dims], ['Bracelet', sel.Bracelet ?? p.strap], ['Verre', p.glass],
    ['Étanchéité', p.water], ['Garantie', '2 ans, internationale'], ['Référence', ref],
  ];
  const shownReviews = reviews.id === p.id ? reviews.list : [];
  const label: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--graphite)' };

  return (
    <>
      <section style={{ padding: `24px ${L.px} 0` }}>
        <Crumbs items={[['Accueil', '/'], ['Montres', shopPath('all')], [p.name]]} />
        <div style={{ display: 'grid', gridTemplateColumns: L.split, gap: L.pGap, marginTop: 24, alignItems: 'start' }}>
          <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              role="button" tabIndex={0} aria-label={zoom ? 'Dézoomer' : 'Zoomer sur la photo'}
              onClick={(e) => { setZxy(pos(e)); setZoom((z) => !z); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoom((z) => !z); } }}
              onMouseMove={(e) => zoom && setZxy(pos(e))}
              onMouseLeave={() => zoom && setZoom(false)}
              className="ph" style={{ aspectRatio: '1', backgroundImage: 'none', cursor: zoom ? 'zoom-out' : 'zoom-in', background: mainPhoto ? '#f5f4f1' : 'transparent' }}
            >
              <div className="ph" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: zoom ? 'scale(2.2)' : 'scale(1)', transformOrigin: `${zxy.x}% ${zxy.y}%`, transition: 'transform .6s var(--ease)' }}>
                {mainPhoto
                  ? <img src={mainPhoto} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                  : <div style={{ width: '54%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(17,17,17,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '72%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(17,17,17,.1)' }} />
                    </div>
                }
              </div>
              <span className="ph-caption">photo · {p.name}{variant ? ' ' + variant.values.map((v) => v.label).join(' · ') : ''} — {photos.length ? `${img + 1} / ${photos.length}` : VIEWS[img]}</span>
              <span style={{ position: 'absolute', right: 14, top: 14, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.9)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                {zoom ? 'Zoom × 2,2' : 'Cliquer pour zoomer'}
              </span>
            </div>
            {photos.length > 1 ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(photos.length, 6)},minmax(0,1fr))`, gap: 10 }}>
                {photos.slice(0, 6).map((src, i) => (
                  <button key={src} className="ph" onClick={() => { setImg(i); setZoom(false); }} aria-label={`Photo ${i + 1}`} aria-pressed={i === img}
                    style={{ aspectRatio: '1', padding: 0, cursor: 'pointer', backgroundImage: 'none', background: '#f5f4f1', border: `1px solid ${i === img ? '#111' : 'transparent'}`, overflow: 'hidden', position: 'relative' }}>
                    <img src={src} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
              {VIEWS.map((v, i) => (
                <button
                  key={v} className="ph" onClick={() => { setImg(i); setZoom(false); }} aria-label={`Vue ${v}`} aria-pressed={i === img}
                  style={{ aspectRatio: '1', padding: 0, cursor: 'pointer', backgroundImage: p.image ? 'none' : 'repeating-linear-gradient(135deg,rgba(17,17,17,.045) 0 1px,transparent 1px 9px)', background: p.image && i === 0 ? '#f5f4f1' : undefined, border: `1px solid ${i === img ? '#111' : 'transparent'}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}
                >
                  {p.image && i === 0 && <img src={p.image} alt={v} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
                  <span style={{ position: 'relative', zIndex: 1, padding: 8, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: p.image ? 'rgba(17,17,17,.7)' : 'var(--graphite)', textAlign: 'left' }}>{v}</span>
                </button>
              ))}
            </div>
            )}
          </div>

          <div data-reveal style={{ position: L.sticky, top: 110, display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 6 }}>
            <span className="mono" style={{ fontSize: 10.5 }}>Collection {p.col} · Réf. {ref}</span>
            <h1 className="display" style={{ margin: '-8px 0 0', fontSize: L.h2 }}>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ letterSpacing: '.12em' }}>{stars(p.rating)}</span><span>{ratingF(p.rating)}</span>
              <span style={{ color: 'var(--graphite)' }}>· {p.reviews} avis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 14, padding: '18px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontStretch: '110%', fontSize: 28, fontWeight: 500 }}>{fmt(price)}</span>
              {old && (
                <>
                  <span style={{ fontSize: 16, color: 'var(--graphite)', textDecoration: 'line-through' }}>{fmt(old)}</span>
                  <span style={{ padding: '5px 10px', borderRadius: 999, background: '#111', color: '#fff', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.08em' }}>{pct(price, old)}</span>
                </>
              )}
              <span style={{ flexBasis: '100%', fontSize: 12.5, color: 'var(--graphite)' }}>TTC · paiement à la livraison ou par virement</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: canBuy ? '#111' : 'var(--faint)', boxShadow: '0 0 0 4px var(--line)' }} />{stockText}
            </div>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: 'var(--body)', textWrap: 'pretty' }}>{p.desc}</p>
            {(p.options ?? []).map((o) => {
              const isColor = o.values.some((v) => v.colorHex);
              return (
                <div key={o.name} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, ...label, color: '#111' }}>
                    <span style={{ color: 'var(--graphite)' }}>{o.name}</span><span style={{ textAlign: 'right' }}>{sel[o.name]}</span>
                  </div>
                  <div role="radiogroup" aria-label={o.name} style={{ display: 'flex', flexWrap: 'wrap', gap: isColor ? 12 : 8 }}>
                    {o.values.map((v) => {
                      const on = sel[o.name] === v.label;
                      const ok = available(o.name, v.label);
                      const title = v.label + (ok ? '' : ' — épuisé');
                      return isColor ? (
                        <button key={v.label} role="radio" aria-checked={on} aria-label={title} title={title} onClick={() => choose(o.name, v.label)}
                          style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', padding: 0, cursor: 'pointer', background: v.colorHex ?? '#fff', border: 0, boxShadow: on ? '0 0 0 2px var(--ivory), 0 0 0 3px #111' : 'inset 0 0 0 1px rgba(17,17,17,.18)', opacity: ok ? 1 : 0.45, transition: 'box-shadow .25s' }}>
                          {!ok && <span aria-hidden style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: 1, background: '#111', transform: 'rotate(45deg)' }} />}
                        </button>
                      ) : (
                        <button key={v.label} role="radio" aria-checked={on} title={title} className={`chip${on ? ' active' : ''}`} onClick={() => choose(o.name, v.label)}
                          style={{ height: 44, padding: '0 18px', fontSize: 13, ...(!ok && !on && { color: 'var(--faint)', textDecoration: 'line-through' }) }}>{v.label}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <QtyStepper qty={qty} h={56} onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => q + 1)} />
              <button className="btn btn-primary btn-tall" disabled={!canBuy} style={{ flex: 1, minWidth: 200, opacity: canBuy ? 1 : 0.4 }} onClick={buy}>{canBuy ? 'Ajouter au panier' : 'Épuisé'}</button>
            </div>
            {canBuy && <button className="btn btn-outline btn-tall" onClick={() => { buy(); navigate(PATHS.checkout); }}>Acheter maintenant</button>}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {REASSURE.map((r) => (
                <div key={r.t} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderTop: '1px solid var(--line)', fontSize: 13.5 }}>
                  <span>{r.t}</span><span style={{ color: 'var(--graphite)' }}>{r.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal style={{ padding: `${L.sec} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="mono">Fiche technique</span>
          <h2 className="display" style={{ fontSize: L.h3 }}>Caractéristiques</h2>
        </div>
        <dl style={{ margin: 0 }}>
          {specs.map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,0.8fr) minmax(0,2fr)', gap: 20, padding: '18px 0', borderTop: '1px solid var(--line)' }}>
              <dt style={{ ...label, paddingTop: 2 }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section data-reveal style={{ padding: `${L.sec} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          <span className="mono">Avis clients</span>
          <span style={{ fontStretch: '125%', fontSize: 64, fontWeight: 500, lineHeight: 1 }}>{ratingF(p.rating)}</span>
          <span style={{ letterSpacing: '.14em' }}>{stars(p.rating)}</span>
          <span style={{ fontSize: 13.5, color: 'var(--graphite)' }}>Basé sur {p.reviews} avis vérifiés</span>
          <button className="btn btn-outline" style={{ marginTop: 8, height: 48, padding: '0 24px', fontSize: 11.5 }}>Écrire un avis</button>
        </div>
        <div>
          {!shownReviews.length && <p style={{ margin: 0, padding: '24px 0', borderTop: '1px solid var(--line)', fontSize: 15, color: 'var(--muted)' }}>Aucun avis publié pour le moment.</p>}
          {shownReviews.map((rv) => (
            <article key={rv.id} style={{ padding: '24px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ letterSpacing: '.12em', fontSize: 13 }} aria-label={`Note ${rv.rating} sur 5`}>{stars(rv.rating)}</span>
                <span style={{ ...label, letterSpacing: '.12em' }}>{rv.author} · {MONTH.format(new Date(rv.createdAt))} · Achat vérifié</span>
              </div>
              {rv.title && <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{rv.title}</h3>}
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--body)' }}>{rv.comment}</p>
            </article>
          ))}
        </div>
      </section>

      {similar.length > 0 && (
        <section style={{ padding: `${L.sec} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">Dans le même esprit</span>
            <h2 className="display" style={{ fontSize: L.h3 }}>Produits similaires</h2>
          </div>
          <ProductGrid items={similar} />
        </section>
      )}

      {L.mobile && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 45, background: 'rgba(247,247,245,.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--line)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <span style={{ fontSize: 14 }}>{fmt(price)}{variant && (p.options ?? []).length ? ' · ' + variant.values.map((v) => v.label).join(' · ') : ''}</span>
          </div>
          <button className="btn btn-primary" disabled={!canBuy} style={{ marginLeft: 'auto', flex: 'none', height: 50, padding: '0 22px', fontSize: 11.5, letterSpacing: '.14em', opacity: canBuy ? 1 : 0.4 }} onClick={buy}>{canBuy ? 'Ajouter au panier' : 'Épuisé'}</button>
        </div>
      )}
    </>
  );
}
