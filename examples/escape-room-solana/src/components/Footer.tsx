/**
 * @arquivo Footer.tsx
 * @descricao Rodape com links Superteam BR e Tokenfy.me
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-xs text-gray-500 text-center ${className}`}>
      <a
        href="https://linktr.ee/superteamBR"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-purple-400 transition-colors"
      >
        Superteam Brazil Solana
      </a>
      {" x Proudly made with ♥ by "}
      <a
        href="https://tokenfy.me"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-cyan-400 transition-colors"
      >
        Tokenfy.me
      </a>
    </footer>
  );
}
