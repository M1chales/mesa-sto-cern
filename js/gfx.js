// Shared three.js helpers.
import * as THREE from 'three';

let _glow;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, 'rgba(255,255,255,.85)');
  r.addColorStop(.45, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace;
  return _glow;
}

export function glow(color = 0x38e8ff, size = 1, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size);
  return s;
}

// glowing ball = solid core + additive halo
export function orb(color = 0x38e8ff, r = .2, halo = 4) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({ color })));
  g.add(glow(color, r * halo, .9));
  return g;
}

export function stars(n = 1500, radius = 120, size = .35) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0x9fd8ff), new THREE.Color(0xffc8f0), new THREE.Color(0xc8b8ff)];
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (.5 + Math.random() * .5));
    pos.set([v.x, v.y, v.z], i * 3);
    const c = palette[(Math.random() * palette.length) | 0]; col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}

// glowing ring (torus) on XZ plane
export function ring(radius, tube = .05, color = 0x38e8ff, opacity = 1, seg = 160) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, seg),
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }));
  m.rotation.x = Math.PI / 2;
  return m;
}

// fading trail behind a moving object
export class Trail {
  constructor(color = 0x38e8ff, len = 40) {
    this.len = len; this.pts = [];
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(len * 3); this.col = new Float32Array(len * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.c = new THREE.Color(color);
    this.line = new THREE.Line(this.geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.line.frustumCulled = false;
  }
  push(v) {
    this.pts.unshift(v.clone()); if (this.pts.length > this.len) this.pts.pop();
    for (let i = 0; i < this.len; i++) {
      const p = this.pts[Math.min(i, this.pts.length - 1)] || v;
      this.pos.set([p.x, p.y, p.z], i * 3);
      const f = 1 - i / this.len;
      this.col.set([this.c.r * f, this.c.g * f, this.c.b * f], i * 3);
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
  reset() { this.pts = []; }
}

// burst of sparks (for collisions)
export class Sparks {
  constructor(scene, n = 300, color = 0xffd25a) {
    this.n = n; this.v = new Float32Array(n * 3); this.life = 0;
    const geo = new THREE.BufferGeometry();
    this.p = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    this.mat = new THREE.PointsMaterial({ color, size: .25, map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.visible = false;
    scene.add(this.pts);
  }
  fire(at = new THREE.Vector3(), speed = 8, color) {
    if (color !== undefined) this.mat.color.set(color);
    for (let i = 0; i < this.n; i++) {
      const d = new THREE.Vector3().randomDirection().multiplyScalar(speed * (.3 + Math.random()));
      this.v.set([d.x, d.y, d.z], i * 3); this.p.set([at.x, at.y, at.z], i * 3);
    }
    this.life = 1; this.pts.visible = true;
  }
  update(dt) {
    if (this.life <= 0) return;
    this.life -= dt * .8; this.mat.opacity = Math.max(0, this.life);
    for (let i = 0; i < this.n * 3; i++) { this.p[i] += this.v[i] * dt; this.v[i] *= .97; }
    this.pts.geometry.attributes.position.needsUpdate = true;
    if (this.life <= 0) this.pts.visible = false;
  }
}

export function disposeScene(scene) {
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
        for (const k in m) if (m[k] && m[k].isTexture && m[k] !== _glow) m[k].dispose();
        m.dispose();
      });
    }
  });
}

// soft-edged canvas texture with text, for in-world signs
export function textTex(text, { w = 512, h = 128, font = '700 64px Orbitron, sans-serif', color = '#fff', bg = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 18; g.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const COL = {
  cyan: 0x38e8ff, pink: 0xff4fd8, gold: 0xffd25a, green: 0x5dffa6, red: 0xff5a6e, violet: 0x9b7bff,
  quark: 0xb46cff, lepton: 0x4fd0ff, boson: 0xff8a3d, higgs: 0xffd25a,
};
