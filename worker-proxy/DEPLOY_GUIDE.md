# CORS 跨域问题解决方案

## 问题
中转站 `apicz.cc` 没有返回 `Access-Control-Allow-Origin` 头，且对 OPTIONS 预检返回 403。
浏览器跨域 POST 请求被拦截，AI 对话显示"网络不佳"。

## 验证
```bash
curl -sI -X OPTIONS https://www.apicz.cc/v1/chat/completions -H "Origin: https://biblechat.cc"
# 返回 403，没有 ACAO 头
```

## 解决方案：部署 Cloudflare Worker 代理

需要你的 Cloudflare 账号（免费）：
- 访问 https://dash.cloudflare.com/sign-up 注册
- 然后到 https://dash.cloudflare.com/profile/api-tokens 创建 Token
  - 选 "Edit Cloudflare Workers" 模板
- Account ID 在 dash.cloudflare.com 右侧能看到

### 部署命令（PowerShell）

```powershell
$env:CLOUDFLARE_API_TOKEN="你的token"
$env:CLOUDFLARE_ACCOUNT_ID="你的account_id"
cd "C:\Users\Administrator\WorkBuddy\2026-06-29-12-42-11\bible-chat\worker-proxy"
node deploy-worker.js
```

部署成功后会输出形如：
```
Worker URL: https://biblechat-proxy.你的子域.workers.dev
```

### 配置前端

部署完成后，到 https://biblechat.cc/admin.html ，密码 `biblechat2026`，
在 "API Base URL" 输入框填入：
```
https://biblechat-proxy.你的子域.workers.dev/v1/chat/completions
```
点"保存 API 地址"，刷新页面即可。

## 原理
前端 → Cloudflare Worker（加 CORS 头）→ apicz.cc 中转站 → OpenAI
Worker 在中间代理，加上 `Access-Control-Allow-Origin: *` 让浏览器放行。

## 免费额度
Cloudflare Workers 免费版：每天 10 万次请求，对个人项目完全够用。
