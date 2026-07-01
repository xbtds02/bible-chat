# Cloudflare Worker 代理部署

## 为什么需要它
中转站 `apicz.cc` 不返回 `Access-Control-Allow-Origin` 头，浏览器跨域请求会被拦截。
这个 Worker 接收前端请求，转发到 apicz.cc，并加上 `*` 的 CORS 头。

## 准备
需要 Cloudflare 账号的：
1. **Account ID** — 登录 dash.cloudflare.com → Workers & Pages → 右侧能看到
2. **API Token** — 右上角 My Profile → API Tokens → Create Token → 选 "Edit Cloudflare Workers" 模板

## 部署
```cmd
cd worker-proxy
set CLOUDFLARE_API_TOKEN=你的token
set CLOUDFLARE_ACCOUNT_ID=你的account_id
node deploy-worker.js
```

成功后输出形如：
```
Worker URL: https://biblechat-api.xxx.workers.dev
```

## 改前端
把 `app.js` 顶部的：
```js
const API_BASE = 'https://www.apicz.cc/v1/chat/completions';
```
改为：
```js
const API_BASE = 'https://biblechat-api.xxx.workers.dev/v1/chat/completions';
```

然后用 `deploy.py` 重新部署 biblechat.cc 即可。
