import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CollectionsGrid, Dial, ProductGrid } from '../components/Catalog';
import { ArrowIcon } from '../components/icons';
import { Watch3D } from '../components/Watch3D';
import { Logo } from '../components/Shell';
import { useCatalog } from '../catalog';
import { PILLARS, fmt } from '../data';
import { useLayout, type Layout } from '../layout';
import { PATHS, productPath, shopPath } from '../routes';
import { useTilt } from '../tilt';

/** Variante du hero : 'noir' (par défaut) ou 'editorial'. */
const HERO_STYLE: 'noir' | 'editorial' = 'noir';

const HERO_SPECS = [
  { n: '01', t: 'Mouvements automatiques' },
  { n: '02', t: 'Verre saphir' },
  { n: '03', t: 'Garantie 2 ans' },
  { n: '04', t: 'Livraison incluse' },
];

function HeroNoir({ L }: { L: Layout }) {
  const navigate = useNavigate();
  // Montre mise en avant : la première commandable avec une photo (sinon la première du catalogue).
  const { products } = useCatalog();
  const hero = products.find((p) => p.purchasable && p.image) ?? products.find((p) => p.image) ?? products[0];
  const tilt = useTilt<HTMLButtonElement>(9);
  return (
    <section style={{ background: 'radial-gradient(900px 640px at 78% 42%, rgba(30,74,54,.55), transparent 70%), radial-gradient(600px 400px at 0% 100%, rgba(207,169,94,.07), transparent 70%), var(--ivory)', color: 'var(--cream)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: L.split, gap: L.heroGap, alignItems: 'center', padding: `${L.heroPad} ${L.px}` }}>
        <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 600 }}>
          <span className="mono" style={{ letterSpacing: '.22em' }}>Collection Nocturne — 2026</span>
          <h1 className="display" style={{ lineHeight: 0.98, fontSize: L.h1 }}>Le temps,<br /><span className="gold-text">à haute altitude.</span></h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.65, color: 'var(--body)', maxWidth: 470, textWrap: 'pretty' }}>
            Montres automatiques et classiques, choisies et contrôlées une à une. Garanties deux ans, livrées assurées.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            <Link className="btn btn-light" to={shopPath('all')}>Découvrir la collection<ArrowIcon /></Link>
            <Link className="btn btn-ghost-light" to={shopPath('new')}>Voir les nouveautés</Link>
          </div>
        </div>
        <div data-reveal style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <button
            ref={tilt} className="ph ph-dark tilt" onClick={() => navigate(hero ? productPath(hero.id) : shopPath('all'))} aria-label={hero ? `Voir la ${hero.name}` : 'Voir les montres'}
            style={{ width: '100%', maxWidth: 580, aspectRatio: '1', borderRadius: '50%', border: 0, boxShadow: '0 0 0 14px var(--ivory), 0 0 0 15.5px rgba(201,164,92,.7), 0 30px 80px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', padding: 0 }}
          >
            {hero?.image
              ? <img src={hero.image} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Dial size="58%" dark />}
            <span className="tilt-glare" />
          </button>
          <div style={{ position: 'absolute', right: 0, bottom: '6%', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-strong)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 190 }}>
            {hero && <>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em' }}>Réf. {hero.sku}</span>
              <span style={{ fontStretch: '125%', fontWeight: 600, fontSize: 14, textTransform: 'uppercase' }}>{hero.name}</span>
              <span style={{ fontSize: 14 }}>{hero.hasRange ? 'dès ' : ''}{fmt(hero.price)}</span>
            </>}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: L.cols4, borderTop: '1px solid var(--line-dark)' }}>
        {HERO_SPECS.map((h) => (
          <div key={h.n} style={{ padding: `22px ${L.px}`, borderRight: '1px solid var(--line-dark)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--body)', display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--faint)' }}>{h.n}</span><span>{h.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroEditorial({ L }: { L: Layout }) {
  return (
    <section style={{ padding: `${L.heroPad} ${L.px} 0`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 26 }}>
      <span data-reveal className="mono" style={{ letterSpacing: '.18em' }}>Collection Nocturne — 2026</span>
      <h1 data-reveal className="display" style={{ letterSpacing: '-.015em', lineHeight: 0.98, fontSize: L.h1, maxWidth: 1000 }}>Le temps, à haute altitude.</h1>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 460 }}>
        Montres automatiques et classiques, choisies et contrôlées une à une. Garanties deux ans, livrées assurées.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        <Link className="btn btn-primary" to={shopPath('all')}>Découvrir la collection</Link>
        <Link className="btn btn-outline" to={shopPath('new')}>Voir les nouveautés</Link>
      </div>
      <div data-reveal className="ph" style={{ width: '100%', marginTop: 32, aspectRatio: L.wideRatio, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ height: '62%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(239,232,216,.16)' }} />
        <span className="ph-caption" style={{ left: 18, bottom: 16 }}>photo campagne · Nocturne au poignet</span>
      </div>
    </section>
  );
}

const DETAILS = [
  { n: '01', t: 'Boîtier acier 316L', d: 'Poli et satiné, résistant à la corrosion.' },
  { n: '02', t: 'Verre saphir', d: 'Inrayable au quotidien, traité antireflet.' },
  { n: '03', t: 'Bracelet à maillons', d: 'Ajusté à votre poignet avant l’envoi.' },
];

/** Montre en 3D : on la fait tourner pour en voir le boîtier, la lunette et le bracelet. */
function Showcase3D({ L }: { L: Layout }) {
  return (
    <section style={{ marginTop: L.sec, background: 'var(--deep)', color: 'var(--cream)', padding: `${L.sec} ${L.px}`, display: 'grid', gridTemplateColumns: L.split, gap: L.pGap, alignItems: 'center', overflow: 'hidden' }}>
      <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 480 }}>
        <span className="mono" style={{ color: 'var(--graphite)' }}>En détail</span>
        <h2 className="display ruled" style={{ fontSize: L.h2 }}>Faites-la tourner.</h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--body)' }}>
          Glissez pour faire pivoter la montre. Ses aiguilles donnent l’heure exacte.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line-dark)', marginTop: 8 }}>
          {DETAILS.map((d) => (
            <div key={d.n} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--line-dark)' }}>
              <span className="mono" style={{ color: 'var(--faint)', fontSize: 10.5 }}>{d.n}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontStretch: '115%', fontWeight: 600, textTransform: 'uppercase', fontSize: 13.5 }}>{d.t}</span>
                <span style={{ fontSize: 14, color: 'var(--graphite)' }}>{d.d}</span>
              </span>
            </div>
          ))}
        </div>
        <Link className="btn btn-light" to={shopPath('all')} style={{ alignSelf: 'flex-start', marginTop: 8 }}>Voir les montres<ArrowIcon /></Link>
      </div>
      <div data-reveal style={{ display: 'flex', justifyContent: 'center' }}>
        <Watch3D size="min(100%, 560px)" />
      </div>
    </section>
  );
}

const TABS = [['all', 'Tout'], ['new', 'Nouveautés'], ['best', 'Meilleures ventes'], ['promo', 'Offres']] as const;

export default function Home() {
  const L = useLayout();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('all');
  const { products } = useCatalog();
  const items = useMemo(() => {
    // Aperçu de 8 montres : le catalogue complet (paginé) est sur « Voir tout le catalogue ».
    if (tab === 'new') return products.filter((p) => p.cats.includes('new')).slice(0, 8);
    if (tab === 'best') return products.slice(0, 4); // déjà triées par ventes
    if (tab === 'promo') return products.filter((p) => p.old).slice(0, 8);
    return products.slice(0, 8);
  }, [tab, products]);

  return (
    <>
      {HERO_STYLE === 'noir' ? <HeroNoir L={L} /> : <HeroEditorial L={L} />}

      <section data-reveal style={{ padding: `${L.sec} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">Collections</span>
            <h2 className="display ruled" style={{ fontSize: L.h2 }}>Trouver sa montre</h2>
          </div>
          <Link className="link-underline" to={PATHS.collections}>Toutes les collections</Link>
        </div>
        <CollectionsGrid />
      </section>

      <section style={{ padding: `${L.sec} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">La sélection</span>
            <h2 className="display ruled" style={{ fontSize: L.h2 }}>Nos montres</h2>
          </div>
          <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={`chip${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
        </div>
        <ProductGrid items={items} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Link className="btn btn-outline" to={shopPath('all')} style={{ padding: '0 32px' }}>Voir tout le catalogue</Link>
        </div>
      </section>

      <Showcase3D L={L} />

      <section data-reveal style={{ marginTop: L.sec, padding: `${L.sec} ${L.px}`, background: 'radial-gradient(700px 400px at 50% 0%, rgba(207,169,94,.10), transparent 70%), var(--green)', borderTop: '1px solid var(--line-dark)', borderBottom: '1px solid var(--line-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, textAlign: 'center' }}>
        <Logo size={96} />
        <p style={{ margin: 0, maxWidth: 820, fontStretch: '115%', fontWeight: 400, fontSize: L.quote, lineHeight: 1.35, textWrap: 'balance' }}>
          Chaque montre est choisie comme un instrument de bord : pour sa précision, sa lisibilité et sa tenue dans le temps.
        </p>
        <div style={{ width: '100%', maxWidth: 1040, display: 'grid', gridTemplateColumns: L.cols3, borderTop: '1px solid var(--line)', textAlign: 'left' }}>
          {PILLARS.map((pl) => (
            <div key={pl.n} style={{ padding: '28px 24px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em' }}>{pl.n}</span>
              <span style={{ fontStretch: '115%', fontWeight: 600, textTransform: 'uppercase', fontSize: 14, letterSpacing: '.02em' }}>{pl.t}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{pl.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal style={{ padding: `${L.sec} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split, gap: L.pGap, alignItems: 'center' }}>
        <div className="ph" style={{ aspectRatio: '4/5' }}>
          <span className="ph-caption">photo atelier · contrôle d’un mouvement</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 480 }}>
          <span className="mono">La Maison</span>
          <h2 className="display ruled" style={{ fontSize: L.h2 }}>Contrôlée à la main, avant de partir.</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--body)' }}>
            Chaque pièce passe par notre atelier : vérification de la marche, de l’étanchéité et des finitions. Puis elle rejoint son écrin, avec son certificat.
          </p>
          <Link className="link-underline" to={PATHS.about} style={{ alignSelf: 'flex-start' }}>Notre histoire</Link>
        </div>
      </section>
    </>
  );
}
