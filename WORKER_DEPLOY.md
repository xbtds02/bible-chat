# Bible Chat Worker 部署指南

## 步骤 1：创建 Worker

1. 打开 https://dash.cloudflare.com → 左侧菜单 **Workers & Pages**
2. 点击 **Create** → **Create Worker**
3. 名称填：`biblechat-api`
4. 点击 **Deploy**
5. 部署后点击 **Edit code**
6. 将 `workers/index.js` 的全部内容粘贴进去（替换默认代码）
7. 点击右上角 **Deploy**

## 步骤 2：创建 KV 命名空间（存储用户数据）

1. 在 Worker 页面左侧 → **KV** → **Create a namespace**
2. 名称填：`BIBLE_CHAT_KV`
3. 点击 **Add**

## 步骤 3：绑定 KV 和设置环境变量

1. 回到 Worker → **Settings** → **Bindings**
2. 点击 **Add binding** → 选 **KV namespace**
   - Variable name: `BIBLE_CHAT_KV`
   - KV namespace: 选择 `BIBLE_CHAT_KV`
   - 点击 **Save**

3. 再点击 **Add binding** → 选 **Secret**
   - Variable name: `OPENROUTER_API_KEY`
   - Value: `<你的 OpenRouter API Key>`（需自行申请，见 https://openrouter.ai/keys）
   - 点击 **Save**

4. 再添加一个 **Secret**：
   - Variable name: `ADMIN_PASSWORD`
   - Value: `biblechat2026`
   - 点击 **Save**

## 步骤 4：获取 Worker URL

部署成功后，Worker 页面顶部会显示 URL，格式类似：
```
https://biblechat-api.<你的子域名>.workers.dev
```

## 步骤 5：更新前端 API 地址

将 Worker URL 告诉 AI 助手，或手动编辑 GitHub 仓库的 `app.js` 第 2 行：
```javascript
const API_BASE = 'https://biblechat-api.<你的子域名>.workers.dev';
```

同样编辑 `admin.html` 中的 `API_BASE`。

## 验证

访问 Worker URL，应该返回：
```json
{"error":"Not found"}
```

访问 `https://<worker-url>/api/daily-verse`，应该返回每日金句 JSON。
