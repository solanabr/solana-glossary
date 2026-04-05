/**
 * @arquivo App.tsx
 * @descricao Componente raiz com rotas lazy-loaded da aplicacao
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// ─── Paginas lazy-loaded ────────────────────────────────────────────────────

const Portal = lazy(() => import("./pages/Portal"));
const Home = lazy(() => import("./pages/Home"));
const VidaHome = lazy(() => import("./pages/VidaHome"));
const GamePlay = lazy(() => import("./pages/GamePlay"));
const GameResult = lazy(() => import("./pages/GameResult"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const VidaPlay = lazy(() => import("./vida/pages/VidaPlay"));
const VidaResult = lazy(() => import("./vida/pages/VidaResult"));

// ─── Spinner de carregamento ────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0015]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Componente App ─────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/escape" element={<Home />} />
        <Route path="/vida" element={<VidaHome />} />
        <Route path="/vida/jogar/:tema" element={<VidaPlay />} />
        <Route path="/vida/sala/:tema/:code" element={<VidaPlay />} />
        <Route path="/vida/resultado/:tema" element={<VidaResult />} />
        <Route path="/jogar/:tema/:nivel" element={<GamePlay />} />
        <Route path="/resultado/:tema/:nivel" element={<GameResult />} />
        <Route path="/ranking" element={<Leaderboard />} />
      </Routes>
    </Suspense>
  );
}
