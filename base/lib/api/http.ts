/**
 * Route Handler 공통 유틸 — 헤더 인증(F-04)과 응답 형식.
 *
 * 신원은 오직 `X-Device-Id` 헤더뿐이다. 세션·JWT·쿠키를 읽지 않는다.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 헤더에서 device_id를 꺼낸다. 없거나 UUID 형식이 아니면 null. */
export function getDeviceId(req: Request): string | null {
  const raw = req.headers.get("x-device-id");
  if (!raw || !UUID_RE.test(raw)) return null;
  return raw.toLowerCase();
}

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function fail(code: string, status: number, detail?: string) {
  return Response.json({ error: code, detail }, { status });
}

/** 헤더 없는 요청은 전부 여기서 끊는다. */
export const deviceRequired = () =>
  fail("DEVICE_ID_REQUIRED", 401, "X-Device-Id 헤더가 필요합니다");

/**
 * DB 함수·트리거가 던지는 예외를 HTTP 상태로 옮긴다.
 * 규칙을 DB에 박아뒀기 때문에(트리거·CHECK) 여기서는 번역만 한다.
 */
const ERROR_STATUS: Record<string, number> = {
  INSUFFICIENT_HEARTS: 402,
  SELF_LIKE_NOT_ALLOWED: 403,
  LIKE_NOT_ALLOWED_FOR_POST_TYPE: 400,
  POLL_OPTIONS_OUT_OF_RANGE: 400,
  POLL_OPTIONS_NOT_ALLOWED: 400,
  USER_NOT_FOUND: 404,
};

export function fromDbError(message: string | undefined) {
  const code = Object.keys(ERROR_STATUS).find((k) => message?.includes(k));
  if (code) return fail(code, ERROR_STATUS[code]);
  return fail("DB_ERROR", 500, message);
}
