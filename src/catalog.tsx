import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { CategoryId, Product, Swatch, Variant } from './data';

/* Catalogue de la boutique, chargé une fois depuis l'API (montres publiées uniquement). */

type ApiSwatch = { id: string; label: string; colorHex: string | null };
type ApiVariant = { id: string; sku: string; values: ApiSwatch[]; priceCents: number; finalPriceCents: number; onSale: boolean; inStock: boolean; lowStock: boolean; imageUrl: string | null };
export type ApiShopProduct = {
  slug: string; sku: string; name: string; shortDescription: string | null; description: string;
  priceCents: number; finalPriceCents: number; onSale: boolean; priceFromCents: number; hasPriceRange: boolean;
  inStock: boolean; lowStock: boolean; stock: number | null; isFeatured: boolean; purchasable: boolean; gender: 'MEN' | 'WOMEN' | 'UNISEX';
  brand: { name: string }; images: { url: string; alt: string | null }[];
  category: { slug: string }; collection: { name: string; slug: string } | null; movementType: string; caliber: string | null;
  caseMaterial: string; strapMaterial: string; diameterMm: number; thicknessMm: number | null; lugWidthMm: number | null;
  waterResistanceM: number; glass: string; powerReserveHours: number | null; ratingAvg: number; ratingCount: number;
  publishedAt: string | null; extraSpecs: { tags?: string[]; kind?: string; movement?: string; dims?: string; strap?: string; glass?: string; water?: string } | null;
  options: { name: string; values: ApiSwatch[] }[]; variants: ApiVariant[]; swatches: ApiSwatch[];
};

type Tag = Exclude<CategoryId, 'all'>;
const TAGS: Tag[] = ['homme', 'femme', 'auto', 'classique', 'sport', 'coffret', 'boite', 'new'];
/** Collections de présentation (coffret / boîte simple) → étiquette de la boutique. */
const COLLECTION_TAG: Record<string, Tag> = { coffret: 'coffret', 'boite-simple': 'boite' };
const CATEGORY_TAG: Record<string, Tag> = { 'montres-homme': 'homme', 'montres-femme': 'femme', automatiques: 'auto', classiques: 'classique', sport: 'sport' };
const MOVEMENT: Record<string, string> = { AUTOMATIC: 'Automatique', MANUAL: 'Remontage manuel', QUARTZ: 'Quartz', SOLAR: 'Solaire', KINETIC: 'Kinétique' };
const NEW_DAYS = 60;
const HOUSE = 'GMBIJOUX';
const mm = (n: number) => String(n).replace('.', ',');
const euros = (c: number) => c / 100;
const swatch = ({ label, colorHex }: ApiSwatch): Swatch => ({ label, colorHex });

/** Étiquettes de la boutique : celles saisies au lancement, complétées par la catégorie, le genre, le mouvement et la date. */
function tagsOf(p: ApiShopProduct): Tag[] {
  const t = new Set<Tag>((p.extraSpecs?.tags ?? []).filter((x): x is Tag => (TAGS as string[]).includes(x)));
  if (CATEGORY_TAG[p.category.slug]) t.add(CATEGORY_TAG[p.category.slug]);
  if (p.collection && COLLECTION_TAG[p.collection.slug]) t.add(COLLECTION_TAG[p.collection.slug]);
  if (p.gender !== 'WOMEN') t.add('homme');
  if (p.gender !== 'MEN') t.add('femme');
  if (p.movementType === 'AUTOMATIC') t.add('auto');
  if (p.publishedAt && Date.now() - new Date(p.publishedAt).getTime() < NEW_DAYS * 86_400_000) t.add('new');
  return [...t];
}

export function toShopProduct(p: ApiShopProduct): Product {
  const x = p.extraSpecs ?? {};
  const variants: Variant[] = p.variants.map((v) => ({
    id: v.id, sku: v.sku, values: v.values.map(swatch), price: euros(v.finalPriceCents), old: v.onSale ? euros(v.priceCents) : null,
    inStock: v.inStock, lowStock: v.lowStock, imageUrl: v.imageUrl,
  }));
  // Prix affiché sur les cartes : la déclinaison la moins chère (avec son prix barré éventuel).
  const cheapest = variants.length ? variants.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const dims = [`Ø ${mm(p.diameterMm)} mm`, p.thicknessMm && `épaisseur ${mm(p.thicknessMm)} mm`, p.lugWidthMm && `entre-cornes ${p.lugWidthMm} mm`].filter(Boolean).join(' · ');
  const movement = [MOVEMENT[p.movementType] ?? p.movementType, p.caliber && `calibre ${p.caliber}`, p.powerReserveHours && `réserve de marche ${p.powerReserveHours} h`].filter(Boolean).join(' · ');
  return {
    id: p.slug, sku: p.sku, name: p.name, brand: p.brand.name === HOUSE ? undefined : p.brand.name, image: p.images[0]?.url, photos: p.images.map((i) => i.url), col: p.collection?.name ?? '', kind: p.shortDescription ?? x.kind ?? `${MOVEMENT[p.movementType] ?? ''} · ${mm(p.diameterMm)} mm`,
    cats: tagsOf(p),
    price: cheapest ? cheapest.price : euros(p.finalPriceCents),
    old: cheapest ? cheapest.old : p.onSale ? euros(p.priceCents) : null,
    hasRange: p.hasPriceRange, rating: p.ratingAvg, reviews: p.ratingCount, inStock: p.inStock, purchasable: p.purchasable,
    stock: !p.inStock ? 'Épuisé — bientôt de retour' : p.lowStock && p.stock ? `Plus que ${p.stock} pièce${p.stock > 1 ? 's' : ''} disponible${p.stock > 1 ? 's' : ''}` : 'En stock — expédiée sous 24 h',
    movement: x.movement ?? movement, dims: x.dims ?? dims, strap: x.strap ?? p.strapMaterial, glass: x.glass ?? p.glass,
    water: x.water ?? `${p.waterResistanceM} m (${Math.round(p.waterResistanceM / 10)} ATM)`,
    desc: p.description, publishedAt: p.publishedAt,
    options: p.options.map((o) => ({ name: o.name, values: o.values.map(swatch) })), variants, swatches: p.swatches.map(swatch),
  };
}

export type ShopCategory = { slug: string; name: string; description: string | null; imageUrl: string | null };
/** Catégorie en base correspondant à une carte de collection du site (« Nouveautés » n'en a pas). */
export const CATEGORY_OF: Partial<Record<Tag, string>> = Object.fromEntries(Object.entries(CATEGORY_TAG).map(([slug, tag]) => [tag, slug]));

/** Boutique en accès privé : code requis ? déjà saisi sur ce navigateur ? */
export type SiteInfo = { private: boolean; unlocked: boolean; pixelId?: string | null };

type Catalog = {
  site: SiteInfo | null;
  /** À appeler après la saisie du bon code d'accès. */
  unlocked: () => void;
  products: Product[];
  categories: ShopCategory[];
  /** Image d'une carte de collection : celle de la catégorie, sinon la photo de la montre la plus récente concernée. */
  imageFor: (tag: Tag) => string | undefined;
  /** Carte ou filtre lié à une catégorie masquée dans l'administration. */
  hidden: (id: CategoryId) => boolean;
  status: 'loading' | 'ready' | 'error';
  find: (slug: string) => Product | undefined;
  reload: () => void;
};
const Ctx = createContext<Catalog | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [status, setStatus] = useState<Catalog['status']>('loading');
  const [site, setSite] = useState<SiteInfo | null>(null);

  const load = useCallback(async () => {
    try {
      // Les pages de l'API sont limitées à 50 : on enchaîne jusqu'à la dernière.
      const all: ApiShopProduct[] = [];
      for (let page = 1; ; page++) {
        const r = await api<{ data: ApiShopProduct[]; meta: { totalPages: number } }>(`/products?sort=popular&limit=50&page=${page}`);
        all.push(...r.data);
        if (page >= r.meta.totalPages) break;
      }
      setProducts(all.map(toShopProduct));
      setCategories((await api<{ data: ShopCategory[] }>('/categories')).data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    api<{ data: SiteInfo }>('/site').then((r) => setSite(r.data)).catch(() => setSite({ private: false, unlocked: true }));
  }, []);
  // Le catalogue n'est chargé qu'une fois l'accès accordé (le serveur le refuse sinon).
  const allowed = !!site && (!site.private || site.unlocked);
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const value = useMemo<Catalog>(() => {
    const bySlug = new Map(products.map((p) => [p.id, p]));
    const imageFor = (tag: Tag) => {
      const own = categories.find((c) => c.slug === CATEGORY_OF[tag])?.imageUrl;
      if (own) return own;
      return products.filter((p) => p.image && p.cats.includes(tag))
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0]?.image;
    };
    // /categories ne renvoie que les catégories visibles : une catégorie absente de la liste est masquée.
    const hidden = (id: CategoryId) => status === 'ready' && id !== 'all' && !!CATEGORY_OF[id] && !categories.some((c) => c.slug === CATEGORY_OF[id]);
    return { site, unlocked: () => setSite((s) => (s ? { ...s, unlocked: true } : s)), products, categories, imageFor, hidden, status, find: (slug) => bySlug.get(slug), reload: () => { setStatus('loading'); load(); } };
  }, [site, products, categories, status, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCatalog doit être utilisé dans <CatalogProvider>');
  return c;
}
