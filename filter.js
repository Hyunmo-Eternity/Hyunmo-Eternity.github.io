// 글 필터: 욕설 · 정치 이야기 · 광고를 막아요.
// 단어를 더 막고 싶으면 아래 목록에 따옴표로 감싸서 추가하세요. (대소문자 구분 없음)

// 띄어쓰기·기호를 빼고 비교하는 단어 (한글·태국어·일본어·중국어 등)
const WORDS = [
  // 욕설 (한국어)
  "씨발", "시발", "씨바", "시바새", "ㅅㅂ", "ㅆㅂ", "ㅅ1ㅂ", "병신", "븅신", "ㅂㅅ", "개새끼", "개새기", "개색기", "개세끼", "새끼",
  "좆", "존나", "졸라", "ㅈㄴ", "지랄", "ㅈㄹ", "미친놈", "미친년", "미친새", "닥쳐", "꺼져", "엿먹", "느금", "니애미", "니애비", "애미없", "애비없",
  "창녀", "걸레년", "보지", "자지", "섹스", "쌍놈", "쌍년", "등신", "찐따", "한남충", "김치녀", "틀딱", "급식충", "죽어라", "뒤져", "뒈져",
  // 욕설 (태국어 · 일본어 · 중국어)
  "ควย", "เหี้ย", "สัส", "เย็ด", "ส้นตีน", "ไอ้สัตว์", "อีดอก",
  "死ね", "しね", "殺す", "ころす", "クソ野郎", "きもい", "キモい", "うざい",
  "傻逼", "傻b", "操你", "他妈的", "妈的", "草泥马", "婊子", "去死", "贱人", "脑残",
  // 정치 (한국 · 공통)
  "대통령", "탄핵", "선거", "국회의원", "민주당", "국민의힘", "정의당", "조국혁신당", "개혁신당", "진보당", "좌파", "우파", "좌빨", "빨갱이",
  "수꼴", "토착왜구", "일베", "메갈", "윤석열", "이재명", "문재인", "박근혜", "한동훈", "김정은", "북한", "정권", "정치",
  "政治", "总统", "选举", "共产党", "习近平", "台独", "การเมือง", "นายก", "เลือกตั้ง", "選挙", "首相", "政権",
  // 광고 · 사기
  "카톡", "카카오톡", "오픈채팅", "오픈톡", "텔레그램", "라인아이디", "디엠주", "dm주", "부업", "재택알바", "고수익", "수익보장", "대출", "리딩방", "코인투자", "코인리딩", "조건만남", "출장안마",
  "토토", "카지노", "바카라", "슬롯", "도박", "먹튀", "할인코드", "쿠폰", "맞팔", "선팔", "조건만남", 
  "加微信", "微信号", "赚钱", "博彩", "ไลน์ไอดี", "แอดไลน์", "พนัน", "บาคาร่า",
];

// 영어 · 필리핀어 · 스페인어처럼 단어 단위로 비교하는 말 (다른 단어 속에 들어간 경우는 괜찮아요)
const LATIN = [
  // 욕설
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "bastard", "asshole", "cunt", "dick", "pussy", "slut", "whore", "retard", "nigger", "nigga", "faggot", "stfu", "wtf",
  "putangina", "tangina", "puta", "gago", "ulol", "tarantado", "pakyu", "bwisit",
  "mierda", "pendejo", "pendeja", "cabron", "cabrón", "joder", "coño", "gilipollas", "verga", "chinga", "chingada",
  // 정치
  "politics", "political", "election", "president", "democrat", "democrats", "republican", "republicans", "liberal", "conservative", "maga", "trump", "biden",
  "duterte", "eleccion", "elección", "presidente", "politica", "política", "halalan", "pulitika",
  // 광고 · 사기
  "telegram", "whatsapp", "wechat", "kakaotalk", "line id", "dm me", "check my", "follow me", "follow back", "promo", "promo code", "discount", "coupon", "giveaway",
  "casino", "betting", "bet365", "crypto", "bitcoin", "forex", "investment", "earn money", "make money", "onlyfans", "nsfw", "18+", "sugar daddy",
];

// 링크 · 전화번호 · SNS 아이디
const PATTERNS = [
  /https?:\/\//i, /www\./i, /\b[a-z0-9-]+\.(com|net|org|kr|io|ly|me|co|xyz|shop|site|link|app|gg|tv|top|info|biz)\b/i,
  /t\.me\//i, /open\.kakao/i, /bit\.ly/i,
  /\+?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{4}/,          // 전화번호
  /(^|\s)@(?!(hyunmo|whyunmo|hyunmomo)\b)[a-z0-9_.]{3,}/i,   // @아이디 (현모 계정은 괜찮아요)
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,       // 이메일
];

const norm = s => String(s).toLowerCase().normalize("NFKC")
  .replace(/[\s​._\-~!@#$%^&*()+=|\\/:;"'<>,.?`·ㆍ*0-9]+/g, "")
  .replace(/1/g, "");
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LATIN_RE = new RegExp("(^|[^\\p{L}])(" + LATIN.map(esc).join("|") + ")(?=$|[^\\p{L}])", "iu");

// 문제가 없으면 null, 걸리면 "bad"를 돌려줘요.
export function checkText(...texts) {
  for (const raw of texts) {
    if (!raw) continue;
    const s = String(raw);
    if (PATTERNS.some(re => re.test(s))) return "bad";
    if (LATIN_RE.test(s.normalize("NFKC"))) return "bad";
    const n = norm(s);
    if (WORDS.some(w => n.includes(norm(w)))) return "bad";
    // 같은 글자 반복 도배 (예: ㅋㅋㅋ는 괜찮고, 같은 글자 30번 이상은 막아요)
    if (/(.)\1{29,}/u.test(s)) return "bad";
  }
  return null;
}
