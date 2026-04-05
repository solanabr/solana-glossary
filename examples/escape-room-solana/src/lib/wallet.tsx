/**
 * @arquivo wallet.tsx
 * @descricao Provider de wallet Solana com Phantom e Solflare
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

import { type FC, type ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// CSS do modal de selecao de wallet
import "@solana/wallet-adapter-react-ui/styles.css";

// ─── Endpoint RPC ────────────────────────────────────────────────────────────

const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl("devnet");

// ─── Provider wrapper ────────────────────────────────────────────────────────

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Encapsula ConnectionProvider, WalletProvider e WalletModalProvider
 * para uso em toda a aplicacao.
 */
export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
