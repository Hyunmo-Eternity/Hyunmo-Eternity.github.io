import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, query, orderBy, limit, setDoc, addDoc, deleteDoc, getDoc, serverTimestamp, increment, where, getCountFromServer, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, DEFAULT_LIVE_URL } from "./firebase-config.js";
import { T, DISC } from "./i18n.js";
import * as PL from "./music/playlist.js";
const PLAYLIST = PL.PLAYLIST || [];
const AUTO_START = PL.AUTO_START !== false;
import { PHOTOS, PHOTO_SECONDS } from "./photos.js";
import { QUIZ } from "./quiz.js";
import { checkText } from "./filter.js";
import { SHOP_URL, PRODUCT_URL, SEARCH_WORD } from "./shop.js";

const $ = id => document.getElementById(id);
const configured = !String(firebaseConfig.apiKey).includes("붙여넣기");

/* ---------- language ---------- */
let lang = "ko";
try {
  const s = localStorage.getItem("hm_lang");
  if (s && T[s]) lang = s;
  else { const n = (navigator.language || "").slice(0, 2), m = { tl: "fil", fi: "en" }[n] || ((navigator.language || "").toLowerCase().startsWith("fil") ? "fil" : n); lang = T[m] ? m : (n && n !== "ko" ? "en" : "ko"); }
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
  $("dplus").textContent = (lang === "en" || lang === "th" || lang === "fil" || lang === "es") ? `${dp.toLocaleString()} ${t.days}` : `${dp.toLocaleString()}${t.days}`;
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

/* ---------- 노래 플레이어 ---------- */
// 브라우저는 소리 자동 재생을 막아요. 그래서 먼저 바로 재생을 시도하고, 막히면 방문자가 화면을 처음 누르는 순간 시작해요.
// 방문자가 직접 멈추면 기억해 두고 다음에 와도 저절로 켜지 않아요.
let track = 0, userPaused = false, autoArmed = false;
try { userPaused = localStorage.getItem("hm_music_off") === "1"; } catch (e) {}
const audio = $("audio");
audio.preload = "metadata";
function playAt(i) {
  track = (i + PLAYLIST.length) % PLAYLIST.length;
  audio.src = PLAYLIST[track].file;
  return audio.play();
}
function fmtTime(sec) { if (!isFinite(sec)) return "0:00"; const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, "0")}`; }
function renderPlayer() {
  $("player").hidden = !PLAYLIST.length;
  if (!PLAYLIST.length) return;
  const playing = !audio.paused && !!audio.src;
  $("player").classList.toggle("playing", playing);
  $("playbtn").textContent = playing ? "❚❚" : "▶";
  $("playbtn").setAttribute("aria-label", playing ? T[lang].pause : T[lang].play);
  $("np").hidden = false;
  $("nptitle").textContent = PLAYLIST[track]?.title || "";
  $("nplabel").textContent = playing ? T[lang].now : T[lang].play;
  $("nextbtn").hidden = PLAYLIST.length < 2;
}
function startMusic() {
  if (!PLAYLIST.length || userPaused) return;
  (audio.src ? audio.play() : playAt(track)).catch(() => armFirstTouch());
}
function armFirstTouch() {
  if (autoArmed) return; autoArmed = true;
  const go = e => {
    if (e.target.closest && e.target.closest("#player")) return cleanup(); // 플레이어를 직접 누른 경우는 버튼이 처리해요
    cleanup();
    if (!userPaused && audio.paused) (audio.src ? audio.play() : playAt(track)).catch(() => {});
  };
  const cleanup = () => { ["pointerdown", "keydown"].forEach(ev => removeEventListener(ev, go, true)); };
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, go, true));
}
$("playbtn").addEventListener("click", () => {
  if (audio.paused) { userPaused = false; try { localStorage.removeItem("hm_music_off"); } catch (e) {} (audio.src ? audio.play() : playAt(track)).catch(() => {}); }
  else { userPaused = true; try { localStorage.setItem("hm_music_off", "1"); } catch (e) {} audio.pause(); }
});
$("nextbtn").addEventListener("click", () => { userPaused = false; playAt(track + 1).catch(() => {}); });
audio.addEventListener("ended", () => { playAt(track + 1).catch(() => {}); });
audio.addEventListener("timeupdate", () => {
  const p = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  $("player").style.setProperty("--prog", p + "%");
  $("nptime").textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
});
["play", "pause", "loadstart"].forEach(ev => audio.addEventListener(ev, renderPlayer));
if (AUTO_START && PLAYLIST.length) setTimeout(startMusic, 600);
audio.addEventListener("play", () => { if (typeof onlyThis === "function") onlyThis(null); });

/* ---------- guestbook ---------- */
function renderNotes() {
  const box = $("notes"), t = T[lang]; box.textContent = "";
  const msg = k => { const e = document.createElement("div"); e.className = "empty"; e.textContent = t[k]; box.appendChild(e); };
  if (!notes) return msg(notesState === "slow" ? "slow" : "loading");
  if (!notes.length) return msg("empty");
  const fmt = new Intl.DateTimeFormat({ ko:"ko-KR", ja:"ja-JP", th:"th-TH", zh:"zh-CN", fil:"fil-PH", es:"es-ES" }[lang] || "en-US", { year:"numeric", month:"short", day:"numeric" });
  for (const n of notes.filter(n => !checkText(n.nick, n.msg))) {
    const a = document.createElement("article"); a.className = "note";
    const who = document.createElement("div"); who.className = "who";
    const b = document.createElement("b"); b.textContent = `${FLAG[n.from] || "🌏"} ${n.nick}`;
    const s = document.createElement("span"); s.textContent = n.at ? fmt.format(n.at) : "";
    who.append(b, s);
    if (isAdmin || (user && n.id === user.uid)) {
      const x = document.createElement("button"); x.className = "del"; x.type = "button"; x.textContent = t.del;
      x.onclick = () => deleteDoc(doc(db, "guestbook", n.id)).then(() => { if (n.id !== user.uid) logAct("a_del_cheer", n.msg, { target: n.id, targetNick: n.nick }); else logAct("cheer_del", n.msg); }).catch(() => {});
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
    return { p: "youtube", who: "YouTube", tall, embed: id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` : null };
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
      f.src = v.embed; f.dataset.p = v.p;
      if (v.p === "youtube") f.addEventListener("load", () => { try { f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: c.id }), "*"); } catch (e) {} });
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
    if (c.byNick) { const by = document.createElement("span"); by.className = "by"; by.textContent = `${t.sg_by} ${FLAG[c.byFrom] || "🌏"} ${c.byNick}`; m.appendChild(by); }
    const go = document.createElement("a"); go.href = c.url; go.target = "_blank"; go.rel = "noopener"; go.className = "open"; go.textContent = "↗"; go.setAttribute("aria-label", t.watch); m.appendChild(go);
    if (isAdmin) { const x = document.createElement("button"); x.type = "button"; x.textContent = t.del; x.onclick = () => deleteDoc(doc(db, "clips", c.id)).then(() => logAct("a_del_video", c.song)).catch(() => {}); m.appendChild(x); }
    info.appendChild(m); card.appendChild(info); box.appendChild(card);
  }
}

/* ---------- 영상은 한 번에 하나만 재생 ---------- */
function stopFrame(f) {
  try {
    if (f.dataset.p === "tiktok") f.contentWindow.postMessage({ type: "pause", "x-tiktok-player": true }, "*");
    else if (f.dataset.p === "youtube") f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    else if (f.dataset.p === "instagram") { const src = f.src; f.src = "about:blank"; f.src = src; } // 인스타그램은 멈춤 명령이 없어서 다시 불러와요
  } catch (e) {}
}
function onlyThis(playing) {
  document.querySelectorAll("iframe.embed").forEach(f => { if (f !== playing && f.dataset.active === "1") { stopFrame(f); f.dataset.active = ""; } });
  if (playing) playing.dataset.active = "1";
  if (playing && typeof audio !== "undefined" && !audio.paused) audio.pause();
}
// 영상 쪽에서 "재생 시작" 신호를 보내면 다른 영상 멈추기
addEventListener("message", e => {
  const f = [...document.querySelectorAll("iframe.embed")].find(x => x.contentWindow === e.source);
  if (!f) return;
  let d = e.data;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (err) { return; } }
  if (!d) return;
  const playing = (d["x-tiktok-player"] && d.type === "onStateChange" && d.value === 1)
    || (d.event === "onStateChange" && d.info === 1)
    || (d.event === "infoDelivery" && d.info && d.info.playerState === 1);
  if (playing) onlyThis(f);
});
// 신호를 안 보내는 영상(인스타그램 등)은 영상 안을 누르는 순간을 잡아요
addEventListener("blur", () => setTimeout(() => {
  const a = document.activeElement;
  if (a && a.tagName === "IFRAME" && a.classList.contains("embed")) onlyThis(a);
}, 0));
// 영상을 누른 뒤 다른 영상을 또 누를 수 있게 포커스를 되돌려요
document.addEventListener("pointerover", e => {
  if (e.target.tagName === "IFRAME" && document.activeElement && document.activeElement.tagName === "IFRAME" && document.activeElement !== e.target) window.focus();
});

/* ---------- 팬 영상 추천 → 관리자 승인 ---------- */
let pending = [], unsubPending = null;
const sgBox = document.createElement("details"); sgBox.className = "suggest";
sgBox.innerHTML = `<summary></summary>
  <form class="sgf" id="sgform">
    <label><span data-k="l_url"></span><input id="sg_url" type="url" inputmode="url" required></label>
    <div class="row">
      <label><span data-k="l_song"></span><input id="sg_song" maxlength="60" required></label>
      <label><span data-k="l_nick"></span><input id="sg_nick" maxlength="24" required autocomplete="nickname"></label>
      <label><span data-k="l_from"></span><select id="sg_from"></select></label>
    </div>
    <div class="actions"><button class="go" type="submit" id="sg_send"></button><span class="status" id="sg_status" aria-live="polite"></span></div>
  </form>`;
$("cliplist").after(sgBox);
sgBox.querySelector("#sg_from").innerHTML = $("from").innerHTML;
const pendBox = document.createElement("div"); pendBox.className = "pending"; pendBox.hidden = true;
$("clipform").after(pendBox);
function renderSuggest() {
  const t = T[lang];
  sgBox.querySelector("summary").textContent = "💌 " + t.sg_open;
  sgBox.querySelectorAll("[data-k]").forEach(el => el.textContent = t[el.dataset.k]);
  $("sg_send").textContent = t.sg_send;
  sgBox.hidden = isAdmin;
  if (mine && !$("sg_nick").value) { $("sg_nick").value = mine.nick || ""; $("sg_from").value = mine.from || "XX"; }
  // 관리자: 승인 대기 목록
  pendBox.hidden = !isAdmin || !pending.length;
  pendBox.textContent = "";
  if (pendBox.hidden) return;
  const h = document.createElement("h3"); h.textContent = `${t.sg_pending} (${pending.length})`; pendBox.appendChild(h);
  for (const g of pending) {
    const row = document.createElement("div"); row.className = "prow";
    const info = document.createElement("div"); info.className = "pinfo";
    const v = parseVideo(g.url);
    const a = document.createElement("a"); a.href = g.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = `${v ? PLAT[v.p] : "?"} · ${g.song} ↗`;
    const by = document.createElement("small"); by.textContent = `${t.sg_by} ${FLAG[g.from] || "🌏"} ${g.nick}`;
    info.append(a, by);
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "approve"; ok.textContent = t.sg_ok;
    const no = document.createElement("button"); no.type = "button"; no.className = "reject"; no.textContent = t.sg_no;
    ok.onclick = async () => {
      ok.disabled = no.disabled = true;
      try {
        await addDoc(collection(db, "clips"), { url: g.url, song: g.song, cap: "", date: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), at: serverTimestamp(), byNick: g.nick, byFrom: g.from });
        await deleteDoc(doc(db, "suggestions", g.id));
        logAct("a_ok_video", g.song, { target: g.by, targetNick: g.nick });
      } catch (e) { ok.disabled = no.disabled = false; }
    };
    no.onclick = () => { no.disabled = true; deleteDoc(doc(db, "suggestions", g.id)).then(() => logAct("a_no_video", g.song, { target: g.by, targetNick: g.nick })).catch(() => { no.disabled = false; }); };
    row.append(info, ok, no); pendBox.appendChild(row);
  }
}
function watchPending() {
  if (unsubPending) { unsubPending(); unsubPending = null; }
  pending = [];
  if (!isAdmin) return renderSuggest();
  unsubPending = onSnapshot(query(collection(db, "suggestions"), orderBy("at", "asc"), limit(100)), snap => {
    pending = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderSuggest();
  }, () => {});
}
$("sgform").addEventListener("submit", async e => {
  e.preventDefault();
  const t = T[lang], st = $("sg_status"), btn = $("sg_send");
  const url = $("sg_url").value.trim(), song = $("sg_song").value.trim().slice(0, 60), nick = $("sg_nick").value.trim().slice(0, 24), from = $("sg_from").value;
  if (!parseVideo(url)) { st.textContent = t.badurl; return; }
  if (!song || !nick || !user || !db) return;
  if (checkText(song, nick)) { st.textContent = t.blocked; return; }
  btn.disabled = true; st.textContent = "";
  try {
    await addDoc(collection(db, "suggestions"), { url, song, nick, from, by: user.uid, at: serverTimestamp() });
    logAct("video", `${song} · ${url}`, { nick, from });
    st.textContent = t.sg_thanks; $("sg_url").value = ""; $("sg_song").value = "";
  } catch (err) { st.textContent = t.fail; }
  btn.disabled = false;
});

/* ---------- 팬 사진 갤러리 ---------- */
let fanPhotos = null, photosStarted = false, pendPhotos = [], unsubPendPhotos = null, lbItem = null;
$("up_from").innerHTML = $("from").innerHTML;
function startPhotos() {
  if (photosStarted) return;
  if (!db) { setTimeout(startPhotos, 400); return; }
  photosStarted = true;
  onSnapshot(query(collection(db, "photos"), orderBy("at", "desc"), limit(120)), snap => {
    fanPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderPhotos();
  }, () => { fanPhotos = []; renderPhotos(); });
}
function renderPhotos() {
  const t = T[lang], g = $("gallery"); g.textContent = "";
  if (mine && !$("up_nick").value) { $("up_nick").value = mine.nick || ""; $("up_from").value = mine.from || "XX"; }
  if (!fanPhotos) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.loading; g.appendChild(e); }
  else if (!fanPhotos.length) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.nophotos; g.appendChild(e); }
  else for (const ph of fanPhotos) {
    const b = document.createElement("button"); b.type = "button"; b.className = "gitem";
    const im = document.createElement("img"); im.src = ph.thumb; im.alt = ph.cap || ""; im.loading = "lazy";
    const by = document.createElement("span"); by.className = "gby"; by.textContent = `${FLAG[ph.from] || "🌏"} ${ph.nick}`;
    b.append(im, by); b.onclick = () => openPhoto(ph); g.appendChild(b);
  }
  // 관리자: 승인 대기
  const pb = $("pendphotos"); pb.textContent = ""; pb.hidden = !isAdmin || !pendPhotos.length;
  if (pb.hidden) return;
  const h = document.createElement("h3"); h.textContent = `${t.up_pending} (${pendPhotos.length})`; pb.appendChild(h);
  for (const ph of pendPhotos) {
    const row = document.createElement("div"); row.className = "prow";
    const im = document.createElement("img"); im.src = ph.thumb; im.className = "pthumb"; im.alt = "";
    im.onclick = () => openPhoto(ph, true);
    const info = document.createElement("div"); info.className = "pinfo";
    const c = document.createElement("span"); c.textContent = ph.cap || "—";
    const by = document.createElement("small"); by.textContent = `${t.sg_by} ${FLAG[ph.from] || "🌏"} ${ph.nick}`;
    info.append(c, by);
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "approve"; ok.textContent = t.sg_ok;
    const no = document.createElement("button"); no.type = "button"; no.className = "reject"; no.textContent = t.sg_no;
    ok.onclick = async () => {
      ok.disabled = no.disabled = true;
      try {
        const ref = await addDoc(collection(db, "photos"), { thumb: ph.thumb, cap: ph.cap || "", nick: ph.nick, from: ph.from, at: serverTimestamp() });
        await setDoc(doc(db, "photo_full", ref.id), { img: ph.img });
        await deleteDoc(doc(db, "photo_pending", ph.id));
        logAct("a_ok_photo", ph.cap || "", { target: ph.by, targetNick: ph.nick });
      } catch (e) { ok.disabled = no.disabled = false; }
    };
    no.onclick = () => { no.disabled = true; deleteDoc(doc(db, "photo_pending", ph.id)).then(() => logAct("a_no_photo", ph.cap || "", { target: ph.by, targetNick: ph.nick })).catch(() => { no.disabled = false; }); };
    row.append(im, info, ok, no); pb.appendChild(row);
  }
}
function watchPhotoPending() {
  if (unsubPendPhotos) { unsubPendPhotos(); unsubPendPhotos = null; }
  pendPhotos = [];
  if (!isAdmin) return renderPhotos();
  unsubPendPhotos = onSnapshot(query(collection(db, "photo_pending"), orderBy("at", "asc"), limit(50)), snap => {
    pendPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderPhotos();
  }, () => {});
}
async function openPhoto(ph, pendingItem) {
  const t = T[lang], lb = $("lightbox"); lbItem = pendingItem ? null : ph;
  $("lbimg").src = ph.img || ph.thumb; $("lbimg").alt = ph.cap || "";
  $("lbcap").textContent = ph.cap || ""; $("lbby").textContent = `${FLAG[ph.from] || "🌏"} ${ph.nick}`;
  const del = $("lbdel"); del.hidden = !isAdmin || pendingItem; del.textContent = t.del_photo;
  try { lb.showModal(); } catch (e) { lb.setAttribute("open", ""); }
  if (!ph.img && !pendingItem) {
    try { const f = await getDoc(doc(db, "photo_full", ph.id)); if (f.exists() && lbItem === ph) $("lbimg").src = f.data().img; } catch (e) {}
  }
}
$("lbclose").onclick = () => $("lightbox").close();
$("lightbox").addEventListener("click", e => { if (e.target === $("lightbox")) $("lightbox").close(); });
$("lbdel").onclick = async () => {
  if (!lbItem) return;
  const id = lbItem.id; $("lightbox").close();
  const dn = lbItem.nick, dc = lbItem.cap;
  try { await deleteDoc(doc(db, "photos", id)); await deleteDoc(doc(db, "photo_full", id)); logAct("a_del_photo", dc || "", { targetNick: dn }); } catch (e) {}
};
// 사진 줄이기: 원본은 서버에 보내지 않고, 휴대폰/PC 안에서 작게 만든 뒤 보내요
function loadImage(file) {
  return new Promise((ok, fail) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { ok(im); URL.revokeObjectURL(url); }; im.onerror = () => { fail(); URL.revokeObjectURL(url); };
    im.src = url;
  });
}
function shrink(im, max, square, budget) {
  let w = im.naturalWidth, h = im.naturalHeight, sx = 0, sy = 0, sw = w, sh = h;
  if (square) { const m = Math.min(w, h); sx = (w - m) / 2; sy = (h - m) / 2; sw = sh = m; w = h = Math.min(m, max); }
  else { const r = Math.min(1, max / Math.max(w, h)); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
  for (let q = 0.85; q >= 0.4; q -= 0.08) { const d = c.toDataURL("image/jpeg", q); if (d.length <= budget) return d; }
  return c.toDataURL("image/jpeg", 0.35);
}
// 아이폰 사진(HEIC)은 PC 브라우저가 못 읽어서, 필요할 때만 변환 도구를 불러와 jpg로 바꿔요
let heicLib = null;
function heicToJpeg(file) {
  if (!heicLib) heicLib = new Promise((ok, fail) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
    sc.onload = () => ok(window.heic2any); sc.onerror = () => { heicLib = null; fail(new Error("heic2any load failed")); };
    document.head.appendChild(sc);
  });
  return heicLib.then(conv => conv({ blob: file, toType: "image/jpeg", quality: 0.9 })).then(r => Array.isArray(r) ? r[0] : r);
}
function loadImageAny(file) { return loadImage(file); }
let upData = null;
$("up_file").addEventListener("change", async () => {
  const st = $("up_status"), f = $("up_file").files[0]; upData = null; $("up_preview").hidden = true;
  if (!f) return;
  st.textContent = T[lang].up_busy;
  try {
    let src = f;
    if (/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name)) src = await heicToJpeg(f);
    const im = await loadImage(src);
    upData = { img: shrink(im, 1200, false, 420000), thumb: shrink(im, 360, true, 60000) };
    $("up_img").src = upData.thumb; $("up_preview").hidden = false; st.textContent = "";
  } catch (e) { console.warn("[사진 읽기 실패]", f.name, f.type, f.size, e); st.textContent = T[lang].up_bad + ` (${f.name})`; }
});
$("upform").addEventListener("submit", async e => {
  e.preventDefault();
  const t = T[lang], st = $("up_status"), btn = $("up_send");
  const nick = $("up_nick").value.trim().slice(0, 24), cap = $("up_cap").value.trim().slice(0, 80), from = $("up_from").value;
  if (!upData) { st.textContent = t.up_bad; return; }
  if (!nick || !user || !db) return;
  if (checkText(nick, cap)) { st.textContent = t.blocked; return; }
  btn.disabled = true; st.textContent = "";
  try {
    await addDoc(collection(db, "photo_pending"), { img: upData.img, thumb: upData.thumb, cap, nick, from, by: user.uid, at: serverTimestamp() });
    logAct("photo", cap || "(설명 없음)", { nick, from });
    st.textContent = t.up_thanks; $("up_file").value = ""; $("up_cap").value = ""; $("up_preview").hidden = true; upData = null;
  } catch (err) { st.textContent = t.fail; }
  btn.disabled = false;
});

/* ---------- 공통: 나라 이름 ---------- */
const COUNTRIES = ["KR", "TH", "SG", "PH", "US", "JP", "ID", "MY", "VN", "XX"];
function countryName(cc) {
  if (cc === "XX") return { ko: "기타", en: "Other", th: "อื่น ๆ", ja: "その他", zh: "其他", fil: "Iba pa", es: "Otro" }[lang];
  try { return new Intl.DisplayNames([lang], { type: "region" }).of(cc); } catch (e) { return cc; }
}
function guessCountry() {
  const m = /-([A-Z]{2})$/i.exec(navigator.language || ""); const cc = m ? m[1].toUpperCase() : "";
  return COUNTRIES.includes(cc) ? cc : ({ ko: "KR", th: "TH", ja: "JP", fil: "PH", tl: "PH" }[(navigator.language || "").slice(0, 2)] || "XX");
}

/* ---------- 전 세계 하트 보내기 ---------- */
let hearts = {}, heartQueue = 0, heartTimer = null;
let myCountry = (() => { try { return localStorage.getItem("hm_cc") || ""; } catch (e) { return ""; } })() || guessCountry();
function renderHearts() {
  const sel = $("h_from"), cur = sel.value || myCountry;
  sel.textContent = "";
  COUNTRIES.forEach(cc => { const o = document.createElement("option"); o.value = cc; o.textContent = `${FLAG[cc]} ${countryName(cc)}`; sel.appendChild(o); });
  sel.value = cur;
  const rows = Object.entries(hearts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, n]) => s + n, 0) + heartQueue;
  $("h_total").textContent = total.toLocaleString();
  const board = $("h_board"); board.textContent = "";
  const max = rows.length ? rows[0][1] : 1;
  rows.slice(0, 5).forEach(([cc, n]) => {
    const li = document.createElement("li");
    const name = document.createElement("span"); name.className = "hn"; name.textContent = `${FLAG[cc] || "🌏"} ${countryName(cc)}`;
    const bar = document.createElement("span"); bar.className = "hbar"; bar.style.setProperty("--w", Math.max(4, n / max * 100) + "%");
    const num = document.createElement("span"); num.className = "hc"; num.textContent = n.toLocaleString();
    li.append(name, bar, num); board.appendChild(li);
  });
}
$("h_from").addEventListener("change", () => { myCountry = $("h_from").value; try { localStorage.setItem("hm_cc", myCountry); } catch (e) {} });
function floatHeart(x, y) {
  if (reduceMotion) return;
  const h = document.createElement("span"); h.className = "fheart"; h.textContent = ["💗", "💖", "🌸", "💕"][Math.floor(Math.random() * 4)];
  h.style.left = x + "px"; h.style.top = y + "px"; h.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
  document.body.appendChild(h); setTimeout(() => h.remove(), 1400);
}
$("heartbtn").addEventListener("click", e => {
  const r = $("heartbtn").getBoundingClientRect();
  floatHeart(r.left + r.width / 2 + (Math.random() * 30 - 15), r.top);
  heartQueue = Math.min(heartQueue + 1, 30); renderHearts();
  clearTimeout(heartTimer); heartTimer = setTimeout(flushHearts, 900);
});
async function flushHearts() {
  if (!heartQueue || !db || !user) return;
  const n = heartQueue, cc = myCountry; heartQueue = 0;
  try { await setDoc(doc(db, "hearts", cc), { n: increment(n) }, { merge: true }); }
  catch (e) { renderHearts(); }
}
function watchHearts() {
  onSnapshot(collection(db, "hearts"), snap => {
    hearts = {}; snap.docs.forEach(d => { const n = d.data().n; if (typeof n === "number") hearts[d.id] = n; }); renderHearts();
  }, () => {});
}

/* ---------- 일정 (스케줄 캘린더) ---------- */
let events = null;
const KINDS = ["show", "tv", "live", "release", "etc"];
const KIND_ICON = { show: "🎤", tv: "📺", live: "🔴", release: "💿", etc: "✨" };
function fmtWhen(ms, tz) {
  const loc = { ko: "ko-KR", ja: "ja-JP", th: "th-TH", zh: "zh-CN", fil: "fil-PH", es: "es-ES" }[lang] || "en-US";
  return new Intl.DateTimeFormat(loc, { timeZone: tz, month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(ms);
}
function renderEvents() {
  const t = T[lang], list = $("events"); list.textContent = "";
  const ks = $("ev_kind"); const kv = ks.value; ks.textContent = "";
  KINDS.forEach(k => { const o = document.createElement("option"); o.value = k; o.textContent = `${KIND_ICON[k]} ${t["k_" + k]}`; ks.appendChild(o); });
  if (kv) ks.value = kv;
  $("evform").hidden = !isAdmin;
  if (!events) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.loading; list.appendChild(e); $("nextup").hidden = true; return; }
  const now = Date.now(), LEN = 3 * 3600e3;
  const up = events.filter(e => e.when + LEN > now).sort((a, b) => a.when - b.when);
  const past = events.filter(e => e.when + LEN <= now).sort((a, b) => b.when - a.when).slice(0, 5);
  if (!up.length && !past.length) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.noevents; list.appendChild(e); }
  const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const add = (ev, isPast) => {
    const li = document.createElement("li"); li.className = "ev" + (isPast ? " past" : "");
    const ic = document.createElement("span"); ic.className = "evi"; ic.textContent = KIND_ICON[ev.kind] || "✨";
    const body = document.createElement("div"); body.className = "evb";
    const ti = document.createElement(ev.link ? "a" : "b"); ti.className = "evt"; ti.textContent = ev.title;
    if (ev.link) { ti.href = ev.link; ti.target = "_blank"; ti.rel = "noopener"; }
    const when = document.createElement("div"); when.className = "evw"; when.textContent = fmtWhen(ev.when, myTz);
    body.append(ti, when);
    if (myTz !== "Asia/Seoul") { const k = document.createElement("small"); k.textContent = `${t.kst}: ${fmtWhen(ev.when, "Asia/Seoul")}`; body.appendChild(k); }
    if (ev.place) { const pl = document.createElement("small"); pl.textContent = "📍 " + ev.place; body.appendChild(pl); }
    if (ev.byNick) { const bn = document.createElement("small"); bn.textContent = `${t.sg_by} ${FLAG[ev.byFrom] || "🌏"} ${ev.byNick}`; body.appendChild(bn); }
    li.append(ic, body);
    if (isAdmin) { const x = document.createElement("button"); x.type = "button"; x.className = "evdel"; x.textContent = t.del; x.onclick = () => deleteDoc(doc(db, "events", ev.id)).then(() => logAct("a_del_event", ev.title)).catch(() => {}); li.appendChild(x); }
    list.appendChild(li);
  };
  up.forEach(ev => add(ev, false));
  if (past.length) { const h = document.createElement("li"); h.className = "evsep"; h.textContent = t.past; list.appendChild(h); past.forEach(ev => add(ev, true)); }
  // 다음 일정까지 남은 시간
  const nx = up[0], box = $("nextup");
  box.hidden = !nx;
  if (nx) {
    const ms = nx.when - now;
    let left;
    if (ms <= 0) left = t.d_now;
    else { const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
      left = (d ? `${d}${t.d_days} ` : "") + `${h}${t.d_hours} ${m}${t.d_min}`; }
    box.innerHTML = ""; const a = document.createElement("small"); a.textContent = `${KIND_ICON[nx.kind] || "✨"} ${nx.title}`;
    const b = document.createElement("b"); b.textContent = ms <= 0 ? left : `${t.next_up} ${left}`;
    box.append(b, a);
  }
}
setInterval(() => { if (events) renderEvents(); }, 60000);
function watchEvents() {
  onSnapshot(query(collection(db, "events"), orderBy("when", "asc"), limit(200)), snap => {
    events = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => typeof e.when === "number"); renderEvents();
  }, () => { events = []; renderEvents(); });
}
$("evform").addEventListener("submit", async e => {
  e.preventDefault();
  const t = T[lang], st = $("ev_status"), v = $("ev_when").value; // 예: 2026-12-24T19:30 → 한국 시간으로 저장
  if (!v || !isAdmin) return;
  const when = Date.parse(v + ":00+09:00");
  const link = $("ev_link").value.trim();
  if (link && !/^https:\/\//.test(link)) { st.textContent = t.badurl; return; }
  try {
    await addDoc(collection(db, "events"), { when, kind: $("ev_kind").value, title: $("ev_title").value.trim().slice(0, 80), place: $("ev_place").value.trim().slice(0, 80), link, at: serverTimestamp() });
    logAct("a_add_event", $("ev_title").value.trim());
    st.textContent = t.ev_added; $("ev_title").value = ""; $("ev_place").value = ""; $("ev_link").value = "";
  } catch (err) { st.textContent = t.fail; }
});

/* ---------- 팬 일정 제보 → 관리자 승인 ---------- */
let evPending = [], unsubEvPending = null;
$("es_from").innerHTML = $("from").innerHTML;
function renderEvSuggest() {
  const t = T[lang];
  const ks = $("es_kind"), kv = ks.value; ks.textContent = "";
  KINDS.forEach(k => { const o = document.createElement("option"); o.value = k; o.textContent = `${KIND_ICON[k]} ${t["k_" + k]}`; ks.appendChild(o); });
  if (kv) ks.value = kv;
  const tz = $("es_tz"), tv = tz.value || "local"; tz.textContent = "";
  [["local", t.tz_local], ["kst", t.tz_kst]].forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; tz.appendChild(o); });
  tz.value = tv;
  if (mine && !$("es_nick").value) { $("es_nick").value = mine.nick || ""; $("es_from").value = mine.from || "XX"; }
  $("evsug").hidden = isAdmin;
  const box = $("evpend"); box.textContent = ""; box.hidden = !isAdmin || !evPending.length;
  if (box.hidden) return;
  const h = document.createElement("h3"); h.textContent = `${t.es_pending} (${evPending.length})`; box.appendChild(h);
  const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  for (const g of evPending) {
    const row = document.createElement("div"); row.className = "prow";
    const info = document.createElement("div"); info.className = "pinfo";
    const ti = document.createElement(g.link ? "a" : "b"); ti.textContent = `${KIND_ICON[g.kind] || "✨"} ${g.title}${g.link ? " ↗" : ""}`;
    if (g.link) { ti.href = g.link; ti.target = "_blank"; ti.rel = "noopener"; }
    const w = document.createElement("small"); w.textContent = `${fmtWhen(g.when, myTz)}${g.place ? " · 📍 " + g.place : ""}`;
    const by = document.createElement("small"); by.textContent = `${t.sg_by} ${FLAG[g.from] || "🌏"} ${g.nick}`;
    info.append(ti, w, by);
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "approve"; ok.textContent = t.sg_ok;
    const no = document.createElement("button"); no.type = "button"; no.className = "reject"; no.textContent = t.sg_no;
    ok.onclick = async () => {
      ok.disabled = no.disabled = true;
      try {
        await addDoc(collection(db, "events"), { when: g.when, kind: g.kind, title: g.title, place: g.place || "", link: g.link || "", byNick: g.nick, byFrom: g.from, at: serverTimestamp() });
        await deleteDoc(doc(db, "event_pending", g.id));
        logAct("a_ok_event", g.title, { target: g.by, targetNick: g.nick });
      } catch (e) { ok.disabled = no.disabled = false; }
    };
    no.onclick = () => { no.disabled = true; deleteDoc(doc(db, "event_pending", g.id)).then(() => logAct("a_no_event", g.title, { target: g.by, targetNick: g.nick })).catch(() => { no.disabled = false; }); };
    row.append(info, ok, no); box.appendChild(row);
  }
}
function watchEvPending() {
  if (unsubEvPending) { unsubEvPending(); unsubEvPending = null; }
  evPending = [];
  if (!isAdmin) return renderEvSuggest();
  unsubEvPending = onSnapshot(query(collection(db, "event_pending"), orderBy("at", "asc"), limit(50)), snap => {
    evPending = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderEvSuggest();
  }, () => {});
}
$("esform").addEventListener("submit", async e => {
  e.preventDefault();
  const t = T[lang], st = $("es_status"), btn = $("es_send"), v = $("es_when").value;
  if (!v || !user || !db) return;
  const when = $("es_tz").value === "kst" ? Date.parse(v + ":00+09:00") : new Date(v).getTime();
  const link = $("es_link").value.trim();
  if (link && !/^https:\/\//.test(link)) { st.textContent = t.badurl; return; }
  const title = $("es_title").value.trim().slice(0, 80), nick = $("es_nick").value.trim().slice(0, 24);
  if (!title || !nick || !isFinite(when)) return;
  if (checkText(title, nick, $("es_place").value)) { st.textContent = t.blocked; return; }
  btn.disabled = true; st.textContent = "";
  try {
    await addDoc(collection(db, "event_pending"), { when, kind: $("es_kind").value, title, place: $("es_place").value.trim().slice(0, 80), link, nick, from: $("es_from").value, by: user.uid, at: serverTimestamp() });
    logAct("event", title, { nick, from: $("es_from").value });
    st.textContent = t.es_thanks; $("es_title").value = ""; $("es_place").value = ""; $("es_link").value = ""; $("es_when").value = "";
  } catch (err) { st.textContent = t.fail; }
  btn.disabled = false;
});

/* ---------- KiT 앨범 구매 안내 ---------- */
$("buygo").href = PRODUCT_URL || SHOP_URL;
$("buyword").textContent = SEARCH_WORD;
if (PRODUCT_URL) document.querySelectorAll("#buy .buysteps li").forEach((li, i) => { if (i > 0) li.hidden = true; });
$("copyword").addEventListener("click", async () => {
  const lbl = $("copyword").querySelector("[data-i]");
  try { await navigator.clipboard.writeText(SEARCH_WORD); lbl.textContent = T[lang].buy_copied; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($("buyword")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
  setTimeout(() => { lbl.textContent = T[lang].buy_copy; }, 1800);
});

/* ---------- 최애곡 투표 ---------- */
let voteCounts = null, myVote = null, voteBusy = false, votesLoadedAt = 0;
async function loadVotes(force) {
  if (!db || !user) return;
  if (!force && Date.now() - votesLoadedAt < 30000) return;
  votesLoadedAt = Date.now();
  try {
    const mine = await getDoc(doc(db, "votes", user.uid)); myVote = mine.exists() ? mine.data().song : null;
    const counts = await Promise.all(DISC.map(s => getCountFromServer(query(collection(db, "votes"), where("song", "==", s.t))).then(r => r.data().count).catch(() => 0)));
    voteCounts = {}; DISC.forEach((s, i) => voteCounts[s.t] = counts[i]);
  } catch (e) { voteCounts = voteCounts || {}; }
  renderVotes();
}
function renderVotes() {
  const t = T[lang], ol = $("vlist"); ol.textContent = "";
  const total = voteCounts ? Object.values(voteCounts).reduce((a, b) => a + b, 0) : 0;
  const order = DISC.map(s => s.t).sort((a, b) => ((voteCounts || {})[b] || 0) - ((voteCounts || {})[a] || 0));
  order.forEach((song, i) => {
    const n = (voteCounts || {})[song] || 0, pct = total ? Math.round(n / total * 100) : 0;
    const li = document.createElement("li");
    const b = document.createElement("button"); b.type = "button"; b.className = "vbtn" + (myVote === song ? " mine" : "");
    b.style.setProperty("--p", pct + "%"); b.disabled = voteBusy;
    const rank = document.createElement("span"); rank.className = "vr"; rank.textContent = n > 0 ? ["🥇", "🥈", "🥉"][i] || (i + 1) : "♪";
    const nm = document.createElement("span"); nm.className = "vn"; nm.textContent = song;
    const ct = document.createElement("span"); ct.className = "vc"; ct.textContent = voteCounts ? `${pct}% · ${n} ${t.v_votes}` : "";
    b.append(rank, nm, ct);
    if (myVote === song) { const m = document.createElement("span"); m.className = "vmine"; m.textContent = t.v_my; nm.appendChild(m); }
    b.onclick = async () => {
      if (!db || !user || voteBusy || myVote === song) return;
      voteBusy = true; const prev = myVote; myVote = song;
      if (voteCounts) { if (prev) voteCounts[prev] = Math.max(0, (voteCounts[prev] || 1) - 1); voteCounts[song] = (voteCounts[song] || 0) + 1; }
      renderVotes();
      try { await setDoc(doc(db, "votes", user.uid), { song, at: serverTimestamp() }); logAct("vote", song); } catch (e) { myVote = prev; }
      voteBusy = false; loadVotes(true);
    };
    li.appendChild(b); ol.appendChild(li);
  });
}

/* ---------- 현모 팬 퀴즈 ---------- */
let qz = { i: -1, score: 0, picked: null };
function renderQuiz() {
  const t = T[lang], box = $("qz_body"); box.textContent = "";
  if (qz.i < 0) {
    const best = (() => { try { return localStorage.getItem("hm_quiz") ; } catch (e) { return null; } })();
    if (best !== null) { const p = document.createElement("p"); p.className = "hint"; p.textContent = `${t.qz_score}: ${best} / ${QUIZ.length}`; box.appendChild(p); }
    const go = document.createElement("button"); go.type = "button"; go.className = "go"; go.textContent = t.qz_start;
    go.onclick = () => { qz = { i: 0, score: 0, picked: null }; renderQuiz(); }; box.appendChild(go); return;
  }
  if (qz.i >= QUIZ.length) {
    const r = qz.score / QUIZ.length, badge = r === 1 ? t.b3 : r >= .7 ? t.b2 : r >= .4 ? t.b1 : t.b0;
    const res = document.createElement("div"); res.className = "qzres";
    const sc = document.createElement("b"); sc.textContent = `${qz.score} / ${QUIZ.length}`;
    const bd = document.createElement("span"); bd.className = "badge2"; bd.textContent = badge;
    res.append(sc, bd); box.appendChild(res);
    try { const prev = +localStorage.getItem("hm_quiz") || 0; if (qz.score >= prev) localStorage.setItem("hm_quiz", qz.score); } catch (e) {}
    if (r === 1) confetti();
    const again = document.createElement("button"); again.type = "button"; again.className = "go"; again.textContent = t.qz_again;
    again.onclick = () => { qz = { i: 0, score: 0, picked: null }; renderQuiz(); }; box.appendChild(again); return;
  }
  const Q = QUIZ[qz.i];
  const prog = document.createElement("div"); prog.className = "qzprog"; prog.style.setProperty("--p", (qz.i / QUIZ.length * 100) + "%");
  const n = document.createElement("small"); n.textContent = `${qz.i + 1} / ${QUIZ.length}`;
  const q = document.createElement("p"); q.className = "qzq"; q.textContent = Q.q[lang];
  const opts = document.createElement("div"); opts.className = "qzopts";
  Q.o[lang].forEach((txt, k) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.className = "qzo";
    if (qz.picked !== null) { b.disabled = true; if (k === Q.a) b.classList.add("right"); else if (k === qz.picked) b.classList.add("wrong"); }
    b.onclick = () => { if (qz.picked !== null) return; qz.picked = k; if (k === Q.a) qz.score++; renderQuiz(); };
    opts.appendChild(b);
  });
  box.append(prog, n, q, opts);
  if (qz.picked !== null) {
    const fb = document.createElement("p"); fb.className = "qzfb " + (qz.picked === Q.a ? "ok" : "no");
    fb.textContent = qz.picked === Q.a ? t.qz_ok : `${t.qz_no} "${Q.o[lang][Q.a]}"`;
    const nx = document.createElement("button"); nx.type = "button"; nx.className = "go"; nx.textContent = t.qz_next;
    nx.onclick = () => { qz.i++; qz.picked = null; renderQuiz(); };
    box.append(fb, nx);
  }
}

/* ---------- 이번 주 신청곡 (매주 월요일 0시 ~ 일요일 24시, 한국 시간) ---------- */
function weekStart(offset = 0) {
  const k = new Date(Date.now() + 9 * 3600e3), dow = (k.getUTCDay() + 6) % 7;
  return Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - dow + 7 * offset) - 9 * 3600e3; // 한국 시간 월요일 0시
}
const weekId = (offset = 0) => new Date(weekStart(offset) + 9 * 3600e3).toISOString().slice(0, 10);
const keyOf = (t, a) => (String(t) + "|" + String(a)).toLowerCase().normalize("NFKC").replace(/[\s'’".,!?·\-()]/g, "");
let rqNow = null, rqLast = null, rqResult = null, myRq = null, myRqVote = null, rqBusy = false, rqLoadedAt = 0, rqTick = null;
async function rankWeek(w) {
  const snap = await getDocs(query(collection(db, "song_req"), where("week", "==", w), limit(300)));
  const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const groups = new Map();
  for (const r of reqs.sort((a, b) => (a.at?.seconds || 0) - (b.at?.seconds || 0))) {
    const k = keyOf(r.title, r.artist);
    if (!groups.has(k)) groups.set(k, { key: k, id: r.id, title: r.title, artist: r.artist, reqs: [], votes: 0 });
    groups.get(k).reqs.push(r);
  }
  await Promise.all([...groups.values()].map(async g => {
    const ns = await Promise.all(g.reqs.map(r => getCountFromServer(query(collection(db, "req_votes"), where("week", "==", w), where("req", "==", r.id))).then(x => x.data().count).catch(() => 0)));
    g.votes = ns.reduce((a, b) => a + b, 0);
  }));
  const list = [...groups.values()].sort((a, b) => b.votes - a.votes || b.reqs.length - a.reqs.length);
  const people = new Set(reqs.map(r => r.by));
  return { list, people: people.size };
}
async function loadRequests(force) {
  try { if (!db || !user) return; } catch (e) { return; }
  if (!force && Date.now() - rqLoadedAt < 20000) { renderRequests(); return; }
  rqLoadedAt = Date.now();
  const W = weekId(0), LW = weekId(-1);
  try {
    const [now, last, res, mr, mv] = await Promise.all([
      rankWeek(W), rankWeek(LW),
      getDoc(doc(db, "req_results", LW)).catch(() => null),
      getDoc(doc(db, "song_req", `${W}_${user.uid}`)).catch(() => null),
      getDoc(doc(db, "req_votes", `${W}_${user.uid}`)).catch(() => null),
    ]);
    rqNow = now; rqLast = last; rqResult = res && res.exists() ? res.data() : null;
    myRq = mr && mr.exists() ? mr.data() : null; myRqVote = mv && mv.exists() ? mv.data().req : null;
  } catch (e) { rqNow = rqNow || { list: [], people: 0 }; }
  renderRequests();
}
function rqMessage() {
  const top = (rqResult?.top) || (rqLast?.list || []).slice(0, 3).map(g => ({ title: g.title, artist: g.artist, votes: g.votes }));
  const a = new Date(weekStart(-1) + 9 * 3600e3), b = new Date(weekStart(0) + 9 * 3600e3 - 864e5);
  const md = d => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  const medal = ["🥇", "🥈", "🥉"];
  return [`현모님 안녕하세요! 🌸 팬사이트 신청곡 결과예요 (${md(a)}~${md(b)})`, "",
    ...top.map((g, i) => `${medal[i]} ${g.title} - ${g.artist} (${g.votes}표)`), "",
    `전 세계 팬 ${rqResult?.people ?? rqLast?.people ?? 0}명이 신청에 참여했어요. 언제나 응원해요! 💗`,
    "https://hyunmo-eternity.github.io/#request"].join("\n");
}
function renderRequests() {
  const t = T[lang];
  $("rq_from").innerHTML = $("from").innerHTML;
  if (mine && !$("rq_nick").value) { $("rq_nick").value = mine.nick || ""; $("rq_from").value = mine.from || "XX"; }
  if (myRq && !$("rq_song").value && document.activeElement?.id !== "rq_song") { $("rq_song").value = myRq.title; $("rq_artist").value = myRq.artist; }
  $("rq_send").textContent = myRq ? t.rq_update : t.rq_send;
  // 마감까지
  const left = weekStart(1) - Date.now(), d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4);
  $("rq_ends").textContent = left < 36e5 ? t.rq_closed : `${t.rq_ends} ${d ? d + t.d_days + " " : ""}${h}${t.d_hours} ${m}${t.d_min}`;
  clearTimeout(rqTick); rqTick = setTimeout(() => { if (location.hash === "#request") { if (weekStart(1) <= Date.now()) loadRequests(true); else renderRequests(); } }, 60000);
  // 이번 주 순위
  const ol = $("rq_list"); ol.textContent = "";
  if (!rqNow) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.loading; ol.appendChild(e); }
  else if (!rqNow.list.length) { const e = document.createElement("div"); e.className = "empty"; e.textContent = t.rq_empty; ol.appendChild(e); }
  else {
    const total = rqNow.list.reduce((a, g) => a + g.votes, 0);
    rqNow.list.slice(0, 20).forEach((g, i) => {
      const mineHere = g.reqs.some(r => r.id === myRqVote);
      const li = document.createElement("li");
      const b = document.createElement("button"); b.type = "button"; b.className = "vbtn" + (mineHere ? " mine" : ""); b.disabled = rqBusy;
      b.style.setProperty("--p", (total ? Math.round(g.votes / total * 100) : 0) + "%");
      const rank = document.createElement("span"); rank.className = "vr"; rank.textContent = g.votes > 0 ? (["🥇", "🥈", "🥉"][i] || i + 1) : "♪";
      const nm = document.createElement("span"); nm.className = "vn";
      const tt = document.createElement("span"); tt.textContent = g.title;
      const ar = document.createElement("small"); ar.className = "rqart"; ar.textContent = ` · ${g.artist}`;
      const by = document.createElement("small"); by.className = "rqby";
      const first = g.reqs[0]; by.textContent = `${t.rq_by}: ${FLAG[first.from] || "🌏"} ${first.nick}` + (g.reqs.length > 1 ? ` +${g.reqs.length - 1}` : "");
      nm.append(tt, ar, by);
      if (mineHere) { const mm = document.createElement("span"); mm.className = "vmine"; mm.textContent = t.rq_my; tt.appendChild(mm); }
      const ct = document.createElement("span"); ct.className = "vc"; ct.textContent = mineHere ? `${g.votes} ${t.v_votes}` : `👍 ${g.votes}`;
      b.append(rank, nm, ct);
      b.onclick = () => rqVote(g.reqs[0].id, g.title);
      li.appendChild(b); ol.appendChild(li);
    });
  }
  // 지난주 결과
  const lb = $("rq_last"); lb.textContent = "";
  const top = rqResult?.top || (rqLast?.list || []).filter(g => g.votes > 0).slice(0, 3);
  lb.hidden = !top.length;
  if (top.length) {
    const h = document.createElement("div"); h.className = "rqlh";
    const hb = document.createElement("b"); hb.textContent = t.rq_last; h.appendChild(hb);
    if (rqResult) { const sb = document.createElement("span"); sb.className = "rqsent"; sb.textContent = "✓ " + t.rq_sent; h.appendChild(sb); }
    const ul = document.createElement("ol");
    top.forEach((g, i) => { const li = document.createElement("li"); li.textContent = `${["🥇", "🥈", "🥉"][i]} ${g.title} · ${g.artist}`; ul.appendChild(li); });
    lb.append(h, ul);
  }
  // 관리자: 지난주 결과 전달
  const ab = $("rq_admin"); ab.textContent = ""; ab.hidden = !isAdmin || !(rqLast?.list || []).length;
  if (!ab.hidden) {
    const h = document.createElement("b"); h.textContent = rqResult ? "🛠 지난주 결과를 이미 전달 완료로 표시했어요" : "🛠 지난주 결과를 현모님께 보내기";
    const pre = document.createElement("pre"); pre.className = "rqmsg"; pre.textContent = rqMessage();
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "go";
    btn.textContent = rqResult ? "메시지 다시 복사" : "메시지 복사하고 전달 완료로 표시";
    const st = document.createElement("span"); st.className = "status";
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(pre.textContent); st.textContent = "복사했어요. 카톡이나 문자에 붙여넣어 현모님께 보내주세요!"; }
      catch (e) { const r = document.createRange(); r.selectNodeContents(pre); getSelection().removeAllRanges(); getSelection().addRange(r); st.textContent = "글이 선택됐어요. Ctrl+C로 복사해 주세요."; }
      if (!rqResult) {
        const topSave = rqLast.list.filter(g => g.votes > 0).slice(0, 3).map(g => ({ title: g.title, artist: g.artist, votes: g.votes }));
        try { await setDoc(doc(db, "req_results", weekId(-1)), { top: topSave, people: rqLast.people, at: serverTimestamp() }); rqResult = { top: topSave, people: rqLast.people }; logAct("a_req_sent", topSave.map(g => g.title).join(", ")); renderRequests(); } catch (e) {}
      }
    };
    const row = document.createElement("div"); row.className = "actions"; row.append(btn, st);
    ab.append(h, pre, row);
  }
}
async function rqVote(reqId, title) {
  if (rqBusy || !user || myRqVote === reqId) return;
  rqBusy = true; const prev = myRqVote; myRqVote = reqId; renderRequests();
  try { await setDoc(doc(db, "req_votes", `${weekId(0)}_${user.uid}`), { week: weekId(0), req: reqId, at: serverTimestamp() }); logAct("req_vote", title); }
  catch (e) { myRqVote = prev; }
  rqBusy = false; loadRequests(true);
}
$("rq_form").addEventListener("submit", async e => {
  e.preventDefault();
  const t = T[lang], st = $("rq_status"), btn = $("rq_send");
  const title = $("rq_song").value.trim().slice(0, 60), artist = $("rq_artist").value.trim().slice(0, 40), nick = $("rq_nick").value.trim().slice(0, 24), from = $("rq_from").value;
  if (!title || !artist || !nick || !user) return;
  if (checkText(title, artist, nick)) { st.textContent = t.blocked; return; }
  btn.disabled = true; st.textContent = "";
  const W = weekId(0), id = `${W}_${user.uid}`;
  try {
    await setDoc(doc(db, "song_req", id), { week: W, title, artist, nick, from, by: user.uid, at: serverTimestamp() });
    // 같은 곡이 이미 있으면 그 곡에 투표, 아니면 내 신청곡에 투표
    const same = (rqNow?.list || []).find(g => g.key === keyOf(title, artist));
    const target = same ? same.reqs[0].id : id;
    await setDoc(doc(db, "req_votes", id), { week: W, req: target, at: serverTimestamp() });
    myRq = { title, artist }; myRqVote = target;
    st.textContent = t.rq_thanks; logAct("req", `${title} - ${artist}`, { nick, from });
    loadRequests(true);
  } catch (err) { st.textContent = t.fail; }
  btn.disabled = false;
});

/* ---------- 활동 기록 + 이용 제한 ---------- */
const ACT = {
  cheer: "💌 응원 작성", cheer_edit: "✏️ 응원 수정", cheer_del: "🗑 응원 삭제(본인)", video: "🎬 영상 추천", photo: "📷 사진 올림", event: "📢 일정 제보", vote: "🏆 투표",
  a_del_cheer: "🛠 응원 삭제", a_ok_video: "🛠 영상 승인", a_no_video: "🛠 영상 거절", a_add_video: "🛠 영상 추가", a_del_video: "🛠 영상 삭제",
  a_ok_photo: "🛠 사진 승인", a_no_photo: "🛠 사진 거절", a_del_photo: "🛠 사진 삭제", a_ok_event: "🛠 일정 승인", a_no_event: "🛠 일정 거절",
  a_add_event: "🛠 일정 추가", a_del_event: "🛠 일정 삭제", a_live_on: "🛠 라이브 켬", a_live_off: "🛠 라이브 끔", a_ban: "🛠 이용 제한", a_unban: "🛠 제한 해제", req: "🎤 신청곡", req_vote: "🎶 신청곡 투표", a_req_sent: "🛠 신청곡 결과 전달",
};
// 활동을 기록해요. 기록이 실패해도 원래 동작에는 영향을 주지 않아요.
function logAct(kind, detail, o = {}) {
  if (!db || !user) return;
  const me = mine || {};
  const data = {
    uid: user.uid, kind, detail: String(detail || "").slice(0, 120),
    nick: String(o.nick || (isAdmin ? "관리자" : me.nick) || "").slice(0, 40),
    from: String(o.from || me.from || "XX").slice(0, 2),
    at: serverTimestamp(),
  };
  if (o.target) data.target = String(o.target).slice(0, 128);
  if (o.targetNick) data.targetNick = String(o.targetNick).slice(0, 40);
  addDoc(collection(db, "activity"), data).catch(() => {});
}
let acts = null, banned = [], unsubAct = null, unsubBan = null, actUser = null, actLimit = 300;
function watchActivity() {
  try { if (!db) return; } catch (e) { return; } // 아직 데이터베이스 준비 전
  if (!isAdmin) { if (unsubAct) { unsubAct(); unsubBan(); unsubAct = unsubBan = null; } $("manage").hidden = true; return; }
  if (unsubAct) return;
  unsubAct = onSnapshot(query(collection(db, "activity"), orderBy("at", "desc"), limit(actLimit)), snap => {
    acts = snap.docs.map(d => { const v = d.data({ serverTimestamps: "estimate" }); return { id: d.id, ...v, at: v.at?.toDate?.() || null }; });
    renderManage();
  }, () => { acts = []; renderManage(); });
  unsubBan = onSnapshot(collection(db, "banned"), snap => { banned = snap.docs.map(d => ({ uid: d.id, ...d.data() })); renderManage(); }, () => {});
}
const shortId = u => u ? u.slice(0, 6) : "—";
function renderManage() {
  if (!isAdmin) return;
  const ks = $("m_kind"); if (!ks.options.length) {
    [["", "전체 활동"], ["fan", "팬 활동만"], ["admin", "관리자 처리만"], ...Object.entries(ACT)].forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; ks.appendChild(o); });
  }
  const rows = $("m_rows"); rows.textContent = "";
  if (!acts) { rows.innerHTML = '<tr><td colspan="5" class="mempty">불러오는 중…</td></tr>'; return; }
  const k = ks.value, q = $("m_q").value.trim().toLowerCase(), bset = new Set(banned.map(b => b.uid));
  const list = acts.filter(a => (!k || (k === "fan" ? !a.kind.startsWith("a_") : k === "admin" ? a.kind.startsWith("a_") : a.kind === k))
    && (!actUser || a.uid === actUser || a.target === actUser)
    && (!q || [a.nick, a.uid, a.detail, a.targetNick, a.target].some(x => String(x || "").toLowerCase().includes(q))));
  $("m_clear").hidden = !actUser;
  // 요약
  const day = Date.now() - 864e5, fans = new Set(acts.filter(a => !a.kind.startsWith("a_")).map(a => a.uid));
  const today = acts.filter(a => a.at && a.at.getTime() > day && !a.kind.startsWith("a_")).length;
  $("m_stats").innerHTML = "";
  [["최근 기록", acts.length], ["오늘 팬 활동", today], ["참여한 팬", fans.size], ["이용 제한", banned.length]].forEach(([l, n]) => {
    const d = document.createElement("div"); const b = document.createElement("b"); b.textContent = n; const sm = document.createElement("small"); sm.textContent = l; d.append(b, sm); $("m_stats").appendChild(d);
  });
  if (!list.length) rows.innerHTML = '<tr><td colspan="5" class="mempty">조건에 맞는 기록이 없어요.</td></tr>';
  const fmt = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  for (const a of list) {
    const tr = document.createElement("tr"); if (a.kind.startsWith("a_")) tr.className = "madmin";
    const td = (txt, cls) => { const c = document.createElement("td"); if (cls) c.className = cls; c.textContent = txt; tr.appendChild(c); return c; };
    td(a.at ? fmt.format(a.at) : "", "mtime");
    const who = td("", "mwho");
    const nb = document.createElement("button"); nb.type = "button"; nb.className = "mlink";
    nb.textContent = `${FLAG[a.from] || "🌏"} ${a.nick || "(이름 없음)"}`; nb.title = "이 사용자 활동만 보기";
    nb.onclick = () => { actUser = a.uid; renderManage(); };
    const idl = document.createElement("small"); idl.textContent = `ID ${shortId(a.uid)}${bset.has(a.uid) ? " · 🚫제한됨" : ""}`;
    who.append(nb, idl);
    td(ACT[a.kind] || a.kind, "mkind");
    const det = td(a.detail || "", "mdet");
    if (a.target || a.targetNick) {
      const tg = document.createElement("small"); tg.textContent = ` → 대상: ${a.targetNick || ""} ${a.target ? "(ID " + shortId(a.target) + ")" : ""}`;
      if (a.target) { tg.className = "mlink"; tg.style.cursor = "pointer"; tg.onclick = () => { actUser = a.target; renderManage(); }; }
      det.appendChild(tg);
    }
    const act = td("", "mact");
    const tgt = a.kind.startsWith("a_") ? a.target : a.uid, tnick = a.kind.startsWith("a_") ? a.targetNick : a.nick;
    if (tgt && tgt !== user.uid) {
      const b = document.createElement("button"); b.type = "button";
      if (bset.has(tgt)) { b.textContent = "제한 해제"; b.onclick = () => unban(tgt, tnick); }
      else { b.textContent = "이용 제한"; b.className = "mban"; b.onclick = () => ban(tgt, tnick, b); }
      act.appendChild(b);
    }
    rows.appendChild(tr);
  }
  $("m_more").textContent = acts.length >= actLimit ? `최근 ${actLimit}개 기록만 보여요.` : "";
  // 제한 목록
  const bl = $("m_banned"); bl.textContent = "";
  if (!banned.length) { bl.innerHTML = '<p class="hint">이용 제한된 사용자가 없어요.</p>'; }
  for (const b of banned) {
    const row = document.createElement("div"); row.className = "prow";
    const info = document.createElement("div"); info.className = "pinfo";
    const n = document.createElement("b"); n.textContent = `${b.nick || "(이름 없음)"} · ID ${shortId(b.uid)}`;
    const w = document.createElement("small"); w.textContent = b.at?.toDate ? fmt.format(b.at.toDate()) + " 제한" : "";
    info.append(n, w);
    const v = document.createElement("button"); v.type = "button"; v.textContent = "활동 보기"; v.onclick = () => { actUser = b.uid; renderManage(); scrollTo(0, 0); };
    const u = document.createElement("button"); u.type = "button"; u.className = "approve"; u.textContent = "제한 해제"; u.onclick = () => unban(b.uid, b.nick);
    row.append(info, v, u); bl.appendChild(row);
  }
}
async function ban(uid, nick, btn) {
  if (btn && btn.dataset.sure !== "1") { btn.dataset.sure = "1"; btn.textContent = "정말 제한할까요?"; setTimeout(() => { if (btn.isConnected) { btn.dataset.sure = ""; btn.textContent = "이용 제한"; } }, 4000); return; }
  try { await setDoc(doc(db, "banned", uid), { nick: String(nick || "").slice(0, 40), at: serverTimestamp() }); logAct("a_ban", "", { target: uid, targetNick: nick }); } catch (e) {}
}
async function unban(uid, nick) {
  try { await deleteDoc(doc(db, "banned", uid)); logAct("a_unban", "", { target: uid, targetNick: nick }); } catch (e) {}
}
$("m_kind").addEventListener("change", renderManage);
$("m_q").addEventListener("input", renderManage);
$("m_clear").addEventListener("click", () => { actUser = null; renderManage(); });

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
  counts(); disc(); renderNotes(); renderClips(); renderSuggest(); renderPhotos(); renderHearts(); renderEvents(); renderEvSuggest(); if (location.hash === "#request") renderRequests(); renderVotes(); renderQuiz(); renderLive(); renderPlayer(); renderAdmin(); renderTicker(); renderCelebrate();
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
  let nav = document.querySelector('.bar nav a[href="#manage"]');
  if (isAdmin && !nav) { nav = document.createElement("a"); nav.href = "#manage"; nav.textContent = "🛠 관리"; nav.className = "navmanage"; document.querySelector(".bar nav").appendChild(nav); }
  if (!isAdmin && nav) nav.remove();
  if (typeof watchActivity === "function") watchActivity();
  if (!isAdmin && location.hash === "#manage") location.hash = "#profile";
}

/* ---------- 꾸밈: 문구 ---------- */
const X = {
  ko: { tick: "전 세계 팬들의 응원", bday: "🎂 오늘은 현모의 생일이에요! 생일 축하해요!", debut: n => `🎉 오늘은 현모 데뷔 ${n}주년! 축하해요!` },
  en: { tick: "Cheers from around the world", bday: "🎂 It's Hyunmo's birthday today! Happy birthday!", debut: n => `🎉 Today is Hyunmo's ${n}-year debut anniversary!` },
  th: { tick: "กำลังใจจากแฟน ๆ ทั่วโลก", bday: "🎂 วันนี้วันเกิดฮยอนโม! สุขสันต์วันเกิดนะ!", debut: n => `🎉 วันนี้ครบรอบ ${n} ปีการเดบิวต์ของฮยอนโม!` },
  zh: { tick: "来自世界各地粉丝的应援", bday: "🎂 今天是 Hyunmo 的生日！生日快乐！", debut: n => `🎉 今天是 Hyunmo 出道 ${n} 周年！恭喜！` },
  fil: { tick: "Mga cheer mula sa buong mundo", bday: "🎂 Kaarawan ni Hyunmo ngayon! Happy birthday!", debut: n => `🎉 Ngayon ang ika-${n} taon ng debut ni Hyunmo!` },
  es: { tick: "Ánimos de fans de todo el mundo", bday: "🎂 ¡Hoy es el cumpleaños de Hyunmo! ¡Feliz cumpleaños!", debut: n => `🎉 ¡Hoy se cumplen ${n} años del debut de Hyunmo!` },
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
  const list = (notes || []).filter(n => !checkText(n.nick, n.msg)).slice(0, 20);
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

/* ---------- 메뉴별 페이지 나누기 ---------- */
const PAGES = ["profile", "schedule", "request", "music", "clips", "photos", "cheers", "links", "manage"];
const hero = document.querySelector(".hero");
const mini = document.createElement("div"); mini.className = "minititle";
mini.innerHTML = '<a href="#profile"><span class="mk">현모</span><span class="mr">HYUNMO</span></a>';
hero.prepend(mini);
let firstRoute = true;
function route() {
  const h = location.hash.slice(1);
  const page = PAGES.includes(h) && (h !== "manage" || isAdmin) ? h : "profile";
  PAGES.forEach(id => { const sec = document.getElementById(id); if (sec) sec.hidden = id !== page; });
  hero.classList.toggle("compact", page !== "profile");
  document.querySelectorAll(".bar nav a").forEach(a => {
    if (a.getAttribute("href") === "#" + page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (page === "photos") setTimeout(startPhotos, 0);
  if (page === "music") setTimeout(loadVotes, 0);
  if (page === "request") setTimeout(() => loadRequests(), 0);
  const sec = document.getElementById(page);
  if (sec) { sec.classList.remove("enter"); void sec.offsetWidth; sec.classList.add("enter"); }
  window.scrollTo(0, 0); requestAnimationFrame(() => window.scrollTo(0, 0)); if (firstRoute) setTimeout(() => window.scrollTo(0, 0), 300);
  firstRoute = false;
}
addEventListener("hashchange", route);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
route();
addEventListener("load", () => window.scrollTo(0, 0));

/* ---------- 첫 화면 사진: 여러 장이 겹쳐 놓인 사진 더미 + 배경 함께 바뀌기 ---------- */
const ringEl = document.querySelector(".ring");
const bgLayer = document.createElement("div"); bgLayer.className = "photobg"; bgLayer.setAttribute("aria-hidden", "true");
document.body.prepend(bgLayer);
let slide = 0, slideTimer = null;
const cards = [], bgImgs = [];
const LOOKS = [ // 앞에서부터 뒤로: 기울기, 위치
  { r: -2, x: 0, y: 0 }, { r: 6, x: 34, y: 14 }, { r: -7, x: -34, y: 18 }, { r: 3, x: 10, y: 26 }
];
if (PHOTOS.length) {
  const list = PHOTOS.map(p => typeof p === "string" ? { file: p } : p);
  ringEl.classList.add("has-photo");
  const stage = document.createElement("div"); stage.className = "stack";
  ringEl.before(stage);
  const tag = document.createElement("div"); tag.className = "nametag";
  tag.innerHTML = '<span class="name">현모</span><span class="rom">HYUNMO</span>';
  stage.appendChild(tag);
  const dots = document.createElement("div"); dots.className = "dots";
  stage.after(dots);
  list.forEach((p, i) => {
    const card = document.createElement("figure"); card.className = "pcard";
    const im = document.createElement("img"); im.src = p.file; im.alt = i ? "" : "현모 Hyunmo"; im.decoding = "async";
    if (p.focus) im.style.objectPosition = p.focus;
    im.addEventListener("load", () => card.style.setProperty("--ar", (im.naturalWidth / im.naturalHeight).toFixed(3)));
    card.appendChild(im); stage.insertBefore(card, tag); cards.push(card);
    const bg = document.createElement("div"); bg.className = "bgimg"; bg.style.backgroundImage = `url("${p.file}")`;
    bgLayer.appendChild(bg); bgImgs.push(bg);
    if (list.length > 1) {
      const d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", `${i + 1} / ${list.length}`);
      d.onclick = () => { showSlide(i); restartSlides(); };
      dots.appendChild(d);
    }
  });
  function showSlide(i) {
    const n = cards.length; slide = (i + n) % n;
    cards.forEach((c, k) => {
      const depth = (k - slide + n) % n, L = LOOKS[Math.min(depth, LOOKS.length - 1)];
      c.style.setProperty("--r", L.r + "deg"); c.style.setProperty("--x", L.x + "px"); c.style.setProperty("--y", L.y + "px");
      c.style.zIndex = String(n - depth);
      c.classList.toggle("front", depth === 0);
      c.classList.toggle("hide", depth >= LOOKS.length);
    });
    bgImgs.forEach((b, k) => b.classList.toggle("on", k === slide));
    [...dots.children].forEach((d, k) => d.setAttribute("aria-current", k === slide ? "true" : "false"));
  }
  function restartSlides() {
    clearInterval(slideTimer);
    if (cards.length > 1) slideTimer = setInterval(() => { if (!document.hidden) showSlide(slide + 1); }, Math.max(2, PHOTO_SECONDS) * 1000);
  }
  stage.addEventListener("click", () => { showSlide(slide + 1); restartSlides(); });
  // 휴대폰에서 옆으로 밀어 넘기기
  let sx = null;
  stage.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { showSlide(slide + (dx < 0 ? 1 : -1)); restartSlides(); }
  });
  showSlide(0); restartSlides();
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
    syncMine(); renderNotes(); renderTicker();
  }, () => { clearTimeout(slow); notesState = "slow"; notes = null; renderNotes(); });
  onSnapshot(query(collection(db, "clips"), orderBy("date", "desc"), limit(200)), snap => {
    clips = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderClips();
  }, () => { clips = []; renderClips(); });
  watchHearts(); watchEvents();
  onSnapshot(doc(db, "status", "live"), d => { live = d.exists() ? d.data() : null; renderLive(); }, () => {});

  // 방문자는 보이지 않게 익명 로그인 → 로그인 화면 없이 응원 메시지를 쓸 수 있어요
  onAuthStateChanged(auth, async u => {
    if (!u) { signInAnonymously(auth).catch(() => {}); return; }
    user = u; isAdmin = false;
    if (!u.isAnonymous && u.email) isAdmin = await checkAdmin(u);
    try { const bd = await getDoc(doc(db, "banned", u.uid)); document.body.classList.toggle("banned", bd.exists()); } catch (e) {}
    $("form").hidden = false;
    syncMine(); renderNotes(); renderClips(); renderLive(); renderAdmin(); watchPending(); watchPhotoPending(); watchEvPending(); renderEvents(); loadVotes(); if (location.hash === "#request") loadRequests(true);
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
    if (checkText(nick, msg)) { $("status").textContent = T[lang].blocked; return; }
    const btn = $("send"), st = $("status"); btn.disabled = true; st.textContent = "";
    try { const wasMine = !!mine; await setDoc(doc(db, "guestbook", user.uid), { nick, msg, from, at: serverTimestamp() }); st.textContent = T[lang].posted; logAct(wasMine ? "cheer_edit" : "cheer", msg, { nick, from }); }
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
    try { await addDoc(collection(db, "clips"), { url, song, cap, date, at: serverTimestamp() }); st.textContent = T[lang].added; logAct("a_add_video", song); $("clipform").reset(); $("cdate").value = date; }
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
      logAct(on ? "a_live_off" : "a_live_on", on ? "" : url);
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
