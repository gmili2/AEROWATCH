// AERO WATCH — aerowatch.store est servi par le site hébergé sur aerowatch.mygympro.club (cPanel Namecheap).
const ORIGIN = 'aerowatch.mygympro.club';
const HOST = 'aerowatch.store';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== HOST) {
      url.hostname = HOST;
      return Response.redirect(url.toString(), 301);
    }

    const target = new URL(url.pathname + url.search, `https://${ORIGIN}`);
    const headers = new Headers(request.headers);
    // Adresse du visiteur pour l'API (limites par adresse, Pixel Meta).
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) headers.set('x-forwarded-for', ip);
    headers.set('x-forwarded-host', HOST);
    headers.set('x-aw-proxy', '1');

    const res = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });

    const out = new Response(res.body, res);
    const loc = out.headers.get('location');
    if (loc) out.headers.set('location', loc.replace(`//${ORIGIN}`, `//${HOST}`));
    return out;
  },
};
