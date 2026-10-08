// The tutor card: Mi walks the reader through a chapter one step at a time.
// steps: [{ how: 'what to do', ok: 'what you just saw / why it matters' }, ...]
import { h, muSVG, sfx } from './ui.js';

export function tutor(slot, { intro = [], steps = [], onFinish } = {}) {
  const el = h(`<div class="card guide">
    <div class="guide-head"><div class="guide-ava"></div>
      <div class="guide-who"><b>Μι</b><small>η ξεναγός σου</small></div>
      <div class="guide-steps"></div></div>
    <div class="guide-log" aria-live="polite"></div>
    <div class="guide-foot"><button class="btn btn-sm btn-ghost" data-skip>Επόμενο βήμα ›</button></div></div>`);
  const ava = el.querySelector('.guide-ava'), log = el.querySelector('.guide-log'), bar = el.querySelector('.guide-steps');
  const skip = el.querySelector('[data-skip]');
  ava.innerHTML = muSVG('happy');
  const done = steps.map(() => false);
  const ticks = steps.map(() => { const i = document.createElement('i'); bar.append(i); return i; });
  let cur = -1, finished = false;

  // messages are queued so they appear one after another, like someone typing
  const queue = []; let busy = false;
  function post(html, cls = '', mood = 'happy', attrs = {}) { queue.push({ html, cls, mood, attrs }); pump(); }
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    const { html, cls, mood, attrs } = queue.shift();
    setTimeout(() => {
      if (!el.isConnected && log.childElementCount) { busy = false; return; }
      const m = document.createElement('div'); m.className = 'msg ' + cls; m.innerHTML = html;
      for (const k in attrs) m.setAttribute(k, attrs[k]);
      log.append(m); log.scrollTop = log.scrollHeight;
      ava.innerHTML = muSVG(mood);
      if (cls) sfx.tap();
      busy = false; pump();
    }, log.childElementCount ? 450 : 150);
  }

  function refresh() {
    ticks.forEach((t, i) => { t.className = done[i] ? 'done' : i === cur ? 'cur' : ''; });
    skip.hidden = finished;
  }
  function advance() {
    while (cur < steps.length) {
      cur++;
      if (cur >= steps.length) {
        finished = true; refresh();
        post('Αυτό ήταν για αυτό το κεφάλαιο! 🎉 Αν θες, εξερεύνησε κι άλλο το 3D ή τον κώδικα — αλλιώς, πάμε στο επόμενο με το <b>›</b> κάτω.', 'end', 'wow');
        onFinish && onFinish();
        return;
      }
      if (!done[cur]) { post(steps[cur].how, 'task', 'think', { 'data-step': `Βήμα ${cur + 1} από ${steps.length}` }); refresh(); return; }
      post(steps[cur].ok, 'ok', 'happy');
    }
  }

  const api = {
    el,
    done(i) {
      if (done[i]) return;
      done[i] = true;
      if (i === cur) { post(steps[i].ok, 'ok', 'wow'); advance(); }
      refresh();
    },
    say(lines) { lines.forEach(L => post(typeof L === 'string' ? L : L.t, '', (L && L.mood) || 'happy')); },
    get all() { return done.every(Boolean); },
  };
  skip.onclick = () => { if (cur < steps.length) api.done(cur); };

  slot.append(el);
  intro.forEach(L => post(typeof L === 'string' ? L : L.t, '', (L && L.mood) || 'happy'));
  advance();
  return api;
}
