import * as THREE from 'three';
import { stars, orb, glow, COL, Sparks } from '../gfx.js';
import { section } from './common.js';

// The 17 particles of the Standard Model.
export const PARTICLES = [
  // κουάρκ
  { id: 'u', sym: 'u', name: 'Κουάρκ up', fam: 'quark', mass: '2,2 MeV', charge: '+2/3', fact: 'Δύο από αυτά υπάρχουν σε κάθε πρωτόνιο. Εσύ είσαι φτιαγμένος/η από περίπου 10²⁸ τέτοια.' },
  { id: 'c', sym: 'c', name: 'Κουάρκ charm', fam: 'quark', mass: '1,27 GeV', charge: '+2/3', fact: 'Βαρύτερος «ξάδερφος» του up. Ναι, οι φυσικοί το ονόμασαν όντως «γοητεία» (charm).' },
  { id: 't', sym: 't', name: 'Κουάρκ top', fam: 'quark', mass: '173 GeV', charge: '+2/3', fact: 'Το βαρύτερο στοιχειώδες σωματίδιο που ξέρουμε — βαρύ όσο ένα ολόκληρο άτομο χρυσού! Διασπάται πριν προλάβει να σχηματίσει άλλο σωματίδιο.' },
  { id: 'd', sym: 'd', name: 'Κουάρκ down', fam: 'quark', mass: '4,7 MeV', charge: '−1/3', fact: 'Ένα σε κάθε πρωτόνιο, δύο σε κάθε νετρόνιο.' },
  { id: 's', sym: 's', name: 'Κουάρκ strange', fam: 'quark', mass: '93 MeV', charge: '−1/3', fact: 'Λέγεται «παράξενο» γιατί τα σωματίδια που το περιέχουν ζούσαν «παράξενα» πολύ.' },
  { id: 'b', sym: 'b', name: 'Κουάρκ bottom (beauty)', fam: 'quark', mass: '4,18 GeV', charge: '−1/3', fact: 'Το «b» του LHCb! Τα σωματίδιά του μας βοηθούν να καταλάβουμε γιατί η ύλη νίκησε την αντιύλη.' },
  // λεπτόνια
  { id: 'e', sym: 'e', name: 'Ηλεκτρόνιο', fam: 'lepton', mass: '0,511 MeV', charge: '−1', fact: 'Τρέχει όλα σου τα ηλεκτρονικά. Ο Νίκος, ένας από τους φυσικούς του CERN πίσω από αυτό το ταξίδι, το λέει αγαπημένο του σωματίδιο.' },
  { id: 'mu', sym: 'μ', name: 'Μιόνιο', fam: 'lepton', mass: '105,7 MeV', charge: '−1', fact: 'Ένα «βαρύ» ηλεκτρόνιο (~200 φορές βαρύτερο) που ζει μόλις 2,2 μs. Το αγαπημένο σωματίδιο της Έλενας — και αυτή είμαι εγώ! Θα σου δείξω το κόλπο μου με τον χρόνο στο Κεφάλαιο 08.' },
  { id: 'tau', sym: 'τ', name: 'Ταυ', fam: 'lepton', mass: '1,78 GeV', charge: '−1', fact: 'Το βαρύτερο λεπτόνιο. Ζει μόλις 0,0000000000003 s.' },
  { id: 've', sym: 'ν_e', name: 'Νετρίνο ηλεκτρονίου', fam: 'lepton', mass: '< 1 eV', charge: '0', fact: 'Σωματίδιο-φάντασμα: ~60 δισεκατομμύρια από αυτά περνάνε από την άκρη του δαχτύλου σου κάθε δευτερόλεπτο, από τον Ήλιο.' },
  { id: 'vm', sym: 'ν_μ', name: 'Νετρίνο μιονίου', fam: 'lepton', mass: '< 1 eV', charge: '0', fact: 'Γεννιέται όταν διασπάται ένα μιόνιο. Περνάει μέσα από ολόκληρη τη Γη χωρίς να το καταλάβει.' },
  { id: 'vt', sym: 'ν_τ', name: 'Νετρίνο ταυ', fam: 'lepton', mass: '< 1 eV', charge: '0', fact: 'Το τελευταίο φερμιόνιο που παρατηρήθηκε απευθείας (το 2000).' },
  // μποζόνια
  { id: 'g', sym: 'g', name: 'Γλουόνιο', fam: 'boson', mass: '0', charge: '0', fact: 'Φορέας της ισχυρής αλληλεπίδρασης: η «κόλλα» (glue) που κρατάει τα κουάρκ μέσα στα πρωτόνια.' },
  { id: 'ph', sym: 'γ', name: 'Φωτόνιο', fam: 'boson', mass: '0', charge: '0', fact: 'Ένα σωματίδιο φωτός, φορέας της ηλεκτρομαγνητικής αλληλεπίδρασης. Η οθόνη σου σού πετάει τώρα εκατομμύρια.' },
  { id: 'z', sym: 'Z', name: 'Μποζόνιο Z', fam: 'boson', mass: '91,2 GeV', charge: '0', fact: 'Φορέας της ασθενούς αλληλεπίδρασης, ανακαλύφθηκε στο CERN το 1983 (Νόμπελ 1984!).' },
  { id: 'w', sym: 'W', name: 'Μποζόνιο W', fam: 'boson', mass: '80,4 GeV', charge: '±1', fact: 'Κι αυτό φορέας της ασθενούς αλληλεπίδρασης, βρέθηκε επίσης στο CERN το 1983. Ευθύνεται για τη ραδιενέργεια και για το ότι λάμπει ο Ήλιος.' },
  { id: 'h', sym: 'H', name: 'Μποζόνιο Higgs', fam: 'higgs', mass: '125 GeV', charge: '0', fact: 'Δίνει μάζα στα άλλα σωματίδια. Ανακαλύφθηκε στο CERN το 2012 — θα το ξανα-ανακαλύψεις εσύ στο Κεφάλαιο 07.' },
];
const FAM = { quark: ['Κουάρκ', COL.quark, '#b46cff'], lepton: ['Λεπτόνια', COL.lepton, '#4fd0ff'], boson: ['Φορείς αλληλεπιδράσεων', COL.boson, '#ff8a3d'], higgs: ['Higgs', COL.higgs, '#ffd25a'] };

export default {
  id: 'dex', color: '#b46cff',
  title: 'Τα 17 σωματίδια', sub: 'Το Καθιερωμένο Πρότυπο',
  intro: [
    { t: 'Τα πάντα στο σύμπαν είναι φτιαγμένα από μόλις <b>17 στοιχειώδη σωματίδια</b>. Οι φυσικοί λένε τη λίστα <b>Καθιερωμένο Πρότυπο</b>.', mood: 'happy' },
  ],
  build(api) {
    const { scene, camera, state } = api;
    camera.position.set(0, 1, 13);
    api.orbit({ minDistance: 7, maxDistance: 22, autoRotate: true, autoRotateSpeed: .4 });
    scene.add(stars(1000, 100, .45));
    const sparks = new Sparks(scene, 220, COL.gold);

    // Standard-model table in 3D: 4 columns x 4 rows, + Higgs
    const orbs = [];
    PARTICLES.forEach((p, i) => {
      let col, row;
      if (i < 12) { col = i % 3; row = Math.floor(i / 3); } // u c t / d s b / e mu tau / ve vm vt
      else if (i < 16) { col = 3; row = i - 12; } else { col = 4.2; row = 1.5; }
      const c = FAM[p.fam][1];
      const o = orb(c, .38, 4.5);
      o.userData = { p, home: new THREE.Vector3((col - 2) * 1.9, (1.5 - row) * 1.9, 0), ph: Math.random() * 6 };
      o.position.copy(o.userData.home);
      scene.add(o); orbs.push(o);
      api.label(o, p.sym.replace(/_(.)/, '<sub>$1</sub>'), 'sym');
    });

    const body = api.panel();
    const obj = api.tutor([
      { how: "Αυτοί είναι οι 17 «δομικοί λίθοι» του σύμπαντος. <b>Πάτα πάνω τους</b> στο 3D ή στον πίνακα πιο κάτω και διάβασε την κάρτα του καθενός. Χρώματα: μωβ τα κουάρκ, γαλάζια τα λεπτόνια, πορτοκαλί οι φορείς δυνάμεων, χρυσό το Higgs.",
        ok: "Τα είδες όλα! Σχεδόν οτιδήποτε γύρω σου είναι φτιαγμένο μόνο από τρία: κουάρκ up, κουάρκ down και ηλεκτρόνια." },
      { how: "Αφού τα πρωτόνια <b>δεν</b> είναι στοιχειώδη, γιατί το CERN συγκρούει πρωτόνια; Διάβασε την ενότητα πιο κάτω και απάντησε.",
        ok: "Σταθερά, σύνθετα και εύκολα στην παραγωγή από υδρογόνο. Και επειδή είναι σύνθετα, οι συγκρούσεις μάς δείχνουν τι έχουν μέσα τους." },
      { how: "Στον κώδικα <code>particles.js</code> πάτα <b>▶ Τρέξε</b>. Μετά δοκίμασε να υπολογίσεις και το φορτίο του νετρονίου (udd).",
        ok: "Πρωτόνιο: +1, νετρόνιο: 0. Με λίγες γραμμές κώδικα «έφτιαξες» σωματίδια από κουάρκ!" },
    ]);
    const caughtN = api.add('<div class="ctrl-row" style="margin-top:6px"><span>Σωματίδια που είδες</span><b id="dexn"></b></div>');
    const legend = api.add(`<div class="legend">${Object.values(FAM).map(([n, , hex]) => `<span><i style="background:${hex}"></i>${n}</span>`).join('')}</div>`);
    const grid = api.add('<div class="dex-grid"></div>');
    const detail = api.add('<div class="card dex-detail"><p class="muted">Πάτα ένα σωματίδιο για να δεις την κάρτα του.</p></div>');

    const cards = {};
    PARTICLES.forEach(p => {
      const hex = FAM[p.fam][2];
      const b = document.createElement('button');
      b.className = 'dex-card'; b.style.setProperty('--c', hex);
      b.innerHTML = `<div class="sym">${p.sym.replace(/_(.)/, '<sub>$1</sub>')}</div><div class="nm">${p.name}</div>`;
      b.onclick = () => catchP(p);
      grid.append(b); cards[p.id] = b;
    });
    const refresh = () => {
      let n = 0;
      PARTICLES.forEach(p => { const c = !!state.dex[p.id]; cards[p.id].classList.toggle('caught', c); n += c; });
      caughtN.querySelector('#dexn').textContent = `${n} / 17`;
      if (n === 17) obj.done(0);
    };
    let focus = null, focusT = 0;
    function catchP(p) {
      const o = orbs.find(x => x.userData.p === p);
      Object.values(cards).forEach(c => c.classList.remove('sel')); cards[p.id].classList.add('sel');
      const isNew = !state.dex[p.id];
      if (isNew) { state.dex[p.id] = 1; api.save(); api.sfx.blip(); sparks.fire(o.position, 6, FAM[p.fam][1]); }
      else api.sfx.tap();
      focus = o; focusT = 0;
      detail.innerHTML = `<div style="display:flex;gap:14px;align-items:center"><div style="font:900 2.4rem var(--font-display);color:${FAM[p.fam][2]};text-shadow:0 0 18px ${FAM[p.fam][2]}">${p.sym.replace(/_(.)/, '<sub>$1</sub>')}</div>
        <div><h3 style="margin:0">${p.name}</h3><span class="pill">${FAM[p.fam][0]}</span></div></div>
        <div class="stats" style="margin:10px 0 6px"><div class="stat"><div class="stat-n" style="font-size:1rem">${p.mass}</div><div class="stat-l">μάζα (σε μονάδες ενέργειας)</div></div><div class="stat"><div class="stat-n" style="font-size:1rem">${p.charge}</div><div class="stat-l">ηλεκτρικό φορτίο</div></div></div>
        <p>${p.fact}</p>`;
      refresh();
    }
    api.onTap(ndc => {
      const hit = api.raycast(ndc, orbs);
      if (hit.length) { let o = hit[0].object; while (o && !o.userData.p) o = o.parent; if (o) catchP(o.userData.p); }
    });
    api.hint('Πάτα ένα φωτεινό σωματίδιο');
    refresh();

    body.append(section('Τι συγκρούει λοιπόν το CERN;', `<p>Όχι στοιχειώδη σωματίδια — <b>πρωτόνια</b>! Είναι <b>σύνθετα</b> (φτιαγμένα από κουάρκ), <b>σταθερά</b> και πανεύκολο να τα πάρεις.</p>
      <p>Από πού; Από το απλούστερο στοιχείο: το <b>υδρογόνο</b> = 1 πρωτόνιο + 1 ηλεκτρόνιο. Βγάζεις το ηλεκτρόνιο και έχεις ένα πρωτόνιο έτοιμο για επιτάχυνση. 💥</p>
      <div class="callout cyan">Με άλλα σωματίδια είναι μπελάς: κάποια είναι <b>ασταθή</b> (διασπώνται αστραπιαία), άλλα <b>πολύ ασταθή</b>. Τα πρωτόνια απλώς… μένουν πρωτόνια.</div>`));
    const qb = api.add('<div></div>');
    api.quiz(qb, { q: 'Γιατί το CERN χρησιμοποιεί πρωτόνια;', opts: ['Είναι στοιχειώδη και δεν έχουν τίποτα μέσα τους', 'Είναι σταθερά, σύνθετα και εύκολα στην παραγωγή από υδρογόνο', 'Είναι τα μόνα σωματίδια με μάζα', 'Τρέχουν πιο γρήγορα από το φως'], a: 1,
      ex: 'Ακριβώς — και επειδή είναι σύνθετα, συγκρούοντάς τα μελετάμε και τι έχουν <i>μέσα</i> τους (και γιατί!).' }, () => obj.done(1));

    api.code({
      title: 'particles.js — τα σωματίδια ως δεδομένα',
      intro: 'Στον κώδικα, κάθε σωματίδιο είναι ένα αντικείμενο. Με αυτά υπολογίζουμε π.χ. το φορτίο ενός πρωτονίου (uud). Μπορείς να βρεις το φορτίο του νετρονίου (udd);',
      code: `
const quarks = [
  { name: 'up',   symbol: 'u', charge: +2/3 },
  { name: 'down', symbol: 'd', charge: -1/3 },
];
const charge = symbol => quarks.find(q => q.symbol === symbol).charge;

function totalCharge(recipe) {           // π.χ. 'uud'
  return [...recipe].reduce((sum, s) => sum + charge(s), 0);
}

print('Πρωτόνιο (uud):', totalCharge('uud'));
// Δοκίμασε: print('Νετρόνιο (udd):', totalCharge('udd'));`,
      onRun: () => obj.done(2),
    });

    const tmp = new THREE.Vector3();
    return {
      update(dt, t) {
        sparks.update(dt);
        focusT += dt;
        for (const o of orbs) {
          const caught = !!state.dex[o.userData.p.id];
          tmp.copy(o.userData.home); tmp.y += Math.sin(t * 1.4 + o.userData.ph) * .15;
          if (o === focus && focusT < 1.6) tmp.z += Math.sin(Math.min(1, focusT / 1.6) * Math.PI) * 2.5;
          o.position.lerp(tmp, Math.min(1, dt * 6));
          const s = caught ? 1 + Math.sin(t * 3 + o.userData.ph) * .06 : .55;
          o.scale.setScalar(s);
          o.children[1].material.opacity = caught ? .95 : .25;
        }
      },
    };
  },
};
