import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, query, orderBy, limit, setDoc, addDoc, deleteDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, DEFAULT_LIVE_URL } from "./firebase-config.js";
import { T, DISC } from "./i18n.js";
import { PLAYLIST } from "./music/playlist.js";

const $ = id => document.getElementById(id);
const configured = !String(firebaseConfig.apiKey).includes("붙여넣기");

/* ---------- language ---------- */
let lang = "ko";
try {
  const s = localStorage.getItem("hm_lang");
  if (s && T[s]) lang = s;
  else { const n = (navigator.language || "").slice(0, 2); lang = T[n] ? n : (n && n !== "ko" ? "en" : "ko"); }
} catch (e) {}

/* ---------- state ---------- */
let user = null, isAdmin = false;
let notes = null, notesState = "loading", mine = null;
let clips = null, live = null, liveBusy = false;
const LIVE_MAX = 6 * 3600e3;
const FLAG = { KR:"🇰🇷", TH:"🇹🇭", SG:"🇸🇬", PH:"🇵🇭", US:"🇺🇸", JP:"🇯🇵", ID:"🇮🇩", MY:"🇲🇾", VN:"🇻🇳", XX:"🌏" };

/* ---------- static pieces ---------- */
function ring() {
  const svg = $("ring"), ns = "http://www.w3.org/2000/svg";
  const c = document.createElementNS(ns, "circle");
  Object.entries({ cx:100, cy:100, r:82, fill:"none", stroke:"var(--leaf)", "stroke-width":"1.2", "stroke-dasharray":"2 5" }).forEach(([k,v]) => c.setAttribute(k, v));
  svg.appendChild(c);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, x = 100 + 82 * Math.cos(a), y = 100 + 82 * Math.sin(a), deg = a * 180 / Math.PI;
    const g = document.createElementNS(ns, "g");
    g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
    if (i % 3 === 0) {
      for (let p = 0; p < 5; p++) {
        const e = document.createElementNS(ns, "ellipse");
        Object.entries({ cx:0, cy:-6, rx:3.6, ry:6, fill:"var(--petal)", opacity:".85", transform:`rotate(${p*72})` }).forEach(([k,v]) => e.setAttribute(k, v));
        g.appendChild(e);
      }
      const m = document.createElementNS(ns, "circle"); m.setAttribute("r", 2.6); m.setAttribute("fill", "var(--paper)"); g.appendChild(m);
    } else {
      const l = document.createElementNS(ns, "ellipse");
      Object.entries({ cx:0, cy:0, rx:3, ry:7, fill:"var(--leaf)", opacity:".7", transform:`rotate(${i%2?40:-40})` }).forEach(([k,v]) => l.setAttribute(k, v));
      g.appendChild(l);
    }
    svg.appendChild(g);
  }
}

function kstToday() { const n = new Date(Date.now() + 9 * 3600e3); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); }
function counts() {
  const t = T[lang], today = kstToday(), day = 864e5;
  const dp = Math.round((today - Date.UTC(2020, 10, 4)) / day) + 1;
  $("dplus").textContent = (lang === "en" || lang === "th") ? `${dp.toLocaleString()} ${t.days}` : `${dp.toLocaleString()}${t.days}`;
  const y = new Date(today).getUTCFullYear(); let b = Date.UTC(y, 8, 11); if (b < today) b = Date.UTC(y + 1, 8, 11);
  const dd = Math.round((b - today) / day);
  $("dbday").textContent = dd === 0 ? t.today : `D-${dd}`;
}

function disc() {
  const t = T[lang], ol = $("disc"); ol.textContent = "";
  for (const s of DISC) {
    const li = document.createElement("li");
    const d = document.createElement("div"); d.className = "date"; d.textContent = s.d;
    const w = document.createElement("div"); w.className = "song";
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = s.t;
    if (s.tag) { const b = document.createElement("span"); b.className = "badge"; b.textContent = t[s.tag]; ti.appendChild(b); }
    const idx = PLAYLIST.findIndex(p => p.disc === s.t);
    if (idx >= 0) { const pb = document.createElement("button"); pb.type = "button"; pb.className = "pl"; pb.textContent = "▶"; pb.setAttribute("aria-label", `${t.play} ${s.t}`); pb.onclick = () => playAt(idx); ti.appendChild(pb); }
    const g = document.createElement("div"); g.className = "g"; g.textContent = s.g[lang];
    w.append(ti, g); li.append(d, w); ol.appendChild(li);
  }
}

/* ---------- music player (starts only when a visitor taps, as browsers require) ---------- */
let track = 0;
const audio = $("audio");
function playAt(i) {
  track = (i + PLAYLIST.length) % PLAYLIST.length;
  audio.src = PLAYLIST[track].file;
  audio.play().catch(() => {});
}
function renderPlayer() {
  $("player").hidden = !PLAYLIST.length;
  if (!PLAYLIST.length) return;
  const playing = !audio.paused && !!audio.src;
  $("playbtn").textContent = playing ? T[lang].pause : T[lang].play;
  $("np").hidden = !audio.src;
  $("nptitle").textContent = PLAYLIST[track]?.title || "";
  $("nextbtn").hidden = PLAYLIST.length < 2;
}
$("playbtn").addEventListener("click", () => { if (!audio.src) playAt(0); else if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
$("nextbtn").addEventListener("click", () => playAt(track + 1));
audio.addEventListener("ended", () => { if (PLAYLIST.length > 1) playAt(track + 1); });
["play", "pause", "loadstart"].forEach(ev => audio.addEventListener(ev, renderPlayer));

/* ---------- guestbook ---------- */
function renderNotes() {
  const box = $("notes"), t = T[lang]; box.textContent = "";
  const msg = k => { const e = document.createElement("div"); e.className = "empty"; e.textContent = t[k]; box.appendChild(e); };
  if (!notes) return msg(notesState === "slow" ? "slow" : "loading");
  if (!notes.length) return msg("empty");
  const fmt = new Intl.DateTimeFormat({ ko:"ko-KR", ja:"ja-JP", th:"th-TH" }[lang] || "en-US", { year:"numeric", month:"short", day:"numeric" });
  for (const n of notes) {
    const a = document.createElement("article"); a.className = "note";
    const who = document.createElement("div"); who.className = "who";
    const b = document.createElement("b"); b.textContent = `${FLAG[n.from] || "🌏"} ${n.nick}`;
    const s = document.createElement("span"); s.textContent = n.at ? fmt.format(n.at) : "";
    who.append(b, s);
    if (isAdmin || (user && n.id === user.uid)) {
      const x = document.createElement("button"); x.className = "del"; x.type = "button"; x.textContent = t.del;
      x.onclick = () => deleteDoc(doc(db, "guestbook", n.id)).catch(() => {});
      who.appendChild(x);
    }
    const p = document.createElement("p"); p.textContent = n.msg;
    a.append(who, p); box.appendChild(a);
  }
}

/* ---------- 노래 영상 (TikTok · YouTube · Instagram) ---------- */
const PLAT = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
function parseVideo(u) {
  let x; try { x = new URL(u); } catch (e) { return null; }
  if (x.protocol !== "https:") return null;
  const h = x.hostname.toLowerCase().replace(/^(www|m)\./, "");
  if (/(^|\.)tiktok\.com$/.test(h)) {
    const id = (/\/video\/(\d{8,25})/.exec(x.pathname) || [])[1];
    const who = (/^\/(@[^/]+)/.exec(x.pathname) || [])[1];
    return { p: "tiktok", who: who || "TikTok", tall: true, embed: id ? `https://www.tiktok.com/player/v1/${id}?music_info=1&description=0&rel=0` : null };
  }
  if (h === "youtu.be" || /(^|\.)youtube\.com$/.test(h)) {
    const seg = x.pathname.split("/").filter(Boolean);
    let id = null, tall = false;
    if (h === "youtu.be") id = seg[0];
    else if (seg[0] === "shorts") { id = seg[1]; tall = true; }
    else if (seg[0] === "live" || seg[0] === "embed") id = seg[1];
    else id = x.searchParams.get("v");
    if (id && !/^[\w-]{6,20}$/.test(id)) id = null;
    return { p: "youtube", who: "YouTube", tall, embed: id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null };
  }
  if (/(^|\.)instagram\.com$/.test(h)) {
    const m = /\/(p|reel|reels|tv)\/([\w-]+)/.exec(x.pathname);
    return { p: "instagram", who: "Instagram", tall: true, insta: true, embed: m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed` : null };
  }
  return null;
}
let clipFilter = "all";
const chips = document.createElement("div"); chips.className = "chips"; chips.setAttribute("role", "group");
$("cliplist").before(chips);
function renderChips() {
  const t = T[lang], have = new Set((clips || []).map(c => (parseVideo(c.url) || {}).p).filter(Boolean));
  chips.textContent = ""; chips.hidden = have.size < 2;
  if (clipFilter !== "all" && !have.has(clipFilter)) clipFilter = "all";
  for (const k of ["all", "tiktok", "youtube", "instagram"]) {
    if (k !== "all" && !have.has(k)) continue;
    const b = document.createElement("button"); b.type = "button"; b.className = "chip " + k;
    b.textContent = k === "all" ? t.all : PLAT[k]; b.setAttribute("aria-pressed", clipFilter === k);
    b.onclick = () => { clipFilter = k; renderClips(); };
    chips.appendChild(b);
  }
}
function renderClips() {
  const box = $("cliplist"), t = T[lang]; box.textContent = "";
  $("curl").placeholder = "https://www.youtube.com/watch?v=…  ·  tiktok.com/@…/video/…  ·  instagram.com/reel/…";
  const msg = k => { const e = document.createElement("div"); e.className = "empty"; e.style.gridColumn = "1/-1"; e.textContent = t[k]; box.appendChild(e); };
  renderChips();
  if (!clips) return msg("loading");
  if (!clips.length) return msg("noclips");
  for (const c of clips) {
    const v = parseVideo(c.url) || { p: "tiktok", who: "", tall: true, embed: null };
    if (clipFilter !== "all" && v.p !== clipFilter) continue;
    const card = document.createElement("article"); card.className = `clip ${v.p}${v.tall ? "" : " wide"}`;
    if (v.embed) {
      const f = document.createElement("iframe");
      f.className = "embed" + (v.tall ? "" : " landscape") + (v.insta ? " insta" : ""); f.loading = "lazy"; f.title = c.song;
      f.src = v.embed;
      f.allow = "fullscreen; encrypted-media; picture-in-picture; autoplay";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      card.appendChild(f);
    } else {
      const a = document.createElement("a"); a.className = "face"; a.href = c.url; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", `${t.watch}: ${c.song}`);
      const src = document.createElement("span"); src.className = "src"; src.textContent = `${PLAT[v.p]} ↗`;
      const pl = document.createElement("span"); pl.className = "play";
      const who = document.createElement("span"); who.className = "who"; who.textContent = v.who;
      a.append(src, pl, who); card.appendChild(a);
    }
    const info = document.createElement("div"); info.className = "info";
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = c.song; info.appendChild(ti);
    if (c.cap) { const cp = document.createElement("div"); cp.className = "c"; cp.textContent = c.cap; info.appendChild(cp); }
    const m = document.createElement("div"); m.className = "m";
    const tag = document.createElement("span"); tag.className = "ptag " + v.p; tag.textContent = PLAT[v.p]; m.appendChild(tag);
    const d = document.createElement("span"); d.textContent = c.date || ""; m.appendChild(d);
    const go = document.createElement("a"); go.href = c.url; go.target = "_blank"; go.rel = "noopener"; go.className = "open"; go.textContent = "↗"; go.setAttribute("aria-label", t.watch); m.appendChild(go);
    if (isAdmin) { const x = document.createElement("button"); x.type = "button"; x.textContent = t.del; x.onclick = () => deleteDoc(doc(db, "clips", c.id)).catch(() => {}); m.appendChild(x); }
    info.appendChild(m); card.appendChild(info); box.appendChild(card);
  }
}

/* ---------- live ---------- */
const isLive = () => !!(live && live.on && live.url && Date.now() - (live.since || 0) < LIVE_MAX);
function renderLive() {
  const on = isLive(), t = T[lang];
  document.body.classList.toggle("is-live", on);
  const box = $("live"); box.hidden = !on;
  if (on) {
    $("livego").href = live.url; $("livepill").href = live.url;
    if (!box.querySelector(".spk")) for (let i = 0; i < 14; i++) {
      const k = document.createElement("span"); k.className = "spk";
      k.style.left = (4 + Math.random() * 92) + "%"; k.style.top = (6 + Math.random() * 86) + "%";
      k.style.animationDelay = (Math.random() * 1.8).toFixed(2) + "s";
      const z = 6 + Math.random() * 10; k.style.width = k.style.height = z + "px"; box.appendChild(k);
    }
  }
  $("admin").hidden = !isAdmin;
  const btn = $("livebtn"); btn.textContent = on ? t.b_live_end : t.b_live_start; btn.className = on ? "" : "start";
  $("liveurl").hidden = on;
}
setInterval(() => { if (live) renderLive(); }, 60000);

/* ---------- apply language ---------- */
function apply() {
  const t = T[lang]; document.documentElement.lang = lang;
  document.querySelectorAll("[data-i]").forEach(el => { const v = t[el.dataset.i]; if (v != null) el.textContent = v; });
  document.querySelectorAll(".langs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  counts(); disc(); renderNotes(); renderClips(); renderLive(); renderPlayer(); renderAdmin(); renderTicker(); renderCelebrate();
  $("send").textContent = mine ? t.b_edit : t.b_post;
}
document.querySelectorAll(".langs button").forEach(b => b.addEventListener("click", () => {
  lang = b.dataset.lang; try { localStorage.setItem("hm_lang", lang); } catch (e) {} apply();
}));
function renderAdmin() {
  const t = T[lang];
  $("adminbtn").textContent = (user && !user.isAnonymous) ? `${t.admin_out} (${user.email || ""})` : t.admin_in;
  $("clipform").hidden = !isAdmin;
  $("adminmsg").textContent = (user && !user.isAnonymous && !isAdmin) ? t.not_admin : "";
}

/* ---------- 꾸밈: 문구 ---------- */
const X = {
  ko: { tick: "전 세계 팬들의 응원", bday: "🎂 오늘은 현모의 생일이에요! 생일 축하해요!", debut: n => `🎉 오늘은 현모 데뷔 ${n}주년! 축하해요!` },
  en: { tick: "Cheers from around the world", bday: "🎂 It's Hyunmo's birthday today! Happy birthday!", debut: n => `🎉 Today is Hyunmo's ${n}-year debut anniversary!` },
  th: { tick: "กำลังใจจากแฟน ๆ ทั่วโลก", bday: "🎂 วันนี้วันเกิดฮยอนโม! สุขสันต์วันเกิดนะ!", debut: n => `🎉 วันนี้ครบรอบ ${n} ปีการเดบิวต์ของฮยอนโม!` },
  ja: { tick: "世界中のファンからの応援", bday: "🎂 今日はヒョンモの誕生日！お誕生日おめでとう！", debut: n => `🎉 今日はヒョンモのデビュー${n}周年！おめでとう！` }
};
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 꾸밈: 응원 메시지 전광판 ---------- */
const ticker = document.createElement("div");
ticker.className = "ticker"; ticker.hidden = true; ticker.setAttribute("aria-label", "fan messages");
ticker.innerHTML = '<span class="tk-label"></span><div class="tk-view"><div class="tk-track"></div></div>';
document.querySelector(".bar").after(ticker);
function renderTicker() {
  ticker.querySelector(".tk-label").textContent = "💌 " + X[lang].tick;
  const list = (notes || []).slice(0, 20);
  ticker.hidden = !list.length;
  if (!list.length) return;
  const track = ticker.querySelector(".tk-track"); track.textContent = "";
  const add = () => list.forEach(n => {
    const it = document.createElement("span"); it.className = "tk-item";
    const b = document.createElement("b"); b.textContent = `${FLAG[n.from] || "🌏"} ${n.nick}`;
    it.append(b, document.createTextNode(" " + String(n.msg).replace(/\s+/g, " ").slice(0, 80)));
    track.appendChild(it);
  });
  add(); add(); // 두 번 이어 붙여서 끊김 없이 흐르게
  track.style.setProperty("--dur", Math.max(20, list.length * 7) + "s");
}

/* ---------- 꾸밈: 꽃잎 흩날리기 + 기념일 꽃가루 ---------- */
const sky = document.createElement("canvas"); sky.className = "petals"; sky.setAttribute("aria-hidden", "true");
document.body.appendChild(sky);
const ctx = sky.getContext("2d");
const COLORS = ["#F4A6B8", "#F7C1CF", "#FAD4DD", "#E98AA5", "#BFE3CF", "#FFE3A3", "#C9D8FF"];
let petals = [], burst = [], W = 0, H = 0, dpr = 1;
function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; sky.width = W * dpr; sky.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function newPetal(top) {
  return { x: Math.random() * W, y: top ? -20 : Math.random() * H, r: 5 + Math.random() * 6, vy: 0.35 + Math.random() * 0.6,
    sway: Math.random() * Math.PI * 2, sw: 0.4 + Math.random() * 0.8, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.03,
    c: COLORS[Math.floor(Math.random() * 3)] };
}
function drawPetal(p, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
  ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.6, p.r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function frame() {
  ctx.clearRect(0, 0, W, H);
  for (const p of petals) {
    p.sway += 0.01; p.y += p.vy; p.x += Math.sin(p.sway) * p.sw; p.rot += p.vr;
    if (p.y > H + 20) Object.assign(p, newPetal(true));
    drawPetal(p, 0.55);
  }
  for (let i = burst.length - 1; i >= 0; i--) {
    const b = burst[i]; b.vy += 0.06; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life--;
    drawPetal(b, Math.min(1, b.life / 60));
    if (b.life <= 0 || b.y > H + 30) burst.splice(i, 1);
  }
  if (!document.hidden) requestAnimationFrame(frame); else running = false;
}
let running = false;
function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(frame); } }
document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
addEventListener("resize", size);
size();
const petalCount = innerWidth < 600 ? 10 : 18;
for (let i = 0; i < petalCount; i++) petals.push(newPetal(false));
start();
function confetti() {
  if (reduceMotion) return;
  for (let i = 0; i < 140; i++) burst.push({ x: W / 2 + (Math.random() - .5) * 120, y: H * 0.3, vx: (Math.random() - .5) * 9, vy: -4 - Math.random() * 6,
    r: 4 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.3, c: COLORS[Math.floor(Math.random() * COLORS.length)], life: 180 + Math.random() * 80 });
  start();
}

/* ---------- 꾸밈: 생일·데뷔 기념일 ---------- */
const celebrate = document.createElement("div"); celebrate.className = "celebrate"; celebrate.hidden = true;
document.querySelector(".hero").prepend(celebrate);
function celebrateKind() {
  const n = new Date(Date.now() + 9 * 3600e3), m = n.getUTCMonth() + 1, d = n.getUTCDate();
  if (location.hash === "#birthday" || (m === 9 && d === 11)) return { k: "bday" };
  if (location.hash === "#debut" || (m === 11 && d === 4)) return { k: "debut", n: n.getUTCFullYear() - 2020 };
  return null;
}
let celebrated = false;
function renderCelebrate() {
  const c = celebrateKind();
  celebrate.hidden = !c;
  if (!c) return;
  celebrate.textContent = c.k === "bday" ? X[lang].bday : X[lang].debut(c.n);
  if (!celebrated) { celebrated = true; setTimeout(confetti, 400); }
}
celebrate.addEventListener("click", confetti);

ring();
$("liveurl").value = DEFAULT_LIVE_URL;
apply();

/* ---------- Firebase ---------- */
let db = null;
if (!configured) {
  console.warn("firebase-config.js 에 Firebase 설정값을 넣어주세요.");
  notes = []; clips = []; apply();
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  db = getFirestore(app);

  // 누구나 볼 수 있는 데이터는 바로 구독
  const slow = setTimeout(() => { if (!notes) { notesState = "slow"; renderNotes(); } }, 10000);
  onSnapshot(query(collection(db, "guestbook"), orderBy("at", "desc"), limit(300)), snap => {
    clearTimeout(slow);
    notes = snap.docs.map(d => { const v = d.data({ serverTimestamps: "estimate" }); return { id: d.id, ...v, at: v.at?.toDate?.() || null }; });
    syncMine(); renderNotes(); renderTicker();
  }, () => { clearTimeout(slow); notesState = "slow"; notes = null; renderNotes(); });
  onSnapshot(query(collection(db, "clips"), orderBy("date", "desc"), limit(200)), snap => {
    clips = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderClips();
  }, () => { clips = []; renderClips(); });
  onSnapshot(doc(db, "status", "live"), d => { live = d.exists() ? d.data() : null; renderLive(); }, () => {});

  // 방문자는 보이지 않게 익명 로그인 → 로그인 화면 없이 응원 메시지를 쓸 수 있어요
  onAuthStateChanged(auth, async u => {
    if (!u) { signInAnonymously(auth).catch(() => {}); return; }
    user = u; isAdmin = false;
    if (!u.isAnonymous && u.email) isAdmin = await checkAdmin(u);
    $("form").hidden = false;
    syncMine(); renderNotes(); renderClips(); renderLive(); renderAdmin();
  });

  $("adminbtn").addEventListener("click", async () => {
    if (user && !user.isAnonymous) { await signOut(auth); return; }
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) {}
  });

  // 응원 메시지 남기기 / 고치기
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!user) return;
    const nick = $("nick").value.trim().slice(0, 24), msg = $("msg").value.trim().slice(0, 400), from = $("from").value;
    if (!nick || !msg) return;
    const btn = $("send"), st = $("status"); btn.disabled = true; st.textContent = "";
    try { await setDoc(doc(db, "guestbook", user.uid), { nick, msg, from, at: serverTimestamp() }); st.textContent = T[lang].posted; }
    catch (err) { st.textContent = T[lang].fail; }
    btn.disabled = false;
  });

  // 틱톡 영상 추가 (관리자)
  $("cdate").value = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  $("clipform").addEventListener("submit", async e => {
    e.preventDefault();
    const st = $("cstatus"), btn = $("cadd"), url = $("curl").value.trim();
    if (!parseVideo(url)) { st.textContent = T[lang].badurl; return; }
    const song = $("csong").value.trim().slice(0, 60), cap = $("ccap").value.trim().slice(0, 120), date = $("cdate").value || "";
    if (!song) return;
    btn.disabled = true; st.textContent = "";
    try { await addDoc(collection(db, "clips"), { url, song, cap, date, at: serverTimestamp() }); st.textContent = T[lang].added; $("clipform").reset(); $("cdate").value = date; }
    catch (err) { st.textContent = T[lang].fail; }
    btn.disabled = false;
  });

  // 라이브 켜기 / 끄기 (관리자)
  $("livebtn").addEventListener("click", async () => {
    if (liveBusy || !isAdmin) return;
    const st = $("livest"); st.textContent = "";
    const on = isLive(), url = $("liveurl").value.trim();
    if (!on) {
      let ok = false; try { const u = new URL(url); ok = /(^|\.)tiktok\.com$/i.test(u.hostname) && u.protocol === "https:"; } catch (e) {}
      if (!ok) { st.textContent = T[lang].live_need; return; }
    }
    liveBusy = true;
    try {
      await setDoc(doc(db, "status", "live"), on ? { on: false, url: live.url, since: live.since || 0 } : { on: true, url, since: Date.now() });
      if (!on) st.textContent = T[lang].live_auto;
    } catch (e) { st.textContent = T[lang].fail; }
    liveBusy = false;
  });
}

// 관리자 확인: 로그인 직후에는 데이터베이스가 새 로그인 정보를 늦게 받을 수 있어서 몇 번 다시 시도해요.
async function checkAdmin(u) {
  const email = String(u.email).trim().toLowerCase();
  for (let i = 0; i < 4; i++) {
    try {
      await u.getIdToken(i > 0);
      const snap = await getDoc(doc(db, "admins", email));
      console.info("[관리자 확인]", email, snap.exists() ? "관리자 맞음" : "admins 에 이 이메일 문서가 없음");
      return snap.exists();
    } catch (e) {
      console.warn("[관리자 확인 실패]", email, e && (e.code || e.message));
      await new Promise(r => setTimeout(r, 700 * (i + 1)));
    }
  }
  return false;
}

function syncMine() {
  if (!notes || !user) return;
  const m = notes.find(n => n.id === user.uid) || null;
  if (m && !mine) {
    const ae = document.activeElement?.id;
    if (!["nick", "msg", "from"].includes(ae)) { $("nick").value = m.nick || ""; $("msg").value = m.msg || ""; $("from").value = m.from || "XX"; }
  }
  mine = m; $("send").textContent = mine ? T[lang].b_edit : T[lang].b_post;
}
