import * as THREE from 'three';
import { stars, orb, glow, ring, COL } from '../gfx.js';
import { acc, section } from './common.js';

const QUESTS = [
  ['🎯', 'Πειράματα σταθερού στόχου', 'Δεν συγκρούονται όλα δέσμη με δέσμη. Εδώ πρωτόνια πέφτουν πάνω σε <b>σταθερούς στόχους</b> και παράγουν πολλά άλλα σωματίδια. Ομάδες από όλο τον κόσμο φέρνουν τους ανιχνευτές τους για να τους δοκιμάσουν σε ελεγχόμενο περιβάλλον, με ελεγχόμενη δέσμη, χαμηλότερες ενέργειες και σχετικά χαμηλή ραδιενέργεια.'],
  ['🛸', 'n_TOF — ιπτάμενα νετρόνια!', 'Τα νετρόνια είναι ουδέτερα: δεν επιταχύνονται ούτε στρίβουν με μαγνήτες. Δεν μπορούμε να προβλέψουμε πώς αλληλεπιδρούν με κάθε υλικό, οπότε ο μόνος δρόμος είναι η <b>πειραματική μέτρηση</b>, χρονομετρώντας τα σε μια διαδρομή 185 μέτρων. Χρήσιμο για μελλοντικούς πυρηνικούς αντιδραστήρες, πυρηνική αστροφυσική και βασική πυρηνική φυσική.'],
  ['☁️', 'CLOUD — σύννεφο σε κουτί', 'Ένας τεράστιος θάλαμος με <b>τεχνητό σύννεφο</b>: συνθήκες ατμόσφαιρας + δέσμη σωματιδίων στον ρόλο της κοσμικής ακτινοβολίας. «Προσομοιώνει» πώς συμπεριφέρεται η ατμόσφαιρα και πώς τα σωματίδια επηρεάζουν τον σχηματισμό των συννέφων — σημαντικό για το κλίμα.'],
  ['☢️', 'ISOLDE', 'Ένα «εργοστάσιο αλχημείας»: φτιάχνει <b>πάνω από 1.000 διαφορετικά ραδιενεργά ισότοπα</b> για τη μελέτη των πυρήνων, της αστροφυσικής και της ιατρικής.'],
  ['🪞', 'Το εργοστάσιο αντιύλης', 'Επιβραδύνει αντιπρωτόνια και τα ενώνει με ποζιτρόνια για να φτιάξει άτομα <b>αντιυδρογόνου</b>. Το 2023 ένα πείραμα εδώ έδειξε ότι η αντιύλη πέφτει <b>προς τα κάτω</b> στη βαρύτητα, όπως η κανονική ύλη. (Sorry, δεν έχει ιπτάμενα skateboards.)'],
  ['🔥', 'HiRadMat', '«High-Radiation to Materials»: βομβαρδίζει υλικά με εξαιρετικά έντονους παλμούς δέσμης για να δει αν αντέχουν. Το λογότυπο στο κάτω μέρος των διαφανειών των παρουσιάσεων; Αυτή είναι η εγκατάσταση.'],
  ['🏥', 'Εφαρμογές στην ιατρική', 'Από τη σωματιδιακή φυσική στο νοσοκομείο. <b>Διάγνωση</b>: τομογράφοι PET και έγχρωμες ακτινογραφίες που προέρχονται από τεχνολογία ανιχνευτών. <b>Θεραπεία</b>: δέσμες πρωτονίων και ιόντων που καταστρέφουν όγκους προστατεύοντας τους υγιείς ιστούς.'],
  ['🌐', 'Το World Wide Web', 'Οι επιστήμονες σε όλο τον κόσμο ήθελαν να μοιράζονται δεδομένα αμέσως. Έτσι, το <b>1989</b> ο Tim Berners-Lee στο CERN εφηύρε το <b>World Wide Web</b>. Η πρώτη ιστοσελίδα ήταν το info.cern.ch. Χωρίς CERN → ούτε YouTube, ούτε Discord, ούτε memes.'],
  ['🖥️', 'Υπερυπολογιστές & το Grid', 'Ο LHC παράγει τεράστιο όγκο δεδομένων. Το Κέντρο Υπολογιστών του CERN και το <b>Worldwide LHC Computing Grid</b> (περίπου 170 υπολογιστικά κέντρα σε 40+ χώρες) τα αποθηκεύουν και τα επεξεργάζονται. Το CERN έχει αποθηκεύσει πάνω από ένα <b>exabyte</b> (ένα δισεκατομμύριο GB).'],
  ['🤖', 'Ρομποτική', 'Κάποιες περιοχές είναι πολύ ραδιενεργές για ανθρώπους. Γι’ αυτό το CERN στέλνει <b>ρομπότ</b>: ρομποτικά χέρια, ερπυστριοφόρα οχήματα, ακόμα και έναν <b>ρομπότ-σκύλο</b> που περπατά στα τούνελ και ανιχνεύει κινδύνους από ραδιενέργεια.'],
];

export default {
  id: 'side', color: '#38e8ff',
  title: 'Το CERN πέρα από τον LHC', sub: 'Αντιύλη, σύννεφα, ρομπότ και το Web',
  world: { fov: 50 },
  intro: [
    { t: 'Ο LHC παίρνει όλο το hype, αλλά το CERN κάνει πολλά ακόμα: αντιύλη, τεχνητά σύννεφα, ιπτάμενα νετρόνια, ρομπότ… και φυσικά, το Web.', mood: 'happy' },
    { t: 'Και κοίτα τον <b>χάρτη</b>: ο επόμενος γίγαντας-επιταχυντής ίσως έχει μήκος 91 χλμ. 👀', mood: 'wow' },
  ],
  build(api) {
    const { scene, camera } = api;
    camera.position.set(-6, 26, 30);
    api.orbit({ minDistance: 14, maxDistance: 60, target: new THREE.Vector3(3, 0, 2), maxPolarAngle: Math.PI * .45, autoRotate: true, autoRotateSpeed: .25 });
    scene.add(stars(1200, 160, .6));
    scene.add(new THREE.AmbientLight(0xffffff, .7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(-10, 20, 10); scene.add(dl);

    // terrain (1 unit = 1 km)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 80, 80), new THREE.MeshStandardMaterial({ color: 0x0f2a22, roughness: 1, flatShading: true }));
    ground.rotation.x = -Math.PI / 2;
    const gp = ground.geometry.attributes.position;
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), y = gp.getY(i); // plane local: y → -z in world
      const jura = Math.max(0, 1 - Math.abs((x + y * .9) + 16) / 6) * 3.2;   // ridge to the north-west
      const saleve = Math.max(0, 1 - Math.hypot(x - 12, -y - 13) / 6) * 2.2;  // mountain south-east
      gp.setZ(i, jura + saleve + Math.sin(x * .7) * Math.cos(y * .6) * .12);
    }
    ground.geometry.computeVertexNormals(); ground.position.y = -.2; scene.add(ground);
    const gridH = new THREE.GridHelper(80, 40, 0x1c4a3a, 0x163a2e); gridH.position.y = -.15; gridH.material.transparent = true; gridH.material.opacity = .35; scene.add(gridH);

    // Lake Geneva (stylised crescent heading north-east from Geneva)
    const lake = new THREE.Shape();
    const pts = [[8, 4], [10, 1.5], [14, -2], [19, -5.5], [26, -8], [32, -8.5], [33, -6.5], [27, -5.6], [20, -3], [14.5, .5], [10.5, 4], [9, 5.2]];
    lake.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, z]) => lake.lineTo(x, z));
    const lakeM = new THREE.Mesh(new THREE.ShapeGeometry(lake), new THREE.MeshStandardMaterial({ color: 0x1f6dff, emissive: 0x0a2a80, roughness: .2, metalness: .3, side: THREE.DoubleSide }));
    lakeM.rotation.x = Math.PI / 2; lakeM.position.y = .05; scene.add(lakeM);
    // note: rotation.x = +π/2 maps shape (x, y) → world (x, 0, y)

    // LHC (27 km → r ≈ 4.3 km)
    const lhc = ring(4.3, .12, COL.cyan); lhc.position.set(0, .3, 0); scene.add(lhc);
    const lhcGlow = glow(COL.cyan, 14, .25); lhcGlow.position.set(0, .4, 0); scene.add(lhcGlow);
    const fccC = new THREE.Vector3(5, .35, 3.5);
    const fccPts = []; for (let a = 0; a <= Math.PI * 2 + .01; a += .02) fccPts.push(new THREE.Vector3(fccC.x + Math.cos(a) * 14.5, fccC.y, fccC.z + Math.sin(a) * 14.5));
    const fccGeo = new THREE.BufferGeometry().setFromPoints(fccPts);
    const fcc = new THREE.Line(fccGeo, new THREE.LineBasicMaterial({ color: COL.gold })); fccGeo.setDrawRange(0, 0); scene.add(fcc);
    const fccTube = new THREE.Mesh(new THREE.TorusGeometry(14.5, .1, 8, 200), new THREE.MeshBasicMaterial({ color: COL.gold, transparent: true, opacity: 0 }));
    fccTube.rotation.x = Math.PI / 2; fccTube.position.copy(fccC); scene.add(fccTube);
    const meyrin = orb(COL.pink, .3, 6); meyrin.position.set(-1.5, .5, 4.1); scene.add(meyrin);

    api.label(new THREE.Vector3(0, 1.4, -4.3), 'LHC · 27 χλμ.', 'big');
    api.label(new THREE.Vector3(-1.5, 1.3, 4.1), 'CERN Meyrin', '');
    api.label(new THREE.Vector3(9, 1, 5), 'Γενεύη', '');
    api.label(new THREE.Vector3(22, 1, -4.6), 'Λίμνη της Γενεύης', '');
    api.label(new THREE.Vector3(-20, 4, -5), 'Όρη Ιούρα', '');
    api.label(new THREE.Vector3(-10, 1, 10), 'Γαλλία 🇫🇷', '');
    api.label(new THREE.Vector3(16, 1, 6), 'Ελβετία 🇨🇭', '');
    const fccLbl = api.label(new THREE.Vector3(fccC.x, 1.6, fccC.z + 14.5), 'FCC · ~91 χλμ.', 'big'); fccLbl.hidden = true;

    let fccT = -1;
    // ---------- panel ----------
    const body = api.panel();
    const obj = api.tutor([
      { how: "Το CERN δεν είναι μόνο ο LHC. Άνοιξε τις <b>10 κάρτες</b> πιο κάτω, ξεκινώντας από όποια σου τραβάει την προσοχή.",
        ok: "Από αντιύλη και σύννεφα μέχρι ρομπότ-σκύλους και ιατρική. Όλα ξεκινούν από την ίδια ερώτηση: από τι είναι φτιαγμένος ο κόσμος;" },
      { how: "Πάτα <b>🗺️ Δείξε τον FCC στον χάρτη</b> και σύγκρινε το μέγεθός του με τον LHC στο 3D.",
        ok: "Σχεδόν 91 χλμ., γύρω από τη Γενεύη! Αν χτιστεί, θα λειτουργήσει κάπου στη δεκαετία του 2040." },
      { how: "Μια τελευταία ερώτηση, για κάτι που χρησιμοποιείς κάθε μέρα: τι εφευρέθηκε στο CERN το 1989;",
        ok: "Ο Παγκόσμιος Ιστός! Τον έφτιαξε ένας προγραμματιστής για να λύσει ένα πρακτικό πρόβλημα. Αυτό μας φέρνει στο τελευταίο κεφάλαιο…" },
    ]);
    const prog = api.add('<div class="ctrl-row"><span>Ενότητες που άνοιξες</span><b>0 / 10</b></div>').querySelector('b');
    let opened = 0;
    QUESTS.forEach(([i, t, d]) => {
      const a = acc(i, t, d); body.append(a);
      a.addEventListener('toggle', () => {
        if (a.open && !a.dataset.seen) {
          a.dataset.seen = 1; opened++; prog.textContent = `${opened} / 10`; api.sfx.blip();
          a.querySelector('summary').insertAdjacentHTML('beforeend', '<span class="pill" style="margin-left:6px;color:var(--green)">✔</span>');
          if (opened === 10) obj.done(0);
        }
      });
    });

    body.append(section('Το μέλλον: FCC;', `<p>Ο <b>Future Circular Collider</b> (Μελλοντικός Κυκλικός Επιταχυντής) είναι ένας προτεινόμενος δακτύλιος ~91 χλμ. κάτω από Γαλλία και Ελβετία, πάνω από 3 φορές ο LHC. Πρώτα θα συγκρούει ηλεκτρόνια και ποζιτρόνια για να μελετήσει το Higgs με τρελή ακρίβεια, και αργότερα πρωτόνια σε ενέργειες ως ~100 TeV.</p>`));
    const fb = api.add('<div class="btn-row"><button class="btn btn-gold" id="fcc-btn">🗺️ Δείξε τον FCC στον χάρτη</button></div>');
    fb.querySelector('#fcc-btn').onclick = () => { fccT = 0; api.sfx.boost(); fccLbl.hidden = false; obj.done(1); fb.querySelector('#fcc-btn').disabled = true; };

    const qb = api.add('<div></div>');
    api.quiz(qb, { q: 'Ποιο καθημερινό πράγμα εφευρέθηκε στο CERN το 1989;', opts: ['Το smartphone', 'Το Wi-Fi', 'Ο Παγκόσμιος Ιστός (World Wide Web)', 'Τα video games'], a: 2,
      ex: 'Ο Tim Berners-Lee εφηύρε το Web στο CERN για να μοιράζονται πληροφορίες οι φυσικοί. Το CERN το έκανε ελεύθερο για όλους το 1993.' }, () => obj.done(2));

    body.append(section('Συνοπτικά — CERN', `<p>Το μεγαλύτερο ερευνητικό κέντρο φυσικής του κόσμου, ο ισχυρότερος και μεγαλύτερος επιταχυντής σωματιδίων, πληθώρα πειραμάτων σε πολλούς τομείς της φυσικής — όλα για να εξερευνούμε τα όρια της γνώσης και της τεχνολογίας και να <b>κατανοήσουμε καλύτερα τον κόσμο γύρω μας</b>!</p>`));

    return {
      update(dt, t) {
        meyrin.children[1].material.opacity = .6 + Math.sin(t * 3) * .3;
        if (fccT >= 0 && fccT < 1) {
          fccT = Math.min(1, fccT + dt * .45);
          fccGeo.setDrawRange(0, Math.floor(fccPts.length * fccT));
          fccTube.material.opacity = fccT * .5;
        }
      },
    };
  },
};
