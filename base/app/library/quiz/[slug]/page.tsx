import { notFound } from "next/navigation";
import { getQuiz, getQuizResults, getQuizSlugs } from "@/lib/mock";
import { QuizRunner } from "./quiz-runner";

export function generateStaticParams() {
  return getQuizSlugs().map((slug) => ({ slug }));
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = getQuiz(slug);
  const results = getQuizResults(slug);
  if (!quiz || !results) notFound();

  // 문항·결과만 넘긴다. mock.ts를 클라이언트에서 통째로 import하면
  // 아티클 본문까지 번들에 실린다.
  return <QuizRunner quiz={quiz} results={results} />;
}
