import type { Metadata } from "next";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export const metadata: Metadata = {
  title: "Grafo de Conhecimento | Glossário Solana",
  description:
    "Visualize as conexões entre os 1001 termos do ecossistema Solana. Explore categorias, relações e caminhos de aprendizado.",
};

export default function GrafoPage() {
  return (
    <main
      className="flex-1 w-full flex flex-col"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <header className="border-b border-white/8 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold">
          <span className="gradient-text">Grafo de Conhecimento</span>
        </h1>
        <p className="text-[#A0A0B0] text-sm mt-0.5">
          1001 termos · explore conexões, filtre por categoria, clique para ver
          o termo
        </p>
      </header>
      <div className="flex-1 overflow-hidden">
        <KnowledgeGraph />
      </div>
    </main>
  );
}
