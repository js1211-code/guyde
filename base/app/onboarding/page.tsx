import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { GoogleIcon } from "@/components/icons";
import { TEMP_START } from "@/lib/constants";

export default function OnboardingPage() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center px-8">
        <p className="cond text-[56px] leading-none font-bold tracking-[0.12em]">
          BASE<span className="text-accent">+</span>
        </p>
        <h1 className="mt-6 text-[22px] leading-snug font-bold">
          일단, 베이스부터.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
          익명으로 묻고, 대중에게 검증받는
          <br />
          남자 자기관리 커뮤니티
        </p>
        <p className="cond mt-8 text-[12px] tracking-[0.14em] text-neutral-600">
          START AT {TEMP_START}°C
        </p>
      </div>

      <div className="px-6 pb-6">
        <Link
          href="/onboarding/nickname"
          className="flex h-12 items-center justify-center gap-2.5 border border-ink bg-white"
        >
          <GoogleIcon size={18} />
          <span className="text-[15px] font-semibold">구글로 시작하기</span>
        </Link>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-600">
          시작하면{" "}
          <a href="#" className="underline">
            이용약관
          </a>
          과{" "}
          <a href="#" className="underline">
            개인정보 처리방침
          </a>
          에<br />
          동의하는 것으로 봐요
        </p>
      </div>
    </AppShell>
  );
}
