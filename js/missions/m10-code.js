import * as THREE from 'three';
import { stars, glow, COL } from '../gfx.js';
import { acc, section } from './common.js';
import { PHOTOS } from '../photos.js';
import { h, modal } from '../ui.js';

const REVIEW = [
  { q: 'Πόσες διασταυρώσεις δεσμών γίνονται κάθε δευτερόλεπτο στον LHC — και πόσα γεγονότα κρατάει περίπου ο trigger;', opts: ['40 → 40', '40 χιλιάδες → 1', '40 εκατομμύρια → ~1.000', '1.000 → 40 εκατομμύρια'], a: 2,
    ex: 'Ο trigger πρέπει να αποφασίσει σε κλάσματα του δευτερολέπτου ποια γεγονότα αξίζει να αποθηκευτούν. Είναι από τα πιο απαιτητικά κομμάτια λογισμικού στον κόσμο.' },
  { q: 'Τι είναι το ROOT;', opts: ['Ένα λειτουργικό σύστημα', 'Το πλαίσιο ανάλυσης δεδομένων του CERN (C++, ανοιχτός κώδικας)', 'Ένα video game', 'Ο κωδικός του admin'], a: 1,
    ex: 'Το ROOT αναπτύχθηκε στο CERN και το χρησιμοποιούν φυσικοί σε όλο τον κόσμο για ανάλυση, γραφήματα και αποθήκευση δεδομένων.' },
  { q: 'Πού μπορείς να βρεις πραγματικά δεδομένα του LHC για να γράψεις τον δικό σου κώδικα ανάλυσης;', opts: ['Δεν γίνεται, είναι μυστικά', 'Μέσω του CERN Open Data portal', 'Μόνο με πτυχίο φυσικής', 'Μόνο αν μένει στη Γενεύη'], a: 1,
    ex: 'Στο opendata.cern.ch υπάρχουν πραγματικά δεδομένα και έτοιμα notebooks σε Python.' },
];

export default {
  id: 'code', color: '#38e8ff',
  title: 'Προγραμματισμός στο CERN', sub: 'Ο κώδικας πίσω από τη φυσική',
  intro: [
    { t: 'Τελευταίο κεφάλαιο: το CERN δεν είναι μόνο φυσικοί. Πίσω από κάθε σύγκρουση υπάρχει <b>κώδικας</b> — πάρα πολύς κώδικας, γραμμένος από χιλιάδες προγραμματιστές.', mood: 'happy' },
    { t: 'Χωρίς κώδικα δεν θα κινούνταν ούτε ένα πρωτόνιο, δεν θα καταγραφόταν ούτε μία σύγκρουση και δεν θα ανακαλύπταμε ποτέ το Higgs.', mood: 'think' },
    { t: 'Πάμε να δούμε τι γράφουν — και να γράψεις κι εσύ λίγο. 💻', mood: 'wow' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(14, 9, 16);
    api.orbit({ minDistance: 10, maxDistance: 34, target: new THREE.Vector3(0, 3, 0), autoRotate: true, autoRotateSpeed: .4, maxPolarAngle: Math.PI * .48 });
    scene.add(stars(1200, 140, .5));
    scene.add(new THREE.AmbientLight(0x8090ff, .5));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(6, 12, 8); scene.add(dl);

    // data centre floor + racks
    const floor = new THREE.GridHelper(30, 30, 0x4a1f25, 0x2a1316); scene.add(floor);
    const rackGeo = new THREE.BoxGeometry(1, 2.4, 1.4), rackMat = new THREE.MeshStandardMaterial({ color: 0x3a4a8c, emissive: 0x111a44, metalness: .4, roughness: .5 });
    const racks = [], ledPos = [];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 7; i++) {
      const r = new THREE.Mesh(rackGeo, rackMat);
      r.position.set((i - 3) * 1.4, 1.2, (row - 1.5) * 3); scene.add(r); racks.push(r);
      for (let k = 0; k < 8; k++) ledPos.push(r.position.x + .51, .35 + k * .27, r.position.z + (Math.random() - .5) * 1.1);
    }
    const ledGeo = new THREE.BufferGeometry(); ledGeo.setAttribute('position', new THREE.Float32BufferAttribute(ledPos, 3));
    const ledCol = new Float32Array(ledPos.length); ledGeo.setAttribute('color', new THREE.BufferAttribute(ledCol, 3));
    const leds = new THREE.Points(ledGeo, new THREE.PointsMaterial({ size: .12, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(leds);

    // the Grid: a wireframe globe the data flows out to
    const globe = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 14), new THREE.MeshBasicMaterial({ color: COL.cyan, wireframe: true, transparent: true, opacity: .25 }));
    globe.position.set(0, 9.5, 0); scene.add(globe);
    const sites = [];
    for (let i = 0; i < 24; i++) { const g = glow(COL.gold, .5, .9); g.position.copy(new THREE.Vector3().randomDirection().multiplyScalar(2.6).add(globe.position)); scene.add(g); sites.push(g); }
    api.label(new THREE.Vector3(0, 6.4, 0), 'Worldwide LHC Computing Grid', 'big');
    api.label(new THREE.Vector3(0, -.6, 6), 'Κέντρο Υπολογιστών του CERN', '');

    // data packets flying from racks to grid sites
    const packets = [];
    for (let i = 0; i < 40; i++) { const g = glow(i % 3 ? COL.cyan : COL.pink, .35, 1); g.visible = false; scene.add(g); packets.push({ g, t: 1 }); }
    const tmp = new THREE.Vector3();

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Άνοιξε τουλάχιστον 3 κάρτες στο «Ο κώδικας είναι παντού» για να δεις πού χρειάζεται λογισμικό στο CERN.",
        ok: "Από τους μαγνήτες μέχρι το Web: χωρίς κώδικα, τίποτα δεν δουλεύει." },
      { how: "Ώρα να γράψεις κώδικα «του CERN»! Στο <code>trigger.js</code> πάτα <b>▶ Τρέξε</b>. Μετά άλλαξε τη συνάρτηση <code>trigger</code> ώστε να κρατάς λιγότερα γεγονότα χωρίς να χάνεις Higgs.",
        ok: "Αυτό ακριβώς κάνουν οι προγραμματιστές των πειραμάτων — μόνο που ο δικός τους trigger αποφασίζει σε μικροδευτερόλεπτα, 40 εκατομμύρια φορές το δευτερόλεπτο." },
      { how: "Τέλος: όλα αυτά είναι ανοιχτά για όλους. Άνοιξε μια κάρτα στο «Αληθινά δεδομένα, αληθινός κώδικας» πιο κάτω.",
        ok: "Πραγματικά δεδομένα, notebooks σε Python και ο κώδικας του ROOT στο GitHub — όλα ελεύθερα. Καλό coding! 😉" },
    ]);

    body.append(section('Ο κώδικας είναι παντού', `<p>Κάθε κεφάλαιο αυτής της εφαρμογής είχε κώδικα — όπως και κάθε κομμάτι του CERN:</p>`));
    [
      ['🎛️', 'Έλεγχος επιταχυντών', 'Χιλιάδες μαγνήτες, κοιλότητες και αισθητήρες ελέγχονται από λογισμικό σε πραγματικό χρόνο. Αν κάτι πάει στραβά, ο κώδικας «πετάει» τη δέσμη με ασφάλεια σε κλάσματα του δευτερολέπτου.'],
      ['⚡', 'Trigger: το φίλτρο', 'Στον LHC γίνονται <b>40 εκατομμύρια</b> διασταυρώσεις δεσμών το δευτερόλεπτο — αδύνατον να αποθηκευτούν όλες. Ο <b>trigger</b> (υλικό + λογισμικό) αποφασίζει σε μικροδευτερόλεπτα ποια ~<b>1.000</b> αξίζει να κρατηθούν.'],
      ['🧪', 'Προσομοίωση', 'Πριν χτιστεί ένας ανιχνευτής, «χτίζεται» σε κώδικα. Το <b>Geant4</b> προσομοιώνει πώς περνούν τα σωματίδια μέσα από την ύλη — και χρησιμοποιείται και στην ιατρική και στα διαστημικά.'],
      ['📊', 'Ανάλυση δεδομένων', 'Οι φυσικοί γράφουν κώδικα σε <b>C++</b> και <b>Python</b>, με το <b>ROOT</b> (το πλαίσιο ανάλυσης του CERN, ανοιχτού κώδικα) και όλο και περισσότερο με <b>machine learning</b>. Το γράφημα του Higgs στο κεφάλαιο 07 είναι ακριβώς τέτοια ανάλυση.'],
      ['🌍', 'Το Grid', 'Τα δεδομένα μοιράζονται σε ~170 υπολογιστικά κέντρα σε 40+ χώρες, που δουλεύουν σαν ένας τεράστιος υπολογιστής. Το CERN έχει αποθηκεύσει πάνω από ένα <b>exabyte</b>.'],
      ['🌐', 'Το Web', 'Και φυσικά: ο Παγκόσμιος Ιστός γεννήθηκε εδώ, το 1989, από έναν προγραμματιστή που ήθελε να λύσει ένα πρόβλημα επικοινωνίας.'],
    ].forEach(([i, t, d]) => body.append(acc(i, t, d)));
    let openedTopics = 0;
    body.querySelectorAll('.acc').forEach(a => a.addEventListener('toggle', () => { if (a.open && !a.dataset.seen) { a.dataset.seen = 1; if (++openedTopics >= 3) obj.done(0); } }));

    body.append(api.add(`<div class="stats">
      <div class="stat"><div class="stat-n">40 εκ./s</div><div class="stat-l">διασταυρώσεις δεσμών στον LHC</div></div>
      <div class="stat"><div class="stat-n">~1.000/s</div><div class="stat-l">γεγονότα που κρατάει ο trigger</div></div>
      <div class="stat"><div class="stat-n">~170</div><div class="stat-l">υπολογιστικά κέντρα στο Grid</div></div>
      <div class="stat"><div class="stat-n">&gt; 1 EB</div><div class="stat-l">δεδομένα αποθηκευμένα (1 exabyte = 1 δισ. GB)</div></div></div>`));

    body.append(section('Γράψε τον δικό σου trigger', `<p>Ο κώδικας από κάτω φτιάχνει 1.000 προσομοιωμένα γεγονότα με δύο φωτόνια το καθένα. Λίγα από αυτά είναι Higgs (μάζα ζεύγους ≈ 125 GeV), τα υπόλοιπα θόρυβος. Άλλαξε τη συνάρτηση <code>trigger</code> ώστε να κρατάς όσο το δυνατόν λιγότερα γεγονότα, χωρίς να χάνεις τα Higgs.</p>`));
    api.code({
      title: 'trigger.js',
      code: `
// Ένα γεγονός = δύο φωτόνια: ενέργειες E1, E2 (GeV) και η γωνία μεταξύ τους.
function randomEvent() {
  if (Math.random() < 0.05) {                       // 5%: Higgs → γγ
    const E1 = 40 + Math.random() * 80, angle = 1.5 + Math.random() * 1.6;
    const E2 = 125 ** 2 / (2 * E1 * (1 - Math.cos(angle)));
    return { E1, E2, angle, higgs: true };
  }
  return { E1: 5 + Math.random() * 60, E2: 5 + Math.random() * 60, angle: Math.random() * Math.PI, higgs: false };
}

// «Αναλλοίωτη μάζα» του ζεύγους — η ίδια ποσότητα με το γράφημα του κεφαλαίου 07
const mass = e => Math.sqrt(2 * e.E1 * e.E2 * (1 - Math.cos(e.angle)));

// ✏️ Ο trigger σου: true = κράτα το γεγονός
function trigger(e) {
  return e.E1 > 20 && e.E2 > 20;
  // Δοκίμασε: return Math.abs(mass(e) - 125) < 5;
}

const events = Array.from({ length: 1000 }, randomEvent);
const kept = events.filter(trigger);
const higgsTotal = events.filter(e => e.higgs).length;
const higgsKept = kept.filter(e => e.higgs).length;
print('Κράτησες', kept.length, 'από', events.length, 'γεγονότα');
print('Higgs που κράτησες:', higgsKept, 'από', higgsTotal);`,
      onRun: () => obj.done(1),
    });

    body.append(section('Αληθινά δεδομένα, αληθινός κώδικας'));
    [
      ['📂', 'CERN Open Data', 'Στο <b>opendata.cern.ch</b> υπάρχουν <b>πραγματικά δεδομένα</b> από τα πειράματα του LHC, μαζί με έτοιμα notebooks σε Python. Μπορείς να φτιάξεις το δικό σου γράφημα του Higgs, στον υπολογιστή σου.'],
      ['🧑‍💻', 'Ανοιχτός κώδικας', 'Σχεδόν όλο το λογισμικό του CERN είναι <b>open source</b>. Το ROOT και το Geant4 είναι στο GitHub: μπορείς να διαβάσεις πώς είναι γραμμένα, να τα τρέξεις, ακόμα και να προτείνεις αλλαγές.'],
      ['🐍', 'Οι γλώσσες', '<b>Python</b> για ανάλυση δεδομένων και machine learning, <b>C++</b> για ό,τι πρέπει να τρέχει πολύ γρήγορα (trigger, προσομοιώσεις), <b>JavaScript</b> για το web — όπως αυτή η εφαρμογή. Και πολλή <b>στατιστική</b> (θυμάσαι τα 5σ του Higgs;).'],
    ].forEach(([i, t, d]) => {
      const a = acc(i, t, d); body.append(a);
      a.addEventListener('toggle', () => { if (a.open) obj.done(2); });
    });

    body.append(section('Έλεγξε τι κατάλαβες'));
    REVIEW.forEach(q => api.quiz(body, q));

    body.append(section('📸 Φωτογραφίες από το ταξίδι', PHOTOS.length
      ? `<div class="photo-grid">${PHOTOS.map(p => `<figure style="margin:0"><img src="${p.src}" alt="${p.caption || ''}" loading="lazy"></figure>`).join('')}</div>`
      : '<div class="photo-empty">📷 Οι φωτογραφίες από το ταξίδι έρχονται σύντομα.</div>'));
    body.querySelectorAll('.photo-grid img').forEach(img => img.onclick = () => modal(`<div><img src="${img.src}" alt="${img.alt}" style="width:100%;border-radius:14px"><div class="btn-row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Κλείσιμο</button></div></div>`));

    body.append(section('Συντελεστές', `<p class="muted" style="font-size:.88rem">Το περιεχόμενο βασίζεται στις παρουσιάσεις του CERN <i>«Λίγα λόγια για το CERN»</i> και <i>«Η περίφημη… Εργασία!»</i> των <b>Ν. Χαριτωνίδη</b> (CERN), <b>Ε. Κανελλάκη</b> (CERN & ΕΜΠ) και <b>Σ. Πανισκάκη</b> (CERN & Πανεπιστήμιο της Πάδοβας), Σεπτέμβριος 2026.</p>
      <p class="muted" style="font-size:.88rem">Φτιαγμένο με HTML, CSS και JavaScript· τα 3D με τη βιβλιοθήκη three.js. Η Μι είναι πρωτότυπος χαρακτήρας. Οι προσομοιώσεις είναι απλοποιημένα μοντέλα — η πραγματική φυσική είναι πιο περίπλοκη (και ακόμα πιο ενδιαφέρουσα).</p>`));

    api.hint('Σύρε για να γυρίσεις το Κέντρο Υπολογιστών');

    return {
      update(dt, t) {
        // blinking server LEDs
        for (let i = 0; i < ledCol.length; i += 3) {
          const on = Math.sin(t * (3 + (i % 7)) + i) > .2;
          ledCol[i] = on ? .2 : .02; ledCol[i + 1] = on ? 1 : .1; ledCol[i + 2] = on ? .6 : .05;
        }
        ledGeo.attributes.color.needsUpdate = true;
        globe.rotation.y += dt * .15;
        sites.forEach((s, i) => s.material.opacity = .5 + Math.sin(t * 3 + i) * .4);
        // packets: rack → grid site
        for (const p of packets) {
          if (p.t >= 1) {
            if (Math.random() < dt * 3) {
              p.from = racks[(Math.random() * racks.length) | 0].position.clone().setY(2.5);
              p.to = sites[(Math.random() * sites.length) | 0].position.clone();
              p.t = 0; p.g.visible = true;
            } else { p.g.visible = false; continue; }
          }
          p.t = Math.min(1, p.t + dt * .7);
          tmp.lerpVectors(p.from, p.to, p.t); tmp.y += Math.sin(p.t * Math.PI) * 2;
          p.g.position.copy(tmp);
        }
      },
    };
  },
};
