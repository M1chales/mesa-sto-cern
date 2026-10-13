import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { $, h, state, save, quiz, sfx, toast, flash, modal, fmt, buzz, countUp } from './ui.js';
import { codeLab } from './codelab.js';
import { tutor } from './tutor.js';
import { stars, disposeScene, glow, ring, orb, Trail } from './gfx.js';
import { MISSIONS } from './missions/index.js';

const canvas = $('#gl');
const stageEl = $('#stage');
const labelsEl = $('#stage-labels');
const chapterEl = $('#chapter');
const inner = $('#inner');

/* ---------------- renderer ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

let world = null;      // { scene, camera, update, dispose, controls, labels:[], cleanup:[] }
let size = { w: 1, h: 1 };

function resize() {
  const r = stageEl.getBoundingClientRect();
  if (!r.width || !r.height) return;
  size = { w: r.width, h: r.height };
  renderer.setSize(size.w, size.h, false);
  if (world) { fitCamera(world.camera); world.onResize && world.onResize(size); }
}
// Scenes are framed for a landscape stage. On narrow (portrait) screens, widen the
// vertical FOV so the horizontal view stays the same and side labels aren't cut off.
const FRAME_ASPECT = 1.15;
function fitCamera(cam) {
  const aspect = size.w / size.h;
  if (cam.userData.baseFov === undefined) cam.userData.baseFov = cam.fov;
  const base = cam.userData.baseFov * Math.PI / 180;
  cam.fov = aspect >= FRAME_ASPECT ? cam.userData.baseFov
    : Math.min(80, 2 * Math.atan(Math.tan(base / 2) * FRAME_ASPECT / aspect) * 180 / Math.PI);
  cam.aspect = aspect; cam.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stageEl);

/* ---------------- labels projected from 3D ---------------- */
const _v = new THREE.Vector3();
function updateLabels() {
  for (const L of world.labels) {
    if (L.target.isObject3D) L.target.getWorldPosition(_v); else _v.copy(L.target);
    _v.project(world.camera);
    const vis = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1 && !L.hidden;
    L.el.style.opacity = vis ? '' : '0';
    if (vis) L.el.style.transform = `translate(${(_v.x * .5 + .5) * size.w}px, ${(-_v.y * .5 + .5) * size.h}px) translate(-50%, -50%)`;
  }
}
function mkLabel(target, html, cls = '') {
  const el = h(`<div class="lbl3d ${cls}">${html}</div>`);
  labelsEl.append(el);
  return { el, target };
}

/* ---------------- worlds ---------------- */
function setWorld(w) {
  if (world) {
    world.dispose && world.dispose();
    world.controls && world.controls.dispose();
    disposeScene(world.scene);
    world.cleanup.forEach(f => f());
  }
  labelsEl.innerHTML = '';
  world = w;
  resize();
}
function makeWorld({ fov = 55 } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0d);
  const camera = new THREE.PerspectiveCamera(fov, size.w / size.h, .1, 2000);
  return { scene, camera, labels: [], cleanup: [], update: null };
}

// home page: the LHC ring seen from above, with two counter-rotating beams
function lhcWorld() {
  const W = makeWorld({ fov: 50 });
  const { scene, camera } = W;
  scene.add(stars(1800, 260, .8));
  scene.fog = new THREE.FogExp2(0x0a0a0d, .006);
  const R = 26;
  const grid = new THREE.PolarGridHelper(70, 24, 16, 96, 0x4a1f25, 0x2a1316);
  grid.position.y = -2.2; grid.material.transparent = true; grid.material.opacity = .5; scene.add(grid);
  scene.add(ring(R, .14, 0x6e2530), ring(R + .55, .14, 0x6e2530), ring(R + .27, .9, 0xff4655, .05));
  const sps = ring(R * .26, .1, 0xffd23f, .9); sps.position.set(-R * .55, 0, R * .62); scene.add(sps);
  [['ATLAS', 0, 0xff6b8b], ['ALICE', Math.PI / 2, 0x3ddc97], ['CMS', Math.PI, 0xffd23f], ['LHCb', -Math.PI / 2, 0xff4655]].forEach(([n, a, c]) => {
    const o = orb(c, .55, 6); o.position.set(Math.cos(a) * (R + .27), 0, Math.sin(a) * (R + .27)); scene.add(o);
    W.labels.push(mkLabel(o, n, 'big'));
  });
  const bunches = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < 18; i++) {
    const c = k ? 0xffd23f : 0xff4655, g = glow(c, 1.3), tr = new Trail(c, 16);
    scene.add(g, tr.line); bunches.push({ g, tr, k, a: (i / 18) * Math.PI * 2 + k * .1 });
  }
  let a = 0;
  W.update = (dt, t) => {
    a += dt * .05;
    camera.position.set(Math.cos(a) * 48, 18 + Math.sin(t * .2) * 2, Math.sin(a) * 48);
    camera.lookAt(0, 2, 0);
    for (const b of bunches) {
      b.a += dt * (b.k ? -1.1 : 1.1);
      const r = b.k ? R + .55 : R;
      b.g.position.set(Math.cos(b.a) * r, 0, Math.sin(b.a) * r);
      b.tr.push(b.g.position);
    }
  };
  return W;
}

/* ---------------- main loop ---------------- */
const clock = new THREE.Clock();
let running = true;
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });
renderer.setAnimationLoop(() => {
  if (!running || !world || !stageEl.classList.contains('placed')) return;
  const dt = Math.min(clock.getDelta(), 1 / 20), t = clock.elapsedTime;
  world.controls && world.controls.update(dt);
  world.update && world.update(dt, t);
  renderer.render(world.scene, world.camera);
  updateLabels();
});

/* ---------------- taps on the 3D view ---------------- */
let tapHandlers = [];
let down = null;
stageEl.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
stageEl.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
  down = null;
  if (moved > 10 || dt > 450) return;
  const r = stageEl.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tapHandlers.forEach(f => f(ndc, e));
});

/* ---------------- chapters & navigation ---------------- */
const PAGES = [{ id: 'home', title: 'Αρχή' }, ...MISSIONS];
let index = -1;

// desktop sidebar: every chapter, always visible
const rail = $('#rail');
function renderRail() {
  rail.innerHTML = '<div class="rail-head">Κεφάλαια</div>';
  PAGES.forEach((p, i) => {
    const b = h(`<button class="rail-row ${i === index ? 'on' : ''}"><span class="n">${i ? String(p.num).padStart(2, '0') : '00'}</span>
      <span class="t">${p.title}</span>${i && state.done[p.id] ? '<span class="seen"></span>' : ''}</button>`);
    b.onclick = () => show(i);
    rail.append(b);
  });
}
$('#prevBtn').onclick = () => show(index - 1);
$('#nextBtn').onclick = () => show(index + 1);
window.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || !$('#menu').hidden || !$('#modal').hidden) return;
  if (e.key === 'ArrowRight') show(index + 1);
  if (e.key === 'ArrowLeft') show(index - 1);
});
window.addEventListener('hashchange', () => {
  const i = PAGES.findIndex(p => '#' + p.id === location.hash);
  if (i >= 0 && i !== index) show(i);
});

$('#soundBtn').textContent = state.sound ? '🔊' : '🔇';
$('#soundBtn').onclick = () => { state.sound = !state.sound; save(); $('#soundBtn').textContent = state.sound ? '🔊' : '🔇'; };

function tocRows(container, onPick) {
  container.innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const r = h(`<button class="toc-row ${index === i + 1 ? 'on' : ''}"><span class="n">${String(m.num).padStart(2, '0')}</span>
      <span class="t"><b>${m.title}</b><small>${m.sub}</small></span>${state.done[m.id] ? '<span class="seen">✓</span>' : ''}</button>`);
    r.onclick = () => { onPick && onPick(); show(i + 1); };
    container.append(r);
  });
}
$('#menuBtn').onclick = () => { tocRows($('#menuList'), closeMenu); $('#menu').hidden = false; };
$('#menuClose').onclick = closeMenu;
$('#menu').onclick = e => { if (e.target.id === 'menu') closeMenu(); };
function closeMenu() { $('#menu').hidden = true; }

function placeStage(slot) {
  slot.append(stageEl);
  stageEl.classList.add('placed');
  resize();
}

function show(i) {
  if (i < 0 || i >= PAGES.length || i === index) return;
  const dir = i > index ? 1 : -1;
  index = i;
  const p = PAGES[i];
  history.replaceState(null, '', '#' + p.id);
  tapHandlers = [];
  inner.style.setProperty('--dir', dir);
  inner.classList.remove('entering'); void inner.offsetWidth; inner.classList.add('entering');
  inner.innerHTML = '';
  chapterEl.scrollTop = 0;

  $('#pagerCount').innerHTML = i ? `<b>${String(i).padStart(2, '0')}</b> / ${PAGES.length - 1}` : '<b>ΑΡΧΗ</b>';
  $('#prevBtn').disabled = i === 0;
  $('#nextBtn').disabled = i === PAGES.length - 1;
  $('#progressBar').style.width = (i / (PAGES.length - 1) * 100) + '%';
  $('#chapterTitle').innerHTML = i ? `<b>${String(p.num).padStart(2, '0')}</b>${p.title}` : '';

  if (i === 0) renderHome(); else renderChapter(p);
  renderRail();
}

/* ---------------- home ---------------- */
function renderHome() {
  const el = h(`<div class="hero">
    <div class="hero-kicker">CERN · Γενεύη · 100 μέτρα κάτω από τη γη</div>
    <h1 class="hero-title"><span>Μέσα στο</span> <i>CERN</i></h1>
    <p class="lead">Ένα διαδραστικό ταξίδι στη φυσική των σωματιδίων — και στον κώδικα που κρύβεται πίσω της. Σε κάθε κεφάλαιο η Μι σε καθοδηγεί βήμα-βήμα, με 3D μοντέλα, προσομοιώσεις και κώδικα που μπορείς να αλλάξεις.</p>
    <div class="btn-row"><button class="btn btn-primary" data-start>Ξεκίνα το ταξίδι <span class="arrow">→</span></button></div>
    <div class="card stage-card hero-stage"><div class="stage-bar"><span class="live">LHC · ζωντανά</span><span>27 χλμ. · 2 δέσμες</span></div><div class="stage-slot"><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br br-"></i></div></div>
    <div class="ticker">
      <div><b>27<small>km</small></b><span>δακτύλιος, 100 μ. κάτω από τη γη</span></div>
      <div><b>−271,3<small>°C</small></b><span>πιο κρύο κι από το διάστημα</span></div>
      <div><b>99,999999<small>% c</small></b><span>η ταχύτητα των πρωτονίων</span></div>
    </div>
    <div class="block"><h3>Τα κεφάλαια</h3><div class="home-toc"></div></div>
    <p class="muted" style="margin-top:28px;font-size:13.5px">Πλοήγηση: <span class="kbd">←</span><span class="kbd">→</span> ή τα κουμπιά κάτω.</p>
  </div>`);
  inner.append(el);
  el.querySelector('[data-start]').onclick = () => show(1);
  tocRows(el.querySelector('.home-toc'));
  placeStage(el.querySelector('.stage-slot'));
  setWorld(lhcWorld());
}

/* ---------------- a chapter ---------------- */
function renderChapter(m) {
  state.done[m.id] = true; save();
  const words = m.title.split(' ');
  const title = words.length > 1 ? `${words.slice(0, -1).join(' ')} <span>${words.at(-1)}</span>` : `<span>${m.title}</span>`;
  const [leadLine, ...introRest] = m.intro || [];
  inner.append(h(`<div class="ch-head"><div class="ch-num" aria-hidden="true">${String(m.num).padStart(2, '0')}</div><div class="eyebrow">Κεφάλαιο ${String(m.num).padStart(2, '0')} · ${m.sub}</div>
    <h2>${title}</h2>${leadLine ? `<p class="lead">${typeof leadLine === 'string' ? leadLine : leadLine.t}</p>` : ''}</div>`));
  const lesson = h(`<div class="lesson">
    <div class="card stage-card"><div class="stage-bar"><span class="live">3D · κεφ. ${String(m.num).padStart(2, '0')}</span><span class="stage-hint"></span></div>
      <div class="stage-slot"><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br br-"></i></div><div class="stage-ctrl"></div></div>
    <div class="guide-slot"></div></div>`);
  inner.append(lesson);
  const body = h('<div class="ch-body"></div>');
  inner.append(body);
  const slot = lesson.querySelector('.stage-slot'), hintEl = lesson.querySelector('.stage-hint'), ctrlEl = lesson.querySelector('.stage-ctrl');
  placeStage(slot);

  const W = makeWorld(m.world || {});
  setWorld(W);
  let guide = null;
  const api = {
    THREE, scene: W.scene, camera: W.camera, renderer, world: W, mission: m,
    panel() { return body; },
    add(html) { const e = typeof html === 'string' ? h(html) : html; body.append(e); return e; },
    ctrl(html) { ctrlEl.innerHTML = ''; if (html) ctrlEl.append(typeof html === 'string' ? h(html) : html); return ctrlEl; },
    hint(t) { hintEl.textContent = t || ''; },
    orbit(opts = {}) {
      const c = new OrbitControls(W.camera, canvas);
      // no wheel-zoom by default, so scrolling the page over the 3D view still scrolls the page
      Object.assign(c, { enableDamping: true, dampingFactor: .08, enablePan: false, enableZoom: false, rotateSpeed: .7 }, opts);
      W.controls = c; return c;
    },
    label(target, html, cls) { const L = mkLabel(target, html, cls); W.labels.push(L); return L; },
    onTap(fn) { tapHandlers.push(fn); },
    raycast(ndc, objs, recursive = true) { const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, W.camera); return rc.intersectObjects(objs, recursive); },
    later(fn, ms) { const id = setTimeout(fn, ms); W.cleanup.push(() => clearTimeout(id)); return id; },
    alive: () => world === W,
    tutor(steps) { guide = tutor(lesson.querySelector('.guide-slot'), { intro: introRest, steps }); return guide; },
    say(lines) { guide && guide.say(lines); },
    quiz, sfx, toast, flash, modal, buzz, countUp, fmt, state, save,
    code(opts) { const el = codeLab(opts); body.append(el); return el; },
  };
  const ret = m.build(api) || {};
  W.update = ret.update || W.update;
  W.dispose = ret.dispose;
  W.onResize = ret.onResize;
  ret.afterIntro && ret.afterIntro();

  const next = PAGES[index + 1];
  if (next) {
    const n = h(`<button class="next-card"><div><small>Επόμενο κεφάλαιο</small><strong>${next.title}</strong></div><span class="go">→</span></button>`);
    n.onclick = () => show(index + 1);
    body.append(n);
  }
}

/* ---------------- boot ---------------- */
const start = PAGES.findIndex(p => '#' + p.id === location.hash);
show(start > 0 ? start : 0);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
