import * as THREE from 'three';
import { stars, orb, glow, Sparks, Trail, COL } from '../gfx.js';
import { section } from './common.js';

// Toy H→γγ: falling background + Gaussian bump at 125 GeV.
const LO = 100, HI = 160, BW = 2, NB = (HI - LO) / BW;
const MH = 125, SIGM = 1.8;
const BKG_PER_RUN = 600, SIG_PER_RUN = 11;
const bkgShape = m => Math.exp(-(m - LO) / 28);
const BKG_NORM = (() => { let s = 0; for (let i = 0; i < NB; i++) s += bkgShape(LO + (i + .5) * BW); return s; })();
const expBkg = i => BKG_PER_RUN * bkgShape(LO + (i + .5) * BW) / BKG_NORM;
const gaussFrac = i => { const a = LO + i * BW, b = a + BW; const cdf = x => .5 * (1 + erf((x - MH) / (SIGM * Math.SQRT2))); return cdf(b) - cdf(a); };
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return s * y; }
function poisson(l) { if (l > 30) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss())); let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

export default {
  id: 'higgs', color: '#ffd25a',
  title: 'Κυνήγι του Higgs', sub: 'Ανακάλυψέ το στα 5 σίγμα',
  intro: [
    { t: '4 Ιουλίου 2012. Τα ATLAS και CMS ανακοινώνουν ένα <b>νέο σωματίδιο</b>: το <b>μποζόνιο Higgs</b>. Ο ίδιος ο Peter Higgs ήταν στην αίθουσα και σκούπιζε τα δάκρυά του. 😭', mood: 'wow' },
    { t: 'Πώς ήταν όμως ΣΙΓΟΥΡΟΙ; Ένα «καμπούρι» στα δεδομένα μπορεί να είναι απλή τύχη. Ο κανόνας: το σήμα πρέπει να είναι <b>τουλάχιστον 5σ</b> μακριά από τον θόρυβο.', mood: 'think' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(0, 3, 14);
    api.orbit({ minDistance: 7, maxDistance: 26, autoRotate: true, autoRotateSpeed: .5 });
    scene.add(stars(1400, 120, .5));
    const sparks = new Sparks(scene, 200, COL.gold);
    // simple detector barrel outline
    for (let r of [3, 5.5]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 9, 48, 1, true), new THREE.MeshBasicMaterial({ color: r < 4 ? COL.cyan : COL.violet, wireframe: true, transparent: true, opacity: .08 }));
      c.rotation.x = Math.PI / 2; scene.add(c);
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 30, 6), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: .5 }));
    beam.rotation.x = Math.PI / 2; scene.add(beam);
    const core = glow(COL.gold, 2, .8); scene.add(core);

    // event display: reusable track lines
    const tracks = [];
    const trackMat = c => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 1 });
    function burst(isHiggs) {
      tracks.forEach(t => { scene.remove(t); t.geometry.dispose(); t.material.dispose(); });
      tracks.length = 0;
      const nh = 10 + (Math.random() * 18) | 0;
      for (let i = 0; i < nh; i++) {
        const d = new THREE.Vector3().randomDirection(), pts = [], p = new THREE.Vector3(), R = 2 + Math.random() * 5, s = Math.random() < .5 ? 1 : -1;
        for (let k = 0; k < 50; k++) { d.applyAxisAngle(new THREE.Vector3(0, 0, 1), s * .1 / R); p.addScaledVector(d, .1); pts.push(p.clone()); if (p.length() > 4.5) break; }
        const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), trackMat(0x5a8cff)); l.material.opacity = .55; scene.add(l); tracks.push(l);
      }
      // two photons: back-to-back-ish, long golden lines
      const d1 = new THREE.Vector3().randomDirection(); const d2 = d1.clone().negate().add(new THREE.Vector3().randomDirection().multiplyScalar(isHiggs ? .25 : .9)).normalize();
      [d1, d2].forEach(d => {
        const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), d.clone().multiplyScalar(6.5)]), trackMat(isHiggs ? COL.gold : 0xffe9a8));
        scene.add(l); tracks.push(l);
        const g = glow(isHiggs ? COL.gold : 0xffe9a8, 1.6, .9); g.position.copy(d).multiplyScalar(6.5); scene.add(g); tracks.push(g);
      });
      sparks.fire(new THREE.Vector3(), 5, isHiggs ? COL.gold : COL.cyan);
      fade = 1;
    }
    let fade = 0;

    // ---------- data ----------
    const obs = new Array(NB).fill(0); let runs = 0, discovered = false, evidence = false;
    const WIN = [];
    for (let i = 0; i < NB; i++) { const m = LO + (i + .5) * BW; if (Math.abs(m - MH) <= 3) WIN.push(i); }
    function significance() {
      if (!runs) return 0;
      let O = 0, B = 0;
      WIN.forEach(i => { O += obs[i]; B += expBkg(i) * runs; });
      return Math.max(0, (O - B) / Math.sqrt(B));
    }

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Πάτα <b>💥 Σύγκρουση</b> αρκετές φορές (ή <b>▶ Αυτόματα</b>) και κοίτα το γράφημα στην κάρτα πιο κάτω. Κάθε τελεία δείχνει πόσα ζεύγη φωτονίων βρήκαμε σε κάθε μάζα. Ψάξε για ένα «καμπούρι».",
        ok: "3σ! Οι φυσικοί το λένε «ένδειξη». Όμως 3σ συμβαίνουν και από τύχη — συνέχισε να μαζεύεις δεδομένα." },
      { how: "Συνέχισε μέχρι η σημαντικότητα να φτάσει τα <b>5σ</b>. Πρόσεξε το «καμπούρι» γύρω στα 125 GeV να ξεχωρίζει όλο και πιο καθαρά.",
        ok: "5σ: ανακάλυψη! Η πιθανότητα να είναι σύμπτωση είναι περίπου 1 στα 3,5 εκατομμύρια. Έτσι ακριβώς βρέθηκε το Higgs το 2012." },
      { how: "Πώς υπολογίζεται αυτό το «σ»; Τρέξε το <code>significance.js</code> πιο κάτω.",
        ok: "Πλεόνασμα διά √θορύβου. Γι’ αυτό χρειάζονται τόσα δεδομένα: το σήμα μεγαλώνει πιο γρήγορα από τη ρίζα του θορύβου." },
    ]);
    const ui = api.add(`<div class="card glow">
      <div class="ctrl-row"><span>Φάσμα μάζας δύο φωτονίων</span><b id="h-runs">0 γύροι</b></div>
      <canvas class="chart" id="h-chart" style="margin-top:8px"></canvas>
      <div class="ctrl-row" style="margin-top:12px"><span>Σημαντικότητα</span><b id="h-z">0,0σ</b></div>
      <div class="meter"><div class="meter-fill" id="h-fill"></div><div class="meter-mark" style="left:50%"></div><div class="meter-mark" style="left:83.3%"></div></div>
      <div class="meter-scale"><span>0σ</span><span style="margin-left:40%">3σ ένδειξη</span><span>5σ</span><span>6σ</span></div></div>`);
    const cv = ui.querySelector('#h-chart'), g = cv.getContext('2d');
    function draw() {
      const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio);
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const pl = 30, pr = 8, pt = 10, pb = 22, iw = W - pl - pr, ih = H - pt - pb;
      const max = Math.max(10, ...obs.map((o, i) => o + Math.sqrt(o)), runs ? expBkg(0) * runs * 1.1 : 10);
      const X = m => pl + (m - LO) / (HI - LO) * iw, Y = v => pt + ih - v / max * ih;
      g.strokeStyle = 'rgba(255,180,170,.18)'; g.lineWidth = 1; g.font = '600 10px Jura, sans-serif'; g.fillStyle = '#9aa3c7';
      for (let m = 100; m <= 160; m += 20) { g.beginPath(); g.moveTo(X(m), pt); g.lineTo(X(m), pt + ih); g.stroke(); g.fillText(m, X(m) - 8, H - 6); }
      g.fillText('GeV', W - 26, H - 6);
      if (runs) {
        // background-only expectation (dashed)
        g.setLineDash([5, 4]); g.strokeStyle = '#ff4fd8'; g.lineWidth = 1.6; g.beginPath();
        for (let m = LO; m <= HI; m += .5) { const v = BKG_PER_RUN * bkgShape(m) / BKG_NORM * runs; m === LO ? g.moveTo(X(m), Y(v)) : g.lineTo(X(m), Y(v)); }
        g.stroke(); g.setLineDash([]);
        // signal + background
        if (discovered) {
          g.strokeStyle = '#ffd25a'; g.lineWidth = 2; g.beginPath();
          for (let m = LO; m <= HI; m += .25) { const v = (BKG_PER_RUN * bkgShape(m) / BKG_NORM + SIG_PER_RUN * BW * Math.exp(-((m - MH) ** 2) / (2 * SIGM * SIGM)) / (SIGM * Math.sqrt(2 * Math.PI))) * runs; m === LO ? g.moveTo(X(m), Y(v)) : g.lineTo(X(m), Y(v)); }
          g.stroke();
        }
        // data points with error bars
        g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1.2;
        obs.forEach((o, i) => {
          const m = LO + (i + .5) * BW, x = X(m), e = Math.sqrt(o);
          g.beginPath(); g.moveTo(x, Y(o - e)); g.lineTo(x, Y(o + e)); g.stroke();
          g.beginPath(); g.arc(x, Y(o), 2.4, 0, 7); g.fill();
        });
      } else { g.fillStyle = '#9aa3c7'; g.font = '600 13px Jura, sans-serif'; g.fillText('Χωρίς δεδομένα ακόμα', pl + 10, pt + ih / 2); }
    }

    function run(n = 1) {
      for (let r = 0; r < n; r++) {
        runs++;
        for (let i = 0; i < NB; i++) obs[i] += poisson(expBkg(i) + SIG_PER_RUN * gaussFrac(i));
      }
      const Z = significance();
      ui.querySelector('#h-runs').textContent = `${runs} ${runs > 1 ? 'γύροι' : 'γύρος'} · ${api.fmt(runs * (BKG_PER_RUN + SIG_PER_RUN))} γεγονότα γγ`;
      ui.querySelector('#h-z').textContent = Z.toFixed(1).replace('.', ',') + 'σ';
      ui.querySelector('#h-fill').style.width = Math.min(100, Z / 6 * 100) + '%';
      draw();
      burst(Math.random() < .35);
      api.sfx.zap();
      if (Z >= 3 && !evidence) { evidence = true; obj.done(0); api.toast('📈 3σ: «ένδειξη» — συνέχισε!', 'xp'); }
      if (Z >= 5 && !discovered) {
        discovered = true; obj.done(1); auto = false; autoBtn.classList.remove('on');
        draw();
        api.sfx.boom(); api.flash(); api.buzz([80, 40, 80, 40, 200]);
      }
    }
    let auto = false, autoAcc = 0;
    const c = api.ctrl(`<div style="display:flex;gap:8px"><button class="sbtn hot big" id="h-go">💥 ΣΥΓΚΡΟΥΣΗ</button><button class="sbtn" id="h-auto">▶ Αυτόματα</button></div>`);
    document.getElementById('h-go').onclick = () => run(1);
    const autoBtn = document.getElementById('h-auto');
    autoBtn.onclick = () => { auto = !auto; autoBtn.classList.toggle('on', auto); api.sfx.tap(); };
    api.hint('Κάθε γύρος = χιλιάδες συγκρούσεις');
    requestAnimationFrame(draw);

    body.append(section('Τι είναι αυτό το «σ»;', `<p>Κάθε μέτρηση έχει λίγη τυχαιότητα. Αν μετρήσεις κάτι πολλές φορές, τα αποτελέσματα σχηματίζουν μια «καμπάνα» (γκαουσιανή κατανομή). Το <b>σ</b> (τυπική απόκλιση) δείχνει πόσο «απλωμένη» είναι αυτή η καμπάνα:</p>
      <div class="stats">
        <div class="stat"><div class="stat-n">68%</div><div class="stat-l">των αποτελεσμάτων πέφτουν μέσα σε ±1σ</div></div>
        <div class="stat"><div class="stat-n">95%</div><div class="stat-l">μέσα σε ±2σ</div></div>
        <div class="stat"><div class="stat-n">99,7%</div><div class="stat-l">μέσα σε ±3σ</div></div>
        <div class="stat"><div class="stat-n">5σ</div><div class="stat-l">σχεδόν ποτέ από τύχη → ανακάλυψη</div></div></div>
      <p>Άρα όταν λέμε ότι ένα «καμπούρι» είναι 5σ πάνω από τον θόρυβο, εννοούμε ότι είναι εξαιρετικά απίθανο να το έφτιαξε η τύχη.</p>`));
    body.append(section('Πόσο σίγουρο είναι το «5σ»;', `<p>Σε μια γκαουσιανή, αν το σήμα είναι <b>5σ</b> μακριά από τον θόρυβο, η πιθανότητα να είναι απλή σύμπτωση είναι περίπου <b>1 στα 3,5 εκατομμύρια</b>. Μόνο τότε οι φυσικοί λένε «ανακάλυψη».</p>
      <div class="callout gold">🎟️ <b>Λόττο 6/49:</b> για να πιάσεις και τους 6 αριθμούς στους 49 η πιθανότητα είναι περίπου <b>1 στα 14 εκατομμύρια</b>. Δηλαδή μια σύμπτωση 5σ είναι «μόνο» ~4 φορές πιο πιθανή από το να κερδίσεις το Λόττο. Τους φυσικούς τους πείθεις <i>πολύ</i> δύσκολα. 😤</div>
      <p class="muted">Γι’ αυτό οι επιστήμονες ρωτούσαν «<b>στα πόσα σ;</b>» — είναι σαν να ρωτάς «πόσο σίγουροι είμαστε για τη μάζα του σωματιδίου Χ;»</p>`));
    const qb = api.add('<div></div>');
    api.quiz(qb, { q: 'Εμφανίζεται ένα νέο «καμπούρι» στα 2σ. Τι πρέπει να κάνουν οι φυσικοί;', opts: ['Να ανακοινώσουν ανακάλυψη!', 'Να μαζέψουν πολλά περισσότερα δεδομένα — συμπτώσεις 2σ συμβαίνουν συνέχεια', 'Να πετάξουν τα δεδομένα', 'Τίποτα, τα 2σ είναι ήδη βέβαιο'], a: 1,
      ex: 'Μια σύμπτωση 2σ συμβαίνει περίπου 1 φορά στις 40. Πολλά «καμπούρια» 2–3σ εξαφανίστηκαν όταν μαζεύτηκαν περισσότερα δεδομένα.' });
    api.code({
      title: 'significance.js — πόσα σ;',
      intro: 'Μετράμε πόσα γεγονότα πέφτουν γύρω στα 125 GeV (N) και πόσα θα περιμέναμε μόνο από θόρυβο (B). Η απλούστερη εκτίμηση της σημαντικότητας είναι το περίσσευμα διά √B.',
      code: `
function significance(N, B) {
  return (N - B) / Math.sqrt(B);
}

const B = 900;   // αναμενόμενα γεγονότα θορύβου στο παράθυρο 122–128 GeV
for (const N of [930, 960, 1000, 1050]) {
  const Z = significance(N, B);
  const verdict = Z >= 5 ? 'ΑΝΑΚΑΛΥΨΗ' : Z >= 3 ? 'ένδειξη' : 'μάλλον σύμπτωση';
  print('N =', N, '→', Z.toFixed(1) + 'σ', '(' + verdict + ')');
}`,
      onRun: () => obj.done(2),
    });

    return {
      update(dt, t) {
        sparks.update(dt);
        core.material.opacity = .6 + Math.sin(t * 8) * .25;
        if (fade > 0) { fade -= dt * .45; tracks.forEach(tr => tr.material.opacity = Math.max(0, fade) * (tr.isSprite ? .9 : 1)); }
        if (auto) { autoAcc += dt; if (autoAcc > .45) { autoAcc = 0; run(1); } }
      },
      onResize() { draw(); },
    };
  },
};
