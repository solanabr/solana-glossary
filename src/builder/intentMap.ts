export const INTENT_MAP: Record<string, string[]> = {
  escrow: ["pda", "account", "instruction", "ownership", "signer"],
  staking: ["stake", "validator", "reward", "epoch", "delegation"],
  nft: ["mint", "metadata", "token", "master-edition", "collection"],
  token: ["mint", "token-account", "token-program", "spl-token", "decimals"],
  defi: ["liquidity", "pool", "swap", "amm", "vault"],
  dao: ["governance", "proposal", "vote", "multisig", "authority"],
  game: ["account", "pda", "instruction", "client", "rpc"],
  marketplace: ["listing", "escrow", "pda", "token", "royalty"],
  bridge: ["cross-chain", "validator", "program", "multisig", "verification"],
  oracle: ["price-feed", "account", "cpi", "instruction", "authority"],
  lending: ["vault", "collateral", "interest", "liquidation", "pool"],
  wallet: ["keypair", "signer", "transaction", "fee", "account"],
};
