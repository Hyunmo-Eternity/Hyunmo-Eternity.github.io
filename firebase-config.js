// ① Firebase 콘솔 → 프로젝트 설정 → "내 앱"에서 웹 앱을 등록하면 나오는 값을 그대로 붙여넣으세요.
//    (이 값들은 공개되어도 괜찮은 값이에요. 보안은 firestore.rules가 지켜줘요.)
export const firebaseConfig = {
  apiKey: "여기에_붙여넣기",
  authDomain: "여기에_붙여넣기.firebaseapp.com",
  projectId: "여기에_붙여넣기",
  storageBucket: "여기에_붙여넣기.appspot.com",
  messagingSenderId: "여기에_붙여넣기",
  appId: "여기에_붙여넣기"
};

// ② 라이브 버튼을 눌렀을 때 기본으로 들어갈 틱톡 라이브 주소
export const DEFAULT_LIVE_URL = "https://www.tiktok.com/@hyunmomo/live";
