/**
 * @arquivo AnimatedBlobs.tsx
 * @descricao Blobs animados de fundo com variantes por tema
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { motion } from "framer-motion";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type BlobVariant = "genesis" | "defi" | "lab";

interface AnimatedBlobsProps {
  variant?: BlobVariant;
}

// ─── Paletas de cores por variante ──────────────────────────────────────────

const PALETTES: Record<BlobVariant, [string, string, string]> = {
  genesis: ["#9945FF", "#14F195", "#00D1FF"],
  defi: ["#10B981", "#9945FF", "#2DD4BF"],
  lab: ["#3B82F6", "#F97316", "#EC4899"],
};

// ─── Componente ─────────────────────────────────────────────────────────────

export default function AnimatedBlobs({
  variant = "genesis",
}: AnimatedBlobsProps) {
  const [c1, c2, c3] = PALETTES[variant];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blob 1 — canto superior esquerdo */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: c1 }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 — centro direito */}
      <motion.div
        className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
        style={{ background: c2 }}
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 60, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 — canto inferior esquerdo */}
      <motion.div
        className="absolute -bottom-24 left-1/4 w-[450px] h-[450px] rounded-full opacity-15 blur-[110px]"
        style={{ background: c3 }}
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
