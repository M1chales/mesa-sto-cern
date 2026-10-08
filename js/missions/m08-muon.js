import * as THREE from 'three';
import { stars, glow, orb, ring, Sparks, COL } from '../gfx.js';
import { section } from './common.js';

const CTAU = .66;     // km (c × 2.2 μs)
const H = 10;         // km, creation height (1 unit = 1 km)
const VIS = 4.2;      // visual speed, km per second of animation

const gammaOf = b => 1 / Math.sqrt(1 - b * b);

export default {
  id: 'muon', color: '#ff4fd8',
  title: 'Το μιόνιο και ο χρόνος', sub: 'Λύγισε τον χρόνο με τον Αϊνστάιν',
  intro: [
    { t: 'Η σειρά μου να λάμψω. ✨ Είμαι ένα <b>μιόνιο</b>: σαν ηλεκτρόνιο, αλλά ~200 φορές βαρύτερο. Αλληλεπιδρώ ΑΣΘΕΝΩΣ με την ύλη, οπότε περνάω σχεδόν από τα πάντα.', mood: 'smug' },
    { t: 'Πρόβλημα: ζω μόνο <b>2,2 μικροδευτερόλεπτα</b>. Τα μιόνια γεννιούνται ~10 χλμ. ψηλά, όταν η κοσμική ακτινοβολία χτυπά την ατμόσφαιρα. Ακόμα και με την ταχύτητα του φωτός, θα πέθαινα μετά από ~660 μ.', mood: 'think' },
    { t: 'Κι όμως, οι ανιχνευτές στο έδαφος πιάνουν ~100 από εμάς ανά τετραγωνικό μέτρο <b>κάθε δευτερόλεπτο</b>. Πώς;! Άναψε τη <b>λειτουργία Αϊνστάιν</b> και θα δεις.', mood: 'wow' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(11, 6, 15);
    api.orbit({ minDistance: 9, maxDistance: 30, target: new THREE.Vector3(0, 5, 0), maxPolarAngle: Math.PI * .58 });
    scene.add(stars(1600, 130, .55));

    // atmosphere column with vertical gradient
    const geo = new THREE.CylinderGeometry(5, 5, H, 48, 20, true);
    const col = new Float32Array(geo.attributes.position.count * 3);
    const top = new THREE.Color(0x0a0f3a), bot = new THREE.Color(0x2a6dff);
    for (let i = 0; i < geo.attributes.position.count; i++) { const y = geo.attributes.position.getY(i) / H + .5; const c = bot.clone().lerp(top, y); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const atm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
    atm.position.y = H / 2; scene.add(atm);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ color: 0x0d2a1f }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const gridG = new THREE.PolarGridHelper(9, 12, 6, 64, 0x1f5a40, 0x163d2d); gridG.position.y = .01; scene.add(gridG);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3, .15, 3), new THREE.MeshBasicMaterial({ color: COL.cyan, transparent: true, opacity: .55 }));
    plate.position.y = .08; scene.add(plate);
    const plateGlow = glow(COL.cyan, 6, 0); plateGlow.position.y = .3; scene.add(plateGlow);
    const ceiling = ring(5, .03, COL.violet, .7); ceiling.position.y = H; scene.add(ceiling);
    // altitude markers
    [[10, '10 χλμ. · γέννηση μιονίων'], [5, '5 χλμ.'], [CTAU, '0,66 χλμ.']].forEach(([y, t]) => {
      api.label(new THREE.Vector3(-5.4, y, 0), t, y === 10 ? 'big' : '');
    });
    const ctauRing = ring(5, .02, COL.red, .6); ctauRing.position.y = H - CTAU; scene.add(ctauRing);
    const ctauLbl = api.label(new THREE.Vector3(2.4, H - CTAU, 3.5), 'Κλασική εμβέλεια: 660 μ.', '');
    api.label(new THREE.Vector3(0, -.5, 3), 'Ανιχνευτής εδάφους', '');

    // muon pool
    const N = 70;
    const pool = [];
    for (let i = 0; i < N; i++) {
      const s = glow(COL.pink, .9, 1); s.scale.set(.5, 1.4, 1); s.visible = false; scene.add(s);
      pool.push({ s, alive: false, y: 0, d: 0 });
    }
    const pops = [0, 1, 2, 3].map(() => new Sparks(scene, 24, COL.gold));
    let popI = 0;
    const showers = [0, 1, 2].map(() => { const g = glow(0xffffff, 2, 0); scene.add(g); return g; });
    let showerI = 0;

    let einstein = false, beta = .9995, spawned = 0, reached = 0, decayed = 0, acc = 0;
    function expected() { const g = einstein ? gammaOf(beta) : 1; return Math.exp(-H / (g * beta * CTAU)); }
    function spawn() {
      const m = pool.find(p => !p.alive); if (!m) return;
      const g = einstein ? gammaOf(beta) : 1;
      m.alive = true; m.y = H; m.d = -Math.log(1 - Math.random()) * g * beta * CTAU;
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 4.3;
      m.x = Math.cos(a) * r; m.z = Math.sin(a) * r; m.dx = (Math.random() - .5) * .08; m.dz = (Math.random() - .5) * .08;
      m.s.visible = true; m.s.position.set(m.x, H, m.z);
      spawned++;
      const sh = showers[showerI++ % 3]; sh.position.set(m.x, H + .1, m.z); sh.material.opacity = .9;
    }

    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Ξεκίνα με ένα ερώτημα: ένα μιόνιο ζει 2,2 μs και τρέχει σχεδόν με την ταχύτητα του φωτός. Πόσο μακριά φτάνει; Απάντησε στην ερώτηση πιο κάτω.",
        ok: "660 μέτρα. Μα γεννιούνται 10 χλμ. ψηλά! Δες στο 3D: χωρίς σχετικότητα, σχεδόν κανένα δεν φτάνει στο έδαφος." },
      { how: "Τώρα πάτα <b>🧠 Λειτουργία Αϊνστάιν</b> κάτω από το 3D και δες πόσα μιόνια φτάνουν στον ανιχνευτή εδάφους. Μπορείς να αλλάξεις και την ταχύτητα.",
        ok: "Τώρα τα περισσότερα φτάνουν! Για εμάς, το «ρολόι» του μιονίου πάει πιο αργά κατά έναν παράγοντα γ." },
      { how: "Το ίδιο ισχύει και για ανθρώπους. Στο «παράδοξο των διδύμων» πιο κάτω, βάλε ταχύτητα <b>0,98c</b> και δες πόσο χρονών γυρίζει ο Β.",
        ok: "Ο Β είναι 26 και ο Α 50! Και δεν είναι επιστημονική φαντασία — το μετράμε κάθε μέρα με τα μιόνια." },
      { how: "Τελευταίο: τρέξε το <code>lorentz.js</code> για να δεις πώς υπολογίζεται το γ.",
        ok: "Όσο πιο κοντά στο 1 το v/c, τόσο πιο γρήγορα μεγαλώνει το γ — και τόσο πιο μακριά φτάνει το μιόνιο." },
    ]);

    const lab = api.add(`<div class="card glow">
      <div class="btn-row" style="margin-top:0"><button class="btn" id="ein">🧠 Λειτουργία Αϊνστάιν: OFF</button></div>
      <div class="ctrl"><div class="ctrl-row"><span>Ταχύτητα μιονίου</span><b id="vb"></b></div><input type="range" id="vs" min="0" max="1" step="0.001" value="0.6"></div>
      <div class="stats" style="margin:6px 0 0">
        <div class="stat"><div class="stat-n" id="m-g">1</div><div class="stat-l">παράγοντας «τεντώματος» χρόνου γ (παράγοντας Lorentz)</div></div>
        <div class="stat"><div class="stat-n" id="m-r">0%</div><div class="stat-l">έφτασαν στο έδαφος (<span id="m-n">0</span> μιόνια)</div></div>
        <div class="stat"><div class="stat-n" id="m-life" style="font-size:1rem">2,2 μs</div><div class="stat-l">χρόνος ζωής όπως τον βλέπουμε από το έδαφος</div></div>
        <div class="stat"><div class="stat-n" id="m-exp" style="font-size:1rem">0%</div><div class="stat-l">σύμφωνα με τη θεωρία θα φτάσουν</div></div></div></div>`);
    const $ = s => lab.querySelector(s);
    const vs = $('#vs');
    function readSpeed() { const gm = 7 * Math.pow(10, +vs.value); beta = Math.sqrt(1 - 1 / (gm * gm)); }
    function refresh() {
      readSpeed();
      const g = einstein ? gammaOf(beta) : 1;
      $('#vb').textContent = (beta * 100).toFixed(beta > .9999 ? 4 : 3).replace('.', ',') + '% c';
      $('#m-g').textContent = einstein ? g.toFixed(1).replace('.', ',') : '1 (off)';
      $('#m-life').textContent = (2.2 * g).toFixed(g > 10 ? 0 : 1).replace('.', ',') + ' μs';
      const e = expected();
      $('#m-exp').textContent = e < .001 ? '≈ 0%' : (e * 100).toFixed(0) + '%';
      $('#ein').textContent = `🧠 Λειτουργία Αϊνστάιν: ${einstein ? 'ON' : 'OFF'}`;
      $('#ein').classList.toggle('btn-gold', einstein);
      ctauRing.position.y = Math.max(0, H - g * beta * CTAU);
      ctauLbl.target = new THREE.Vector3(2.4, ctauRing.position.y, 3.5);
      ctauLbl.el.textContent = einstein ? `Μέση εμβέλεια: ${(g * beta * CTAU).toFixed(1).replace('.', ',')} χλμ.` : 'Κλασική εμβέλεια: 660 μ.';
    }
    function resetCount() { spawned = reached = decayed = 0; }
    $('#ein').onclick = () => { einstein = !einstein; resetCount(); refresh(); api.sfx.zap(); api.buzz(20); if (einstein) api.flash(); };
    vs.oninput = () => { resetCount(); refresh(); };
    refresh();

    body.append(section('Πρώτο ερώτημα'));
    const qa = api.add('<div></div>');
    api.quiz(qa, { q: 'Ένα μιόνιο ζει 2,2 μs και κινείται σχεδόν με c = 300.000 km/s. Πόση απόσταση μπορεί να διανύσει (κλασική σχέση s = c·t);', opts: ['66 μ.', '660 μ.', '6,6 χλμ.', '66 χλμ.'], a: 1,
      ex: 's = (3×10⁸ m/s) × (2,2×10⁻⁶ s) = <b>660 μ.</b> Όμως τα μιόνια γεννιούνται ~10 χλμ. ψηλά — 15 φορές πιο μακριά! Κλασικά, μόνο περίπου 1 στα 3 εκατομμύρια θα έφτανε κάτω.' }, () => obj.done(0));
    body.append(api.add(`<div class="callout">🧪 <b>Το πείραμα λέει άλλα:</b> ένας οριζόντιος ανιχνευτής στη Γη μετράει περίπου <b>100 μιόνια ανά m² κάθε δευτερόλεπτο</b>. Δεν μπορούν να πάνε πιο γρήγορα (είναι ήδη σχεδόν στην ταχύτητα του φωτός!). Τι φταίει λοιπόν;</div>`));
    body.append(section('Τελικά τι συμβαίνει;', `<p>Ο χρόνος, όταν κάτι κινείται κοντά στην ταχύτητα του φωτός, <b>«διαστέλλεται»</b> για αυτόν που κοιτάζει απ’ έξω. Ο παράγοντας λέγεται <b>γ</b> (<b>παράγοντας Lorentz</b>):</p>
      <div class="formula">γ = 1 / √(1 − v²/c²)</div>
      <p>Για ένα μιόνιο στο 99,95% του c, γ ≈ 32. Τα 2,2 μs της ζωής του μοιάζουν για εμάς με <b>70 μs</b> — υπεραρκετά για να φτάσει στη Γη. Από τη μεριά του μιονίου, το ρολόι του είναι κανονικό… αλλά η ατμόσφαιρα «συμπιέζεται» στο 1/γ του ύψους της. Και οι δύο ματιές συμφωνούν: το μιόνιο προλαβαίνει. 🤯</p>`));
    const qd = api.add('<div></div>');
    api.quiz(qd, { q: 'Τι μας δείχνει τελικά το πείραμα με τα μιόνια;', opts: ['Τα μιόνια είναι πιο γρήγορα από το φως', 'Ο χρόνος κυλά πιο αργά για ό,τι κινείται πολύ γρήγορα (όπως το βλέπουμε απ’ έξω)', 'Η ατμόσφαιρα είναι πιο λεπτή απ’ όσο νομίζαμε', 'Οι ανιχνευτές είναι χαλασμένοι'], a: 1,
      ex: 'Ακριβώς — διαστολή του χρόνου, κατευθείαν από την ειδική σχετικότητα του Αϊνστάιν (1905). Ο LHC τη ζει κάθε μέρα: τα πρωτόνιά του έχουν γ ≈ 7.000!' }, () => {});

    api.code({
      title: 'lorentz.js — ο παράγοντας γ',
      intro: 'Με αυτή τη συνάρτηση υπολογίζει η προσομοίωση πόσο «τεντώνει» ο χρόνος. Δοκίμασε ταχύτητες πιο κοντά στο 1 (= ταχύτητα του φωτός).',
      code: `
const gamma = beta => 1 / Math.sqrt(1 - beta * beta);   // beta = v / c

const TAU = 2.2;          // μs — χρόνος ζωής του μιονίου
const C = 0.3;            // km ανά μs — ταχύτητα του φωτός

for (const beta of [0.5, 0.9, 0.99, 0.9995]) {
  const g = gamma(beta);
  const range = g * beta * C * TAU;       // μέση απόσταση πριν διασπαστεί
  print('v =', beta + 'c', ' γ =', g.toFixed(2), ' εμβέλεια ≈', range.toFixed(1), 'km');
}`,
      onRun: () => obj.done(3),
    });

    // twin paradox
    body.append(section('Το παράδοξο των διδύμων 👯', `<p>Οι δίδυμοι Α και Β είναι και οι δύο <b>20</b>. Ο Β ταξιδεύει σε ένα μακρινό άστρο και πίσω με ταχύτητα v. Στη Γη περνούν <b>30 χρόνια</b>. Πόσο χρονών είναι ο καθένας όταν προσγειώνεται ο Β;</p>`));
    const tw = api.add(`<div class="card"><div class="ctrl"><div class="ctrl-row"><span>Ταχύτητα διαστημοπλοίου</span><b id="tv">0,90c</b></div><input type="range" id="ts" min="0.5" max="0.999" step="0.001" value="0.9"></div>
      <div class="stats" style="margin:4px 0 0"><div class="stat"><div class="stat-n" id="ta">50</div><div class="stat-l">Δίδυμος Α (έμεινε στη Γη)</div></div><div class="stat"><div class="stat-n" id="tb">33</div><div class="stat-l">Δίδυμος Β (ταξιδιώτης) 🚀</div></div></div>
      <div class="formula" id="tf"></div></div>`);
    const ts = tw.querySelector('#ts');
    function twin() {
      const v = +ts.value, g = gammaOf(v), tB = 30 / g;
      const c2 = (x, d) => x.toFixed(d).replace('.', ',');
      tw.querySelector('#tv').textContent = c2(v, 3) + 'c';
      tw.querySelector('#tb').textContent = c2(20 + tB, 1);
      tw.querySelector('#tf').innerHTML = `γ = ${c2(g, 2)} → Δt<sub>Β</sub> = 30 χρόνια / ${c2(g, 2)} = <b style="color:var(--cyan)">${c2(tB, 1)} χρόνια</b>`;
      if (20 + tB <= 26.05) obj.done(2);
    }
    ts.oninput = twin; twin();
    body.append(api.add(`<p class="muted" style="font-size:.88rem">Με v = 0,98c, γ ≈ 5: ο Β μεγαλώνει μόνο 6 χρόνια και γυρίζει <b>26</b>, ενώ ο Α είναι <b>50</b>. Δεν είναι πραγματικό παράδοξο: ο Β είναι αυτός που επιταχύνθηκε και γύρισε πίσω, άρα τα δύο «ταξίδια» δεν είναι συμμετρικά.</p>`));

    api.ctrl(`<button class="sbtn hot" id="ein2">🧠 Λειτουργία Αϊνστάιν</button>`);
    document.getElementById('ein2').onclick = () => $('#ein').click();
    api.hint('Μιόνια «βρέχουν» από τα 10 χλμ.');

    return {
      update(dt, t) {
        acc += dt;
        while (acc > .09) { acc -= .09; spawn(); }
        showers.forEach(s => s.material.opacity = Math.max(0, s.material.opacity - dt * 3));
        plateGlow.material.opacity = Math.max(0, plateGlow.material.opacity - dt * 2);
        pops.forEach(p => p.update(dt));
        for (const m of pool) {
          if (!m.alive) continue;
          m.y -= VIS * dt; m.x += m.dx * dt * 10; m.z += m.dz * dt * 10;
          const travelled = H - m.y;
          if (travelled >= m.d) {
            m.alive = false; m.s.visible = false; decayed++;
            pops[popI++ % 4].fire(new THREE.Vector3(m.x, m.y, m.z), 1.6, COL.gold);
          } else if (m.y <= 0) {
            m.alive = false; m.s.visible = false; reached++;
            plateGlow.material.opacity = .9;
          } else m.s.position.set(m.x, m.y, m.z);
        }
        const done = reached + decayed;
        if (done) {
          const pct = reached / done;
          lab.querySelector('#m-r').textContent = (pct * 100).toFixed(0) + '%';
          lab.querySelector('#m-n').textContent = done;
          if (einstein && done >= 40 && pct >= .5) obj.done(1);
        }
      },
    };
  },
};
