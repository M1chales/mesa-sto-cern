import * as THREE from 'three';
import { stars, glow, orb, COL, Sparks } from '../gfx.js';
import { acc, section } from './common.js';

const SHAPES = {
  sphere: ['Σφαίρα', () => new THREE.SphereGeometry(1.8, 32, 24)],
  cube: ['Κύβος', () => new THREE.BoxGeometry(2.8, 2.8, 2.8)],
  torus: ['Ντόνατ (τόρος)', () => new THREE.TorusGeometry(1.7, .65, 20, 48)],
  cone: ['Κώνος', () => new THREE.ConeGeometry(1.8, 3.4, 32)],
};

export default {
  id: 'blind', color: '#ff4fd8',
  title: 'Με κλειστά μάτια', sub: 'Γιατί χρειαζόμαστε επιταχυντές',
  intro: [
    { t: 'Μεγάλο πρόβλημα: τα πρωτόνια και τα κουάρκ είναι ΠΟΛΥ μικρά για να τα δεις. Κανένα μικροσκόπιο δεν φτάνει. Πώς τα μελετούν λοιπόν οι φυσικοί;', mood: 'think' },
    { t: 'Φαντάσου ότι έχεις δεμένα τα μάτια και κάτι βρίσκεται μπροστά σου. Μπορείς να του πετάς μπαλάκια και να καταλαβαίνεις πού χτυπάνε. 🎯', mood: 'happy' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(0, 3, 13);
    api.orbit({ minDistance: 7, maxDistance: 20, autoRotate: true, autoRotateSpeed: .5 });
    scene.add(stars(800, 90, .4));
    const sparks = new Sparks(scene, 80, COL.pink);

    // fog-box "blindfold"
    const box = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), new THREE.MeshBasicMaterial({ color: 0x20123a, transparent: true, opacity: .1, depthWrite: false }));
    scene.add(box);
    scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: COL.violet, transparent: true, opacity: .4 })));
    const q = api.label(new THREE.Vector3(0, 4.8, 0), '??? κρυμμένο αντικείμενο ???', 'big');

    const keys = Object.keys(SHAPES);
    let shapeKey = keys[(Math.random() * keys.length) | 0];
    const hiddenMat = new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0x401040, transparent: true, opacity: 0, depthWrite: false });
    let hidden = new THREE.Mesh(SHAPES[shapeKey][1](), hiddenMat);
    hidden.rotation.set(.35, .5, 0);
    scene.add(hidden);
    scene.add(new THREE.AmbientLight(0xffffff, .6)); const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(5, 8, 6); scene.add(dl);

    // hits are recorded in hidden's local space so they rotate with it
    const hitGroup = new THREE.Group(); hidden.add(hitGroup);
    const hitGeo = new THREE.SphereGeometry(.07, 8, 6), hitMat = new THREE.MeshBasicMaterial({ color: COL.gold });
    const shots = []; let fired = 0, hits = 0, solved = false;
    const rc = new THREE.Raycaster();

    function fire() {
      if (solved) return;
      const from = new THREE.Vector3().randomDirection().multiplyScalar(9);
      const aim = new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 2.4);
      const dir = aim.sub(from).normalize();
      rc.set(from, dir);
      hidden.updateMatrixWorld();
      const hit = rc.intersectObject(hidden, false)[0];
      const ball = orb(COL.cyan, .09, 5); ball.position.copy(from); scene.add(ball);
      shots.push({ ball, from, dir, dist: hit ? hit.distance : 20, hit, local: hit ? hidden.worldToLocal(hit.point.clone()) : null, t: 0, normal: hit ? hit.face.normal.clone().transformDirection(hidden.matrixWorld) : null });
      fired++; api.sfx.zap();
      counter.textContent = `${fired} ${fired === 1 ? "ρίψη" : "ρίψεις"} · ${hits} ${hits === 1 ? "χτύπημα" : "χτυπήματα"}`;
    }

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Στο σκοτάδι κρύβεται ένα σχήμα. <b>Πάτα πάνω στη σκηνή</b> (ή «🎯 Ρίξε») για να του ρίξεις σωματίδια. Όπου χτυπάνε μένει μια χρυσή τελεία. Όταν έχεις αρκετές, διάλεξε σχήμα στο «Η μαντεψιά σου» πιο κάτω.",
        ok: "Έτσι ακριβώς «βλέπουν» οι φυσικοί: δεν κοιτάνε το πρωτόνιο — μελετούν πώς σκορπίζουν τα σωματίδια που του ρίχνουν." },
      { how: "Γιατί όμως όλος αυτός ο κόπος; Άνοιξε και τα 4 <b>μεγάλα ερωτήματα</b> πιο κάτω.",
        ok: "Για να τα απαντήσουμε πρέπει να ξαναφτιάξουμε τις συνθήκες της Μεγάλης Έκρηξης — και αυτό γίνεται μόνο με επιταχυντές." },
      { how: "Για τον προγραμματιστή μέσα σου: στο <code>hit.js</code> πάτα <b>▶ Τρέξε</b>. Είναι ο κώδικας που αποφασίζει αν ένα σωματίδιο χτύπησε το σχήμα.",
        ok: "Η διακρίνουσα της δευτεροβάθμιας! Αν είναι αρνητική, η ευθεία δεν ακουμπά τη σφαίρα. Τα ίδια μαθηματικά χρησιμοποιούν και τα games για να ξέρουν τι «πυροβόλησες»." },
    ]);
    const counter = api.add('<div class="ctrl-row"><span>Βολές</span><b>0 ρίψεις · 0 χτυπήματα</b></div>').querySelector('b');
    api.ctrl(`<div style="display:flex;gap:8px"><button class="sbtn hot big" id="b-fire">🎯 Ρίξε</button><button class="sbtn" id="b-burst">×10</button></div>`);
    document.getElementById('b-fire').onclick = fire;
    document.getElementById('b-burst').onclick = () => { for (let i = 0; i < 10; i++) api.later(fire, i * 70); };
    api.onTap(() => fire());
    api.hint('Πάτα τη σκηνή για να ρίξεις');

    const guessBox = api.add(`<div class="card"><h3>Η μαντεψιά σου</h3><p class="muted" style="margin-top:0">Χρυσές τελείες = εκεί που χτύπησαν τα σωματίδια. Τι σχήμα κρύβεται;</p><div class="quiz-opts" id="guess"></div><div class="quiz-ex" id="guess-ex" hidden></div></div>`);
    const gEl = guessBox.querySelector('#guess');
    keys.forEach(k => {
      const b = document.createElement('button'); b.className = 'quiz-opt'; b.textContent = SHAPES[k][0];
      b.onclick = () => {
        if (fired < 12) { api.toast('Ρίξε πρώτα μερικά σωματίδια ακόμα 🎯', 'bad'); return; }
        if (k === shapeKey) {
          b.classList.add('right'); solved = true; api.sfx.win(); api.flash();
          gEl.querySelectorAll('button').forEach(x => x.disabled = true);
          hiddenMat.opacity = .55; q.el.innerHTML = `Ήταν: ${SHAPES[k][0]}!`;
          const ex = guessBox.querySelector('#guess-ex'); ex.hidden = false;
          ex.innerHTML = `Το βρήκες με <b>${fired}</b> βολές. Οι φυσικοί κάνουν ακριβώς αυτό — μόνο που έχουν δισεκατομμύρια συγκρούσεις το δευτερόλεπτο και ανιχνευτές αντί για αυτιά.`;
          obj.done(0);
        } else { b.classList.add('wrong'); b.disabled = true; api.sfx.bad(); api.buzz([30, 40, 30]); }
      };
      gEl.append(b);
    });

    body.append(section('Τα μεγάλα ερωτήματα', '<p class="muted">Άνοιξε και τα τέσσερα. Αυτά είναι τα μυστήρια που κυνηγάει τώρα το CERN.</p>'));
    const qs = [
      ['🌑', 'Τι είναι η σκοτεινή ύλη;', 'Οι γαλαξίες γυρίζουν τόσο γρήγορα που θα έπρεπε να διαλυθούν. Κάτι αόρατο τους κρατάει ενωμένους — περίπου <b>5 φορές περισσότερο από όλη την κανονική ύλη</b>. Κανείς δεν ξέρει τι είναι. Ακόμα.'],
      ['🌌', 'Τι είναι η σκοτεινή ενέργεια;', 'Το σύμπαν δεν απλώς διαστέλλεται — <b>επιταχύνεται</b>. Ό,τι το σπρώχνει λέγεται σκοτεινή ενέργεια και είναι ~70% απ’ όλα.'],
      ['⚖️', 'Γιατί υπάρχει περισσότερη ύλη από αντιύλη;', 'Η Μεγάλη Έκρηξη έπρεπε να φτιάξει ίσες ποσότητες ύλης και αντιύλης, που θα είχαν εξαφανίσει η μία την άλλη. Όμως <b>εμείς υπάρχουμε</b>, άρα κέρδισε η ύλη. Γιατί; (Το LHCb το ψάχνει.)'],
      ['🌀', 'Άλλες διαστάσεις; Παράλληλα σύμπαντα;', 'Κάποιες θεωρίες λένε ότι ο χώρος έχει περισσότερες διαστάσεις από τις 3 που βλέπουμε. Αν υπάρχουν, οι συγκρούσεις στον LHC μπορεί να αφήνουν στοιχεία.'],
    ];
    let opened = 0;
    qs.forEach(([i, t, d]) => {
      const a = acc(i, t, d); body.append(a);
      a.addEventListener('toggle', () => { if (a.open && !a.dataset.seen) { a.dataset.seen = 1; if (++opened === 4) obj.done(1); } });
    });
    body.append(api.add(`<div class="callout gold">Για να απαντηθούν, πρέπει να <b>αναπαράγουμε τις συνθήκες λίγο μετά τη Μεγάλη Έκρηξη</b> — τρελή ενέργεια σε ελάχιστο χώρο. Ο μόνος τρόπος: οι <b>επιταχυντές σωματιδίων</b>!</div>`));

    api.code({
      title: 'hit.js — χτυπάει η ακτίνα τη σφαίρα;',
      intro: 'Κάθε φορά που ρίχνεις ένα σωματίδιο, η εφαρμογή λύνει μια δευτεροβάθμια εξίσωση για να δει αν η ευθεία του τέμνει το αντικείμενο. Τα ίδια μαθηματικά (ray casting) χρησιμοποιούν και τα video games!',
      code: `
// Ακτίνα: ξεκινά από το σημείο o και κινείται προς την κατεύθυνση d (μήκους 1).
// Σφαίρα: κέντρο στο (0,0,0), ακτίνα R.
function hitsSphere(o, d, R) {
  const b = o.x * d.x + o.y * d.y + o.z * d.z;
  const c = o.x * o.x + o.y * o.y + o.z * o.z - R * R;
  const disc = b * b - c;              // διακρίνουσα
  if (disc < 0) return null;           // καμία τομή: το σωματίδιο περνάει δίπλα
  return -b - Math.sqrt(disc);         // απόσταση μέχρι το χτύπημα
}

const from = { x: -9, y: 0, z: 0 };
print('Στο κέντρο:', hitsSphere(from, { x: 1, y: 0, z: 0 }, 1.8));
print('Λοξά:', hitsSphere(from, { x: 0.98, y: 0.2, z: 0 }, 1.8));`,
      onRun: () => obj.done(2),
    });

    return {
      update(dt, t) {
        sparks.update(dt);
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.t += dt * 14;
          if (s.hit && s.t >= s.dist && !s.done) {
            s.done = true;
            const dot = new THREE.Mesh(hitGeo, hitMat);
            dot.position.copy(s.local);
            hitGroup.add(dot);
            hits++; counter.textContent = `${fired} ${fired === 1 ? "ρίψη" : "ρίψεις"} · ${hits} ${hits === 1 ? "χτύπημα" : "χτυπήματα"}`;
            sparks.fire(s.hit.point, 3, COL.gold);
            // bounce off along the reflected direction
            s.from = s.hit.point.clone(); s.dir = s.dir.clone().reflect(s.normal); s.t = 0; s.dist = 99; s.hit = null;
          }
          s.ball.position.copy(s.from).addScaledVector(s.dir, s.t);
          if (s.t > 14) { scene.remove(s.ball); s.ball.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); shots.splice(i, 1); }
        }
        hidden.rotation.y += dt * .2;
      },
    };
  },
};
