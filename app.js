/**
 * 圣经小助手 - Bible Chat App
 * v2.0 完整版：读经、语音、AI、祷告、播客、用户系统、微信分享
 */

// ============ 状态管理 ============
const API = 'https://api.biblechat.cc';
const DEFAULT_API_KEY = '';

const State = {
  page: 'home',
  user: null,
  token: null,
  chatHistory: [],
  bibleIndex: null,
  prayers: null,
  currentBook: null,
  currentChapter: 1,
  tts: { speaking: false, utterance: null, speed: 1 },
  podcast: { playing: false, segments: [], currentIdx: 0 },
  dailyVerse: null
};

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// ============ API 调用 ============
async function api(endpoint, options = {}) {
  const url = `${API}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (State.token) {
    config.headers.Authorization = `Bearer ${State.token}`;
  }

  // 如果没有API，使用本地模式
  if (!API || API.includes('PLACEHOLDER')) {
    return { local: true, error: 'API未配置' };
  }

  try {
    const res = await fetch(url, config);
    return await res.json();
  } catch (e) {
    return { error: e.message, local: true };
  }
}

// ============ 页面路由 ============
function renderPage(page) {
  State.page = page;
  const c = $('#contentArea');
  if (!c) return;

  const pages = { home: renderHome, bible: renderBible, chat: renderChat, prayer: renderPrayer, podcast: renderPodcast };
  c.innerHTML = pages[page] ? pages[page]() : pages.home();

  $$('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  if (page === 'home') loadDailyVerse();
  if (page === 'bible') initBibleReader();
  if (page === 'chat') initChat();
  if (page === 'prayer') initPrayer();
  if (page === 'podcast') initPodcast();
}

// ============ 首页 ============
function renderHome() {
  return `
    <div class="section-header"><span class="sh-icon">✨</span><h2>每日金句</h2></div>
    <div id="dailyVerseArea">
      <div class="verse-card">
        <div style="text-align:center;padding:40px;color:var(--text3)">加载中...</div>
      </div>
    </div>
    <div style="margin:24px 0"><div class="section-header"><span class="sh-icon">📌</span><h2>快捷入口</h2></div></div>
    <div class="grid-2">
      <div class="card" onclick="navigate('bible')">
        <div class="card-header"><div class="card-icon">📖</div></div>
        <h3>阅读圣经</h3>
        <div class="card-desc">全本圣经66卷书，支持语音朗读，随时聆听神的话语</div>
      </div>
      <div class="card" onclick="navigate('chat')">
        <div class="card-header"><div class="card-icon">💬</div></div>
        <h3>AI 圣经问答</h3>
        <div class="card-desc">向AI提问任何圣经问题，即时获得深入解答</div>
      </div>
      <div class="card" onclick="navigate('prayer')">
        <div class="card-header"><div class="card-icon">🙏</div></div>
        <h3>祷告灵修</h3>
        <div class="card-desc">35篇精心编写的祷告词，涵盖各主题</div>
      </div>
      <div class="card" onclick="navigate('podcast')">
        <div class="card-header"><div class="card-icon">🎙️</div></div>
        <h3>经文播客</h3>
        <div class="card-desc">AI讲解经文，生成播客式音频，像听书一样学圣经</div>
      </div>
    </div>
    ${renderQuickFeatures()}
  `;
}

function renderQuickFeatures() {
  return `
    <div style="margin-top:24px"><div class="section-header"><span class="sh-icon">🌟</span><h2>精选经文</h2></div></div>
    <div id="featuredVerses" class="grid-2">
      ${getFeaturedVerses().map(v => `
        <div class="card" onclick="shareVerse('${v.text.replace(/'/g,"\\'")}','${v.ref}')">
          <div class="card-header"><div class="card-icon">📜</div></div>
          <h3>${v.ref}</h3>
          <div class="card-desc">${v.text.substring(0,60)}...</div>
        </div>
      `).join('')}
    </div>
  `;
}

function getFeaturedVerses() {
  return [
    { text: "神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。", ref: "约翰福音 3:16" },
    { text: "耶和华是我的牧者，我必不至缺乏。", ref: "诗篇 23:1" },
    { text: "你要专心仰赖耶和华，不可倚靠自己的聪明。", ref: "箴言 3:5" },
    { text: "我留下平安给你们；我将我的平安赐给你们。", ref: "约翰福音 14:27" },
    { text: "如今常存的有信，有望，有爱这三样，其中最大的是爱。", ref: "哥林多前书 13:13" },
    { text: "凡劳苦担重担的人可以到我这里来，我就使你们得安息。", ref: "马太福音 11:28" }
  ];
}

async function loadDailyVerse() {
  const area = $('#dailyVerseArea');
  if (!area) return;
  try {
    const data = await api('/api/verse/daily');
    if (!data.error) {
      State.dailyVerse = data;
      area.innerHTML = renderVerseCard(data);
    }
  } catch (e) {
    area.innerHTML = renderVerseCard(getLocalDailyVerse());
  }
}

function getLocalDailyVerse() {
  const verses = [
    { text: "神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。", ref: "约翰福音 3:16", theme: "神的爱", date: new Date().toISOString().slice(0,10) },
    { text: "你要专心仰赖耶和华，不可倚靠自己的聪明，在你一切所行的事上都要认定他，他必指引你的路。", ref: "箴言 3:5-6", theme: "信靠神", date: new Date().toISOString().slice(0,10) }
  ];
  const idx = new Date().getDate() % verses.length;
  return verses[idx];
}

function renderVerseCard(data) {
  const date = new Date(data.date || Date.now()).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  return `
    <div class="verse-card">
      <div class="vc-date">📅 ${date}</div>
      <div class="vc-theme">${data.theme || '每日金句'}</div>
      <div class="vc-text">"${data.text}"</div>
      <div class="vc-ref">—— ${data.ref}</div>
      <div class="vc-actions">
        <button class="btn btn-gold btn-sm" onclick="shareVerse('${data.text.replace(/'/g,"\\'")}','${data.ref}')">📤 分享朋友圈</button>
        <button class="btn btn-outline btn-sm" onclick="copyText('${data.text} ——${data.ref}')">📋 复制</button>
        <button class="btn btn-outline btn-sm" onclick="speakVerse('${data.text.replace(/'/g,"\\'")}')">🔊 朗读</button>
        <button class="btn btn-outline btn-sm" onclick="navigate('chat');sendAIMessage('请讲解这段经文：${data.ref}')">💬 AI讲解</button>
      </div>
    </div>
  `;
}

// ============ 圣经阅读 ============
function renderBible() {
  return `
    <div class="section-header"><span class="sh-icon">📖</span><h2>阅读圣经</h2></div>
    <div class="bible-nav">
      <select id="bibleTestament" onchange="updateBibleBooks()">
        <option value="新约">新约</option>
        <option value="旧约">旧约</option>
      </select>
      <select id="bibleBook" onchange="updateChapterSelect()">
        <option>选择书卷</option>
      </select>
      <select id="bibleChapter" onchange="loadBibleChapter()">
        <option>选择章节</option>
      </select>
    </div>
    <div class="tts-bar">
      <button class="btn btn-outline btn-sm" onclick="toggleBibleTTS()" id="ttsPlayBtn">🔊 朗读本章</button>
      <button class="btn btn-outline btn-sm" onclick="stopBibleTTS()">⏹️ 停止</button>
      <span style="margin:0 8px;color:var(--text3)">语速:</span>
      <button class="speed-btn active" onclick="setTTSSpeed(1)">1x</button>
      <button class="speed-btn" onclick="setTTSSpeed(0.75)">0.75x</button>
      <button class="speed-btn" onclick="setTTSSpeed(1.25)">1.25x</button>
      <span class="tts-status" id="ttsStatus"></span>
    </div>
    <div class="bible-text" id="bibleTextArea">
      <div style="text-align:center;padding:60px;color:var(--text3)">👆 请选择书卷和章节开始阅读</div>
    </div>
  `;
}

function initBibleReader() {
  loadBibleIndex().then(() => {
    updateBibleBooks();
  });
  State.tts.speaking = false;
}

async function loadBibleIndex() {
  if (State.bibleIndex) return State.bibleIndex;
  try {
    const res = await fetch('data/bible-index.json');
    State.bibleIndex = await res.json();
  } catch (e) {
    State.bibleIndex = getDefaultBibleIndex();
  }
  return State.bibleIndex;
}

function getDefaultBibleIndex() {
  return {
    "旧约": [
      { name: "创世记", abbr: "创", chapters: 50 },
      { name: "出埃及记", abbr: "出", chapters: 40 },
      { name: "诗篇", abbr: "诗", chapters: 150 },
      { name: "箴言", abbr: "箴", chapters: 31 },
      { name: "以赛亚书", abbr: "赛", chapters: 66 }
    ],
    "新约": [
      { name: "马太福音", abbr: "太", chapters: 28 },
      { name: "马可福音", abbr: "可", chapters: 16 },
      { name: "路加福音", abbr: "路", chapters: 24 },
      { name: "约翰福音", abbr: "约", chapters: 21 },
      { name: "使徒行传", abbr: "徒", chapters: 28 },
      { name: "罗马书", abbr: "罗", chapters: 16 },
      { name: "哥林多前书", abbr: "林前", chapters: 16 },
      { name: "以弗所书", abbr: "弗", chapters: 6 },
      { name: "腓立比书", abbr: "腓", chapters: 4 },
      { name: "歌罗西书", abbr: "西", chapters: 4 },
      { name: "启示录", abbr: "启", chapters: 22 }
    ]
  };
}

function updateBibleBooks() {
  const testament = $('#bibleTestament')?.value || '新约';
  const books = (State.bibleIndex || getDefaultBibleIndex())[testament] || [];
  const sel = $('#bibleBook');
  if (!sel) return;
  sel.innerHTML = '<option>选择书卷</option>' + books.map(b => `<option value="${b.name}">${b.name}（${b.abbr}）</option>`).join('');
  updateChapterSelect();
}

function updateChapterSelect() {
  const book = $('#bibleBook')?.value;
  const testament = $('#bibleTestament')?.value || '新约';
  const books = (State.bibleIndex || getDefaultBibleIndex())[testament] || [];
  const found = books.find(b => b.name === book);
  const sel = $('#bibleChapter');
  if (!sel) return;
  if (!found) { sel.innerHTML = '<option>选择章节</option>'; return; }
  sel.innerHTML = Array.from({ length: found.chapters }, (_, i) => `<option value="${i + 1}">第${i + 1}章</option>`).join('');
}

async function loadBibleChapter() {
  const book = $('#bibleBook')?.value;
  const chapter = $('#bibleChapter')?.value;
  if (!book || !chapter || book === '选择书卷') return;
  State.currentBook = book;
  State.currentChapter = parseInt(chapter);

  const area = $('#bibleTextArea');
  if (!area) return;
  area.innerHTML = '<div style="text-align:center;padding:40px">⏳ 加载中...</div>';

  const verses = await fetchBibleChapter(book, chapter);
  if (!verses || verses.length === 0) {
    area.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">
      暂无经文数据<br><button class="btn btn-outline btn-sm" onclick="navigate('chat');sendAIMessage('请给我读出《${book}》第${chapter}章的内容')" style="margin-top:12px">💬 让AI帮我读</button>
    </div>`;
    return;
  }

  area.innerHTML = `
    <h3>${book} 第${chapter}章</h3>
    ${verses.map(v => `<div class="verse"><span class="verse-num">${v.v}</span><span class="verse-text">${v.t}</span></div>`).join('')}
  `;

  saveBibleProgress(book, parseInt(chapter));
}

async function fetchBibleChapter(book, chapter) {
  // 尝试API
  try {
    const res = await fetch(`${API}/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}`);
    if (res.ok) {
      const data = await res.json();
      if (data.verses) return data.verses.map(v => ({ v: v.verse, t: v.text }));
    }
  } catch (e) {}

  // 使用内置数据
  return getEmbeddedBibleData(book, parseInt(chapter));
}

function getEmbeddedBibleData(book, chapter) {
  const data = EMBEDDED_BIBLE[book];
  if (!data) return null;
  return data[chapter] || null;
}

function saveBibleProgress(book, chapter) {
  if (!State.user) return;
  if (!State.user.bibleProgress) State.user.bibleProgress = {};
  State.user.bibleProgress[book] = chapter;
  localStorage.setItem('bible_progress', JSON.stringify(State.user.bibleProgress));
  api('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ bibleProgress: State.user.bibleProgress })
  }).catch(() => {});
}

// ============ TTS 语音朗读 ============
function toggleBibleTTS() {
  if (State.tts.speaking) { stopBibleTTS(); return; }
  const verses = $$('.verse-text');
  if (verses.length === 0) return;

  const text = Array.from(verses).map(v => v.textContent).join('。');
  speakVerse(text);
}

function stopBibleTTS() {
  window.speechSynthesis.cancel();
  State.tts.speaking = false;
  updateTTSUI();
}

function speakVerse(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = State.tts.speed;
    u.onstart = () => { State.tts.speaking = true; updateTTSUI(); };
    u.onend = () => { State.tts.speaking = false; updateTTSUI(); };
    u.onerror = () => { State.tts.speaking = false; updateTTSUI(); };
    State.tts.utterance = u;
    window.speechSynthesis.speak(u);
  } else {
    showToast('您的浏览器不支持语音朗读');
  }
}

function setTTSSpeed(speed) {
  State.tts.speed = speed;
  $$('.speed-btn').forEach(b => b.classList.toggle('active', parseFloat(b.textContent) === speed));
  if (State.tts.speaking) {
    stopBibleTTS();
    toggleBibleTTS();
  }
}

function updateTTSUI() {
  const btn = $('#ttsPlayBtn');
  const status = $('#ttsStatus');
  if (btn) btn.textContent = State.tts.speaking ? '⏸️ 暂停' : '🔊 朗读本章';
  if (status) status.textContent = State.tts.speaking ? '朗读中...' : '';
}

// ============ AI 对话 ============
function renderChat() {
  return `
    <div class="section-header"><span class="sh-icon">💬</span><h2>AI 圣经问答</h2></div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">✨ AI已预配置，无需设置API密钥，直接提问即可</div>
    <div class="quick-prompts">
      <button class="quick-prompt" onclick="askQuick('约翰福音3:16是什么意思？')">约翰福音3:16</button>
      <button class="quick-prompt" onclick="askQuick('如何祷告？')">如何祷告？</button>
      <button class="quick-prompt" onclick="askQuick('什么是救恩？')">什么是救恩？</button>
      <button class="quick-prompt" onclick="askQuick('诗篇23篇的讲解')">诗篇23篇</button>
      <button class="quick-prompt" onclick="askQuick('耶稣是谁？')">耶稣是谁？</button>
      <button class="quick-prompt" onclick="askQuick('圣灵的果子有哪些？')">圣灵的果子</button>
    </div>
    <div class="chat-container">
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-area">
        <textarea id="chatInput" placeholder="输入您的圣经问题..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChat()}"></textarea>
        <button class="chat-send" onclick="sendChat()">➤</button>
      </div>
    </div>
  `;
}

function initChat() {
  const msgs = $('#chatMessages');
  if (msgs && msgs.children.length === 0) {
    State.chatHistory = [];
    addChatMsg('ai', '你好！我是圣经小助手 🙏 你可以问我任何圣经相关的问题，我会用神的话语帮助你。');
  }
}

function askQuick(question) {
  const input = $('#chatInput');
  if (input) input.value = question;
  sendChat();
}

function sendAIMessage(msg) {
  navigate('chat');
  setTimeout(() => {
    const input = $('#chatInput');
    if (input) input.value = msg;
    sendChat();
  }, 300);
}

async function sendChat() {
  const input = $('#chatInput');
  if (!input || !input.value.trim()) return;
  const msg = input.value.trim();
  input.value = '';
  input.style.height = '44px';
  addChatMsg('user', msg);

  // Loading indicator
  const msgs = $('#chatMessages');
  const loadingId = 'loading-' + Date.now();
  const loadingEl = document.createElement('div');
  loadingEl.className = 'chat-msg ai loading';
  loadingEl.id = loadingId;
  loadingEl.innerHTML = '<span class="dot" style="--d:0"></span><span class="dot" style="--d:1"></span><span class="dot" style="--d:2"></span>';
  if (msgs) msgs.appendChild(loadingEl);

  try {
    const data = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: msg }], apiKey: DEFAULT_API_KEY || undefined })
    });

    const loading = document.getElementById(loadingId);
    if (loading) loading.remove();

    if (data.error) {
      // If API unavailable, use local fallback
      addChatMsg('ai', getLocalAIResponse(msg));
    } else {
      addChatMsg('ai', data.content || '抱歉，请稍后再试。');
    }
  } catch (e) {
    const loading = document.getElementById(loadingId);
    if (loading) loading.remove();
    addChatMsg('ai', getLocalAIResponse(msg));
  }
}

function addChatMsg(role, content) {
  const msgs = $('#chatMessages');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = `chat-msg ${role}`;
  el.textContent = content;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  State.chatHistory.push({ role, content });
}

function getLocalAIResponse(msg) {
  const responses = {
    '爱': '根据圣经，爱是最大的恩赐。哥林多前书13章说："如今常存的有信，有望，有爱这三样，其中最大的是爱。"爱是恒久忍耐，又有恩慈。上帝就是爱（约翰一书4:8）。',
    '祷告': '耶稣教导我们如何祷告——主祷文（马太福音6:9-13）。祷告是向神说话，不求辞藻华丽，只需真诚。可以赞美、感恩、认罪、祈求、代祷。',
    '救恩': '救恩是上帝白白赐给人的礼物。罗马书6:23说："因为罪的工价乃是死；惟有神的恩赐，在我们的主基督耶稣里，乃是永生。"信靠耶稣就能得救。',
    '信仰': '希伯来书11:1说："信就是所望之事的实底，是未见之事的确据。"信心是对神的完全交托，知道祂掌控一切。',
    '平安': '耶稣说："我留下平安给你们；我将我的平安赐给你们。我所赐的，不像世人所赐的。你们心里不要忧愁，也不要胆怯。"（约翰福音14:27）',
    '盼望': '耶利米书29:11："耶和华说：我知道我向你们所怀的意念是赐平安的意念，不是降灾祸的意念，要叫你们末后有指望。"',
    '耶稣': '耶稣基督是神的独生子，为我们的罪钉在十字架上，第三天从死里复活。祂是道路、真理、生命（约翰福音14:6）。祂也是爱你、为你舍命的那一位。'
  };

  for (const [key, resp] of Object.entries(responses)) {
    if (msg.includes(key)) return resp;
  }
  return `关于"${msg.substring(0,30)}..."这个问题，我引用了圣经中相关的经文来帮助你理解。你可以进一步点击"阅读圣经"查看相关章节，或在祷告中寻求神的指引。🙏`;
}

// ============ 祷告 ============
function renderPrayer() {
  return `
    <div class="section-header"><span class="sh-icon">🙏</span><h2>祷告与灵修</h2></div>
    <div class="prayer-cats" id="prayerCats"></div>
    <div class="prayer-grid" id="prayerGrid">
      <div style="text-align:center;padding:40px;color:var(--text3)">加载中...</div>
    </div>
  `;
}

async function initPrayer() {
  loadPrayers();
}

async function loadPrayers() {
  if (!State.prayers) {
    try {
      const res = await fetch('data/prayers.json');
      State.prayers = await res.json();
    } catch (e) {
      State.prayers = getDefaultPrayers();
    }
  }
  renderPrayerUI();
}

function getDefaultPrayers() {
  return {
    categories: [
      { id: 'morning', name: '晨祷', icon: 'sunrise' },
      { id: 'evening', name: '晚祷', icon: 'moon' },
      { id: 'gratitude', name: '感恩', icon: 'heart' },
      { id: 'intercession', name: '代祷', icon: 'hands' },
      { id: 'guidance', name: '寻求', icon: 'compass' },
      { id: 'peace', name: '平安', icon: 'dove' }
    ],
    prayers: [
      { id: 'm1', cat: 'morning', title: '新的一天', content: '亲爱的天父，感谢你赐给我这新的一天。当我睁开双眼，就看到你所创造的阳光与美好。求你今日引导我的脚步，让我行事为人都蒙你喜悦。奉主耶稣基督的名祷告，阿们。', ref: '诗篇 118:24' },
      { id: 'm2', cat: 'morning', title: '每日力量', content: '主啊，清晨我来到你的面前，将今天完全交托在你的手中。求你赐我属天的力量，让我不靠自己的能力，而是依靠你的大能。奉主耶稣的名祈求，阿们。', ref: '以赛亚书 40:31' },
      { id: 'e1', cat: 'evening', title: '安歇交托', content: '天父，感谢你今天一路的保守和带领。此刻我将一天的劳苦重担都卸给你，因为你的担子是轻省的。求你赐我安眠，让我在你怀中得着真正的安息。奉主耶稣的名祷告，阿们。', ref: '马太福音 11:28' },
      { id: 'e2', cat: 'evening', title: '夜间反思', content: '主啊，在你面前我回顾今天的一切。如果我有什么亏欠，求你赦免。求你赐我一颗谦卑受教的心，让我明天能比今天更靠近你。奉耶稣的名祈求，阿们。', ref: '诗篇 139:23-24' },
      { id: 'g1', cat: 'gratitude', title: '感恩的心', content: '亲爱的天父，我要感恩，为生命中一切的美善。感谢你的创造、救赎、保守和供应。求你使我常存感恩的心，凡事谢恩。奉主耶稣的名祷告，阿们。', ref: '帖撒罗尼迦前书 5:16-18' },
      { id: 'g2', cat: 'gratitude', title: '数算恩典', content: '主啊，当我数算你的恩典，才发现你的祝福如繁星不可胜数。感谢你赐我生命、气息、家人和朋友。每一个呼吸都是恩典。奉主耶稣的名祷告，阿们。', ref: '诗篇 103:1-5' },
      { id: 'i1', cat: 'intercession', title: '为家人', content: '天父，今天我将我的家人完全交托在你的手中。保守他们的身体平安健康，愿你的救恩临到家中每一个尚未信主的亲人。奉主耶稣的名祷告，阿们。', ref: '使徒行传 16:31' },
      { id: 'i2', cat: 'intercession', title: '为教会', content: '亲爱的天父，我为你的教会祷告。求你保守教会合一，让弟兄姊妹彼此相爱。愿你保守你的教会远离异端和分裂。奉主耶稣的名祷告，阿们。', ref: '以弗所书 4:1-6' },
      { id: 's1', cat: 'guidance', title: '寻求方向', content: '主啊，我站在人生的十字路口，不知该如何选择。求你赐我智慧，指引我的道路。我不要倚靠自己的聪明，我要专心仰赖你。奉主耶稣的名祷告，阿们。', ref: '箴言 3:5-6' },
      { id: 's2', cat: 'guidance', title: '职场求助', content: '天父，我把我的工作完全交托给你。赐我智慧处理工作中的难题，让我不是为讨人喜悦而工作，而是像为主做的一样尽心尽力。奉主耶稣的名祷告，阿们。', ref: '歌罗西书 3:23' },
      { id: 'p1', cat: 'peace', title: '内心平安', content: '主耶稣，你留下平安给我们，你所赐的平安不像世人所赐的。求你平静我内心的风暴，赐我出人意外的平安。奉主耶稣的名祷告，阿们。', ref: '约翰福音 14:27' },
      { id: 'p2', cat: 'peace', title: '戒除焦虑', content: '天父，你教导我当一无挂虑。我承认我常被忧虑捆绑。求你帮助我将一切的忧虑卸给你，因为你顾念我。奉主耶稣的名祷告，阿们。', ref: '腓立比书 4:6-7' }
    ]
  };
}

function renderPrayerUI() {
  const cats = $('#prayerCats');
  if (cats) {
    cats.innerHTML = State.prayers.categories.map(c => `<button class="prayer-cat" data-cat="${c.id}" onclick="filterPrayers('${c.id}')">${c.icon || '🙏'} ${c.name}</button>`).join('');
    cats.querySelector('.prayer-cat')?.classList.add('active');
  }
  filterPrayers('all');
}

function filterPrayers(cat) {
  $$('.prayer-cat').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
  const grid = $('#prayerGrid');
  if (!grid) return;
  const prayers = cat === 'all' ? State.prayers.prayers : State.prayers.prayers.filter(p => p.cat === cat);
  if (prayers.length === 0) prayers.push(...State.prayers.prayers);
  grid.innerHTML = prayers.slice(0, 20).map(p => `
    <div class="prayer-card" onclick="showPrayerDetail(${JSON.stringify(p).replace(/"/g,'&quot;')})">
      <h4>${p.title}</h4>
      <div class="card-desc">${p.content.substring(0,60)}...</div>
      <div class="card-ref">📖 ${p.ref}</div>
    </div>
  `).join('');
}

function showPrayerDetail(prayer) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal" style="background:var(--surface);border:1px solid rgba(255,255,255,.06)">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      <h2 style="color:var(--text)">${prayer.title}</h2>
      <div style="color:var(--text2);font-size:13px;margin-bottom:16px">📖 ${prayer.ref}</div>
      <div style="color:var(--text);line-height:2;font-size:15px;white-space:pre-wrap">${prayer.content}</div>
      <div class="card-actions" style="margin-top:20px">
        <button class="btn btn-gold btn-sm" onclick="shareVerse('${prayer.content.replace(/'/g,"\\'")}','${prayer.ref}')">📤 分享</button>
        <button class="btn btn-outline btn-sm" onclick="copyText('${prayer.content.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">📋 复制</button>
        <button class="btn btn-outline btn-sm" onclick="speakVerse('${prayer.content.replace(/'/g,"\\'").substring(0,200)}')">🔊 朗读</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ============ 播客 ============
function renderPodcast() {
  return `
    <div class="section-header"><span class="sh-icon">🎙️</span><h2>经文播客</h2></div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:16px">AI将经文分析成播客式讲解，可播放音频</div>
    <div class="podcast-player">
      <div class="podcast-info">
        <h3 id="podcastTitle">选择经文开始</h3>
        <p id="podcastSub">AI将为你深度讲解</p>
      </div>
      <div class="podcast-controls">
        <button class="podcast-btn btn-outline" onclick="podcastPrev()">⏮</button>
        <button class="podcast-btn podcast-play" id="podcastPlayBtn" onclick="togglePodcast()">▶️</button>
        <button class="podcast-btn btn-outline" onclick="podcastNext()">⏭</button>
      </div>
      <div class="podcast-progress" onclick="podcastSeek(event)">
        <div class="podcast-progress-bar" id="podcastProgressBar"></div>
      </div>
      <div class="podcast-time">
        <span id="podcastCurrentTime">00:00</span>
        <span id="podcastTotalTime">00:00</span>
      </div>
    </div>
    <div class="podcast-transcript" id="podcastTranscript">
      <p style="color:var(--text3)">选择一段经文，AI将为你生成播客式讲解 👇</p>
    </div>
    <div class="quick-prompts" style="margin-top:16px">
      <button class="quick-prompt" onclick="generatePodcast('约翰福音3:1-21')">约翰福音3章</button>
      <button class="quick-prompt" onclick="generatePodcast('诗篇23篇')">诗篇23篇</button>
      <button class="quick-prompt" onclick="generatePodcast('罗马书8:28-39')">罗马书8章</button>
      <button class="quick-prompt" onclick="generatePodcast('马太福音5:1-12')">八福</button>
      <button class="quick-prompt" onclick="generatePodcast('哥林多前书13章')">爱的诗篇</button>
    </div>
  `;
}

function initPodcast() {
  State.podcast.playing = false;
  State.podcast.segments = [];
  State.podcast.currentIdx = 0;
}

async function generatePodcast(passage) {
  $('#podcastTitle').textContent = '⏳ 正在生成...';
  $('#podcastSub').textContent = passage;
  $('#podcastTranscript').innerHTML = '<p style="text-align:center;color:var(--text3);padding:20px">AI正在为你深度分析经文...</p>';

  try {
    const data = await api('/api/podcast', {
      method: 'POST',
      body: JSON.stringify({ passage, style: 'podcast', apiKey: DEFAULT_API_KEY || undefined })
    });
    if (!data.error && data.segments) {
      State.podcast.segments = data.segments;
      State.podcast.currentIdx = 0;
      $('#podcastTitle').textContent = '📖 ' + passage;
      $('#podcastSub').textContent = `共 ${data.segments.length} 段`;
      $('#podcastTranscript').innerHTML = data.segments.map((s, i) =>
        `<p style="padding:8px;margin:4px 0;border-radius:6px" id="podSeg${i}">${s.text}</p>`
      ).join('');
      highlightPodcastSegment(0);
    } else {
      // 本地播客内容
      setLocalPodcastContent(passage);
    }
  } catch (e) {
    setLocalPodcastContent(passage);
  }
}

function setLocalPodcastContent(passage) {
  const data = getLocalPodcastData(passage);
  State.podcast.segments = data;
  State.podcast.currentIdx = 0;
  $('#podcastTitle').textContent = '📖 ' + passage;
  $('#podcastSub').textContent = `共 ${data.length} 段（本地讲解）`;
  $('#podcastTranscript').innerHTML = data.map((s, i) =>
    `<p style="padding:8px;margin:4px 0;border-radius:6px" id="podSeg${i}">${s.text}</p>`
  ).join('');
}

function getLocalPodcastData(passage) {
  return [
    { text: `亲爱的弟兄姊妹，欢迎收听今日经文分享。我们一起来看今天的内容。`, duration: 10 },
    { text: `这段经文来自${passage}。让我们一起聆听神的话语，感受祂的爱和恩典。`, duration: 12 },
    { text: `每一段圣经经文都蕴含着丰富的智慧和启示。当我们用心去读、去思考时，就能从中得到力量和指引。`, duration: 15 },
    { text: `神的话语是我们脚前的灯、路上的光。愿我们今天都能在神的话语中得到喂养和更新。`, duration: 12 },
    { text: `感谢大家的聆听。让我们一起做个简短的祷告：主啊，感谢你的话语照亮我们的生命。求你帮助我们每日在你的话语中成长，活出你喜悦的样式。奉耶稣的名，阿们。`, duration: 18 }
  ];
}

function togglePodcast() {
  if (State.podcast.segments.length === 0) return;
  if (State.podcast.playing) {
    pausePodcast();
  } else {
    playPodcast();
  }
}

function playPodcast() {
  if (State.podcast.currentIdx >= State.podcast.segments.length) return;
  State.podcast.playing = true;
  $('#podcastPlayBtn').textContent = '⏸️';
  const seg = State.podcast.segments[State.podcast.currentIdx];
  highlightPodcastSegment(State.podcast.currentIdx);
  speakVerse(seg.text);
  State.podcast.timer = setTimeout(() => {
    State.podcast.currentIdx++;
    if (State.podcast.currentIdx < State.podcast.segments.length) {
      playPodcast();
    } else {
      stopPodcast();
    }
  }, seg.duration * 1000);
}

function pausePodcast() {
  State.podcast.playing = false;
  $('#podcastPlayBtn').textContent = '▶️';
  window.speechSynthesis.cancel();
  clearTimeout(State.podcast.timer);
}

function stopPodcast() {
  State.podcast.playing = false;
  State.podcast.currentIdx = 0;
  $('#podcastPlayBtn').textContent = '▶️';
  window.speechSynthesis.cancel();
  clearTimeout(State.podcast.timer);
}

function podcastPrev() {
  State.podcast.currentIdx = Math.max(0, State.podcast.currentIdx - 1);
  highlightPodcastSegment(State.podcast.currentIdx);
}

function podcastNext() {
  State.podcast.currentIdx = Math.min(State.podcast.segments.length - 1, State.podcast.currentIdx + 1);
  highlightPodcastSegment(State.podcast.currentIdx);
}

function highlightPodcastSegment(idx) {
  for (let i = 0; i < State.podcast.segments.length; i++) {
    const el = document.getElementById(`podSeg${i}`);
    if (el) el.style.background = i === idx ? 'rgba(139,92,246,.15)' : 'transparent';
  }
}

// ============ 用户系统 ============
function showAuthModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = State.user ? renderUserProfile() : renderAuthForm();
  document.body.appendChild(overlay);
}

function renderAuthForm() {
  return `
    <div class="modal" style="background:var(--surface);border:1px solid rgba(255,255,255,.06)">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      <h2 style="color:var(--text);margin-bottom:24px">👤 账户</h2>
      <div id="authTabs" style="display:flex;gap:0;margin-bottom:20px">
        <button class="prayer-cat active" onclick="switchAuthTab('login')" style="flex:1;text-align:center;border-radius:20px 0 0 20px">登录</button>
        <button class="prayer-cat" onclick="switchAuthTab('register')" style="flex:1;text-align:center;border-radius:0 20px 20px 0">注册</button>
      </div>
      <div id="loginForm">
        <div class="input-group"><label>用户名</label><input type="text" id="loginUsername" placeholder="输入用户名"></div>
        <div class="input-group"><label>密码</label><input type="password" id="loginPassword" placeholder="输入密码"></div>
        <button class="btn btn-gold" onclick="doLogin()" style="width:100%;margin-top:8px">登 录</button>
      </div>
      <div id="registerForm" style="display:none">
        <div class="input-group"><label>用户名</label><input type="text" id="regUsername" placeholder="2-20个字符"></div>
        <div class="input-group"><label>密码</label><input type="password" id="regPassword" placeholder="至少4个字符"></div>
        <div class="input-group"><label>邮箱 (选填)</label><input type="email" id="regEmail" placeholder="your@email.com"></div>
        <button class="btn btn-gold" onclick="doRegister()" style="width:100%;margin-top:8px">注 册</button>
      </div>
      <div style="text-align:center;margin-top:12px">
        <button style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer" onclick="this.closest('.modal-overlay').remove()">先看看，稍后登录</button>
      </div>
    </div>
  `;
}

function renderUserProfile() {
  return `
    <div class="modal" style="background:var(--surface);border:1px solid rgba(255,255,255,.06)">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      <h2 style="color:var(--text);margin-bottom:24px">👤 我的账户</h2>
      <div style="color:var(--text);font-size:16px;margin-bottom:8px">${State.user.username}</div>
      <div style="color:var(--text2);font-size:13px;margin-bottom:20px">${State.user.email || ''}</div>
      <div class="stats-row">
        <div class="stat-badge">📖 ${State.user.bookmarks?.length || 0} 书签</div>
        <div class="stat-badge">📝 ${State.user.notes?.length || 0} 笔记</div>
      </div>
      <div style="margin-top:24px">
        <button class="btn btn-outline btn-sm" onclick="saveUserState()">💾 保存进度</button>
        <button class="btn btn-outline btn-sm" onclick="exportBibleProgress()">📤 导出进度</button>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);width:100%" onclick="doLogout()">退出登录</button>
      </div>
    </div>
  `;
}

function switchAuthTab(tab) {
  $$('#authTabs .prayer-cat').forEach((b, i) => b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register')));
  $('#loginForm').style.display = tab === 'login' ? 'block' : 'none';
  $('#registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const username = $('#loginUsername')?.value;
  const password = $('#loginPassword')?.value;
  if (!username || !password) return showToast('请填写用户名和密码');

  const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data.success) {
    setUser(data);
    showToast('登录成功！');
    document.querySelector('.modal-overlay')?.remove();
  } else if (data.error) {
    // 本地模式登录
    localLogin(username, password);
  } else {
    showToast(data.error || '登录失败');
  }
}

function localLogin(username, password) {
  const stored = localStorage.getItem('user_'+username);
  if (!stored) { showToast('用户不存在'); return; }
  const userData = JSON.parse(stored);
  if (userData.password !== password) { showToast('密码错误'); return; }
  State.user = userData;
  State.token = 'local_' + username;
  localStorage.setItem('current_user', JSON.stringify({ username, token: State.token }));
  showToast('登录成功（离线模式）！');
  document.querySelector('.modal-overlay')?.remove();
  updateNavUser();
}

async function doRegister() {
  const username = $('#regUsername')?.value;
  const password = $('#regPassword')?.value;
  const email = $('#regEmail')?.value || '';
  if (!username || !password) return showToast('请填写用户名和密码');
  if (username.length < 2) return showToast('用户名至少2个字符');
  if (password.length < 4) return showToast('密码至少4个字符');

  const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) });
  if (data.success) {
    setUser(data);
    showToast('注册成功！');
    document.querySelector('.modal-overlay')?.remove();
  } else if (data.error && data.error.includes('已存在')) {
    showToast(data.error);
  } else {
    // 本地注册
    const userData = { username, password, email, createdAt: Date.now(), bibleProgress: {}, bookmarks: [], notes: [], favorites: [] };
    localStorage.setItem('user_'+username, JSON.stringify(userData));
    State.user = userData;
    State.token = 'local_' + username;
    localStorage.setItem('current_user', JSON.stringify({ username, token: State.token }));
    showToast('注册成功（离线模式）！');
    document.querySelector('.modal-overlay')?.remove();
    updateNavUser();
  }
}

function setUser(data) {
  State.user = data.user;
  State.token = data.token;
  localStorage.setItem('current_user', JSON.stringify({ username: data.user.username, token: data.token }));
  updateNavUser();
}

function doLogout() {
  State.user = null;
  State.token = null;
  localStorage.removeItem('current_user');
  updateNavUser();
  showToast('已退出登录');
  document.querySelector('.modal-overlay')?.remove();
}

function updateNavUser() {
  const btn = $('#navUser');
  if (btn) btn.textContent = State.user ? State.user.username.substring(0,2) : '👤';
}

function saveUserState() {
  if (!State.user) return showToast('请先登录');
  localStorage.setItem('user_'+State.user.username, JSON.stringify(State.user));
  showToast('进度已保存！');
}

function exportBibleProgress() {
  if (!State.user) return;
  const data = JSON.stringify(State.user.bibleProgress || {}, null, 2);
  copyText(data);
  showToast('进度已复制到剪贴板！');
}

// ============ 分享功能 ============
function shareVerse(text, ref) {
  const shareText = `"${text}"\n\n——${ref}\n\n📖 更多经文尽在：biblechat.cc`;
  copyText(shareText);
  showToast('已复制到剪贴板！可直接粘贴到微信朋友圈 ✅');
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ============ 导航 ============
function navigate(page) {
  renderPage(page);
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
  // 恢复用户状态
  const saved = localStorage.getItem('current_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      State.token = parsed.token;
      State.user = { username: parsed.username, bibleProgress: {}, bookmarks: [], notes: [] };
      // 加载用户数据
      const userData = localStorage.getItem('user_' + parsed.username);
      if (userData) {
        State.user = JSON.parse(userData);
      }
    } catch (e) {}
  }

  // Tab导航
  $$('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => navigate(tab.dataset.page));
  });

  // 用户按钮
  $('#navUser')?.addEventListener('click', showAuthModal);

  // 初始页面
  updateNavUser();
  renderPage('home');
});

// ============ 内置圣经经文数据 ============
const EMBEDDED_BIBLE = {
  '约翰福音': {
    1: [{v:1,t:"太初有道，道与神同在，道就是神。"},{v:2,t:"这道太初与神同在。"},{v:3,t:"万物是藉着他造的；凡被造的，没有一样不是藉着他造的。"},{v:4,t:"生命在他里头，这生命就是人的光。"},{v:5,t:"光照在黑暗里，黑暗却不接受光。"},{v:12,t:"凡接待他的，就是信他名的人，他就赐他们权柄作神的儿女。"},{v:14,t:"道成了肉身，住在我们中间，充充满满地有恩典有真理。我们也见过他的荣光，正是父独生子的荣光。"},{v:17,t:"律法本是藉着摩西传的；恩典和真理都是由耶稣基督来的。"}],
    3: [{v:16,t:"神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。"},{v:17,t:"因为神差他的儿子降世，不是要定世人的罪，乃是要叫世人因他得救。"},{v:18,t:"信他的人，不被定罪；不信的人，罪已经定了，因为他不信神独生子的名。"},{v:19,t:"光来到世间，世人因自己的行为是恶的，不爱光，倒爱黑暗，定他们的罪就是在此。"},{v:20,t:"凡作恶的便恨光，并不来就光，恐怕他的行为受责备。"},{v:21,t:"但行真理的必来就光，要显明他所行的是靠神而行。"}],
    14: [{v:1,t:"你们心里不要忧愁；你们信神，也当信我。"},{v:2,t:"在我父的家里有许多住处；若是没有，我就早已告诉你们了。我去原是为你们预备地方去。"},{v:3,t:"我若去为你们预备了地方，就必再来接你们到我那里去，我在哪里，叫你们也在那里。"},{v:6,t:"耶稣说：我就是道路、真理、生命；若不藉着我，没有人能到父那里去。"},{v:15,t:"你们若爱我，就必遵守我的命令。"},{v:16,t:"我要求父，父就另外赐给你们一位保惠师，叫他永远与你们同在。"},{v:17,t:"就是真理的圣灵，乃世人不能接受的；因为不见他，也不认识他。你们却认识他，因他常与你们同在，也要在你们里面。"},{v:27,t:"我留下平安给你们；我将我的平安赐给你们。我所赐的，不像世人所赐的。你们心里不要忧愁，也不要胆怯。"}],
    15: [{v:4,t:"你们要常在我里面，我也常在你们里面。枝子若不常在葡萄树上，自己就不能结果子；你们若不常在我里面，也是这样。"},{v:5,t:"我是葡萄树，你们是枝子。常在我里面的，我也常在他里面，这人就多结果子；因为离了我，你们就不能做什么。"},{v:7,t:"你们若常在我里面，我的话也常在你们里面，凡你们所愿意的，祈求，就给你们成就。"},{v:12,t:"你们要彼此相爱，像我爱你们一样；这就是我的命令。"},{v:13,t:"人为朋友舍命，人的爱心没有比这个大的。"}]
  },
  '诗篇': {
    1: [{v:1,t:"不从恶人的计谋，不站罪人的道路，不坐亵慢人的座位。"},{v:2,t:"惟喜爱耶和华的律法，昼夜思想，这人便为有福！"},{v:3,t:"他要像一棵树栽在溪水旁，按时候结果子，叶子也不枯干。凡他所做的尽都顺利。"}],
    23: [{v:1,t:"耶和华是我的牧者，我必不至缺乏。"},{v:2,t:"他使我躺卧在青草地上，领我在可安歇的水边。"},{v:3,t:"他使我的灵魂苏醒，为自己的名引导我走义路。"},{v:4,t:"我虽然行过死荫的幽谷，也不怕遭害，因为你与我同在；你的杖，你的竿，都安慰我。"},{v:5,t:"在我敌人面前，你为我摆设筵席；你用油膏了我的头，使我的福杯满溢。"},{v:6,t:"我一生一世必有恩惠慈爱随着我；我且要住在耶和华的殿中，直到永远。"}],
    91: [{v:1,t:"住在至高者隐密处的，必住在全能者的荫下。"},{v:2,t:"我要论到耶和华说：他是我的避难所，是我的山寨，是我的神，是我所倚靠的。"}]
  },
  '创世记': {
    1: [{v:1,t:"起初，神创造天地。"},{v:2,t:"地是空虚混沌，渊面黑暗；神的灵运行在水面上。"},{v:3,t:"神说：要有光，就有了光。"},{v:4,t:"神看光是好的，就把光暗分开了。"},{v:5,t:"神称光为昼，称暗为夜。有晚上，有早晨，这是头一日。"},{v:26,t:"神说：我们要照着我们的形像、按着我们的样式造人，使他们管理海里的鱼、空中的鸟、地上的牲畜，和全地，并地上所爬的一切昆虫。"},{v:27,t:"神就照着自己的形像造人，乃是照着他的形像造男造女。"}]
  },
  '启示录': {
    21: [{v:1,t:"我又看见一个新天新地；因为先前的天地已经过去了，海也不再有了。"},{v:3,t:"我听见有大声音从宝座出来说：看哪，神的帐幕在人间。他要与人同住，他们要作他的子民。神要亲自与他们同在，作他们的神。"},{v:4,t:"神要擦去他们一切的眼泪；不再有死亡，也不再有悲哀、哭号、疼痛，因为以前的事都过去了。"},{v:5,t:"坐宝座的说：看哪，我将一切都更新了！"}],
    22: [{v:13,t:"我是阿拉法，我是俄梅戛；我是首先的，我是末后的；我是初，我是终。"},{v:20,t:"证明这事的说：是了，我必快来！阿们！主耶稣啊，我愿你来！"}]
  }
};
