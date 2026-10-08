// Editable JavaScript snippet with a Run button.
// Code runs in a throw-away Web Worker, so mistakes (even infinite loops) can't freeze the page.
import { h } from './ui.js';

const WORKER_SRC = `
const show = x => typeof x === 'number' ? String(+x.toPrecision(10)) : typeof x === 'object' ? JSON.stringify(x) : String(x);
const print = (...a) => postMessage({ t: 'out', v: a.map(show).join(' ') });
console.log = print;
onmessage = e => {
  try { new Function('print', e.data)(print); postMessage({ t: 'done' }); }
  catch (err) { postMessage({ t: 'err', v: err.name + ': ' + err.message }); }
};`;
let workerURL;

export function codeLab({ title, intro = '', code, onRun }) {
  code = code.trim();
  const el = h(`<div class="lab">
    <div class="lab-head"><span class="lab-dots"><i></i><i></i><i></i></span><span class="lab-title">${title}</span><span class="lab-lang">JavaScript</span></div>
    ${intro ? `<p class="lab-intro">${intro}</p>` : ''}
    <textarea class="lab-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
    <div class="lab-bar"><button class="btn btn-primary btn-sm lab-run">▶ Τρέξε</button><button class="btn btn-sm lab-reset">↺ Επαναφορά</button></div>
    <pre class="lab-out" aria-live="polite"></pre></div>`);
  const ta = el.querySelector('.lab-code'), out = el.querySelector('.lab-out');
  const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 4 + 'px'; };
  ta.value = code; requestAnimationFrame(fit);
  ta.addEventListener('input', fit);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });

  function run() {
    out.textContent = ''; out.className = 'lab-out on';
    workerURL = workerURL || URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const w = new Worker(workerURL);
    const stop = setTimeout(() => { w.terminate(); line('⏱ Σταμάτησε: έτρεχε πάνω από 2 δευτερόλεπτα (μήπως ατέρμονος βρόχος;)', 'err'); }, 2000);
    w.onmessage = ({ data }) => {
      if (data.t === 'out') line(data.v);
      else { clearTimeout(stop); w.terminate(); if (data.t === 'err') line(data.v, 'err'); else if (!out.textContent) line('(καμία έξοδος — χρησιμοποίησε print(...))', 'dim'); }
    };
    w.postMessage(ta.value);
    onRun && onRun();
  }
  function line(text, cls = '') {
    const s = document.createElement('div'); if (cls) s.className = cls; s.textContent = text; out.append(s);
  }
  el.querySelector('.lab-run').onclick = run;
  el.querySelector('.lab-reset').onclick = () => { ta.value = code; fit(); out.textContent = ''; out.className = 'lab-out'; };
  return el;
}
