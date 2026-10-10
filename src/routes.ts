import type { CategoryId } from './data';

const SLUGS: Record<Exclude<CategoryId, 'all'>, string> = {
  homme: 'homme',
  femme: 'femme',
  auto: 'automatiques',
  classique: 'classiques',
  sport: 'sport',
  coffret: 'avec-coffret',
  boite: 'boite-simple',
  new: 'nouveautes',
};

export const shopPath = (cat: CategoryId = 'all') => (cat === 'all' ? '/montres' : `/montres/${SLUGS[cat]}`);
export const productPath = (id: string) => `/montre/${id}`;

export function catFromSlug(slug?: string): CategoryId | null {
  if (!slug) return 'all';
  const hit = (Object.keys(SLUGS) as Exclude<CategoryId, 'all'>[]).find((k) => SLUGS[k] === slug);
  return hit ?? null;
}

export const PATHS = {
  home: '/',
  admin: '/admin',
  collections: '/collections',
  cart: '/panier',
  checkout: '/commande',
  about: '/a-propos',
  contact: '/contact',
  faq: '/faq',
  cgv: '/cgv',
  privacy: '/confidentialite',
  account: '/compte',
  charte: '/charte-graphique',
};
