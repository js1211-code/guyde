/**
 * 랜덤 닉네임 생성 (F-03) — `[형용사] [동물] #[4자리]`
 *
 * 어휘 규칙: 긍정·중립만 쓴다. 외모·능력을 비하하는 단어는 넣지 말 것.
 * 이 앱의 컨셉이 "안전지대"라서, 닉네임이 사람을 깎으면 컨셉이 무너진다.
 */

const ADJECTIVES = [
  "부지런한", "다정한", "든든한", "성실한", "차분한", "꼼꼼한",
  "느긋한", "상냥한", "슬기로운", "씩씩한", "정직한", "친절한",
  "침착한", "쾌활한", "편안한", "한결같은", "활기찬", "훈훈한",
  "다부진", "너그러운", "담백한", "산뜻한", "소탈한", "야무진",
];

const ANIMALS = [
  "판다", "수달", "고래", "부엉이", "사슴", "여우",
  "너구리", "다람쥐", "물개", "알파카", "코알라", "펭귄",
  "하마", "햄스터", "호랑이", "두더지", "라쿤", "미어캣",
  "얼룩말", "앵무새", "청설모", "고슴도치", "바다거북", "돌고래",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** 1000~9999 */
function randomTag(): number {
  return 1000 + Math.floor(Math.random() * 9000);
}

/** "부지런한 판다 #3901" */
export function generateNickname(): string {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)} #${randomTag()}`;
}

/**
 * 이미 있는 닉네임이면 숫자만 다시 뽑는다(형용사·동물은 유지).
 * 충돌 시 재시도는 호출부에서 unique 위반을 잡아 처리한다.
 */
export function reroll(nickname: string): string {
  const base = nickname.replace(/\s*#\d+$/, "");
  return `${base} #${randomTag()}`;
}

export const NICKNAME_POOL_SIZE = ADJECTIVES.length * ANIMALS.length;
