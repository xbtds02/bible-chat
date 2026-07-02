// Bible Chat Worker - v2 通用代理版
// 接收前端请求 → 转发到 apicz.cc 中转站 → 返回带 CORS 头的响应
// 解决浏览器跨域问题

const TARGET_BASE = 'https://www.apicz.cc';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(body, status = 200, extra = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...extra },
  });
}

export default {
  async fetch(request, env, ctx) {
    // 1. 预检直接返回
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 2. 健康检查
    if (url.pathname === '/health') {
      return corsResponse({ status: 'ok', service: 'biblechat-proxy', time: new Date().toISOString() });
    }

    // 3. 透传：/v1/* 直接转发到 https://www.apicz.cc/v1/*
    if (url.pathname.startsWith('/v1/')) {
      const targetUrl = TARGET_BASE + url.pathname + url.search;

      // 构造转发 headers
      const newHeaders = new Headers();
      const ct = request.headers.get('Content-Type');
      if (ct) newHeaders.set('Content-Type', ct);
      // 优先用调用方传入的 Authorization (本地 API Key)
      // 否则用环境变量
      const auth = request.headers.get('Authorization') || ('Bearer ' + (env.API_KEY || ''));
      newHeaders.set('Authorization', auth);

      // 处理 body
      let body = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.text();
      }

      try {
        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers: newHeaders,
          body: body,
        });

        // 透传上游响应，但覆盖 CORS 头
        const responseHeaders = new Headers(upstream.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods']);
        responseHeaders.set('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers']);

        return new Response(upstream.body, {
          status: upstream.status,
          headers: responseHeaders,
        });
      } catch (e) {
        return corsResponse({ error: e.message }, 502);
      }
    }

    // 4. 默认 404
    return corsResponse({
      error: 'Not found',
      usage: 'POST /v1/chat/completions',
      health: 'GET /health',
    }, 404);
  },
};
