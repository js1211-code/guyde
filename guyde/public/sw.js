/*
  서비스 워커 — 설치형 PWA 요건을 채우고, 네트워크가 끊겼을 때만 캐시를 쓴다.

  ⚠️ 캐시 우선(cache-first)으로 만들면 안 된다. 이 앱은 글·댓글·온도가 계속
  바뀌는데 캐시를 먼저 주면 몇 시간 전 화면이 계속 보이고, 사용자는 앱이
  고장 났다고 생각한다. 그래서 항상 네트워크를 먼저 치고, 실패할 때만
  캐시로 떨어진다.

  API 응답은 캐시하지 않는다. 남의 기기에서 만든 응답이 남아 있으면
  신원이 섞여 보일 수 있고, 어차피 오프라인에서 쓸모도 없다.
*/
const CACHE = "guyde-v1";

self.addEventListener("install", (e) => {
  // 새 워커를 즉시 활성화한다. 안 그러면 다음 방문까지 옛 워커가 남는다.
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/"])));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부 이미지 등은 그대로 둔다
  if (url.pathname.startsWith("/api/")) return;    // 응답에 신원이 섞일 수 있다

  e.respondWith(
    fetch(request)
      .then((res) => {
        // 성공한 응답만 다음 오프라인을 위해 넣어둔다.
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? caches.match("/"))),
  );
});
