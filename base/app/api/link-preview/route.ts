import { fail, ok } from "@/lib/api/http";
import { looksLikeUrl } from "@/lib/constants";

/**
 * 링크 미리보기 — 붙여넣은 주소의 OG 태그를 읽어 카드로 돌려준다.
 *
 * ⚠️ 먼저 알아둘 것: **국내 커머스는 대부분 안 나온다.**
 *   무신사는 200을 주면서 제목이 비어 있고, 29cm는 사이트 공통 문구만,
 *   쿠팡은 403, 크림은 500, 네이버는 429다. 상품 정보가 자바스크립트로
 *   그려지는 SPA라서 서버가 받는 HTML에는 애초에 상품이 없다.
 *   AI가 못 알아보는 게 아니라 페이지 내용이 서버까지 도달하지 않는다.
 *
 *   그래서 이 엔드포인트는 **못 읽는 걸 정상으로 취급한다.** 실패를 오류로
 *   올리면 링크를 붙여넣을 때마다 빨간 문구가 뜨는데, 정작 고수가 잘못한
 *   건 없다. found:false로 조용히 돌려주고 화면은 아무것도 안 그린다.
 *
 * 서버에서만 가져온다. 브라우저에서 직접 부르면 CORS에 막히고, 무엇보다
 * 사용자 IP가 그 쇼핑몰에 그대로 찍힌다.
 */

/** 페이지가 안 끝나도 이만큼에서 끊는다. 붙여넣을 때마다 기다릴 수는 없다. */
const TIMEOUT_MS = 4000;
/** OG 태그는 <head>에 있다. 본문까지 다 받을 이유가 없다. */
const MAX_BYTES = 256 * 1024;

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!raw) return fail("URL_REQUIRED", 400);
  if (!looksLikeUrl(raw)) return fail("INVALID_URL", 400);

  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let target: URL;
  try {
    target = new URL(href);
  } catch {
    return fail("INVALID_URL", 400);
  }

  // 사내망·로컬 주소로 요청을 대신 쏘게 만드는 SSRF를 막는다.
  // 고수가 붙여넣는 건 쇼핑몰 주소라서, 막아서 잃는 게 없다.
  if (!isPublicHost(target.hostname)) return fail("INVALID_URL", 400);

  const html = await fetchHead(target.toString());
  if (!html) return ok({ found: false });

  const meta = parseOg(html, target);
  // 제목조차 없으면 카드로 그릴 게 없다. 빈 카드를 보여주면
  // "미리보기가 고장났나"로 읽힌다.
  if (!meta.title) return ok({ found: false });

  return ok({ found: true, ...meta });
}

/** 사설망·루프백을 걸러낸다. 문자열 검사라 DNS 리바인딩까지는 못 막는다. */
function isPublicHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "[::1]" || host === "::1") return false;
  if (/^0\./.test(host)) return false;
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^169\.254\./.test(host)) return false;
  return true;
}

async function fetchHead(url: string): Promise<string | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: abort.signal,
      redirect: "follow",
      headers: {
        // 봇으로 보이면 빈 페이지를 주는 사이트가 있다. 브라우저처럼 요청한다.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!res.ok) return null;
    if (!res.headers.get("content-type")?.includes("text/html")) return null;

    // 통째로 읽지 않는다. 상품 목록 페이지는 몇 MB씩 나온다.
    const reader = res.body?.getReader();
    if (!reader) return null;

    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    // 다 안 읽고 끊으면 연결이 남는다.
    await reader.cancel().catch(() => {});

    const buf = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      buf.set(c.subarray(0, Math.min(c.length, size - at)), at);
      at += c.length;
    }
    return new TextDecoder("utf-8").decode(buf);
  } catch {
    // 타임아웃·DNS 실패·연결 거부 전부 "못 읽었다" 하나로 취급한다.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** og:* 를 먼저 보고, 없으면 <title>·description으로 물러선다. */
function parseOg(html: string, base: URL) {
  const pick = (prop: string) => {
    // property="og:title" 과 name="og:title" 둘 다 쓰인다.
    // 속성 순서도 사이트마다 달라서 양쪽 배치를 다 본다.
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]?.trim()) return decodeEntities(m[1].trim());
    }
    return null;
  };

  const title =
    pick("og:title") ??
    decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "") ??
    null;

  const image = pick("og:image");

  return {
    title: title || null,
    description: pick("og:description") ?? pick("description"),
    site: pick("og:site_name") ?? base.hostname.replace(/^www\./, ""),
    // 상대 경로로 준 사이트가 있다. 절대 주소로 바꿔야 <img>가 뜬다.
    image: image ? safeAbsolute(image, base) : null,
  };
}

function safeAbsolute(src: string, base: URL): string | null {
  try {
    const u = new URL(src, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** OG 값에 자주 섞이는 몇 개만 푼다. 전체 엔티티 표는 필요 없다. */
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
