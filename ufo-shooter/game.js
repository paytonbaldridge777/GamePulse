import * as THREE from 'three';

// ─── Constants ───────────────────────────────────────────────────────────────
const GROUND_SIZE    = 120;
const TANK_SPEED     = 8;
const BULLET_SPEED   = 60;
const BULLET_LIFE    = 2.5;
const UFO_BASE_SPEED = 3.5;
const UFO_SPAWN_R    = 45;
const MAX_HEALTH     = 100;
const SHOT_COOLDOWN  = 0.22;

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  sky1:     0x0a0020,
  sky2:     0x1a0040,
  ground1:  0x1a2a1a,
  ground2:  0x0d1a0d,
  tankBody: 0x2ecc40,
  tankTurr: 0x27ae60,
  tankBarr: 0xf1c40f,
  ufoBody:  0x9b59b6,
  ufoLight: 0xe74c3c,
  ufoBeam:  0xf39c12,
  bullet:   0xffff00,
  explode: [0xff4500, 0xff8c00, 0xffd700, 0xff69b4, 0xffffff],
  stars:    0xffffff,
};

// ─── Scene & Renderer ────────────────────────────────────────────────────────
const canvas   = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x0a0020, 0.012);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 400);

// ─── Lights ──────────────────────────────────────────────────────────────────
function setupLights() {
  const ambient = new THREE.AmbientLight(0x223344, 1.2);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 200;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -80;
  sun.shadow.camera.right = sun.shadow.camera.top   =  80;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  const fill = new THREE.HemisphereLight(0x0033ff, 0x002200, 0.6);
  scene.add(fill);

  // UFO beam glow light (reused per-UFO)
  const neonBlue = new THREE.PointLight(0x00aaff, 0, 20);
  neonBlue.name = 'globalBeam';
  scene.add(neonBlue);
}

// ─── Ground ──────────────────────────────────────────────────────────────────
function buildGround() {
  // Low-poly subdivided plane
  const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getX(i) !== 0 || pos.getY(i) !== 0) {
      pos.setZ(i, (Math.random() - 0.5) * 0.6);
    }
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshLambertMaterial({
    color: C.ground1,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Grid overlay
  const grid = new THREE.GridHelper(GROUND_SIZE, 30, 0x00ff88, 0x003322);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  grid.position.y = 0.02;
  scene.add(grid);

  // Scattered rocks
  for (let i = 0; i < 40; i++) {
    const r   = 2 + Math.random() * 3;
    const geo = new THREE.IcosahedronGeometry(r, 0);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.3 + Math.random() * 0.1, 0.3, 0.15 + Math.random() * 0.1),
      flatShading: true,
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(
      (Math.random() - 0.5) * (GROUND_SIZE - 10),
      r * 0.4,
      (Math.random() - 0.5) * (GROUND_SIZE - 10)
    );
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // Low-poly trees
  for (let i = 0; i < 20; i++) {
    buildTree(
      (Math.random() - 0.5) * (GROUND_SIZE - 15),
      (Math.random() - 0.5) * (GROUND_SIZE - 15)
    );
  }
}

function buildTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, 3, 5),
    new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true })
  );
  trunk.position.set(x, 1.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const hue   = 0.28 + Math.random() * 0.1;
  const light = 0.25 + Math.random() * 0.15;
  for (let l = 0; l < 3; l++) {
    const s   = 2.5 - l * 0.5;
    const geo = new THREE.ConeGeometry(s, s * 1.4, 6);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, light),
      flatShading: true,
    });
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.set(x, 3 + l * 2, z);
    leaf.rotation.y = Math.random() * Math.PI;
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

// ─── Stars ───────────────────────────────────────────────────────────────────
function buildStars() {
  const n = 1800;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 180 + Math.random() * 40;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
  scene.add(new THREE.Points(geo, mat));
}

// ─── Moon ────────────────────────────────────────────────────────────────────
function buildMoon() {
  const geo = new THREE.IcosahedronGeometry(8, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xddddcc, flatShading: true });
  const moon = new THREE.Mesh(geo, mat);
  moon.position.set(70, 80, -100);
  scene.add(moon);

  const glow = new THREE.PointLight(0xaaaaff, 0.4, 200);
  glow.position.copy(moon.position);
  scene.add(glow);
}

// ─── Tank ────────────────────────────────────────────────────────────────────
class Tank {
  constructor() {
    this.group    = new THREE.Group();
    this.turret   = new THREE.Group();
    this.speed    = TANK_SPEED;
    this.angle    = 0;
    this.health   = MAX_HEALTH;
    this.alive    = true;
    this._build();
    scene.add(this.group);
  }

  _build() {
    // Body
    const bodyGeo = new THREE.BoxGeometry(3, 1.2, 4.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: C.tankBody, flatShading: true });
    const body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // Tracks (left and right)
    [-1.7, 1.7].forEach(side => {
      const trackGeo = new THREE.BoxGeometry(0.7, 0.8, 5);
      const trackMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
      const track    = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(side, -0.3, 0);
      track.castShadow = true;
      this.group.add(track);

      // Wheels
      for (let w = -2; w <= 2; w++) {
        const wGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
        const wMat = new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true });
        const wheel = new THREE.Mesh(wGeo, wMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side, -0.6, w * 1.1);
        this.group.add(wheel);
      }
    });

    // Turret base
    const tBaseGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.6, 7);
    const tBaseMat = new THREE.MeshLambertMaterial({ color: C.tankTurr, flatShading: true });
    const tBase    = new THREE.Mesh(tBaseGeo, tBaseMat);
    tBase.position.y = 0.3;
    tBase.castShadow = true;
    this.group.add(tBase);

    // Turret dome
    const tDomeGeo = new THREE.SphereGeometry(0.85, 6, 5);
    const tDomeMat = new THREE.MeshLambertMaterial({ color: C.tankTurr, flatShading: true });
    const tDome    = new THREE.Mesh(tDomeGeo, tDomeMat);
    tDome.position.y = 0.2;
    tDome.castShadow = true;
    this.turret.add(tDome);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6);
    const barrelMat = new THREE.MeshLambertMaterial({ color: C.tankBarr, flatShading: true });
    const barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x  = Math.PI / 2;
    barrel.position.set(0, 0.3, -1.6);
    barrel.castShadow = true;
    this.turret.add(barrel);
    this.barrel = barrel;

    // Muzzle flash marker
    this.muzzlePoint = new THREE.Object3D();
    this.muzzlePoint.position.set(0, 0.3, -2.9);
    this.turret.add(this.muzzlePoint);

    this.turret.position.y = 0.9;
    this.group.add(this.turret);

    // Start position
    this.group.position.y = 0.8;
  }

  getMuzzleWorldPos() {
    const v = new THREE.Vector3();
    this.muzzlePoint.getWorldPosition(v);
    return v;
  }

  getBarrelWorldDir() {
    const dir = new THREE.Vector3(0, 0, -1);
    this.turret.getWorldQuaternion(new THREE.Quaternion());
    this.muzzlePoint.localToWorld(dir.set(0, 0, -1)).sub(this.getMuzzleWorldPos()).normalize();
    return dir;
  }

  aimAt(worldTarget) {
    const local = this.group.worldToLocal(worldTarget.clone());
    this.turret.rotation.y = Math.atan2(local.x, local.z) + Math.PI;
  }

  takeDamage(amt) {
    this.health = Math.max(0, this.health - amt);
    if (this.health <= 0) this.alive = false;
  }

  update(dt, keys) {
    if (!this.alive) return;
    const moveDir = new THREE.Vector3();
    if (keys.forward) moveDir.z -= 1;
    if (keys.back)    moveDir.z += 1;
    if (keys.left)    this.group.rotation.y += 1.8 * dt;
    if (keys.right)   this.group.rotation.y -= 1.8 * dt;

    if (moveDir.length() > 0) {
      moveDir.normalize().applyQuaternion(this.group.quaternion);
      this.group.position.addScaledVector(moveDir, this.speed * dt);
      // Clamp to ground
      const half = GROUND_SIZE / 2 - 3;
      this.group.position.x = Math.max(-half, Math.min(half, this.group.position.x));
      this.group.position.z = Math.max(-half, Math.min(half, this.group.position.z));
    }
  }
}

// ─── UFO ─────────────────────────────────────────────────────────────────────
class UFO {
  constructor(wave) {
    this.group    = new THREE.Group();
    this.alive    = true;
    this.health   = 1 + Math.floor(wave * 0.4);
    this.maxHp    = this.health;
    this.speed    = UFO_BASE_SPEED + wave * 0.3 + Math.random() * 1.5;
    this.orbitR   = 18 + Math.random() * 22;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitH   = 14 + Math.random() * 12;
    this.orbitDir = Math.random() < 0.5 ? 1 : -1;
    this.wobble   = Math.random() * Math.PI * 2;
    this.beamTime = 0;
    this.isFiring = false;
    this._build();
    scene.add(this.group);

    // Place on orbit start
    this.group.position.set(
      this.orbitR * Math.cos(this.orbitAngle),
      this.orbitH,
      this.orbitR * Math.sin(this.orbitAngle)
    );
  }

  _build() {
    // Saucer body (flattened sphere)
    const bodyGeo = new THREE.SphereGeometry(2.2, 8, 5);
    bodyGeo.scale(1, 0.38, 1);
    const bodyMat = new THREE.MeshLambertMaterial({ color: C.ufoBody, flatShading: true });
    const body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.group.add(body);

    // Cockpit dome
    const domeGeo = new THREE.SphereGeometry(1.0, 7, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshLambertMaterial({
      color: 0x88eeff,
      flatShading: true,
      transparent: true,
      opacity: 0.75,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.35;
    this.group.add(dome);

    // Rim lights (decorative)
    const rimGeo = new THREE.TorusGeometry(2.0, 0.18, 5, 12);
    const rimMat = new THREE.MeshBasicMaterial({ color: C.ufoLight });
    const rim    = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    this.group.add(rim);
    this.rim = rim;

    // Bottom light
    const blGeo = new THREE.CircleGeometry(0.6, 6);
    const blMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const bl    = new THREE.Mesh(blGeo, blMat);
    bl.rotation.x = Math.PI / 2;
    bl.position.y = -0.5;
    this.group.add(bl);
    this.bottomLight = bl;

    // Tractor beam (cone, hidden normally)
    const beamGeo = new THREE.ConeGeometry(3, 12, 6, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    this.beam = new THREE.Mesh(beamGeo, beamMat);
    this.beam.position.y = -6.5;
    this.beam.visible = false;
    this.group.add(this.beam);

    // Point light underneath
    this.light = new THREE.PointLight(C.ufoLight, 0.8, 12);
    this.light.position.y = -1;
    this.group.add(this.light);
  }

  update(dt, tankPos) {
    if (!this.alive) return;

    this.orbitAngle += this.orbitDir * (this.speed / this.orbitR) * dt;
    this.wobble     += dt * 0.9;

    this.group.position.set(
      this.orbitR * Math.cos(this.orbitAngle),
      this.orbitH + Math.sin(this.wobble) * 1.2,
      this.orbitR * Math.sin(this.orbitAngle)
    );
    this.group.rotation.y += dt * 0.7;

    // Pulse rim
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
    this.rim.material.color.setHSL(0.02, 1, 0.4 + pulse * 0.4);
    this.bottomLight.material.color.setHSL(0.15, 1, 0.5 + pulse * 0.3);

    // Occasionally show beam when near tank
    const dist = this.group.position.distanceTo(tankPos);
    if (dist < 22) {
      this.beamTime += dt;
      this.beam.visible = this.beamTime % 3 < 1.5;
    } else {
      this.beam.visible = false;
      this.beamTime = 0;
    }
  }

  hit() {
    this.health--;
    // Flash white
    this.group.traverse(obj => {
      if (obj.isMesh && obj.material.color) {
        obj.material.emissive = new THREE.Color(0xffffff);
        setTimeout(() => {
          if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
        }, 80);
      }
    });
    if (this.health <= 0) {
      this.alive = false;
      scene.remove(this.group);
      return true;
    }
    return false;
  }
}

// ─── Bullet ──────────────────────────────────────────────────────────────────
class Bullet {
  constructor(origin, dir) {
    const geo = new THREE.IcosahedronGeometry(0.18, 0);
    const mat = new THREE.MeshBasicMaterial({ color: C.bullet });
    this.mesh  = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);
    this.dir   = dir.clone().normalize();
    this.life  = BULLET_LIFE;
    this.alive = true;

    // Glow trail
    const glowGeo = new THREE.SphereGeometry(0.35, 5, 5);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffee44,
      transparent: true,
      opacity: 0.35,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.mesh.add(this.glow);

    // Point light
    this.light = new THREE.PointLight(0xffff00, 1.5, 6);
    this.mesh.add(this.light);

    scene.add(this.mesh);
  }

  update(dt) {
    if (!this.alive) return;
    this.mesh.position.addScaledVector(this.dir, BULLET_SPEED * dt);
    this.life -= dt;
    if (this.life <= 0) this.destroy();
  }

  destroy() {
    this.alive = false;
    scene.remove(this.mesh);
  }
}

// ─── Explosion ───────────────────────────────────────────────────────────────
class Explosion {
  constructor(pos) {
    this.particles = [];
    this.alive     = true;
    this.life      = 1.2;

    const count = 22;
    for (let i = 0; i < count; i++) {
      const s   = 0.3 + Math.random() * 0.7;
      const geo = new THREE.IcosahedronGeometry(s, 0);
      const col = C.explode[Math.floor(Math.random() * C.explode.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const m   = new THREE.Mesh(geo, mat);
      m.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        Math.random() * 14 + 2,
        (Math.random() - 0.5) * 18
      );
      this.particles.push({ mesh: m, vel, scale: s });
      scene.add(m);
    }

    // Flash light
    this.flash = new THREE.PointLight(0xff6600, 8, 30);
    this.flash.position.copy(pos);
    scene.add(this.flash);
  }

  update(dt) {
    if (!this.alive) return;
    this.life -= dt;
    const t = 1 - Math.max(0, this.life / 1.2);

    for (const p of this.particles) {
      p.vel.y   -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const s = p.scale * (1 - t * 0.7);
      p.mesh.scale.setScalar(Math.max(0.01, s));
      p.mesh.material.opacity = 1 - t;
      p.mesh.material.transparent = true;
    }

    this.flash.intensity = Math.max(0, 8 * (1 - t * 3));

    if (this.life <= 0) {
      this.alive = false;
      for (const p of this.particles) scene.remove(p.mesh);
      scene.remove(this.flash);
    }
  }
}

// ─── Muzzle Flash ────────────────────────────────────────────────────────────
class MuzzleFlash {
  constructor(pos) {
    this.life  = 0.08;
    this.alive = true;
    this.light = new THREE.PointLight(0xffff88, 5, 8);
    this.light.position.copy(pos);
    scene.add(this.light);

    const geo = new THREE.SphereGeometry(0.3, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(pos);
    scene.add(this.mesh);
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      scene.remove(this.light);
      scene.remove(this.mesh);
    }
  }
}

// ─── Input ───────────────────────────────────────────────────────────────────
const keys = { forward: false, back: false, left: false, right: false };
const mouse = { x: 0, y: 0 };
let shootPressed = false;

document.addEventListener('keydown', e => {
  if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.forward = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.back    = true;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.left    = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right   = true;
  if (e.code === 'Space') { e.preventDefault(); shootPressed = true; }
  if (e.code === 'KeyR')  restartGame();
});
document.addEventListener('keyup', e => {
  if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.forward = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.back    = false;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys.left    = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right   = false;
  if (e.code === 'Space') shootPressed = false;
});
document.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
document.addEventListener('mousedown', e => { if (e.button === 0) shootPressed = true; });
document.addEventListener('mouseup',   e => { if (e.button === 0) shootPressed = false; });

// ─── Raycasting for turret aim ────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const aimPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function getAimTarget() {
  raycaster.setFromCamera(mouse, camera);
  // Aim at varying heights to target UFOs
  const target = new THREE.Vector3();

  // Try to hit a UFO first
  const ufoMeshes = ufos.map(u => u.group).filter(Boolean);
  const hits = raycaster.intersectObjects(ufoMeshes, true);
  if (hits.length > 0) return hits[0].point;

  // Otherwise aim toward sky
  const skyPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -12);
  raycaster.ray.intersectPlane(skyPlane, target);
  return target;
}

// ─── HUD updates ─────────────────────────────────────────────────────────────
const scoreEl     = document.getElementById('score-val');
const waveEl      = document.getElementById('wave-val');
const healthFill  = document.getElementById('health-fill');
const ammoEl      = document.getElementById('ammo-val');
const waveBanner  = document.getElementById('wave-banner');
const gameOverScr = document.getElementById('gameover-screen');
const finalScore  = document.getElementById('final-score-val');

function updateHUD(score, wave, hp) {
  scoreEl.textContent = score;
  waveEl.textContent  = wave;
  const pct = (hp / MAX_HEALTH) * 100;
  healthFill.style.width = pct + '%';
  if (pct > 50)       healthFill.style.background = 'linear-gradient(90deg,#0f8,#0ff)';
  else if (pct > 25)  healthFill.style.background = 'linear-gradient(90deg,#ff0,#ffa500)';
  else                healthFill.style.background = 'linear-gradient(90deg,#f00,#ff4488)';
}

let bannerTimeout;
function showWaveBanner(n) {
  waveBanner.textContent = `WAVE ${n}`;
  waveBanner.style.opacity = '1';
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => { waveBanner.style.opacity = '0'; }, 2200);
}

// ─── Game State ───────────────────────────────────────────────────────────────
let tank, ufos, bullets, explosions, flashes;
let score, wave, shotCooldown, gameRunning;
let lastTime = 0;

function initGame() {
  // Clear existing objects
  while (scene.children.length) scene.remove(scene.children[0]);

  setupLights();
  buildGround();
  buildStars();
  buildMoon();

  tank       = new Tank();
  ufos       = [];
  bullets    = [];
  explosions = [];
  flashes    = [];
  score      = 0;
  wave       = 1;
  shotCooldown = 0;
  gameRunning  = true;

  spawnWave(wave);
  updateHUD(score, wave, tank.health);
}

function spawnWave(n) {
  const count = 3 + n * 2;
  for (let i = 0; i < count; i++) {
    ufos.push(new UFO(n));
  }
  showWaveBanner(n);
}

function shoot() {
  const muzzlePos = tank.getMuzzleWorldPos();

  // Direction toward aim target (with upward bias toward UFOs)
  const aim = getAimTarget();
  const dir = aim.clone().sub(muzzlePos).normalize();

  // If direction is mostly down, redirect upward
  if (dir.y < 0.1) dir.y = 0.3;
  dir.normalize();

  bullets.push(new Bullet(muzzlePos, dir));
  flashes.push(new MuzzleFlash(muzzlePos));
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop(ts) {
  requestAnimationFrame(loop);

  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  resize();

  if (!gameRunning) {
    renderer.render(scene, camera);
    return;
  }

  // Tank
  tank.update(dt, keys);
  const aim = getAimTarget();
  if (aim.length() > 0) tank.aimAt(aim);

  // Camera follows tank (third-person overhead-ish)
  const tankPos = tank.group.position;
  camera.position.lerp(
    new THREE.Vector3(tankPos.x, tankPos.y + 18, tankPos.z + 14),
    0.06
  );
  camera.lookAt(tankPos.x, tankPos.y + 2, tankPos.z);

  // Shoot
  shotCooldown = Math.max(0, shotCooldown - dt);
  if (shootPressed && shotCooldown <= 0) {
    shoot();
    shotCooldown = SHOT_COOLDOWN;
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update(dt);
    if (!b.alive) { bullets.splice(i, 1); continue; }

    // Check hit vs UFOs
    let hit = false;
    for (let j = ufos.length - 1; j >= 0; j--) {
      const u = ufos[j];
      if (b.mesh.position.distanceTo(u.group.position) < 2.8) {
        b.destroy();
        bullets.splice(i, 1);
        const killed = u.hit();
        if (killed) {
          explosions.push(new Explosion(u.group.position.clone()));
          ufos.splice(j, 1);
          score += 100 * wave;
        }
        hit = true;
        break;
      }
    }
  }

  // UFOs
  for (let i = ufos.length - 1; i >= 0; i--) {
    const u = ufos[i];
    u.update(dt, tankPos);

    // Damage tank if UFO gets too close to ground
    if (u.group.position.distanceTo(tankPos) < 5) {
      tank.takeDamage(15 * dt);
    }
  }

  // Explosions & flashes
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update(dt);
    if (!explosions[i].alive) explosions.splice(i, 1);
  }
  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].update(dt);
    if (!flashes[i].alive) flashes.splice(i, 1);
  }

  // Next wave
  if (ufos.length === 0 && gameRunning) {
    wave++;
    spawnWave(wave);
  }

  // Player death
  if (!tank.alive) {
    gameRunning = false;
    finalScore.textContent = score;
    gameOverScr.style.display = 'flex';
  }

  updateHUD(score, wave, tank.health);
  renderer.render(scene, camera);
}

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// ─── Restart ─────────────────────────────────────────────────────────────────
function restartGame() {
  gameOverScr.style.display = 'none';
  initGame();
}

// ─── Buttons ─────────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').style.display = 'none';
  initGame();
  requestAnimationFrame(ts => { lastTime = ts; loop(ts); });
});
document.getElementById('restart-btn').addEventListener('click', restartGame);
