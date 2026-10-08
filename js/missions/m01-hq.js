import * as THREE from 'three';
import { stars, orb, glow, ring, COL } from '../gfx.js';
import { acc, section } from './common.js';

export default {
  id: 'hq', color: '#38e8ff',
  title: 'Καλώς ήρθες στο CERN', sub: 'Τι είναι και πού βρίσκεται',
  intro: [
    { t: 'Πρώτη στάση: <b>η έδρα του CERN</b>. Αυτή η ξύλινη σφαίρα είναι η <b>Σφαίρα της Επιστήμης και της Καινοτομίας</b> — ουσιαστικά το λογότυπο του CERN στην πραγματικότητα.', mood: 'happy' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(0, 4, 17);
    const ctl = api.orbit({ minDistance: 9, maxDistance: 30, autoRotate: true, autoRotateSpeed: .6, target: new THREE.Vector3(0, 2, 0) });
    scene.add(stars(1200, 120, .5));
    scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x1a0f30, 1.2));
    const sun = new THREE.DirectionalLight(0xffc890, 2.2); sun.position.set(6, 10, 8); scene.add(sun);

    // Globe of Science: wooden ribs (meridians) + rings (parallels)
    const globe = new THREE.Group(); globe.position.y = 2;
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: .65, metalness: .1, emissive: 0x2a1405 });
    for (let i = 0; i < 18; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(4, .07, 6, 64, Math.PI), wood);
      rib.rotation.y = (i / 18) * Math.PI; rib.rotation.z = Math.PI / 2; rib.position.y = 0;
      globe.add(rib);
    }
    for (let k = -3; k <= 3; k++) {
      const y = k * 1.05, r = Math.sqrt(16 - y * y);
      const p = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 6, 64), wood);
      p.rotation.x = Math.PI / 2; p.position.y = y; globe.add(p);
    }
    const core = glow(0xffb070, 7, .55); globe.add(core);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(3.9, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffa860, transparent: true, opacity: .06, depthWrite: false }));
    globe.add(shell);
    scene.add(globe);
    const floor = ring(6, .04, COL.cyan, .5); floor.position.y = -2; scene.add(floor);
    const floor2 = ring(9, .02, COL.violet, .35); floor2.position.y = -2; scene.add(floor2);

    // member-state orbs (24 members + 7 associates, per the presentation)
    const members = [];
    for (let i = 0; i < 31; i++) {
      const assoc = i >= 24;
      const o = orb(assoc ? COL.cyan : COL.gold, assoc ? .12 : .17, 5);
      const m = { o, assoc, founder: i < 12, a: (i / 31) * Math.PI * 2, tilt: (i % 3 - 1) * .35, r: assoc ? 7.6 : 6.4, sp: assoc ? .18 : .25 };
      scene.add(o); members.push(m);
    }
    const lblF = api.label(new THREE.Vector3(0, 7.4, 0), 'Ιδρυτές · 1954<small>12 χώρες, μαζί και η Ελλάδα</small>', 'big');
    lblF.hidden = true;
    api.label(new THREE.Vector3(0, -2.6, 6.2), 'Κράτη-μέλη', '');

    let founders = false;
    api.onTap(ndc => {
      const hit = api.raycast(ndc, [shell]);
      if (!hit.length) return;
      founders = !founders; lblF.hidden = !founders;
      api.sfx.zap(); api.buzz(20);
      for (const m of members) {
        const s = m.o.children[0].material, g = m.o.children[1].material;
        const c = founders ? (m.founder ? COL.pink : 0x333a55) : (m.assoc ? COL.cyan : COL.gold);
        s.color.set(c); g.color.set(c);
      }
      if (founders) obj.done(0);
    });
    api.hint('Σύρε για περιστροφή · Πάτα τη σφαίρα');

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Ας ξεκινήσουμε από τη <b>Σφαίρα</b> στο 3D. Οι φωτεινές μπάλες γύρω της είναι οι χώρες που «τρέχουν» το CERN. <b>Πάτα πάνω στη σφαίρα</b> για να δεις ποιες το ίδρυσαν.",
        ok: "Οι ροζ είναι οι 12 ιδρυτές του 1954 — ανάμεσά τους και η <b>Ελλάδα</b>! Σήμερα τα κράτη-μέλη είναι 24, και υπάρχουν και συνδεδεμένα μέλη." },
      { how: "Κατέβα λίγο πιο κάτω, στο «Οι αριθμοί». Μάντεψε πρώτα στο μυαλό σου πόσοι δουλεύουν στο CERN και μετά <b>πάτα και τις τέσσερις κάρτες</b>.",
        ok: "Πάνω από 12.500 χρήστες από όλο τον κόσμο! Και ο προϋπολογισμός; Περίπου ένας καφές τον χρόνο ανά Ευρωπαίο — μπορείς να το ελέγξεις με τον κώδικα <code>budget.js</code> πιο κάτω." },
      { how: "Τελευταίο: απάντησε στην ερώτηση <b>«Έλεγξε τι κατάλαβες»</b> στο τέλος της σελίδας.",
        ok: "Σωστά! Επόμενη στάση: πόσο μικρή είναι τελικά η ύλη." },
    ]);

    body.append(section('Τι είναι το CERN;', `
      <p><b>CERN</b> = <i>Conseil Européen pour la Recherche Nucléaire</i>, δηλαδή Ευρωπαϊκό Συμβούλιο Πυρηνικών Ερευνών.</p>
      <p>Είναι το <b>μεγαλύτερο ερευνητικό κέντρο φυσικής στον κόσμο</b>. Ιδρύθηκε το <b>1954</b> από <b>12 κράτη</b> — και <b>η Ελλάδα ήταν ιδρυτικό μέλος</b>! 🇬🇷 Σήμερα έχει <b>24 κράτη-μέλη + 7</b> συνδεδεμένα μέλη.</p>`));

    body.append(section('Πού βρίσκεται;', `
      <p>Ακριβώς πάνω στα <b>γαλλο-ελβετικά σύνορα</b>, δίπλα στη Γενεύη: η κύρια εγκατάσταση είναι στο <b>Meyrin (Ελβετία)</b> και η δεύτερη στο <b>Prévessin (Γαλλία)</b>.</p>
      <div class="callout cyan">Και ο δακτύλιος του LHC περνάει τα σύνορα. Ένα πρωτόνιο πάει «εξωτερικό» και πίσω περίπου <b>11.000 φορές το δευτερόλεπτο</b>. Χωρίς διαβατήριο. 🛂</div>`));

    const st = section('Οι αριθμοί (πάτα για να τους δεις)', `<div class="stats">
      <button class="stat tap" data-n="2600" data-pre="~"><div class="stat-n">????</div><div class="stat-l">μόνιμο προσωπικό</div></button>
      <button class="stat tap" data-n="1800" data-pre="~"><div class="stat-n">????</div><div class="stat-l">φοιτητές, ερευνητές κ.ά.</div></button>
      <button class="stat tap" data-n="12500" data-pre=">"><div class="stat-n">????</div><div class="stat-l">χρήστες: καθηγητές, φοιτητές, επισκέπτες από όλο τον κόσμο</div></button>
      <button class="stat tap" data-n="1.2" data-dec="1" data-pre="~" data-suf=" δισ. CHF"><div class="stat-n">????</div><div class="stat-l">προϋπολογισμός τον χρόνο</div></button></div>`);
    body.append(st);
    let opened = 0;
    st.querySelectorAll('.stat.tap').forEach(b => b.onclick = () => {
      if (b.classList.contains('open')) return;
      b.classList.add('open'); api.sfx.blip();
      api.countUp(b.querySelector('.stat-n'), +b.dataset.n, { dec: +(b.dataset.dec || 0), pre: b.dataset.pre || '', suf: b.dataset.suf || '' });
      if (++opened === 4) obj.done(1);
    });
    body.append(api.add(`<div class="callout gold">☕ <b>1,2 δισ. CHF ακούγεται τεράστιο;</b> Μοιρασμένο σε όλη την Ευρώπη είναι περίπου <b>ένας καφές τον χρόνο για κάθε Ευρωπαίο πολίτη</b>. Για σύγκριση: το ΑΕΠ της Ελλάδας είναι ~230 δισ. ευρώ, της Γερμανίας ~4,5 τρισ. ευρώ.</div>`));
    body.append(api.add(`<p class="muted" style="font-size:.85rem">Γενικός Διευθυντής του CERN είναι ο καθ. Mark Thomson.</p>`));

    body.append(section('Η αποστολή του CERN'));
    body.append(acc('🛠️', 'Κατασκευή μηχανών', 'Σχεδιάζει και κατασκευάζει <b>επιταχυντές</b> και <b>ανιχνευτές</b> για τη μελέτη της Φυσικής των Στοιχειωδών Σωματιδίων — και όχι μόνο!'));
    body.append(acc('🎓', 'Εκπαίδευση νέων επιστημόνων', 'Εκπαιδεύει την επόμενη γενιά: φοιτητές, μηχανικούς, προγραμματιστές (γεια 👋).'));
    body.append(acc('🔬', 'Μελέτη της ύλης στις μικρότερες διαστάσεις', 'Η σωματιδιακή φυσική ρωτά: από τι είναι φτιαγμένα όλα, στη μικρότερη δυνατή κλίμακα; Επόμενη αποστολή: πόσο μικρό είναι το «μικρό»;'));

    body.append(section('Μια μέρα στη ζωή ενός επιστήμονα στο CERN'));
    body.append(acc('💬', 'Meetings', 'Πολλά! Χιλιάδες άνθρωποι από 100+ χώρες δουλεύουν στα ίδια πειράματα, οπότε όλοι πρέπει να συνεννοούνται. Η ομαδική δουλειά είναι η πραγματική υπερδύναμη εδώ.'));
    body.append(acc('💻', 'Υπολογισμοί & κώδικας', 'Προσομοιώσεις, ανάλυση δεδομένων, γραφήματα. Οι φυσικοί γράφουν <i>πολύ</i> κώδικα.'));
    body.append(acc('⚡', 'Πειράματα με δέσμες σωματιδίων', 'Κατευθύνουν πραγματικές δέσμες πάνω σε στόχους και ανιχνευτές από το κέντρο ελέγχου.'));
    body.append(acc('⛑️', 'Επισκέψεις σε πειραματικές περιοχές', 'Κράνος στο κεφάλι και κάτω από τη γη, στις υπόγειες αίθουσες.'));
    body.append(acc('🔧', '«Μοντάρισμα» ανιχνευτών', 'Συναρμολόγηση και καλωδίωση ανιχνευτών με τα χέρια. Η φυσική θέλει και πολύ πρακτική δουλειά.'));

    api.code({
      title: 'budget.js — ο «καφές» του CERN',
      intro: 'Έλεγξε μόνος/η σου τον ισχυρισμό με τον καφέ. Άλλαξε τους αριθμούς και τρέξε τον κώδικα.',
      code: `
const budgetCHF = 1.2e9;      // προϋπολογισμός CERN τον χρόνο (1,2 δισ.)
const people = 450e6;         // περίπου όσοι ζουν στις χώρες-μέλη
const coffeeCHF = 3;          // ένας καφές στην Ευρώπη, περίπου

const perPerson = budgetCHF / people;
print('Ανά άτομο:', perPerson.toFixed(2), 'CHF τον χρόνο');
print('Δηλαδή περίπου', (perPerson / coffeeCHF).toFixed(1), 'καφές ☕');`,
    });
    const qbox = api.add('<div class="block"><h3>Έλεγξε τι κατάλαβες</h3></div>');
    api.quiz(qbox, { q: 'Το CERN ιδρύθηκε το 1954 από 12 κράτη. Ήταν η Ελλάδα ένα από αυτά;',
      opts: ['Όχι, μπήκε στα 2000', 'Ναι — η Ελλάδα είναι ιδρυτικό μέλος', 'Η Ελλάδα δεν είναι καν μέλος'], a: 1,
      ex: 'Σωστά! Η Ελλάδα είναι εκεί από την πρώτη μέρα, το 1954.' }, () => obj.done(2));

    let t0 = 0;
    return {
      update(dt, t) {
        t0 = t;
        globe.rotation.y += dt * .15;
        core.material.opacity = .45 + Math.sin(t * 2) * .1;
        for (const m of members) {
          m.a += dt * m.sp;
          m.o.position.set(Math.cos(m.a) * m.r, 2 + Math.sin(m.a * 2 + m.tilt * 5) * 1.2 + m.tilt * 2, Math.sin(m.a) * m.r);
        }
      },
    };
  },
};
