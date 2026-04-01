const WHY_MAP: Record<string, string> = {
  pda: "Programas Solana precisam de endereços que possam 'assinar' transações sem expor uma chave privada. PDAs resolvem isso derivando um endereço deterministicamente a partir de seeds, garantindo que só o programa dono possa autorizar operações — habilitando custódia sem custodians humanos.",
  cpi: "Um único programa raramente faz tudo sozinho. CPI permite que programas componham funcionalidades uns dos outros — assim como funções chamam outras funções. Sem CPI, cada dApp teria que reimplementar toda a lógica de tokens, staking e mais do zero.",
  rent: "Validators Solana armazenam todos os dados de contas em RAM (não em disco) para máxima performance. Isso é caro — rent existe para cobrar pelo espaço ocupado e incentivar a limpeza de contas desnecessárias. Contas com 2+ anos de rent pré-pago ficam 'rent-exempt' e persistem indefinidamente.",
  "proof-of-history":
    "Bitcoin e Ethereum precisam de consenso sobre a ordem dos eventos — validators precisam concordar sobre qual bloco vem depois. PoH elimina essa necessidade criando um relógio criptográfico verificável que prova a passagem do tempo, permitindo que Solana processe transações sem esperar por rodadas de consenso.",
  lamport:
    "SOL é divisível como centavos para dólares — mas com 9 casas decimais, a unidade mínima precisa de um nome. Lamport é a menor unidade de SOL (0.000000001 SOL), nomeada em homenagem ao cientista da computação Leslie Lamport cujo trabalho em sistemas distribuídos influenciou o design da Solana.",
  anchor:
    "Escrever programas Solana em Rust puro requer tratar manualmente de serialização, verificação de contas, e segurança — dezenas de linhas de boilerplate repetido. Anchor é um framework que elimina esse boilerplate com macros, deixando os devs focarem na lógica de negócio.",
  amm: "Exchanges tradicionais precisam de compradores e vendedores simultâneos (order book). AMMs eliminam essa necessidade usando fórmulas matemáticas (como x*y=k) para determinar preços automaticamente, permitindo liquidez 24/7 sem market makers humanos.",
  "spl-token":
    "Sem um padrão, cada token na Solana teria sua própria interface — wallets e dApps precisariam de integração customizada para cada token. SPL Token define uma interface única que qualquer token pode implementar, garantindo interoperabilidade automática com toda a infraestrutura existente.",
  account:
    "Solana armazena todo o estado da blockchain em contas — ao contrário de contratos inteligentes do Ethereum que gerenciam seu próprio estado internamente. Separar dados de código permite paralelismo massivo: múltiplas transações podem escrever em contas diferentes simultaneamente.",
  program:
    "Programas Solana são stateless por design — eles não armazenam dados, apenas processam instruções. Isso permite que um único deploy de código sirva milhares de usuários com diferentes estados, sem necessidade de deploy por usuário.",
  transaction:
    "Transações Solana são atômicas e compostas por múltiplas instruções. Se qualquer instrução falhar, toda a transação é revertida — garantindo consistência sem necessidade de mecanismos de compensação complexos.",
  validator:
    "A rede Solana é operada por milhares de validators distribuídos globalmente. Validators processam transações, propõem blocos e garantem a segurança da rede através de proof-of-stake — qualquer um pode se tornar um validator depositando SOL como stake.",
};

const CATEGORY_WHY: Record<string, string> = {
  defi: "Este conceito existe para remover intermediários financeiros tradicionais, permitindo transações financeiras programáticas, sem permissão, e composáveis diretamente na blockchain.",
  "zk-compression":
    "Este conceito existe para reduzir drasticamente o custo de armazenamento on-chain usando provas criptográficas que verificam dados sem revelar seu conteúdo completo — habilitando escala sem comprometer segurança.",
  security:
    "Este conceito existe para proteger programas e usuários de vetores de ataque específicos da Solana, onde a velocidade e o modelo de contas criam superfícies de ataque únicas.",
  "core-protocol":
    "Este conceito existe como parte fundamental da arquitetura que permite à Solana processar 65.000+ transações por segundo com finalidade sub-segundo.",
};

export default function WhySection({
  termId,
  category,
}: {
  termId: string;
  category: string;
}) {
  const why =
    WHY_MAP[termId] ??
    CATEGORY_WHY[category] ??
    "Este conceito existe como parte do modelo único da Solana, projetado para maximizar throughput e minimizar latência em aplicações descentralizadas.";

  return (
    <div className="border-l-2 border-accent pl-4 py-1 my-6">
      <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-2">
        Por que isso existe?
      </p>
      <p className="text-[13px] text-text-muted leading-relaxed">{why}</p>
    </div>
  );
}
