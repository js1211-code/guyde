/**
 * created_at은 서버에서 ISO 문자열로 온다. 화면에는 "8분 전"처럼 보여야 한다.
 * 하루가 넘어가면 상대 시간이 오히려 읽기 어려워서 날짜로 바꾼다.
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "방금";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  const d = new Date(then);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * 투표가 닫히기까지 남은 시간. 이미 지났으면 null.
 *
 * 분 단위로는 안 쓴다 — 72시간짜리 투표에서 "3시간 12분 남음"은 그 정밀도가
 * 아무 결정도 바꾸지 않는데 매분 다시 그려야 한다. 한 시간 미만만 분으로 준다.
 */
export function timeLeft(iso: string): string | null {
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;

  const ms = end - Date.now();
  if (ms <= 0) return null;

  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}일 남음`;
  if (hours >= 1) return `${hours}시간 남음`;
  return `${Math.max(1, Math.floor(ms / 60_000))}분 남음`;
}
