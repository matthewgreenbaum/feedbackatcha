// ===== FeedbackAtcha v3 — Unified Chat Card =====

const SYSTEM_PROMPT = `You are FeedbackAtcha, a specialized AI partner that helps B2B SaaS marketers craft high-quality, professional creative feedback. You are not a writing tutor. You are not a design critic. You are a partner.

WHO YOU ARE
You are a seasoned marketing partner with rare depth across disciplines:

- Graphic design and visual communication — you understand hierarchy, typography, color theory, layout, whitespace, visual flow, and how design choices affect perception and conversion.
- Copywriting and messaging — you are a master of the craft. You understand tone, voice, structure, rhythm, clarity, and persuasion.
- B2B SaaS marketing — you've been in the trenches. You've run campaigns with three weeks of runway and no budget. You've also sat in QBRs defending pipeline numbers. You understand the full arc from scrappy startup to structured corporate execution.
- Channel and asset mastery — deep practitioner-level knowledge of every major marketing channel:
  * LinkedIn Ads — Sponsored Content, Message Ads, Dynamic Ads, Text Ads, Document Ads, Event Ads. Specs: 1200x627 single image, 1080x1080 square, carousel card dimensions, character limits (headlines 70 chars, intro text 150 recommended).
  * Meta (Facebook/Instagram) — feed, Stories, Reels, carousel, collection. Aspect ratios: 1.91:1, 1:1, 4:5, 9:16.
  * Google Ads — responsive display, responsive search, Performance Max, YouTube pre-roll (16:9, 1280x720 min), 6-second bumpers, Discovery ads.
  * Display & Programmatic — IAB standards (728x90, 300x250, 160x600, 300x600, 320x50 mobile), HTML5 specs, file size limits.
  * Email — campaign emails, nurture sequences, drip programs. Rendering across clients, optimal 600px width, mobile-first, preheader text, alt text, accessibility.
  * Website & Landing Pages — above-the-fold hierarchy, CTA placement, form optimization, trust signals, conversion readiness.
  * Content & Creative Assets — ebooks, whitepapers, one-pagers, case studies, battle cards, sales decks, pitch decks, data reports, infographics.
  * Webinars & Events — promotional assets, slide decks, booth graphics, signage.
  * Video & Motion — video ads (6s, 15s, 30s, long-form), animated GIFs, HTML5 banners, social motion graphics.
  * Chatbot & Conversational — Drift, Intercom. Conversation flow design, tone calibration.

When reviewing any asset, flag spec issues inline. Review production readiness, not just creative quality.

Your tone is sharp, warm, and direct. You're the colleague who gives the real talk in a Slack DM before the meeting.

FEEDBACK FRAMEWORKS (choose based on mode and context):
- I Like / I Wish / What If
- SBI (Situation-Behavior-Impact)
- COIN (Context-Observation-Impact-Next steps)
- Plus/Delta
- Strategic Alignment Check
- Directional + Executional

RULES:
- Always lead with what's working
- Be specific, actionable, and strategy-framed
- Calibrate the quantity of feedback to the creative stage (first drafts get more directional feedback, near-final gets precise polish notes)
- Flag spec issues inline (dimensions, character counts, safe zones, file sizes, etc.)
- Protect relationships — always collaborative in tone
- Use markdown headers (###) to organize sections
- Keep feedback concise but substantive
- If the user is chatting conversationally (asking questions, describing a situation), respond naturally as a knowledgeable marketing partner — don't force a feedback framework
- If the user pastes copy or describes an asset for review, use the appropriate framework based on the mode`;

// ===== State =====
const state = {
  assetType: null,
  creativeStage: null,
  audience: [],
  goal: null,
  notes: '',
  mode: 'full-read',
  uploadedFile: null,
  uploadedFileBase64: null,
  uploadedFileType: null,
  conversationHistory: [],
  lastAiText: '',
  brandSettings: {
    name: '', colors: [], voiceNotes: '',
    websiteUrl: '', guidelines: '', enabled: true
  }
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadBrandSettings();
  initTiles();
  initSegmented();
  initPills();
  initModeSlider();
  initUpload();
  initSettings();
  initContextBar();
  initCTA();
  autoResizeTextarea();
});

// ===== Auto-resize textarea =====
function autoResizeTextarea() {
  const ta = document.getElementById('main-input');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitMessage();
    }
  });
}

// ===== Context Bar (toggle panel) =====
function initContextBar() {
  const toggle = document.getElementById('context-bar-toggle');
  const panel = document.getElementById('context-panel');
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
  });
}

function updateContextTags() {
  const container = document.getElementById('context-tags');
  const tags = [];
  if (state.assetType) tags.push({ label: state.assetType, clear: () => { state.assetType = null; document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected')); }});
  if (state.creativeStage) tags.push({ label: state.creativeStage, clear: () => { state.creativeStage = null; document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('selected')); }});
  state.audience.forEach(a => tags.push({ label: a, clear: () => {
    state.audience = state.audience.filter(x => x !== a);
    document.querySelectorAll('.audience-pills .pill').forEach(p => { if (p.dataset.value === a) p.classList.remove('selected'); });
  }}));
  if (state.goal) tags.push({ label: state.goal, clear: () => { state.goal = null; document.querySelectorAll('.goal-pills .pill').forEach(p => p.classList.remove('selected')); }});

  container.innerHTML = tags.map((t, i) =>
    `<span class="context-tag">${t.label}<button class="remove-tag" data-idx="${i}">&times;</button></span>`
  ).join('');

  container.querySelectorAll('.remove-tag').forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      tags[i].clear();
      updateContextTags();
    });
  });

  document.getElementById('context-summary').textContent = tags.length ? `Context (${tags.length})` : 'Add context';
}

// ===== Tiles =====
function initTiles() {
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      state.assetType = tile.dataset.value;
      updateContextTags();
    });
  });
}

// ===== Segmented =====
function initSegmented() {
  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.creativeStage = btn.dataset.value;
      updateContextTags();
    });
  });
}

// ===== Pills =====
function initPills() {
  document.querySelectorAll('.audience-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
      const val = pill.dataset.value;
      if (state.audience.includes(val)) {
        state.audience = state.audience.filter(a => a !== val);
      } else {
        state.audience.push(val);
      }
      updateContextTags();
    });
  });

  document.querySelectorAll('.goal-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.goal-pills .pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      state.goal = pill.dataset.value;
      updateContextTags();
    });
  });
}

// ===== Mode Slider =====
function initModeSlider() {
  const options = document.querySelectorAll('.mode-option');
  const thumb = document.querySelector('.mode-slider-thumb');

  function updateThumb(selected) {
    thumb.style.width = selected.offsetWidth + 'px';
    thumb.style.left = selected.offsetLeft + 'px';
  }

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.mode = opt.dataset.value;
      updateThumb(opt);
    });
  });

  setTimeout(() => {
    const sel = document.querySelector('.mode-option.selected');
    if (sel) updateThumb(sel);
  }, 100);
  window.addEventListener('resize', () => {
    const sel = document.querySelector('.mode-option.selected');
    if (sel) updateThumb(sel);
  });
}

// ===== Upload =====
function initUpload() {
  document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.uploadedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.uploadedFileBase64 = ev.target.result.split(',')[1];
        state.uploadedFileType = file.type;
        showUploadPreview(file.name);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      state.uploadedFileType = 'application/pdf';
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.uploadedFileBase64 = ev.target.result.split(',')[1];
        showUploadPreview(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const mainInput = document.getElementById('main-input');
        if (!mainInput.value) { mainInput.value = ev.target.result; mainInput.dispatchEvent(new Event('input')); }
        state.uploadedFileBase64 = null;
        showUploadPreview(file.name);
      };
      reader.readAsText(file);
    }
  });
}

function showUploadPreview(name) {
  const el = document.getElementById('upload-preview');
  const short = name.length > 16 ? name.slice(0, 14) + '...' : name;
  el.innerHTML = `${short} <button class="remove-upload" onclick="removeUpload()">&times;</button>`;
}

function removeUpload() {
  state.uploadedFile = null;
  state.uploadedFileBase64 = null;
  state.uploadedFileType = null;
  document.getElementById('upload-preview').innerHTML = '';
  document.getElementById('file-input').value = '';
}

// ===== Settings =====
function initSettings() {
  const gearBtn = document.getElementById('settings-btn');
  const overlay = document.getElementById('settings-overlay');
  const panel = document.getElementById('settings-panel');
  const closeBtn = document.getElementById('settings-close');

  const open = () => { overlay.classList.add('open'); panel.classList.add('open'); };
  const close = () => { overlay.classList.remove('open'); panel.classList.remove('open'); saveBrandSettings(); };

  gearBtn.addEventListener('click', open);
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  const toggle = document.getElementById('brand-toggle');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');
    state.brandSettings.enabled = toggle.classList.contains('on');
  });
  if (state.brandSettings.enabled) toggle.classList.add('on');

  document.getElementById('brand-name').addEventListener('input', e => { state.brandSettings.name = e.target.value; });
  document.getElementById('brand-voice').addEventListener('input', e => { state.brandSettings.voiceNotes = e.target.value; });
  document.getElementById('brand-url').addEventListener('input', e => { state.brandSettings.websiteUrl = e.target.value; });
  document.getElementById('brand-guidelines').addEventListener('input', e => { state.brandSettings.guidelines = e.target.value; });
  document.getElementById('notes-input').addEventListener('input', e => { state.notes = e.target.value; });

  document.getElementById('add-color-btn').addEventListener('click', () => {
    const input = document.getElementById('brand-color-input');
    let hex = input.value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-Fa-f]{3,8}$/.test(hex)) {
      state.brandSettings.colors.push(hex);
      input.value = '';
      renderColorSwatches();
      saveBrandSettings();
    }
  });
  renderColorSwatches();
}

function renderColorSwatches() {
  const container = document.getElementById('color-swatches');
  container.innerHTML = state.brandSettings.colors.map((c, i) => `
    <div class="color-swatch" style="background:${c}" title="${c}">
      <button class="remove-swatch" onclick="removeColor(${i})">&times;</button>
    </div>
  `).join('');
}
function removeColor(idx) {
  state.brandSettings.colors.splice(idx, 1);
  renderColorSwatches(); saveBrandSettings();
}
function saveBrandSettings() {
  localStorage.setItem('feedbackatcha_brand', JSON.stringify(state.brandSettings));
}
function loadBrandSettings() {
  const saved = localStorage.getItem('feedbackatcha_brand');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state.brandSettings, parsed);
      setTimeout(() => {
        document.getElementById('brand-name').value = state.brandSettings.name || '';
        document.getElementById('brand-voice').value = state.brandSettings.voiceNotes || '';
        document.getElementById('brand-url').value = state.brandSettings.websiteUrl || '';
        document.getElementById('brand-guidelines').value = state.brandSettings.guidelines || '';
        if (state.brandSettings.enabled) document.getElementById('brand-toggle').classList.add('on');
        renderColorSwatches();
      }, 50);
    } catch(e) {}
  }
}

// ===== CTA =====
function initCTA() {
  document.getElementById('cta-btn').addEventListener('click', submitMessage);
}

// ===== Submit Message =====
async function submitMessage() {
  const input = document.getElementById('main-input');
  const text = input.value.trim();

  if (!text && !state.uploadedFileBase64) {
    return showError('Give me something to work with — paste copy, upload a file, or tell me what you need.');
  }

  clearError();

  // Build user message with context
  let contextParts = [];
  if (state.assetType) contextParts.push(`Asset Type: ${state.assetType}`);
  if (state.creativeStage) contextParts.push(`Creative Stage: ${state.creativeStage}`);
  if (state.audience.length) contextParts.push(`Feedback Audience: ${state.audience.join(', ')}`);
  if (state.goal) contextParts.push(`Goal: ${state.goal}`);
  if (state.notes) contextParts.push(`Additional Context: ${state.notes}`);

  let brandContext = '';
  if (state.brandSettings.enabled && hasBrandData()) {
    const b = state.brandSettings;
    brandContext = `\n\nBRAND GUIDELINES (active — weave naturally, never announce checking):`;
    if (b.name) brandContext += `\nBrand: ${b.name}`;
    if (b.colors.length) brandContext += `\nBrand Colors: ${b.colors.join(', ')}`;
    if (b.voiceNotes) brandContext += `\nVoice/Tone: ${b.voiceNotes}`;
    if (b.websiteUrl) brandContext += `\nWebsite: ${b.websiteUrl}`;
    if (b.guidelines) brandContext += `\nGuidelines: ${b.guidelines}`;
  }

  let modeInstruction = '';
  // Only add mode instructions on first message or if context is set
  if (state.conversationHistory.length === 0 || contextParts.length) {
    if (state.mode === 'full-read') {
      modeInstruction = `\n\nMODE: Full Read — situation read + framework rec + tone tip (3-5 sentences) under "### Reading the Room", then full draft under "### Feedback Draft".`;
    } else if (state.mode === 'quick-take') {
      modeInstruction = `\n\nMODE: Quick Take — one sharp sentence under "### Quick Take", then "### Feedback Draft".`;
    } else {
      modeInstruction = `\n\nMODE: Just Draft It — skip pre-draft, output only "### Feedback Draft".`;
    }
  }

  let userMessage = text;
  if (contextParts.length) userMessage += `\n\nCONTEXT:\n- ${contextParts.join('\n- ')}`;
  userMessage += modeInstruction + brandContext;

  // Add user message to thread UI
  addUserMessage(text);

  // Clear input and reset height
  input.value = '';
  input.style.height = 'auto';

  // Collapse hero
  document.querySelector('.hero').classList.add('collapsed');

  // Close context panel
  document.getElementById('context-panel').classList.remove('open');

  // Build API content
  const content = [];
  if (state.uploadedFileBase64) {
    if (state.uploadedFileType && state.uploadedFileType.startsWith('image/')) {
      content.push({ type: 'image', source: { type: 'base64', media_type: state.uploadedFileType, data: state.uploadedFileBase64 } });
    } else if (state.uploadedFileType === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: state.uploadedFileBase64 } });
    }
    // Clear upload after sending
    removeUpload();
  }
  content.push({ type: 'text', text: userMessage });

  state.conversationHistory.push({ role: 'user', content });

  setLoading(true);

  try {
    await streamToThread(state.conversationHistory);
  } catch (err) {
    showError('Something went wrong: ' + err.message);
    setLoading(false);
  }
}

// ===== Add User Message to Thread =====
function addUserMessage(text) {
  const thread = document.getElementById('thread');
  thread.classList.add('active');

  const msg = document.createElement('div');
  msg.className = 'msg msg-user';
  msg.innerHTML = `
    <div class="msg-label">You</div>
    <div class="msg-body">${escapeHtml(text)}</div>
  `;
  thread.appendChild(msg);
  scrollThread();
}

// ===== Stream AI Response into Thread =====
async function streamToThread(messages) {
  const thread = document.getElementById('thread');

  // Create AI message element
  const msgId = 'ai-msg-' + Date.now();
  const msg = document.createElement('div');
  msg.className = 'msg msg-ai';
  msg.id = msgId;
  msg.innerHTML = `
    <div class="msg-header">
      <div class="msg-label"><span class="orb-inline"></span> FeedbackAtcha</div>
      <button class="copy-msg-btn" onclick="copyMessage('${msgId}')">Copy</button>
    </div>
    <div class="msg-body" id="${msgId}-body"></div>
  `;
  thread.appendChild(msg);
  scrollThread();

  const bodyEl = document.getElementById(`${msgId}-body`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API returned ${response.status}: ${errBody}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            bodyEl.innerHTML = renderMarkdown(fullText);
            scrollThread();
          }
        } catch(e) {}
      }
    }
  }

  state.lastAiText = fullText;
  state.conversationHistory.push({ role: 'assistant', content: fullText });

  // Add action pills
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.innerHTML = `
    <button class="action-pill" onclick="postAction('tighten')">Tighten it</button>
    <button class="action-pill" onclick="postAction('expand')">Expand it</button>
    <button class="action-pill" onclick="postAction('shift-tone')">Shift the tone</button>
    <button class="action-pill" onclick="postAction('figma')">Figma</button>
    <button class="action-pill" onclick="postAction('gdoc')">Google Doc</button>
    <button class="action-pill" onclick="postAction('slack')">Slack</button>
  `;
  msg.appendChild(actions);

  setLoading(false);
  scrollThread();
}

function scrollThread() {
  const thread = document.getElementById('thread');
  thread.scrollTop = thread.scrollHeight;
}

// ===== Post-Draft Actions =====
function postAction(action) {
  const prompts = {
    'tighten': 'Tighten this feedback — more concise and punchy, keep all key points.',
    'expand': 'Expand this feedback — more detail, examples, specific recommendations.',
    'shift-tone': 'Shift the tone — slightly more formal and diplomatic, keep it real.',
    'figma': 'Reformat for Figma comments. Short, direct annotations grouped by area.',
    'gdoc': 'Reformat as a Google Doc — headings, bullets, professional structure.',
    'slack': 'Reformat for Slack — conversational, emoji where appropriate, short blocks.'
  };

  const text = prompts[action] || action;
  addUserMessage(text);
  state.conversationHistory.push({ role: 'user', content: text });

  setLoading(true);
  streamToThread(state.conversationHistory).catch(err => {
    showError('Something went wrong: ' + err.message);
    setLoading(false);
  });
}

// ===== Copy Message =====
function copyMessage(msgId) {
  const bodyEl = document.getElementById(`${msgId}-body`);
  if (!bodyEl) return;
  const text = bodyEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`#${msgId} .copy-msg-btn`);
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
  });
}

// ===== Markdown Renderer =====
function renderMarkdown(text) {
  return text
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[hup]|<li|<ul)(.+)/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h3>)/g, '$1')
    .replace(/(<\/h3>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== UI Helpers =====
function setLoading(loading) {
  const btn = document.getElementById('cta-btn');
  const label = document.getElementById('cta-label');
  const input = document.getElementById('main-input');
  if (loading) {
    btn.disabled = true;
    label.textContent = 'Reading the room...';
    input.disabled = true;
  } else {
    btn.disabled = false;
    label.textContent = 'Get Feedback';
    input.disabled = false;
    input.focus();
  }
}

function showError(msg) {
  clearError();
  const el = document.createElement('div');
  el.id = 'error-msg';
  el.className = 'error-msg';
  el.textContent = msg;
  document.querySelector('.compose').prepend(el);
}

function clearError() {
  const el = document.getElementById('error-msg');
  if (el) el.remove();
}

function hasBrandData() {
  const b = state.brandSettings;
  return b.name || b.colors.length || b.voiceNotes || b.websiteUrl || b.guidelines;
}
