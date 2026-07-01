// Bible Chat v3.0 - Full rewrite
const API_BASE = 'https://biblechat-api.xbtds02.workers.dev'; // 待部署后替换
const MODELS = {
  doubao: { id: 'doubao', name: '豆包', desc: '字节跳动' },
  qwen: { id: 'qwen', name: '千问', desc: '阿里巴巴' },
  gpt4o: { id: 'gpt4o', name: 'GPT-4o', desc: 'OpenAI' },
  gpt4: { id: 'gpt4', name: 'GPT-4', desc: 'OpenAI' },
  claude: { id: 'claude', name: 'Claude', desc: 'Anthropic' },
  gemini: { id: 'gemini', name: 'Gemini', desc: 'Google' },
};

class BibleChatApp {
  constructor() {
    this.currentPage = 'chat';
    this.currentModel = localStorage.getItem('bc_model') || 'doubao';
    this.langMode = localStorage.getItem('bc_lang') || 'both'; // both, zh, en
    this.bibleData = null;
    this.prayersData = null;
    this.user = JSON.parse(localStorage.getItem('bc_user') || 'null');
    this.chatHistory = JSON.parse(localStorage.getItem('bc_chat') || '[]');
    this.bibleStack = []; // 导航栈: [{type:'home'|'testament'|'book', data:...}]
    this.ttsSpeaking = false;
    this.podcastAudio = null;
    this.init();
  }

  async init() {
    this.setupNavigation();
    this.showPage('chat');
    this.loadBibleData();
    this.loadPrayersData();
    if (this.user) this.renderUserInfo();
  }

  setupNavigation() {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      btn.addEventListener('click', () => this.showPage(btn.dataset.page));
    });
  }

  showPage(page) {
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    const app = document.getElementById('app');
    // Remove old pages
    app.querySelectorAll('.page').forEach(p => p.remove());
    this.currentPage = page;

    const pageEl = document.createElement('div');
    pageEl.className = 'page active';
    pageEl.id = `page-${page}`;
    app.insertBefore(pageEl, document.getElementById('bottomNav'));

    switch(page) {
      case 'chat': this.renderChatPage(pageEl); break;
      case 'bible': this.renderBiblePage(pageEl); break;
      case 'daily': this.renderDailyPage(pageEl); break;
      case 'prayer': this.renderPrayerPage(pageEl); break;
      case 'more': this.renderMorePage(pageEl); break;
    }
  }

  // ======== AI 聊天 ========
  renderChatPage(el) {
    const welcome = this.chatHistory.length === 0;
    el.innerHTML = `
      <div class="chat-container">
        ${welcome ? `<div class="welcome" id="chatWelcome"><h1>&#x271D; Bible Chat</h1><p>你好！我是你的智慧信仰助手。<br>你可以问我任何关于圣经、信仰、生命的问题，我会基于圣经给你 thoughtful 的回答。</p><button class="start-btn" onclick="app.hideWelcome()">开始对话</button></div>` : ''}
        <div class="chat-messages" id="chatMessages" style="${welcome ? 'display:none' : ''}"></div>
        <div class="model-selector" id="modelSelector">
          ${Object.entries(MODELS).map(([k,v]) => `<button class="${k===this.currentModel?'active':''}" data-model="${k}">${v.name}</button>`).join('')}
        </div>
        <div class="chat-input-area">
          <textarea id="chatInput" placeholder="输入你的问题..." rows="1"></textarea>
          <button id="sendBtn" onclick="app.sendChat()">发送</button>
        </div>
      </div>`;

    if (!welcome) this.renderChatMessages();

    document.querySelectorAll('#modelSelector button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentModel = btn.dataset.model;
        localStorage.setItem('bc_model', this.currentModel);
        document.querySelectorAll('#modelSelector button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const input = el.querySelector('#chatInput');
    input.addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey){e.preventDefault();this.sendChat();} });
    input.addEventListener('input', () => { input.style.height='auto'; input.style.height=input.scrollHeight+'px'; });
  }

  hideWelcome() {
    document.getElementById('chatWelcome').style.display='none';
    document.getElementById('chatMessages').style.display='flex';
  }

  renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if(!container) return;
    container.innerHTML = this.chatHistory.map((m,i) => `
      <div class="message ${m.role}">
        ${m.role==='ai' && m.model ? `<div class="model-tag">${MODELS[m.model]?.name || m.model}</div>` : ''}
        ${this.escapeHtml(m.content)}
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  async sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    this.chatHistory.push({ role: 'user', content: text });
    this.renderChatMessages();
    this.saveChat();

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    // 先显示 loading
    const container = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>正在思考...</div>';
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;

    try {
      // 尝试联网API
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.chatHistory.slice(-10), model: this.currentModel }),
      }).catch(() => null);

      let reply = '';
      if (res && res.ok) {
        const data = await res.json();
        reply = data.reply || '';
      } else {
        // 降级到本地 AI 回复（仅作为备用，用户要求联网）
        reply = this.fallbackAIReply(text);
      }

      loadingDiv.remove();
      this.chatHistory.push({ role: 'ai', content: reply, model: this.currentModel });
      this.renderChatMessages();
      this.saveChat();
      // 记录统计
      fetch(`${API_BASE}/api/stats/chat`, { method: 'POST' }).catch(()=>{});
    } catch(e) {
      loadingDiv.remove();
      const reply = this.fallbackAIReply(text);
      this.chatHistory.push({ role: 'ai', content: reply, model: this.currentModel });
      this.renderChatMessages();
      this.saveChat();
    }
    sendBtn.disabled = false;
  }

  fallbackAIReply(text) {
    const lower = text.toLowerCase();
    if (lower.includes('神') || lower.includes('god')) return '神是自有永有的，是创造天地的主。祂爱世人，甚至将祂的独生子赐给我们，叫一切信祂的不至灭亡，反得永生。你想更深入了解哪方面？';
    if (lower.includes('耶稣') || lower.includes('jesus')) return '耶稣是基督，是永生神的儿子。祂为我们钉死在十字架上，第三天复活，使我们因信祂称义。祂是道路、真理、生命。';
    if (lower.includes('祷告') || lower.includes('pray')) return '祷告是与神对话。你可以随时向神倾诉，祂必垂听。圣经说："你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。"（马太福音7:7）';
    if (lower.includes('罪') || lower.includes('sin')) return '世人都犯了罪，亏缺了神的荣耀。但感谢神，祂在基督里赐给我们救赎。认罪悔改，信靠耶稣，罪就得赦免。';
    if (lower.includes('爱') || lower.includes('love')) return '神就是爱。祂的爱是无条件的、永恒的。罗马书5:8说："唯有基督在我们还作罪人的时候为我们死，神的爱就在此向我们显明了。"';
    if (lower.includes('平安') || lower.includes('peace')) return '耶稣说："我留下平安给你们，我将我的平安赐给你们。"（约翰福音14:27）真正的平安来自与神和好。';
    return '这是一个很好的问题。请稍等，我正在努力为你寻找答案...目前AI服务可能暂时不可用，请检查网络连接。你也可以尝试切换其他AI模型。';
  }

  saveChat() { localStorage.setItem('bc_chat', JSON.stringify(this.chatHistory.slice(-50))); }

  // ======== 圣经阅读器 ========
  async loadBibleData() {
    if (this.bibleData) return;
    try {
      const res = await fetch('data/bible-full.json');
      this.bibleData = await res.json();
    } catch(e) {
      this.bibleData = { OT: [], NT: [] };
    }
  }

  renderBiblePage(el) {
    if (!this.bibleStack.length) this.bibleStack.push({ type: 'home' });
    const top = this.bibleStack[this.bibleStack.length - 1];

    if (top.type === 'home') {
      el.innerHTML = `
        <div class="page-header"><h2>&#x1F4D6; 圣经</h2><span style="color:var(--text2);font-size:13px">${this.bibleData?this.bibleData.OT.length+this.bibleData.NT.length+'卷':''}</span></div>
        <div class="bible-nav"><button class="active" onclick="app.showBibleTestament('OT')">旧约</button><button onclick="app.showBibleTestament('NT')">新约</button></div>
        <div class="page-content" id="bibleContent"></div>`;
      this.showBibleTestament('OT');
    } else if (top.type === 'testament') {
      this.renderBookList(top.data);
    } else if (top.type === 'book') {
      this.renderChapterList(top.data);
    } else if (top.type === 'chapter') {
      this.renderChapterContent(top.data);
    }
  }

  showBibleTestament(testament) {
    const content = document.getElementById('bibleContent');
    if (!content || !this.bibleData) return;
    const books = this.bibleData[testament] || [];
    content.innerHTML = `
      <div class="book-list">
        ${books.map((b, i) => `
          <div class="book-btn" onclick="app.selectBook('${testament}',${i})">
            <div>${b.zh}</div>
            <div class="abbr">${b.abbr}</div>
          </div>
        `).join('')}
      </div>`;
    // Update nav
    document.querySelectorAll('.bible-nav button').forEach(btn => {
      btn.classList.toggle('active', (btn.textContent.includes('旧') && testament==='OT') || (btn.textContent.includes('新') && testament==='NT'));
    });
  }

  selectBook(testament, bookIndex) {
    if (!this.bibleData) return;
    const book = this.bibleData[testament][bookIndex];
    this.bibleStack.push({ type: 'book', data: { testament, bookIndex, book } });
    this.renderBiblePage(document.getElementById('page-bible'));
  }

  renderBookList(data) {
    const el = document.getElementById('page-bible');
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" onclick="app.bibleBack()">&#x2190; 返回</button>
        <h2>${data.book.zh}</h2>
        <span></span>
      </div>
      <div class="page-content"><div class="chapter-grid">
        ${data.book.chapters.map((c,i) => `<div class="chapter-btn" onclick="app.selectChapter(${i})">${c.chapter}</div>`).join('')}
      </div></div>`;
  }

  selectChapter(chapterIndex) {
    const top = this.bibleStack[this.bibleStack.length-1];
    if (!top || top.type !== 'book') return;
    const chapter = top.data.book.chapters[chapterIndex];
    this.bibleStack.push({ type: 'chapter', data: { ...top.data, chapterIndex, chapter } });
    this.renderBiblePage(document.getElementById('page-bible'));
  }

  renderChapterContent(data) {
    const el = document.getElementById('page-bible');
    const book = data.book;
    const chapter = data.chapter;
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" onclick="app.bibleBack()">&#x2190; 返回</button>
        <h2>${book.zh} ${chapter.chapter}章</h2>
        <span></span>
      </div>
      <div class="page-content">
        <div class="verse-content">
          <div class="lang-toggle">
            <button class="${this.langMode==='zh'?'active':''}" onclick="app.setLang('zh')">中文</button>
            <button class="${this.langMode==='both'?'active':''}" onclick="app.setLang('both')">对照</button>
            <button class="${this.langMode==='en'?'active':''}" onclick="app.setLang('en')">English</button>
          </div>
          ${chapter.verses.map(v => `
            <div class="verse-line">
              <span class="ref">${v.ref}</span>
              ${this.langMode!=='en' ? `<div class="zh">${v.zh}</div>` : ''}
              ${this.langMode!=='zh' ? `<div class="en">${v.en}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="verse-actions">
          <button onclick="app.speakChapter()">&#x1F50A; 朗读</button>
          <button onclick="app.prevChapter()">&#x2190; 上一章</button>
          <button onclick="app.nextChapter()">&#x2192; 下一章</button>
        </div>
      </div>`;
  }

  setLang(mode) {
    this.langMode = mode;
    localStorage.setItem('bc_lang', mode);
    const top = this.bibleStack[this.bibleStack.length-1];
    if (top && top.type === 'chapter') this.renderChapterContent(top.data);
  }

  bibleBack() {
    this.bibleStack.pop();
    const el = document.getElementById('page-bible');
    if (el) this.renderBiblePage(el);
  }

  prevChapter() {
    const top = this.bibleStack[this.bibleStack.length-1];
    if (!top || top.type !== 'chapter') return;
    if (top.data.chapterIndex > 0) {
      this.bibleStack.pop();
      this.selectChapter(top.data.chapterIndex - 1);
    }
  }
  nextChapter() {
    const top = this.bibleStack[this.bibleStack.length-1];
    if (!top || top.type !== 'chapter') return;
    if (top.data.chapterIndex < top.data.book.chapters.length - 1) {
      this.bibleStack.pop();
      this.selectChapter(top.data.chapterIndex + 1);
    }
  }

  speakChapter() {
    const top = this.bibleStack[this.bibleStack.length-1];
    if (!top || top.type !== 'chapter') return;
    const text = top.data.chapter.verses.map(v => this.langMode==='en' ? v.en : v.zh).join('。');
    this.speakText(text);
  }

  speakText(text) {
    if (!window.speechSynthesis) { this.showToast('您的浏览器不支持语音朗读'); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.langMode === 'en' ? 'en-US' : 'zh-CN';
    utter.rate = 0.9;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.includes(this.langMode==='en'?'en':'zh'));
    if (pref) utter.voice = pref;
    window.speechSynthesis.speak(utter);
    this.ttsSpeaking = true;
    utter.onend = () => { this.ttsSpeaking = false; };
  }

  // ======== 每日金句 ========
  renderDailyPage(el) {
    const verses = [
      { ref: '约翰福音 3:16', zh: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。', en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
      { ref: '诗篇 23:1', zh: '耶和华是我的牧者，我必不至缺乏。', en: 'The Lord is my shepherd, I lack nothing.' },
      { ref: '箴言 3:5-6', zh: '你要专心仰赖耶和华，不可倚靠自己的聪明，在你一切所行的事上都要认定他，他必指引你的路。', en: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
      { ref: '耶利米书 29:11', zh: '耶和华说：我知道我向你们所怀的意念是赐平安的意念，不是降灾祸的意念，要叫你们末后有指望。', en: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
      { ref: '腓立比书 4:13', zh: '我靠着那加给我力量的，凡事都能做。', en: 'I can do all this through him who gives me strength.' },
      { ref: '罗马书 8:28', zh: '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。', en: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
      { ref: '马太福音 11:28', zh: '凡劳苦担重担的人可以到我这里来，我就使你们得安息。', en: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
      { ref: '以赛亚书 40:31', zh: '但那等候耶和华的必从新得力。他们必如鹰展翅上腾；他们奔跑却不困倦，行走却不疲乏。', en: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
      { ref: '哥林多前书 13:13', zh: '如今常存的有信，有望，有爱这三样，其中最大的是爱。', en: 'And now these three remain: faith, hope and love. But the greatest of these is love.' },
      { ref: '希伯来书 11:1', zh: '信是所望之事的实底，是未见之事的确据。', en: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
    ];
    const dayIndex = Math.floor(Date.now()/86400000) % verses.length;
    const v = verses[dayIndex];
    const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' });

    el.innerHTML = `
      <div class="page-header"><h2>&#x2728; 每日金句</h2><span style="color:var(--text2);font-size:13px">${today}</span></div>
      <div class="page-content">
        <div class="daily-card">
          <div class="date">${today}</div>
          <div class="ref">${v.ref}</div>
          <div class="verse-zh">${v.zh}</div>
          <div class="verse-en">${v.en}</div>
        </div>
        <div class="share-card">
          <h3 style="color:var(--accent);margin-bottom:10px;font-size:16px">&#x1F4E4; 分享到朋友圈</h3>
          <textarea id="shareThought" placeholder="写下你的感悟...（可选）"></textarea>
          <div class="preview" id="sharePreview">
            <h4>&#x2728; 每日金句</h4>
            <p style="font-size:18px;color:var(--text);margin:12px 0">${v.zh}</p>
            <p style="font-size:14px;color:var(--text2)">&#x2014; ${v.ref}</p>
            <p class="link">来自 Bible Chat (biblechat.cc)</p>
          </div>
          <div class="share-actions">
            <button onclick="app.generateShareImage()">&#x1F4F8; 生成图片</button>
            <button class="secondary" onclick="app.shareText()">&#x1F4E4; 分享文字</button>
          </div>
        </div>
      </div>`;
    this.currentVerse = v;
  }

  generateShareImage() {
    const v = this.currentVerse;
    const thought = document.getElementById('shareThought').value.trim();
    const canvas = document.createElement('canvas');
    canvas.width = 750; canvas.height = 1334;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0,0,0,1334);
    grad.addColorStop(0,'#1a1a3e'); grad.addColorStop(0.5,'#2a2a5e'); grad.addColorStop(1,'#1a1a3e');
    ctx.fillStyle = grad; ctx.fillRect(0,0,750,1334);

    // Decorative elements
    ctx.fillStyle = 'rgba(255,215,0,0.1)';
    ctx.beginPath(); ctx.arc(375,200,150,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(100,1200,80,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(650,1100,60,0,Math.PI*2); ctx.fill();

    // Title
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('&#x2728; 每日金句', 375, 120);
    ctx.fillStyle = '#a0a0b0'; ctx.font = '22px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('zh-CN'), 375, 160);

    // Cross decoration
    ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(375,200); ctx.lineTo(375,280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(340,230); ctx.lineTo(410,230); ctx.stroke();

    // Verse text
    ctx.fillStyle = '#e8e8e8'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
    this.wrapText(ctx, v.zh, 375, 350, 650, 42);
    ctx.fillStyle = '#a0a0b0'; ctx.font = '22px sans-serif'; ctx.fontStyle = 'italic';
    this.wrapText(ctx, v.en, 375, 580, 650, 36);
    ctx.fontStyle = 'normal';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`&#x2014; ${v.ref}`, 375, 740);

    // Thought
    if (thought) {
      ctx.fillStyle = '#c9a227'; ctx.font = 'italic 22px sans-serif';
      ctx.fillText('&#x201C;' + thought + '&#x201D;', 375, 820);
    }

    // Footer
    ctx.fillStyle = '#666'; ctx.font = '18px sans-serif';
    ctx.fillText('来自 Bible Chat &#x2014; biblechat.cc', 375, 1260);
    ctx.fillStyle = '#ffd700'; ctx.font = '14px sans-serif';
    ctx.fillText('&#x271D; 愿神赐福你的一天', 375, 1290);

    // Save
    const link = document.createElement('a');
    link.download = `biblechat-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('图片已生成');
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(''); let line = ''; let testLine = '';
    for (let n = 0; n < words.length; n++) {
      testLine += words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y); line = words[n]; testLine = words[n]; y += lineHeight;
      } else { line = testLine; }
    }
    ctx.fillText(line, x, y);
  }

  shareText() {
    const v = this.currentVerse;
    const thought = document.getElementById('shareThought').value.trim();
    let text = `&#x2728; 每日金句\n\n${v.zh}\n&#x2014; ${v.ref}\n`;
    if (thought) text += `\n&#x201C;${thought}&#x201D;\n`;
    text += `\n来自 Bible Chat (biblechat.cc)`;
    if (navigator.share) {
      navigator.share({ title: '每日金句', text: text });
    } else {
      navigator.clipboard.writeText(text).then(() => this.showToast('已复制到剪贴板'));
    }
  }

  // ======== 祷告 ========
  async loadPrayersData() {
    if (this.prayersData) return;
    try {
      const res = await fetch('data/prayers.json');
      this.prayersData = await res.json();
    } catch(e) {
      this.prayersData = { categories: [], prayers: [] };
    }
  }

  renderPrayerPage(el) {
    if (!this.prayersData) { el.innerHTML = '<div class="loading"><div class="loading-spinner"></div>加载中...</div>'; return; }
    const cats = this.prayersData.categories || [];
    el.innerHTML = `
      <div class="page-header"><h2>&#x1F64F; 祷告</h2></div>
      <div class="page-content">
        <div class="prayer-list">
          ${cats.map(c => `
            <div class="prayer-item" onclick="app.showPrayerCategory('${c.id}')">
              <h4>${c.name}</h4>
              <p>${c.desc}</p>
            </div>
          `).join('')}
        </div>
        <div id="prayerDetail"></div>
      </div>`;
  }

  showPrayerCategory(catId) {
    const prayers = (this.prayersData.prayers || []).filter(p => p.cat === catId);
    const container = document.getElementById('prayerDetail');
    if (!container) return;
    container.innerHTML = prayers.map((p, i) => `
      <div class="prayer-item" onclick="app.showPrayerDetail('${catId}',${i})">
        <h4>${p.title}</h4>
        <p>${p.ref}</p>
      </div>
    `).join('');
  }

  showPrayerDetail(catId, idx) {
    const prayers = (this.prayersData.prayers || []).filter(p => p.cat === catId);
    const p = prayers[idx];
    if (!p) return;
    const container = document.getElementById('prayerDetail');
    container.innerHTML = `
      <div class="prayer-detail">
        <div class="prayer-title">${p.title}</div>
        <div>${p.content}</div>
        <div style="text-align:center;margin-top:16px;color:var(--accent2);font-size:14px">&#x2014; ${p.ref}</div>
        <div class="verse-actions" style="margin-top:16px">
          <button onclick="app.speakText('${p.content.replace(/'/g,"\'")}')">&#x1F50A; 朗读</button>
          <button onclick="app.renderPrayerPage(document.getElementById('page-prayer'))">&#x2190; 返回</button>
        </div>
      </div>`;
  }

  // ======== 更多 ========
  renderMorePage(el) {
    el.innerHTML = `
      <div class="page-header"><h2>&#x2699;&#xFE0F; 更多</h2></div>
      <div class="page-content">
        <div class="user-form">
          ${this.user ? `<div class="user-info">
            <p><strong style="color:var(--accent)">${this.user.name}</strong></p>
            <p>${this.user.email}</p>
            <button onclick="app.logout()">退出登录</button>
          </div>` : `
            <input type="text" id="regName" placeholder="你的姓名">
            <input type="email" id="regEmail" placeholder="邮箱">
            <input type="tel" id="regPhone" placeholder="手机号（可选）">
            <button onclick="app.register()">注册 / 登录</button>
          `}
        </div>
        <div class="statement-card">
          <h3>&#x1F64F; 信仰告白</h3>
          <p>我相信独一的真神，圣父、圣子、圣灵三位一体。我相信耶稣基督是神的独生子，为拯救世人的罪钉死在十字架上，第三天复活，将来必再来。我相信圣经是神所默示的，是信仰与生活的最高准则。</p>
          <p style="color:var(--text2);font-size:13px;margin-top:8px">&#x2014; 本网站持守正统基督教信仰立场</p>
        </div>
        <div class="statement-card">
          <h3>&#x1F4B8; 支持我们</h3>
          <p>Bible Chat 是一款免费事工工具，旨在帮助更多人认识神的话语。如果你觉得这个工具有帮助，欢迎通过以下方式支持我们：</p>
          <p style="color:var(--accent);margin-top:8px">&#x1F4B3; 支付宝: xbtds02@example.com</p>
          <p style="color:var(--accent)">&#x1F4B3; 微信支付: BibleChat</p>
          <p style="color:var(--text2);font-size:13px;margin-top:8px">每一笔支持都将用于服务器维护和平台开发，让更多人能够免费使用。</p>
        </div>
        <div class="statement-card">
          <h3>&#x1F399; AI 播客</h3>
          <div class="podcast-area">
            <textarea id="podcastInput" placeholder="输入一段经文或灵修内容，生成播客式朗读..."></textarea>
            <div class="podcast-controls">
              <button onclick="app.generatePodcast()">&#x1F3A4; 生成播客</button>
              <div class="speed"><span>&#x1F509; 语速:</span><input type="range" id="podcastSpeed" min="0.5" max="1.5" step="0.1" value="0.9"></div>
              <button class="secondary" onclick="app.stopPodcast()">&#x23F9; 停止</button>
            </div>
            <div class="podcast-script" id="podcastScript" style="display:none"></div>
          </div>
        </div>
        <div class="statement-card">
          <h3>&#x1F6E1; 管理后台</h3>
          <button onclick="app.showAdmin()" style="width:100%;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--accent);cursor:pointer;font-size:15px">进入管理面板</button>
        </div>
        <div class="statement-card">
          <h3>&#x1F4DA; 关于</h3>
          <p>Bible Chat v3.0</p>
          <p style="color:var(--text2);font-size:13px">&#xA9; 2026 Bible Chat. 以恩典和真理服事。</p>
          <p style="color:var(--text2);font-size:13px">域名: biblechat.cc</p>
        </div>
      </div>`;
  }

  async register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    if (!name || !email) { this.showToast('请填写姓名和邮箱'); return; }
    const user = { id: crypto.randomUUID(), name, email, phone, registeredAt: Date.now() };
    localStorage.setItem('bc_user', JSON.stringify(user));
    this.user = user;
    // 同步到后端
    try {
      await fetch(`${API_BASE}/api/user/register`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user)
      });
    } catch(e) {}
    this.showToast('注册成功');
    this.renderMorePage(document.getElementById('page-more'));
  }

  logout() {
    localStorage.removeItem('bc_user');
    this.user = null;
    this.renderMorePage(document.getElementById('page-more'));
  }

  renderUserInfo() { /* updated by renderMorePage */ }

  // ======== 播客 ========
  async generatePodcast() {
    const input = document.getElementById('podcastInput');
    const text = input.value.trim();
    if (!text) { this.showToast('请输入内容'); return; }
    const scriptEl = document.getElementById('podcastScript');
    scriptEl.style.display = 'block';
    scriptEl.innerHTML = '<div class="loading"><div class="loading-spinner"></div>生成播客脚本中...</div>';

    try {
      const res = await fetch(`${API_BASE}/api/podcast`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text, model: this.currentModel })
      }).catch(() => null);
      let script = '';
      if (res && res.ok) {
        const data = await res.json();
        script = data.script || '';
      }
      if (!script) {
        // 本地生成播客脚本
        script = `&#x1F3A7; 欢迎来到 Bible Chat 播客\n\n今天我们要分享的内容是：\n\n${text}\n\n[BGM:peaceful]\n\n这段经文提醒我们，神的话语是我们脚前的灯，路上的光。\n\n[BGM:peaceful]\n\n愿你在今天的生活中经历神的同在。\n\n感谢收听，我们下期再见。愿神赐福你！`;
      }
      scriptEl.innerText = script;
      this.playPodcast(script);
    } catch(e) {
      scriptEl.innerText = '生成失败，请稍后重试';
    }
  }

  playPodcast(script) {
    this.stopPodcast();
    const speed = parseFloat(document.getElementById('podcastSpeed').value);
    // 分段朗读，去掉 [BGM:xxx] 标记
    const segments = script.split(/\[BGM:[^\]]+\]/).filter(s => s.trim());
    let i = 0;
    const speakNext = () => {
      if (i >= segments.length) return;
      const utter = new SpeechSynthesisUtterance(segments[i].trim());
      utter.lang = 'zh-CN'; utter.rate = speed; utter.pitch = 1.0;
      utter.onend = () => { i++; speakNext(); };
      window.speechSynthesis.speak(utter);
    };
    speakNext();
  }

  stopPodcast() { window.speechSynthesis.cancel(); }

  // ======== 管理面板 ========
  showAdmin() {
    const pwd = prompt('请输入管理员密码:');
    if (pwd !== 'biblechat2026') { this.showToast('密码错误'); return; }
    const panel = document.createElement('div');
    panel.className = 'admin-panel active'; panel.id = 'adminPanel';
    panel.innerHTML = `
      <div class="admin-header">
        <h2>&#x1F510; 管理面板</h2>
        <button onclick="app.closeAdmin()">关闭</button>
      </div>
      <div class="admin-content" id="adminContent">
        <div class="loading"><div class="loading-spinner"></div>加载数据...</div>
      </div>`;
    document.body.appendChild(panel);
    this.loadAdminData();
  }

  async loadAdminData() {
    const content = document.getElementById('adminContent');
    try {
      const res = await fetch(`${API_BASE}/api/admin`, { headers: { 'Authorization': 'Bearer biblechat2026' } }).catch(() => null);
      let data = { users: [], totalUsers: 0, totalChats: 0 };
      if (res && res.ok) data = await res.json();
      content.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card"><div class="number">${data.totalUsers}</div><div class="label">注册用户</div></div>
          <div class="stat-card"><div class="number">${data.totalChats}</div><div class="label">总对话数</div></div>
        </div>
        <h3 style="color:var(--accent);margin-bottom:12px">用户列表</h3>
        <table>
          <thead><tr><th>姓名</th><th>邮箱</th><th>手机</th><th>注册时间</th></tr></thead>
          <tbody>
            ${data.users.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone||'-'}</td><td>${new Date(u.registeredAt).toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="color:var(--text2);font-size:13px;margin-top:12px">Server: ${data.serverTime || 'N/A'}</p>`;
    } catch(e) {
      content.innerHTML = '<p style="color:var(--danger)">加载失败，请检查后端服务</p>';
    }
  }

  closeAdmin() { document.getElementById('adminPanel')?.remove(); }

  // ======== 工具 ========
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

const app = new BibleChatApp();
