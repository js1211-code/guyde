"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * 진짜로 되돌아가는 뒤로가기.
 *
 * 🚨 <Link href="/"> 로 두면 안 되는 자리가 있다. 그건 뒤로가기가 아니라
 *    '/'로 가는 앞으로가기라서, 무난무난 게시판에서 글을 열고 이 버튼을
 *    누르면 보던 게시판이 아니라 전체로 떨어진다. 히스토리도 한 칸 더
 *    쌓인다. 설치형 PWA에는 주소창 뒤로가기가 없어서 이 버튼이 유일한
 *    출구다 — 여기가 어긋나면 빠져나갈 방법이 없다.
 *
 * 앱 안에서 들어왔으면 history.back() 이 직전 화면을 주소째 되살린다.
 * 링크로 이 화면을 바로 열었으면 돌아갈 데가 없으므로 fallbackHref 로 간다.
 * (history.length 는 이 창의 방문 수다. 설치형은 앱이 제 창을 쓰므로
 *  1이면 방금 이 화면으로 연 것이 맞다)
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      <ChevronLeftIcon size={20} />
    </button>
  );
}
