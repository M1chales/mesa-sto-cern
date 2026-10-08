import * as THREE from 'three';
import { stars, orb, glow, COL } from '../gfx.js';
import { section } from './common.js';

// Powers-of-ten zoom: each level is a group; scrubbing between levels scales/fades them.
const LEVELS = [
  { name: 'Κόκκος αλατιού', size: '10⁻³ m', note: 'Ένας κόκκος αλατιού. Φαίνεται συμπαγής. Δεν είναι.' },
  { name: 'Κρύσταλλος', size: '10⁻⁹ m', note: 'Κάνε ζουμ και το αλάτι είναι ένα τέλειο 3D πλέγμα από άτομα νατρίου και χλωρίου.' },
  { name: 'Άτομο', size: '10⁻¹⁰ m', note: 'Το άτομο είναι σχεδόν εντελώς άδειο: ένας μικροσκοπικός πυρήνας με ένα «σύννεφο» ηλεκτρονίων γύρω του.' },
  { name: 'Πυρήνας', size: '10⁻¹⁴ m', note: 'Ο πυρήνας: πρωτόνια (κόκκινα) και νετρόνια (μπλε) στριμωγμένα μαζί. Αν το άτομο ήταν γήπεδο, ο πυρήνας θα ήταν ένα ρεβίθι.' },
  { name: 'Πρωτόνιο', size: '10⁻¹⁵ m', note: 'Το πρωτόνιο ΔΕΝ είναι στοιχειώδες! Μέσα του: 2 κουάρκ up + 1 κουάρκ down, κολλημένα με γλουόνια.' },
  { name: 'Κουάρκ', size: '< 10⁻¹⁸ m', note: 'Απ’ όσο ξέρουμε, τα κουάρκ δεν έχουν μέγεθος ούτε τίποτα μέσα τους. <b>Σε αυτό το επίπεδο αναζητά το CERN απαντήσεις!</b>' },
];

function buildLevel(i) {
  const g = new THREE.Group();
  if (i === 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: .25, metalness: 0, transparent: true, opacity: .92 }));
    m.rotation.set(.5, .6, .1); g.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: COL.cyan }));
    e.rotation.copy(m.rotation); g.add(e);
  }
  if (i === 1) {
    const na = new THREE.MeshStandardMaterial({ color: 0xa78bff, roughness: .3 }), cl = new THREE.MeshStandardMaterial({ color: 0x5dffa6, roughness: .3 });
    const sNa = new THREE.SphereGeometry(.22, 16, 12), sCl = new THREE.SphereGeometry(.34, 16, 12);
    for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++) {
      const odd = (x + y + z) & 1; const s = new THREE.Mesh(odd ? sNa : sCl, odd ? na : cl);
      s.position.set(x * .75, y * .75, z * .75); g.add(s);
    }
    g.rotation.set(.4, .5, 0);
  }
  if (i === 2) {
    g.add(orb(0xffd25a, .12, 6));
    const n = 1400, p = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(Math.pow(Math.random(), .6) * 2.4 + .3); p.set([v.x, v.y, v.z], k * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: COL.cyan, size: .06, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })));
    for (let k = 0; k < 3; k++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(2 + k * .2, .01, 6, 80), new THREE.MeshBasicMaterial({ color: COL.cyan, transparent: true, opacity: .35 }));
      r.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(r);
    }
  }
  if (i === 3) {
    const pm = new THREE.MeshStandardMaterial({ color: 0xff5a6e, roughness: .35 }), nm = new THREE.MeshStandardMaterial({ color: 0x4f8bff, roughness: .35 });
    const s = new THREE.SphereGeometry(.42, 20, 16);
    for (let k = 0; k < 24; k++) {
      const m = new THREE.Mesh(s, k % 2 ? pm : nm);
      m.position.copy(new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 1.15)); g.add(m);
    }
  }
  if (i === 4) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(2.3, 40, 30), new THREE.MeshStandardMaterial({ color: 0xff5a6e, transparent: true, opacity: .16, roughness: .2, depthWrite: false }));
    g.add(shell);
    const q = [[0xff4fd8, 'u'], [0xff4fd8, 'u'], [0x38e8ff, 'd']];
    const qs = q.map(([c], k) => { const o = orb(c, .28, 5); const a = k / 3 * Math.PI * 2; o.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0); g.add(o); return o; });
    // gluon springs
    for (let k = 0; k < 3; k++) {
      const a = qs[k].position, b = qs[(k + 1) % 3].position, pts = [];
      for (let s2 = 0; s2 <= 40; s2++) {
        const t = s2 / 40, p = a.clone().lerp(b, t), d = b.clone().sub(a).normalize(), nrm = new THREE.Vector3(-d.y, d.x, 0);
        p.addScaledVector(nrm, Math.sin(t * Math.PI * 10) * .12).z += Math.cos(t * Math.PI * 10) * .12; pts.push(p);
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffd25a })));
    }
    g.userData.quarks = qs;
  }
  if (i === 5) {
    g.add(orb(0xff4fd8, .25, 10));
    g.add(glow(0xffd25a, 9, .25));
    for (let k = 0; k < 3; k++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(1.6 + k * .7, .015, 6, 100), new THREE.MeshBasicMaterial({ color: k === 1 ? 0xffd25a : 0xff4fd8, transparent: true, opacity: .5 }));
      r.rotation.set(k, k * 2, 0); g.add(r);
    }
  }
  g.traverse(o => { if (o.material) { o.material.transparent = true; o.userData.baseOpacity = o.material.opacity; } });
  return g;
}

export default {
  id: 'zoom', color: '#9b7bff',
  title: 'Κβαντικό ζουμ', sub: 'Πόσο μικρή είναι η ύλη;',
  intro: [
    { t: 'Το CERN μελετά την ύλη <b>στις μικρότερες διαστάσεις της</b>. Πόσο μικρές όμως είναι αυτές;', mood: 'think' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(0, 0, 9); camera.lookAt(0, 0, 0);
    scene.add(stars(900, 90, .45));
    scene.add(new THREE.AmbientLight(0xffffff, .7));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(4, 6, 8); scene.add(dl);
    const groups = LEVELS.map((_, i) => { const g = buildLevel(i); scene.add(g); return g; });

    let z = 0, zTarget = 0, maxReached = 0;
    const lbl = api.label(new THREE.Vector3(0, -3.6, 0), '', 'big');
    const body = api.panel();
    const obj = api.tutor([
      { how: "Πάτα <b>＋ Μέσα</b> κάτω από το 3D (ή σύρε την μπάρα «Ζουμ» πιο κάτω). Σε κάθε επίπεδο σταμάτα και διάβασε τι βλέπεις. Συνέχισε μέχρι να φτάσεις στα <b>κουάρκ</b>.",
        ok: "Από έναν κόκκο αλατιού μέχρι τα κουάρκ: πάνω από ένα δισεκατομμύριο δισεκατομμύρια φορές μικρότερα! Σε αυτή την κλίμακα ψάχνει το CERN." },
      { how: "Ένα μικρό τεστ: ποιο από όσα είδες <b>δεν</b> είναι στοιχειώδες σωματίδιο; Απάντησε στην ερώτηση πιο κάτω.",
        ok: "Ακριβώς: το πρωτόνιο έχει μέσα του κουάρκ. Αν θες, παίξε με τις κλίμακες στον κώδικα <code>scale.js</code>." },
    ]);
    const ctl = api.add(`<div class="card"><div class="ctrl"><div class="ctrl-row"><span>Ζουμ</span><b id="zsize">10⁻³ m</b></div>
      <input type="range" id="zslider" min="0" max="5" step="0.001" value="0"></div>
      <div id="znote" class="dex-detail"></div></div>`);
    const slider = ctl.querySelector('#zslider');
    slider.oninput = () => { zTarget = +slider.value; };
    api.ctrl(`<div style="display:flex;gap:8px"><button class="sbtn" id="zout">－ Έξω</button><button class="sbtn hot" id="zin">＋ Μέσα</button></div>`);
    document.getElementById('zin').onclick = () => { zTarget = Math.min(5, Math.floor(zTarget + 1.0001)); api.sfx.zap(); };
    document.getElementById('zout').onclick = () => { zTarget = Math.max(0, Math.ceil(zTarget - 1.0001)); api.sfx.tap(); };
    // wheel + pinch on stage
    const stage = document.getElementById('stage');
    const wheel = e => { e.preventDefault(); zTarget = Math.max(0, Math.min(5, zTarget + e.deltaY * -.0025)); };
    stage.addEventListener('wheel', wheel, { passive: false });
    let pd = null;
    const tm = e => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pd) zTarget = Math.max(0, Math.min(5, zTarget + (d - pd) * .01)); pd = d; } };
    const te = () => { pd = null; };
    stage.addEventListener('touchmove', tm, { passive: true }); stage.addEventListener('touchend', te);
    api.world.cleanup.push(() => { stage.removeEventListener('wheel', wheel); stage.removeEventListener('touchmove', tm); stage.removeEventListener('touchend', te); });

    body.append(section('Στοιχειώδη σωματίδια', `<p><b>Στοιχειώδες σωματίδιο</b> είναι αυτό που δεν περιέχει άλλα σωματίδια μέσα του — η βασική μονάδα της ύλης.</p>
      <p>Τα πρωτόνια και τα νετρόνια <b>δεν</b> είναι στοιχειώδη: αποτελούνται από κουάρκ. Τα ηλεκτρόνια και τα κουάρκ <b>είναι</b> (απ’ όσο ξέρουμε).</p>`));
    api.code({
      title: 'scale.js — πόσο μικρό είναι το μικρό;',
      intro: 'Οι αριθμοί αυτοί είναι τόσο μικροί που οι προγραμματιστές τους γράφουν σε επιστημονική μορφή: <code>1e-15</code> σημαίνει 10⁻¹⁵.',
      code: `
const sizes = {
  'Κόκκος αλατιού': 1e-3,
  'Άτομο': 1e-10,
  'Πυρήνας': 1e-14,
  'Πρωτόνιο': 1e-15,
  'Κουάρκ (το πολύ)': 1e-18,
};
const grain = sizes['Κόκκος αλατιού'];
for (const [name, metres] of Object.entries(sizes)) {
  const times = grain / metres;
  print(name.padEnd(18), metres.toExponential(0), 'm  →', times.toExponential(0), 'φορές μικρότερο από τον κόκκο');
}`,
    });
    const qb = api.add('<div></div>');
    api.quiz(qb, { q: 'Ποιο από αυτά ΔΕΝ είναι στοιχειώδες σωματίδιο;', opts: ['Ηλεκτρόνιο', 'Κουάρκ up', 'Πρωτόνιο', 'Φωτόνιο'], a: 2,
      ex: 'Σωστά: το πρωτόνιο είναι 2 κουάρκ up + 1 κουάρκ down, που τα κρατούν μαζί τα γλουόνια.' }, () => obj.done(1));

    let lastLvl = -1, rot = 0;
    return {
      update(dt, t) {
        z += (zTarget - z) * Math.min(1, dt * 4);
        if (Math.abs(+slider.value - z) > .002 && document.activeElement !== slider) slider.value = z;
        const L = Math.min(4, Math.floor(z)), f = z - L;
        rot += dt * .25;
        groups.forEach((g, i) => {
          let s = 0, o = 0;
          if (i === L) { s = Math.pow(12, f); o = 1 - Math.max(0, (f - .45) / .55); }
          else if (i === L + 1) { s = Math.pow(12, f - 1); o = Math.min(1, f / .55); }
          if (i === 5 && z >= 5) { s = 1; o = 1; }
          g.visible = o > .01 && s > .001;
          g.scale.setScalar(s);
          g.rotation.y = rot * (i % 2 ? -1 : 1) + i;
          g.traverse(c => { if (c.material) c.material.opacity = (c.userData.baseOpacity ?? 1) * o; });
          if (g.userData.quarks) g.userData.quarks.forEach((q, k) => q.position.z = Math.sin(t * 3 + k * 2) * .35);
        });
        const lvl = Math.round(z);
        if (lvl !== lastLvl) {
          lastLvl = lvl;
          const Lv = LEVELS[lvl];
          lbl.el.innerHTML = `${Lv.name}<small>${Lv.size}</small>`;
          ctl.querySelector('#zsize').textContent = Lv.size;
          ctl.querySelector('#znote').innerHTML = `<h3>${Lv.name}</h3><p>${Lv.note}</p>`;
          if (lvl > maxReached) { maxReached = lvl; api.sfx.blip(); }
          if (lvl === 5) { obj.done(0); api.flash(); }
        }
      },
    };
  },
};
