// Serves my Cloudflare Pages apps on subdomains of jomerjorge.com.
// Each subdomain is a Worker custom domain (see wrangler.jsonc), so Cloudflare manages its DNS record
// and certificate. Requests are passed through unchanged to the app's existing pages.dev deployment.
const ORIGINS = {
  'agrilink.jomerjorge.com': 'agrilink-abo.pages.dev',
  'doctorq.jomerjorge.com': 'doctorq.pages.dev',
  'jjm-inventory.jomerjorge.com': 'jjm-inventory.pages.dev',
  'learnwithmethamara.jomerjorge.com': 'learnwithmethamara.pages.dev',
  'jjmwifi.jomerjorge.com': 'jjmwifi.pages.dev',
  'photobooth.jomerjorge.com': 'photobooth-9xt.pages.dev',
  'free-file-transfer.jomerjorge.com': 'free-file-transfer.pages.dev',
  'metadatafixer.jomerjorge.com': 'metadatafixer.pages.dev',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = ORIGINS[url.hostname];
    if (!origin) return new Response('Not found', { status: 404 });

    const upstream = new URL(url.pathname + url.search, `https://${origin}`);
    const response = await fetch(new Request(upstream, request), { redirect: 'manual' });

    // Keep visitors on the subdomain if the app redirects to its own pages.dev address.
    const location = response.headers.get('location');
    if (location && location.includes(origin)) {
      const headers = new Headers(response.headers);
      headers.set('location', location.replace(`https://${origin}`, `https://${url.hostname}`));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return response;
  },
};
