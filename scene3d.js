// 🌌 3D 장면: 입장 인트로(동굴 → 우주 비행 → 입장)와 홈 화면의 거대한 크리스마스 트리
// three.js는 인터넷(jsDelivr)에서 불러와요. 못 불러오면 장면 없이 사이트가 그냥 열려요.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
let THREE = null;
async function three() { if (!THREE) THREE = await import(THREE_URL); return THREE; }
// 진짜 3D 사슴 모델 (Quaternius "Stag", CC0 공개 라이선스)
const JSM = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/";
let stagP = null;
function loadStag() {
  if (!stagP) stagP = Promise.all([import(JSM + "loaders/GLTFLoader.js"), import(JSM + "utils/SkeletonUtils.js")])
    .then(([{ GLTFLoader }, SU]) => new Promise((ok, no) => new GLTFLoader().load("stag.glb", g => ok({ g, SU }), undefined, no)));
  return stagP;
}

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
const DEER_CAM = /[?&]deercam/.test(location.search);   // 순록 확인용 (주소 뒤에 ?deercam)
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
    day: { top: "#26306b", mid: "#7a5a9e", low: "#f6b3c4", fog: 0xc7a9cf, ground: 0xeef0ff, hemiSky: 0xc9d2ff, hemiGnd: 0xffd2dc, sun: 0xffe2c4, win: 0xffc66b, sunI: 0.85, hemiI: 1.05 },
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

  // ---------- 화려한 크리스마스 불빛 ----------
  // 모든 전구를 하나로 모아서 한 번에 그려요 (가볍게)
  const bulbPos = [], bulbCol = [];
  const BC = [[1, 0.25, 0.4], [1, 0.82, 0.25], [0.35, 0.75, 1], [0.45, 1, 0.55], [1, 1, 1], [0.95, 0.45, 1]];
  const addBulb = (x, y, z, k) => { bulbPos.push(x, y, z); const c = BC[k % BC.length]; bulbCol.push(c[0], c[1], c[2]); };
  // 1) 숲의 모든 나무에 나선형 전구
  treeSpots.forEach((t, ti) => {
    const gy = groundY(t.x, t.z), n = t.z > -70 ? 16 : 9;
    for (let k = 0; k < n; k++) {
      const u = k / n, hh = (1.0 + u * 3.1) * t.s, a = u * Math.PI * 2 * 3 + ti, rr = 1.25 * (1 - u * 0.78) * t.s * 1.02;
      addBulb(t.x + Math.cos(a) * rr, gy + hh, t.z + Math.sin(a) * rr, k + ti);
    }
  });
  // 2) 등불 사이를 잇는 전구 줄 (늘어진 줄처럼)
  const posts = [];
  for (let i = 0; i < 14; i++) { const z = -6 - i * 6, x = (i % 2 ? 4.2 : -4.2) + Math.sin(i) * 0.6; posts.push([x, groundY(x, z) + 1.6, z]); }
  const garland = (A, B, n, sag, k0) => { for (let k = 0; k <= n; k++) { const u = k / n; addBulb(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - Math.sin(u * Math.PI) * sag, A[2] + (B[2] - A[2]) * u, k + k0); } };
  for (let i = 0; i < posts.length - 2; i++) garland(posts[i], posts[i + 2], 12, 0.7, i);      // 같은 쪽 기둥끼리
  for (let i = 0; i < posts.length - 1; i += 2) garland(posts[i], posts[i + 1], 14, 0.9, i * 3);  // 길을 가로질러
  // 3) 오두막 지붕 테두리 전구
  [[-9, -22, 0.4], [7, -30, -0.5], [-3, -46, 0.2], [16, -52, -0.3], [-17, -40, 0.6]].forEach(([x, z, r], hi) => {
    const y = groundY(x, z), c = Math.cos(r), s = Math.sin(r);
    const loc = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    for (let k = 0; k <= 10; k++) { const u = k / 10; for (const side of [-1, 1]) { const p = loc(-1.9 + 3.8 * u, 2.25, side * 1.6); addBulb(p[0], p[1], p[2], k + hi + (side > 0 ? 2 : 0)); } }
    for (let k = 0; k <= 6; k++) { const u = k / 6; for (const side of [-1, 1]) { const p = loc(side * (1.9 - 1.9 * u), 2.25 + 1.6 * u, 1.45); addBulb(p[0], p[1], p[2], k + hi); } }
  });
  // 4) 마을 한가운데 거대한 빛의 트리
  const BIG = { x: 0, z: -78, h: 15, r: 5.2 }, bgy = groundY(BIG.x, BIG.z);
  for (let k = 0; k < (IOS ? 420 : 700); k++) {
    const u = Math.pow(Math.random(), 0.85), a = Math.random() * Math.PI * 2, rr = BIG.r * (1 - u) * (0.85 + Math.random() * 0.15);
    addBulb(BIG.x + Math.cos(a) * rr, bgy + u * BIG.h, BIG.z + Math.sin(a) * rr, k);
  }
  for (let k = 0; k < 160; k++) { const u = k / 160, a = u * Math.PI * 2 * 7; addBulb(BIG.x + Math.cos(a) * (BIG.r * (1 - u) + 0.2), bgy + u * BIG.h, BIG.z + Math.sin(a) * (BIG.r * (1 - u) + 0.2), 1); }
  const bigStar = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff0a0, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  bigStar.position.set(BIG.x, bgy + BIG.h + 0.8, BIG.z); bigStar.scale.setScalar(5); scene.add(bigStar);
  const bigHalo = new T.Mesh(new T.CircleGeometry(9, 40), new T.MeshBasicMaterial({ map: glow, color: 0xffb3d0, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }));
  bigHalo.rotation.x = -Math.PI / 2; bigHalo.position.set(BIG.x, bgy + 0.05, BIG.z); scene.add(bigHalo);

  const bulbN = bulbPos.length / 3, bulbBase = new Float32Array(bulbCol), bulbC = new Float32Array(bulbCol);
  const bulbGeo = new T.BufferGeometry();
  bulbGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(bulbPos), 3));
  bulbGeo.setAttribute("color", new T.BufferAttribute(bulbC, 3));
  const bulbs = new T.Points(bulbGeo, new T.PointsMaterial({ size: 0.42, map: glow, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(bulbs);

  // 5) 하늘: 반짝이는 별 · 오로라 빛 · 금가루
  const SKY = 360, skyP = new Float32Array(SKY * 3);
  for (let i = 0; i < SKY; i++) { const a = Math.random() * Math.PI - Math.PI, el = 0.12 + Math.random() * 0.75, R = 150; skyP[i * 3] = Math.cos(a) * Math.cos(el) * R * 1.6; skyP[i * 3 + 1] = Math.sin(el) * R * 0.55 + 10; skyP[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 40; }
  const skyGeo = new T.BufferGeometry(); skyGeo.setAttribute("position", new T.BufferAttribute(skyP, 3));
  const skyStars = new T.Points(skyGeo, new T.PointsMaterial({ size: 1.1, map: glow, color: 0xffffff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  scene.add(skyStars);
  const auroras = [];
  [[0x52ffd1, -50, 46], [0xff7ad9, 10, 52], [0x7aa8ff, 60, 44]].forEach(([c, x, y], i) => {
    const a = new T.Sprite(new T.SpriteMaterial({ map: glow, color: c, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    a.position.set(x, y, -150); a.scale.set(140, 34, 1); a.userData.ph = i * 2; scene.add(a); auroras.push(a);
  });
  const GL = IOS ? 160 : 260, glP = new Float32Array(GL * 3), glV = [];
  for (let i = 0; i < GL; i++) { glP[i * 3] = (Math.random() - 0.5) * 30; glP[i * 3 + 1] = Math.random() * 12; glP[i * 3 + 2] = -Math.random() * 40 + 4; glV.push(0.2 + Math.random() * 0.4); }
  const glGeo = new T.BufferGeometry(); glGeo.setAttribute("position", new T.BufferAttribute(glP, 3));
  const glitter = new T.Points(glGeo, new T.PointsMaterial({ size: 0.16, map: glow, color: 0xffd76e, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
  scene.add(glitter);
  // 6) 가끔 하늘에 터지는 불꽃
  const FW = 90, fwP = new Float32Array(FW * 3), fwV = new Float32Array(FW * 3);
  const fwGeo = new T.BufferGeometry(); fwGeo.setAttribute("position", new T.BufferAttribute(fwP, 3));
  const fwMat = new T.PointsMaterial({ size: 0.9, map: glow, color: 0xff7ab8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false });
  scene.add(new T.Points(fwGeo, fwMat));
  let fwT = 99, fwNext = 4;
  function boom(cx, cy, cz) {
    fwMat.color.setHex([0xff7ab8, 0xffd34d, 0x6fd3ff, 0x9dff8a, 0xd18bff][Math.floor(Math.random() * 5)]);
    for (let i = 0; i < FW; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), v = 5 + Math.random() * 3;
      fwP[i * 3] = cx; fwP[i * 3 + 1] = cy; fwP[i * 3 + 2] = cz;
      fwV[i * 3] = Math.sin(ph) * Math.cos(th) * v; fwV[i * 3 + 1] = Math.cos(ph) * v; fwV[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * v;
    }
    fwT = 0;
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
    lamps.forEach(l => l.material.opacity = 0.95); houses.forEach(h => h.scale.set(4, 2.5, 1));
  }
  applyPalette();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyPalette);
  new MutationObserver(applyPalette).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- 루돌프와 산타 ----------
  const mat = c => new T.MeshLambertMaterial({ color: c });
  const BROWN = mat(0x9a6440), LIGHT = mat(0xd9b48a), DARK = mat(0x4a2e20), ANT = mat(0xcaa070), BLACK = new T.MeshBasicMaterial({ color: 0x111111 });
  // 순록: 깊은 가슴 · 흰 목털 · 관절 있는 다리 · 여러 갈래 뿔 (부드러운 털빛 그라데이션)
  function paint(geo, top, bottom, y0, y1) {   // 위는 짙게, 배 쪽은 밝게
    const p = geo.attributes.position, c = new Float32Array(p.count * 3), A = new T.Color(top), B = new T.Color(bottom), C = new T.Color();
    for (let i = 0; i < p.count; i++) { const t = clamp((p.getY(i) - y0) / (y1 - y0), 0, 1); C.copy(B).lerp(A, t); c[i * 3] = C.r; c[i * 3 + 1] = C.g; c[i * 3 + 2] = C.b; }
    geo.setAttribute("color", new T.BufferAttribute(c, 3)); geo.computeVertexNormals(); return geo;
  }
  const FUR = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const HOOF = new T.MeshStandardMaterial({ color: 0x2a1d16, roughness: 0.6 });
  const BONE = new T.MeshStandardMaterial({ color: 0xd9c4a0, roughness: 0.7 });
  const EYE = new T.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.2, metalness: 0.3 });
  function antler(side) {
    const g = new T.Group();
    const tube = (pts, r) => { const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2] * side))); const geo = new T.TubeGeometry(c, 16, r, 6, false); return new T.Mesh(geo, BONE); };
    // 큰 줄기: 뒤로 휘었다가 앞으로 굽어요
    g.add(tube([[0, 0, 0], [-0.08, 0.25, 0.06], [-0.12, 0.55, 0.12], [-0.02, 0.85, 0.16], [0.14, 1.02, 0.12]], 0.028));
    // 앞으로 뻗은 눈썹 가지 (넓적하게)
    g.add(tube([[-0.02, 0.12, 0.03], [0.12, 0.2, 0.05], [0.24, 0.2, 0.02]], 0.022));
    // 가지들
    [[[-0.1, 0.42, 0.09], [-0.24, 0.58, 0.14], [-0.3, 0.7, 0.12]], [[-0.1, 0.62, 0.13], [0.0, 0.75, 0.24], [0.06, 0.82, 0.3]], [[-0.04, 0.82, 0.15], [-0.15, 0.98, 0.2], [-0.18, 1.08, 0.18]], [[0.06, 0.95, 0.14], [0.12, 1.1, 0.22], [0.1, 1.18, 0.26]]]
      .forEach(pts => g.add(tube(pts, 0.016)));
    return g;
  }
  function reindeer(rudolph) {
    const g = new T.Group(), legs = [];
    const TOP = 0x5e4434, BELLY = 0xcdb79c;
    // 몸통: 길쭉한 캡슐 + 깊은 가슴 + 엉덩이
    const torso = new T.Mesh(paint(new T.CapsuleGeometry(0.33, 0.95, 8, 18).rotateZ(Math.PI / 2), TOP, BELLY, -0.3, 0.25), FUR); torso.position.y = 1.18; g.add(torso);
    const chest = new T.Mesh(paint(new T.SphereGeometry(0.36, 18, 14), 0x6b4d3a, 0xe8dcc8, -0.35, 0.2), FUR); chest.position.set(0.48, 1.12, 0); chest.scale.set(1, 1.08, 0.92); g.add(chest);
    const rump = new T.Mesh(paint(new T.SphereGeometry(0.34, 18, 14), TOP, 0xd9c8b0, -0.3, 0.25), FUR); rump.position.set(-0.52, 1.2, 0); g.add(rump);
    const patch = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), new T.MeshStandardMaterial({ color: 0xf2ece2, roughness: 1 })); patch.position.set(-0.8, 1.2, 0); patch.scale.set(0.42, 0.95, 0.72); g.add(patch);
    const tail = new T.Mesh(new T.ConeGeometry(0.06, 0.16, 8), new T.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 1 })); tail.position.set(-0.86, 1.3, 0); tail.rotation.z = 2.3; g.add(tail);
    // 목: 두툼하게 위로, 아래엔 흰 갈기털
    const neckG = new T.Group(); neckG.position.set(0.66, 1.32, 0); neckG.rotation.z = -0.75; g.add(neckG);
    const neck = new T.Mesh(paint(new T.CylinderGeometry(0.13, 0.22, 0.62, 14), 0x6a4e3c, 0xb59c80, -0.3, 0.3), FUR); neck.position.y = 0.26; neckG.add(neck);
    const mane = new T.Mesh(new T.ConeGeometry(0.16, 0.42, 10, 1, true), new T.MeshStandardMaterial({ color: 0xeee4d4, roughness: 1, side: T.DoubleSide }));
    mane.position.set(-0.13, 0.12, 0); mane.rotation.z = 2.75; mane.scale.set(1, 1, 1.3); neckG.add(mane);
    // 머리: 길쭉한 얼굴 · 넓은 주둥이
    const head = new T.Group(); head.position.set(1.03, 1.78, 0); head.rotation.z = -0.35; g.add(head);
    const skull = new T.Mesh(paint(new T.CapsuleGeometry(0.11, 0.26, 6, 14).rotateZ(Math.PI / 2), 0x6a4e3c, 0xa58b70, -0.12, 0.1), FUR); skull.position.x = 0.08; head.add(skull);
    const muzzle = new T.Mesh(paint(new T.SphereGeometry(0.11, 14, 12), 0x8a6c55, 0xc8b49c, -0.1, 0.08), FUR); muzzle.position.set(0.3, -0.03, 0); muzzle.scale.set(1.1, 0.85, 1); head.add(muzzle);
    const nose = new T.Mesh(new T.SphereGeometry(rudolph ? 0.075 : 0.05, 12, 10), rudolph ? new T.MeshBasicMaterial({ color: 0xff2d3a }) : new T.MeshStandardMaterial({ color: 0x1d1512, roughness: 0.3 }));
    nose.position.set(0.41, -0.01, 0); head.add(nose);
    if (rudolph) { const ng = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xff3b4a, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); ng.scale.setScalar(0.9); nose.add(ng); g.userData.noseGlow = ng; }
    for (const z of [-1, 1]) {
      const eye = new T.Mesh(new T.SphereGeometry(0.026, 10, 8), EYE); eye.position.set(0.1, 0.05, z * 0.1); head.add(eye);
      const ear = new T.Mesh(paint(new T.SphereGeometry(0.08, 10, 8), 0x6a4e3c, 0xb59c80, -0.05, 0.05), FUR); ear.scale.set(0.45, 0.28, 1.15);
      ear.position.set(-0.02, 0.07, z * 0.15); ear.rotation.set(z * 0.5, 0, 0.3); head.add(ear);
      const an = antler(z); an.position.set(0.0, 0.08, z * 0.06); an.scale.setScalar(0.62); an.rotation.set(z * -0.25, 0, -0.15); head.add(an);
    }
    // 다리: 위쪽(굵게) - 무릎 - 아래쪽(가늘게) - 발굽
    for (const [x, z, front] of [[0.48, 0.17, 1], [0.48, -0.17, 1], [-0.52, 0.17, 0], [-0.52, -0.17, 0]]) {
      const hip = new T.Group(); hip.position.set(x, 1.02, z); g.add(hip);
      const up = new T.Mesh(paint(new T.CylinderGeometry(front ? 0.085 : 0.11, 0.05, 0.46, 10), 0x5e4434, 0x8a6e58, -0.23, 0.23), FUR); up.position.y = -0.21; hip.add(up);
      const knee = new T.Group(); knee.position.y = -0.44; hip.add(knee);
      const low = new T.Mesh(paint(new T.CylinderGeometry(0.042, 0.036, 0.44, 8), 0x7a624e, 0xe6ddd0, -0.22, 0.1), FUR); low.position.y = -0.22; knee.add(low);
      const fet = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), new T.MeshStandardMaterial({ color: 0xece4d8, roughness: 1 })); fet.position.y = -0.43; knee.add(fet);
      const hoof = new T.Mesh(new T.CylinderGeometry(0.05, 0.075, 0.09, 10), HOOF); hoof.position.set(0.02, -0.49, 0); knee.add(hoof);
      legs.push({ hip, knee, front });
    }
    if (rudolph) {   // 루돌프는 빨간 리본 목걸이와 금방울
      const collar = new T.Mesh(new T.TorusGeometry(0.17, 0.035, 8, 20), new T.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 })); collar.position.set(0.72, 1.42, 0); collar.rotation.set(0, Math.PI / 2, 0.75); g.add(collar);
      const bell = new T.Mesh(new T.SphereGeometry(0.055, 12, 10), new T.MeshStandardMaterial({ color: 0xffd34d, metalness: 0.8, roughness: 0.25 })); bell.position.set(0.86, 1.3, 0); g.add(bell);
    }
    g.userData.legs = legs; g.userData.head = head; g.userData.neck = neckG;
    return g;
  }
  // 걷기 · 달리기 동작 (대각선 다리끼리 같이 움직여요)
  function walkLegs(r, t, gallop) {
    r.userData.legs.forEach((L, k) => {
      const ph = t + (gallop ? (L.front ? 0 : Math.PI) + (k % 2) * 0.35 : ([0, Math.PI, Math.PI, 0][k]));
      if (gallop) { L.hip.rotation.z = (L.front ? 0.55 : -0.55) + Math.sin(ph) * 0.55; L.knee.rotation.z = L.front ? -0.9 - Math.sin(ph) * 0.4 : 0.6 + Math.sin(ph) * 0.3; }
      else { L.hip.rotation.z = Math.sin(ph) * 0.38; const lift = Math.max(0, -Math.cos(ph)); L.knee.rotation.z = L.front ? -lift * 0.9 : lift * 0.55; }
    });
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
  let walker = reindeer(true); walker.scale.setScalar(1.05); scene.add(walker);

  // 진짜 사슴 모델로 바꿔 끼워요 (못 불러오면 위의 사슴이 그대로 있어요)
  loadStag().then(({ g, SU }) => {
    g.scene.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(g.scene, true), size = box.getSize(new T.Vector3());   // 뼈대까지 계산한 진짜 크기
    const clipOf = n => g.animations.find(a => a.name === n) || g.animations.find(a => a.name.endsWith("|" + n));
    function mk(rudolph, clip, height) {
      const wrap = new T.Group(), root = SU.clone(g.scene);
      const k = height / size.y;
      root.scale.multiplyScalar(k); root.position.y = -box.min.y * k; root.rotation.y = Math.PI / 2;   // 앞을 +x 쪽으로
      root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
      wrap.add(root);
      const mixer = new T.AnimationMixer(root), act = mixer.clipAction(clipOf(clip));
      act.play(); act.time = Math.random() * act.getClip().duration;
      const head = root.getObjectByName("Head") || root;
      wrap.userData = { mixer, head, act, clips: { walk: mixer.clipAction(clipOf("Walk")), eat: mixer.clipAction(clipOf("Eating")), idle: mixer.clipAction(clipOf("Idle")) } };
      if (rudolph) {
        const tip = root.getObjectByName("Head_end") || head;
        const nose = new T.Mesh(new T.SphereGeometry(1, 14, 12), new T.MeshBasicMaterial({ color: 0xff2d3a }));
        tip.add(nose); wrap.updateMatrixWorld(true);
        const ws = tip.getWorldScale(new T.Vector3()).x;
        nose.scale.setScalar(0.07 * height / 2.5 / ws);   // 실제 크기 약 7cm 빨간 코
        const ng = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xff3b4a, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        ng.scale.setScalar(10); nose.add(ng); wrap.userData.noseGlow = ng; wrap.userData.nose = nose;
      }
      return wrap;
    }
    flyers.forEach((r, i) => {
      const d = mk(i === 2, "Gallop", 2.1);
      d.position.copy(r.position); d.position.y = 0.1; team.add(d); team.remove(r); flyers[i] = d;
    });
    const w = mk(true, "Walk", 2.5); scene.remove(walker); scene.add(w); walker = w;
  }).catch(() => {});

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
      if (r.userData.mixer) r.userData.mixer.update(dt * 1.15); else walkLegs(r, time * 9 + i * 0.7, true);
    });
    sleigh.userData.arm.rotation.x = -2.4 + Math.sin(time * 6) * 0.35;
    flyers[2].userData.noseGlow && (flyers[2].userData.noseGlow.material.opacity = 0.6 + Math.sin(time * 5) * 0.4);
    // 땅 위 루돌프: 나무 사이를 왔다 갔다
    const WA = clamp(halfW(15) * 1.15, 4, 11), wz = cam.position.z - 15, wcyc = time * 0.09 % 2, goingRight = wcyc < 1, wx = goingRight ? -WA + wcyc * 2 * WA : WA - (wcyc - 1) * 2 * WA;
    walker.position.set(wx, groundY(wx, wz) + (walker.userData.mixer ? -0.05 : 0.02 + Math.abs(Math.sin(time * 4.2)) * 0.04), wz);
    walker.rotation.y = goingRight ? 0 : Math.PI;
    if (walker.userData.mixer) walker.userData.mixer.update(dt);
    else {
      walkLegs(walker, time * 4.2, false);
      walker.userData.neck.rotation.z = -0.75 + Math.sin(time * 4.2 * 2) * 0.05;   // 걸을 때 고개가 끄덕끄덕
      walker.userData.head.rotation.z = -0.35 + Math.sin(time * 4.2 * 2 + 0.6) * 0.06;
    }
    walker.userData.noseGlow.material.opacity = 0.6 + Math.sin(time * 4) * 0.4;
    // 말풍선: 산타와 루돌프가 번갈아 "메리 크리스마스!"
    if (time > nextShout && !bubbleWho) { bubbleWho = Math.random() < 0.6 ? "santa" : "rudolph"; bubbleUntil = time + 3.4; bubble.textContent = say(bubbleWho); bubble.classList.add("on"); }
    if (bubbleWho) {
      const target = bubbleWho === "santa" ? sleigh.userData.head : walker.userData.head;
      const v = target.getWorldPosition(new T.Vector3()).project(cam);
      if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
        const bw = bubble.offsetWidth / 2 + 12, bx = clamp((v.x * 0.5 + 0.5) * innerWidth, bw, innerWidth - bw);   // 화면 밖으로 안 나가게
        bubble.style.transform = `translate(${bx}px, ${Math.max(70, (-v.y * 0.5 + 0.5) * innerHeight)}px) translate(-50%, calc(-100% - 14px))`;
        bubble.style.visibility = "visible";
      } else bubble.style.visibility = "hidden";
      if (time > bubbleUntil) { bubble.classList.remove("on"); bubbleWho = null; nextShout = time + 5 + Math.random() * 4; }
    }
    // 화려한 불빛 반짝반짝
    for (let i = (Math.floor(time * 60) % 3); i < bulbN; i += 3) {
      const k = 0.35 + 0.65 * Math.max(0, Math.sin(time * 2.6 + i * 0.91));
      bulbC[i * 3] = bulbBase[i * 3] * k; bulbC[i * 3 + 1] = bulbBase[i * 3 + 1] * k; bulbC[i * 3 + 2] = bulbBase[i * 3 + 2] * k;
    }
    bulbGeo.attributes.color.needsUpdate = true;
    bigStar.scale.setScalar(5 + Math.sin(time * 3) * 0.8); bigHalo.material.opacity = 0.45 + Math.sin(time * 1.5) * 0.15;
    skyStars.material.opacity = 0.75 + Math.sin(time * 1.7) * 0.2;
    auroras.forEach(a => { a.position.x += Math.sin(time * 0.1 + a.userData.ph) * 0.03; a.material.opacity = 0.16 + Math.sin(time * 0.4 + a.userData.ph) * 0.08; });
    for (let i = 0; i < GL; i++) {
      glP[i * 3 + 1] += glV[i] * dt; glP[i * 3] += Math.sin(time + i) * dt * 0.2;
      if (glP[i * 3 + 1] > 12) { glP[i * 3 + 1] = 0; glP[i * 3 + 2] = cam.position.z - Math.random() * 40 + 4; }
    }
    glGeo.attributes.position.needsUpdate = true;
    if (time > fwNext) { boom((Math.random() - 0.5) * 30, 18 + Math.random() * 8, cam.position.z - 55 - Math.random() * 20); fwNext = time + 5 + Math.random() * 5; }
    if (fwT < 2.2) {
      fwT += dt;
      for (let i = 0; i < FW; i++) { fwV[i * 3 + 1] -= 3.5 * dt; fwP[i * 3] += fwV[i * 3] * dt; fwP[i * 3 + 1] += fwV[i * 3 + 1] * dt; fwP[i * 3 + 2] += fwV[i * 3 + 2] * dt; }
      fwGeo.attributes.position.needsUpdate = true; fwMat.opacity = Math.max(0, 1 - fwT / 2.2);
    }
    if (DEER_CAM) { cam.position.set(walker.position.x + 2.6, walker.position.y + 1.6, walker.position.z + 3.2); cam.lookAt(walker.position.x, walker.position.y + 1.1, walker.position.z); }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); loop(last); } });
  loop(last);
  box.classList.add("on");
  return { pause() { on = false; cancelAnimationFrame(raf); }, resume() { if (!on) { on = true; last = performance.now(); loop(last); } } };
}
