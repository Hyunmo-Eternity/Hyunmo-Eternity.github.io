// 🎮 게임 페이지: 양말이 간식 받기 · 사진 짝 맞추기
const G = {
ko: { title: "게임", intro: "모모님, 양말이와 함께 놀아요! 게임 결과만큼 우리나라에 하트가 쌓이고, 매주 월요일에 나라별 메달로 정산돼요.",
  tab_catch: "🦴 간식 받기", tab_match: "🃏 짝 맞추기", tab_song: "🎵 노래 맞히기",
  start: "시작하기", again: "다시 하기", score: "점수", best: "최고", time: "시간", moves: "넘긴 횟수",
  catch_help: "손가락으로 양말이를 좌우로 움직여 간식을 받아요. 🍫초콜릿 🧅양파 🍇포도는 강아지에게 위험하니까 피해요!",
  catch_over: "간식 {n}점!", newbest: "최고 기록이에요! 🎉", sent: "{flag} {country} 점수에 {n}점을 더했어요",
  board_title: "나라별 간식 점수", board_empty: "아직 점수가 없어요. 첫 번째가 되어 주세요!",
  match_help: "카드를 두 장씩 뒤집어서 같은 사진을 찾아요.", match_done: "{m}번 만에 다 찾았어요!",
  song_help: "노래 앞부분을 잠깐 듣고 제목을 맞혀요. 모두 5문제예요.", song_q: "{i}번째 노래, 제목은?",
  replay: "▶ 다시 듣기", right: "정답! 🎉", wrong: "아쉬워요. 정답은 「{t}」", next: "다음 문제", song_done: "5문제 중 {n}개 맞혔어요!",
  tab_derby: "🏇 모모 더비", derby_help: "응원할 말을 고르고, 출발하면 「달려!」 버튼을 빠르게 연타해요. 등수가 높을수록 우리나라에 하트가 많이 쌓여요!", pick: "응원할 말을 골라요", run: "달려! 🥕", me: "나", place: "{p}등!", derby_res: "{flag} {country}에 하트 {n}개를 보냈어요 💗", derby_nohearts: "하트를 보내지 못했어요. 잠시 후 다시 해주세요.", places: "1등 💗200 · 2등 💗140 · 3등 💗100 · 4등 💗60 · 5등 💗40", nick_label: "아이디", nick_ph: "게임에서 쓸 이름", nick_need: "먼저 아이디를 적어주세요 🙂", nick_bad: "이 아이디는 쓸 수 없어요", country_label: "내 나라", catch_reward: "간식 4점마다 💗20 (최대 💗200)", match_reward: "12번 이내 💗200 · 16번 이내 💗140 · 22번 이내 💗100 · 그 이상 💗60", left: "오늘 남은 게임: {n}/{max}판", limit_done: "오늘 {max}판을 다 했어요! 내일 또 만나요 🌙",
  how: "게임 방법", how_derby: ["위에 아이디를 적고 내 나라를 골라요", "아래 5마리 중 응원할 말의 줄을 톡 눌러요", "3·2·1 GO! 후 「달려! 🥕」 버튼을 빠르게 연타해요", "🏁 도착 등수만큼 우리나라에 하트가 쌓여요"], how_catch: ["「시작하기」를 눌러요", "손가락으로 화면을 좌우로 밀어 양말이를 움직여요", "🦴🍖🥕 간식은 받고, 🍫🧅🍇 는 피해요 (45초)"], how_match: ["카드를 아무거나 두 장 눌러 뒤집어요", "같은 사진이면 그대로, 다르면 다시 덮여요", "적은 횟수로 다 찾을수록 하트를 많이 받아요"],
  horses: ["🧦 양말이호", "⭐ 반짝별", "🍓 딸기", "❄️ 눈송이", "🌈 무지개"],
  bad_food: "앗, 강아지에게 위험한 음식이에요!" },
en: { title: "Games", intro: "Play with Hyunmo and Yangmal! Your results add hearts to your country, and every Monday the week's hearts are settled into country medals.",
  tab_catch: "🦴 Treat catch", tab_match: "🃏 Memory", tab_song: "🎵 Name that song",
  start: "Start", again: "Play again", score: "Score", best: "Best", time: "Time", moves: "Moves",
  catch_help: "Slide Yangmal left and right to catch treats. Dodge 🍫chocolate, 🧅onion and 🍇grapes — they're unsafe for dogs!",
  catch_over: "{n} points of treats!", newbest: "New best! 🎉", sent: "Added {n} points to {flag} {country}",
  board_title: "Treat points by country", board_empty: "No scores yet. Be the first!",
  match_help: "Flip two cards at a time and find the matching photos.", match_done: "All found in {m} moves!",
  song_help: "Hear a few seconds of a song and pick the title. 5 rounds.", song_q: "Song {i} — what's the title?",
  replay: "▶ Listen again", right: "Correct! 🎉", wrong: "So close! It was “{t}”", next: "Next", song_done: "You got {n} out of 5!",
  tab_derby: "🏇 Momo Derby", derby_help: "Pick a horse to cheer for, then tap “Run!” as fast as you can. The higher you place, the more hearts your country gets!", pick: "Pick your horse", run: "Run! 🥕", me: "Me", place: "{p}st!", derby_res: "Sent {n} hearts to {flag} {country} 💗", derby_nohearts: "Couldn't send hearts. Please try again in a moment.", places: "1st 💗200 · 2nd 💗140 · 3rd 💗100 · 4th 💗60 · 5th 💗40", nick_label: "ID", nick_ph: "Your name in games", nick_need: "Please enter your ID first 🙂", nick_bad: "That ID can't be used", country_label: "My country", catch_reward: "💗20 for every 4 treat points (up to 💗200)", match_reward: "≤12 moves 💗200 · ≤16 💗140 · ≤22 💗100 · more 💗60", left: "Games left today: {n}/{max}", limit_done: "You've played all {max} games today! See you tomorrow 🌙",
  how: "How to play", how_derby: ["Enter your ID and pick your country above", "Tap the lane of the horse you want to cheer for", "After 3·2·1 GO!, tap “Run! 🥕” as fast as you can", "Your place at 🏁 decides your country's hearts"], how_catch: ["Tap “Start”", "Slide your finger left and right to move Yangmal", "Catch 🦴🍖🥕 treats and dodge 🍫🧅🍇 (45 seconds)"], how_match: ["Tap any two cards to flip them", "Matching photos stay open; others flip back", "Fewer moves means more hearts"],
  horses: ["🧦 Yangmal", "⭐ Twinkle", "🍓 Berry", "❄️ Snowflake", "🌈 Rainbow"],
  bad_food: "Oops, that's not safe for dogs!" },
th: { title: "เกม", intro: "มาเล่นกับฮยอนโมและยังมัลกัน! ผลเกมจะเพิ่มหัวใจให้ประเทศคุณ และทุกวันจันทร์จะสรุปเป็นเหรียญของแต่ละประเทศ",
  tab_catch: "🦴 รับขนม", tab_match: "🃏 จับคู่รูป", tab_song: "🎵 ทายเพลง",
  start: "เริ่มเลย", again: "เล่นอีกครั้ง", score: "คะแนน", best: "สูงสุด", time: "เวลา", moves: "จำนวนครั้ง",
  catch_help: "เลื่อนยังมัลไปซ้ายขวาเพื่อรับขนม หลบ 🍫ช็อกโกแลต 🧅หัวหอม 🍇องุ่น เพราะอันตรายต่อน้องหมา!",
  catch_over: "ได้ขนม {n} คะแนน!", newbest: "สถิติใหม่! 🎉", sent: "เพิ่ม {n} คะแนนให้ {flag} {country} แล้ว",
  board_title: "คะแนนขนมของแต่ละประเทศ", board_empty: "ยังไม่มีคะแนน มาเป็นคนแรกกันเถอะ!",
  match_help: "เปิดการ์ดทีละสองใบ แล้วหารูปที่เหมือนกัน", match_done: "หาครบใน {m} ครั้ง!",
  song_help: "ฟังท่อนต้นของเพลงสักครู่แล้วทายชื่อเพลง ทั้งหมด 5 ข้อ", song_q: "เพลงที่ {i} ชื่ออะไร?",
  replay: "▶ ฟังอีกครั้ง", right: "ถูกต้อง! 🎉", wrong: "เสียดายจัง คำตอบคือ “{t}”", next: "ข้อต่อไป", song_done: "ตอบถูก {n} จาก 5 ข้อ!",
  tab_derby: "🏇 โมโม ดาร์บี้", derby_help: "เลือกม้าที่จะเชียร์ แล้วกดปุ่ม “วิ่ง!” รัว ๆ ยิ่งได้อันดับดี ประเทศของคุณยิ่งได้หัวใจเยอะ!", pick: "เลือกม้าของคุณ", run: "วิ่ง! 🥕", me: "ฉัน", place: "อันดับ {p}!", derby_res: "ส่งหัวใจ {n} ดวงให้ {flag} {country} แล้ว 💗", derby_nohearts: "ส่งหัวใจไม่สำเร็จ ลองใหม่อีกครั้งนะ", places: "อันดับ1 💗200 · 2 💗140 · 3 💗100 · 4 💗60 · 5 💗40", nick_label: "ไอดี", nick_ph: "ชื่อที่ใช้ในเกม", nick_need: "กรุณาใส่ไอดีก่อนนะ 🙂", nick_bad: "ใช้ไอดีนี้ไม่ได้", country_label: "ประเทศของฉัน", catch_reward: "ทุก 4 คะแนนขนม 💗20 (สูงสุด 💗200)", match_reward: "ไม่เกิน 12 ครั้ง 💗200 · 16 ครั้ง 💗140 · 22 ครั้ง 💗100 · มากกว่านั้น 💗60", left: "วันนี้เหลือ {n}/{max} เกม", limit_done: "วันนี้เล่นครบ {max} เกมแล้ว! พรุ่งนี้มาใหม่นะ 🌙",
  how: "วิธีเล่น", how_derby: ["ใส่ไอดีและเลือกประเทศด้านบน", "แตะเลนของม้าที่อยากเชียร์", "หลัง 3·2·1 GO! กดปุ่ม “วิ่ง! 🥕” รัว ๆ", "อันดับที่เข้าเส้นชัย 🏁 คือจำนวนหัวใจของประเทศคุณ"], how_catch: ["กด “เริ่มเลย”", "เลื่อนนิ้วซ้ายขวาเพื่อขยับยังมัล", "รับขนม 🦴🍖🥕 และหลบ 🍫🧅🍇 (45 วินาที)"], how_match: ["แตะการ์ดสองใบเพื่อเปิด", "ถ้ารูปเหมือนกันจะเปิดค้าง ถ้าไม่เหมือนจะปิดกลับ", "ยิ่งใช้ครั้งน้อย ยิ่งได้หัวใจเยอะ"],
  horses: ["🧦 ยังมัล", "⭐ ดาวระยิบ", "🍓 สตรอว์เบอร์รี", "❄️ เกล็ดหิมะ", "🌈 สายรุ้ง"],
  bad_food: "อุ๊ย อันนี้อันตรายต่อน้องหมานะ!" },
ja: { title: "ゲーム", intro: "ヒョンモ、ヤンマルと遊ぼう！ゲームの結果に応じて国にハートがたまり、毎週月曜日に国別メダルとして集計されます。",
  tab_catch: "🦴 おやつキャッチ", tab_match: "🃏 神経衰弱", tab_song: "🎵 イントロクイズ",
  start: "スタート", again: "もう一度", score: "スコア", best: "ベスト", time: "時間", moves: "めくった回数",
  catch_help: "指でヤンマルを左右に動かしておやつをキャッチ。🍫チョコ 🧅玉ねぎ 🍇ぶどうは犬に危ないのでよけてね！",
  catch_over: "おやつ {n} 点！", newbest: "自己ベスト！🎉", sent: "{flag} {country} に {n} 点をプラスしました",
  board_title: "国別おやつスコア", board_empty: "まだスコアがありません。一番乗りになろう！",
  match_help: "カードを2枚ずつめくって、同じ写真を見つけよう。", match_done: "{m} 回で全部見つけました！",
  song_help: "曲の最初を少し聴いてタイトルを当ててね。全5問です。", song_q: "{i}曲目、タイトルは？",
  replay: "▶ もう一度聴く", right: "正解！🎉", wrong: "おしい！正解は「{t}」", next: "次の問題", song_done: "5問中 {n} 問正解！",
  tab_derby: "🏇 モモダービー", derby_help: "応援する馬を選んで、スタートしたら「走れ！」ボタンを連打！順位が高いほど、あなたの国にハートがたまります！", pick: "応援する馬を選んでね", run: "走れ！🥕", me: "わたし", place: "{p}着！", derby_res: "{flag} {country} にハートを {n} 個送りました 💗", derby_nohearts: "ハートを送れませんでした。少ししてからもう一度どうぞ。", places: "1着 💗200 · 2着 💗140 · 3着 💗100 · 4着 💗60 · 5着 💗40", nick_label: "ID", nick_ph: "ゲームで使う名前", nick_need: "先にIDを入力してね 🙂", nick_bad: "このIDは使えません", country_label: "わたしの国", catch_reward: "おやつ4点ごとに 💗20（最大 💗200）", match_reward: "12回以内 💗200 · 16回以内 💗140 · 22回以内 💗100 · それ以上 💗60", left: "今日の残り：{n}/{max} ゲーム", limit_done: "今日の {max} ゲームはぜんぶ遊びました！また明日ね 🌙",
  how: "あそびかた", how_derby: ["上でIDを入力して国を選ぶ", "応援したい馬のレーンをタップ", "3·2·1 GO! のあと「走れ！🥕」を連打", "🏁 の順位に応じて国にハートが入る"], how_catch: ["「スタート」をタップ", "指を左右に動かしてヤンマルを動かす", "🦴🍖🥕 はキャッチ、🍫🧅🍇 はよける（45秒）"], how_match: ["カードを2枚タップしてめくる", "同じ写真ならそのまま、違えば裏に戻る", "少ない回数でそろえるほどハートが多い"],
  horses: ["🧦 ヤンマル号", "⭐ キラボシ", "🍓 イチゴ", "❄️ ユキ", "🌈 ニジ"],
  bad_food: "あっ、犬には危ない食べ物だよ！" },
zh: { title: "游戏", intro: "和炫模、袜子一起玩吧！游戏结果会为你的国家累积爱心，每周一结算成各国奖牌。",
  tab_catch: "🦴 接零食", tab_match: "🃏 翻牌配对", tab_song: "🎵 听歌猜名",
  start: "开始", again: "再玩一次", score: "分数", best: "最高", time: "时间", moves: "翻牌次数",
  catch_help: "用手指左右移动袜子来接零食。🍫巧克力 🧅洋葱 🍇葡萄对狗狗有危险，要躲开哦！",
  catch_over: "零食 {n} 分！", newbest: "新纪录！🎉", sent: "已为 {flag} {country} 加上 {n} 分",
  board_title: "各国零食分数", board_empty: "还没有分数，快来当第一名！",
  match_help: "每次翻两张牌，找出相同的照片。", match_done: "用了 {m} 次全部找到！",
  song_help: "听几秒歌曲开头，猜出歌名。共 5 题。", song_q: "第 {i} 首，歌名是？",
  replay: "▶ 再听一次", right: "答对了！🎉", wrong: "可惜！答案是「{t}」", next: "下一题", song_done: "5 题答对 {n} 题！",
  tab_derby: "🏇 炫模赛马", derby_help: "选一匹你要加油的马，开跑后快速连点「冲！」按钮。名次越高，你的国家就能得到越多爱心！", pick: "选择你的马", run: "冲！🥕", me: "我", place: "第 {p} 名！", derby_res: "已为 {flag} {country} 送出 {n} 颗爱心 💗", derby_nohearts: "爱心没送出去，请稍后再试。", places: "第1名 💗200 · 第2名 💗140 · 第3名 💗100 · 第4名 💗60 · 第5名 💗40", nick_label: "ID", nick_ph: "游戏里用的名字", nick_need: "请先填写ID 🙂", nick_bad: "这个ID不能使用", country_label: "我的国家", catch_reward: "每 4 分零食得 💗20（最多 💗200）", match_reward: "12次以内 💗200 · 16次以内 💗140 · 22次以内 💗100 · 更多 💗60", left: "今天剩余：{n}/{max} 局", limit_done: "今天的 {max} 局都玩完啦！明天见 🌙",
  how: "玩法说明", how_derby: ["在上方填写ID并选择国家", "点一下你要加油的马的赛道", "3·2·1 GO! 后快速连点「冲！🥕」", "到达 🏁 的名次决定你国家的爱心数"], how_catch: ["点「开始」", "手指左右滑动来移动袜子", "接住 🦴🍖🥕，躲开 🍫🧅🍇（45秒）"], how_match: ["点任意两张牌翻开", "相同照片会保持翻开，不同就翻回去", "用越少的次数找完，爱心越多"],
  horses: ["🧦 袜子号", "⭐ 小星星", "🍓 草莓", "❄️ 雪花", "🌈 彩虹"],
  bad_food: "哎呀，这对狗狗有危险！" },
fil: { title: "Laro", intro: "Makipaglaro kina Hyunmo at Yangmal! Nadadagdagan ng puso ang bansa mo ayon sa resulta, at tuwing Lunes ay nagiging medalya ito ng bawat bansa.",
  tab_catch: "🦴 Saluhin ang treats", tab_match: "🃏 Memory", tab_song: "🎵 Hulaan ang kanta",
  start: "Simulan", again: "Laro ulit", score: "Puntos", best: "Pinakamataas", time: "Oras", moves: "Bilang ng buklat",
  catch_help: "I-slide si Yangmal pakaliwa at pakanan para saluhin ang treats. Iwasan ang 🍫tsokolate, 🧅sibuyas at 🍇ubas — delikado sa aso!",
  catch_over: "{n} puntos ng treats!", newbest: "Bagong record! 🎉", sent: "Nadagdag ang {n} puntos sa {flag} {country}",
  board_title: "Treat points bawat bansa", board_empty: "Wala pang puntos. Ikaw na ang mauna!",
  match_help: "Bumuklat ng dalawang card at hanapin ang magkaparehong litrato.", match_done: "Nahanap lahat sa {m} buklat!",
  song_help: "Pakinggan ang ilang segundo ng kanta at piliin ang pamagat. 5 tanong.", song_q: "Kanta {i} — ano ang pamagat?",
  replay: "▶ Pakinggan ulit", right: "Tama! 🎉", wrong: "Sayang! Ang sagot ay “{t}”", next: "Susunod", song_done: "Tama ka sa {n} sa 5!",
  tab_derby: "🏇 Momo Derby", derby_help: "Pumili ng kabayong ichi-cheer, tapos pindutin nang mabilis ang “Takbo!”. Mas mataas ang puwesto, mas maraming puso para sa bansa mo!", pick: "Pumili ng kabayo", run: "Takbo! 🥕", me: "Ako", place: "Ika-{p}!", derby_res: "Nagpadala ng {n} puso sa {flag} {country} 💗", derby_nohearts: "Hindi naipadala ang puso. Subukan ulit mamaya.", places: "1st 💗200 · 2nd 💗140 · 3rd 💗100 · 4th 💗60 · 5th 💗40", nick_label: "ID", nick_ph: "Pangalan mo sa laro", nick_need: "Ilagay muna ang ID mo 🙂", nick_bad: "Hindi puwede ang ID na iyan", country_label: "Bansa ko", catch_reward: "💗20 bawat 4 treat points (hanggang 💗200)", match_reward: "≤12 buklat 💗200 · ≤16 💗140 · ≤22 💗100 · higit pa 💗60", left: "Natitirang laro ngayon: {n}/{max}", limit_done: "Nalaro mo na lahat ng {max} ngayon! Kita tayo bukas 🌙",
  how: "Paano maglaro", how_derby: ["Ilagay ang ID at piliin ang bansa sa itaas", "I-tap ang lane ng kabayong ichi-cheer mo", "Pagkatapos ng 3·2·1 GO!, pindutin nang mabilis ang “Takbo! 🥕”", "Ang puwesto mo sa 🏁 ang bilang ng puso ng bansa mo"], how_catch: ["I-tap ang “Simulan”", "I-slide ang daliri pakaliwa at pakanan para igalaw si Yangmal", "Saluhin ang 🦴🍖🥕, iwasan ang 🍫🧅🍇 (45 segundo)"], how_match: ["Mag-tap ng dalawang card para buklatin", "Kapag pareho, mananatiling bukas; kung hindi, babalik", "Mas kaunting buklat, mas maraming puso"],
  horses: ["🧦 Yangmal", "⭐ Kislap", "🍓 Strawberry", "❄️ Niyebe", "🌈 Bahaghari"],
  bad_food: "Naku, delikado iyan sa aso!" },
es: { title: "Juegos", intro: "¡Juega con Hyunmo y Yangmal! Tus resultados suman corazones a tu país, y cada lunes se convierten en medallas por país.",
  tab_catch: "🦴 Atrapa premios", tab_match: "🃏 Memoria", tab_song: "🎵 Adivina la canción",
  start: "Empezar", again: "Jugar otra vez", score: "Puntos", best: "Récord", time: "Tiempo", moves: "Intentos",
  catch_help: "Mueve a Yangmal a los lados para atrapar premios. ¡Esquiva 🍫chocolate, 🧅cebolla y 🍇uvas, que son peligrosos para perros!",
  catch_over: "¡{n} puntos de premios!", newbest: "¡Nuevo récord! 🎉", sent: "Sumaste {n} puntos a {flag} {country}",
  board_title: "Puntos de premios por país", board_empty: "Aún no hay puntos. ¡Sé la primera persona!",
  match_help: "Voltea dos cartas a la vez y encuentra las fotos iguales.", match_done: "¡Todas encontradas en {m} intentos!",
  song_help: "Escucha unos segundos y elige el título. 5 rondas.", song_q: "Canción {i}: ¿cuál es el título?",
  replay: "▶ Escuchar otra vez", right: "¡Correcto! 🎉", wrong: "¡Casi! Era «{t}»", next: "Siguiente", song_done: "¡Acertaste {n} de 5!",
  tab_derby: "🏇 Momo Derby", derby_help: "Elige un caballo y, al empezar, toca «¡Corre!» lo más rápido que puedas. ¡Cuanto mejor quedes, más corazones para tu país!", pick: "Elige tu caballo", run: "¡Corre! 🥕", me: "Yo", place: "¡{p}.º puesto!", derby_res: "Enviaste {n} corazones a {flag} {country} 💗", derby_nohearts: "No se pudieron enviar los corazones. Inténtalo en un momento.", places: "1.º 💗200 · 2.º 💗140 · 3.º 💗100 · 4.º 💗60 · 5.º 💗40", nick_label: "ID", nick_ph: "Tu nombre en los juegos", nick_need: "Primero escribe tu ID 🙂", nick_bad: "Ese ID no se puede usar", country_label: "Mi país", catch_reward: "💗20 por cada 4 puntos de premios (máx. 💗200)", match_reward: "≤12 intentos 💗200 · ≤16 💗140 · ≤22 💗100 · más 💗60", left: "Partidas de hoy: {n}/{max}", limit_done: "¡Ya jugaste las {max} partidas de hoy! Nos vemos mañana 🌙",
  how: "Cómo jugar", how_derby: ["Escribe tu ID y elige tu país arriba", "Toca el carril del caballo que quieras apoyar", "Tras 3·2·1 GO!, toca «¡Corre! 🥕» lo más rápido posible", "Tu puesto en 🏁 decide los corazones de tu país"], how_catch: ["Toca «Empezar»", "Desliza el dedo a los lados para mover a Yangmal", "Atrapa 🦴🍖🥕 y esquiva 🍫🧅🍇 (45 segundos)"], how_match: ["Toca dos cartas para voltearlas", "Si son iguales se quedan; si no, se vuelven a tapar", "Menos intentos, más corazones"],
  horses: ["🧦 Yangmal", "⭐ Estrellita", "🍓 Fresa", "❄️ Copo", "🌈 Arcoíris"],
  bad_food: "¡Uy, eso es peligroso para perros!" },
};

const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

// 하루에 할 수 있는 게임 판수 (모든 게임 합쳐서). 숫자만 바꾸면 돼요.
export const DAILY_LIMIT = 10;
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const plays = {
  left() { const s = (store.get("hm_plays") || "").split(":"); const used = s[0] === today() ? +s[1] || 0 : 0; return Math.max(0, DAILY_LIMIT - used); },
  use() { store.set("hm_plays", today() + ":" + (DAILY_LIMIT - this.left() + 1)); renderTop(); },
};
const leftText = () => { const t = g(), n = plays.left(); return n > 0 ? fmt(t.left, { n, max: DAILY_LIMIT }) : fmt(t.limit_done, { max: DAILY_LIMIT }); };
// 아이디 확인: 없으면 입력칸으로 안내하고 false
let nick = store.get("hm_gnick") || "";
function needNick() {
  const t = g(), v = $("g_nick").value.trim();
  if (!v) { $("g_nickmsg").textContent = t.nick_need; $("g_nick").focus(); return false; }
  if (C.checkText(v) || v.length > 20) { $("g_nickmsg").textContent = t.nick_bad; $("g_nick").focus(); return false; }
  nick = v; store.set("hm_gnick", v); $("g_nickmsg").textContent = ""; return true;
}
// 게임을 시작해도 되는지 (아이디 + 남은 판수) 확인하고, 되면 한 판을 써요
function canPlay() { if (!needNick()) return false; if (plays.left() <= 0) { renderTop(); return false; } plays.use(); return true; }
async function reward(game, n, detail) {
  const ok = await C.addHearts(n);
  C.logGame(nick, `${game} ${detail} → 💗${n}`);
  const t = g(), cc = C.getCountry();
  return ok ? fmt(t.derby_res, { n, flag: C.flagOf(cc), country: C.countryName(cc) }) : t.derby_nohearts;
}
function howTo(id, steps, show) {
  const box = $(id); if (!box) return;
  box.hidden = !show;
  box.querySelector("b").textContent = "📖 " + g().how;
  const ol = box.querySelector("ol"); ol.textContent = "";
  steps.forEach(s => { const li = document.createElement("li"); li.textContent = s; ol.appendChild(li); });
}
function renderTop() {
  if (!C) return;
  const t = g();
  $("g_nicklab").textContent = t.nick_label; $("g_nick").placeholder = t.nick_ph; $("g_fromlab").textContent = t.country_label;
  $("g_left").textContent = leftText(); $("g_left").classList.toggle("done", plays.left() <= 0);
  C.fillCountries($("g_from"), C.getCountry());
}

let C = null, tab = "derby", started = false;
const $ = id => document.getElementById(id);
const g = () => G[C.getLang()] || G.en;

export function startGames(ctx) {
  C = ctx;
  if (!started) {
    started = true;
    document.querySelectorAll("#games .gtabs button").forEach(b => b.addEventListener("click", () => { tab = b.dataset.g; stopAll(); render(); }));
    $("g_nick").value = nick || C.defaultNick() || "";
    $("g_nick").addEventListener("change", () => needNick());
    $("g_from").addEventListener("change", () => C.setCountry($("g_from").value));
    Catch.init(); Match.init(); Derby.init();
  }
  { const sv = store.get("hm_gtab"); tab = ["catch", "match", "derby"].includes(sv) ? sv : "derby"; }
  render();
}
export function stopGames() { if (C) stopAll(); }
export function langGames() { if (started) render(); }

function stopAll() { Catch.stop(); Derby.stop(); }
function render() {
  const t = g(); store.set("hm_gtab", tab);
  $("g_title").textContent = t.title; $("g_intro").textContent = t.intro;
  document.querySelectorAll("#games .gtabs button").forEach(b => { b.textContent = t["tab_" + b.dataset.g]; b.setAttribute("aria-pressed", b.dataset.g === tab); });
  ["derby", "catch", "match"].forEach(k => $("g_" + k).hidden = k !== tab);
  renderTop(); Catch.render(); Match.render(); Derby.render();
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
    if (running) return;
    if (!canPlay()) return;
    size(); running = true; over = false; items = []; pops = []; score = 0; lives = 3; t0 = performance.now(); lastSpawn = 0; x = tx = W / 2; last = t0;
    $("gc_over").hidden = true; $("gc_start").hidden = true; $("gc_how").hidden = true; hud();
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
    $("gc_over").hidden = false; $("gc_how").hidden = false; $("gc_start").textContent = t.again; $("gc_start").hidden = false;
    $("gc_res").textContent = fmt(t.catch_over, { n: score }) + (nb && score ? " " + t.newbest : "");
    $("gc_sent").textContent = "";
    if (nb && score) C.celebrate();
    const n = Math.max(20, Math.min(200, Math.round(score / 4) * 20));
    $("gc_sent").textContent = await reward("catch", n, score + "pt");
  }
  function render() {
    const t = g();
    $("gc_help").textContent = t.catch_help;
    if (!running) { $("gc_start").textContent = over ? t.again : t.start; $("gc_start").hidden = false; }
    $("gc_rw").textContent = t.catch_reward;
    howTo("gc_how", t.how_catch, !running);
    if (!$("g_catch").hidden) { size(); if (!running) draw(); }
    hud(running ? performance.now() - t0 : over ? DUR : 0);
  }
  return { init, stop, render };
})();

/* ---------- 2. 사진 짝 맞추기 ---------- */
const Match = (() => {
  let deck = [], open = [], done = new Set(), moves = 0, lock = false, t0 = 0, timer = 0, finished = false, paid = false;
  function init() { $("gm_start").addEventListener("click", deal); }
  function deal() {
    const pics = shuffle(C.photos).slice(0, 8);
    deck = shuffle([...pics, ...pics]).map((src, i) => ({ src, i }));
    open = []; done = new Set(); moves = 0; lock = false; finished = false; paid = false; t0 = 0; clearInterval(timer);
    $("gm_res").textContent = ""; $("gm_sent").textContent = ""; $("gm_how").hidden = false; build(); hud();
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
    if (!paid) { if (!canPlay()) return; paid = true; $("gm_how").hidden = true; }
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
  async function win() {
    finished = true; clearInterval(timer);
    const t = g(), best = +(store.get("hm_g_match") || 0), nb = !best || moves < best;
    if (nb) store.set("hm_g_match", moves);
    $("gm_res").textContent = fmt(t.match_done, { m: moves }) + (nb ? " " + t.newbest : "");
    $("gm_start").textContent = t.again; hud(); C.celebrate(); $("gm_how").hidden = false;
    const n = moves <= 12 ? 200 : moves <= 16 ? 140 : moves <= 22 ? 100 : 60;
    $("gm_sent").textContent = await reward("match", n, moves + " moves");
  }
  function hud() {
    const t = g(), s = t0 ? Math.floor(((finished ? Date.now() : Date.now()) - t0) / 1000) : 0;
    $("gm_moves").textContent = `${t.moves} ${moves}`;
    $("gm_time").textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $("gm_best").textContent = `${t.best} ${store.get("hm_g_match") || "-"}`;
    if (finished) clearInterval(timer);
  }
  function render() {
    const t = g(); $("gm_help").textContent = t.match_help; $("gm_rw").textContent = t.match_reward;
    howTo("gm_how", t.how_match, !t0 || finished);
    $("gm_start").textContent = finished ? t.again : (deck.length ? t.again : t.start);
    if (!deck.length) deal(); else hud();
  }
  return { init, render };
})();

/* ---------- 3. 모모 더비 (경마) ---------- */
const Derby = (() => {
  const hname = h => (g().horses || G.en.horses)[h.k];
  const N = 5, REWARD = [200, 140, 100, 60, 40], COLORS = ["#E57373", "#64B5F6", "#81C784", "#FFB74D", "#BA68C8"];
  let horses = [], mine = -1, state = "pick", raf = 0, last = 0, boost = 0, finish = [], cd = 0, sent = "";
  function init() {
    $("gd_run").addEventListener("pointerdown", e => { e.preventDefault(); tap(); });
    addEventListener("keydown", e => { if (state === "race" && tab === "derby" && !$("games").hidden && (e.key === " " || e.key === "Enter")) { e.preventDefault(); tap(); } });
    $("gd_again").addEventListener("click", () => { state = "pick"; mine = -1; sent = ""; setup(); render(); });
    setup();
  }
  function setup() {
    // 말 이름은 언어에 맞게 그때그때 바꿔 보여줘요 (k = 이름 번호)
    horses = shuffle([0, 1, 2, 3, 4]).map((k, i) => ({ k, c: COLORS[i], x: 0, v: 0, base: 8.6 + Math.random() * 1.6, wob: Math.random() * 6, done: 0 }));
    finish = []; boost = 0;
    const tr = $("gd_track"); tr.textContent = "";
    horses.forEach((h, i) => {
      const lane = document.createElement("button"); lane.type = "button"; lane.className = "dlane"; lane.style.setProperty("--c", h.c);
      lane.innerHTML = `<span class="dnum">${i + 1}</span><span class="dname"></span><span class="dhorse"><span>🏇</span></span><span class="dflag">🏁</span>`;
      lane.addEventListener("click", () => { if (state === "pick" && canPlay()) { mine = i; countdown(); } });
      tr.appendChild(lane);
    });
    draw();
  }
  function countdown() {
    state = "count"; cd = 3; render();
    const step = () => {
      $("gd_msg").textContent = cd > 0 ? String(cd) : "GO!";
      if (cd-- > 0) setTimeout(step, 700); else { state = "race"; last = performance.now(); render(); raf = requestAnimationFrame(loop); }
    };
    step();
  }
  function tap() {
    if (state !== "race") return;
    boost = Math.min(13, boost + 1.35);
    const hb = document.querySelectorAll("#gd_track .dhorse")[mine]; if (hb) { hb.classList.remove("kick"); void hb.offsetWidth; hb.classList.add("kick"); }
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    boost *= Math.exp(-1.5 * dt);
    horses.forEach((h, i) => {
      if (h.done) return;
      if (i === mine) h.v = 4.5 + boost;
      else { h.wob += dt * (1 + Math.random()); h.v = h.base + Math.sin(h.wob) * 1.6 + (Math.random() - .5) * 2; }
      h.x = Math.min(100, h.x + h.v * dt);
      if (h.x >= 100) { h.done = finish.length + 1; finish.push(i); }
    });
    draw();
    if (finish.includes(mine)) return end();
    raf = requestAnimationFrame(loop);
  }
  function draw() {
    document.querySelectorAll("#gd_track .dlane").forEach((el, i) => {
      const h = horses[i]; if (!h) return;
      el.style.setProperty("--x", h.x / 100);
      el.classList.toggle("mine", i === mine);
      el.classList.toggle("run", state === "race" && !h.done);
      el.disabled = state !== "pick";
    });
  }
  async function end() {
    cancelAnimationFrame(raf);
    // 나머지 말들은 남은 거리 순서로 등수를 정해요
    horses.map((h, i) => [i, h.x]).filter(([i]) => !finish.includes(i)).sort((a, b) => b[1] - a[1]).forEach(([i]) => { horses[i].done = finish.length + 1; finish.push(i); });
    state = "done"; draw();
    const place = horses[mine].done, n = REWARD[place - 1] || 1;
    sent = "";
    render();
    if (place === 1) C.celebrate();
    sent = await reward("derby", n, "#" + place);
    render();
  }
  function stop() { cancelAnimationFrame(raf); if (state === "race" || state === "count") { state = "pick"; mine = -1; setup(); } }
  function render() {
    const t = g();
    $("gd_help").textContent = t.derby_help; $("gd_places").textContent = t.places;
    howTo("gd_how", t.how_derby, state === "pick" || state === "done");
    $("gd_run").textContent = t.run; $("gd_run").hidden = state !== "race";
    $("gd_again").textContent = t.again; $("gd_again").hidden = state !== "done";
    if (state === "pick") $("gd_msg").textContent = plays.left() > 0 ? "👇 " + t.pick : "🌙";
    if (state === "race") $("gd_msg").textContent = "GO! 🏇";
    if (state === "done") {
      const order = finish.map((i, k) => `${k + 1}. ${hname(horses[i])}${i === mine ? " (" + t.me + ")" : ""}`).join("   ");
      $("gd_msg").textContent = "🏆 " + fmt(t.place, { p: horses[mine].done });
      $("gd_res").textContent = order; $("gd_sent").textContent = sent;
    } else { $("gd_res").textContent = ""; $("gd_sent").textContent = ""; }
    document.querySelectorAll("#gd_track .dlane").forEach((el, i) => { if (horses[i]) { el.querySelector(".dname").textContent = hname(horses[i]); el.setAttribute("aria-label", hname(horses[i])); } });
    draw();
  }
  return { init, stop, render };
})();
