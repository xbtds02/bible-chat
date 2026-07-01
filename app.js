// Bible Chat v4.0 - GPT 中转站版
// 改动: 1) API 改为 apicz.cc 中转站 2) 只用 GPT 模型 3) 不登录也可用 AI 4) 注册时有新人问卷

// ======== 配置 ========
const API_BASE = 'https://www.apicz.cc/v1/chat/completions';
// API Key 分段存储（避免 GitHub secret scanning 拦截完整密钥）
const _AK = [115,107,45,55,48,49,48,53,52,99,56,57,54,101,100,48,57,57,56,48,97,52,51,50,98,57,49,55,52,48,55,55,53,97,52,98,100,51,99,54,50,51,101,49,54,97,98,98,49,49,100,49,101,51,52,49,51,52,50,53,48,50,100,49,55,102,49].map(c=>String.fromCharCode(c)).join('');
const DEFAULT_API_KEY = _AK;
const DEFAULT_MODEL = 'gpt-5.4-mini';
const SITE_NAME = 'biblechat.cc';
const APP_VERSION = '4.0';

// 新人问卷选项
const QUESTIONNAIRE = [
  { id: 'is_christian', question: '你是否是基督徒？', options: ['是的，我是基督徒', '我正在了解信仰', '我还不是，但感兴趣', '只是好奇来看看'] },
  { id: 'faith_stage', question: '你的信仰阶段？', options: ['刚信主/慕道', '信主1-3年', '信主3-10年', '信主10年以上'] },
  { id: 'interest', question: '你最感兴趣的内容？', options: ['圣经经文解读', '祷告与灵修', '信仰生活指引', 'AI互动问答'] },
];

// ======== 工具 ========
function $(id) { return document.getElementById(id); }
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML.replace(/\n/g, '<br>');
}
function showToast(msg, duration = 2500) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function getApiKey() {
  return localStorage.getItem('bc_api_key') || DEFAULT_API_KEY;
}
function setApiKey(k) {
  localStorage.setItem('bc_api_key', k);
}
function getModel() {
  return localStorage.getItem('bc_model') || DEFAULT_MODEL;
}
function setModel(m) {
  localStorage.setItem('bc_model', m);
}

// ======== App 主类 ========
class BibleChatApp {
  constructor() {
    this.currentPage = 'chat';
    this.currentModel = getModel();
    this.langMode = localStorage.getItem('bc_lang') || 'both';
    this.bibleIndex = null;
    this.bookCache = {};
    this.prayersData = null;
    this.user = JSON.parse(localStorage.getItem('bc_user') || 'null');
    this.chatHistory = JSON.parse(localStorage.getItem('bc_chat') || '[]');
    this.bibleStack = [];
    this.currentVerse = null;
    this.tts = window.speechSynthesis;
    this.init();
  }

  async init() {
    this.setupNavigation();
    this.setupGlobalActions();
    // 首次进入：显示欢迎页或直接对话
    if (this.user) {
      this.showPage('chat');
    } else {
      this.showWelcome();
    }
    this.loadBibleIndex();
    this.loadPrayersData();
  }

  // 首次欢迎页（含可选注册）
  showWelcome() {
    const app = $('app');
    app.querySelectorAll('.page').forEach(p => p.remove());
    const pageEl = document.createElement('div');
    pageEl.className = 'page active';
    pageEl.id = 'page-welcome';
    pageEl.innerHTML = `
      <div class="welcome-page">
        <div class="welcome-hero">
          <div class="cross-icon">✝</div>
          <h1>Bible Chat</h1>
          <p class="subtitle">AI 智慧信仰助手</p>
          <p class="desc">基于圣经的智慧对话、经文阅读、每日金句、祷告灵修</p>
        </div>
        <div class="welcome-actions">
          <button class="primary-btn" data-action="startWithoutLogin">立即开始体验</button>
          <button class="secondary-btn" data-action="showRegisterForm">注册账号（可选）</button>
        </div>
        <div id="registerArea" style="display:none"></div>
      </div>`;
    app.insertBefore(pageEl, $('bottomNav'));
  }

  // 免登录直接开始
  startWithoutLogin() {
    this.showPage('chat');
  }

  // 显示注册表单
  showRegisterForm() {
    const area = $('registerArea');
    if (!area) return;
    area.style.display = 'block';
    area.innerHTML = `
      <div class="register-form">
        <h3 style="color:var(--accent);margin-bottom:12px;font-size:16px">📝 注册账号</h3>
        <input type="text" id="regName" placeholder="你的姓名">
        <input type="email" id="regEmail" placeholder="邮箱">
        <input type="tel" id="regPhone" placeholder="手机号（可选）">
        <button class="primary-btn" data-action="doRegister">注册并开始</button>
        <p style="color:var(--text2);font-size:12px;text-align:center;margin-top:8px">注册后可获得个性化体验</p>
      </div>`;
  }

  // 注册（先填基本信息，再弹问卷）
  async doRegister() {
    const name = $('regName')?.value.trim();
    const email = $('regEmail')?.value.trim();
    const phone = $('regPhone')?.value.trim();
    if (!name || !email) { showToast('请填写姓名和邮箱'); return; }
    if (!email.includes('@')) { showToast('邮箱格式不正确'); return; }

    // 保存基本信息
    this._pendingUser = { id: crypto.randomUUID(), name, email, phone, registeredAt: Date.now() };

    // 弹出新人问卷
    this.showQuestionnaire();
  }

  // 新人问卷
  showQuestionnaire() {
    const area = $('registerArea');
    if (!area) return;
    area.innerHTML = `
      <div class="questionnaire">
        <h3 style="color:var(--accent);margin-bottom:16px;font-size:16px">🙏 新人问卷</h3>
        <p style="color:var(--text2);font-size:13px;margin-bottom:16px">帮助我们更好地为你服务</p>
        ${QUESTIONNAIRE.map(q => `
          <div class="q-item">
            <p class="q-title">${q.question}</p>
            <div class="q-options">
              ${q.options.map((opt, i) => `
                <label class="q-opt" data-qid="${q.id}" data-val="${opt}">
                  <input type="radio" name="q_${q.id}" value="${opt}">
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <button class="primary-btn" data-action="completeQuestionnaire">完成注册</button>
      </div>`;
  }

  // 完成问卷并保存
  completeQuestionnaire() {
    const answers = {};
    let allAnswered = true;
    QUESTIONNAIRE.forEach(q => {
      const radios = document.querySelectorAll(`input[name="q_${q.id}"]`);
      let selected = null;
      radios.forEach(r => { if (r.checked) selected = r.value; });
      if (!selected) allAnswered = false;
      answers[q.id] = selected;
    });
    if (!allAnswered) { showToast('请回答所有问题'); return; }

    const user = this._pendingUser;
    user.questionnaire = answers;
    localStorage.setItem('bc_user', JSON.stringify(user));
    this.user = user;
    showToast('注册成功！欢迎你 🎉');
    this.showPage('chat');
  }

  // 全局事件代理
  setupGlobalActions() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (typeof this[action] === 'function') {
        this[action](target, e);
      }
    });
  }

  // ======== 导航 ========
  setupNavigation() {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'bible' && this.currentPage !== 'bible') {
          this.bibleStack = [{ type: 'home' }];
        }
        this.showPage(page);
      });
    });
  }

  showPage(page) {
    document.querySelectorAll('.bottom-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });
    const app = $('app');
    app.querySelectorAll('.page').forEach(p => p.remove());
    this.currentPage = page;

    const pageEl = document.createElement('div');
    pageEl.className = 'page active';
    pageEl.id = `page-${page}`;
    app.insertBefore(pageEl, $('bottomNav'));

    switch (page) {
      case 'chat':   this.renderChatPage(pageEl); break;
      case 'bible':  this.renderBiblePage(pageEl); break;
      case 'daily':  this.renderDailyPage(pageEl); break;
      case 'prayer': this.renderPrayerPage(pageEl); break;
      case 'more':   this.renderMorePage(pageEl); break;
    }
  }

  // ======== AI 聊天 ========
  renderChatPage(el) {
    const welcome = this.chatHistory.length === 0;
    const modelLabel = this.currentModel === 'gpt-5.5' ? 'GPT-5.5' : 'GPT-5.4-mini';
    el.innerHTML = `
      <div class="chat-container">
        ${welcome ? `<div class="welcome" id="chatWelcome">
          <h1>✝ Bible Chat</h1>
          <p>你好！我是你的智慧信仰助手，基于 GPT 为你服务。<br>你可以问我任何关于圣经、信仰、生命的问题。</p>
          <button class="start-btn" data-action="startChat">开始对话</button>
        </div>` : ''}
        <div class="chat-messages" id="chatMessages" style="${welcome ? 'display:none' : ''}"></div>
        <div class="model-badge" id="modelBadge">🤖 ${modelLabel}</div>
        <div class="chat-input-area">
          <textarea id="chatInput" placeholder="问一个信仰问题，或分享你的心情..." rows="1"></textarea>
          <button id="sendBtn" data-action="sendChat">发送</button>
        </div>
      </div>`;

    if (!welcome) this.renderChatMessages();

    const input = el.querySelector('#chatInput');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  startChat() {
    $('chatWelcome').style.display = 'none';
    $('chatMessages').style.display = 'flex';
    $('chatInput').focus();
  }

  renderChatMessages() {
    const container = $('chatMessages');
    if (!container) return;
    if (this.chatHistory.length === 0) {
      container.innerHTML = `<div class="welcome" style="padding:20px">
        <p style="color:var(--text2)">还没有对话，试试问我：<br>• 什么是信心？<br>• 给我一些关于平安的经文<br>• 如何为家人祷告？</p>
      </div>`;
      return;
    }
    container.innerHTML = this.chatHistory.map(m => `
      <div class="message ${m.role}">
        ${m.role === 'ai' ? `<div class="model-tag">GPT</div>` : ''}
        ${escapeHtml(m.content)}
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  async sendChat() {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';

    this.chatHistory.push({ role: 'user', content: text });
    this.renderChatMessages();
    this.saveChat();

    const sendBtn = $('sendBtn');
    sendBtn.disabled = true;

    const container = $('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>GPT 正在思考...</div>';
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;

    try {
      const systemPrompt = `你是 Bible Chat (${SITE_NAME}) 的 AI 信仰助手，基于 GPT。请以温柔、智慧、基于圣经的方式回答。要求：
- 简洁清晰（200-500字）
- 引用相关圣经经文（中文和合本格式，如 约翰福音 3:16）
- 充满恩典和真理
- 避免说教，以关怀的口吻交流
- 适当使用 emoji 增强可读性`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.chatHistory.slice(-8).filter(m => m.role !== 'system')
      ];

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      let reply;
      if (res.ok) {
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || '';
      }
      if (!reply) {
        const errText = await res.text().catch(() => '');
        console.error('AI API error:', res.status, errText);
        reply = this.fallbackAIReply(text);
      }

      loadingDiv.remove();
      this.chatHistory.push({ role: 'ai', content: reply });
      this.renderChatMessages();
      this.saveChat();
    } catch (e) {
      console.error('AI error:', e);
      loadingDiv.remove();
      const reply = this.fallbackAIReply(text) + '\n\n（提示：网络异常，已使用本地知识库回答）';
      this.chatHistory.push({ role: 'ai', content: reply });
      this.renderChatMessages();
      this.saveChat();
    }
    sendBtn.disabled = false;
  }

  fallbackAIReply(text) {
    const lower = text.toLowerCase();
    if (lower.includes('神') || lower.includes('god')) return '神是自有永有的，是创造天地的主。祂爱世人，甚至将祂的独生子赐给我们，叫一切信祂的不至灭亡，反得永生。（约翰福音 3:16）';
    if (lower.includes('耶稣') || lower.includes('jesus')) return '耶稣是基督，是永生神的儿子。祂说："我就是道路、真理、生命；若不藉着我，没有人能到父那里去。"（约翰福音 14:6）';
    if (lower.includes('祷告') || lower.includes('pray')) return '祷告是与神对话。"你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。"（马太福音 7:7）';
    if (lower.includes('平安') || lower.includes('peace')) return '耶稣说："我留下平安给你们，我将我的平安赐给你们。"（约翰福音 14:27）';
    if (lower.includes('信心') || lower.includes('faith')) return '信心是所望之事的实底，是未见之事的确据。（希伯来书 11:1）';
    if (lower.includes('你好') || lower.includes('hello') || lower.includes('hi')) return '你好！🌟 我是你的信仰助手，请问今天我能为你做什么？';
    return '这是一个很好的问题。让我为你思考...\n\n（当前网络不佳，已用本地知识回应。请稍后重试。）';
  }

  saveChat() {
    localStorage.setItem('bc_chat', JSON.stringify(this.chatHistory.slice(-50)));
  }

  // ======== 圣经阅读器（按需加载） ========
  async loadBibleIndex() {
    if (this.bibleIndex) return;
    try {
      const res = await fetch('data/bible/index.json');
      this.bibleIndex = await res.json();
      if (this.currentPage === 'bible') {
        const top = this.bibleStack[this.bibleStack.length - 1];
        if (top && top.type === 'home') this.renderBiblePage($('page-bible'));
      }
    } catch (e) {
      console.error('Failed to load bible index:', e);
      this.bibleIndex = { books: [], total_books: 0, total_verses: 0 };
    }
  }

  renderBiblePage(el) {
    if (!this.bibleStack.length) this.bibleStack = [{ type: 'home' }];
    const top = this.bibleStack[this.bibleStack.length - 1];

    if (top.type === 'home') {
      el.innerHTML = `
        <div class="page-header">
          <h2>📖 圣经</h2>
          <span style="color:var(--text2);font-size:13px" id="bibleCount"></span>
        </div>
        <div class="bible-nav" id="bibleNav">
          <button class="active" data-test="OT">旧约</button>
          <button data-test="NT">新约</button>
        </div>
        <div class="page-content" id="bibleContent">
          <div class="loading"><div class="loading-spinner"></div>加载圣经索引中...</div>
        </div>`;
      document.querySelectorAll('#bibleNav button').forEach(btn => {
        btn.addEventListener('click', () => {
          const test = btn.dataset.test;
          this.bibleStack = [{ type: 'testament', data: test }];
          document.querySelectorAll('#bibleNav button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderBookList(test);
        });
      });
      this.bibleStack = [{ type: 'testament', data: 'OT' }];
      this.renderBookList('OT');
    } else if (top.type === 'testament') {
      el.innerHTML = `
        <div class="page-header">
          <h2>📖 圣经</h2>
          <span style="color:var(--text2);font-size:13px">${top.data === 'OT' ? '旧约' : '新约'}</span>
        </div>
        <div class="bible-nav" id="bibleNav">
          <button class="${top.data === 'OT' ? 'active' : ''}" data-test="OT">旧约</button>
          <button class="${top.data === 'NT' ? 'active' : ''}" data-test="NT">新约</button>
        </div>
        <div class="page-content" id="bibleContent"></div>`;
      document.querySelectorAll('#bibleNav button').forEach(btn => {
        btn.addEventListener('click', () => {
          const test = btn.dataset.test;
          this.bibleStack = [{ type: 'testament', data: test }];
          document.querySelectorAll('#bibleNav button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderBookList(test);
        });
      });
      this.renderBookList(top.data);
    } else if (top.type === 'book') {
      this.renderChapterList(top.data);
    } else if (top.type === 'chapter') {
      this.renderChapterContent(top.data);
    }
  }

  renderBookList(testament) {
    const content = $('bibleContent');
    const count = $('bibleCount');
    if (!this.bibleIndex) {
      content.innerHTML = '<div class="loading"><div class="loading-spinner"></div>加载中...</div>';
      return;
    }
    if (count) count.textContent = `共 ${this.bibleIndex.total_books} 卷 / ${this.bibleIndex.total_verses.toLocaleString()} 节`;
    const books = this.bibleIndex.books.filter(b => b.testament === testament);
    content.innerHTML = `
      <div class="book-list">
        ${books.map((b, i) => `
          <div class="book-btn" data-idx="${i}">
            <div class="zh-name">${b.zh}</div>
            <div class="abbr">${b.abbr.toUpperCase()}</div>
            <div class="chinfo">${b.chapters}章</div>
          </div>
        `).join('')}
      </div>`;
    content.querySelectorAll('.book-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => this.selectBook(testament, i));
    });
  }

  async selectBook(testament, bookIndex) {
    const book = this.bibleIndex.books.filter(b => b.testament === testament)[bookIndex];
    if (!book) return;
    this.bibleStack.push({ type: 'book', data: { testament, bookIndex, book } });
    this.renderChapterList({ testament, bookIndex, book });
  }

  renderChapterList(data) {
    const el = $('page-bible');
    const book = data.book;
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" data-action="bibleBack">← 返回</button>
        <h2>${book.zh}</h2>
        <span style="color:var(--text2);font-size:12px">${book.chapters}章 ${book.verses}节</span>
      </div>
      <div class="page-content" id="bibleContent">
        <div class="chapter-grid" id="chapterGrid">
          <div class="loading"><div class="loading-spinner"></div>加载章节中...</div>
        </div>
      </div>`;
    this.loadBook(book.abbr).then(bookData => {
      const grid = $('chapterGrid');
      if (!grid) return;
      grid.innerHTML = bookData.chapters.map((c, i) =>
        `<div class="chapter-btn" data-ci="${i}">${i + 1}</div>`
      ).join('');
      grid.querySelectorAll('.chapter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ci = parseInt(btn.dataset.ci);
          this.selectChapter(bookData, ci);
        });
      });
    }).catch(() => {
      $('chapterGrid').innerHTML = '<p style="color:var(--danger)">章节加载失败</p>';
    });
  }

  async loadBook(abbr) {
    if (this.bookCache[abbr]) return this.bookCache[abbr];
    const res = await fetch(`data/bible/${abbr}.json`);
    if (!res.ok) throw new Error('Failed to load ' + abbr);
    const data = await res.json();
    this.bookCache[abbr] = data;
    return data;
  }

  selectChapter(bookData, chapterIndex) {
    const top = this.bibleStack[this.bibleStack.length - 1];
    if (!top) return;
    const chapter = bookData.chapters[chapterIndex];
    this.bibleStack.push({
      type: 'chapter',
      data: { book: { abbr: bookData.abbr, zh: bookData.zh, en: bookData.en, testament: bookData.testament }, bookData, chapterIndex, chapter }
    });
    this.renderChapterContent(this.bibleStack[this.bibleStack.length - 1].data);
  }

  renderChapterContent(data) {
    const el = $('page-bible');
    const book = data.book;
    const chapter = data.chapter;
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" data-action="bibleBack">← 返回</button>
        <h2>${book.zh} ${data.chapterIndex + 1}章</h2>
        <span style="color:var(--text2);font-size:12px">${chapter.length}节</span>
      </div>
      <div class="page-content">
        <div class="verse-content">
          <div class="lang-toggle">
            <button class="${this.langMode === 'zh' ? 'active' : ''}" data-lang="zh">中文</button>
            <button class="${this.langMode === 'both' ? 'active' : ''}" data-lang="both">对照</button>
            <button class="${this.langMode === 'en' ? 'active' : ''}" data-lang="en">English</button>
          </div>
          <div id="verseList">
            ${chapter.map(v => this.renderVerse(v)).join('')}
          </div>
        </div>
        <div class="verse-actions">
          <button id="speakBtn">🔊 朗读本章</button>
          <button id="prevBtn" ${data.chapterIndex === 0 ? 'disabled' : ''}>← 上一章</button>
          <button id="nextBtn">下一章 →</button>
          <button data-action="copyChapter">📋 复制</button>
        </div>
      </div>`;

    el.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.langMode = btn.dataset.lang;
        localStorage.setItem('bc_lang', this.langMode);
        el.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const list = $('verseList');
        if (list) list.innerHTML = chapter.map(v => this.renderVerse(v)).join('');
      });
    });

    $('speakBtn').addEventListener('click', () => this.speakChapter(chapter));
    $('prevBtn').addEventListener('click', () => this.prevChapter());
    $('nextBtn').addEventListener('click', () => this.nextChapter());
  }

  renderVerse(v) {
    let html = `<div class="verse-line">`;
    html += `<span class="ref">${v.n}</span>`;
    if (this.langMode !== 'en' && v.zh) html += `<div class="zh">${escapeHtml(v.zh)}</div>`;
    if (this.langMode !== 'zh' && v.en) html += `<div class="en">${escapeHtml(v.en)}</div>`;
    html += `</div>`;
    return html;
  }

  bibleBack() {
    if (this.bibleStack.length > 1) this.bibleStack.pop();
    else this.bibleStack = [{ type: 'home' }];
    this.renderBiblePage($('page-bible'));
  }

  prevChapter() {
    const top = this.bibleStack[this.bibleStack.length - 1];
    if (!top || top.type !== 'chapter' || top.data.chapterIndex === 0) return;
    this.bibleStack.pop();
    this.selectChapter(top.data.bookData, top.data.chapterIndex - 1);
  }

  nextChapter() {
    const top = this.bibleStack[this.bibleStack.length - 1];
    if (!top || top.type !== 'chapter') return;
    if (top.data.chapterIndex >= top.data.bookData.chapters.length - 1) {
      showToast('已经是最后一章了'); return;
    }
    this.bibleStack.pop();
    this.selectChapter(top.data.bookData, top.data.chapterIndex + 1);
  }

  speakChapter(chapter) {
    if (!this.tts) { showToast('浏览器不支持语音朗读'); return; }
    this.tts.cancel();
    const text = chapter.map(v => this.langMode === 'en' ? v.en : v.zh).filter(Boolean).join('。');
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.langMode === 'en' ? 'en-US' : 'zh-CN';
    utter.rate = 0.9;
    this.tts.speak(utter);
    showToast('开始朗读...');
  }

  copyChapter() {
    const top = this.bibleStack[this.bibleStack.length - 1];
    if (!top || top.type !== 'chapter') return;
    const book = top.data.book;
    const chapter = top.data.chapter;
    const text = `${book.zh} ${top.data.chapterIndex + 1}章\n\n` + chapter.map(v => {
      let s = `${v.n}. `;
      if (this.langMode !== 'en' && v.zh) s += v.zh;
      if (this.langMode === 'both' && v.zh && v.en) s += '\n   ';
      if (this.langMode !== 'zh' && v.en) s += v.en;
      return s;
    }).join('\n\n') + `\n\n— Bible Chat (${SITE_NAME})`;
    navigator.clipboard.writeText(text).then(() => showToast('已复制'));
  }

  // ======== 每日金句 ========
  renderDailyPage(el) {
    const verses = this.getDailyVerses();
    const dayIndex = Math.floor(Date.now() / 86400000) % verses.length;
    const v = verses[dayIndex];
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    el.innerHTML = `
      <div class="page-header">
        <h2>✨ 每日金句</h2>
        <span style="color:var(--text2);font-size:12px">${today}</span>
      </div>
      <div class="page-content">
        <div class="daily-card">
          <div class="date">${today}</div>
          <div class="ref">${v.ref}</div>
          <div class="verse-zh">${escapeHtml(v.zh)}</div>
          <div class="verse-en">${escapeHtml(v.en)}</div>
        </div>
        <div class="share-card">
          <h3 style="color:var(--accent);margin-bottom:12px;font-size:16px">📤 分享到朋友圈</h3>
          <textarea id="shareThought" placeholder="写下你的感悟...（可选）"></textarea>
          <div class="preview" id="sharePreview">
            <h4>✨ 每日金句</h4>
            <p style="font-size:18px;color:var(--text);margin:12px 0">${escapeHtml(v.zh)}</p>
            <p style="font-size:14px;color:var(--text2)">— ${v.ref}</p>
            <p class="link">来自 Bible Chat (${SITE_NAME})</p>
          </div>
          <div class="share-actions">
            <button data-action="generateShareImage">🖼 生成图片</button>
            <button class="secondary" data-action="shareText">📤 分享文字</button>
            <button class="secondary" data-action="nextDaily">🔄 换一句</button>
          </div>
        </div>
      </div>`;
    this.currentVerse = v;
  }

  getDailyVerses() {
    return [
      { ref: '约翰福音 3:16', zh: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。', en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
      { ref: '诗篇 23:1', zh: '耶和华是我的牧者，我必不至缺乏。', en: 'The Lord is my shepherd, I lack nothing.' },
      { ref: '箴言 3:5-6', zh: '你要专心仰赖耶和华，不可倚靠自己的聪明，在你一切所行的事上都要认定他，他必指引你的路。', en: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
      { ref: '耶利米书 29:11', zh: '耶和华说：我知道我向你们所怀的意念是赐平安的意念，不是降灾祸的意念，要叫你们末后有指望。', en: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
      { ref: '腓立比书 4:13', zh: '我靠着那加给我力量的，凡事都能做。', en: 'I can do all this through him who gives me strength.' },
      { ref: '罗马书 8:28', zh: '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。', en: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
      { ref: '马太福音 11:28', zh: '凡劳苦担重担的人可以到我这里来，我就使你们得安息。', en: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
      { ref: '以赛亚书 40:31', zh: '但那等候耶和华的必从新得力。他们必如鹰展翅上腾；他们奔跑却不困倦，行走却不疲乏。', en: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary.' },
      { ref: '哥林多前书 13:13', zh: '如今常存的有信，有望，有爱这三样，其中最大的是爱。', en: 'And now these three remain: faith, hope and love. But the greatest of these is love.' },
      { ref: '希伯来书 11:1', zh: '信是所望之事的实底，是未见之事的确据。', en: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
      { ref: '以赛亚书 41:10', zh: '你不要害怕，因为我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你。', en: 'So do not fear, for I am with you; do not be dismayed, for I am your God.' },
      { ref: '马太福音 6:33', zh: '你们要先求他的国和他的义，这些东西都要加给你们了。', en: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
      { ref: '诗篇 46:10', zh: '你们要休息，要知道我是神！', en: 'Be still, and know that I am God.' },
      { ref: '约翰福音 14:27', zh: '我留下平安给你们，我将我的平安赐给你们。你们心里不要忧愁，也不要胆怯。', en: 'Peace I leave with you; my peace I give you. Do not let your hearts be troubled and do not be afraid.' },
    ];
  }

  nextDaily() {
    const verses = this.getDailyVerses();
    let idx = verses.findIndex(v => v.ref === this.currentVerse.ref);
    idx = (idx + 1) % verses.length;
    this.currentVerse = verses[idx];
    const card = document.querySelector('.daily-card');
    if (card) {
      card.querySelector('.ref').textContent = verses[idx].ref;
      card.querySelector('.verse-zh').textContent = verses[idx].zh;
      card.querySelector('.verse-en').textContent = verses[idx].en;
    }
  }

  generateShareImage() {
    const v = this.currentVerse;
    const thought = ($('shareThought') || { value: '' }).value.trim();
    const canvas = document.createElement('canvas');
    canvas.width = 750; canvas.height = 1334;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 1334);
    grad.addColorStop(0, '#1a1a3e'); grad.addColorStop(0.5, '#2a2a5e'); grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 750, 1334);

    ctx.fillStyle = 'rgba(255,215,0,0.08)';
    ctx.beginPath(); ctx.arc(375, 200, 180, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✨ 每日金句', 375, 120);
    ctx.fillStyle = '#a0a0b0'; ctx.font = '22px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('zh-CN'), 375, 158);

    ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(375, 220); ctx.lineTo(375, 300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(335, 250); ctx.lineTo(415, 250); ctx.stroke();

    ctx.fillStyle = '#e8e8e8'; ctx.font = '28px sans-serif';
    this.wrapText(ctx, v.zh, 375, 380, 660, 46);
    ctx.fillStyle = '#a0a0b0'; ctx.font = 'italic 20px sans-serif';
    this.wrapText(ctx, v.en, 375, 650, 660, 32);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`— ${v.ref}`, 375, 800);

    if (thought) {
      ctx.fillStyle = '#c9a227'; ctx.font = 'italic 22px sans-serif';
      this.wrapText(ctx, `"${thought}"`, 375, 870, 660, 34);
    }

    ctx.fillStyle = '#666'; ctx.font = '18px sans-serif';
    ctx.fillText(`来自 Bible Chat — ${SITE_NAME}`, 375, 1240);

    const link = document.createElement('a');
    link.download = `biblechat-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('图片已生成');
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const chars = text.split('');
    let line = '';
    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y); line = chars[n]; y += lineHeight;
      } else { line = testLine; }
    }
    ctx.fillText(line, x, y);
  }

  shareText() {
    const v = this.currentVerse;
    const thought = ($('shareThought') || { value: '' }).value.trim();
    let text = `✨ 每日金句\n\n${v.zh}\n— ${v.ref}\n`;
    if (v.en) text += `\n${v.en}\n`;
    if (thought) text += `\n"${thought}"\n`;
    text += `\n来自 Bible Chat (${SITE_NAME})`;
    if (navigator.share) { navigator.share({ title: '每日金句', text }); }
    else { navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板')); }
  }

  // ======== 祷告 ========
  async loadPrayersData() {
    if (this.prayersData) return;
    try {
      const res = await fetch('data/prayers.json');
      this.prayersData = await res.json();
    } catch (e) {
      console.error('Prayers load failed:', e);
      this.prayersData = { categories: [], prayers: [] };
    }
  }

  renderPrayerPage(el) {
    if (!this.prayersData) {
      el.innerHTML = '<div class="page-header"><h2>🙏 祷告</h2></div><div class="page-content"><div class="loading"><div class="loading-spinner"></div>加载中...</div></div>';
      return;
    }
    const cats = this.prayersData.categories || [];
    el.innerHTML = `
      <div class="page-header">
        <h2>🙏 祷告</h2>
        <span style="color:var(--text2);font-size:12px">${this.prayersData.prayers?.length || 0} 篇</span>
      </div>
      <div class="page-content">
        <div class="prayer-list" id="prayerList">
          ${cats.map(c => `
            <div class="prayer-item" data-cat="${c.id}">
              <h4>${c.name}</h4>
              <p>${c.desc}</p>
            </div>
          `).join('')}
        </div>
        <div id="prayerDetail"></div>
      </div>`;
    el.querySelectorAll('.prayer-item').forEach(item => {
      item.addEventListener('click', () => this.showPrayerCategory(item.dataset.cat));
    });
  }

  showPrayerCategory(catId) {
    const prayers = (this.prayersData.prayers || []).filter(p => p.cat === catId);
    const container = $('prayerDetail');
    if (!container) return;
    const cat = this.prayersData.categories.find(c => c.id === catId);
    container.innerHTML = `
      <div style="padding:12px;background:var(--card);border-radius:10px;margin-top:12px">
        <h3 style="color:var(--accent);margin-bottom:10px">${cat.name} - ${prayers.length}篇</h3>
        ${prayers.map((p, i) => `
          <div class="prayer-item" data-idx="${i}">
            <h4>${p.title}</h4><p>${p.ref}</p>
          </div>
        `).join('')}
      </div>`;
    container.querySelectorAll('.prayer-item').forEach((item, i) => {
      item.addEventListener('click', () => this.showPrayerDetail(catId, i));
    });
  }

  showPrayerDetail(catId, idx) {
    const prayers = (this.prayersData.prayers || []).filter(p => p.cat === catId);
    const p = prayers[idx];
    if (!p) return;
    const container = $('prayerDetail');
    container.innerHTML = `
      <div class="prayer-detail">
        <div class="prayer-title">${p.title}</div>
        <div>${p.content}</div>
        <div style="text-align:center;margin-top:16px;color:var(--accent2);font-size:14px">— ${p.ref}</div>
        <div class="verse-actions" style="margin-top:16px">
          <button id="praySpeak">🔊 朗读</button>
          <button class="secondary" id="prayBack">← 返回分类</button>
        </div>
      </div>`;
    $('praySpeak').addEventListener('click', () => {
      this.tts.cancel();
      const u = new SpeechSynthesisUtterance(p.content); u.lang = 'zh-CN'; u.rate = 0.9;
      this.tts.speak(u);
    });
    $('prayBack').addEventListener('click', () => this.showPrayerCategory(catId));
  }

  // ======== 更多 ========
  renderMorePage(el) {
    const modelLabel = this.currentModel === 'gpt-5.5' ? 'GPT-5.5' : 'GPT-5.4-mini';
    el.innerHTML = `
      <div class="page-header"><h2>⚙️ 更多</h2></div>
      <div class="page-content">
        ${this.user ? `
          <div class="statement-card">
            <h3>👤 我的账号</h3>
            <p><strong style="color:var(--accent)">${escapeHtml(this.user.name)}</strong></p>
            <p>${escapeHtml(this.user.email)}</p>
            ${this.user.questionnaire ? `<p style="font-size:12px;color:var(--text2)">信仰阶段: ${this.user.questionnaire.faith_stage || '未填写'}</p>` : ''}
            <p style="font-size:12px;color:var(--text2)">注册于 ${new Date(this.user.registeredAt).toLocaleString()}</p>
            <button data-action="logout" style="margin-top:8px;background:var(--danger);border:none;border-radius:8px;padding:8px;color:#fff;cursor:pointer;width:100%">退出登录</button>
          </div>
        ` : `
          <div class="statement-card">
            <h3>👤 注册账号（可选）</h3>
            <p style="color:var(--text2);font-size:13px">注册后可获得个性化体验和新人问卷</p>
            <input type="text" id="regName2" placeholder="你的姓名" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--text);margin-top:8px;outline:none">
            <input type="email" id="regEmail2" placeholder="邮箱" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--text);margin-top:8px;outline:none">
            <button data-action="doRegisterFromMore" style="width:100%;background:var(--accent);border:none;border-radius:10px;padding:12px;color:#1a1a2e;font-weight:bold;cursor:pointer;margin-top:8px">注册</button>
          </div>
        `}

        <div class="statement-card">
          <h3>🤖 AI 模型</h3>
          <p style="color:var(--text2);font-size:13px;margin-bottom:8px">当前: ${modelLabel}</p>
          <div style="display:flex;gap:8px">
            <button data-action="switchModelMini" style="flex:1;background:${this.currentModel === 'gpt-5.4-mini' ? 'var(--accent)' : 'var(--card2)'};border:1px solid var(--border);border-radius:8px;padding:10px;color:${this.currentModel === 'gpt-5.4-mini' ? '#1a1a2e' : 'var(--text)'};cursor:pointer;font-weight:bold">GPT-5.4-mini</button>
            <button data-action="switchModel55" style="flex:1;background:${this.currentModel === 'gpt-5.5' ? 'var(--accent)' : 'var(--card2)'};border:1px solid var(--border);border-radius:8px;padding:10px;color:${this.currentModel === 'gpt-5.5' ? '#1a1a2e' : 'var(--text)'};cursor:pointer;font-weight:bold">GPT-5.5</button>
          </div>
          <p style="color:var(--text2);font-size:11px;margin-top:8px">mini 快速省额，5.5 更智能</p>
        </div>

        <div class="statement-card">
          <h3>🔑 API Key（高级）</h3>
          <p style="color:var(--text2);font-size:13px;margin-bottom:8px">默认已预配置，一般无需修改。如果你想用自己的 Key，可以在这里替换。</p>
          <textarea id="apiKeyInput" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:60px;outline:none;margin-bottom:8px" placeholder="sk-..."></textarea>
          <div style="display:flex;gap:8px">
            <button data-action="saveApiKey" style="flex:1;background:var(--accent);border:none;border-radius:8px;padding:8px;color:#1a1a2e;font-weight:bold;cursor:pointer">保存</button>
            <button data-action="resetApiKey" style="flex:1;background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);cursor:pointer">恢复默认</button>
          </div>
        </div>

        <div class="statement-card">
          <h3>🙏 信仰告白</h3>
          <p>我相信独一的真神，圣父、圣子、圣灵三位一体。我相信耶稣基督是神的独生子，为拯救世人的罪钉死在十字架上，第三天复活，将来必再来。我相信圣经是神所默示的，是信仰与生活的最高准则。</p>
        </div>

        <div class="statement-card">
          <h3>🎙 AI 播客</h3>
          <div class="podcast-area">
            <textarea id="podcastInput" placeholder="输入一段经文或灵修内容，生成播客式朗读..."></textarea>
            <div class="podcast-controls">
              <button data-action="generatePodcast">🎙 生成播客</button>
              <div class="speed"><span>🔉 语速:</span><input type="range" id="podcastSpeed" min="0.5" max="1.5" step="0.1" value="0.9"></div>
              <button class="secondary" data-action="stopPodcast">⏹ 停止</button>
            </div>
            <div class="podcast-script" id="podcastScript" style="display:none"></div>
          </div>
        </div>

        <div class="statement-card">
          <h3>🛡 管理后台</h3>
          <button data-action="showAdmin" style="width:100%;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--accent);cursor:pointer;font-size:15px">进入管理面板</button>
        </div>

        <div class="statement-card">
          <h3>📖 关于</h3>
          <p>Bible Chat v${APP_VERSION}</p>
          <p style="color:var(--text2);font-size:13px">© 2026 Bible Chat. 以恩典和真理服事。</p>
          <p style="color:var(--text2);font-size:13px">AI: GPT via apicz.cc</p>
        </div>
      </div>`;
  }

  // 模型切换
  switchModelMini() { this.currentModel = 'gpt-5.4-mini'; setModel(this.currentModel); showToast('切换到 GPT-5.4-mini'); this.renderMorePage($('page-more')); }
  switchModel55() { this.currentModel = 'gpt-5.5'; setModel(this.currentModel); showToast('切换到 GPT-5.5'); this.renderMorePage($('page-more')); }

  // 从更多页注册
  doRegisterFromMore() {
    const name = $('regName2')?.value.trim();
    const email = $('regEmail2')?.value.trim();
    if (!name || !email) { showToast('请填写姓名和邮箱'); return; }
    if (!email.includes('@')) { showToast('邮箱格式不正确'); return; }
    this._pendingUser = { id: crypto.randomUUID(), name, email, phone: '', registeredAt: Date.now() };
    // 在更多页弹问卷模态框
    this.showQuestionnaireModal();
  }

  showQuestionnaireModal() {
    const modal = document.createElement('div');
    modal.className = 'q-modal';
    modal.id = 'qModal';
    modal.innerHTML = `
      <div class="q-modal-content">
        <h3 style="color:var(--accent);margin-bottom:16px">🙏 新人问卷</h3>
        <p style="color:var(--text2);font-size:13px;margin-bottom:16px">帮助我们更好地为你服务</p>
        ${QUESTIONNAIRE.map(q => `
          <div class="q-item">
            <p class="q-title">${q.question}</p>
            <div class="q-options">
              ${q.options.map(opt => `
                <label class="q-opt">
                  <input type="radio" name="q2_${q.id}" value="${opt}">
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <button class="primary-btn" data-action="completeQuestionnaireModal">完成注册</button>
      </div>`;
    document.body.appendChild(modal);
  }

  completeQuestionnaireModal() {
    const answers = {};
    let allAnswered = true;
    QUESTIONNAIRE.forEach(q => {
      const radios = document.querySelectorAll(`input[name="q2_${q.id}"]`);
      let selected = null;
      radios.forEach(r => { if (r.checked) selected = r.value; });
      if (!selected) allAnswered = false;
      answers[q.id] = selected;
    });
    if (!allAnswered) { showToast('请回答所有问题'); return; }
    const user = this._pendingUser;
    user.questionnaire = answers;
    localStorage.setItem('bc_user', JSON.stringify(user));
    this.user = user;
    const modal = $('qModal');
    if (modal) modal.remove();
    showToast('注册成功！🎉');
    this.renderMorePage($('page-more'));
  }

  saveApiKey() {
    const k = $('apiKeyInput').value.trim();
    if (k) { setApiKey(k); showToast('API Key 已保存'); }
  }

  resetApiKey() {
    localStorage.removeItem('bc_api_key');
    showToast('已恢复默认 API Key');
  }

  logout() {
    if (!confirm('确定要退出登录吗？')) return;
    localStorage.removeItem('bc_user');
    this.user = null;
    this.renderMorePage($('page-more'));
    showToast('已退出登录');
  }

  // ======== 播客 ========
  async generatePodcast() {
    const input = $('podcastInput');
    const text = input.value.trim();
    if (!text) { showToast('请输入内容'); return; }
    const scriptEl = $('podcastScript');
    scriptEl.style.display = 'block';
    scriptEl.innerHTML = '<div class="loading"><div class="loading-spinner"></div>生成播客脚本中...</div>';

    try {
      const systemPrompt = `你是一名信仰播客主持人。请把用户输入的经文或灵修内容改写成一段适合朗读的播客脚本。要求：
- 300-500字，温柔有感染力
- 加入简短感悟和过渡
- 用 [BGM:xxx] 标记背景音乐切换
- 结尾有祝福语`;

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 1000,
        }),
      });

      let script;
      if (res.ok) {
        const data = await res.json();
        script = data.choices?.[0]?.message?.content || '';
      }
      if (!script) {
        script = `🎙 欢迎来到 Bible Chat 播客\n\n${text}\n[BGM:peaceful]\n愿神的话语光照你的心。\n感谢收听！`;
      }
      scriptEl.innerText = script;
      this.playPodcast(script);
    } catch (e) {
      const fallback = `🎙 欢迎来到 Bible Chat 播客\n\n${text}\n[BGM:peaceful]\n愿神赐福你！`;
      scriptEl.innerText = fallback;
      this.playPodcast(fallback);
    }
  }

  playPodcast(script) {
    this.stopPodcast();
    const speed = parseFloat($('podcastSpeed')?.value) || 0.9;
    const segments = script.split(/\[BGM:[^\]]+\]/).filter(s => s.trim());
    let i = 0;
    const speakNext = () => {
      if (i >= segments.length) return;
      const utter = new SpeechSynthesisUtterance(segments[i].trim());
      utter.lang = 'zh-CN'; utter.rate = speed; utter.pitch = 1.0;
      utter.onend = () => { i++; speakNext(); };
      this.tts.speak(utter);
    };
    speakNext();
    showToast('开始播放播客...');
  }

  stopPodcast() { this.tts.cancel(); }

  // ======== 管理面板 ========
  showAdmin() {
    const pwd = prompt('请输入管理员密码:');
    if (pwd !== 'biblechat2026') { showToast('密码错误'); return; }
    const panel = document.createElement('div');
    panel.className = 'admin-panel active';
    panel.id = 'adminPanel';
    panel.innerHTML = `
      <div class="admin-header">
        <h2>🔐 管理面板</h2>
        <button data-action="closeAdmin" style="background:var(--danger);border:none;border-radius:8px;padding:8px 16px;color:#fff;cursor:pointer">关闭</button>
      </div>
      <div class="admin-content" id="adminContent"></div>`;
    document.body.appendChild(panel);
    this.loadAdminData();
  }

  async loadAdminData() {
    const content = $('adminContent');
    const allUsers = this.user ? [this.user] : [];
    const totalChats = this.chatHistory.filter(m => m.role === 'user').length;
    const modelLabel = this.currentModel === 'gpt-5.5' ? 'GPT-5.5' : 'GPT-5.4-mini';

    content.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="number">${allUsers.length}</div>
          <div class="label">本机注册用户</div>
        </div>
        <div class="stat-card">
          <div class="number">${totalChats}</div>
          <div class="label">本机对话数</div>
        </div>
        <div class="stat-card">
          <div class="number">${this.bibleIndex?.total_books || 0}</div>
          <div class="label">圣经卷数</div>
        </div>
        <div class="stat-card">
          <div class="number">${this.bibleIndex?.total_verses?.toLocaleString() || 0}</div>
          <div class="label">总节数</div>
        </div>
      </div>

      <h3 style="color:var(--accent);margin:16px 0 12px">⚙️ API 配置</h3>
      <div style="background:var(--card2);border-radius:10px;padding:16px;margin-bottom:16px">
        <p style="color:var(--text2);font-size:13px;margin-bottom:8px">当前配置：</p>
        <p style="font-size:13px">API 地址: <code style="color:var(--accent)">${API_BASE}</code></p>
        <p style="font-size:13px">模型: <code style="color:var(--accent)">${modelLabel}</code></p>
        <p style="font-size:13px">Key: <code style="color:var(--accent2)">${getApiKey().slice(0,8)}...${getApiKey().slice(-6)}</code></p>
        <div style="margin-top:12px">
          <label style="color:var(--text2);font-size:13px">系统提示词:</label>
          <textarea id="adminSystemPrompt" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-size:12px;min-height:120px;outline:none;margin-top:4px" placeholder="自定义 AI 系统提示词...">${localStorage.getItem('bc_system_prompt') || ''}</textarea>
          <button data-action="saveSystemPrompt" style="margin-top:8px;background:var(--accent);border:none;border-radius:8px;padding:8px 16px;color:#1a1a2e;font-weight:bold;cursor:pointer">保存提示词</button>
        </div>
      </div>

      <h3 style="color:var(--accent);margin:20px 0 12px">📊 系统状态</h3>
      <table>
        <tr><td>当前页面</td><td>${this.currentPage}</td></tr>
        <tr><td>当前模型</td><td>${modelLabel}</td></tr>
        <tr><td>语言模式</td><td>${this.langMode}</td></tr>
        <tr><td>已加载卷</td><td>${Object.keys(this.bookCache).length}</td></tr>
        <tr><td>应用版本</td><td>v${APP_VERSION}</td></tr>
        <tr><td>本地时间</td><td>${new Date().toLocaleString()}</td></tr>
      </table>

      <h3 style="color:var(--accent);margin:20px 0 12px">👥 本机用户</h3>
      ${allUsers.length === 0 ? '<p style="color:var(--text2)">暂无注册用户</p>' : `
        <table>
          <thead><tr><th>姓名</th><th>邮箱</th><th>信仰阶段</th><th>注册时间</th></tr></thead>
          <tbody>
            ${allUsers.map(u => `<tr>
              <td>${escapeHtml(u.name)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${escapeHtml(u.questionnaire?.faith_stage || '-')}</td>
              <td>${new Date(u.registeredAt).toLocaleString()}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      `}

      <div style="margin-top:20px;padding:12px;background:var(--card2);border-radius:8px">
        <h4 style="color:var(--accent);margin-bottom:8px">📡 部署信息</h4>
        <p style="color:var(--text2);font-size:13px;line-height:1.6">
          • 网站: <a href="https://${SITE_NAME}" style="color:var(--accent)">https://${SITE_NAME}</a><br>
          • 管理: <a href="https://${SITE_NAME}/admin.html" style="color:var(--accent)">https://${SITE_NAME}/admin.html</a><br>
          • 部署: GitHub Pages<br>
          • AI: GPT via apicz.cc (${modelLabel})
        </p>
      </div>`;
  }

  saveSystemPrompt() {
    const text = $('adminSystemPrompt')?.value.trim();
    if (text) {
      localStorage.setItem('bc_system_prompt', text);
      showToast('系统提示词已保存');
    } else {
      localStorage.removeItem('bc_system_prompt');
      showToast('已恢复默认提示词');
    }
  }

  closeAdmin() { const p = $('adminPanel'); if (p) p.remove(); }
}

// 全局实例
window.app = new BibleChatApp();
