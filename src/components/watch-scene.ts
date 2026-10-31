import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Monte la scène dans `el` ; renvoie la fonction de nettoyage, ou null si WebGL est indisponible. */
export function mountWatch(el: HTMLElement): (() => void) | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.style.display = 'block';
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 5.4);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);

  const watch = buildWatch();
  scene.add(watch.group);

  // Taille du canevas = taille du conteneur.
  const resize = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // Glisser pour faire pivoter ; la montre revient ensuite à sa rotation automatique.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dragging = false, lastX = 0, lastY = 0, userYaw = 0, userPitch = 0;
  const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    userYaw += (e.clientX - lastX) * 0.01;
    userPitch = THREE.MathUtils.clamp(userPitch + (e.clientY - lastY) * 0.006, -0.7, 0.7);
    lastX = e.clientX; lastY = e.clientY;
  };
  const up = () => { dragging = false; el.style.cursor = 'grab'; };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);

  // Rendu seulement quand la montre est à l'écran.
  let visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(el);

  const clock = new THREE.Clock();
  let yaw = 0, pitch = 0;
  function frame() {
    raf = 0;
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!dragging) { userYaw *= 0.97; userPitch *= 0.97; }
    const autoYaw = still ? -0.35 : Math.sin(t * 0.45) * 0.75;
    const autoPitch = still ? -0.12 : -0.12 + Math.sin(t * 0.3) * 0.08;
    yaw += (autoYaw + userYaw - yaw) * 0.08;
    pitch += (autoPitch + userPitch - pitch) * 0.08;
    watch.group.rotation.set(pitch, yaw, 0);
    if (!still) watch.group.position.y = Math.sin(t * 0.8) * 0.04;
    watch.setTime(new Date());
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
        o.geometry.dispose();
        for (const m of [o.material].flat()) { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); }
      }
    });
    envTarget.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

/** Montre construite à partir de formes simples (unité : rayon du boîtier ≈ 1, cadran tourné vers +z). */
function buildWatch() {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xb4b4b0, metalness: 1, roughness: 0.24, envMapIntensity: 0.85 });
  const brushed = new THREE.MeshStandardMaterial({ color: 0xa8a8a3, metalness: 1, roughness: 0.42, envMapIntensity: 0.8 });
  const polished = new THREE.MeshStandardMaterial({ color: 0xe6e6e2, metalness: 0.9, roughness: 0.14 });

  const along = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2); // axe des cylindres vers +z

  // Boîtier, fond, lunette.
  group.add(new THREE.Mesh(along(new THREE.CylinderGeometry(1, 1, 0.32, 96)), steel));
  const back = new THREE.Mesh(along(new THREE.CylinderGeometry(0.86, 0.9, 0.1, 96)), brushed);
  back.position.z = -0.2;
  group.add(back);
  // Anneau ouvert : un cylindre plein masquerait le cadran.
  const bezel = new THREE.Mesh(along(new THREE.CylinderGeometry(0.99, 1.01, 0.08, 96, 1, true)), steel);
  bezel.position.z = 0.2;
  group.add(bezel);
  const insert = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.96, 96), new THREE.MeshStandardMaterial({ map: bezelTexture(), metalness: 0.1, roughness: 0.35 }));
  insert.position.z = 0.241;
  group.add(insert);
  const wall = new THREE.Mesh(along(new THREE.CylinderGeometry(0.78, 0.78, 0.09, 96, 1, true)), new THREE.MeshStandardMaterial({ color: 0x9a9a94, metalness: 1, roughness: 0.3, side: THREE.BackSide }));
  wall.position.z = 0.195;
  group.add(wall);

  // Cadran.
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.78, 96), new THREE.MeshStandardMaterial({ map: dialTexture(), metalness: 0.2, roughness: 0.5 }));
  dial.position.z = 0.168;
  group.add(dial);

  // Aiguilles (pivot au centre).
  const hand = (w: number, len: number, back: number, z: number, mat: THREE.Material) => {
    const g = new THREE.BoxGeometry(w, len + back, 0.012);
    g.translate(0, (len - back) / 2, 0);
    const m = new THREE.Mesh(g, mat);
    m.position.z = z;
    group.add(m);
    return m;
  };
  const hourHand = hand(0.07, 0.42, 0.06, 0.18, polished);
  const minuteHand = hand(0.05, 0.62, 0.08, 0.192, polished);
  const secondHand = hand(0.014, 0.7, 0.18, 0.204, polished);
  const cap = new THREE.Mesh(along(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 32)), polished);
  cap.position.z = 0.212;
  group.add(cap);

  // Verre saphir.
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.79, 96), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.06, envMapIntensity: 0.35,
  }));
  glass.position.z = 0.244;
  group.add(glass);

  // Couronne et cornes.
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 32).rotateZ(Math.PI / 2), brushed);
  crown.position.set(1.07, 0, 0);
  group.add(crown);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.2), steel);
    lug.position.set(sx * 0.4, sy * 0.98, -0.02);
    group.add(lug);
  }

  // Bracelet à maillons : une boucle qui part des cornes et passe derrière le boîtier.
  const R = 1.32, cz = -0.76, from = THREE.MathUtils.degToRad(62), to = THREE.MathUtils.degToRad(298);
  const count = 30;
  const links = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.17, 0.11), brushed, count);
  const centers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.172, 0.118), polished, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), axis = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i < count; i++) {
    const th = from + ((to - from) * (i + 0.5)) / count;
    q.setFromAxisAngle(axis, -th);
    m.compose(new THREE.Vector3(0, R * Math.sin(th), cz + R * Math.cos(th)), q, s);
    links.setMatrixAt(i, m);
    centers.setMatrixAt(i, m);
  }
  group.add(links, centers);

  const setTime = (d: Date) => {
    const sec = d.getSeconds() + d.getMilliseconds() / 1000;
    const min = d.getMinutes() + sec / 60;
    const hr = (d.getHours() % 12) + min / 60;
    hourHand.rotation.z = -(hr / 12) * Math.PI * 2;
    minuteHand.rotation.z = -(min / 60) * Math.PI * 2;
    secondHand.rotation.z = -(sec / 60) * Math.PI * 2;
  };
  return { group, setTime };
}

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return { c, g: c.getContext('2d')! };
}

function texture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Cadran noir soleillé, index appliqués, minuterie et nom de la maison. */
function dialTexture() {
  const S = 1024, C = S / 2;
  const { c, g } = canvas(S);
  const bg = g.createRadialGradient(C, C, 0, C, C, C);
  bg.addColorStop(0, '#262626'); bg.addColorStop(1, '#0a0a0a');
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  // Soleillé : fins rayons alternés.
  for (let i = 0; i < 360; i++) {
    g.strokeStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)';
    g.lineWidth = 3;
    const a = (i / 360) * Math.PI * 2;
    g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * C, C + Math.sin(a) * C); g.stroke();
  }
  g.translate(C, C);
  // Minuterie.
  for (let i = 0; i < 60; i++) {
    g.save(); g.rotate((i / 60) * Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.fillRect(-1.5, -C + 14, 3, i % 5 ? 14 : 22);
    g.restore();
  }
  // Index des heures (double à 12 h).
  for (let i = 0; i < 12; i++) {
    g.save(); g.rotate((i / 12) * Math.PI * 2);
    g.fillStyle = '#f2f2ee';
    if (i === 0) { g.fillRect(-26, -C + 52, 18, 96); g.fillRect(8, -C + 52, 18, 96); }
    else if (i % 3 === 0) g.fillRect(-12, -C + 52, 24, 96);
    else g.fillRect(-9, -C + 56, 18, 72);
    g.restore();
  }
  g.fillStyle = '#f2f2ee';
  g.textAlign = 'center';
  g.font = '600 50px Archivo, Helvetica, Arial, sans-serif';
  spaced(g, 'AERO WATCH', 0, -150, 10);
  g.fillStyle = 'rgba(242,242,238,.6)';
  g.font = '400 24px "IBM Plex Mono", monospace';
  spaced(g, 'AUTOMATIC', 0, 175, 6);
  return texture(c);
}

/** Lunette noire graduée (planaire : le dessin couvre tout le disque, seul l'anneau est visible). */
function bezelTexture() {
  const S = 1024, C = S / 2, inner = (0.78 / 0.96) * C;
  const { c, g } = canvas(S);
  g.fillStyle = '#121212';
  g.beginPath(); g.arc(C, C, C, 0, Math.PI * 2); g.arc(C, C, inner, 0, Math.PI * 2, true); g.fill();
  g.translate(C, C);
  g.fillStyle = '#e8e8e4';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 44px Archivo, Helvetica, Arial, sans-serif';
  const mid = (C + inner) / 2;
  for (let i = 0; i < 60; i += 5) {
    g.save(); g.rotate((i / 60) * Math.PI * 2);
    if (i === 0) { g.beginPath(); g.moveTo(0, -mid + 24); g.lineTo(-24, -mid - 18); g.lineTo(24, -mid - 18); g.closePath(); g.fill(); }
    else if (i % 10 === 0) g.fillText(String(i), 0, -mid);
    else g.fillRect(-5, -mid - 18, 10, 36);
    g.restore();
  }
  return texture(c);
}

function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  const widths = [...text].map((ch) => g.measureText(ch).width);
  let cx = x - (widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1)) / 2;
  g.textAlign = 'left';
  [...text].forEach((ch, i) => { g.fillText(ch, cx, y); cx += widths[i] + gap; });
  g.textAlign = 'center';
}
