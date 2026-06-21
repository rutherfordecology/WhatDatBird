// Cloudflare Worker — Xeno-canto API v3 proxy for WhatDatBird
// Set XC_KEY as a Secret via: wrangler secret put XC_KEY --name whatdatbird-xc-proxy

const ALLOWED_ORIGINS = [
  'https://rutherfordecology.github.io',
  'http://localhost:8765',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const gen = url.searchParams.get('gen');
      const sp  = url.searchParams.get('sp');

      if (!gen || !sp) {
        return new Response(JSON.stringify({ error: 'Missing gen or sp' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const base = `gen:${encodeURIComponent(gen)}+sp:${encodeURIComponent(sp)}+grp:birds+q:">C"`;
      const key  = encodeURIComponent(env.XC_KEY);

      // Try with length filter first; fall back to any length if no results
      let xcRes = await fetch(`https://xeno-canto.org/api/3/recordings?query=${base}+len:"<15"&per_page=10&key=${key}`);
      let body  = await xcRes.text();
      let d     = JSON.parse(body);

      if (!d.recordings?.length) {
        xcRes = await fetch(`https://xeno-canto.org/api/3/recordings?query=${base}&per_page=10&key=${key}`);
        body  = await xcRes.text();
      }

      return new Response(body, {
        status: xcRes.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Worker error', detail: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
