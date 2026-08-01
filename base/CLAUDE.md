# CLAUDE.md — BASE 개발 지침 (v1.1)

> 🚨 **동시 수정 규칙 — 이 문서에서 가장 먼저 읽을 것**
> 이 파일과 Notion "개발 지침 (Claude Code용) — CLAUDE.md" 페이지는 **항상 내용이 완전히 같아야 한다.**
> 어느 한쪽을 고쳤으면 **그 작업을 끝내기 전에 반드시 반대쪽도 똑같이 고친다.** "나중에 반영"은 금지.
> 한쪽만 고치면 Claude Code가 옛 내용을 읽고 작업해서 사고가 난다 — 실제로 환경변수 이름이 어긋나 개발 서버가 죽은 적이 있다.
> Notion이 원본(master), 이 파일이 사본. 내용이 갈리면 Notion 기준으로 맞춘다.

> 이 파일은 Claude Code가 이 저장소에서 작업할 때 자동으로 읽는 컨텍스트 문서다.
> v1.1: DB 재검증 결과 반영(스키마 패치, 데이터 접근 규칙 신설, 키 이름 최신화).

## 프로젝트 개요
- 제품: BASE(베이스) — 익명으로 자기관리 질문을 올리면 대중이 검증한 "무난함"을 돌려받는 남성 자기관리 커뮤니티 웹앱.
- 태그라인: 일단, 베이스부터.
- 포지션: 안티-동경. "멋져져"가 아니라 "안 망해". 판단자는 전문가가 아니라 대중.
- 맥락: 해커톤 데모. 솔로 개발, 1주.
- 핵심 지표(NSM): 답변 받은 글 비율(= 커뮤니티 유동성).

## 기술 스택 (고정 — 함부로 바꾸지 말 것)
- 프레임워크: Next.js 16 (App Router) + TypeScript
- UI: Tailwind CSS + shadcn/ui
- 데이터/백엔드: Supabase (PostgreSQL, Auth, Realtime, Storage), RLS 켜짐
- 클라이언트 DB 접근: @supabase/supabase-js + @supabase/ssr
- 서버 로직: Next.js Route Handlers
- 클라이언트 상태/패칭: TanStack Query
- 결제: 토스페이먼츠 샌드박스(테스트 모드)
- 배포: Vercel + Supabase Cloud

## 실행 명령
- 개발 서버: `npm run dev` (http://localhost:3000)
- 빌드: `npm run build`
- 린트: `npm run lint`

## 코딩 컨벤션
- 모든 코드 TypeScript. `any` 지양.
- App Router: 서버 컴포넌트 기본, 상호작용 필요할 때만 파일 상단에 `"use client"`.
- 스타일은 Tailwind 유틸 우선, 공용 UI는 shadcn/ui 사용(새로 만들기 전에 있는지 확인).
- 폴더: 라우트 `app/`, 공용 로직·supabase 클라이언트 `lib/`, 재사용 컴포넌트 `components/`, DB 스키마·패치 SQL `db/`.
- 네이밍: 파일 kebab-case, 컴포넌트 PascalCase, 변수/함수 camelCase, DB 컬럼 snake_case(스키마 그대로).
- 작은 단위로 자주 커밋. 새 라이브러리는 꼭 필요할 때만 추가하고 이 문서에 기록.

## 보안 규칙 (중요)
- RLS 켜져 있음. 정책 없는 테이블은 클라이언트(anon 키)에서 빈 결과가 정상. 기능을 만들 때 해당 테이블의 RLS 정책도 함께 추가한다.
- **RLS 정책 안에서 users를 서브쿼리로 직접 조회하지 말 것** — users의 RLS에 막혀 항상 0행이 된다. 반드시 `current_user_id()` 헬퍼 함수(security definer, 이미 DB에 있음)를 쓴다.
- 서버 전용 키는 절대 브라우저/클라이언트에 노출 금지. 서버(Route Handler)에서만 사용.
- 환경변수(.env.local):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (신형 키, sb_publishable_...; 구 anon key에 해당)
  - `SUPABASE_SECRET_KEY` (신형 서버 전용 키, sb_secret_...; 구 service_role에 해당. `NEXT_PUBLIC_` 접두사 금지)
- **환경변수 이름을 바꾸면 3곳을 반드시 함께 바꿈:** `.env.local` · `lib/supabase/*.ts`(client·server·admin) · 이 문서(+ Notion 페이지). 그리고 **dev 서버를 재시작**한다 — 환경변수는 HMR로 반영되지 않는다. 한 곳이라도 빠지면 값이 `undefined`로 들어가고, `process.env.X!`의 `!`는 런타임 검사가 아니라 타입 단언일 뿐이라 빌드는 통과한 채 서버 컴포넌트가 "Your project's URL and Key are required"로 죽는다.

## 데이터베이스 (14 테이블 + 뷰 2)
전체 DDL(v1.0) + v1.1 패치는 Notion "기술 스택" 페이지와 `db/` 폴더 참고. Supabase에 적용 완료 기준:
- users — nickname(unique), real_name, is_expert, temperature(36.5 시작), grade, heart_balance(>=0 CHECK)
- posts — 익명 질문 글, category, post_type(normal|dday), status(open|answered|closed), **best_comment_id**(베스트답변, 댓글 삭제 시 자동 null)
- **post_images** — 글 사진(Storage URL, sort_order)
- poll_options / votes — 선택지 투표. 1인 1투표 unique + **교차 글 투표 차단 복합 FK**
- comments / comment_votes — 댓글(실명+온도), 추천. **upvotes는 트리거 자동 관리**
- heart_transactions — 하트 원장(append-only)
- reputation_events — 온도 변동 원장
- quiz_results — 유형테스트 결과(JSONB)
- expert_services / bookings / reviews — 고수 상품 / 거래·에스크로 상태머신(상태값 CHECK) / 후기
- reports — 신고
- 뷰: **posts_feed**(author_id 제거된 공개 피드), **profiles_public**(auth_id·heart_balance 제거된 공개 프로필)

설계 원칙: (1) 정체성 비대칭(질문=익명, 답변/고수=실명+온도) (2) 하트·온도는 원장(ledger)+캐시값 (3) 에스크로는 bookings.status 상태머신.

## 데이터 접근 규칙 (앱 코드가 반드시 지킬 것)
1. **피드 읽기는 `posts_feed` 뷰로만.** posts 테이블 직접 select는 RLS 때문에 "내 글"만 나온다(익명성 보장 장치 — 버그 아님).
2. **프로필 읽기는 `profiles_public` 뷰로만.** users 직접 select는 본인 행만 나온다(하트 잔액 UI용).
3. **하트 증감은 `spend_hearts(user, amount, reason, ref)` / `earn_hearts(...)` DB 함수로만.** 서버(Route Handler)에서 호출한다 — 클라이언트는 실행 권한이 없다. users.heart_balance를 직접 update 금지.
4. **comments.upvotes 직접 update 금지** — comment_votes 삽입/삭제 시 트리거가 자동 반영.
5. 글 작성(하트 차감 동반)은 서버 Route Handler에서 처리(트랜잭션: spend_hearts + posts insert).
6. Supabase 어드바이저의 "security definer view" 경고(posts_feed, profiles_public)는 의도된 설계이므로 무시.

## 인증 규칙
- **기본은 로그인 필수.** 모든 기능은 로그인한 사용자 기준으로 설계한다. 주 경로는 카카오(구글·이메일도 활성화되어 있음).
- **익명 세션은 데모 전용.** 발표 중 관객이 로그인 없이 투표하는 용도로만 쓴다. `NEXT_PUBLIC_DEMO_MODE=true`일 때만 앱이 `signInAnonymously()`를 호출하고, 평상시에는 미로그인 사용자를 로그인 페이지로 보낸다.
- **익명 유저도 `authenticated` 롤이다.** 롤만으로는 정식 로그인 사용자와 구분되지 않는다. RLS에서 구분하려면 JWT 클레임을 쓴다: `(auth.jwt() ->> 'is_anonymous')::boolean`. 익명에게는 **투표만 허용**하고 글 작성·댓글·하트 획득은 막는다.
- **익명 → 카카오 계정 승격(`linkIdentity`)은 스코프 밖.** 익명 세션 데이터는 데모용 일회성이며 이어붙이지 않는다.
- ⚠️ **auth.users → public.users 자동 생성 장치가 아직 없다(미구현).** 로그인해도 `public.users` 행이 생기지 않으며, `posts.author_id`가 `users(id)`를 참조하므로 그 상태로는 글·투표가 전부 실패한다. 트리거 또는 첫 로그인 시 앱 로직으로 반드시 만들 것.

## 핵심 도메인 규칙
- 열람 무료, 글 작성에 하트 소비. 하트 획득 = 가입보너스 / 광고시청(데모는 목 버튼) / 구매.
- 온도(36.5 시작): 답변 추천·후기로 상승, 비활동 시 하락. 고수 자격 = 온도 상위 X% (percent_rank).
- 무료 기여 끊으면 온도 하락 → 고수 자격 상실(무료 커뮤니티 공동화 방지).
- 베스트답변: 질문자가 채택 → posts.best_comment_id + reputation_events('best_answer').

## 기능 우선순위 (이 순서로 구현)
1. 핵심 루프 — 익명 글 작성(+사진) → 피드(posts_feed) → 선택지 투표(+Realtime) → 댓글. (최우선, 완전 동작)
2. 온도/등급 평판 — 추천·베스트답변·후기 → reputation_events → 온도 갱신.
3. 하트 경제 — spend/earn 함수 연동, 글쓰기 차감, 광고 목 버튼 지급.
4. 바이럴 유형테스트 — 문항 → 결과 저장 → 상위 %.
5. 고수 컨설팅 매칭 + 결제 — 예약 플로우 + 토스 샌드박스, 에스크로는 상태 전이만.

## 하지 말 것 (스코프 밖)
- 실제 결제/정산(테스트 모드만), 네이티브 앱, 여성 타겟/매칭앱, 무관심층 교육 기능.
- 스택 임의 교체, 불필요한 라이브러리 추가.
- 열람/작성 중 광고 삽입(UX 방해).
