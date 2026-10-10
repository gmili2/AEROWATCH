export type CategoryId = 'all' | 'homme' | 'femme' | 'auto' | 'classique' | 'sport' | 'new';

export interface Swatch {
  label: string;
  colorHex: string | null;
}

export interface Variant {
  id: string;
  sku: string;
  values: Swatch[];
  price: number;
  old: number | null;
  inStock: boolean;
  lowStock: boolean;
}

/** Montre telle qu'affichée en boutique (chargée depuis l'API, voir catalog.tsx). */
export interface Product {
  id: string; // slug, utilisé dans les URL
  sku: string;
  name: string;
  brand?: string; // grande maison (absent pour les créations GMBIJOUX)
  col: string;
  kind: string;
  cats: Exclude<CategoryId, 'all'>[];
  price: number; // prix payé (le plus bas des déclinaisons s'il y en a)
  old: number | null; // prix barré
  hasRange: boolean; // prix différents selon la déclinaison (« dès … »)
  rating: number;
  reviews: number;
  inStock: boolean;
  stock: string;
  movement: string;
  dims: string;
  strap: string;
  glass: string;
  water: string;
  desc: string;
  publishedAt: string | null;
  options: { name: string; values: Swatch[] }[];
  variants: Variant[];
  swatches: Swatch[];
  image?: string; // photo principale
  photos: string[]; // toutes les photos, la principale en premier
}

export const CATS: Record<CategoryId, [string, string]> = {
  all: ['Toutes les montres', 'Notre sélection complète, contrôlée en atelier avant chaque expédition.'],
  homme: ['Montres Homme', 'Des boîtiers francs, des cadrans lisibles, du caractère.'],
  femme: ['Montres Femme', 'Des formats fins et lumineux, à porter comme un bijou.'],
  auto: ['Automatiques', 'Des mouvements mécaniques qui vivent au rythme du poignet.'],
  classique: ['Classiques', 'L\u2019essentiel, dessiné pour traverser les années.'],
  sport: ['Sport', 'Étanches, robustes, précises — prêtes pour tout.'],
  new: ['Nouveautés', 'Les dernières pièces entrées dans la collection.'],
};

export const COLLECTIONS: { id: CategoryId; label: string; sub: string; img: string }[] = [
  { id: 'homme', label: 'Montres Homme', sub: 'Présence & caractère', img: 'portrait homme' },
  { id: 'femme', label: 'Montres Femme', sub: 'Finesse & éclat', img: 'portrait femme' },
  { id: 'auto', label: 'Automatiques', sub: 'La mécanique au poignet', img: 'mouvement' },
  { id: 'classique', label: 'Classiques', sub: 'L\u2019essentiel intemporel', img: 'cadran blanc' },
  { id: 'sport', label: 'Sport', sub: 'Étanches & robustes', img: 'plongée' },
  { id: 'new', label: 'Nouveautés', sub: 'Entrées en collection', img: 'nouveauté' },
];

export const FAQ: [string, string][] = [
  ['Vos montres sont-elles authentiques ?', 'Oui. Chaque montre est livrée avec son certificat d\u2019authenticité, sa carte de garantie et son écrin GMBIJOUX.'],
  ['Quels sont les délais de livraison ?', 'Expédition sous 24 h ouvrées, livraison incluse dans le prix, en 2 à 4 jours partout au Maroc, assurée et remise en main propre.'],
  ['Puis-je retourner une montre ?', 'Vous disposez de 30 jours pour retourner une montre non portée, dans son emballage d\u2019origine. Le retour est gratuit.'],
  ['Que couvre la garantie ?', 'Deux ans contre tout défaut de fabrication du mouvement et du boîtier, hors usure normale du bracelet et chocs.'],
  ['Faut-il remonter une montre automatique ?', 'Elle se remonte avec les mouvements du poignet. Après quelques jours sans être portée, quelques tours de couronne suffisent.'],
  ['Ajustez-vous le bracelet ?', 'Oui, gratuitement : indiquez votre tour de poignet lors de la commande, le bracelet est ajusté avant l\u2019envoi.'],
  ['Quels moyens de paiement acceptez-vous ?', 'Le paiement à la livraison, en espèces à la réception du colis, ou le virement bancaire : la montre est alors expédiée dès réception du virement.'],
];

export const LEGAL: Record<'cgv' | 'privacy', { title: string; updated: string; sections: [string, string][] }> = {
  cgv: {
    title: 'Conditions générales de vente',
    updated: 'Mise à jour : octobre 2026',
    sections: [
      ['Objet', 'Les présentes conditions régissent les ventes de montres réalisées sur le site GMBIJOUX auprès de clients particuliers.'],
      ['Prix', 'Les prix sont indiqués en dirhams marocains (DH), toutes taxes et livraison comprises, partout au Maroc.'],
      ['Commande', 'La commande est enregistrée dès sa validation sur le site ; nous vous contactons par téléphone pour la confirmer. Elle récapitule les articles, le prix et l\u2019adresse de livraison.'],
      ['Paiement', 'Le paiement s\u2019effectue à la livraison, en espèces, ou par virement bancaire avant expédition. En cas de virement, la commande est expédiée dès réception des fonds.'],
      ['Livraison', 'Les montres sont expédiées sous 24 h ouvrées (après réception du virement le cas échéant), assurées pendant le transport et remises en main propre.'],
      ['Rétractation', 'Vous disposez de 30 jours à compter de la réception pour retourner une montre non portée, dans son emballage d\u2019origine.'],
      ['Garantie', 'Toutes nos montres bénéficient d\u2019une garantie de 2 ans, en plus des garanties légales de conformité et des vices cachés.'],
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    updated: 'Mise à jour : octobre 2026',
    sections: [
      ['Données collectées', 'Identité, coordonnées, adresse de livraison et historique de commandes. Aucune donnée de carte bancaire n\u2019est collectée sur le site.'],
      ['Finalités', 'Traitement des commandes, service client, suivi des garanties et, avec votre accord, envoi de la newsletter.'],
      ['Conservation', 'Les données sont conservées pendant la durée de la relation commerciale, puis archivées selon les obligations légales.'],
      ['Vos droits', 'Vous disposez d\u2019un droit d\u2019accès, de rectification, d\u2019effacement et d\u2019opposition, exerçable à tout moment auprès de notre service client.'],
      ['Cookies', 'Des cookies techniques assurent le fonctionnement du site ; les cookies de mesure d\u2019audience ne sont déposés qu\u2019avec votre consentement.'],
      ['Contact', 'Pour toute question relative à vos données : contact@gmbijoux.fr.'],
    ],
  },
};

export const PILLARS = [
  { n: '01', t: 'Sélection exigeante', d: 'Une collection courte, chaque modèle retenu pour sa finition et sa fiabilité.' },
  { n: '02', t: 'Contrôle en atelier', d: 'Marche, étanchéité et finitions vérifiées avant chaque expédition.' },
  { n: '03', t: 'Service durable', d: 'Garantie 2 ans, ajustement offert, retours gratuits sous 30 jours.' },
];

/** Prix en dirhams marocains : « 13 900 DH ». */
export const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' DH';
export const stars = (r: number) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
export const ratingF = (r: number) => r.toFixed(1).replace('.', ',');
export const refOf = (p: Product) => 'GM-' + p.id.slice(0, 3).toUpperCase() + '-' + (p.dims.match(/\d+/) || [''])[0];
export const isNew = (p: Product) => p.cats.includes('new');
export const badgeOf = (p: Product) =>
  p.old ? '−' + Math.round((1 - p.price / p.old) * 100) + ' %' : isNew(p) ? 'Nouveau' : '';
