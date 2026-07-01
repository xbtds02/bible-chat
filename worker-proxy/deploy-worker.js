// Cloudflare Worker 一键部署脚本（无需 wrangler）
// 用法:
//   set CLOUDFLARE_API_TOKEN=xxx
//   set CLOUDFLARE_ACCOUNT_ID=xxx
//   node deploy-worker.js
//
// 脚本会：1) 上传 Worker 脚本  2) 绑定 API_KEY secret  3) 启用 workers.dev 子域

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const WORKER_NAME = process.env.CLOUDFLARE_WORKER_NAME || 'biblechat-proxy';
// 留空则用脚本里写死的 Key；可以通过环境变量覆盖
const API_KEY = process.env.API_KEY || 'sk-701054c896ed09980a432b91740775a4bd3c623e16abb11d1e341342502d17f1';

if (!TOKEN || !ACCOUNT_ID) {
  console.error('\u274c \u7f3a\u5c11\u73af\u5883\u53d8\u91cf: CLOUDFLARE_API_TOKEN \u548c CLOUDFLARE_ACCOUNT_ID');
  console.error('\n\u8bf7\u5728 PowerShell \u4e2d\u8bbe\u7f6e:');
  console.error('  $env:CLOUDFLARE_API_TOKEN="\u4f60\u7684token"');
  console.error('  $env:CLOUDFLARE_ACCOUNT_ID="\u4f60\u7684account_id"');
  console.error('  node deploy-worker.js');
  process.exit(1);
}

const headers = { 'Authorization': `Bearer ${TOKEN}` };
const accountBase = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

async function api(method, path, body, isForm) {
  const opts = { method, headers: { ...headers } };
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(accountBase + path, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    console.error('\u274c \u8bf7\u6c42\u5931\u8d25', method, path, ':', res.status);
    console.error(JSON.stringify(data, null, 2));
    throw new Error('API call failed');
  }
  return data;
}

(async () => {
  console.log(`\ud83d\ude80 \u90e8\u7f72 Worker: ${WORKER_NAME}`);

  // 1. 读取脚本
  const scriptPath = path.join(__dirname, 'index.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  console.log(`\ud83d\udcdd \u811a\u672c\u5927\u5c0f: ${(scriptContent.length/1024).toFixed(1)} KB`);

  // 2. 上传 Worker (用 ES Module 格式)
  const form = new FormData();
  form.append('metadata', JSON.stringify({
    main_module: 'index.js',
    compatibility_date: '2024-09-01',
    bindings: [
      { type: 'secret_text', name: 'API_KEY', text: API_KEY }
    ],
    observability: { enabled: false }
  }));
  form.append('index.js', new Blob([scriptContent], { type: 'application/javascript+module' }), 'index.js');

  console.log('\u23f3 \u4e0a\u4f20 Worker \u811a\u672c...');
  await api('PUT', `/workers/scripts/${WORKER_NAME}`, form, true);
  console.log('\u2705 Worker \u811a\u672c\u4e0a\u4f20\u6210\u529f');

  // 3. 启用 workers.dev 子域
  console.log('\u23f3 \u542f\u7528 workers.dev \u5b50\u57df...');
  try {
    await api('POST', `/workers/scripts/${WORKER_NAME}/subdomain`, { enabled: true, previews_enabled: true });
    console.log('\u2705 \u5b50\u57df\u5df2\u542f\u7528');
  } catch (e) {
    console.log('\u26a0\ufe0f  \u5b50\u57df\u53ef\u80fd\u5df2\u542f\u7528\uff0c\u7ee7\u7eed');
  }

  // 4. 查询子域前缀
  const sub = await api('GET', '/workers/subdomain');
  const subdomain = sub.result?.subdomain;
  if (!subdomain) throw new Error('\u65e0\u6cd5\u83b7\u53d6\u5b50\u57df\u524d\u7f00');

  const fullUrl = `https://${WORKER_NAME}.${subdomain}.workers.dev`;
  console.log('\n\ud83c\udf89 \u90e8\u7f72\u5b8c\u6210\uff01');
  console.log('Worker URL:', fullUrl);
  console.log('\n\ud83d\udcdd \u63a5\u4e0b\u6765\u4f60\u9700\u8981\uff1a');
  console.log('1. \u5728\u7ba1\u7406\u540e\u53f0 admin.html \u586b\u5165\u4ee5\u4e0b API \u5730\u5740\uff1a');
  console.log(`   ${fullUrl}/v1/chat/completions`);
  console.log('2. \u6216\u8005\u76f4\u63a5\u4fee\u6539 app.js \u91cc\u7684 DEFAULT_API_BASE');
  console.log('\n\ud83e\uddea \u6d4b\u8bd5\u4ee3\u7406\u662f\u5426\u53ef\u7528:');
  console.log(`   curl ${fullUrl}/health`);
})().catch(e => {
  console.error('\u274c \u90e8\u7f72\u5931\u8d25:', e.message);
  process.exit(1);
});
