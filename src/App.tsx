import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useCatalog } from './catalog';
import { AccessGate } from './components/AccessGate';
import { Footer, Header, Overlays, TopBar } from './components/Shell';
import { useLayout, useReveal } from './layout';
import Admin from './pages/Admin';
import Cart, { Checkout } from './pages/Cart';
import { About, Account, Charte, Contact, Faq, Legal, NotFound } from './pages/Content';
import Home from './pages/Home';
import Product from './pages/Product';
import Shop, { Collections } from './pages/Shop';
import { flushPixel, initPixel, track } from './pixel';
import { PATHS } from './routes';
import { HOME_TITLE, SHOP_PITCH, setMeta } from './seo';
import { useStore } from './store';

const TITLES: Record<string, string> = {
  [PATHS.collections]: 'Collections',
  [PATHS.cart]: 'Panier',
  [PATHS.checkout]: 'Commande',
  [PATHS.about]: 'À propos',
  [PATHS.contact]: 'Contact',
  [PATHS.faq]: 'Questions fréquentes',
  [PATHS.cgv]: 'Conditions générales de vente',
  [PATHS.privacy]: 'Confidentialité',
  [PATHS.account]: 'Mon compte',
  [PATHS.charte]: 'Charte graphique',
};
/** Pages de la boutique : mêmes titres que l'API (backend/src/catalog/seo.controller.ts). */
const SHOP_TITLES: Record<string, string> = {
  '/montres': 'Toutes les montres',
  '/montres/homme': 'Montres homme',
  '/montres/femme': 'Montres femme',
  '/montres/automatiques': 'Montres automatiques',
  '/montres/classiques': 'Montres classiques',
  '/montres/sport': 'Montres sport',
  '/montres/avec-coffret': 'Montres avec coffret',
  '/montres/boite-simple': 'Montres en boîte simple',
  '/montres/nouveautes': 'Nouveautés',
};
/** Pages personnelles : jamais dans les résultats de recherche. */
const PRIVATE = [PATHS.cart, PATHS.checkout, PATHS.account, PATHS.charte];

export default function App() {
  const L = useLayout();
  const { pathname } = useLocation();
  const { closeAll } = useStore();
  const { site, unlocked } = useCatalog();

  useReveal(pathname);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    closeAll();
    // Fiche montre : balises posées par la page elle-même (nom, prix, description).
    if (pathname.startsWith('/montre/')) return;
    if (pathname.startsWith(PATHS.admin)) { setMeta({ title: 'Administration — GMBIJOUX', path: pathname, noindex: true }); return; }
    if (pathname === '/') { setMeta({ title: HOME_TITLE, path: '/' }); return; }
    const shop = SHOP_TITLES[pathname];
    const t = shop ?? TITLES[pathname] ?? 'Montres';
    setMeta({
      title: `${t} — GMBIJOUX`,
      description: shop ? `${shop} au Maroc, boutique GMBIJOUX à Casablanca. ${SHOP_PITCH}` : undefined,
      path: pathname,
      noindex: PRIVATE.includes(pathname) || (!shop && !TITLES[pathname]),
    });
  }, [pathname, closeAll]);
  // Pixel Meta : une vue de page à chaque changement d'adresse (pas dans l'administration).
  useEffect(() => {
    if (!site || pathname.startsWith(PATHS.admin)) return;
    if (site.pixelId) {
      initPixel(site.pixelId);
      track('PageView');
    }
    flushPixel();
  }, [pathname, site]);

  if (pathname.startsWith(PATHS.admin)) return <Admin />;
  // Boutique en accès privé : rien n'est affiché avant la saisie du code.
  if (!site) return <div style={{ minHeight: '100vh', background: 'var(--ivory)' }} />;
  if (site.private && !site.unlocked) return <AccessGate onUnlock={unlocked} />;

  const isHome = pathname === '/';
  const isProduct = pathname.startsWith('/montre/');
  const mainPb = isProduct && L.mobile ? '200px' : isHome ? '0px' : L.sec;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', overflowX: 'clip', position: 'relative' }}>
      <TopBar />
      <Header />
      <main style={{ paddingBottom: mainPb }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/montres" element={<Shop />} />
          <Route path="/montres/:cat" element={<Shop />} />
          <Route path="/montre/:id" element={<Product />} />
          <Route path={PATHS.collections} element={<Collections />} />
          <Route path={PATHS.cart} element={<Cart />} />
          <Route path={PATHS.checkout} element={<Checkout />} />
          <Route path={PATHS.about} element={<About />} />
          <Route path={PATHS.contact} element={<Contact />} />
          <Route path={PATHS.faq} element={<Faq />} />
          <Route path={PATHS.cgv} element={<Legal kind="cgv" />} />
          <Route path={PATHS.privacy} element={<Legal kind="privacy" />} />
          <Route path={PATHS.account} element={<Account />} />
          <Route path={PATHS.charte} element={<Charte />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Overlays />
    </div>
  );
}
