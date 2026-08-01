import { AppShell } from "@/components/app-shell";
import { QuizRunner } from "@/components/quiz-runner";
import { getQuizResultIds, getQuizTakerCount } from "@/lib/mock";

export default function QuizPage() {
  // 지금은 결과가 하나뿐이라 고정. 나중에는 답안 채점 후 quiz_results insert.
  const [resultId] = getQuizResultIds();

  return (
    <AppShell>
      <QuizRunner takerCount={getQuizTakerCount()} resultId={resultId} />
    </AppShell>
  );
}
