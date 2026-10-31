import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQ, LEGAL, PILLARS } from '../data';
import { useLayout } from '../layout';
import { PATHS, shopPath } from '../routes';

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: 16, padding: '14px 0', borderTop: '1px solid var(--line)' };
const rowKey: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--graphite)' };

export function About() {
  const L = useLayout();
  return (
    <>
      <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>
        <span className="mono">À propos</span>
        <h1 className="display" style={{ letterSpacing: '-.015em', lineHeight: 1, fontSize: L.h1 }}>Le temps, à haute altitude.</h1>
        <p style={{ margin: 0, maxWidth: 600, fontSize: 18, lineHeight: 1.65, color: 'var(--body)' }}>
          AERO WATCH est née d’une passion pour les instruments de bord et l’horlogerie de caractère. Une sélection courte, des finitions irréprochables et un service qui accompagne la pièce bien après l’achat.
        </p>
      </section>
      <section data-reveal style={{ padding: `${L.sec} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split, gap: L.pGap, alignItems: 'end' }}>
        <div className="ph" style={{ aspectRatio: '4/5' }}><span className="ph-caption">photo · l’atelier AERO WATCH</span></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PILLARS.map((pl) => (
            <div key={pl.n} style={{ padding: '26px 0', borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', gap: 12 }}>
              <span className="mono" style={{ letterSpacing: '.14em' }}>{pl.n}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontStretch: '115%', fontWeight: 600, textTransform: 'uppercase', fontSize: 15 }}>{pl.t}</span>
                <span style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)' }}>{pl.d}</span>
              </span>
            </div>
          ))}
          <Link className="btn btn-primary" to={shopPath('all')} style={{ marginTop: 20, alignSelf: 'flex-start' }}>Découvrir la collection</Link>
        </div>
      </section>
    </>
  );
}

const CONTACT_INFO = [
  { k: 'Service client', v: 'Du lundi au samedi, 9 h – 19 h' },
  { k: 'E-mail', v: 'contact@aerowatch.mygympro.club' },
  { k: 'Réponse', v: 'Sous 24 h ouvrées' },
];

export function Contact() {
  const L = useLayout();
  const [sent, setSent] = useState(false);
  const span = (full?: boolean) => (full || L.mobile ? 'span 2' : 'span 1');
  return (
    <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="mono">Contact</span>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Parlons de votre montre.</h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 380 }}>
          Conseil, taille de bracelet, suivi de commande : un conseiller vous répond sous 24 h.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {CONTACT_INFO.map((ci) => (
            <div key={ci.k} style={{ padding: '16px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={rowKey}>{ci.k}</span>
              {ci.k === 'E-mail' ? <a href={`mailto:${ci.v}`} style={{ fontSize: 15 }}>{ci.v}</a> : <span style={{ fontSize: 15 }}>{ci.v}</span>}
            </div>
          ))}
        </div>
      </div>
      {sent ? (
        <div role="status" style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: 40, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}>
          <span style={{ fontStretch: '125%', fontWeight: 500, textTransform: 'uppercase', fontSize: 20 }}>Message envoyé.</span>
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>Merci, nous revenons vers vous sous 24 h.</span>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: L.boxPad, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, alignSelf: 'start' }}
        >
          <label className="field" style={{ gridColumn: span() }}>Nom<input name="name" required placeholder="Camille Martin" autoComplete="name" /></label>
          <label className="field" style={{ gridColumn: span() }}>E-mail<input name="email" type="email" required placeholder="camille@exemple.fr" autoComplete="email" /></label>
          <label className="field" style={{ gridColumn: span(true) }}>Sujet<input name="subject" placeholder="Conseil, commande, garantie…" /></label>
          <label className="field" style={{ gridColumn: 'span 2' }}>Message<textarea name="message" required rows={6} placeholder="Votre message" /></label>
          <button type="submit" className="btn btn-primary btn-tall" style={{ gridColumn: 'span 2' }}>Envoyer</button>
        </form>
      )}
    </section>
  );
}

export function Faq() {
  const L = useLayout();
  const [open, setOpen] = useState(0);
  return (
    <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span className="mono">Aide</span>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Questions fréquentes</h1>
        <Link className="link-underline" to={PATHS.contact} style={{ alignSelf: 'flex-start' }}>Nous contacter</Link>
      </div>
      <div style={{ borderBottom: '1px solid var(--line)' }}>
        {FAQ.map(([q, a], i) => (
          <div key={q} style={{ borderTop: '1px solid var(--line)' }}>
            <button
              aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '22px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', fontSize: 16, fontWeight: 500 }}
            >
              <span>{q}</span>
              <span style={{ flex: 'none', width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p id={`faq-${i}`} style={{ margin: 0, padding: '0 48px 24px 0', fontSize: 15, lineHeight: 1.7, color: 'var(--muted)' }}>{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Legal({ kind }: { kind: 'cgv' | 'privacy' }) {
  const L = useLayout();
  const legal = LEGAL[kind];
  const sections = legal.sections.map(([t, b], i) => ({ n: String(i + 1).padStart(2, '0'), t, b }));
  return (
    <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: L.sticky, top: 110, alignSelf: 'start' }}>
        <span className="mono">Informations légales · {legal.updated}</span>
        <h1 className="display" style={{ fontSize: L.h3 }}>{legal.title}</h1>
        {L.desktop && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {sections.map((ls) => <a key={ls.n} href={`#s-${ls.n}`} style={{ fontSize: 13.5, color: 'var(--muted)' }}>{ls.n} — {ls.t}</a>)}
          </nav>
        )}
      </div>
      <div style={{ maxWidth: 680 }}>
        {sections.map((ls) => (
          <div key={ls.n} id={`s-${ls.n}`} style={{ padding: '26px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10, scrollMarginTop: 110 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em' }}>{ls.n}</span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{ls.t}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: 'var(--body)', textWrap: 'pretty' }}>{ls.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Account() {
  const L = useLayout();
  return (
    <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', justifyContent: 'center' }}>
      <form onSubmit={(e) => e.preventDefault()} style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 className="display" style={{ margin: '0 0 8px', lineHeight: 1, fontSize: L.h3, textAlign: 'center' }}>Mon compte</h1>
        <label className="field">E-mail<input type="email" required placeholder="camille@exemple.fr" autoComplete="email" /></label>
        <label className="field">Mot de passe<input type="password" required placeholder="••••••••" autoComplete="current-password" /></label>
        <button type="submit" className="btn btn-primary btn-tall">Se connecter</button>
        <button type="button" className="btn btn-outline btn-tall">Créer un compte</button>
        <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--graphite)' }}>Suivi de commande, favoris et garanties enregistrées.</span>
      </form>
    </section>
  );
}

const ANALYSIS = [
  { k: 'Forme', v: 'Un médaillon rond cerclé d’or, comme un cadran : il devient le motif récurrent du site (visuel du hero, boutons pilules).' },
  { k: 'Symbole', v: 'Le monogramme AW croisé, entre aiguilles et ailes : la précision et l’altitude.' },
  { k: 'Lettrage', v: 'Capitales à empattements, très espacées (Cormorant Garamond) pour les titres ; sans-serif fine pour le texte.' },
  { k: 'Couleur', v: 'Noir nuit, ivoire et or, avec un vert sapin en rappel du cadran : le contraste porte le luxe, les photos apportent la matière.' },
];
const PALETTE = [
  { name: 'Nuit', hex: 'var(--ivory)', use: 'fond' },
  { name: 'Ivoire', hex: 'var(--ink)', use: 'texte' },
  { name: 'Or', hex: 'var(--gold)', use: 'accents, boutons' },
  { name: 'Sapin', hex: 'var(--green)', use: 'bandeau, rappels' },
  { name: 'Surface', hex: 'var(--surface)', use: 'cartes' },
  { name: 'Pierre', hex: 'var(--stone)', use: 'fonds image' },
  { name: 'Trait', hex: 'var(--line)', use: 'bordures 1 px' },
  { name: 'Graphite', hex: 'var(--graphite)', use: 'texte secondaire' },
];
const RULES = [
  { k: 'Boutons', v: 'Pilule, 54–56 px de haut, capitales 12 px espacées ; or plein pour l’action principale, contour or sinon. Survol : léger soulèvement de 1 px.' },
  { k: 'Cartes', v: 'Sans bordure ni ombre ; la montre au centre sur fond Pierre, informations sous l’image. Survol : zoom lent de 5 % sur la photo.' },
  { k: 'Espacements', v: 'Échelle 4 · 8 · 12 · 16 · 24 · 32 · 56 · 96 · 128 px. Sections espacées de 128 px (72 px sur mobile).' },
  { k: 'Grille', v: 'Marges 72 px desktop / 20 px mobile ; produits en 4 colonnes, 2 colonnes sur mobile.' },
  { k: 'Mouvement', v: 'Apparitions en fondu + 20 px à l’entrée dans l’écran, courbe douce (.2,.7,.2,1), 0,4 à 1 s. Jamais de rebond.' },
];

export function Charte() {
  const L = useLayout();
  const pill: React.CSSProperties = { height: 54, padding: '0 30px', borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' };
  return (
    <section style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: L.sec }}>
      <div data-reveal style={{ display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap, alignItems: 'center' }}>
        <img src="/aero-emblem.png" alt="Logo AERO WATCH" style={{ width: '100%', maxWidth: 340, aspectRatio: '1', objectFit: 'contain', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="mono">01 — Analyse du logo</span>
          <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Charte graphique</h1>
          {ANALYSIS.map((an) => <div key={an.k} style={row}><span style={rowKey}>{an.k}</span><span style={{ fontSize: 14.5, lineHeight: 1.6 }}>{an.v}</span></div>)}
        </div>
      </div>
      <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span className="mono">02 — Palette (issue du logo)</span>
        <div style={{ display: 'grid', gridTemplateColumns: L.g5, gap: 12 }}>
          {PALETTE.map((c) => (
            <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ aspectRatio: '4/3', background: c.hex, border: '1px solid var(--line)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--graphite)' }}>{c.hex} · {c.use}</span>
            </div>
          ))}
        </div>
      </div>
      <div data-reveal style={{ display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
        <span className="mono">03 — Typographie</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontStretch: '125%', fontWeight: 500, textTransform: 'uppercase', fontSize: 44, lineHeight: 1 }}>Archivo Expanded</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--graphite)' }}>Titres · capitales · largeur 125 % · 500 — écho aux lettres massives du logo</span>
          </div>
          <div style={{ padding: '20px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1.6 }}>Archivo Regular — textes courants, 15–18 px, interlignage 1,6–1,7.</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--graphite)' }}>Corps · boutons (600, capitales espacées 0,16 em)</span>
          </div>
          <div style={{ padding: '20px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '.16em', textTransform: 'uppercase' }}>IBM Plex Mono — Réf. GM-NOC-40 · 100 m</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--graphite)' }}>Références, fiches techniques, surtitres — le registre de la précision</span>
          </div>
        </div>
      </div>
      <div data-reveal style={{ display: 'grid', gridTemplateColumns: L.split2, gap: L.pGap }}>
        <span className="mono">04 — Boutons, cartes, espacements</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ ...pill, background: 'var(--deep)', color: 'var(--cream)' }}>Principal</span>
            <span style={{ ...pill, border: '1px solid var(--ink)' }}>Secondaire</span>
            <span style={{ padding: '4px 0', borderBottom: '1px solid var(--ink)', fontSize: 11.5, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase' }}>Lien texte</span>
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--deep)' }} />
          </div>
          {RULES.map((ru) => <div key={ru.k} style={row}><span style={rowKey}>{ru.k}</span><span style={{ fontSize: 14.5, lineHeight: 1.6 }}>{ru.v}</span></div>)}
        </div>
      </div>
    </section>
  );
}

export function NotFound() {
  const L = useLayout();
  return (
    <section style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}>
      <span className="mono">Erreur 404</span>
      <h1 className="display" style={{ fontSize: L.h2 }}>Cette page n’existe pas.</h1>
      <Link className="btn btn-primary" to="/">Retour à l’accueil</Link>
    </section>
  );
}
