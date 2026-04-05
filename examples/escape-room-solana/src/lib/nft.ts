/**
 * @arquivo nft.ts
 * @descricao Busca NFTs da wallet via DAS API — fallback graceful se nao suportado
 * @projeto Solana Glossary — Escape Room Solana
 * @autor Lucas Galvao (@lg_lucas) — Tokenfy.me
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface NftAvatar {
  name: string;
  image: string;
  mint: string;
}

// ─── Busca via DAS API (Helius, Shyft, etc.) ──────────────────────────────

/**
 * Busca NFTs do owner via DAS API (getAssetsByOwner).
 * Funciona com Helius, Shyft e outros RPCs compativeis.
 * Retorna array vazio se o RPC nao suporta DAS.
 */
export async function fetchNftAvatars(
  rpcUrl: string,
  ownerAddress: string,
  limit = 12,
): Promise<NftAvatar[]> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "nft-avatars",
        method: "getAssetsByOwner",
        params: {
          ownerAddress,
          page: 1,
          limit,
          displayOptions: { showFungible: false, showNativeBalance: false },
        },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.result?.items) return [];

    return data.result.items
      .filter((item: DasAsset) => {
        const img = item.content?.links?.image ?? item.content?.files?.[0]?.uri;
        return img && img.startsWith("http");
      })
      .map((item: DasAsset) => ({
        name: item.content?.metadata?.name ?? "NFT",
        image:
          item.content?.links?.image ?? item.content?.files?.[0]?.uri ?? "",
        mint: item.id,
      }))
      .slice(0, limit);
  } catch {
    return [];
  }
}

// ─── Tipo interno DAS (simplificado) ──────────────────────────────────────

interface DasAsset {
  id: string;
  content?: {
    metadata?: { name?: string };
    files?: Array<{ uri?: string }>;
    links?: { image?: string };
  };
}
