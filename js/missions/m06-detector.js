import * as THREE from 'three';
import { stars, glow, orb, Sparks, COL } from '../gfx.js';
import { acc, section } from './common.js';

// Detector layers (radii in scene units, end-on view along z)
const L = {
  pipe: .35, trkIn: .5, trkOut: 3.0, ecalIn: 3.2, ecalOut: 4.1, hcalIn: 4.3, hcalOut: 6.0,
  solIn: 6.2, solOut: 6.6, muIn: 7.0, muOut: 11, len: 10,
};
const TYPES = {
  electron: { name: 'Ηλεκτρόνιο', charge: -1, stop: (L.ecalIn + L.ecalOut) / 2, dep: 'ecal', color: 0x5dffa6, why: 'Καμπύλη τροχιά (έχει φορτίο) και σταματάει στο <b>ηλεκτρομαγνητικό θερμιδόμετρο</b>.' },
  photon:   { name: 'Φωτόνιο', charge: 0, stop: (L.ecalIn + L.ecalOut) / 2, dep: 'ecal', color: 0xffd25a, why: 'Καμία τροχιά (δεν έχει φορτίο!) αλλά μεγάλη «πιτσιλιά» στο <b>ηλεκτρομαγνητικό θερμιδόμετρο</b>.' },
  pion:     { name: 'Φορτισμένο αδρόνιο (πιόνιο)', charge: 1, stop: (L.hcalIn + L.hcalOut) / 2, dep: 'hcal', color: 0xff8a3d, why: 'Καμπύλη τροχιά, περνάει το ECAL και σταματάει στο <b>αδρονικό θερμιδόμετρο</b>.' },
  neutron:  { name: 'Ουδέτερο αδρόνιο (νετρόνιο)', charge: 0, stop: (L.hcalIn + L.hcalOut) / 2, dep: 'hcal', color: 0x4f8bff, why: 'Καμία τροχιά, τίποτα στο ECAL, όλη η ενέργεια στο <b>αδρονικό θερμιδόμετρο</b>.' },
  muon:     { name: 'Μιόνιο', charge: -1, stop: L.muOut + 1, dep: 'muon', color: 0xff4fd8, why: 'Περνάει από <b>τα πάντα</b> και ανάβει τους εξωτερικούς θαλάμους μιονίων. Τα μιόνια δύσκολα σταματάνε! 😎' },
};

export default {
  id: 'detector', color: '#ffd25a',
  title: 'Πώς «βλέπουμε» τα σωματίδια', sub: 'Ο ανιχνευτής-κρεμμύδι',
  intro: [
    { t: 'Όταν συγκρούονται πρωτόνια, πετάγονται εκατοντάδες νέα σωματίδια. Για να τα δει, το CERN χτίζει <b>ανιχνευτές</b> μεγάλους σαν καθεδρικούς ναούς, γύρω από το σημείο σύγκρουσης.', mood: 'wow' },
    { t: 'Δουλεύουν σαν <b>κρεμμύδι</b>: στρώση πάνω σε στρώση, κάθε μία πιάνει διαφορετικά σωματίδια. Το πού σταματάει ένα σωματίδιο σου λέει τι είναι.', mood: 'happy' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(9, 6, 17);
    api.orbit({ minDistance: 8, maxDistance: 32, target: new THREE.Vector3(0, 0, 0) });
    scene.add(stars(900, 120, .45));
    scene.add(new THREE.AmbientLight(0xffffff, .55));
    const dl = new THREE.DirectionalLight(0xffffff, 1.8); dl.position.set(8, 10, 12); scene.add(dl);
    const sparks = new Sparks(scene, 120, COL.gold);

    const det = new THREE.Group(); scene.add(det);
    // cut-away cylinders: open on the front-right quarter so you can see inside
    const cut = Math.PI * 1.5;
    function shell(r0, r1, color, op, name) {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, roughness: .5, metalness: .2, emissive: color, emissiveIntensity: .12 });
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, L.len, 64, 1, true, Math.PI, cut), mat);
      outer.rotation.x = Math.PI / 2; g.add(outer);
      // end cap (front face) as a ring sector
      const cap = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64, 1, Math.PI * .5, cut), mat.clone());
      cap.material.opacity = Math.min(.85, op * 2.6); cap.position.z = L.len / 2; g.add(cap);
      g.userData = { mat, cap: cap.material, base: op, name };
      det.add(g); return g;
    }
    const layers = {
      tracker: shell(L.trkIn, L.trkOut, 0x38e8ff, .08, 'Ιχνηλάτης'),
      ecal: shell(L.ecalIn, L.ecalOut, 0x5dffa6, .2, 'EM calorimeter'),
      hcal: shell(L.hcalIn, L.hcalOut, 0xff8a3d, .2, 'Hadron calorimeter'),
      sol: shell(L.solIn, L.solOut, 0xc8d2ff, .35, 'Solenoid magnet'),
    };
    // muon stations interleaved with iron
    const muonSt = [];
    [7.4, 8.8, 10.2].forEach((r, i) => {
      muonSt.push(shell(r - .25, r + .25, 0xff4fd8, .22, 'Muon chambers'));
      if (i < 2) shell(r + .35, r + 1.05, 0x6b7180, .14, 'Iron yoke');
    });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(L.pipe, L.pipe, L.len * 1.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: .35, side: THREE.DoubleSide }));
    pipe.rotation.x = Math.PI / 2; det.add(pipe);
    const ip = orb(COL.gold, .18, 8); ip.position.z = L.len / 2 + .02; det.add(ip);

    const lblAt = (r, a, txt) => api.label(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, L.len / 2 + .2), txt, '');
    lblAt(1.8, -Math.PI * .25, 'Ιχνηλάτης'); lblAt(3.65, -Math.PI * .35, 'ECAL'); lblAt(5.15, -Math.PI * .42, 'HCAL');
    lblAt(6.4, -Math.PI * .27, 'Μαγνήτης'); lblAt(9.5, -Math.PI * .4, 'Θάλαμοι μιονίων');

    // ---------- event generation ----------
    const evGroup = new THREE.Group(); scene.add(evGroup);
    let anim = null;
    function clearEvent() {
      evGroup.children.slice().forEach(c => { evGroup.remove(c); c.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); });
      Object.values(layers).concat(muonSt).forEach(g => { g.userData.mat.emissiveIntensity = .12; g.userData.cap.opacity = Math.min(.85, g.userData.base * 2.6); });
    }
    function makePath(type) {
      const T = TYPES[type];
      const a0 = Math.random() * Math.PI * 2;
      const pts = [];
      const p = new THREE.Vector2(0, 0), d = new THREE.Vector2(Math.cos(a0), Math.sin(a0));
      const R = 5 + Math.random() * 6; // curvature radius inside solenoid
      const sgn = T.charge * (Math.random() < .5 ? 1 : -1) || 0;
      for (let s = 0; s < 600; s++) {
        const r = p.length();
        if (r >= T.stop) break;
        let k = 0;
        if (sgn) k = r < L.solOut ? sgn / R : -sgn / (R * 2.2); // field flips outside the solenoid
        d.rotateAround(new THREE.Vector2(), k * .05).normalize();
        p.addScaledVector(d, .05);
        pts.push(new THREE.Vector3(p.x, p.y, L.len / 2 + .05));
      }
      return pts;
    }
    function showEvent(type) {
      clearEvent();
      const T = TYPES[type];
      const pts = makePath(type);
      const visible = pts.filter(v => {
        const r = Math.hypot(v.x, v.y);
        if (T.charge === 0) return false;              // neutral: no track at all
        if (type === 'muon') return r < L.trkOut || (r > L.muIn); // track in tracker + muon system
        return r < L.trkOut;                            // tracks only in the tracker
      });
      const geo = new THREE.BufferGeometry().setFromPoints(visible.length ? visible : [new THREE.Vector3()]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: T.color, transparent: true, depthTest: false }));
      line.renderOrder = 10; evGroup.add(line);
      const end = pts[pts.length - 1];
      // energy deposit
      const dep = glow(T.color, T.dep === 'muon' ? 0 : 2.2, .95); dep.position.copy(end); dep.renderOrder = 11; dep.material.depthTest = false;
      if (T.dep !== 'muon') evGroup.add(dep);
      // muon chamber hits
      const hitsM = [];
      if (type === 'muon') pts.forEach((v, i) => {
        if (!i) return;
        const r0 = Math.hypot(pts[i - 1].x, pts[i - 1].y), r = Math.hypot(v.x, v.y);
        [7.4, 8.8, 10.2].forEach(rs => { if (r0 < rs && r >= rs) { const o = glow(T.color, 1.1, 1); o.position.copy(v); o.material.depthTest = false; o.renderOrder = 11; evGroup.add(o); hitsM.push(o); } });
      });
      geo.setDrawRange(0, 0);
      dep.scale.setScalar(.001); hitsM.forEach(o => o.visible = false);
      anim = { line, geo, n: visible.length, t: 0, dep, depSize: 2.2, hitsM, type, end };
      api.sfx.zap();
      sparks.fire(new THREE.Vector3(0, 0, L.len / 2), 3, COL.gold);
    }

    // ---------- game state ----------
    const order = ['electron', 'photon', 'pion', 'neutron', 'muon'];
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    order.push(...['muon', 'photon', 'electron'].sort(() => Math.random() - .5));
    let round = 0, score = 0, answered = false;

    const body = api.panel();
    const obj = api.tutor([
      { how: "Ένα σωματίδιο βγαίνει από το κέντρο. Κοίτα: άφησε <b>γραμμή</b> (τροχιά); Σε ποιο στρώμα <b>σταμάτησε</b>; Διάλεξε τι είναι στην κάρτα «Σωματίδιο» πιο κάτω και πάτα «Επόμενο σωματίδιο». Βρες σωστά 5.",
        ok: "Ξέρεις πια να διαβάζεις έναν ανιχνευτή! Τροχιά = έχει φορτίο. Το στρώμα όπου σταματά = τι είδους σωματίδιο είναι." },
      { how: "Γνώρισε τα 4 μεγάλα πειράματα: άνοιξε τις κάρτες ATLAS, CMS, ALICE και LHCb πιο κάτω.",
        ok: "Δύο «γενικοί» ανιχνευτές (ATLAS, CMS) που ψάχνουν τα πάντα, και δύο ειδικοί (ALICE, LHCb)." },
      { how: "Στο <code>identify.js</code> λείπει μια περίπτωση. Τρέξε τον κώδικα και δες ποιο γεγονός βγαίνει «άγνωστο».",
        ok: "Το δεύτερο γεγονός (χωρίς τροχιά, μόνο ECAL) είναι φωτόνιο. Συμπλήρωσε το TODO και τρέξε ξανά!" },
    ]);
    const game = api.add(`<div class="card glow"><div class="ctrl-row"><span id="d-round">Σωματίδιο 1</span><b id="d-score">0 σωστές</b></div>
      <p class="muted" id="d-q" style="margin:.4em 0 .7em">Κοίτα το 3D. Τι μόλις πετάχτηκε;</p>
      <div class="quiz-opts" id="d-opts"></div><div class="quiz-ex" id="d-ex" hidden></div>
      <div class="btn-row"><button class="btn btn-sm" id="d-replay">↻ Ξανά</button><button class="btn btn-primary btn-sm" id="d-next" hidden>Επόμενο σωματίδιο ▶</button></div></div>`);
    const $opts = game.querySelector('#d-opts'), $ex = game.querySelector('#d-ex'), $next = game.querySelector('#d-next');
    Object.entries(TYPES).forEach(([k, T]) => {
      const b = document.createElement('button'); b.className = 'quiz-opt'; b.dataset.k = k;
      b.innerHTML = `<span style="color:#${T.color.toString(16).padStart(6, '0')}">●</span> ${T.name}`;
      b.onclick = () => answer(k, b); $opts.append(b);
    });
    function answer(k, b) {
      if (answered) return;
      const cur = order[round % order.length];
      if (k === cur) {
        answered = true; score++; b.classList.add('right'); api.sfx.good(); api.buzz(20);
        $ex.innerHTML = `✔ ${TYPES[cur].why}`; $ex.hidden = false; $next.hidden = false;
        game.querySelector('#d-score').textContent = `${score} ${score === 1 ? 'σωστή' : 'σωστές'}`;
        if (score === 5) obj.done(0);
      } else { b.classList.add('wrong'); api.sfx.bad(); api.buzz([30, 40, 30]); $ex.innerHTML = 'Όχι ακριβώς — κοίτα <b>πού</b> σταμάτησε και αν άφησε τροχιά.'; $ex.hidden = false; }
    }
    function nextRound() {
      answered = false; $ex.hidden = true; $next.hidden = true;
      $opts.querySelectorAll('button').forEach(b => { b.classList.remove('right', 'wrong'); b.disabled = false; });
      game.querySelector('#d-round').textContent = `Σωματίδιο ${round + 1}`;
      showEvent(order[round % order.length]);
    }
    $next.onclick = () => { round++; nextRound(); };
    game.querySelector('#d-replay').onclick = () => showEvent(order[round % order.length]);
    api.hint('Σύρε για να γυρίσεις τον ανιχνευτή');

    body.append(section('Σκονάκι: το μοντέλο του «κρεμμυδιού»', `
      <p><b style="color:var(--cyan)">Ιχνηλάτης (tracker)</b> — τα φορτισμένα σωματίδια αφήνουν ίχνη. Ένας τεράστιος <b>υπεραγώγιμος σωληνοειδής μαγνήτης</b> τα καμπυλώνει: το πόσο στρίβουν δείχνει την ορμή και το φορτίο τους.</p>
      <p><b style="color:var(--green)">Ηλεκτρομαγνητικό θερμιδόμετρο (ECAL)</b> — σταματά <b>ηλεκτρόνια</b> και <b>φωτόνια</b> και μετρά την ενέργειά τους.</p>
      <p><b style="color:#ff8a3d">Αδρονικό θερμιδόμετρο (HCAL)</b> — σταματά τα <b>αδρόνια</b> (πιόνια, πρωτόνια, νετρόνια…).</p>
      <p><b style="color:var(--pink)">Θάλαμοι μιονίων</b> — η πιο εξωτερική στρώση. Μόνο τα <b>μιόνια</b> φτάνουν ως εδώ.</p>
      <p class="muted">Και τα νετρίνα; Φεύγουν χωρίς να ακουμπήσουν τίποτα. Τα καταλαβαίνουμε μόνο ως <b>ενέργεια που λείπει</b>.</p>`));

    body.append(section('Τα 4 μεγάλα πειράματα του LHC', '<p class="muted">Άνοιξε και τα τέσσερα.</p>'));
    let opened = 0;
    [
      ['🟣', 'ATLAS', 'Ο <b>μεγαλύτερος</b> ανιχνευτής του LHC: 46 μ. μήκος, 25 μ. ύψος. Γενικός ανιχνευτής, φτιαγμένος για να πιάνει το μεγαλύτερο «εύρος» φυσικής. Συν-ανακάλυψε το Higgs το 2012.'],
      ['🟡', 'CMS', 'Compact Muon Solenoid. «Συμπαγής», αλλά ζυγίζει <b>14.000 τόνους</b> — περισσότερο κι από τον Πύργο του Άιφελ! Κι αυτός γενικός ανιχνευτής, κι αυτός συν-ανακάλυψε το Higgs.'],
      ['🟢', 'ALICE', 'Συγκρούει <b>ιόντα μολύβδου</b> αντί για πρωτόνια και φτιάχνει <b>πλάσμα κουάρκ-γλουονίων</b>: τη «σούπα» που ήταν το σύμπαν ένα εκατομμυριοστό του δευτερολέπτου μετά τη Μεγάλη Έκρηξη.'],
      ['🔵', 'LHCb', 'Ειδικεύεται στα <b>κουάρκ beauty (b)</b> για να μελετήσει τις διαφορές <b>ύλης-αντιύλης</b> — γιατί υπάρχει οτιδήποτε;'],
    ].forEach(([i, t, d]) => {
      const a = acc(i, t, d); body.append(a);
      a.addEventListener('toggle', () => { if (a.open && !a.dataset.seen) { a.dataset.seen = 1; if (++opened === 4) obj.done(1); } });
    });
    body.append(api.add(`<div class="callout cyan">ATLAS & CMS είναι <b>γενικοί</b> ανιχνευτές (βρες τα πάντα!). ALICE & LHCb είναι πιο <b>ειδικευμένα</b> πειράματα. Και δεν είναι τα μόνα πειράματα του CERN — δες το Κεφάλαιο 09.</div>`));

    api.code({
      title: 'identify.js — ο αναγνωριστής σωματιδίων',
      intro: 'Τα πειράματα κάνουν ακριβώς αυτό που έκανες, αλλά με κώδικα, για εκατομμύρια σωματίδια το δευτερόλεπτο. Εδώ είναι μια απλή εκδοχή. Λείπει το φωτόνιο — μπορείς να το προσθέσεις;',
      code: `
// Ποια στρώματα του ανιχνευτή «άναψαν»;
function identify({ track, ecal, hcal, muonChambers }) {
  if (muonChambers) return 'μιόνιο';
  if (track && ecal && !hcal) return 'ηλεκτρόνιο';
  if (track && hcal) return 'φορτισμένο αδρόνιο (π.χ. πιόνιο)';
  if (!track && hcal) return 'ουδέτερο αδρόνιο (π.χ. νετρόνιο)';
  // TODO: χωρίς τροχιά, μόνο ECAL → ;
  return 'άγνωστο 🤔';
}

const events = [
  { track: true,  ecal: true,  hcal: false, muonChambers: false },
  { track: false, ecal: true,  hcal: false, muonChambers: false },
  { track: true,  ecal: false, hcal: false, muonChambers: true  },
  { track: false, ecal: false, hcal: true,  muonChambers: false },
];
events.forEach((e, i) => print('Γεγονός', i + 1, '→', identify(e)));`,
      onRun: () => obj.done(2),
    });

    api.later(nextRound, 600);

    return {
      afterIntro() { if (anim) showEvent(order[round % order.length]); },
      update(dt, t) {
        sparks.update(dt);
        ip.children[1].material.opacity = .6 + Math.sin(t * 5) * .3;
        if (anim) {
          anim.t += dt;
          const k = Math.min(1, anim.t / 1.1);
          anim.geo.setDrawRange(0, Math.floor(anim.n * k));
          if (k >= 1) {
            const kk = Math.min(1, (anim.t - 1.1) / .3);
            if (anim.type !== 'muon') anim.dep.scale.setScalar(anim.depSize * (kk + Math.sin(t * 6) * .08 * kk));
            const T = TYPES[anim.type];
            const lay = T.dep === 'ecal' ? [layers.ecal] : T.dep === 'hcal' ? [layers.hcal] : muonSt;
            lay.forEach(g => { g.userData.mat.emissiveIntensity = .12 + kk * .9; g.userData.cap.opacity = .85; });
          }
          anim.hitsM.forEach((o, i) => o.visible = anim.t > .7 + i * .15);
        }
      },
    };
  },
};
