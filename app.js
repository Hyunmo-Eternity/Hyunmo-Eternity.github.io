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

/* ---------- TikTok clips ---------- */
const tkId = u => (/\/video\/(\d{8,25})/.exec(u) || [])[1];
const tkUser = u => (/tiktok\.com\/(@[^/?#]+)/i.exec(u) || [])[1] || "TikTok";
function renderClips() {
  const box = $("cliplist"), t = T[lang]; box.textContent = "";
  const msg = k => { const e = document.createElement("div"); e.className = "empty"; e.style.gridColumn = "1/-1"; e.textContent = t[k]; box.appendChild(e); };
  if (!clips) return msg("loading");
  if (!clips.length) return msg("noclips");
  for (const c of clips) {
    const card = document.createElement("article"); card.className = "clip";
    const id = tkId(c.url);
    if (id) {
      const f = document.createElement("iframe");
      f.className = "embed"; f.loading = "lazy"; f.title = c.song;
      f.src = `https://www.tiktok.com/player/v1/${id}?music_info=1&description=0&rel=0`;
      f.allow = "fullscreen; encrypted-media; picture-in-picture";
      card.appendChild(f);
    } else {
      const a = document.createElement("a"); a.className = "face"; a.href = c.url; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", `${t.watch}: ${c.song}`);
      const src = document.createElement("span"); src.className = "src"; src.textContent = "TikTok ↗";
      const pl = document.createElement("span"); pl.className = "play";
      const who = document.createElement("span"); who.className = "who"; who.textContent = tkUser(c.url);
      a.append(src, pl, who); card.appendChild(a);
    }
    const info = document.createElement("div"); info.className = "info";
    const ti = document.createElement("div"); ti.className = "t"; ti.textContent = c.song; info.appendChild(ti);
    if (c.cap) { const cp = document.createElement("div"); cp.className = "c"; cp.textContent = c.cap; info.appendChild(cp); }
    const m = document.createElement("div"); m.className = "m";
    const d = document.createElement("span"); d.textContent = c.date || ""; m.appendChild(d);
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
  counts(); disc(); renderNotes(); renderClips(); renderLive(); renderPlayer(); renderAdmin();
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
    syncMine(); renderNotes();
  }, () => { clearTimeout(slow); notesState = "slow"; notes = null; renderNotes(); });
  onSnapshot(query(collection(db, "clips"), orderBy("date", "desc"), limit(200)), snap => {
    clips = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderClips();
  }, () => { clips = []; renderClips(); });
  onSnapshot(doc(db, "status", "live"), d => { live = d.exists() ? d.data() : null; renderLive(); }, () => {});

  // 방문자는 보이지 않게 익명 로그인 → 로그인 화면 없이 응원 메시지를 쓸 수 있어요
  onAuthStateChanged(auth, async u => {
    if (!u) { signInAnonymously(auth).catch(() => {}); return; }
    user = u; isAdmin = false;
    if (!u.isAnonymous && u.email) {
      try { isAdmin = (await getDoc(doc(db, "admins", u.email))).exists(); } catch (e) { isAdmin = false; }
    }
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
    let ok = false; try { const u = new URL(url); ok = /(^|\.)tiktok\.com$/i.test(u.hostname) && u.protocol === "https:"; } catch (err) {}
    if (!ok) { st.textContent = T[lang].badurl; return; }
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

function syncMine() {
  if (!notes || !user) return;
  const m = notes.find(n => n.id === user.uid) || null;
  if (m && !mine) {
    const ae = document.activeElement?.id;
    if (!["nick", "msg", "from"].includes(ae)) { $("nick").value = m.nick || ""; $("msg").value = m.msg || ""; $("from").value = m.from || "XX"; }
  }
  mine = m; $("send").textContent = mine ? T[lang].b_edit : T[lang].b_post;
}
