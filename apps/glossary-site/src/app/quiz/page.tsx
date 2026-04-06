import type { Metadata } from "next";
import Quiz from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Quiz | Glossário Solana",
  description:
    "Teste seus conhecimentos do ecossistema Solana com flashcards e múltipla escolha. 1001 termos, 14 categorias.",
};

export default function QuizPage() {
  return (
    <main className="flex-1 w-full">
      <Quiz />
    </main>
  );
}
