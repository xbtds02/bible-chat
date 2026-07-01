// Bible Chat Worker Proxy
// 部署到 Cloudflare Workers，把前端请求转发到 apicz.cc 中转站，并加 CORS 头
// 部署命令: CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx node deploy-worker.js

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    // 支持 /v1/chat/completions 路径透传
    const targetUrl = 'https://www.apicz.cc' + url.pathname + url.search;

    // 构造转发请求
    const newHeaders = new Headers();
    newHeaders.set('Content-Type', request.headers.get('Content-Type') || 'application/json');
    // 优先用调用方传入的 Authorization，否则用环境变量 API_KEY
    const auth = request.headers.get('Authorization') || ('Bearer ' + (env.API_KEY || ''));
    newHeaders.set('Authorization', auth);

    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: body,
      });

      const responseHeaders = new Headers(upstream.headers);
      // 覆盖上游 CORS 头
      Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
