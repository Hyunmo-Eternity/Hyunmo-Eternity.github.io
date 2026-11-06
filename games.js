// 🎮 게임 페이지: 양말이 간식 받기 · 사진 짝 맞추기
const G = {
ko: { title: "게임", intro: "모모님과 양말이랑 같이 놀아요! 간식 점수는 우리나라 점수로 모여요.",
  tab_catch: "🦴 간식 받기", tab_match: "🃏 짝 맞추기", tab_song: "🎵 노래 맞히기",
  start: "시작하기", again: "다시 하기", score: "점수", best: "최고", time: "시간", moves: "넘긴 횟수",
  catch_help: "손가락으로 양말이를 좌우로 움직여 간식을 받아요. 🍫초콜릿 🧅양파 🍇포도는 강아지에게 위험하니까 피해요!",
  catch_over: "간식 {n}점!", newbest: "최고 기록이에요! 🎉", sent: "{flag} {country} 점수에 {n}점을 더했어요",
  board_title: "나라별 간식 점수", board_empty: "아직 점수가 없어요. 첫 번째가 되어 주세요!",
  match_help: "카드를 두 장씩 뒤집어서 같은 사진을 찾아요.", match_done: "{m}번 만에 다 찾았어요!",
  song_help: "노래 앞부분을 잠깐 듣고 제목을 맞혀요. 모두 5문제예요.", song_q: "{i}번째 노래, 제목은?",
  replay: "▶ 다시 듣기", right: "정답! 🎉", wrong: "아쉬워요. 정답은 「{t}」", next: "다음 문제", song_done: "5문제 중 {n}개 맞혔어요!",
  bad_food: "앗, 강아지에게 위험한 음식이에요!" },
en: { title: "Games", intro: "Play with Hyunmo and Yangmal! Treat scores add up for your country.",
  tab_catch: "🦴 Treat catch", tab_match: "🃏 Memory", tab_song: "🎵 Name that song",
  start: "Start", again: "Play again", score: "Score", best: "Best", time: "Time", moves: "Moves",
  catch_help: "Slide Yangmal left and right to catch treats. Dodge 🍫chocolate, 🧅onion and 🍇grapes — they're unsafe for dogs!",
  catch_over: "{n} points of treats!", newbest: "New best! 🎉", sent: "Added {n} points to {flag} {country}",
  board_title: "Treat points by country", board_empty: "No scores yet. Be the first!",
  match_help: "Flip two cards at a time and find the matching photos.", match_done: "All found in {m} moves!",
  song_help: "Hear a few seconds of a song and pick the title. 5 rounds.", song_q: "Song {i} — what's the title?",
  replay: "▶ Listen again", right: "Correct! 🎉", wrong: "So close! It was “{t}”", next: "Next", song_done: "You got {n} out of 5!",
  bad_food: "Oops, that's not safe for dogs!" },
th: { title: "เกม", intro: "มาเล่นกับฮยอนโมและยังมัลกัน! คะแนนขนมจะรวมเป็นคะแนนของประเทศคุณ",
  tab_catch: "🦴 รับขนม", tab_match: "🃏 จับคู่รูป", tab_song: "🎵 ทายเพลง",
  start: "เริ่มเลย", again: "เล่นอีกครั้ง", score: "คะแนน", best: "สูงสุด", time: "เวลา", moves: "จำนวนครั้ง",
  catch_help: "เลื่อนยังมัลไปซ้ายขวาเพื่อรับขนม หลบ 🍫ช็อกโกแลต 🧅หัวหอม 🍇องุ่น เพราะอันตรายต่อน้องหมา!",
  catch_over: "ได้ขนม {n} คะแนน!", newbest: "สถิติใหม่! 🎉", sent: "เพิ่ม {n} คะแนนให้ {flag} {country} แล้ว",
  board_title: "คะแนนขนมของแต่ละประเทศ", board_empty: "ยังไม่มีคะแนน มาเป็นคนแรกกันเถอะ!",
  match_help: "เปิดการ์ดทีละสองใบ แล้วหารูปที่เหมือนกัน", match_done: "หาครบใน {m} ครั้ง!",
  song_help: "ฟังท่อนต้นของเพลงสักครู่แล้วทายชื่อเพลง ทั้งหมด 5 ข้อ", song_q: "เพลงที่ {i} ชื่ออะไร?",
  replay: "▶ ฟังอีกครั้ง", right: "ถูกต้อง! 🎉", wrong: "เสียดายจัง คำตอบคือ “{t}”", next: "ข้อต่อไป", song_done: "ตอบถูก {n} จาก 5 ข้อ!",
  bad_food: "อุ๊ย อันนี้อันตรายต่อน้องหมานะ!" },
ja: { title: "ゲーム", intro: "ヒョンモとヤンマルと一緒に遊ぼう！おやつの点数は国ごとに集まります。",
  tab_catch: "🦴 おやつキャッチ", tab_match: "🃏 神経衰弱", tab_song: "🎵 イントロクイズ",
  start: "スタート", again: "もう一度", score: "スコア", best: "ベスト", time: "時間", moves: "めくった回数",
  catch_help: "指でヤンマルを左右に動かしておやつをキャッチ。🍫チョコ 🧅玉ねぎ 🍇ぶどうは犬に危ないのでよけてね！",
  catch_over: "おやつ {n} 点！", newbest: "自己ベスト！🎉", sent: "{flag} {country} に {n} 点をプラスしました",
  board_title: "国別おやつスコア", board_empty: "まだスコアがありません。一番乗りになろう！",
  match_help: "カードを2枚ずつめくって、同じ写真を見つけよう。", match_done: "{m} 回で全部見つけました！",
  song_help: "曲の最初を少し聴いてタイトルを当ててね。全5問です。", song_q: "{i}曲目、タイトルは？",
  replay: "▶ もう一度聴く", right: "正解！🎉", wrong: "おしい！正解は「{t}」", next: "次の問題", song_done: "5問中 {n} 問正解！",
  bad_food: "あっ、犬には危ない食べ物だよ！" },
zh: { title: "游戏", intro: "和炫模、袜子一起玩吧！零食分数会累计到你的国家。",
  tab_catch: "🦴 接零食", tab_match: "🃏 翻牌配对", tab_song: "🎵 听歌猜名",
  start: "开始", again: "再玩一次", score: "分数", best: "最高", time: "时间", moves: "翻牌次数",
  catch_help: "用手指左右移动袜子来接零食。🍫巧克力 🧅洋葱 🍇葡萄对狗狗有危险，要躲开哦！",
  catch_over: "零食 {n} 分！", newbest: "新纪录！🎉", sent: "已为 {flag} {country} 加上 {n} 分",
  board_title: "各国零食分数", board_empty: "还没有分数，快来当第一名！",
  match_help: "每次翻两张牌，找出相同的照片。", match_done: "用了 {m} 次全部找到！",
  song_help: "听几秒歌曲开头，猜出歌名。共 5 题。", song_q: "第 {i} 首，歌名是？",
  replay: "▶ 再听一次", right: "答对了！🎉", wrong: "可惜！答案是「{t}」", next: "下一题", song_done: "5 题答对 {n} 题！",
  bad_food: "哎呀，这对狗狗有危险！" },
fil: { title: "Laro", intro: "Makipaglaro kina Hyunmo at Yangmal! Napupunta sa bansa mo ang treat points.",
  tab_catch: "🦴 Saluhin ang treats", tab_match: "🃏 Memory", tab_song: "🎵 Hulaan ang kanta",
  start: "Simulan", again: "Laro ulit", score: "Puntos", best: "Pinakamataas", time: "Oras", moves: "Bilang ng buklat",
  catch_help: "I-slide si Yangmal pakaliwa at pakanan para saluhin ang treats. Iwasan ang 🍫tsokolate, 🧅sibuyas at 🍇ubas — delikado sa aso!",
  catch_over: "{n} puntos ng treats!", newbest: "Bagong record! 🎉", sent: "Nadagdag ang {n} puntos sa {flag} {country}",
  board_title: "Treat points bawat bansa", board_empty: "Wala pang puntos. Ikaw na ang mauna!",
  match_help: "Bumuklat ng dalawang card at hanapin ang magkaparehong litrato.", match_done: "Nahanap lahat sa {m} buklat!",
  song_help: "Pakinggan ang ilang segundo ng kanta at piliin ang pamagat. 5 tanong.", song_q: "Kanta {i} — ano ang pamagat?",
  replay: "▶ Pakinggan ulit", right: "Tama! 🎉", wrong: "Sayang! Ang sagot ay “{t}”", next: "Susunod", song_done: "Tama ka sa {n} sa 5!",
  bad_food: "Naku, delikado iyan sa aso!" },
es: { title: "Juegos", intro: "¡Juega con Hyunmo y Yangmal! Los puntos de premios se suman a tu país.",
  tab_catch: "🦴 Atrapa premios", tab_match: "🃏 Memoria", tab_song: "🎵 Adivina la canción",
  start: "Empezar", again: "Jugar otra vez", score: "Puntos", best: "Récord", time: "Tiempo", moves: "Intentos",
  catch_help: "Mueve a Yangmal a los lados para atrapar premios. ¡Esquiva 🍫chocolate, 🧅cebolla y 🍇uvas, que son peligrosos para perros!",
  catch_over: "¡{n} puntos de premios!", newbest: "¡Nuevo récord! 🎉", sent: "Sumaste {n} puntos a {flag} {country}",
  board_title: "Puntos de premios por país", board_empty: "Aún no hay puntos. ¡Sé la primera persona!",
  match_help: "Voltea dos cartas a la vez y encuentra las fotos iguales.", match_done: "¡Todas encontradas en {m} intentos!",
  song_help: "Escucha unos segundos y elige el título. 5 rondas.", song_q: "Canción {i}: ¿cuál es el título?",
  replay: "▶ Escuchar otra vez", right: "¡Correcto! 🎉", wrong: "¡Casi! Era «{t}»", next: "Siguiente", song_done: "¡Acertaste {n} de 5!",
  bad_food: "¡Uy, eso es peligroso para perros!" },
};

const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

let C = null, tab = "catch", board = {}, started = false;
const $ = id => document.getElementById(id);
const g = () => G[C.getLang()] || G.en;

export function startGames(ctx) {
  C = ctx;
  if (!started) {
    started = true;
    document.querySelectorAll("#games .gtabs button").forEach(b => b.addEventListener("click", () => { tab = b.dataset.g; stopAll(); render(); }));
    Catch.init(); Match.init();
    C.watchBoard(b => { board = b; renderBoard(); });
  }
  tab = store.get("hm_gtab") === "match" ? "match" : "catch";
  render();
}
export function stopGames() { if (C) stopAll(); }
export function langGames() { if (started) render(); }

function stopAll() { Catch.stop(); }
function render() {
  const t = g(); store.set("hm_gtab", tab);
  $("g_title").textContent = t.title; $("g_intro").textContent = t.intro;
  document.querySelectorAll("#games .gtabs button").forEach(b => { b.textContent = t["tab_" + b.dataset.g]; b.setAttribute("aria-pressed", b.dataset.g === tab); });
  ["catch", "match"].forEach(k => $("g_" + k).hidden = k !== tab);
  Catch.render(); Match.render(); renderBoard();
}
function renderBoard() {
  if (!C) return;
  const t = g(), ol = $("g_board"); ol.textContent = "";
  $("g_board_title").textContent = "🏆 " + t.board_title;
  const rows = Object.entries(board).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) { const li = document.createElement("li"); li.className = "gempty"; li.textContent = t.board_empty; ol.appendChild(li); return; }
  const max = rows[0][1];
  rows.slice(0, 7).forEach(([cc, n], i) => {
    const li = document.createElement("li");
    const nm = document.createElement("span"); nm.className = "hn"; nm.textContent = `${["🥇", "🥈", "🥉"][i] || (i + 1) + "."} ${C.flagOf(cc)} ${C.countryName(cc)}`;
    const bar = document.createElement("span"); bar.className = "hbar"; bar.style.setProperty("--w", Math.max(4, n / max * 100) + "%");
    const num = document.createElement("span"); num.className = "hc"; num.textContent = n.toLocaleString();
    li.append(nm, bar, num); ol.appendChild(li);
  });
}

/* ---------- 1. 양말이 간식 받기 ---------- */
const Catch = (() => {
  const GOOD = [["🦴", 1], ["🍖", 1], ["🥕", 1], ["🍓", 1], ["🧀", 1]], BAD = ["🍫", "🧅", "🍇"];
  let cv, cx, W = 0, H = 0, dpr = 1, pup = new Image(), raf = 0, running = false, over = false;
  let x = 0, tx = 0, items = [], score = 0, lives = 3, t0 = 0, lastSpawn = 0, flash = 0, pops = [], last = 0;
  const DUR = 45000, PW = 86;
  function init() {
    cv = $("g_cv"); cx = cv.getContext("2d");
    pup.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(C.poodleSVG().replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
    const move = e => { const r = cv.getBoundingClientRect(); tx = Math.max(PW / 2, Math.min(W - PW / 2, e.clientX - r.left)); };
    cv.addEventListener("pointerdown", e => { move(e); if (!running) start(); });
    cv.addEventListener("pointermove", move);
    addEventListener("keydown", e => {
      if (!running || tab !== "catch" || $("games").hidden) return;
      if (e.key === "ArrowLeft") { tx = Math.max(PW / 2, tx - 60); e.preventDefault(); }
      if (e.key === "ArrowRight") { tx = Math.min(W - PW / 2, tx + 60); e.preventDefault(); }
    });
    $("gc_start").addEventListener("click", start);
    addEventListener("resize", () => { if (!$("g_catch").hidden) { size(); if (!running) draw(); } });
  }
  function size() {
    const w = cv.parentElement.clientWidth; dpr = Math.min(2, devicePixelRatio || 1);
    W = w; H = Math.round(Math.min(460, Math.max(340, w * 1.05)));
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px"; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!x) x = tx = W / 2;
  }
  function start() {
    size(); running = true; over = false; items = []; pops = []; score = 0; lives = 3; t0 = performance.now(); lastSpawn = 0; x = tx = W / 2; last = t0;
    $("gc_over").hidden = true; $("gc_start").hidden = true; hud();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function spawn(el) {
    const p = Math.min(1, el / DUR), r = Math.random();
    let it;
    if (r < 0.2 + p * 0.12) it = { e: BAD[Math.floor(Math.random() * BAD.length)], bad: true };
    else if (r < 0.28 + p * 0.12) it = { e: C.xmas ? "🎁" : "💖", v: 3 };
    else { const gd = GOOD[Math.floor(Math.random() * GOOD.length)]; it = { e: gd[0], v: gd[1] }; }
    it.x = 20 + Math.random() * (W - 40); it.y = -24; it.vy = 140 + p * 190 + Math.random() * 60; it.rot = (Math.random() - .5) * 2;
    items.push(it);
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const el = now - t0;
    if (el - lastSpawn > Math.max(330, 780 - el / 70)) { spawn(el); lastSpawn = el; }
    x += (tx - x) * Math.min(1, dt * 14);
    const py = H - 70;
    items.forEach(it => { it.y += it.vy * dt; });
    items = items.filter(it => {
      if (it.y > py - 10 && it.y < py + 40 && Math.abs(it.x - x) < PW / 2 + 6) {
        if (it.bad) { lives--; flash = 1; pops.push({ x: it.x, y: py - 20, s: "💦", a: 1 }); C.vibrate && C.vibrate(); }
        else { score += it.v; pops.push({ x: it.x, y: py - 20, s: "+" + it.v, a: 1 }); }
        return false;
      }
      return it.y < H + 30;
    });
    pops.forEach(p => { p.y -= 50 * dt; p.a -= dt * 1.4; }); pops = pops.filter(p => p.a > 0);
    flash = Math.max(0, flash - dt * 2.5);
    draw(el); hud(el);
    if (lives <= 0 || el >= DUR) return end();
    raf = requestAnimationFrame(loop);
  }
  function draw(el = 0) {
    if (!W) size();
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = "rgba(168,100,47,.12)"; cx.fillRect(0, H - 22, W, 22);
    if (flash) { cx.fillStyle = `rgba(233,80,110,${flash * .25})`; cx.fillRect(0, 0, W, H); }
    cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "30px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    items.forEach(it => { cx.save(); cx.translate(it.x, it.y); cx.rotate(it.rot * Math.sin((it.y) / 60)); cx.fillText(it.e, 0, 0); cx.restore(); });
    const bob = running ? Math.sin(el / 120) * 2 : 0;
    if (pup.complete) cx.drawImage(pup, x - PW / 2, H - 70 - PW / 2 - 6 + bob, PW, PW);
    pops.forEach(p => { cx.globalAlpha = Math.max(0, p.a); cx.font = "bold 20px system-ui,sans-serif"; cx.fillStyle = "#E91E63"; cx.fillText(p.s, p.x, p.y); cx.globalAlpha = 1; });
  }
  function hud(el = 0) {
    const t = g();
    $("gc_score").textContent = `${t.score} ${score}`;
    $("gc_time").textContent = `⏱ ${Math.max(0, Math.ceil((DUR - el) / 1000))}`;
    $("gc_lives").textContent = "❤️".repeat(Math.max(0, lives)) + "🤍".repeat(3 - Math.max(0, lives));
    $("gc_best").textContent = `${t.best} ${store.get("hm_g_catch") || 0}`;
  }
  async function end() {
    running = false; over = true;
    const t = g(), best = +(store.get("hm_g_catch") || 0), nb = score > best;
    if (nb) store.set("hm_g_catch", score);
    hud(DUR);
    $("gc_over").hidden = false; $("gc_start").hidden = false; $("gc_start").textContent = t.again;
    $("gc_res").textContent = fmt(t.catch_over, { n: score }) + (nb && score ? " " + t.newbest : "");
    $("gc_sent").textContent = "";
    if (score > 0) {
      if (nb) C.celebrate();
      const cc = C.getCountry();
      if (await C.saveScore(score)) $("gc_sent").textContent = fmt(t.sent, { n: score, flag: C.flagOf(cc), country: C.countryName(cc) });
    }
  }
  function render() {
    const t = g();
    $("gc_help").textContent = t.catch_help;
    if (!running) { $("gc_start").textContent = over ? t.again : t.start; $("gc_start").hidden = false; }
    if (!$("g_catch").hidden) { size(); if (!running) draw(); }
    hud(running ? performance.now() - t0 : over ? DUR : 0);
  }
  return { init, stop, render };
})();

/* ---------- 2. 사진 짝 맞추기 ---------- */
const Match = (() => {
  let deck = [], open = [], done = new Set(), moves = 0, lock = false, t0 = 0, timer = 0, finished = false;
  function init() { $("gm_start").addEventListener("click", deal); }
  function deal() {
    const pics = shuffle(C.photos).slice(0, 8);
    deck = shuffle([...pics, ...pics]).map((src, i) => ({ src, i }));
    open = []; done = new Set(); moves = 0; lock = false; finished = false; t0 = 0; clearInterval(timer);
    $("gm_res").textContent = ""; build(); hud();
  }
  function build() {
    const grid = $("gm_grid"); grid.textContent = "";
    deck.forEach((c, k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "mcard"; b.dataset.k = k;
      b.innerHTML = `<span class="mback">🐾</span><span class="mfront"><img alt="" loading="lazy"></span>`;
      b.querySelector("img").src = c.src;
      b.addEventListener("click", () => flip(k, b));
      grid.appendChild(b);
    });
  }
  function flip(k, b) {
    if (lock || finished || done.has(k) || open.includes(k)) return;
    if (!t0) { t0 = Date.now(); timer = setInterval(hud, 1000); }
    b.classList.add("up"); open.push(k);
    if (open.length < 2) return;
    moves++; hud();
    const [a, c] = open;
    if (deck[a].src === deck[c].src) {
      done.add(a); done.add(c); open = [];
      setTimeout(() => document.querySelectorAll(`.mcard[data-k="${a}"],.mcard[data-k="${c}"]`).forEach(e => e.classList.add("got")), 250);
      if (done.size === deck.length) win();
    } else {
      lock = true;
      setTimeout(() => { document.querySelectorAll(`.mcard[data-k="${a}"],.mcard[data-k="${c}"]`).forEach(e => e.classList.remove("up")); open = []; lock = false; }, 850);
    }
  }
  function win() {
    finished = true; clearInterval(timer);
    const t = g(), best = +(store.get("hm_g_match") || 0), nb = !best || moves < best;
    if (nb) store.set("hm_g_match", moves);
    $("gm_res").textContent = fmt(t.match_done, { m: moves }) + (nb ? " " + t.newbest : "");
    $("gm_start").textContent = t.again; hud(); C.celebrate();
  }
  function hud() {
    const t = g(), s = t0 ? Math.floor(((finished ? Date.now() : Date.now()) - t0) / 1000) : 0;
    $("gm_moves").textContent = `${t.moves} ${moves}`;
    $("gm_time").textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $("gm_best").textContent = `${t.best} ${store.get("hm_g_match") || "-"}`;
    if (finished) clearInterval(timer);
  }
  function render() {
    const t = g(); $("gm_help").textContent = t.match_help;
    $("gm_start").textContent = finished ? t.again : (deck.length ? t.again : t.start);
    if (!deck.length) deal(); else hud();
  }
  return { init, render };
})();
