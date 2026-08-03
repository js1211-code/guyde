# CLAUDE.md — BASE 개발 지침 (v2.1)

> 🚨 **동시 수정 규칙 — 이 문서에서 가장 먼저 읽을 것**
> 이 파일과 Notion "개발 지침 (Claude Code용) — CLAUDE.md" 페이지는 **항상 내용이 완전히 같아야 한다.**
> 어느 한쪽을 고쳤으면 **그 작업을 끝내기 전에 반드시 반대쪽도 똑같이 고친다.** "나중에 반영"은 금지.
> 한쪽만 고치면 Claude Code가 옛 내용을 읽고 작업해서 사고가 난다 — 실제로 환경변수 이름이 어긋나 개발 서버가 죽은 적이 있다.
> Notion이 원본(master), 이 파일이 사본. 내용이 갈리면 Notion 기준으로 맞춘다.

> 이 파일은 Claude Code가 이 저장소에서 작업할 때 자동으로 읽는 컨텍스트 문서다.
> **v2.1 (2026-08-03)**: 디자인 v3 구현 + 백엔드 연결 결과 반영. 온도 산식·하트 정책이 확정됐고, 카테고리에 '헤어'가 추가됐다.

## 프로젝트 개요
- 제품: BASE(베이스) — 자기관리 질문을 올리면 대중이 검증한 "무난함"을 돌려받는 남성 자기관리 커뮤니티 웹앱.
- 태그라인: 일단, 베이스부터.
- 포지션: 안티-동경. "멋져져"가 아니라 "안 망해". 판단자는 전문가가 아니라 대중.
- 맥락: 해커톤 데모. 솔로 개발.
- 핵심 지표(NSM): 답변 받은 글 비율.

## 기술 스택 (고정 — 함부로 바꾸지 말 것)
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (`@theme` 기반, 별도 config 파일 없음)
- Supabase (PostgreSQL, Storage) — **Auth는 쓰지 않는다**
- 서버 로직: Next.js Route Handlers (`app/api/...`)
- 배포: Vercel + Supabase Cloud
- ❌ 결제 PG 연동 없음 (안내 문구만)
- TanStack Query는 아직 안 붙였다. 지금은 `fetch` + `useState`로 충분해서 미도입.

## 실행 명령
- 개발 서버: `npm run dev` (http://localhost:3000)
- 빌드: `npm run build` / 린트: `npm run lint`
- 타입 검사: `npx tsc --noEmit`

## 🔑 인증 — 로그인 없음 (가장 중요한 구조)
- 앱 최초 진입 시 클라이언트가 **UUID v4를 생성해 localStorage에 저장**. 로그인·회원가입 화면 **없음**.
  최초 1회만 발급된 닉네임을 보여주는 화면이 뜨고(`components/first-run.tsx`), 두 번째 진입부터는 바로 피드.
- 서버는 `users.device_id`로 신규/기존을 판별하고, 신규면 **랜덤 닉네임**을 발급한다.
- 랜덤 닉네임: `[형용사] [동물] #[4자리]`. 단어 풀 각 20개 이상, **긍정·중립 어휘만**(외모·능력 비하 금지). 중복이면 숫자만 재발급. → `lib/nickname.ts`
- 모든 API 요청에 **`X-Device-Id: <UUID>` 헤더**. 서버는 이 헤더만으로 작성자·투표자를 판별. → `lib/device.ts`, `lib/api/http.ts`
- **세션·JWT·쿠키를 쓰지 않는다. 세션/토큰 테이블·비밀번호 컬럼을 만들지 않는다.**
- ❌ Supabase Auth, `auth.uid()`, 소셜 로그인 전부 사용 금지.

## 보안 규칙 (실수로 두 번 뚫렸던 부분 — 꼭 읽을 것)
- 기기 UUID는 Supabase가 검증할 수 없다 → **RLS 정책을 만들지 않고 전 테이블 차단**(anon/authenticated는 0행).
- **모든 데이터 접근은 서버 Route Handler를 경유한다.** 클라이언트에서 `supabase.from(...)` 직접 호출 금지.
- ⚠️ **뷰에는 반드시 `security_invoker = on`을 준다.** 뷰는 기본이 정의자 권한이라 밑에 깔린 테이블의 RLS를 통째로 우회한다. 안 주면 공개 anon 키로 `posts_feed`·`comments_view`가 그대로 읽힌다.
- ⚠️ **API 응답에 `device_id`를 절대 담지 않는다.** 그게 곧 신원이라 알면 남으로 위장할 수 있다. 대신 `is_mine` 불리언만 계산해서 준다 → `stripDevice()` (`lib/api/http.ts`).
- 지급량·차감량 같은 값은 **클라이언트가 보낸 숫자를 믿지 않고 서버 정의에서 가져온다**(하트 팩·광고 보상).
- 환경변수(.env.local): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`(서버 전용, `NEXT_PUBLIC_` 접두사 절대 금지)
- 환경변수 **이름을 바꾸면 3곳을 함께 바꾼다**: `.env.local` · `lib/supabase/*.ts` · 이 문서(+ Notion). 그리고 **dev 서버 재시작**(HMR로 반영 안 됨).

## 데이터베이스 (18 테이블 + 뷰 2)
SQL은 `db/`에 있고 **이 순서로** 실행한다.

| 파일 | 내용 |
|---|---|
| `schema_v2.sql` | 기본 스키마 (v1을 drop하고 새로 만든다 — 데이터가 날아간다) |
| `patch_v2_1.sql` | 글 유형 4택 · `post_likes` · `calc_temperature` · 뷰 재정의 |
| `patch_v2_3.sql` | 카테고리에 '헤어' 추가 |
| `test_v2_1.sql` | 검증 23종 (검증 전용 DB에서만 실행) |

테이블: `users` `posts` `post_images` `poll_options` `poll_votes` `nanhan_votes` `post_likes` `comments` `comment_likes` `articles` `quizzes` `quiz_results` `experts` `reviews` `expert_slots` `bookings` `heart_transactions` `reports`
뷰: `posts_feed`(피드 카드 집계) · `comments_view`(댓글 + 작성자 온도)
함수: `create_post` `cast_poll_vote` `cast_nanhan_vote` `calc_temperature` + 트리거 3종

Storage: **`post-images`** 버킷(공개 읽기, 5MB, 이미지 타입만). 업로드는 서버 경유(`POST /api/uploads`) — 클라이언트가 Storage에 직접 붙지 않는다.

### ★ 절대 헷갈리면 안 되는 두 축
- `category` = **주제**: `헤어` | `옷` | `스킨케어` | `바디&향수` | `자유`
- `post_type` = **물어보는 방식**: `정보공유` | `일반질문` | `선택지투표` | `무난함판정`
- **"무난무난"은 카테고리가 아니라 `post_type='무난함판정'` 필터다.** category enum에 절대 넣지 말 것(DB CHECK로도 막혀 있음).
- 카테고리 목록의 **단일 출처는 `lib/constants.ts`**. 다른 파일에서 다시 정의하지 말 것 — 예전에 API가 따로 들고 있어서 "탭은 생겼는데 저장은 거부"가 났다. DB CHECK도 같이 고쳐야 한다(`patch_v2_3.sql`).

## 데이터 접근 규칙 (앱 코드가 반드시 지킬 것)
1. 피드 조회는 **`posts_feed` 뷰**로. 무난함 %는 이 뷰에서만 계산 — 피드 배지와 상세가 같은 값을 써야 한다.
2. 글 작성은 **`create_post()` 함수**로(하트 차감 + 글 insert + 선택지 insert가 한 트랜잭션). 하트 부족이면 `INSUFFICIENT_HEARTS`.
3. 투표는 **`cast_poll_vote()` / `cast_nanhan_vote()`** 로(upsert — 다른 선택지를 누르면 표가 이동).
4. `comments.likes` 직접 update 금지 — 트리거가 자동 반영.
5. 온도는 저장값이 아니라 **`calc_temperature()` 계산값**. `users.temperature`는 캐시 컬럼일 뿐이니 읽지 말 것.
6. 내 글·내 댓글·내 예약은 전부 `device_id` 기준 **전용 엔드포인트**로 조회한다. 피드를 받아 `is_mine`으로 거르면 첫 페이지 밖이 빠진다.
7. **득표율은 서버에서 합이 100이 되게 배분한다**(최대잔여법). 선택지마다 따로 반올림하면 합이 101%가 되어 화면에서 바로 티가 난다.
8. 하트 지급은 `lib/api/grant-hearts.ts`의 compare-and-swap을 쓴다. PostgREST로는 `hearts = hearts + n`을 못 써서, 읽고 쓰면 동시 요청 한 건이 조용히 덮인다.

## 핵심 도메인 규칙
- **정체성 대칭**: 글도 댓글도 **같은 닉네임 + 온도**로 표시. '익명 vs 실명' 비대칭을 만들지 않는다.
- 닉네임을 변경해도 device_id는 그대로 → 과거 글·댓글·온도가 모두 따라온다.
- **투표 전에는 결과를 보여주지 않는다.** 서버가 득표수를 `null`로 내려 클라이언트에서도 볼 수 없다.
- 무난함 판정글은 작성자가 선택지를 만들 수 없다 — `무난해요`/`애매해요` 고정 2종. 0표면 % 없이 `[무난함]`만.
- 고수는 시드 고정(유저가 고수가 되는 경로 없음). 고수도 랜덤 닉네임 체계를 쓴다.

### 온도 (확정)
```
온도 = 36.5
     + (내가 쓴 댓글 수                    × 0.1)
     + (내 댓글이 받은 추천 수             × 0.5)
     + (내 정보공유 글이 받은 좋아요 수     × 0.2)
```
- `category='자유'` 글에서의 활동은 **전부 제외**(잡담방).
- **질문글은 기여 0.** 온도는 고수 판별 장치라 질문해서 오르는 경로가 있으면 안 된다.
- 자가 추천·자가 좋아요는 DB 트리거가 차단. 표시는 소수점 1자리.
- **고수 자격 기준: 42.0도.** 진행 바 범위 36.5 ~ 42.0.

### 하트 (확정)
| 항목 | 값 |
|---|---|
| 초기 지급 | 5개 |
| 글 작성 | -1개 (**정보공유 글은 차감 없음**) |
| 0개일 때 | **작성 차단** + 광고·충전 유도 |
| 광고 시청 | +2개, 최근 24시간 **5회까지**(서버가 원장으로 셈) |
| 충전 팩 | 10 / 20 / 30+5 / 50+12 |
| 결제 PG | ❌ 없음. 누르면 즉시 지급 + "준비 중" 문구 |

## 화면 구조
- 하단 4탭: **커뮤니티 / 매거진 / 컨설팅 / 내정보** + 글쓰기 **FAB**(우하단, 커뮤니티 탭에서만)
- 피드 탭 7개(가로 스크롤): `전체 | 무난무난 | 헤어 | 옷 | 스킨케어 | 바디&향수 | 자유`
- 글쓰기: 유형을 먼저 고르고(3택) 그 유형의 템플릿으로 넘어간다. 유형은 작성 후 변경 불가.
- 라우트
  - `/` `/post/[id]` `/write`
  - `/magazine` `/magazine/[id]` `/magazine/quiz/[slug]`
  - `/experts` `/experts/[id]` `/booking/[expertId]` `/booking/done/[id]`
  - `/me` `/me/activity` `/me/bookings`
  - `/hearts` (충전 샵 — 커뮤니티 헤더의 하트에서 진입)

## API (구현됨)
```
POST   /api/users/register            기기 등록·조회
PATCH  /api/users/nickname            닉네임 변경   POST = 다시 뽑기
GET    /api/users/me/posts            내 글
GET    /api/users/me/comments         내 댓글(원본 글 제목 포함)
GET    /api/posts                     피드 (?category= &post_type=)
POST   /api/posts                     글 작성
GET    /api/posts/[id]                상세 (유형별 위젯 + 댓글)
POST   /api/posts/[id]/poll-vote      선택지 투표
POST   /api/posts/[id]/nanhan-vote    무난함 판정
POST|DELETE /api/posts/[id]/like      정보공유 글 좋아요
POST   /api/posts/[id]/comments       댓글 작성
POST|DELETE /api/comments/[id]/like   댓글 추천
POST   /api/uploads                   사진 업로드
POST   /api/hearts/purchase           하트 충전
GET|POST /api/hearts/ad-reward        광고 보상 (GET = 남은 횟수)
```
규칙: 1기기 1표·자기 추천 차단·하트 차감은 **전부 DB(제약·트리거·함수)에 두고 API는 번역만 한다.** 규칙이 두 군데로 갈리면 반드시 어긋난다.

## 디자인 시스템
- 포인트 **다크 버건디 `#6B2436`**, 진한 `#4A1826`, 틴트 `#F7EEF0`, 틴트 보더 `#E8D5D9`
- 온도 색은 브릭 `#B5562A` (버건디와 구분)
- 배경 `#F2F2F3` / 본문 차콜 `#1D1F20`
- 폰트: **Pretendard**(본문) + **Barlow Condensed**(`.cond` — 숫자·영문 라벨)
- **모서리는 전부 직각** — `rounded-*` 금지. 그림자 최소, 얇은 보더와 대시 구분선 위주.
- **등록마크(+)**: 청사진 컨셉의 시그니처. `components/reg.tsx`의 `<Reg/>`로 쓴다.
- ⚠️ **선택 상태는 "테두리 유지 + `bg-brand/15` 연한 채움"으로 통일한다.** 꽉 찬 색으로 바꾸면 박스 선이 사라져 뭐가 선택됐는지 흐려진다. 틴트(`bg-brand-tint`)는 배경과 거의 같아서 선택 표시로는 쓰지 말 것.
- 투표 결과 막대: 채움은 **배경 띠로만** 두고 라벨은 막대 전체에 올린다. 라벨을 채움 안에 넣으면 0%·100%에서 글자가 밖으로 샌다.
- 모바일 퍼스트(390px 기준), 데스크톱은 가운데 컬럼(max 430px).

## 코딩 컨벤션
- 모든 코드 TypeScript. `any` 지양.
- App Router: 서버 컴포넌트 기본, 상호작용 필요할 때만 `"use client"`.
- 폴더: 라우트 `app/`, API `app/api/`, 공용 로직 `lib/`, 컴포넌트 `components/`, DB SQL `db/`.
- 네이밍: 파일 kebab-case, 컴포넌트 PascalCase, 변수/함수 camelCase, DB 컬럼 snake_case.
- ⚠️ **Tailwind v4: 전역 element 리셋은 반드시 `@layer base` 안에 둔다.** 레이어 밖 CSS는 `@layer utilities`를 specificity와 무관하게 이겨서, `button`에 붙인 `bg-*`·`text-*`·`font-*`가 앱 전체에서 통째로 무시된다.
- 작은 단위로 자주 커밋. 새 라이브러리는 꼭 필요할 때만 추가하고 이 문서에 기록.

## 기능 우선순위
1. ~~공통 기반~~ ✅ 기기 UUID · 유저 등록 · 랜덤 닉네임 · X-Device-Id · 4탭+FAB
2. ~~커뮤니티 핵심~~ ✅ 피드 · 글쓰기 3택 · 상세(투표/판정/일반) · 댓글·추천 · 사진 업로드
3. **시드 데이터** ← 지금 여기. 6개 탭 어디를 눌러도 비지 않게. 무난함 판정글은 투표가 쌓인 상태로. (콜드스타트 방어 = 데모 생명줄)
4. 매거진 — 화면은 있으나 `lib/mock.ts` 목데이터. 백엔드 미구현
5. 컨설팅 — 화면은 있으나 목데이터. **대표 답변 3개는 실제 comments 레코드 참조 필수**
6. 내정보 — 프로필·닉네임 변경·온도 바·내 활동 ✅ / 내 예약은 목데이터
7. ~~하트~~ ✅ 배지·차감·충전 샵·광고 보상

## 하지 말 것 (스코프 밖)
- 로그인·회원가입·소셜 로그인·세션/JWT/쿠키, Supabase Auth
- 대댓글, 글 수정·삭제, 검색, 알림, 팔로우, 무한스크롤
- 결제·PG 연동·카드 입력 UI, 예약 상태 전환(상태는 '신청 접수' 하나뿐)
- 유저가 고수가 되는 경로, 고수 슬롯 개설 화면, 리뷰 작성 UI
- 신고 클릭 동작(버튼 자리만), 사진 편집·필터
- 스택 임의 교체, 불필요한 라이브러리 추가

## 미결정 / 열린 질문
- **`정보공유` 글 유형을 쓸 것인가.** DB·API·`post_likes`·온도 산식(×0.2)은 4종 기준으로 만들어져 있는데, 디자인 v3와 현재 UI는 3종(일반질문·선택지투표·무난함판정)만 노출한다. 안 쓸 거면 `post_likes`와 온도 세 번째 항이 죽은 코드가 된다.
- 정렬: 피처리스트는 "최신순 고정", 디자인 v3에는 최신순/인기순 토글. **현재는 토글을 두고 인기순만 클라이언트 정렬**로 구현.
- 신고 후 모더레이션 정책 / 글 수정·삭제 정책
- 시드 텍스트(D-01) — 기획 제공 대기

## 참고 문서
- **PRD — BASE**: 요구사항·수용 기준·화면 IA
- **기술 스택**: 전체 DDL + 아키텍처
- **Updated Feature List(CSV)**: 기능 단위 명세(F-xx). 완료 조건은 여기 기준
- 이 페이지는 프로젝트 `base/CLAUDE.md`와 항상 동일하게 유지
