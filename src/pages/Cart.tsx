import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { QtyStepper } from '../components/Shell';
import { useCatalog } from '../catalog';
import { fmt } from '../data';
import { useLayout } from '../layout';
import { PATHS, productPath, shopPath } from '../routes';
import { useStore } from '../store';

export default function Cart() {
  const L = useLayout();
  const navigate = useNavigate();
  const s = useStore();
  const { status } = useCatalog();
  // Panier enregistré mais catalogue pas encore chargé : on attend plutôt que d'afficher « vide ».
  if (status === 'loading' && s.cart.length) return <CartLoading />;
  return (
    <section data-reveal style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Panier</h1>
        <span className="mono" style={{ letterSpacing: '.14em' }}>{s.count} article{s.count > 1 ? 's' : ''}</span>
      </div>
      {s.count === 0 ? (
        <div style={{ padding: '72px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
          <p style={{ margin: 0, fontSize: 17, color: 'var(--muted)' }}>Votre panier est vide.</p>
          <Link className="btn btn-primary" to={shopPath('all')}>Découvrir les montres</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: L.cartCols, gap: L.pGap, alignItems: 'start' }}>
          <div>
            {s.items.map((l) => {
              const p = l.product;
              return (
                <div key={l.key} style={{ display: 'grid', gridTemplateColumns: L.lineCols, gap: 20, padding: '24px 0', borderTop: '1px solid var(--line)', alignItems: 'center' }}>
                  <Link to={productPath(p.id)} className="ph" aria-label={p.name} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: '50%', aspectRatio: '1', borderRadius: '50%', border: '1px solid rgba(17,17,17,.17)' }} />
                  </Link>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em' }}>Réf. {l.sku}</span>
                        <span style={{ fontStretch: '115%', fontWeight: 600, textTransform: 'uppercase', fontSize: 15 }}>{p.name}</span>
                        {l.label && <span style={{ fontSize: 13.5 }}>{l.label}</span>}
                        <span style={{ fontSize: 13, color: 'var(--graphite)' }}>{fmt(l.unit)} l’unité</span>
                      </div>
                      <span style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{fmt(l.unit * l.qty)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <QtyStepper qty={l.qty} h={44} onDec={() => s.setQty(l.key, -1)} onInc={() => s.setQty(l.key, 1)} />
                      <button onClick={() => s.remove(l.key)} style={{ background: 'none', border: 0, borderBottom: '1px solid var(--faint)', padding: '2px 0', cursor: 'pointer', fontSize: 12.5, color: 'var(--muted)' }}>Retirer</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside style={{ position: L.sticky, top: 110, background: '#fff', border: '1px solid var(--line)', padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">Récapitulatif</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}><span>Sous-total</span><span>{fmt(s.subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600 }}>Total TTC</span>
              <span style={{ fontStretch: '110%', fontSize: 24, fontWeight: 500 }}>{fmt(s.subtotal)}</span>
            </div>
            <button className="btn btn-primary btn-tall" style={{ marginTop: 8 }} onClick={() => navigate(PATHS.checkout)}>Passer commande</button>
            <span style={{ fontSize: 12.5, color: 'var(--graphite)', lineHeight: 1.5 }}>Livraison incluse partout au Maroc · Paiement à la livraison ou par virement bancaire</span>
          </aside>
        </div>
      )}
    </section>
  );
}

function CartLoading() {
  const L = useLayout();
  return (
    <section aria-busy="true" style={{ padding: `${L.pageTop} ${L.px} 0` }}>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>Chargement du panier…</p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Commande                                                             */
/* ------------------------------------------------------------------ */

type Field = { name: keyof Address; label: string; ph: string; full?: boolean; type?: string; autoComplete?: string; optional?: boolean; list?: string };
type Address = { firstName: string; lastName: string; email: string; phone: string; line1: string; city: string; postalCode: string };
type Pay = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
type Quote = { subtotalCents: number; discountCents: number; totalCents: number; couponCode: string | null };
type Confirmation = { number: string; totalCents: number; paymentMethod: Pay; bankTransfer: { holder: string | null; bank: string | null; rib: string | null; reference: string } | null };

const SHIP_FIELDS: Field[] = [
  { name: 'firstName', label: 'Prénom', ph: 'Yasmine', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Nom', ph: 'Bennani', autoComplete: 'family-name' },
  { name: 'email', label: 'E-mail', ph: 'yasmine@exemple.ma', full: true, type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Téléphone', ph: '06 12 34 56 78', full: true, type: 'tel', autoComplete: 'tel' },
  { name: 'line1', label: 'Adresse', ph: '120 boulevard d’Anfa, appartement 4', full: true, autoComplete: 'street-address' },
  { name: 'city', label: 'Ville', ph: 'Casablanca', autoComplete: 'address-level2', list: 'gm-cities' },
  { name: 'postalCode', label: 'Code postal (facultatif)', ph: '20050', autoComplete: 'postal-code', optional: true },
];
const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Salé', 'Mohammédia', 'El Jadida', 'Safi', 'Témara', 'Nador', 'Béni Mellal', 'Laâyoune'];
const PAY_OPTS: { id: Pay; t: string; d: string }[] = [
  { id: 'CASH_ON_DELIVERY', t: 'Paiement à la livraison', d: 'En espèces, à la remise du colis. Nous vous appelons pour confirmer la commande.' },
  { id: 'BANK_TRANSFER', t: 'Virement bancaire', d: 'Payez avant la livraison : la montre est expédiée dès réception du virement.' },
];
const EMPTY: Address = { firstName: '', lastName: '', email: '', phone: '', line1: '', city: '', postalCode: '' };
const newKey = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function Radio({ on, onClick, title, sub, right, disabled }: { on: boolean; onClick: () => void; title: string; sub: string; right?: string; disabled?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 20px', background: '#fff', border: `1px solid ${on ? '#111' : 'var(--line)'}`, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'border-color .3s', opacity: disabled ? 0.45 : 1 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', border: '1px solid #111', boxShadow: 'inset 0 0 0 3px #fff', background: on ? '#111' : '#fff' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: 13, color: 'var(--graphite)', lineHeight: 1.45 }}>{sub}</span>
        </span>
      </span>
      {right && <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{right}</span>}
    </button>
  );
}

export function Checkout() {
  const L = useLayout();
  const s = useStore();
  const [step, setStep] = useState(1);
  const [addr, setAddr] = useState<Address>(EMPTY);
  const [pay, setPay] = useState<Pay>('CASH_ON_DELIVERY');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);
  const [idemKey, setIdemKey] = useState(newKey);
  const { status } = useCatalog();

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const items = s.items.map((l) => ({ slug: l.product.id, variantId: l.variant?.id, quantity: l.qty }));
  const itemsKey = JSON.stringify(items);

  // Totaux calculés par le serveur (promotions, coupon) dès que les choix changent. La livraison est incluse dans le prix.
  useEffect(() => {
    if (!items.length || step === 3) return;
    let live = true;
    api<{ data: Quote }>('/orders/quote', { method: 'POST', body: { items: JSON.parse(itemsKey), paymentMethod: pay, country: 'MA', couponCode: coupon || undefined } })
      .then((r) => { if (live) { setQuote(r.data); setError(''); } })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.code.startsWith('COUPON_')) { setCouponError(e.message); setCoupon(''); return; }
        setQuote(null);
        setError(e instanceof ApiError ? e.message : 'Serveur injoignable, réessayez dans un instant.');
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, pay, coupon, step]);

  if (step < 3 && status === 'loading' && s.cart.length) return <CartLoading />;
  if (step < 3 && s.count === 0) {
    return (
      <section style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Commande</h1>
        <p style={{ margin: 0, fontSize: 17, color: 'var(--muted)' }}>Votre panier est vide.</p>
        <Link className="btn btn-primary" to={shopPath('all')}>Découvrir les montres</Link>
      </section>
    );
  }

  const discount = quote ? quote.discountCents / 100 : 0;
  const total = quote ? quote.totalCents / 100 : s.subtotal;

  const placeOrder = async () => {
    setBusy(true); setError('');
    try {
      const r = await api<{ data: Confirmation }>('/orders', {
        method: 'POST', headers: { 'Idempotency-Key': idemKey },
        body: {
          items, paymentMethod: pay, couponCode: coupon || undefined,
          customer: { firstName: addr.firstName, lastName: addr.lastName, email: addr.email, phone: addr.phone },
          address: { line1: addr.line1, city: addr.city, postalCode: addr.postalCode || undefined, country: 'MA' },
        },
      });
      setDone(r.data); s.clear(); setIdemKey(newKey()); setStep(3);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Serveur injoignable, votre commande n’a pas été enregistrée. Réessayez.');
    } finally { setBusy(false); }
  };

  return (
    <section style={{ padding: `${L.pageTop} ${L.px} 0`, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
        <h1 className="display" style={{ lineHeight: 1, fontSize: L.h2 }}>Commande</h1>
        <ol style={{ display: 'flex', gap: 18, margin: 0, padding: 0, listStyle: 'none' }}>
          {['Adresse', 'Paiement', 'Confirmation'].map((label, i) => {
            const on = i + 1 <= step;
            return (
              <li key={label} aria-current={i + 1 === step ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: on ? '#111' : 'var(--faint)' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${on ? '#111' : 'var(--faint)'}`, background: on ? '#111' : 'transparent', color: on ? '#fff' : 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{i + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>

      {step === 3 && done ? (
        <div data-reveal style={{ padding: '56px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <img src="/logo.png" alt="" style={{ width: 88, height: 88, objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <h2 className="display" style={{ fontSize: L.h3 }}>Merci, votre commande est enregistrée.</h2>
          <p style={{ margin: 0, maxWidth: 520, fontSize: 15.5, lineHeight: 1.65, color: 'var(--muted)' }}>
            Commande <strong style={{ color: '#111' }}>{done.number}</strong> · {fmt(done.totalCents / 100)}.{' '}
            {done.paymentMethod === 'CASH_ON_DELIVERY'
              ? 'Notre équipe vous appelle pour la confirmer ; vous réglerez en espèces à la remise du colis.'
              : 'Votre montre sera expédiée dès réception de votre virement.'}
          </p>
          {done.bankTransfer && (
            <div style={{ width: 'min(520px,100%)', background: '#fff', border: '1px solid var(--line)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
              <span className="mono">Coordonnées du virement</span>
              {([['Titulaire', done.bankTransfer.holder], ['Banque', done.bankTransfer.bank], ['RIB', done.bankTransfer.rib], ['Montant', fmt(done.totalCents / 100)], ['Motif à indiquer', done.bankTransfer.reference]] as [string, string | null][])
                .filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14.5, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--graphite)' }}>{k}</span><span style={{ fontFamily: k === 'RIB' || k === 'Motif à indiquer' ? 'var(--mono)' : undefined, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              <span style={{ fontSize: 12.5, color: 'var(--graphite)', lineHeight: 1.5 }}>Indiquez le numéro de commande dans le motif du virement. Sans réception sous 7 jours, la commande est annulée.</span>
            </div>
          )}
          <Link className="btn btn-primary" to={shopPath('all')}>Continuer la visite</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: L.cartCols, gap: L.pGap, alignItems: 'start' }}>
          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <span className="mono">Adresse de livraison · Maroc</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                {SHIP_FIELDS.map((f) => (
                  <label key={f.name} className="field" style={{ gridColumn: f.full || L.mobile ? 'span 2' : 'span 1' }}>
                    {f.label}
                    <input name={f.name} type={f.type ?? 'text'} required={!f.optional} placeholder={f.ph} autoComplete={f.autoComplete} list={f.list}
                      value={addr[f.name]} onChange={(e) => setAddr((a) => ({ ...a, [f.name]: e.target.value }))}
                      {...(f.name === 'postalCode' && { inputMode: 'numeric' as const, pattern: '[0-9]{5}', title: '5 chiffres' })}
                      {...(f.name === 'phone' && { minLength: 8, maxLength: 20, title: 'Ex. 06 12 34 56 78' })} />
                  </label>
                ))}
                <datalist id="gm-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <span style={{ fontSize: 13, color: 'var(--graphite)' }}>Livraison incluse dans le prix, partout au Maroc.</span>
              <button type="submit" className="btn btn-primary btn-tall">Continuer vers le paiement</button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (!busy && quote) placeOrder(); }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <span className="mono">Mode de paiement</span>
              <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PAY_OPTS.map((o) => (
                  <Radio key={o.id} on={pay === o.id} onClick={() => setPay(o.id)} title={o.t} sub={o.d}
/>
                ))}
                <Radio on={false} onClick={() => undefined} disabled title="Carte bancaire" sub="Bientôt disponible" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="mono">Code promo</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }} placeholder="BIENVENUE10" aria-label="Code promo"
                    style={{ flex: 1, minWidth: 0, height: 50, padding: '0 16px', border: '1px solid var(--line-strong)', background: '#fff', fontSize: 14.5, fontFamily: 'var(--mono)', textTransform: 'uppercase' }} />
                  <button type="button" className="btn btn-outline" style={{ height: 50, padding: '0 22px' }}
                    onClick={() => { setCouponError(''); setCoupon(couponInput.trim().toUpperCase()); }}>Appliquer</button>
                </div>
                {couponError && <span role="alert" style={{ fontSize: 13, color: 'oklch(0.55 0.15 25)' }}>{couponError}</span>}
                {quote?.couponCode && <span style={{ fontSize: 13, color: 'var(--graphite)' }}>Code {quote.couponCode} appliqué · <button type="button" onClick={() => { setCoupon(''); setCouponInput(''); }} style={{ background: 'none', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontSize: 13 }}>retirer</button></span>}
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '16px 18px', fontSize: 14, lineHeight: 1.6 }}>
                <span className="mono" style={{ display: 'block', marginBottom: 6 }}>Livraison à</span>
                {addr.firstName} {addr.lastName} · {addr.phone}<br />{addr.line1}, {addr.postalCode ? addr.postalCode + ' ' : ''}{addr.city}, Maroc
                <button type="button" onClick={() => setStep(1)} style={{ display: 'block', marginTop: 6, background: 'none', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 13, color: 'var(--graphite)' }}>Modifier</button>
              </div>
              {error && (
                <div role="alert" style={{ padding: '14px 16px', border: '1px solid oklch(0.55 0.15 25)', color: 'oklch(0.45 0.15 25)', fontSize: 14, lineHeight: 1.5 }}>
                  {error} <Link to={PATHS.cart} style={{ textDecoration: 'underline', color: 'inherit' }}>Voir le panier</Link>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-outline btn-tall" style={{ padding: '0 26px' }} onClick={() => setStep(1)}>Retour</button>
                <button type="submit" disabled={busy || !quote} className="btn btn-primary btn-tall" style={{ flex: 1, minWidth: 200, opacity: busy || !quote ? 0.5 : 1 }}>
                  {busy ? 'Enregistrement…' : `Valider la commande · ${fmt(total)}`}
                </button>
              </div>
            </form>
          )}
          <aside style={{ position: L.sticky, top: 110, background: '#fff', border: '1px solid var(--line)', padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">Votre commande</span>
            {s.items.map((l) => (
              <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) auto', gap: 14, alignItems: 'center' }}>
                <span className="ph" style={{ aspectRatio: '1', backgroundImage: l.product.image ? `url(${l.product.image})` : 'repeating-linear-gradient(135deg,rgba(17,17,17,.05) 0 1px,transparent 1px 7px)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, textTransform: 'uppercase' }}>{l.product.name}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--graphite)' }}>{l.label ? l.label + ' · ' : ''}Qté {l.qty}</span>
                </span>
                <span style={{ fontSize: 14 }}>{fmt(l.unit * l.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}><span>Sous-total</span><span>{fmt(quote ? quote.subtotalCents / 100 : s.subtotal)}</span></div>
            {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Code {quote?.couponCode}</span><span>−{fmt(discount)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600 }}>Total TTC</span>
              <span style={{ fontStretch: '110%', fontSize: 22, fontWeight: 500 }}>{fmt(total)}</span>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
