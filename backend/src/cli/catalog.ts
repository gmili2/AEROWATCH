/**
 * Catalogue de départ (montres, catégories, marques, livraison), partagé par :
 * - prisma/seed.ts (données de démonstration complètes, base vidée au préalable) ;
 * - src/cli/bootstrap.ts (premier démarrage en production, sans rien écraser).
 */
import { Gender, MovementType, PrismaClient, ProductStatus } from '@prisma/client';
import products from './catalog-products.json';

/** Montant en dirhams → centimes. Les prix du catalogue (catalog-products.json) sont en DH. */
const dh = (n: number) => Math.round(n * 100);
const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

/* Données de gestion (maquette admin) complétant le catalogue du site, par slug. */
export const ADMIN: Record<string, {
  sku: string; category: string; stock: number; sold: number; status: ProductStatus; movement: MovementType;
  caseMat: string; strap: string; color: string; diameter: number; water: number; glass: string; reserve: number | null;
}> = {
  nocturne: { sku: 'GM-NOC-40', category: 'automatiques', stock: 14, sold: 212, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier 316L', strap: 'Acier 316L', color: 'Noir', diameter: 40, water: 100, glass: 'Saphir', reserve: 42 },
  meridien: { sku: 'GM-MER-42', category: 'sport', stock: 6, sold: 148, status: 'ACTIVE', movement: 'QUARTZ', caseMat: 'Acier 316L', strap: 'Cuir de veau', color: 'Noir', diameter: 42, water: 100, glass: 'Saphir bombé', reserve: null },
  carat: { sku: 'GM-CAR-32', category: 'montres-femme', stock: 2, sold: 96, status: 'ACTIVE', movement: 'QUARTZ', caseMat: 'Acier 316L', strap: 'Maille milanaise', color: 'Nacre', diameter: 32, water: 30, glass: 'Saphir', reserve: null },
  abysse: { sku: 'GM-ABY-41', category: 'sport', stock: 9, sold: 131, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier 316L', strap: 'Caoutchouc FKM', color: 'Noir', diameter: 41, water: 300, glass: 'Saphir 3 mm', reserve: 50 },
  eclat: { sku: 'GM-ECL-40', category: 'automatiques', stock: 1, sold: 44, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier 316L', strap: 'Cuir grainé', color: 'Noir', diameter: 40, water: 50, glass: 'Saphir recto-verso', reserve: 40 },
  ligne: { sku: 'GM-LIG-38', category: 'classiques', stock: 23, sold: 260, status: 'ACTIVE', movement: 'QUARTZ', caseMat: 'Acier 316L', strap: 'Cuir lisse', color: 'Blanc', diameter: 38, water: 50, glass: 'Saphir', reserve: null },
  sillage: { sku: 'GM-SIL-40', category: 'sport', stock: 0, sold: 38, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier 316L', strap: 'Acier', color: 'Noir', diameter: 40, water: 100, glass: 'Saphir', reserve: 42 },
  // Grandes maisons
  'tissot-prx': { sku: 'TIS-PRX-40', category: 'automatiques', stock: 12, sold: 64, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier 316L', strap: 'Acier', color: 'Bleu', diameter: 40, water: 100, glass: 'Saphir', reserve: 80 },
  'patek-nautilus': { sku: 'PAT-NAU-5726', category: 'automatiques', stock: 1, sold: 3, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier', strap: 'Acier', color: 'Vert', diameter: 40.5, water: 120, glass: 'Saphir', reserve: 45 },
  'rolex-submariner': { sku: 'ROL-SUB-41', category: 'sport', stock: 2, sold: 9, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Or jaune 18 ct', strap: 'Or jaune 18 ct', color: 'Noir', diameter: 41, water: 300, glass: 'Saphir', reserve: 70 },
  'richard-mille-carbon': { sku: 'RM-11-03-CA', category: 'sport', stock: 1, sold: 1, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Carbone NTPT', strap: 'Caoutchouc', color: 'Noir', diameter: 50, water: 50, glass: 'Saphir', reserve: 55 },
  'cartier-santos': { sku: 'CAR-SAN-L', category: 'classiques', stock: 5, sold: 21, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Acier', strap: 'Cuir', color: 'Blanc', diameter: 39.8, water: 100, glass: 'Saphir bombé', reserve: 42 },
  'hublot-big-bang': { sku: 'HUB-BB-44', category: 'sport', stock: 3, sold: 12, status: 'ACTIVE', movement: 'AUTOMATIC', caseMat: 'Titane', strap: 'Caoutchouc', color: 'Noir', diameter: 44, water: 100, glass: 'Saphir', reserve: 72 },
  perle: { sku: 'GM-PER-28', category: 'montres-femme', stock: 11, sold: 0, status: 'DRAFT', movement: 'QUARTZ', caseMat: 'Acier poli', strap: 'Jonc acier', color: 'Noir', diameter: 28, water: 30, glass: 'Saphir', reserve: null },
};

/* Options et déclinaisons de démonstration (le stock total reste celui de la maquette admin). */
export const VARIANTS: Record<string, {
  options: { name: string; values: [label: string, hex: string | null][] }[];
  variants: { values: string[]; suffix: string; stock: number; priceCents?: number }[];
}> = {
  nocturne: {
    options: [
      { name: 'Couleur', values: [['Noir', '#111111'], ['Bleu nuit', '#1F2A44'], ['Vert forêt', '#2F4A3A']] },
      { name: 'Bracelet', values: [['Acier', null], ['Cuir', null]] },
    ],
    variants: [
      { values: ['Noir', 'Acier'], suffix: 'NO-AC', stock: 5 }, { values: ['Noir', 'Cuir'], suffix: 'NO-CU', stock: 3, priceCents: 1290000 },
      { values: ['Bleu nuit', 'Acier'], suffix: 'BL-AC', stock: 3 }, { values: ['Bleu nuit', 'Cuir'], suffix: 'BL-CU', stock: 1, priceCents: 1290000 },
      { values: ['Vert forêt', 'Acier'], suffix: 'VE-AC', stock: 2 }, { values: ['Vert forêt', 'Cuir'], suffix: 'VE-CU', stock: 0, priceCents: 1290000 },
    ],
  },
  carat: {
    options: [{ name: 'Couleur', values: [['Nacre', '#EDE6DA'], ['Or rose', '#C9A08A']] }],
    variants: [{ values: ['Nacre'], suffix: 'NA', stock: 1 }, { values: ['Or rose'], suffix: 'OR', stock: 1 }],
  },
};

/* Images de départ : photos déjà présentes dans public/ (remplaçables depuis Admin → Catégories). */
export const CATEGORIES: [slug: string, name: string, description: string, imageUrl: string | null][] = [
  ['montres-homme', 'Montres Homme', 'Des boîtiers francs, des cadrans lisibles, du caractère.', '/rolex-submariner.jpg'],
  ['montres-femme', 'Montres Femme', 'Des formats fins et lumineux, à porter comme un bijou.', null],
  ['automatiques', 'Automatiques', 'Des mouvements mécaniques qui vivent au rythme du poignet.', '/patek-philippe.jpg'],
  ['classiques', 'Classiques', 'L’essentiel, dessiné pour traverser les années.', '/cartier-santos.jpg'],
  ['sport', 'Sport', 'Étanches, robustes, précises — prêtes pour tout.', '/hublot-big-bang.jpg'],
];


export type CatalogProduct = { id: string; name: string; sku: string; unit: number; variants: Record<string, { id: string; sku: string; unit: number }> };

/** Marque maison, catégories et livraison : créées seulement si elles n'existent pas. */
export async function installReferenceData(prisma: PrismaClient) {
  const brands: Record<string, string> = {};
  const house = await prisma.brand.findUnique({ where: { slug: 'gmbijoux' } })
    ?? await prisma.brand.create({ data: { name: 'GMBIJOUX', slug: 'gmbijoux', description: 'Maison horlogère française.' } });
  brands.GMBIJOUX = house.id;

  const cats: Record<string, string> = {};
  for (const [i, [slug, name, description, imageUrl]] of CATEGORIES.entries()) {
    const c = await prisma.category.findUnique({ where: { slug } })
      ?? await prisma.category.create({ data: { slug, name, description, imageUrl, position: i } });
    cats[slug] = c.id;
  }

  let shipping = await prisma.shippingMethod.findFirst({ where: { isActive: true }, orderBy: { position: 'asc' } });
  if (!shipping) {
    const zone = await prisma.shippingZone.create({ data: { name: 'Maroc', countries: ['MA'] } });
    shipping = await prisma.shippingMethod.create({
      data: { zoneId: zone.id, name: 'Livraison incluse', carrier: 'Amana', priceCents: 0, minDays: 2, maxDays: 4, codAllowed: true, position: 0 },
    });
  }
  return { brands, cats, shipping };
}

/** Montres du catalogue de départ (avec photos, options et déclinaisons). Les montres déjà présentes (même slug) sont ignorées. */
export async function installCatalog(prisma: PrismaClient, actorId: string, refs: Awaited<ReturnType<typeof installReferenceData>>) {
  const { brands, cats } = refs;
  for (const name of new Set(products.map((p) => p.brand))) {
    if (brands[name]) continue;
    const slug = slugify(name);
    brands[name] = (await prisma.brand.findUnique({ where: { slug } }) ?? await prisma.brand.create({ data: { name, slug } })).id;
  }

  const prod: Record<string, CatalogProduct> = {};
  for (const p of products) {
    if (await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } })) continue;
    const a = ADMIN[p.slug];
    if (!a) throw new Error(`Données de gestion manquantes pour ${p.slug}`);
    const brandId = brands[p.brand];
    const priceCents = dh(p.old ?? p.price);
    const salePriceCents = p.old ? dh(p.price) : null;
    const num = (re: RegExp) => { const m = p.dims.match(re); return m ? Number(m[1].replace(',', '.')) : null; };
    const isNew = p.cats.includes('new');
    const collection = await prisma.collection.findUnique({ where: { slug: p.slug } })
      ?? await prisma.collection.create({ data: { name: p.collection, slug: p.slug, brandId } });
    const created = await prisma.product.create({
      data: {
        name: p.name, slug: p.slug, shortDescription: p.kind, description: p.desc, reference: a.sku, sku: a.sku,
        priceCents, salePriceCents, stock: a.stock, status: a.status, isFeatured: isNew,
        gender: p.cats.includes('homme') && p.cats.includes('femme') ? Gender.UNISEX : p.cats.includes('femme') ? Gender.WOMEN : Gender.MEN,
        brandId, categoryId: cats[a.category],
        collectionId: collection.id,
        movementType: a.movement, caliber: p.movement.match(/calibre ([\w-]+)/)?.[1] ?? null,
        caseMaterial: a.caseMat, strapMaterial: a.strap, color: a.color,
        diameterMm: a.diameter, thicknessMm: num(/épaisseur ([\d,]+)/), lugWidthMm: num(/entre-cornes (\d+)/),
        waterResistanceM: a.water, glass: a.glass, powerReserveHours: a.reserve,
        extraSpecs: { tags: p.cats, kind: p.kind, movement: p.movement, dims: p.dims, strap: p.strap, glass: p.glass, water: p.water },
        soldCount: a.sold, ratingAvg: p.rating, ratingCount: p.reviews,
        publishedAt: a.status === 'ACTIVE' ? new Date(isNew ? '2026-09-15T09:00:00Z' : '2025-11-01T09:00:00Z') : null,
        stockMovements: { create: { delta: a.stock, reason: 'INITIAL', actorId } },
        // Photo servie par le front (public/) tant que Cloudinary/S3 n'est pas configuré.
        images: p.image ? { create: { provider: 'LOCAL', storageKey: p.image.replace(/^\//, ''), url: p.image, alt: p.name, position: 0, isPrimary: true } } : undefined,
      },
    });
    prod[p.slug] = { id: created.id, name: p.name, sku: a.sku, unit: p.price * 100, variants: {} };

    const conf = VARIANTS[p.slug];
    if (conf) {
      const valueIds = new Map<string, string>();
      for (const [i, o] of conf.options.entries()) {
        const option = await prisma.productOption.create({
          data: { productId: created.id, name: o.name, position: i, values: { create: o.values.map(([label, colorHex], j) => ({ label, colorHex, position: j })) } },
          include: { values: true },
        });
        option.values.forEach((v) => valueIds.set(v.label, v.id));
      }
      // Le stock initial du produit est remplacé par celui des déclinaisons (même total).
      await prisma.stockMovement.deleteMany({ where: { productId: created.id } });
      for (const [i, v] of conf.variants.entries()) {
        const sku = `${a.sku}-${v.suffix}`;
        const variant = await prisma.productVariant.create({
          data: {
            productId: created.id, sku, stock: v.stock, priceCents: v.priceCents ?? null, position: i,
            values: { create: v.values.map((label) => ({ optionValueId: valueIds.get(label)! })) },
            stockMovements: v.stock ? { create: { productId: created.id, delta: v.stock, reason: 'INITIAL', actorId } } : undefined,
          },
        });
        prod[p.slug].variants[v.values.join(' · ')] = { id: variant.id, sku, unit: v.priceCents ?? p.price * 100 };
      }
      const total = conf.variants.reduce((n, v) => n + v.stock, 0);
      if (total !== a.stock) throw new Error(`Stock des déclinaisons de ${p.slug} (${total}) ≠ ${a.stock}`);
    }
  }
  return prod;
}
