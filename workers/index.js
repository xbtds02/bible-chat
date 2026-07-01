// Cloudflare Worker - Bible Chat API
// 使用 OpenRouter API (统一接口调用多AI模型)
// API Key 通过 Cloudflare Worker 环境变量 OPENROUTER_API_KEY 注入（安全）
// 管理密码通过环境变量 ADMIN_PASSWORD 注入

const BASE_URL = 'https://openrouter.ai/api/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OpenRouter 模型映射
const MODELS = {
  doubao: { id: 'doubao/doubao-pro-32k', name: '豆包 Pro' },
  qwen:   { id: 'qwen/qwen-2.5-72b-instruct', name: '通义千问' },
  gpt4o:  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  gpt4:   { id: 'openai/gpt-4', name: 'GPT-4' },
  claude: { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5' },
  gemini: { id: 'google/gemini-1.5-pro', name: 'Gemini Pro' },
};

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function callAI(apiKey, modelId, messages, stream = false) {
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://biblechat.cc',
      'X-Title': 'Bible Chat',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown error');
    throw new Error(`API error ${resp.status}: ${err}`);
  }

  if (stream) {
    return resp; // 返回原始 Response，body 是 ReadableStream
  }

  return await resp.json();
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 从环境变量读取密钥
    const API_KEY = env.OPENROUTER_API_KEY || '';
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'biblechat2026';
    const KV = env.BIBLE_CHAT_KV;

    // ========== AI 聊天 ==========
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const { messages, model = 'doubao', stream = false } = await request.json().catch(() => ({}));
        const systemPrompt = `You are a wise and compassionate Bible scholar and spiritual guide. You help users understand Scripture, answer questions about Christian faith, and provide thoughtful, Scripture-based responses. Always respond with grace and truth. When discussing Bible verses, cite them clearly. You may respond in Chinese or English depending on the user's language. 你是一位智慧且有同情心的圣经学者和属灵导师。你帮助用户理解圣经、回答关于基督教信仰的问题，并提供基于圣经的深思熟虑的回应。始终以恩典和真理回应。讨论圣经经文时，请清楚地引用。你可以根据用户的语言用中文或英文回应。`;

        const fullMessages = [
          { role: 'system', content: systemPrompt },
          ...(messages || []),
        ];

        const modelId = MODELS[model]?.id || MODELS.doubao.id;

        if (stream) {
          const apiResp = await callAI(API_KEY, modelId, fullMessages, true);
          return new Response(apiResp.body, {
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/event-stream' },
          });
        }

        const data = await callAI(API_KEY, modelId, fullMessages, false);
        return corsResponse({
          reply: data.choices?.[0]?.message?.content || '',
          model: model,
          modelName: MODELS[model]?.name || model,
        });
      } catch (e) {
        return corsResponse({ error: e.message }, 500);
      }
    }

    // ========== AI 播客 ==========
    if (path === '/api/podcast' && request.method === 'POST') {
      try {
        const { text, model = 'doubao' } = await request.json().catch(() => ({}));
        const podcastPrompt = `请将以下圣经经文或灵修内容改写为一档温暖、亲切的播客节目脚本。要求：
1. 以"欢迎来到 Bible Chat 播客"开头
2. 分3-5个段落，每段有自然过渡
3. 在段落间插入[BGM:peaceful]标记表示背景音乐提示
4. 结尾有总结和祝福语
5. 语言自然口语化，像朋友聊天一样
6. 可以引用相关经文来丰富内容

内容：${text}`;

        const data = await callAI(
          API_KEY,
          MODELS[model]?.id || MODELS.doubao.id,
          [
            { role: 'system', content: 'You are a warm and engaging podcast host who creates spiritual audio content.' },
            { role: 'user', content: podcastPrompt },
          ],
          false
        );

        return corsResponse({
          script: data.choices?.[0]?.message?.content || '',
          model: model,
        });
      } catch (e) {
        return corsResponse({ error: e.message }, 500);
      }
    }

    // ========== 用户注册 ==========
    if (path === '/api/user/register' && request.method === 'POST') {
      const { name, email, phone } = await request.json().catch(() => ({}));
      if (!name || !email) return corsResponse({ error: 'Name and email required' }, 400);
      if (!KV) return corsResponse({ error: 'KV not configured' }, 500);

      const userId = crypto.randomUUID();
      const user = { id: userId, name, email, phone: phone || '', registeredAt: Date.now() };

      await KV.put(`user:${email}`, JSON.stringify(user));
      const total = parseInt(await KV.get('stats:totalUsers') || '0');
      await KV.put('stats:totalUsers', String(total + 1));

      return corsResponse({ success: true, user });
    }

    // ========== 用户登录 ==========
    if (path === '/api/user/login' && request.method === 'POST') {
      const { email } = await request.json().catch(() => ({}));
      if (!KV) return corsResponse({ error: 'KV not configured' }, 500);
      const userData = await KV.get(`user:${email}`);
      if (!userData) return corsResponse({ error: 'User not found' }, 404);
      return corsResponse({ success: true, user: JSON.parse(userData) });
    }

    // ========== 统计 ==========
    if (path === '/api/stats' && request.method === 'GET') {
      const totalUsers = KV ? parseInt(await KV.get('stats:totalUsers') || '0') : 0;
      const totalChats = KV ? parseInt(await KV.get('stats:totalChats') || '0') : 0;
      return corsResponse({ totalUsers, totalChats });
    }

    // ========== 管理面板 ==========
    if (path === '/api/admin' && request.method === 'GET') {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
        return corsResponse({ error: 'Unauthorized' }, 401);
      }
      if (!KV) return corsResponse({ error: 'KV not configured' }, 500);

      const list = await KV.list({ prefix: 'user:' });
      const users = [];
      for (const key of list.keys) {
        const val = await KV.get(key.name);
        if (val) users.push(JSON.parse(val));
      }

      const totalChats = parseInt(await KV.get('stats:totalChats') || '0');
      return corsResponse({
        users,
        totalUsers: users.length,
        totalChats,
        serverTime: new Date().toISOString(),
      });
    }

    // ========== 删除用户 ==========
    if (path === '/api/admin/user' && request.method === 'DELETE') {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
        return corsResponse({ error: 'Unauthorized' }, 401);
      }
      const { email } = await request.json().catch(() => ({}));
      if (KV) await KV.delete(`user:${email}`);
      return corsResponse({ success: true });
    }

    // ========== 记录对话统计 ==========
    if (path === '/api/stats/chat' && request.method === 'POST') {
      if (KV) {
        const current = parseInt(await KV.get('stats:totalChats') || '0');
        await KV.put('stats:totalChats', String(current + 1));
      }
      return corsResponse({ success: true });
    }

    // ========== 每日金句 ==========
    if (path === '/api/daily-verse' && request.method === 'GET') {
      const verses = [
        { ref: 'John 3:16', zh: '神爱世人，甚至将他的独生子赐给他们。', en: 'For God so loved the world...' },
        { ref: 'Psalm 23:1', zh: '耶和华是我的牧者，我必不至缺乏。', en: 'The Lord is my shepherd...' },
        { ref: 'Proverbs 3:5', zh: '你要专心仰赖耶和华，不可倚靠自己的聪明。', en: 'Trust in the Lord with all your heart...' },
        { ref: 'Jeremiah 29:11', zh: '耶和华说：我知道我向你们所怀的意念是赐平安的意念。', en: 'I know the plans I have for you...' },
        { ref: 'Philippians 4:13', zh: '我靠着那加给我力量的，凡事都能做。', en: 'I can do all this through him...' },
        { ref: 'Romans 8:28', zh: '我们晓得万事都互相效力，叫爱神的人得益处。', en: 'We know that in all things God works...' },
        { ref: 'Matthew 11:28', zh: '凡劳苦担重担的人可以到我这里来，我就使你们得安息。', en: 'Come to me, all you who are weary...' },
      ];
      const dayIndex = Math.floor(Date.now() / 86400000) % verses.length;
      return corsResponse({ verse: verses[dayIndex], date: new Date().toLocaleDateString('zh-CN') });
    }

    // ========== 404 ==========
    return corsResponse({ error: 'Not found' }, 404);
  },
};
