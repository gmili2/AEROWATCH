/**
 * Titre, description et adresse officielle (canonical) de la page affichée.
 * L'API envoie déjà ces balises pour les pages montres (backend/src/catalog/seo.controller.ts) ;
 * on les tient à jour ici quand la navigation se fait sans recharger la page.
 */
const ORIGIN = 'https://gmbijoux.store';
export const SHOP_PITCH = 'Livraison gratuite partout au Maroc, paiement à la livraison.';
export const HOME_TITLE = 'GMBIJOUX — Montres homme et femme à Casablanca · Livraison gratuite au Maroc';
export const HOME_DESCRIPTION = `Boutique de montres à Casablanca : montres homme et femme, automatiques, classiques et sport. ${SHOP_PITCH}`;

function tag<T extends HTMLElement>(selector: string, create: () => T): T {
  return document.head.querySelector<T>(selector) ?? document.head.appendChild(create());
}

export function setMeta({ title, description = HOME_DESCRIPTION, path, noindex = false }: { title: string; description?: string; path: string; noindex?: boolean }) {
  document.title = title;
  tag('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).content = description;
  tag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).href = ORIGIN + path;
  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (noindex) tag('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' })).content = 'noindex';
  else robots?.remove();
}
