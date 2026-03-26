// ===== FeedbackAtcha App v2 =====

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
  feedbackResult: '',
  conversationHistory: [],
  brandSettings: {
    name: '',
    colors: [],
    voiceNotes: '',
    websiteUrl: '',
    guidelines: '',
    enabled: true
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
  initContextDrawer();
  initCTA();
  initMainInput();
});

// ===== Main Input (supports Enter to submit) =====
function initMainInput() {
  const input = document.getElementById('main-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generateFeedback();
    }
  });
}

// ===== Context Drawer =====
function initContextDrawer() {
  const toggle = document.getElementById('context-toggle');
  const content = document.getElementById('context-content');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    content.classList.toggle('open');
  });
}

// ===== Asset Type Tiles =====
function initTiles() {
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      state.assetType = tile.dataset.value;
    });
  });
}

// ===== Creative Stage =====
function initSegmented() {
  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.creativeStage = btn.dataset.value;
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
    });
  });

  document.querySelectorAll('.goal-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.goal-pills .pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      state.goal = pill.dataset.value;
    });
  });
}

// ===== Mode Slider =====
function initModeSlider() {
  const options = document.querySelectorAll('.mode-option');
  const thumb = document.querySelector('.mode-slider-thumb');

  function updateThumb(selected) {
    const width = selected.offsetWidth;
    const left = selected.offsetLeft;
    thumb.style.width = width + 'px';
    thumb.style.left = left + 'px';
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
    const selected = document.querySelector('.mode-option.selected');
    if (selected) updateThumb(selected);
  }, 100);

  window.addEventListener('resize', () => {
    const selected = document.querySelector('.mode-option.selected');
    if (selected) updateThumb(selected);
  });
}

// ===== File Upload =====
function initUpload() {
  const input = document.getElementById('file-input');
  const preview = document.getElementById('upload-preview');
  const area = document.getElementById('upload-area');

  input.addEventListener('change', (e) => {
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
        // Append file text to main input
        const mainInput = document.getElementById('main-input');
        if (!mainInput.value) mainInput.value = ev.target.result;
        state.uploadedFileBase64 = null;
        showUploadPreview(file.name);
      };
      reader.readAsText(file);
    }
  });
}

function showUploadPreview(name) {
  const preview = document.getElementById('upload-preview');
  preview.innerHTML = `${name} <button class="remove-upload" onclick="removeUpload()">&times;</button>`;
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
  renderColorSwatches();
  saveBrandSettings();
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
        if (state.brandSettings.enabled) {
          document.getElementById('brand-toggle').classList.add('on');
        }
        renderColorSwatches();
      }, 50);
    } catch(e) {}
  }
}

// ===== CTA & API =====
function initCTA() {
  document.getElementById('cta-btn').addEventListener('click', generateFeedback);
  document.getElementById('notes-input').addEventListener('input', (e) => {
    state.notes = e.target.value;
  });
}

async function generateFeedback() {
  const mainInput = document.getElementById('main-input').value.trim();

  if (!mainInput && !state.uploadedFileBase64) {
    return showError('Give me something to work with — paste copy, upload a file, or tell me what you need.');
  }

  clearError();
  setLoading(true);

  // Build context string from optional selections
  let contextParts = [];
  if (state.assetType) contextParts.push(`Asset Type: ${state.assetType}`);
  if (state.creativeStage) contextParts.push(`Creative Stage: ${state.creativeStage}`);
  if (state.audience.length) contextParts.push(`Feedback Audience: ${state.audience.join(', ')}`);
  if (state.goal) contextParts.push(`Goal: ${state.goal}`);
  if (state.notes) contextParts.push(`Additional Context: ${state.notes}`);

  let brandContext = '';
  if (state.brandSettings.enabled && hasBrandData()) {
    const b = state.brandSettings;
    brandContext = `\n\nBRAND GUIDELINES (active — weave naturally into feedback, never announce checking):`;
    if (b.name) brandContext += `\nBrand: ${b.name}`;
    if (b.colors.length) brandContext += `\nBrand Colors: ${b.colors.join(', ')}`;
    if (b.voiceNotes) brandContext += `\nVoice/Tone: ${b.voiceNotes}`;
    if (b.websiteUrl) brandContext += `\nWebsite: ${b.websiteUrl}`;
    if (b.guidelines) brandContext += `\nGuidelines: ${b.guidelines}`;
  }

  let modeInstruction = '';
  if (state.mode === 'full-read') {
    modeInstruction = `\n\nMODE: Full Read
First, provide a Pre-Draft Read: a brief situation read, recommend a feedback framework, and a tone tip. 3-5 sentences max under "### Reading the Room".
Then the full feedback draft under "### Feedback Draft".`;
  } else if (state.mode === 'quick-take') {
    modeInstruction = `\n\nMODE: Quick Take
One sharp sentence as your read (under "### Quick Take"), then straight into "### Feedback Draft".`;
  } else {
    modeInstruction = `\n\nMODE: Just Draft It
Skip pre-draft. Select best framework silently. Output only "### Feedback Draft".`;
  }

  let userMessage = mainInput;

  if (contextParts.length) {
    userMessage += `\n\nCONTEXT:\n- ${contextParts.join('\n- ')}`;
  }

  userMessage += modeInstruction + brandContext;

  if (contextParts.length || state.uploadedFileBase64) {
    userMessage += `\n\nAfter the feedback draft, end with "### What's Next?" offering: Tighten it, Expand it, Shift the tone, Reformat for Figma, Reformat for Google Doc, Reformat for Slack.`;
  }

  // Build content array
  const content = [];
  if (state.uploadedFileBase64) {
    if (state.uploadedFileType && state.uploadedFileType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: state.uploadedFileType, data: state.uploadedFileBase64 }
      });
    } else if (state.uploadedFileType === 'application/pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: state.uploadedFileBase64 }
      });
    }
  }
  content.push({ type: 'text', text: userMessage });

  state.conversationHistory = [{ role: 'user', content }];

  try {
    await streamResponse(state.conversationHistory);
  } catch (err) {
    showError('Something went wrong: ' + err.message);
    setLoading(false);
  }
}

async function streamResponse(messages) {
  const outputCard = document.getElementById('output-card');
  const outputEl = document.getElementById('output-content');
  const actionPills = document.getElementById('action-pills');

  outputCard.classList.add('visible');
  outputEl.innerHTML = '';
  actionPills.classList.remove('visible');

  // Scroll to output
  outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
            outputEl.innerHTML = renderMarkdown(fullText);
          }
        } catch(e) {}
      }
    }
  }

  state.feedbackResult = fullText;
  state.conversationHistory.push({ role: 'assistant', content: fullText });

  actionPills.classList.add('visible');
  setLoading(false);
}

// ===== Post-Draft Actions =====
function postAction(action) {
  if (!state.feedbackResult) return;

  const prompts = {
    'tighten': 'Please tighten this feedback — more concise and punchy, keep all key points.',
    'expand': 'Please expand this feedback — more detail, examples, and specific recommendations.',
    'shift-tone': 'Please shift the tone — slightly more formal and diplomatic while staying real and actionable.',
    'figma': 'Reformat for Figma comments. Short, direct annotations. Group by section/area.',
    'gdoc': 'Reformat as a clean Google Doc — proper headings, bullets, professional structure.',
    'slack': 'Reformat for Slack. Conversational, emoji where appropriate, short readable blocks.'
  };

  state.conversationHistory.push({
    role: 'user',
    content: prompts[action] || action
  });

  setLoading(true);
  streamResponse(state.conversationHistory).catch(err => {
    showError('Something went wrong: ' + err.message);
    setLoading(false);
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

// ===== UI Helpers =====
function setLoading(loading) {
  const btn = document.getElementById('cta-btn');
  const label = document.getElementById('cta-label');
  if (loading) {
    btn.disabled = true;
    label.textContent = 'Reading the room...';
  } else {
    btn.disabled = false;
    label.textContent = 'Get Feedback';
  }
}

function showError(msg) {
  clearError();
  const el = document.createElement('div');
  el.id = 'error-msg';
  el.className = 'error-msg';
  el.textContent = msg;
  document.querySelector('.input-card').appendChild(el);
}

function clearError() {
  const el = document.getElementById('error-msg');
  if (el) el.remove();
}

function copyOutput() {
  const text = state.feedbackResult;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn span');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

function hasBrandData() {
  const b = state.brandSettings;
  return b.name || b.colors.length || b.voiceNotes || b.websiteUrl || b.guidelines;
}
