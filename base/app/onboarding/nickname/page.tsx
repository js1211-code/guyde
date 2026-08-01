import { AppShell, TopBar } from "@/components/app-shell";
import { NicknameForm } from "@/components/nickname-form";

export default function NicknamePage() {
  return (
    <AppShell>
      <TopBar backHref="/onboarding" bordered={false} />
      <NicknameForm />
    </AppShell>
  );
}
