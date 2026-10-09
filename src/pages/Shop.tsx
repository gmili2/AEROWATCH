import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CollectionsGrid, Crumbs, ProductGrid } from '../components/Catalog';
import { useCatalog } from '../catalog';
import { CATS, type CategoryId } from '../data';
import { useLayout } from '../layout';
import { catFromSlug, shopPath } from '../routes';

type Sort = 'pop' | 'new' | 'asc' | 'desc';

export default function Shop() {
  const L = useLayout();
  const navigate = useNavigate();
  const cat = catFromSlug(useParams().cat);
  const [sort, setSort] = useState<Sort>('pop');
  const { products, status } = useCatalog();

  const items = useMemo(() => {
    if (!cat) return [];
    // L'API renvoie déjà les montres par popularité (ventes).
    const l = cat === 'all' ? products.slice() : products.filter((p) => p.cats.includes(cat));
    if (sort === 'asc') l.sort((a, b) => a.price - b.price);
    if (sort === 'desc') l.sort((a, b) => b.price - a.price);
    if (sort === 'new') l.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    return l;
  }, [cat, sort, products]);

  if (!cat) return <Navigate to={shopPath('all')} replace />;
  const [title, sub] = CATS[cat];

  return (
    <>
      <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 28px`, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Crumbs items={[['Accueil', '/'], ['Montres', cat === 'all' ? undefined : shopPath('all')], ...(cat === 'all' ? [] : [[title] as [string]])]} />
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>{title}</h1>
        <p style={{ margin: 0, maxWidth: 520, color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>{sub}</p>
      </section>
      <section style={{ padding: `0 ${L.px}`, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="hscroll" style={{ display: 'flex', gap: 6, maxWidth: '100%', paddingBottom: 2 }}>
            {(Object.keys(CATS) as CategoryId[]).map((id) => (
              <button key={id} className={`chip${cat === id ? ' active' : ''}`} onClick={() => navigate(shopPath(id))}>
                {id === 'all' ? 'Toutes' : CATS[id][0].replace('Montres ', '')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--graphite)' }}>
            <span>{items.length} modèle{items.length > 1 ? 's' : ''}</span>
            <select
              value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier par"
              style={{ height: 40, padding: '0 14px', border: '1px solid var(--line-strong)', borderRadius: 999, background: '#fff', color: '#111', fontSize: 13, cursor: 'pointer' }}
            >
              <option value="pop">Popularité</option>
              <option value="new">Nouveautés</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
            </select>
          </div>
        </div>
        {items.length || status !== 'ready' ? <ProductGrid items={items} /> : <p>Aucun modèle dans cette catégorie pour le moment. <Link to={shopPath('all')}>Voir toutes les montres</Link></p>}
      </section>
    </>
  );
}

export function Collections() {
  const L = useLayout();
  return (
    <>
      <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 8px`, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="mono">Six familles, une même exigence</span>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Collections</h1>
      </section>
      <section data-reveal style={{ padding: `40px ${L.px} 0` }}>
        <CollectionsGrid />
      </section>
    </>
  );
}
