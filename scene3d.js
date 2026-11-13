// 🌌 3D 장면: 입장 인트로(동굴 → 우주 비행 → 입장)와 홈 화면의 거대한 크리스마스 트리
// three.js는 인터넷(jsDelivr)에서 불러와요. 못 불러오면 장면 없이 사이트가 그냥 열려요.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
let THREE = null;
async function three() { if (!THREE) THREE = await import(THREE_URL); return THREE; }

const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const DPR = () => Math.min(window.devicePixelRatio || 1, IOS ? 1.25 : 1.5);
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 부드러운 동그란 빛 (별·전구용)
function glowTex(T, inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, "0.8)")); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

/* =========================================================
   1. 입장 인트로
   ========================================================= */
export async function runIntro(box, { onDone } = {}) {
  let done = false, raf = 0, renderer = null;
  const finish = () => {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem("hm_intro", "1"); } catch (e) {}
    box.classList.add("out");
    setTimeout(() => { box.remove(); if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } onDone && onDone(); }, 900);
  };
  box.querySelector(".iskip").addEventListener("click", finish);
  const safety = setTimeout(finish, 14000);   // 무슨 일이 있어도 14초 뒤엔 열려요

  let T;
  try { T = await three(); } catch (e) { clearTimeout(safety); return finish(); }
  if (done) return;

  const W = () => innerWidth, H = () => innerHeight;
  renderer = new T.WebGLRenderer({ antialias: !IOS, powerPreference: "high-performance" });
  renderer.setPixelRatio(DPR()); renderer.setSize(W(), H());
  renderer.outputColorSpace = T.SRGBColorSpace;
  box.querySelector(".icanvas").appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.background = new T.Color(0x05030a);
  scene.fog = new T.FogExp2(0x0a0610, 0.045);
  const cam = new T.PerspectiveCamera(70, W() / H(), 0.1, 2000);

  // --- 동굴: 구불구불한 터널을 울퉁불퉁한 바위로 ---
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push(new T.Vector3(Math.sin(i * 0.9) * 4, Math.cos(i * 0.7) * 2.5, -i * 12));
  const curve = new T.CatmullRomCurve3(pts);
  const TS = 360, RS = 28, R = 3.2;
  const tube = new T.TubeGeometry(curve, TS, R, RS, false);
  const pos = tube.attributes.position, v = new T.Vector3(), c = new T.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const j = Math.floor(i / (RS + 1)), a = (i % (RS + 1)) / RS * Math.PI * 2;
    curve.getPointAt(j / TS, c); v.fromBufferAttribute(pos, i).sub(c);
    const z = j / TS * 140;
    const k = 1 + 0.22 * Math.sin(a * 5 + z * 0.6) * Math.cos(z * 1.1 + a * 3) + 0.12 * Math.sin(a * 13 + z * 2.3) + (Math.random() - 0.5) * 0.16;
    v.multiplyScalar(k).add(c); pos.setXYZ(i, v.x, v.y, v.z);
  }
  // 동굴 끝은 원래 크기로 열어줘요 (빛이 들어오는 입구)
  tube.computeVertexNormals();
  const rock = new T.MeshStandardMaterial({ color: 0x4a382e, roughness: 0.95, metalness: 0.05, flatShading: true, side: T.BackSide });
  scene.add(new T.Mesh(tube, rock));

  // 벽에 박힌 반짝이는 수정 (분홍 · 하늘 · 보라)
  const crys = new T.Group(), cg = new T.OctahedronGeometry(0.28, 0);
  const cCols = [0xff7eb6, 0x7fd6ff, 0xc59bff, 0xfff1a8];
  for (let i = 0; i < 70; i++) {
    const t = Math.random() * 0.92, a = Math.random() * Math.PI * 2;
    curve.getPointAt(t, c);
    const m = new T.Mesh(cg, new T.MeshBasicMaterial({ color: cCols[i % 4] }));
    m.position.set(c.x + Math.cos(a) * R * 0.86, c.y + Math.sin(a) * R * 0.86, c.z);
    m.scale.setScalar(0.6 + Math.random() * 1.4); m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    crys.add(m);
  }
  scene.add(crys);
  const torch = new T.PointLight(0xffc48a, 60, 22, 1.6); scene.add(torch);
  scene.add(new T.AmbientLight(0x6a5070, 0.5));

  // 동굴 끝의 빛
  const end = curve.getPointAt(1);
  const glow = glowTex(T, "rgba(255,240,250,1)");
  const exitLight = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff0f6, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  exitLight.position.copy(end).add(new T.Vector3(0, 0, -6)); exitLight.scale.setScalar(18); scene.add(exitLight);

  // --- 우주: 별 줄기(워프) · 성운 · 행성 ---
  const N = IOS ? 1400 : 2400, SP = 700;
  const sp = new Float32Array(N * 6), sc = new Float32Array(N * 6), stars = [];
  const sCols = [[1, 1, 1], [1, 0.75, 0.88], [0.7, 0.85, 1], [1, 0.95, 0.7]];
  for (let i = 0; i < N; i++) {
    const r = 3 + Math.pow(Math.random(), 0.6) * 60, a = Math.random() * Math.PI * 2;
    stars.push({ x: end.x + Math.cos(a) * r, y: end.y + Math.sin(a) * r, z: end.z - 10 - Math.random() * SP });
    const col = sCols[i % 4], b = 0.6 + Math.random() * 0.4;
    for (let k = 0; k < 2; k++) { sc[i * 6 + k * 3] = col[0] * b * (k ? 0.15 : 1); sc[i * 6 + k * 3 + 1] = col[1] * b * (k ? 0.15 : 1); sc[i * 6 + k * 3 + 2] = col[2] * b * (k ? 0.15 : 1); }
  }
  const sGeo = new T.BufferGeometry();
  sGeo.setAttribute("position", new T.BufferAttribute(sp, 3)); sGeo.setAttribute("color", new T.BufferAttribute(sc, 3));
  const streaks = new T.LineSegments(sGeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  streaks.frustumCulled = false; scene.add(streaks);

  const nebCols = [0xff5fa2, 0x8a6bff, 0x41c9ff, 0xff9f6b, 0xc06bff];
  for (let i = 0; i < 9; i++) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: glow, color: nebCols[i % 5], transparent: true, opacity: 0.32, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    s.position.set(end.x + (Math.random() - 0.5) * 120, end.y + (Math.random() - 0.5) * 70, end.z - 120 - i * 60);
    s.scale.setScalar(70 + Math.random() * 90); scene.add(s);
  }
  const planet = new T.Mesh(new T.SphereGeometry(9, 32, 24), new T.MeshStandardMaterial({ color: 0xffa7c9, roughness: 0.7, emissive: 0x401028, fog: false }));
  planet.position.set(end.x - 26, end.y + 10, end.z - 190); scene.add(planet);
  const ring = new T.Mesh(new T.RingGeometry(12, 17, 48), new T.MeshBasicMaterial({ color: 0xffe2a8, side: T.DoubleSide, transparent: true, opacity: 0.55, fog: false }));
  ring.position.copy(planet.position); ring.rotation.set(1.2, 0.3, 0); scene.add(ring);
  const sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(1, 1, 1); scene.add(sun);

  // 마지막에 다가가는 별 = 트리 꼭대기 별
  const goal = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffe9a8, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  goal.position.set(end.x, end.y, end.z - 520); goal.scale.setScalar(10); scene.add(goal);

  const onResize = () => { cam.aspect = W() / H(); cam.updateProjectionMatrix(); renderer.setSize(W(), H()); };
  addEventListener("resize", onResize);

  const CAVE = 3.4, SPACE = 4.2, t0 = performance.now();
  const look = new T.Vector3();
  let camZ = end.z, speed = 0, last = t0, el = 0;
  const title = box.querySelector(".ititle");

  function frame(now) {
    if (done) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; el += dt;   // 느린 폰에서도 장면을 건너뛰지 않아요
    if (el < CAVE) {
      const t = clamp(ease(el / CAVE) * 0.985, 0, 0.985);
      curve.getPointAt(t, cam.position); curve.getPointAt(Math.min(1, t + 0.03), look);
      cam.position.y += Math.sin(el * 9) * 0.04;   // 걷는 듯한 흔들림
      cam.lookAt(look); torch.position.copy(cam.position);
      scene.fog.density = 0.045;
      exitLight.scale.setScalar(18 + el * 6);
      speed = 20;
    } else {
      const s = el - CAVE;
      scene.fog.density = Math.max(0, 0.045 - s * 0.05);
      speed = Math.min(260, 20 + s * s * 40);
      camZ -= speed * dt;
      cam.position.set(end.x, end.y, camZ);
      cam.rotation.set(0, 0, Math.sin(s * 0.8) * 0.15);
      title.classList.toggle("on", s > 0.6 && s < SPACE - 0.4);
      const near = clamp((s - (SPACE - 1.4)) / 1.4, 0, 1);
      goal.position.z = camZ - 60 + near * 40; goal.scale.setScalar(10 + near * near * 90);
      if (s > SPACE - 0.5) box.classList.add("flash");
      if (s > SPACE) return finish();
    }
    // 별 줄기 길이 = 속도
    const len = 0.2 + speed * 0.012;
    for (let i = 0; i < N; i++) {
      const st = stars[i];
      if (st.z > cam.position.z + 2) st.z -= SP;
      sp[i * 6] = st.x; sp[i * 6 + 1] = st.y; sp[i * 6 + 2] = st.z;
      sp[i * 6 + 3] = st.x; sp[i * 6 + 4] = st.y; sp[i * 6 + 5] = st.z + len;
    }
    sGeo.attributes.position.needsUpdate = true;
    crys.children.forEach((m, i) => { m.rotation.y += dt * (0.5 + (i % 5) * 0.2); });
    planet.rotation.y += dt * 0.2;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  box.classList.add("ready");
  raf = requestAnimationFrame(frame);
  // finish가 불리면 resize 정리
  const origDone = onDone; onDone = () => { removeEventListener("resize", onResize); clearTimeout(safety); origDone && origDone(); };
}

/* =========================================================
   2. 거대한 크리스마스 트리 + 주변을 도는 모모님 · 양말이 사진
   ========================================================= */
export async function mountTree(box, photos) {
  let T;
  try { T = await three(); } catch (e) { box.hidden = true; return; }
  const canvasBox = box.querySelector(".tcanvas");
  const W = () => canvasBox.clientWidth, H = () => canvasBox.clientHeight;
  const renderer = new T.WebGLRenderer({ antialias: !IOS, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(DPR()); renderer.setSize(W(), H());
  renderer.outputColorSpace = T.SRGBColorSpace;
  canvasBox.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(42, W() / H(), 0.1, 200);
  const glow = glowTex(T);

  // 나무: 나선형으로 감긴 빛 알갱이
  const HGT = 16, BASE = 6.2, N = IOS ? 2200 : 3400;
  const p = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3);
  const greens = [[0.15, 0.75, 0.38], [0.2, 0.9, 0.5], [0.1, 0.6, 0.35]], bulbs = [[1, 0.35, 0.55], [1, 0.85, 0.3], [0.45, 0.75, 1], [1, 1, 1], [0.85, 0.5, 1]];
  for (let i = 0; i < N; i++) {
    const h = Math.pow(Math.random(), 0.8), y = h * HGT, rMax = BASE * (1 - h);
    const a = Math.random() * Math.PI * 2, r = rMax * Math.sqrt(Math.random()) * (0.75 + 0.25 * Math.random());
    // 가지처럼 층층이: 바깥쪽이 살짝 아래로 처지게
    const tier = (y % 2.3) / 2.3;
    p[i * 3] = Math.cos(a) * r * (0.75 + 0.35 * tier); p[i * 3 + 1] = y - (r / Math.max(0.01, rMax)) * 0.6; p[i * 3 + 2] = Math.sin(a) * r * (0.75 + 0.35 * tier);
    const bulb = Math.random() < 0.13, cc = bulb ? bulbs[i % 5] : greens[i % 3];
    base[i * 3] = cc[0]; base[i * 3 + 1] = cc[1]; base[i * 3 + 2] = cc[2];
  }
  col.set(base);
  const tGeo = new T.BufferGeometry();
  tGeo.setAttribute("position", new T.BufferAttribute(p, 3)); tGeo.setAttribute("color", new T.BufferAttribute(col, 3));
  const tree = new T.Points(tGeo, new T.PointsMaterial({ size: 0.42, map: glow, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(tree);

  // 금빛 리본 (나선)
  const RB = 700, rp = new Float32Array(RB * 3);
  for (let i = 0; i < RB; i++) {
    const t = i / RB, y = t * HGT * 0.96, a = t * Math.PI * 2 * 6.5;
    const r = BASE * (1 - t) * 1.02 + 0.15;
    rp[i * 3] = Math.cos(a) * r; rp[i * 3 + 1] = y; rp[i * 3 + 2] = Math.sin(a) * r;
  }
  const rGeo = new T.BufferGeometry(); rGeo.setAttribute("position", new T.BufferAttribute(rp, 3));
  const ribbon = new T.Points(rGeo, new T.PointsMaterial({ size: 0.32, map: glow, color: 0xffd36e, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(ribbon);

  // 꼭대기 별
  const starG = new T.Group();
  const shape = new T.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.45 : 1.05, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const star = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1 }), new T.MeshBasicMaterial({ color: 0xffe08a }));
  star.geometry.center(); starG.add(star);
  const halo = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff1b8, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(5); starG.add(halo);
  starG.position.y = HGT + 0.6; scene.add(starG);

  // 눈
  const SN = 500, snp = new Float32Array(SN * 3), snv = [];
  for (let i = 0; i < SN; i++) { snp[i * 3] = (Math.random() - 0.5) * 30; snp[i * 3 + 1] = Math.random() * 24 - 2; snp[i * 3 + 2] = (Math.random() - 0.5) * 30; snv.push(0.6 + Math.random() * 1.2); }
  const snGeo = new T.BufferGeometry(); snGeo.setAttribute("position", new T.BufferAttribute(snp, 3));
  scene.add(new T.Points(snGeo, new T.PointsMaterial({ size: 0.18, map: glow, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })));

  // 바닥의 은은한 빛
  const floor = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshBasicMaterial({ map: glow, color: 0xff9ec4, transparent: true, opacity: 0.55, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.7; scene.add(floor);

  // 사진: 폴라로이드 카드로 만들어 나무 주변 나선 위를 돌아요
  const cards = [];
  const list = photos.slice(0, IOS ? 10 : 14);
  list.forEach((src, i) => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => {
      const S = 256, PAD = 14, BOT = 44;
      const cv = document.createElement("canvas"); cv.width = S; cv.height = S + BOT - PAD;
      const g = cv.getContext("2d");
      g.fillStyle = "#fffaf3"; g.fillRect(0, 0, cv.width, cv.height);
      const iw = S - PAD * 2, s = Math.max(iw / img.width, iw / img.height);
      g.save(); g.beginPath(); g.rect(PAD, PAD, iw, iw); g.clip();
      g.drawImage(img, PAD + (iw - img.width * s) / 2, PAD + (iw - img.height * s) * 0.3, img.width * s, img.height * s); g.restore();
      g.font = "26px serif"; g.textAlign = "center"; g.fillText(src.startsWith("yangmal") ? "🐾" : ["💗", "🎄", "⭐", "🎁"][i % 4], S / 2, cv.height - 12);
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const m = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
      const t = (i + 0.5) / list.length;
      m.userData = { t, y: 0.8 + t * (HGT - 3), a: t * Math.PI * 2 * 3.1, phase: i * 1.7 };
      m.scale.set(2.2, 2.2 * cv.height / cv.width, 1);
      scene.add(m); cards.push(m);
    };
    img.src = src;
  });

  // 끌어서 돌리기 (세로 스크롤은 그대로)
  let rotY = 0, vel = 0.12, drag = null;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.addEventListener("pointerdown", e => { drag = { x: e.clientX, r: rotY }; });
  addEventListener("pointermove", e => { if (drag) { rotY = drag.r + (e.clientX - drag.x) * 0.01; vel = 0; } });
  addEventListener("pointerup", () => { if (drag) { drag = null; vel = 0.12; } });

  const onResize = () => { if (!W()) return; cam.aspect = W() / H(); cam.updateProjectionMatrix(); renderer.setSize(W(), H()); };
  addEventListener("resize", onResize);

  // 화면에 보일 때만 그려요 (배터리 · 메모리 절약)
  let visible = true, raf = 0, last = performance.now(), time = 0;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(performance.now()); }).observe(box);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(performance.now()); });

  function loop(now) {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden || box.offsetParent === null) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    rotY += vel * dt;
    tree.rotation.y = ribbon.rotation.y = rotY;
    starG.rotation.y = time * 1.2; halo.material.opacity = 0.7 + Math.sin(time * 3) * 0.25;
    // 전구 반짝반짝
    for (let i = 0; i < N; i += 7) {
      const k = 0.55 + 0.45 * Math.sin(time * 3 + i * 0.37);
      col[i * 3] = base[i * 3] * k; col[i * 3 + 1] = base[i * 3 + 1] * k; col[i * 3 + 2] = base[i * 3 + 2] * k;
    }
    tGeo.attributes.color.needsUpdate = true;
    for (let i = 0; i < SN; i++) { snp[i * 3 + 1] -= snv[i] * dt; if (snp[i * 3 + 1] < -1) snp[i * 3 + 1] = 22; snp[i * 3] += Math.sin(time + i) * 0.003; }
    snGeo.attributes.position.needsUpdate = true;
    // 사진: 나선을 따라 돌면서 하나씩 나타났다 사라져요
    cards.forEach(m => {
      const u = m.userData, a = u.a + rotY + time * 0.15;
      const r = BASE * (1 - u.y / HGT) + 2.3;
      m.position.set(Math.cos(a) * r, u.y + Math.sin(time * 1.3 + u.phase) * 0.25, Math.sin(a) * r);
      const cyc = (Math.sin(time * 0.55 + u.phase) + 1) / 2;   // 0~1
      const op = clamp((cyc - 0.25) * 2.5, 0, 1);
      m.material.opacity = op;
      const sc = 0.75 + op * 0.25; m.scale.x = 2.2 * sc; m.scale.y = m.scale.x * (m.material.map.image.height / m.material.map.image.width);
    });
    const portrait = H() > W();
    cam.position.set(0, HGT * 0.52, portrait ? 34 : 27); cam.lookAt(0, HGT * 0.47, 0);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  loop(performance.now());
  return { wake: () => loop(performance.now()) };
}

/* =========================================================
   3. 포근한 눈 마을 배경 (홈페이지 전체 뒤에서 움직여요)
   ========================================================= */
export async function mountSnowWorld(box, opts = {}) {
  let T;
  try { T = await three(); } catch (e) { return null; }
  const renderer = new T.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IOS ? 0.9 : 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  box.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  const glow = glowTex(T);

  // 낮(포근한 분홍 눈 오는 날) / 밤(보랏빛 눈 내리는 밤) 색
  const PAL = {
    day: { top: "#c9d6f3", mid: "#f4dbe6", low: "#ffeedd", fog: 0xf3e4ea, ground: 0xf8f8fd, hemiSky: 0xdfe6ff, hemiGnd: 0xffe4d6, sun: 0xfff0dd, win: 0xffc66b, sunI: 1.1, hemiI: 1.25 },
    night: { top: "#0f1430", mid: "#2b2552", low: "#5a3a62", fog: 0x2a2346, ground: 0xb9c3e6, hemiSky: 0x6070b8, hemiGnd: 0x3a2a4a, sun: 0xaab8ff, win: 0xffb347, sunI: 0.45, hemiI: 0.75 },
  };
  const isDark = () => document.documentElement.dataset.theme === "dark" || (document.documentElement.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  const skyCv = document.createElement("canvas"); skyCv.width = 4; skyCv.height = 256;
  const skyTex = new T.CanvasTexture(skyCv); skyTex.colorSpace = T.SRGBColorSpace; scene.background = skyTex;
  scene.fog = new T.FogExp2(0xffffff, 0.0125);
  const hemi = new T.HemisphereLight(0xffffff, 0xffffff, 1); scene.add(hemi);
  const sun = new T.DirectionalLight(0xffffff, 1); sun.position.set(-20, 30, 10); scene.add(sun);

  // 눈 덮인 언덕
  const gGeo = new T.PlaneGeometry(260, 260, 90, 90); gGeo.rotateX(-Math.PI / 2);
  const gp = gGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    gp.setY(i, Math.sin(x * 0.06) * 1.6 + Math.cos(z * 0.05 + x * 0.02) * 2.2 + Math.sin((x + z) * 0.12) * 0.5 + Math.max(0, -z - 40) * 0.08);
  }
  gGeo.computeVertexNormals();
  const groundMat = new T.MeshLambertMaterial({ color: 0xffffff });
  scene.add(new T.Mesh(gGeo, groundMat));
  const groundY = (x, z) => Math.sin(x * 0.06) * 1.6 + Math.cos(z * 0.05 + x * 0.02) * 2.2 + Math.sin((x + z) * 0.12) * 0.5 + Math.max(0, -z - 40) * 0.08;

  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3();
  // 눈 쌓인 전나무: 층층이 뾰족한 가지 + 가지마다 소복이 쌓인 눈 (한 번에 그려서 가벼워요)
  function mergeGeos(list) {
    let n = 0; list.forEach(([g]) => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), colr = new Float32Array(n * 3); let o = 0;
    list.forEach(([g, c]) => {
      const p = g.attributes.position.array; pos.set(p, o * 3);
      for (let i = 0; i < g.attributes.position.count; i++) { colr[(o + i) * 3] = c.r; colr[(o + i) * 3 + 1] = c.g; colr[(o + i) * 3 + 2] = c.b; }
      o += g.attributes.position.count;
    });
    const out = new T.BufferGeometry(); out.setAttribute("position", new T.BufferAttribute(pos, 3)); out.setAttribute("color", new T.BufferAttribute(colr, 3));
    out.computeVertexNormals(); return out;
  }
  function jag(g, amt, seed) {   // 아래쪽 테두리를 들쭉날쭉하게 = 가지 끝
    const p = g.attributes.position, h = g.parameters.height;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y < -h / 2 + 0.001) { const k = 1 + (i % 2 ? amt : -amt * 0.5) + Math.sin(i * 12.9898 + seed) * amt * 0.4; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y - (i % 2 ? amt * 0.35 : 0)); }
    }
    return g;
  }
  function pineGeo(seed) {
    const parts = [], G = new T.Color(0x2c6a4a), G2 = new T.Color(0x245c40), W = new T.Color(0xffffff), B = new T.Color(0x5a3a28);
    const trunk = new T.CylinderGeometry(0.12, 0.18, 1.2, 7).toNonIndexed(); trunk.translate(0, 0.6, 0); parts.push([trunk, B]);
    const tiers = 5;
    for (let k = 0; k < tiers; k++) {
      const t = k / tiers, r = 1.25 * (1 - t * 0.78), h = 1.15 - t * 0.25, y = 1.0 + k * 0.62;
      const cone = jag(new T.ConeGeometry(r, h, 12, 1), 0.22, seed + k).toNonIndexed(); cone.translate(0, y + h / 2, 0); parts.push([cone, k % 2 ? G2 : G]);
      const snow = jag(new T.ConeGeometry(r * 0.78, h * 0.55, 12, 1), 0.18, seed + k + 3).toNonIndexed(); snow.translate(0, y + h * 0.78, 0); parts.push([snow, W]);
    }
    const tip = new T.ConeGeometry(0.18, 0.5, 8).toNonIndexed(); tip.translate(0, 1.0 + tiers * 0.62 + 0.3, 0); parts.push([tip, W]);
    return mergeGeos(parts);
  }
  const TN = IOS ? 60 : 95, treeSpots = [];
  for (let i = 0; i < TN; i++) {
    let x, z, tries = 0;
    do { x = (Math.random() - 0.5) * 150; z = -6 - Math.random() * 115; tries++; }
    while (tries < 30 && ((Math.abs(x) < 5.4 && z > -95) || treeSpots.some(t => (t.x - x) ** 2 + (t.z - z) ** 2 < 9)));
    treeSpots.push({ x, z, s: 1.4 + Math.random() * 1.6, r: Math.random() * 6.28, tilt: (Math.random() - 0.5) * 0.08 });
  }
  const treeMat = new T.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  [0, 1].forEach(v => {
    const list = treeSpots.filter((_, i) => i % 2 === v);
    const im = new T.InstancedMesh(pineGeo(v * 7.7), treeMat, list.length);
    const col = new T.Color();
    list.forEach((t, i) => {
      Q.setFromEuler(new T.Euler(t.tilt, t.r, t.tilt * 0.6));
      im.setMatrixAt(i, M.compose(P.set(t.x, groundY(t.x, t.z) - 0.1, t.z), Q, S.set(t.s, t.s * (0.9 + Math.random() * 0.3), t.s)));
      im.setColorAt(i, col.setHSL(0.36 + Math.random() * 0.06, 0.35 + Math.random() * 0.2, 0.75 + Math.random() * 0.25));
    });
    scene.add(im);
  });
  // 길가 나무 몇 그루엔 반짝이 전구
  const twinkles = [];
  treeSpots.filter(t => t.z > -60 && Math.abs(t.x) < 22).slice(0, 8).forEach(t => {
    for (let k = 0; k < 9; k++) {
      const hh = 1.2 + k * 0.42, a = k * 2.4, rr = 1.2 * (1 - (hh - 1) / 3.6) * t.s * 0.95;
      const l = new T.Sprite(new T.SpriteMaterial({ map: glow, color: [0xff5a7a, 0xffd34d, 0x6fc8ff, 0xffffff][k % 4], transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      l.position.set(t.x + Math.cos(a) * rr, groundY(t.x, t.z) + hh * t.s, t.z + Math.sin(a) * rr); l.scale.setScalar(0.55); scene.add(l); twinkles.push(l);
    }
  });

  // 따뜻한 불빛이 새어 나오는 오두막
  const houses = [], smokes = [];
  const winMat = new T.MeshBasicMaterial({ color: 0xffc66b });
  const wallMat = new T.MeshLambertMaterial({ color: 0xc98b6b }), roofMat = new T.MeshLambertMaterial({ color: 0xffffff }), chimMat = new T.MeshLambertMaterial({ color: 0x8a5a48 });
  const roofG = new T.CylinderGeometry(0, 1, 1, 4, 1); roofG.rotateY(Math.PI / 4);
  [[-9, -22, 0.4], [7, -30, -0.5], [-3, -46, 0.2], [16, -52, -0.3], [-17, -40, 0.6]].forEach(([x, z, r], i) => {
    const g = new T.Group(), y = groundY(x, z);
    const wall = new T.Mesh(new T.BoxGeometry(3.4, 2.2, 2.8), wallMat); wall.position.y = 1.1; g.add(wall);
    const roof = new T.Mesh(roofG, roofMat); roof.scale.set(3.1, 1.7, 2.6); roof.position.y = 3.05; g.add(roof);
    const ch = new T.Mesh(new T.BoxGeometry(0.5, 1.2, 0.5), chimMat); ch.position.set(0.9, 3.4, 0.3); g.add(ch);
    for (const wx of [-0.8, 0.8]) { const w = new T.Mesh(new T.PlaneGeometry(0.7, 0.7), winMat); w.position.set(wx, 1.2, 1.41); g.add(w); }
    const door = new T.Mesh(new T.PlaneGeometry(0.6, 1.1), new T.MeshLambertMaterial({ color: 0x6b3f2e })); door.position.set(0, 0.55, 1.41); g.add(door);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffb35c, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
    halo.position.set(0, 1.2, 1.7); halo.scale.set(3, 1.9, 1); g.add(halo);
    g.position.set(x, y, z); g.rotation.y = r; scene.add(g); houses.push(halo);
    for (let k = 0; k < 6; k++) {
      const sm = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      sm.userData = { base: new T.Vector3(x + Math.cos(r) * 0.9 + Math.sin(r) * 0.3, y + 4.1, z - Math.sin(r) * 0.9 + Math.cos(r) * 0.3), t: k / 6 };
      scene.add(sm); smokes.push(sm);
    }
  });

  // 길을 따라 놓인 따뜻한 등불
  const lamps = [];
  for (let i = 0; i < 14; i++) {
    const z = -6 - i * 6, x = (i % 2 ? 4.2 : -4.2) + Math.sin(i) * 0.6, y = groundY(x, z);
    const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 1.6, 5), chimMat); post.position.set(x, y + 0.8, z); scene.add(post);
    const l = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xffcf7a, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    l.position.set(x, y + 1.75, z); l.scale.setScalar(1.1); scene.add(l); lamps.push(l);
  }

  // 눈송이: 가까운 것 · 중간 · 먼 것 세 층
  const layers = [];
  [[IOS ? 500 : 800, 0.55, 14], [IOS ? 700 : 1100, 0.32, 34], [IOS ? 600 : 900, 0.2, 70]].forEach(([n, size, range]) => {
    const pos = new Float32Array(n * 3), spd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * range * 2; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = -Math.random() * range * 1.6 + 6; spd[i] = 0.6 + Math.random() * 0.9; }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size, map: glow, color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
    scene.add(pts); layers.push({ pos, spd, g, range, n });
  });

  // 포근한 빛망울 (카메라 가까이 흐릿하게)
  const bokeh = [];
  const bCols = [0xffc2d6, 0xffe2a8, 0xcfe0ff, 0xffd0b5];
  for (let i = 0; i < 10; i++) {
    const b = new T.Sprite(new T.SpriteMaterial({ map: glow, color: bCols[i % 4], transparent: true, opacity: 0.1, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    b.userData = { x: (Math.random() - 0.5) * 16, y: 2 + Math.random() * 7, z: -2 - Math.random() * 6, ph: Math.random() * 6 };
    b.scale.setScalar(1.5 + Math.random() * 2.5); scene.add(b); bokeh.push(b);
  }

  function applyPalette() {
    const p = isDark() ? PAL.night : PAL.day;
    const g = skyCv.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, p.top); gr.addColorStop(0.55, p.mid); gr.addColorStop(1, p.low);
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256); skyTex.needsUpdate = true;
    scene.fog.color.setHex(p.fog); groundMat.color.setHex(p.ground);
    hemi.color.setHex(p.hemiSky); hemi.groundColor.setHex(p.hemiGnd); hemi.intensity = p.hemiI;
    sun.color.setHex(p.sun); sun.intensity = p.sunI; winMat.color.setHex(p.win);
    lamps.forEach(l => l.material.opacity = isDark() ? 1 : 0.55); houses.forEach(h => h.scale.set(isDark() ? 4.2 : 3, isDark() ? 2.6 : 1.9, 1));
  }
  applyPalette();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyPalette);
  new MutationObserver(applyPalette).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- 루돌프와 산타 ----------
  const mat = c => new T.MeshLambertMaterial({ color: c });
  const BROWN = mat(0x9a6440), LIGHT = mat(0xd9b48a), DARK = mat(0x4a2e20), ANT = mat(0xcaa070), BLACK = new T.MeshBasicMaterial({ color: 0x111111 });
  function reindeer(rudolph) {
    const g = new T.Group(), legs = [];
    const body = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), BROWN); body.scale.set(1.5, 0.85, 0.8); body.position.y = 1.15; g.add(body);
    const belly = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), LIGHT); belly.scale.set(1.3, 0.6, 0.72); belly.position.set(0, 1.0, 0); g.add(belly);
    const neck = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 0.7, 8), BROWN); neck.position.set(0.62, 1.55, 0); neck.rotation.z = -0.6; g.add(neck);
    const head = new T.Group(); head.position.set(0.88, 1.9, 0); g.add(head);
    const skull = new T.Mesh(new T.SphereGeometry(0.26, 12, 10), BROWN); skull.scale.set(1.15, 1, 0.95); head.add(skull);
    const snout = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), LIGHT); snout.position.set(0.26, -0.07, 0); snout.scale.set(1.2, 0.85, 0.9); head.add(snout);
    const nose = new T.Mesh(new T.SphereGeometry(rudolph ? 0.1 : 0.06, 10, 8), rudolph ? new T.MeshBasicMaterial({ color: 0xff2d3a }) : BLACK); nose.position.set(0.44, -0.04, 0); head.add(nose);
    if (rudolph) { const ng = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xff3b4a, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); ng.scale.setScalar(1.1); nose.add(ng); g.userData.noseGlow = ng; }
    for (const z of [-0.12, 0.12]) {
      const eye = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), BLACK); eye.position.set(0.18, 0.08, z); head.add(eye);
      const ear = new T.Mesh(new T.ConeGeometry(0.07, 0.22, 6), BROWN); ear.position.set(-0.05, 0.2, z * 1.9); ear.rotation.set(z > 0 ? 0.9 : -0.9, 0, 0); head.add(ear);
      const ant = new T.Group(); ant.position.set(-0.05, 0.22, z * 0.9); ant.rotation.set(z > 0 ? 0.35 : -0.35, 0, -0.25); head.add(ant);
      const a1 = new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 0.5, 5), ANT); a1.position.y = 0.25; ant.add(a1);
      const a2 = new T.Mesh(new T.CylinderGeometry(0.02, 0.025, 0.22, 5), ANT); a2.position.set(0.08, 0.3, 0); a2.rotation.z = -0.9; ant.add(a2);
      const a3 = new T.Mesh(new T.CylinderGeometry(0.02, 0.025, 0.2, 5), ANT); a3.position.set(-0.07, 0.42, 0); a3.rotation.z = 0.8; ant.add(a3);
    }
    for (const [x, z] of [[0.45, 0.2], [0.45, -0.2], [-0.45, 0.2], [-0.45, -0.2]]) {
      const hip = new T.Group(); hip.position.set(x, 0.95, z); g.add(hip);
      const leg = new T.Mesh(new T.CylinderGeometry(0.07, 0.06, 0.85, 6), BROWN); leg.position.y = -0.42; hip.add(leg);
      const hoof = new T.Mesh(new T.CylinderGeometry(0.075, 0.08, 0.1, 6), DARK); hoof.position.y = -0.88; hip.add(hoof);
      legs.push(hip);
    }
    const tail = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), new T.MeshLambertMaterial({ color: 0xffffff })); tail.position.set(-0.75, 1.3, 0); g.add(tail);
    const collar = new T.Mesh(new T.TorusGeometry(0.2, 0.05, 6, 14), mat(0xc8102e)); collar.position.set(0.66, 1.45, 0); collar.rotation.y = Math.PI / 2; collar.rotation.x = 0.6; g.add(collar);
    const bell = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), new T.MeshBasicMaterial({ color: 0xffd34d })); bell.position.set(0.8, 1.3, 0); g.add(bell);
    g.userData.legs = legs; g.userData.head = head;
    return g;
  }
  function santaSleigh() {
    const g = new T.Group(), RED = mat(0xc8102e), WHITE = mat(0xffffff), GOLD = new T.MeshLambertMaterial({ color: 0xe8b84a, emissive: 0x3a2400 }), SKIN = mat(0xffd2b0);
    const base = new T.Mesh(new T.BoxGeometry(1.9, 0.5, 1.1), RED); base.position.y = 0.55; g.add(base);
    const back = new T.Mesh(new T.BoxGeometry(0.35, 0.8, 1.1), RED); back.position.set(-0.85, 0.95, 0); g.add(back);
    const front = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 1.1, 12, 1, false, 0, Math.PI), RED); front.rotation.x = Math.PI / 2; front.position.set(0.92, 0.6, 0); g.add(front);
    const trim = new T.Mesh(new T.BoxGeometry(1.95, 0.08, 1.14), GOLD); trim.position.y = 0.82; g.add(trim);
    for (const z of [-0.45, 0.45]) {
      const run = new T.Mesh(new T.TorusGeometry(1.05, 0.05, 6, 20, Math.PI * 0.55), GOLD); run.position.set(0.1, 0.9, z); run.rotation.z = Math.PI * 1.22; g.add(run);
      const bar = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.9, 6), GOLD); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.1, z); g.add(bar);
    }
    const sack = new T.Mesh(new T.SphereGeometry(0.42, 12, 10), mat(0x8a5a3a)); sack.position.set(-0.55, 1.15, 0); sack.scale.set(1, 1.15, 1); g.add(sack);
    [[0xffd34d, -0.1, 0.25], [0x2e9e5b, 0.1, -0.25], [0x6fa8ff, -0.25, -0.15]].forEach(([c, x, z]) => { const b = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.3), mat(c)); b.position.set(-0.55 + x, 1.55, z); b.rotation.y = x * 3; g.add(b); });
    const santa = new T.Group(); santa.position.set(0.2, 0.8, 0); g.add(santa);
    const body = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), RED); body.scale.set(1, 1.1, 1); body.position.y = 0.45; santa.add(body);
    const belt = new T.Mesh(new T.TorusGeometry(0.4, 0.06, 6, 18), mat(0x222222)); belt.rotation.x = Math.PI / 2; belt.position.y = 0.4; santa.add(belt);
    const head = new T.Mesh(new T.SphereGeometry(0.24, 12, 10), SKIN); head.position.y = 1.05; santa.add(head);
    const beard = new T.Mesh(new T.SphereGeometry(0.24, 12, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), WHITE); beard.position.set(0.05, 1.0, 0); beard.scale.set(1.1, 1.3, 1.05); santa.add(beard);
    const hat = new T.Mesh(new T.ConeGeometry(0.24, 0.5, 12), RED); hat.position.set(-0.04, 1.4, 0); hat.rotation.z = 0.35; santa.add(hat);
    const brim = new T.Mesh(new T.TorusGeometry(0.22, 0.06, 6, 16), WHITE); brim.rotation.x = Math.PI / 2; brim.position.y = 1.2; santa.add(brim);
    const pom = new T.Mesh(new T.SphereGeometry(0.08, 8, 6), WHITE); pom.position.set(-0.2, 1.62, 0); santa.add(pom);
    for (const z of [-0.12, 0.12]) { const e = new T.Mesh(new T.SphereGeometry(0.03, 6, 5), BLACK); e.position.set(0.22, 1.1, z); santa.add(e); }
    const nose = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), mat(0xff9a8a)); nose.position.set(0.25, 1.04, 0); santa.add(nose);
    const arm = new T.Group(); arm.position.set(0.05, 0.75, 0.38); santa.add(arm);   // 손 흔드는 팔
    const sleeve = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.55, 8), RED); sleeve.position.y = 0.27; arm.add(sleeve);
    const mit = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), mat(0x2e7d4f)); mit.position.y = 0.58; arm.add(mit);
    g.userData.arm = arm; g.userData.head = head;
    return g;
  }
  const team = new T.Group(); scene.add(team);
  const sleigh = santaSleigh(); team.add(sleigh);
  const flyers = [];
  [[2.7, 0.55, false], [2.7, -0.55, false], [4.5, 0, true]].forEach(([x, z, rud]) => { const r = reindeer(rud); r.position.set(x, 0.35, z); r.scale.setScalar(0.85); team.add(r); flyers.push(r); });
  const reinMat = new T.LineBasicMaterial({ color: 0xe8b84a });
  const reins = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(1.0, 1.0, 0.3), new T.Vector3(2.9, 1.7, 0.5), new T.Vector3(4.6, 1.9, 0), new T.Vector3(2.9, 1.7, -0.5), new T.Vector3(1.0, 1.0, -0.3)]), reinMat);
  team.add(reins);
  // 땅 위를 걸어 다니는 루돌프
  const walker = reindeer(true); walker.scale.setScalar(1.05); scene.add(walker);

  // 말풍선 (메리 크리스마스!)
  const bubble = document.createElement("div"); bubble.className = "sw-bubble"; bubble.setAttribute("aria-hidden", "true"); document.body.appendChild(bubble);
  const say = opts.say || (k => k === "santa" ? "Ho Ho Ho! Merry Christmas! 🎅" : "Merry Christmas! 🦌");
  let bubbleWho = null, bubbleUntil = 0, nextShout = 3;

  // 마우스 · 기울기 · 스크롤에 따라 천천히 움직이는 카메라
  let mx = 0, my = 0, tmx = 0, tmy = 0, sc = 0;
  addEventListener("pointermove", e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
  const fit = () => { cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 1 ? 68 : 55; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
  fit(); addEventListener("resize", fit);

  let raf = 0, last = performance.now(), time = 0, on = true;
  function loop(now) {
    cancelAnimationFrame(raf);
    if (!on || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    sc += (Math.min(1, scrollY / max) - sc) * 0.06;
    // 스크롤하면 마을 안쪽으로 천천히 걸어 들어가요
    cam.position.set(Math.sin(time * 0.07) * 1.5 + mx * 2.5, 4.2 - sc * 1.2 + Math.sin(time * 0.5) * 0.08 - my * 0.8, 10 - sc * 34);
    cam.lookAt(mx * 4, 3 - sc * 0.8 - my, cam.position.z - 20);
    for (const L of layers) {
      const p = L.pos;
      for (let i = 0; i < L.n; i++) {
        p[i * 3 + 1] -= L.spd[i] * dt * 1.4;
        p[i * 3] += Math.sin(time * 0.8 + i) * dt * 0.35;
        if (p[i * 3 + 1] < -1) { p[i * 3 + 1] = 28; p[i * 3 + 2] = cam.position.z - Math.random() * L.range * 1.6 + 6; }
      }
      L.g.attributes.position.needsUpdate = true;
    }
    smokes.forEach(s => {
      const u = s.userData, t = (u.t + time * 0.12) % 1;
      s.position.copy(u.base).add(P.set(Math.sin(t * 6 + u.t * 9) * 0.4 + t * 1.2, t * 5, 0));
      s.scale.setScalar(0.6 + t * 2.4); s.material.opacity = 0.45 * Math.sin(t * Math.PI);
    });
    houses.forEach((h, i) => h.material.opacity = 0.45 + Math.sin(time * 2.2 + i * 1.3) * 0.08 + Math.sin(time * 7.1 + i) * 0.04);  // 벽난로 불빛처럼 일렁여요
    bokeh.forEach(b => { const u = b.userData; b.position.set(cam.position.x + u.x + Math.sin(time * 0.3 + u.ph) * 1.2, u.y + Math.cos(time * 0.25 + u.ph) * 0.8, cam.position.z + u.z); });
    // 반짝이 전구
    twinkles.forEach((l, i) => l.material.opacity = 0.55 + 0.45 * Math.sin(time * 3 + i * 1.7));
    // 산타 썰매: 마을 위를 8자로 날아다니며 왔다 갔다
    const zc = cam.position.z - 26, ft = time * 0.16;
    const halfW = d => d * Math.tan(cam.fov * Math.PI / 360) * cam.aspect;
    const A = clamp(halfW(26) * 1.25, 7, 22);
    const fp = (u, o) => o.set(Math.sin(u) * A, 7.5 + Math.sin(u * 2) * 1.4, zc + Math.sin(u * 2) * 7);
    const p0 = fp(ft, new T.Vector3()), p1 = fp(ft + 0.03, new T.Vector3());
    team.position.copy(p0);
    const dir = p1.sub(p0), yaw = Math.atan2(-dir.z, dir.x);
    team.rotation.set(0, yaw, 0); team.rotateZ(Math.atan2(dir.y, Math.hypot(dir.x, dir.z)));
    team.rotateX(-Math.cos(ft) * 0.25);   // 돌 때 살짝 기울어요
    flyers.forEach((r, i) => {
      r.position.y = 0.35 + Math.sin(time * 6 + i) * 0.12;
      r.userData.legs.forEach((l, k) => l.rotation.z = Math.sin(time * 9 + i + (k < 2 ? 0 : Math.PI)) * 0.7);
    });
    sleigh.userData.arm.rotation.x = -2.4 + Math.sin(time * 6) * 0.35;
    flyers[2].userData.noseGlow.material.opacity = 0.6 + Math.sin(time * 5) * 0.4;
    // 땅 위 루돌프: 나무 사이를 왔다 갔다
    const WA = clamp(halfW(15) * 1.15, 4, 11), wz = cam.position.z - 15, wcyc = time * 0.09 % 2, goingRight = wcyc < 1, wx = goingRight ? -WA + wcyc * 2 * WA : WA - (wcyc - 1) * 2 * WA;
    walker.position.set(wx, groundY(wx, wz) + 0.15 + Math.abs(Math.sin(time * 5)) * 0.08, wz);
    walker.rotation.y = goingRight ? 0 : Math.PI;
    walker.userData.legs.forEach((l, k) => l.rotation.z = Math.sin(time * 5 + (k % 2 ? 0 : Math.PI) + (k < 2 ? 0 : Math.PI / 2)) * 0.45);
    walker.userData.head.rotation.z = Math.sin(time * 2.5) * 0.12;
    walker.userData.noseGlow.material.opacity = 0.6 + Math.sin(time * 4) * 0.4;
    // 말풍선: 산타와 루돌프가 번갈아 "메리 크리스마스!"
    if (time > nextShout && !bubbleWho) { bubbleWho = Math.random() < 0.6 ? "santa" : "rudolph"; bubbleUntil = time + 3.4; bubble.textContent = say(bubbleWho); bubble.classList.add("on"); }
    if (bubbleWho) {
      const target = bubbleWho === "santa" ? sleigh.userData.head : walker.userData.head;
      const v = target.getWorldPosition(new T.Vector3()).project(cam);
      if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
        bubble.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, calc(-100% - 14px))`;
        bubble.style.visibility = "visible";
      } else bubble.style.visibility = "hidden";
      if (time > bubbleUntil) { bubble.classList.remove("on"); bubbleWho = null; nextShout = time + 5 + Math.random() * 4; }
    }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); loop(last); } });
  loop(last);
  box.classList.add("on");
  return { pause() { on = false; cancelAnimationFrame(raf); }, resume() { if (!on) { on = true; last = performance.now(); loop(last); } } };
}
