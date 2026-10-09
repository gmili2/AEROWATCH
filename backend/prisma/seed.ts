/**
 * Données initiales de développement : catalogue du site, compte admin,
 * clients, commandes, coupons, promotions et avis de la maquette admin.
 * Le script vide la base avant de la remplir : ne jamais le lancer en production.
 */
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  DiscountType, Gender, MovementType, OrderStatus, PaymentMethod, PaymentStatus, Prisma, PrismaClient, ProductStatus,
} from '@prisma/client';
import products from './seed-products.json';

const prisma = new PrismaClient();
/** Montant en dirhams → centimes. Les prix du catalogue (seed-products.json) sont en DH. */
const dh = (n: number) => Math.round(n * 100);
/** « 07/10/2026 11:42 » (heure de Casablanca) → Date */
const frDate = (s: string) => {
  const [d, m, y, hh = '12', mm = '00'] = s.split(/[\/ :]/);
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:00+01:00`);
};
const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000);

/* Données de gestion (maquette admin) complétant le catalogue du site, par slug. */
const ADMIN: Record<string, {
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
const VARIANTS: Record<string, {
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
const CATEGORIES: [slug: string, name: string, description: string, imageUrl: string | null][] = [
  ['montres-homme', 'Montres Homme', 'Des boîtiers francs, des cadrans lisibles, du caractère.', '/rolex-submariner.jpg'],
  ['montres-femme', 'Montres Femme', 'Des formats fins et lumineux, à porter comme un bijou.', null],
  ['automatiques', 'Automatiques', 'Des mouvements mécaniques qui vivent au rythme du poignet.', '/patek-philippe.jpg'],
  ['classiques', 'Classiques', 'L’essentiel, dessiné pour traverser les années.', '/cartier-santos.jpg'],
  ['sport', 'Sport', 'Étanches, robustes, précises — prêtes pour tout.', '/hublot-big-bang.jpg'],
];

const CUSTOMERS: [name: string, email: string, since: string][] = [
  ['Camille Martin', 'camille.martin@mail.fr', '12/02/2026'], ['Hugo Bernard', 'hugo.b@mail.fr', '30/09/2026'],
  ['Léa Dubois', 'lea.dubois@mail.fr', '14/05/2026'], ['Nadia Haddad', 'nadia.h@mail.fr', '03/11/2025'],
  ['Thomas Petit', 't.petit@mail.fr', '01/10/2026'], ['Inès Moreau', 'ines.moreau@mail.fr', '22/07/2026'],
  ['Karim Benali', 'k.benali@mail.fr', '03/10/2026'], ['Julie Laurent', 'julie.l@mail.fr', '02/10/2026'],
  ['Antoine Leroy', 'a.leroy@mail.fr', '15/03/2026'],
];

type Pay = 'Payé' | 'À encaisser' | 'Échoué' | 'Remboursé';
const ORDERS: [number: string, email: string, date: string, items: [slug: string, qty: number, variant?: string][], status: OrderStatus, method: PaymentMethod, pay: Pay][] = [
  ['GM-284117', 'camille.martin@mail.fr', '07/10/2026 11:42', [['nocturne', 1, 'Noir · Acier']], 'PENDING', 'CARD', 'Payé'],
  ['GM-284116', 'hugo.b@mail.fr', '07/10/2026 09:15', [['ligne', 1], ['carat', 1, 'Nacre']], 'CONFIRMED', 'CARD', 'Payé'],
  ['GM-284115', 'lea.dubois@mail.fr', '06/10/2026 18:03', [['abysse', 1]], 'PROCESSING', 'CASH_ON_DELIVERY', 'À encaisser'],
  ['GM-284114', 'nadia.h@mail.fr', '06/10/2026 14:27', [['meridien', 1]], 'SHIPPED', 'CARD', 'Payé'],
  ['GM-284113', 't.petit@mail.fr', '05/10/2026 10:50', [['eclat', 1]], 'DELIVERED', 'CARD', 'Payé'],
  ['GM-284112', 'ines.moreau@mail.fr', '04/10/2026 16:11', [['carat', 2, 'Or rose']], 'DELIVERED', 'CARD', 'Payé'],
  ['GM-284111', 'k.benali@mail.fr', '03/10/2026 12:38', [['sillage', 1]], 'CANCELLED', 'CARD', 'Échoué'],
  ['GM-284110', 'julie.l@mail.fr', '02/10/2026 20:04', [['ligne', 1]], 'REFUNDED', 'CARD', 'Remboursé'],
  ['GM-284109', 'a.leroy@mail.fr', '01/10/2026 08:47', [['nocturne', 1, 'Bleu nuit · Acier'], ['ligne', 1]], 'DELIVERED', 'CARD', 'Payé'],
];
const FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const REVIEWS: [slug: string, email: string, date: string, rating: number, title: string, comment: string, approved: boolean][] = [
  ['nocturne', 'a.leroy@mail.fr', '06/10/2026', 5, 'Finitions impeccables', 'Le cadran est encore plus beau en vrai. Livraison rapide, écrin soigné.', false],
  ['carat', 'ines.moreau@mail.fr', '06/10/2026', 5, 'Un cadeau réussi', 'Bracelet ajusté avant l’envoi, ma mère est ravie.', false],
  ['ligne', 'julie.l@mail.fr', '04/10/2026', 3, 'Belle mais petite', 'Jolie montre, mais plus petite que je ne l’imaginais au poignet.', false],
  ['abysse', 'lea.dubois@mail.fr', '01/10/2026', 5, 'Solide', 'Testée en mer, aucune buée, lunette très précise.', true],
];

async function reset() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@gmbijoux.fr';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 10) throw new Error('ADMIN_PASSWORD (10 caractères min.) doit être défini dans .env');

  await reset();

  const admin = await prisma.user.create({
    data: {
      email: adminEmail, passwordHash: await argon2.hash(adminPassword, { type: argon2.argon2id }),
      firstName: 'Admin', lastName: 'GMBIJOUX', role: 'ADMIN', emailVerifiedAt: new Date(),
    },
  });

  const brands: Record<string, string> = {};
  for (const name of [...new Set(['GMBIJOUX', ...products.map((p) => p.brand)])]) {
    const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    brands[name] = (await prisma.brand.create({ data: { name, slug, description: name === 'GMBIJOUX' ? 'Maison horlogère française.' : null } })).id;
  }
  const cats: Record<string, string> = {};
  for (const [i, [slug, name, description, imageUrl]] of CATEGORIES.entries()) {
    cats[slug] = (await prisma.category.create({ data: { slug, name, description, imageUrl, position: i } })).id;
  }

  const prod: Record<string, { id: string; name: string; sku: string; unit: number; variants: Record<string, { id: string; sku: string; unit: number }> }> = {};
  for (const p of products) {
    const a = ADMIN[p.slug];
    if (!a) throw new Error(`Données de gestion manquantes pour ${p.slug}`);
    const brandId = brands[p.brand];
    const priceCents = dh(p.old ?? p.price);
    const salePriceCents = p.old ? dh(p.price) : null;
    const num = (re: RegExp) => { const m = p.dims.match(re); return m ? Number(m[1].replace(',', '.')) : null; };
    const isNew = p.cats.includes('new');
    const collection = await prisma.collection.create({ data: { name: p.collection, slug: p.slug, brandId } });
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
        stockMovements: { create: { delta: a.stock, reason: 'INITIAL', actorId: admin.id } },
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
            stockMovements: v.stock ? { create: { productId: created.id, delta: v.stock, reason: 'INITIAL', actorId: admin.id } } : undefined,
          },
        });
        prod[p.slug].variants[v.values.join(' · ')] = { id: variant.id, sku, unit: v.priceCents ?? p.price * 100 };
      }
      const total = conf.variants.reduce((n, v) => n + v.stock, 0);
      if (total !== a.stock) throw new Error(`Stock des déclinaisons de ${p.slug} (${total}) ≠ ${a.stock}`);
    }
  }

  const zone = await prisma.shippingZone.create({ data: { name: 'Maroc', countries: ['MA'] } });
  const shipping = await prisma.shippingMethod.create({
    data: { zoneId: zone.id, name: 'Livraison incluse', carrier: 'Amana', priceCents: 0, minDays: 2, maxDays: 4, codAllowed: true, position: 0 },
  });

  // Les clients de démonstration ne peuvent pas se connecter (mot de passe aléatoire jeté).
  const customerHash = await argon2.hash(randomBytes(24).toString('hex'), { type: argon2.argon2id });
  const users: Record<string, string> = {};
  for (const [name, email, since] of CUSTOMERS) {
    const [firstName, ...rest] = name.split(' ');
    const u = await prisma.user.create({
      data: {
        email, passwordHash: customerHash, firstName, lastName: rest.join(' '), phone: '06 12 34 56 78', createdAt: frDate(since),
        emailVerifiedAt: frDate(since),
        addresses: { create: { firstName, lastName: rest.join(' '), line1: '120 boulevard d’Anfa', city: 'Casablanca', postalCode: '20050', country: 'MA', phone: '06 12 34 56 78', isDefault: true } },
      },
    });
    users[email] = u.id;
  }

  const orders: Record<string, string> = {};
  for (const [number, email, date, items, status, method, pay] of ORDERS) {
    const placedAt = frDate(date);
    const lines = items.map(([slug, quantity, label]) => {
      const p = prod[slug];
      const v = label ? p.variants[label] : undefined;
      if (label && !v) throw new Error(`Déclinaison inconnue : ${slug} ${label}`);
      const unit = v?.unit ?? p.unit;
      return {
        productId: p.id, variantId: v?.id, variantLabel: label ?? null, productName: p.name, sku: v?.sku ?? p.sku,
        unitPriceCents: unit, quantity, totalCents: unit * quantity,
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.totalCents, 0);
    const [firstName, ...rest] = CUSTOMERS.find((c) => c[1] === email)![0].split(' ');

    // Historique : progression normale jusqu'au statut actuel, avec annulation / remboursement en fin de chaîne.
    const path: OrderStatus[] = status === 'CANCELLED' ? ['PENDING', 'CANCELLED']
      : status === 'REFUNDED' ? ['PENDING', 'CONFIRMED', 'REFUNDED']
      : FLOW.slice(0, FLOW.indexOf(status) + 1);
    const history = path.map((to, i) => ({
      from: i ? path[i - 1] : null, to, createdAt: addHours(placedAt, i * 6), actorId: i ? admin.id : null,
      note: i ? null : 'Commande passée',
    }));

    const paymentStatus: PaymentStatus = { 'Payé': 'PAID', 'À encaisser': 'PENDING', 'Échoué': 'FAILED', 'Remboursé': 'REFUNDED' }[pay] as PaymentStatus;
    const shipped = status === 'SHIPPED' || status === 'DELIVERED';
    const tracking = 'CA' + number.slice(3) + '01MA';

    const order = await prisma.order.create({
      data: {
        number, userId: users[email], status, paymentStatus, paymentMethod: method,
        subtotalCents: subtotal, shippingCents: 0, totalCents: subtotal, taxCents: Math.round(subtotal - subtotal / 1.2),
        shippingAddress: { firstName, lastName: rest.join(' '), line1: '120 boulevard d’Anfa', city: 'Casablanca', postalCode: '20050', country: 'MA', phone: '06 12 34 56 78' } satisfies Prisma.InputJsonValue,
        shippingMethodId: shipping.id, shippingMethodName: shipping.name,
        placedAt, createdAt: placedAt, cancelledAt: status === 'CANCELLED' ? addHours(placedAt, 6) : null,
        items: { create: lines },
        history: { create: history },
        payments: {
          create: {
            provider: method === 'CARD' ? 'STRIPE' : 'COD', amountCents: subtotal, currency: 'MAD', status: paymentStatus,
            providerPaymentId: method === 'CARD' ? `pi_demo_${number.slice(3)}` : null,
            refundedCents: pay === 'Remboursé' ? subtotal : 0, failureReason: pay === 'Échoué' ? 'Carte refusée' : null,
            paidAt: pay === 'Payé' || pay === 'Remboursé' ? placedAt : null,
            refunds: pay === 'Remboursé' ? { create: { amountCents: subtotal, reason: 'Retour client', status: 'SUCCEEDED', actorId: admin.id } } : undefined,
          },
        },
        shipments: shipped ? {
          create: {
            carrier: 'Amana', trackingNumber: tracking, trackingUrl: null,
            status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT', shippedAt: addHours(placedAt, 18),
            deliveredAt: status === 'DELIVERED' ? addHours(placedAt, 48) : null,
          },
        } : undefined,
      },
    });
    orders[number] = order.id;
  }

  for (const [slug, email, date, rating, title, comment, approved] of REVIEWS) {
    const order = ORDERS.find((o) => o[1] === email && o[3].some(([s]) => s === slug))!;
    await prisma.review.create({
      data: {
        productId: prod[slug].id, userId: users[email], orderId: orders[order[0]], rating, title, comment,
        status: approved ? 'APPROVED' : 'PENDING', createdAt: frDate(date),
        moderatedById: approved ? admin.id : null, moderatedAt: approved ? frDate(date) : null,
      },
    });
  }

  const coupons: [string, DiscountType, number, number, number, number, string, string, boolean][] = [
    ['BIENVENUE10', 'PERCENTAGE', 10, 3000, 500, 184, '2026-01-01', '2026-12-31', true],
    ['NOEL1500', 'FIXED_AMOUNT', dh(1500), 13000, 100, 0, '2026-12-01', '2026-12-26', true],
    ['VIP20', 'PERCENTAGE', 20, 10000, 50, 47, '2026-06-01', '2026-09-30', false],
  ];
  for (const [code, type, value, min, maxUses, usedCount, start, end, isActive] of coupons) {
    await prisma.coupon.create({
      data: {
        code, type, value, minOrderCents: dh(min), maxUses, usedCount, isActive,
        startsAt: new Date(`${start}T00:00:00+02:00`), expiresAt: new Date(`${end}T23:59:59+01:00`),
      },
    });
  }

  await prisma.promotion.create({
    data: {
      name: 'Semaine Classiques', type: 'PERCENTAGE', value: 15, startsAt: new Date('2026-10-05T00:00:00+02:00'), endsAt: new Date('2026-10-12T23:59:59+02:00'),
      targets: { create: { categoryId: cats.classiques } },
    },
  });
  const sillage = await prisma.collection.findUniqueOrThrow({ where: { slug: 'sillage' } });
  await prisma.promotion.create({
    data: {
      name: 'Lancement Sillage', type: 'FIXED_AMOUNT', value: dh(1000), startsAt: new Date('2026-10-20T00:00:00+02:00'), endsAt: new Date('2026-11-03T23:59:59+01:00'),
      targets: { create: { collectionId: sillage.id } },
    },
  });

  console.log(`Base remplie : ${products.length} montres, ${Object.keys(brands).length} marques, ${CUSTOMERS.length} clients, ${ORDERS.length} commandes, ${REVIEWS.length} avis.`);
  console.log(`Admin : ${adminEmail} (mot de passe : ADMIN_PASSWORD dans .env)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
