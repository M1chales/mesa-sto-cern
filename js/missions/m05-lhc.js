import * as THREE from 'three';
import { stars, orb, glow, ring, Trail, Sparks, COL } from '../gfx.js';
import { section } from './common.js';

const MP = 938.272; // proton mass, MeV
const STAGES = [
  { key: 'linac', name: 'Linac4', E: 160 },
  { key: 'psb', name: 'Booster (PSB)', E: 2000, r: 2.2, c: new THREE.Vector3(-17, 0, 21), w: .95, lap: 1.7, col: COL.green },
  { key: 'ps', name: 'Σύγχροτρο Πρωτονίων (PS)', E: 26000, r: 3.8, c: new THREE.Vector3(-13.5, 0, 16.5), w: .8, lap: 1.5, col: COL.violet },
  { key: 'sps', name: 'Υπερσύγχροτρο (SPS)', E: 450000, r: 8, c: new THREE.Vector3(-7, 0, 9), w: .7, lap: 1.35, col: COL.pink },
  { key: 'lhc', name: 'Μεγάλος Συγκρουστής Αδρονίων (LHC)', E: 6800000, r: 16, c: new THREE.Vector3(0, 0, 0), w: .6, lap: 1.2, col: COL.cyan },
];

function speedStr(keMeV) {
  if (keMeV <= 0) return '0%';
  const g = 1 + keMeV / MP;
  const oneMinusB = g > 30 ? 1 / (2 * g * g) + 1 / (8 * g ** 4) : 1 - Math.sqrt(1 - 1 / (g * g));
  const pct = oneMinusB * 100;
  const digits = Math.min(10, Math.max(1, Math.ceil(-Math.log10(pct)) + 1));
  return (100 - pct).toFixed(digits).replace('.', ',') + '% c';
}
function eStr(keMeV) {
  if (keMeV < 1000) return Math.round(keMeV) + ' MeV';
  if (keMeV < 1e6) return (keMeV / 1000).toFixed(keMeV < 1e4 ? 1 : 0).replace('.', ',') + ' GeV';
  return (keMeV / 1e6).toFixed(2).replace('.', ',') + ' TeV';
}

export default {
  id: 'lhc', color: '#5dffa6',
  title: 'Το ταξίδι ενός πρωτονίου', sub: 'Η αλυσίδα των επιταχυντών',
  world: { fov: 50 },
  intro: [
    { t: 'Ώρα για επιτάχυνση! Δεν πετάς απλώς ένα πρωτόνιο στον LHC — ανεβαίνει μια <b>αλυσίδα επιταχυντών</b>, ο καθένας μεγαλύτερος και γρηγορότερος.', mood: 'happy' },
    { t: 'Σε κάθε δακτύλιο υπάρχουν <b>κοιλότητες ραδιοσυχνοτήτων</b> (το φωτεινό κομμάτι): κάθε φορά που περνάει το πρωτόνιο, παίρνει μια «σπρωξιά». Γύρο με τον γύρο, η ενέργεια ανεβαίνει.', mood: 'wow' },
  ],
  build(api) {
    const { scene, camera } = api;
    scene.add(stars(1500, 160, .6));
    scene.fog = new THREE.FogExp2(0x0a0a0d, .008);
    const sparks = new Sparks(scene, 260, COL.gold);
    const sparks2 = new Sparks(scene, 400, COL.pink);
    const grid = new THREE.GridHelper(120, 60, 0x4a1f25, 0x2a1316); grid.position.y = -.6; scene.add(grid);

    // rings + radio-frequency cavity sections
    const zones = [];
    STAGES.forEach((s, i) => {
      if (!s.r) return;
      const r = ring(s.r, s.key === "lhc" ? .1 : .07, 0x5a2a32); r.position.copy(s.c); scene.add(r);
      const z = new THREE.Mesh(new THREE.TorusGeometry(s.r, s.key === 'lhc' ? .32 : .22, 8, 32, s.w),
        new THREE.MeshBasicMaterial({ color: s.col, transparent: true, opacity: .25 }));
      z.rotation.x = Math.PI / 2; z.rotation.z = -s.w / 2; z.position.copy(s.c); scene.add(z);
      zones[i] = z;
      api.label(new THREE.Vector3(s.c.x, 1.2 + s.r * .05, s.c.z - s.r - .6), s.name, '');
    });
    // Linac: straight line into the PSB
    const psb = STAGES[1];
    const linA = new THREE.Vector3(-30, 0, 30), linB = psb.c.clone().add(new THREE.Vector3(-psb.r, 0, 0));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([linA, linB]), new THREE.LineBasicMaterial({ color: 0x5dffa6 })));
    api.label(linA.clone().add(new THREE.Vector3(0, 1.2, 0)), 'Linac4', '');
    // four LHC experiments
    [['ATLAS', Math.PI / 2], ['CMS', -Math.PI / 2], ['ALICE', Math.PI], ['LHCb', 0.0001]].forEach(([n, a]) => {
      const p = new THREE.Vector3(Math.cos(a) * 16, 0, Math.sin(a) * 16);
      const o = orb(COL.gold, .35, 5); o.position.copy(p); scene.add(o);
      api.label(p.clone().add(new THREE.Vector3(0, 1.3, 0)), n, '');
    });

    // the proton
    const proton = orb(COL.cyan, .28, 7); scene.add(proton);
    const trail = new Trail(COL.cyan, 46); scene.add(trail.line);
    const beam2 = orb(COL.pink, .28, 7); beam2.visible = false; scene.add(beam2);
    const trail2 = new Trail(COL.pink, 46); scene.add(trail2.line);

    const INFO = [
      '<b>Linac4</b> (86 μ.): γραμμικός επιταχυντής — η αρχή όλων. Ηλεκτρικά πεδία σπρώχνουν τα σωματίδια σε ευθεία γραμμή μέχρι τα <b>160 MeV</b>.',
      '<b>Booster (PSB)</b>: τέσσερις μικροί δακτύλιοι ο ένας πάνω στον άλλο, 157 μ. περιφέρεια. Ανεβάζει τα πρωτόνια στα <b>2 GeV</b>.',
      '<b>Σύγχροτρο Πρωτονίων (PS)</b>: 628 μ., σε λειτουργία από το 1959! Ανεβάζει στα <b>26 GeV</b>.',
      '<b>Υπερσύγχροτρο (SPS)</b>: σχεδόν 7 χλμ. Ανεβάζει στα <b>450 GeV</b> και «γεμίζει» τον LHC.',
      '<b>LHC</b>: 27 χλμ. Ανεβάζει κάθε δέσμη στα <b>6,8 TeV</b> — και εδώ γίνονται οι συγκρούσεις.',
    ];
    const ACCEL_TIME = 3.2; // seconds of animation per accelerator
    let stage = 0, prog = 0, E = 0, Eshow = 0, ang = Math.PI, linT = 0;
    let mode = 'accel'; // accel | ready | transfer | collide | done
    let transfer = null, collideT = 0, collideA0 = 0, collideD = 0;
    const camPos = new THREE.Vector3(-26, 8, 40), camLook = new THREE.Vector3(-26, 0, 28);
    const camPosT = camPos.clone(), camLookT = camLook.clone();
    camera.position.copy(camPos);

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Το πρωτόνιο ξεκινά από τον <b>Linac4</b>. Δες την ενέργεια και την ταχύτητα να ανεβαίνουν. Όταν γεμίσει η μπάρα, πάτα το κουμπί κάτω από το 3D για να το στείλεις στον επόμενο επιταχυντή — μέχρι τον <b>LHC</b>.",
        ok: "6,8 TeV! Πρόσεξες; Από τον PS και μετά η ταχύτητα σχεδόν δεν αλλάζει — είναι ήδη κοντά στο φως. Αυτό που μεγαλώνει είναι η <b>ενέργεια</b>." },
      { how: "Τώρα κυκλοφορούν δύο δέσμες σε αντίθετες κατευθύνσεις. Πάτα <b>💥 Σύγκρουση</b>.",
        ok: "Μπουμ! Σε αυτή τη λάμψη η ενέργεια γίνεται ύλη (E = mc²) και γεννιούνται νέα σωματίδια. Πώς τα βλέπουμε; Αυτό είναι το επόμενο κεφάλαιο." },
      { how: "Γιατί η ταχύτητα «κολλάει» λίγο κάτω από το 100%; Τρέξε τον κώδικα <code>speed.js</code> πιο κάτω.",
        ok: "Όσο κι αν αυξάνεις την ενέργεια, το v/c πλησιάζει το 1 αλλά δεν το φτάνει ποτέ. Αυτό λέει η σχετικότητα του Αϊνστάιν." },
    ]);
    const hud = api.add(`<div class="card glow"><div class="stats" style="margin:0">
      <div class="stat"><div class="stat-n" id="p-E">0 MeV</div><div class="stat-l">ενέργεια</div></div>
      <div class="stat"><div class="stat-n" id="p-v" style="font-size:1rem">0%</div><div class="stat-l">ταχύτητα (c = φως)</div></div></div>
      <div class="ctrl-row" style="margin-top:10px"><span id="p-stage">Linac4</span><b id="p-step">1 / 5</b></div>
      <div class="meter"><div class="meter-fill" id="p-prog"></div></div>
      <p id="p-info" style="margin:.6em 0 0;font-size:.92rem"></p></div>`);
    const $E = hud.querySelector('#p-E'), $v = hud.querySelector('#p-v'), $st = hud.querySelector('#p-stage'), $step = hud.querySelector('#p-step'), $pr = hud.querySelector('#p-prog'), $info = hud.querySelector('#p-info');
    const ctrl = api.ctrl(`<button class="sbtn hot big" id="next-acc" disabled>Επιταχύνεται…</button>`);
    const btn = document.getElementById('next-acc');
    api.hint('Σύρε για να δεις από άλλη γωνία');

    function setStageText() {
      const s = STAGES[stage];
      $st.textContent = `${s.name} → ${eStr(s.E)}`;
      $step.textContent = `${stage + 1} / ${STAGES.length}`;
      $info.innerHTML = INFO[stage];
    }
    setStageText();

    function stageDone() {
      const s = STAGES[stage];
      E = s.E; mode = 'ready'; btn.disabled = false; api.sfx.good();
      if (stage === STAGES.length - 1) {
        obj.done(0);
        btn.textContent = '💥 Σύγκρουση'; beam2.visible = true;
        $st.textContent = 'Δύο δέσμες των 6,8 TeV, σε αντίθετες κατευθύνσεις';
      } else btn.textContent = `▶ Στείλ’ το ${['', 'στον Booster', 'στο PS', 'στο SPS', 'στον LHC'][stage + 1]}`;
    }
    btn.onclick = () => {
      if (mode !== 'ready') return;
      api.sfx.tap();
      if (stage === STAGES.length - 1) return startCollision();
      stage++; prog = 0; btn.disabled = true; btn.textContent = 'Επιταχύνεται…';
      const s = STAGES[stage];
      const from = proton.position.clone();
      const to = s.c.clone().add(new THREE.Vector3(-s.r, 0, 0));
      transfer = { from, to, t: 0 }; mode = 'transfer'; ang = Math.PI;
      setStageText();
    };

    function startCollision() {
      mode = 'collide'; collideT = 0; btn.disabled = true; api.sfx.zap();
      const TAU = Math.PI * 2; collideA0 = ((ang % TAU) + TAU) % TAU;
      collideD = ((Math.PI / 2 - collideA0) % TAU + TAU) % TAU + TAU;
    }

    // ---------- facts ----------
    body.append(section('Linac4 → Booster → PS → SPS → LHC', `<p>Τα αληθινά πρωτόνια κάνουν ακριβώς αυτή τη διαδρομή. Λεπτομέρεια: ο Linac4 επιταχύνει στην πραγματικότητα <b>ιόντα H⁻</b> (υδρογόνο με ένα έξτρα ηλεκτρόνιο). Και τα δύο ηλεκτρόνια <b>αφαιρούνται</b> από ένα λεπτό φύλλο στην είσοδο του Booster και μένει γυμνό πρωτόνιο.</p>`));
    body.append(section('LHC: η οθόνη στατιστικών', `<div class="stats">
      <div class="stat"><div class="stat-n">27 χλμ.</div><div class="stat-l">περιφέρεια δακτυλίου</div></div>
      <div class="stat"><div class="stat-n">100 μ.</div><div class="stat-l">κάτω από την επιφάνεια της Γης</div></div>
      <div class="stat"><div class="stat-n">−271,3 °C</div><div class="stat-l">θερμοκρασία μαγνητών. Πιο κρύο κι από το διάστημα!</div></div>
      <div class="stat"><div class="stat-n">96 τόνοι</div><div class="stat-l">υγρού ηλίου για την ψύξη</div></div>
      <div class="stat"><div class="stat-n">~1600</div><div class="stat-l">μεγάλοι υπεραγώγιμοι μαγνήτες που οδηγούν τις δέσμες</div></div>
      <div class="stat"><div class="stat-n">11.245</div><div class="stat-l">περιφορές το δευτερόλεπτο (μία ≈ 0,00009 s)</div></div>
      <div class="stat"><div class="stat-n">99,999999%</div><div class="stat-l">της ταχύτητας του φωτός</div></div>
      <div class="stat"><div class="stat-n">13,6 TeV</div><div class="stat-l">ενέργεια σύγκρουσης σήμερα (6,8 + 6,8). Σχεδιασμένος για 14 TeV.</div></div></div>
      <div class="callout gold">🦟 <b>1 TeV ≈ η κινητική ενέργεια ενός κουνουπιού που πετάει.</b> Μικρή για τον μακρόκοσμο — αλλά στριμωγμένη σε ένα πρωτόνιο, τρισεκατομμύρια φορές μικρότερο από κουνούπι, είναι τεράστια για τον μικρόκοσμο. Αυτό είναι όλο το κόλπο.</div>`));
    api.code({
      title: 'speed.js — από την ενέργεια στην ταχύτητα',
      intro: 'Έτσι υπολογίζει η εφαρμογή την ταχύτητα που βλέπεις πάνω. Άλλαξε τις ενέργειες ή πρόσθεσε δικές σου και πάτα Τρέξε (ή Ctrl+Enter).',
      code: `
const PROTON_MASS = 938.272; // MeV — η ενέργεια ηρεμίας του πρωτονίου (E = mc²)

function speed(kineticMeV) {
  const gamma = 1 + kineticMeV / PROTON_MASS;   // παράγοντας Lorentz
  const beta = Math.sqrt(1 - 1 / (gamma * gamma)); // v / c
  return beta;
}

const machines = { Linac4: 160, PSB: 2000, PS: 26000, SPS: 450000, LHC: 6800000 };
for (const [name, E] of Object.entries(machines)) {
  print(name.padEnd(7), (speed(E) * 100).toFixed(7) + '% της ταχύτητας του φωτός');
}`,
      onRun: () => obj.done(2),
    });
    const qb = api.add('<div></div>');
    api.quiz(qb, { q: 'Περίπου πόσες φορές το δευτερόλεπτο κάνει ένα πρωτόνιο τον γύρο των 27 χλμ. του LHC;', opts: ['Περίπου 11', 'Περίπου 1.100', 'Περίπου 11.000', 'Περίπου 11 εκατομμύρια'], a: 2,
      ex: '≈11.245 περιφορές το δευτερόλεπτο. Δηλαδή 300.000 χλμ. κάθε δευτερόλεπτο — πρακτικά η ταχύτητα του φωτός.' });

    const tmp = new THREE.Vector3();
    return {
      update(dt, t) {
        sparks.update(dt); sparks2.update(dt);
        const s = STAGES[stage];
        if (mode === 'accel') {
          prog = Math.min(1, prog + dt / ACCEL_TIME);
          const E0 = stage ? STAGES[stage - 1].E : 0;
          E = stage ? E0 * Math.pow(s.E / E0, prog) : s.E * prog;
          $pr.style.width = prog * 100 + '%';
          if (prog >= 1) stageDone();
        }
        // radio-frequency cavities glow as the proton passes through them
        zones.forEach((z, i) => {
          const a = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), near = Math.min(a, Math.PI * 2 - a) < (STAGES[i].w || 0) / 2;
          z.material.opacity += ((i === stage && near ? .9 : .15) - z.material.opacity) * Math.min(1, dt * 8);
        });
        Eshow += (E - Eshow) * Math.min(1, dt * 6);
        $E.textContent = eStr(Eshow); $v.textContent = speedStr(Eshow);

        if (stage === 0 && (mode === 'accel' || mode === 'ready')) {
          linT += (prog * .95 - linT) * Math.min(1, dt * 5);
          proton.position.lerpVectors(linA, linB, linT);
          camPosT.set(linA.x + (linB.x - linA.x) * linT - 2, 6, linA.z + (linB.z - linA.z) * linT + 12);
          camLookT.copy(proton.position);
        } else if (mode === 'transfer') {
          transfer.t += dt * 1.2;
          const k = Math.min(1, transfer.t), e = k * k * (3 - 2 * k);
          proton.position.lerpVectors(transfer.from, transfer.to, e).y = Math.sin(k * Math.PI) * 1.2;
          if (k >= 1) mode = 'accel';
          camLookT.copy(s.c); camPosT.set(s.c.x - s.r * .6, s.r * 1.25 + 4, s.c.z + s.r * 2 + 6);
        } else if (mode === 'accel' || mode === 'ready') {
          ang += dt * (Math.PI * 2) / (s.lap * (1 - prog * .35));
          proton.position.set(s.c.x + Math.cos(ang) * s.r, 0, s.c.z + Math.sin(ang) * s.r);
          if (beam2.visible) beam2.position.set(Math.cos(Math.PI - ang) * 16, 0, Math.sin(Math.PI - ang) * 16);
          camLookT.copy(s.c); camPosT.set(s.c.x - s.r * .6, s.r * 1.25 + 4, s.c.z + s.r * 2 + 6);
        } else if (mode === 'collide') {
          collideT += dt;
          const k = Math.min(1, collideT / 1.8), e = 1 - Math.pow(1 - k, 3);
          const a1 = collideA0 + collideD * e;
          proton.position.set(Math.cos(a1) * 16, 0, Math.sin(a1) * 16);
          beam2.position.set(Math.cos(Math.PI - a1) * 16, 0, Math.sin(Math.PI - a1) * 16);
          camLookT.set(0, 0, 16); camPosT.set(0, 6, 28);
          if (k >= 1) {
            mode = 'done'; const p = new THREE.Vector3(0, 0, 16);
            sparks.fire(p, 14, COL.gold); sparks2.fire(p, 10, COL.pink);
            proton.visible = beam2.visible = false;
            api.sfx.boom(); api.flash(); api.buzz([60, 40, 120]);
            ctrl.innerHTML = '';
            obj.done(1);
          }
        }
        if (proton.visible) trail.push(proton.position);
        if (beam2.visible) trail2.push(beam2.position);
        camPos.lerp(camPosT, Math.min(1, dt * 2)); camLook.lerp(camLookT, Math.min(1, dt * 3));
        camera.position.copy(camPos); camera.lookAt(camLook);
      },
    };
  },
};
