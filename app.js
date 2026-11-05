import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, query, orderBy, limit, setDoc, addDoc, deleteDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, DEFAULT_LIVE_URL } from "./firebase-config.js";
import { T, DISC } from "./i18n.js";
import { PLAYLIST } from "./music/playlist.js";
import { PHOTOS, PHOTO_SECONDS } from "./photos.js";

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
audio.addEventListener("play", () => { if (typeof onlyThis === "function") onlyThis(null); });

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
    if (isAdmin) { const x = document.createElement("button"); x.type = "button"; x.textContent = t.del; x.onclick = () => deleteDoc(doc(db, "clips", c.id)).catch(() => {}); m.appendChild(x); }
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
      } catch (e) { ok.disabled = no.disabled = false; }
    };
    no.onclick = () => { no.disabled = true; deleteDoc(doc(db, "suggestions", g.id)).catch(() => { no.disabled = false; }); };
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
  btn.disabled = true; st.textContent = "";
  try {
    await addDoc(collection(db, "suggestions"), { url, song, nick, from, by: user.uid, at: serverTimestamp() });
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
      } catch (e) { ok.disabled = no.disabled = false; }
    };
    no.onclick = () => { no.disabled = true; deleteDoc(doc(db, "photo_pending", ph.id)).catch(() => { no.disabled = false; }); };
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
  try { await deleteDoc(doc(db, "photos", id)); await deleteDoc(doc(db, "photo_full", id)); } catch (e) {}
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
  btn.disabled = true; st.textContent = "";
  try {
    await addDoc(collection(db, "photo_pending"), { img: upData.img, thumb: upData.thumb, cap, nick, from, by: user.uid, at: serverTimestamp() });
    st.textContent = t.up_thanks; $("up_file").value = ""; $("up_cap").value = ""; $("up_preview").hidden = true; upData = null;
  } catch (err) { st.textContent = t.fail; }
  btn.disabled = false;
});

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
  counts(); disc(); renderNotes(); renderClips(); renderSuggest(); renderPhotos(); renderLive(); renderPlayer(); renderAdmin(); renderTicker(); renderCelebrate();
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

/* ---------- 메뉴별 페이지 나누기 ---------- */
const PAGES = ["profile", "music", "clips", "photos", "cheers", "links"];
const hero = document.querySelector(".hero");
const mini = document.createElement("div"); mini.className = "minititle";
mini.innerHTML = '<a href="#profile"><span class="mk">현모</span><span class="mr">HYUNMO</span></a>';
hero.prepend(mini);
let firstRoute = true;
function route() {
  const h = location.hash.slice(1);
  const page = PAGES.includes(h) ? h : "profile";
  PAGES.forEach(id => { const sec = document.getElementById(id); if (sec) sec.hidden = id !== page; });
  hero.classList.toggle("compact", page !== "profile");
  document.querySelectorAll(".bar nav a").forEach(a => {
    if (a.getAttribute("href") === "#" + page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (page === "photos") setTimeout(startPhotos, 0);
  const sec = document.getElementById(page);
  if (sec) { sec.classList.remove("enter"); void sec.offsetWidth; sec.classList.add("enter"); }
  window.scrollTo(0, 0);
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
  onSnapshot(doc(db, "status", "live"), d => { live = d.exists() ? d.data() : null; renderLive(); }, () => {});

  // 방문자는 보이지 않게 익명 로그인 → 로그인 화면 없이 응원 메시지를 쓸 수 있어요
  onAuthStateChanged(auth, async u => {
    if (!u) { signInAnonymously(auth).catch(() => {}); return; }
    user = u; isAdmin = false;
    if (!u.isAnonymous && u.email) isAdmin = await checkAdmin(u);
    $("form").hidden = false;
    syncMine(); renderNotes(); renderClips(); renderLive(); renderAdmin(); watchPending(); watchPhotoPending();
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
