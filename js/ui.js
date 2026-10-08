// UI helpers: DOM, state, sound, dialogue, toasts, modals, quizzes.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmt = (n, d = 0) => Number(n).toLocaleString('el-GR', { maximumFractionDigits: d, minimumFractionDigits: d });
export const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- persistent state ---------------- */
const KEY = 'particle-quest-cern-v1';
const fresh = () => ({ done: {}, dex: {}, sound: true, seen: {} });
export const state = (() => {
  try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { return fresh(); }
})();
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

/* ---------------- sound (synthesised, no files) ---------------- */
let ac, gestured = false;
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { gestured = true; }, { once: true, capture: true }));
function actx() {
  if (!gestured) return null;
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(f, dur = .12, type = 'sine', vol = .12, when = 0, slide = 0) {
  if (!state.sound) return;
  const a = actx(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function noise(dur = .5, vol = .2) {
  if (!state.sound) return;
  const a = actx(); if (!a) return;
  const len = a.sampleRate * dur, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900;
  s.buffer = buf; g.gain.value = vol; s.connect(f).connect(g).connect(a.destination); s.start();
}
export const sfx = {
  unlock: () => actx(),
  tap:  () => tone(660, .06, 'triangle', .07),
  blip: () => tone(880, .08, 'square', .04),
  good: () => { tone(660, .1, 'triangle', .1); tone(990, .16, 'triangle', .1, .08); },
  bad:  () => tone(200, .25, 'sawtooth', .07, 0, .5),
  zap:  () => tone(300, .25, 'sawtooth', .06, 0, 6),
  boost:() => tone(220, .3, 'sawtooth', .07, 0, 3.5),
  boom: () => { noise(.8, .35); tone(90, .6, 'sine', .25, 0, .3); },
  win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .35, 'triangle', .09, i * .09)),
};
export const buzz = (p = 15) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

/* ---------------- toasts, flash ---------------- */
export function toast(msg, cls = '') {
  const t = h(`<div class="toast ${cls}">${msg}</div>`);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 2700);
}
export function flash() {
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
/* ---------------- modal ---------------- */
export function modal(html, { onClose } = {}) {
  const m = $('#modal'), c = $('#modal-card');
  c.innerHTML = ''; c.append(typeof html === 'string' ? h(html) : html);
  m.hidden = false;
  const close = () => { m.hidden = true; m.onclick = null; onClose && onClose(); };
  m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  return close;
}
/* ---------------- dialogue (visual-novel) ---------------- */
export function muSVG(mood = 'happy') {
  const eyes = {
    happy: `<g fill="#0b1030"><ellipse cx="44" cy="62" rx="8" ry="11"/><ellipse cx="76" cy="62" rx="8" ry="11"/></g>
            <g fill="#ffb547"><ellipse cx="44" cy="65" rx="5.5" ry="6.5"/><ellipse cx="76" cy="65" rx="5.5" ry="6.5"/></g>
            <g fill="#fff"><circle cx="47" cy="57" r="3.4"/><circle cx="79" cy="57" r="3.4"/><circle cx="41.5" cy="68" r="1.5"/><circle cx="73.5" cy="68" r="1.5"/></g>`,
    wow: `<g fill="#0b1030"><ellipse cx="44" cy="61" rx="9" ry="12.5"/><ellipse cx="76" cy="61" rx="9" ry="12.5"/></g>
          <g fill="#ff4fd8"><ellipse cx="44" cy="64" rx="6" ry="7.5"/><ellipse cx="76" cy="64" rx="6" ry="7.5"/></g>
          <g fill="#fff"><path d="M47 52l1.6 3.4 3.4 1.6-3.4 1.6L47 62l-1.6-3.4L42 57l3.4-1.6z"/><path d="M79 52l1.6 3.4 3.4 1.6-3.4 1.6L79 62l-1.6-3.4L74 57l3.4-1.6z"/></g>`,
    smug: `<g stroke="#0b1030" stroke-width="4" stroke-linecap="round" fill="none"><path d="M36 64q8-7 16 0"/><path d="M68 64q8-7 16 0"/></g>`,
    think:`<g fill="#0b1030"><ellipse cx="46" cy="60" rx="7" ry="10"/><ellipse cx="78" cy="60" rx="7" ry="10"/></g>
           <g fill="#9b7bff"><ellipse cx="47" cy="57" rx="4.5" ry="5.5"/><ellipse cx="79" cy="57" rx="4.5" ry="5.5"/></g>
           <g fill="#fff"><circle cx="49" cy="54" r="2.6"/><circle cx="81" cy="54" r="2.6"/></g>`,
  }[mood] || '';
  const mouth = { happy: '<path d="M54 82q6 6 12 0" stroke="#0b1030" stroke-width="3" fill="#ff7aa8" stroke-linecap="round"/>',
    wow: '<ellipse cx="60" cy="84" rx="5" ry="6" fill="#0b1030"/>',
    smug: '<path d="M52 82q9 5 16-2" stroke="#0b1030" stroke-width="3" fill="none" stroke-linecap="round"/>',
    think: '<path d="M54 84h11" stroke="#0b1030" stroke-width="3" stroke-linecap="round"/>' }[mood];
  return `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-label="Μι, η ξεναγός σου">
    <defs><radialGradient id="mg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#ffe9f6"/><stop offset="1" stop-color="#ffd0e6"/></radialGradient>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8f7a"/><stop offset="1" stop-color="#d42a45"/></linearGradient></defs>
    <path d="M30 118q30-22 60 0v22H30z" fill="#f4f7ff"/><path d="M52 112l8 14 8-14" fill="#ff4655"/><path d="M30 118l14-6 8 28H30zM90 118l-14-6-8 28h22z" fill="#dfe6ff"/>
    <text x="74" y="134" font-size="9" font-family="Orbitron,sans-serif" font-weight="900" fill="#ff4655">μ</text>
    <path d="M18 64q-4-44 42-46 46 2 42 46l-6 28q-4-30-10-38-26 6-52 0-6 8-10 38z" fill="url(#hg)"/>
    <ellipse cx="60" cy="68" rx="34" ry="36" fill="url(#mg)"/>
    <path d="M24 56q8-30 36-32 30 2 36 32-10-14-20-16l-4 8-6-9-8 9-6-9-6 8q-14 0-22 9z" fill="url(#hg)"/>
    <path d="M58 22q-6-16 8-20-4 10 4 14" fill="none" stroke="#ff8f7a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="70" cy="16" r="3.5" fill="#ffb547"/>
    ${eyes}${mouth}
    <ellipse cx="36" cy="78" rx="6" ry="3.5" fill="#ff7aa8" opacity=".55"/><ellipse cx="84" cy="78" rx="6" ry="3.5" fill="#ff7aa8" opacity=".55"/>
  </svg>`;
}

/* ---------------- quiz ---------------- */
// quiz(container, {q, opts:[...], a:index, ex:'explanation'}, onDone(correct))
export function quiz(container, { q, opts, a, ex }, onDone) {
  const el = h(`<div class="quiz card"><div class="quiz-q">${q}</div><div class="quiz-opts"></div><div class="quiz-ex" hidden></div></div>`);
  const box = el.querySelector('.quiz-opts');
  let tries = 0;
  opts.forEach((o, i) => {
    const b = h(`<button class="quiz-opt">${o}</button>`);
    b.onclick = () => {
      tries++;
      if (i === a) {
        b.classList.add('right'); sfx.good(); buzz(20);
        box.querySelectorAll('button').forEach(x => x.disabled = true);
        const exEl = el.querySelector('.quiz-ex'); if (ex) { exEl.innerHTML = ex; exEl.hidden = false; }
        onDone && onDone(tries === 1);
      } else { b.classList.add('wrong'); b.disabled = true; sfx.bad(); buzz([30, 40, 30]); }
    };
    box.append(b);
  });
  container.append(el);
  return el;
}

/* ---------------- count-up numbers ---------------- */
export function countUp(el, to, { dur = 1200, dec = 0, pre = '', suf = '' } = {}) {
  const t0 = performance.now();
  const step = t => {
    const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + fmt(to * e, dec) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
