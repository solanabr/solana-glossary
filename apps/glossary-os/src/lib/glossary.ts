import type { Category, GlossaryTerm } from "../../../../src/types";

import aiMl from "../../../../data/terms/ai-ml.json";
import blockchainGeneral from "../../../../data/terms/blockchain-general.json";
import coreProtocol from "../../../../data/terms/core-protocol.json";
import defi from "../../../../data/terms/defi.json";
import devTools from "../../../../data/terms/dev-tools.json";
import infrastructure from "../../../../data/terms/infrastructure.json";
import network from "../../../../data/terms/network.json";
import programmingFundamentals from "../../../../data/terms/programming-fundamentals.json";
import programmingModel from "../../../../data/terms/programming-model.json";
import security from "../../../../data/terms/security.json";
import solanaEcosystem from "../../../../data/terms/solana-ecosystem.json";
import tokenEcosystem from "../../../../data/terms/token-ecosystem.json";
import web3 from "../../../../data/terms/web3.json";
import zkCompression from "../../../../data/terms/zk-compression.json";
import esOverrides from "../../../../data/i18n/es.json";
import ptOverrides from "../../../../data/i18n/pt.json";

import type { Locale } from "./locales";

type LocaleOverride = Record<string, { term?: string; definition?: string }>;

type CategoryMeta = {
  label: string;
  shortLabel: string;
  description: string;
};

export type BuilderPath = {
  slug: string;
  title: string;
  description: string;
  accent: "ember" | "teal" | "gold" | "rose";
  termIds: string[];
};

type BuilderPathDetails = {
  audience: string;
  outcome: string;
};

export type ConceptGraphNode = {
  term: GlossaryTerm;
  children: GlossaryTerm[];
};

export type UseCase = {
  slug: string;
  title: string;
  description: string;
  outcome: string;
  pathSlug: BuilderPath["slug"];
  termIds: string[];
};

const categoryMetaByLocale: Record<Locale, Record<Category, CategoryMeta>> = {
  en: {
  "core-protocol": {
    label: "Core Protocol",
    shortLabel: "Core",
    description: "Consensus, leader rotation, slots, epochs, and the runtime.",
  },
  "programming-model": {
    label: "Programming Model",
    shortLabel: "Programs",
    description: "Accounts, instructions, PDAs, transactions, and execution flow.",
  },
  "token-ecosystem": {
    label: "Token Ecosystem",
    shortLabel: "Tokens",
    description: "SPL assets, token standards, metadata, and NFT primitives.",
  },
  defi: {
    label: "DeFi",
    shortLabel: "DeFi",
    description: "AMMs, routing, liquidity, lending, and trading infrastructure.",
  },
  "zk-compression": {
    label: "ZK Compression",
    shortLabel: "ZK",
    description: "Compressed state, proofs, and scale-oriented storage patterns.",
  },
  infrastructure: {
    label: "Infrastructure",
    shortLabel: "Infra",
    description: "RPCs, validators, snapshots, indexing, and network plumbing.",
  },
  security: {
    label: "Security",
    shortLabel: "Security",
    description: "Failure modes, audits, attack surfaces, and safe design patterns.",
  },
  "dev-tools": {
    label: "Developer Tools",
    shortLabel: "Dev",
    description: "Anchor, local validators, explorers, SDKs, and testing workflows.",
  },
  network: {
    label: "Network",
    shortLabel: "Network",
    description: "Clusters, nodes, MEV actors, routing, and operating environments.",
  },
  "blockchain-general": {
    label: "Blockchain General",
    shortLabel: "Basics",
    description: "Shared crypto concepts that frame the broader ecosystem.",
  },
  web3: {
    label: "Web3",
    shortLabel: "Web3",
    description: "Wallets, signing flows, dApps, and key management concepts.",
  },
  "programming-fundamentals": {
    label: "Programming Fundamentals",
    shortLabel: "CS",
    description: "Serialization, memory, data structures, and core engineering basics.",
  },
  "ai-ml": {
    label: "AI / ML",
    shortLabel: "AI",
    description: "LLMs, RAG, embeddings, inference, and agent-facing primitives.",
  },
  "solana-ecosystem": {
    label: "Solana Ecosystem",
    shortLabel: "Ecosystem",
    description: "Teams, protocols, tools, and the wider Solana product landscape.",
  },
  },
  pt: {
    "core-protocol": { label: "Protocolo Base", shortLabel: "Core", description: "Consenso, rotação de líderes, slots, epochs e o runtime." },
    "programming-model": { label: "Modelo de Programação", shortLabel: "Programas", description: "Accounts, instruções, PDAs, transações e fluxo de execução." },
    "token-ecosystem": { label: "Ecossistema de Tokens", shortLabel: "Tokens", description: "Ativos SPL, padrões de token, metadados e primitivas de NFT." },
    defi: { label: "DeFi", shortLabel: "DeFi", description: "AMMs, roteamento, liquidez, empréstimos e infraestrutura de trading." },
    "zk-compression": { label: "Compressão ZK", shortLabel: "ZK", description: "Estado comprimido, provas e padrões de armazenamento voltados a escala." },
    infrastructure: { label: "Infraestrutura", shortLabel: "Infra", description: "RPCs, validators, snapshots, indexação e plumbing da rede." },
    security: { label: "Segurança", shortLabel: "Segurança", description: "Falhas, auditorias, superfícies de ataque e padrões seguros." },
    "dev-tools": { label: "Ferramentas de Dev", shortLabel: "Dev", description: "Anchor, validators locais, explorers, SDKs e fluxos de teste." },
    network: { label: "Rede", shortLabel: "Rede", description: "Clusters, nós, atores de MEV, roteamento e ambientes operacionais." },
    "blockchain-general": { label: "Blockchain Geral", shortLabel: "Base", description: "Conceitos cripto compartilhados que moldam o ecossistema mais amplo." },
    web3: { label: "Web3", shortLabel: "Web3", description: "Wallets, assinatura, dApps e gestão de chaves." },
    "programming-fundamentals": { label: "Fundamentos de Programação", shortLabel: "CS", description: "Serialização, memória, estruturas de dados e bases de engenharia." },
    "ai-ml": { label: "IA / ML", shortLabel: "IA", description: "LLMs, RAG, embeddings, inferência e primitivas voltadas a agentes." },
    "solana-ecosystem": { label: "Ecossistema Solana", shortLabel: "Ecossistema", description: "Times, protocolos, ferramentas e a paisagem de produtos de Solana." },
  },
  es: {
    "core-protocol": { label: "Protocolo Base", shortLabel: "Core", description: "Consenso, rotación de líderes, slots, epochs y el runtime." },
    "programming-model": { label: "Modelo de Programación", shortLabel: "Programas", description: "Accounts, instrucciones, PDAs, transacciones y flujo de ejecución." },
    "token-ecosystem": { label: "Ecosistema de Tokens", shortLabel: "Tokens", description: "Activos SPL, estándares de token, metadatos y primitivas NFT." },
    defi: { label: "DeFi", shortLabel: "DeFi", description: "AMMs, routing, liquidez, préstamos e infraestructura de trading." },
    "zk-compression": { label: "Compresión ZK", shortLabel: "ZK", description: "Estado comprimido, pruebas y patrones de almacenamiento orientados a escala." },
    infrastructure: { label: "Infraestructura", shortLabel: "Infra", description: "RPCs, validators, snapshots, indexación y plumbing de red." },
    security: { label: "Seguridad", shortLabel: "Seguridad", description: "Fallos, auditorías, superficies de ataque y patrones seguros." },
    "dev-tools": { label: "Herramientas de Dev", shortLabel: "Dev", description: "Anchor, validators locales, explorers, SDKs y flujos de testing." },
    network: { label: "Red", shortLabel: "Red", description: "Clusters, nodos, actores de MEV, routing y entornos operativos." },
    "blockchain-general": { label: "Blockchain General", shortLabel: "Base", description: "Conceptos compartidos de cripto que dan marco al ecosistema más amplio." },
    web3: { label: "Web3", shortLabel: "Web3", description: "Wallets, firmas, dApps y gestión de llaves." },
    "programming-fundamentals": { label: "Fundamentos de Programación", shortLabel: "CS", description: "Serialización, memoria, estructuras de datos y bases de ingeniería." },
    "ai-ml": { label: "IA / ML", shortLabel: "IA", description: "LLMs, RAG, embeddings, inferencia y primitivas orientadas a agentes." },
    "solana-ecosystem": { label: "Ecosistema Solana", shortLabel: "Ecosistema", description: "Equipos, protocolos, herramientas y el paisaje de productos de Solana." },
  },
};

const builderPaths: BuilderPath[] = [
  {
    slug: "anchor",
    title: "Anchor Builder Path",
    description: "Start with the abstractions most teams rely on to ship programs fast.",
    accent: "ember",
    termIds: ["anchor", "account", "instruction", "pda", "cpi", "idl", "discriminator"],
  },
  {
    slug: "runtime",
    title: "Runtime Builder Path",
    description: "Understand how Solana executes work before you optimize or debug it.",
    accent: "teal",
    termIds: ["proof-of-history", "slot", "epoch", "validator", "runtime", "transaction"],
  },
  {
    slug: "defi",
    title: "DeFi Builder Path",
    description: "Learn the trading and liquidity vocabulary behind the app layer.",
    accent: "gold",
    termIds: ["amm", "liquidity-pool", "swap", "dex", "order-book", "jupiter"],
  },
  {
    slug: "agents",
    title: "Agents Builder Path",
    description: "Map the glossary to the agentic workflow and context retrieval stack.",
    accent: "rose",
    termIds: ["llm", "rag", "embedding", "vector-database", "rpc", "jito"],
  },
];

const builderPathCopyByLocale: Record<Locale, Record<string, Pick<BuilderPath, "title" | "description">>> = {
  en: {
    anchor: { title: "Anchor Builder Path", description: "Start with the abstractions most teams rely on to ship programs fast." },
    runtime: { title: "Runtime Builder Path", description: "Understand how Solana executes work before you optimize or debug it." },
    defi: { title: "DeFi Builder Path", description: "Learn the trading and liquidity vocabulary behind the app layer." },
    agents: { title: "Agents Builder Path", description: "Map the glossary to the agentic workflow and context retrieval stack." },
  },
  pt: {
    anchor: { title: "Trilha de Anchor", description: "Comece pelas abstrações em que a maioria dos times confia para entregar programas com velocidade." },
    runtime: { title: "Trilha de Runtime", description: "Entenda como Solana executa trabalho antes de otimizar ou debugar." },
    defi: { title: "Trilha de DeFi", description: "Aprenda o vocabulário de trading e liquidez por trás da camada de apps." },
    agents: { title: "Trilha de Agentes", description: "Mapeie o glossário para o workflow agentic e para a pilha de recuperação de contexto." },
  },
  es: {
    anchor: { title: "Ruta de Anchor", description: "Empieza por las abstracciones en las que la mayoría de los equipos confía para enviar programas rápido." },
    runtime: { title: "Ruta de Runtime", description: "Entiende cómo Solana ejecuta trabajo antes de optimizar o debuggear." },
    defi: { title: "Ruta de DeFi", description: "Aprende el vocabulario de trading y liquidez detrás de la capa de apps." },
    agents: { title: "Ruta de Agentes", description: "Mapea el glosario al workflow agentic y a la pila de recuperación de contexto." },
  },
};

const builderPathDetailsByLocale: Record<Locale, Record<string, BuilderPathDetails>> = {
  en: {
    anchor: {
      audience: "Builders shipping with Anchor, IDLs, and account validation patterns.",
      outcome: "You finish with a practical mental model for how Anchor structures Solana development.",
    },
    runtime: {
      audience: "Developers debugging execution, performance, scheduling, and validator behavior.",
      outcome: "You understand how runtime concepts fit together before touching deeper optimization work.",
    },
    defi: {
      audience: "Teams building swaps, liquidity products, routing flows, or market infrastructure.",
      outcome: "You gain the vocabulary needed to reason about DEX and liquidity mechanics on Solana.",
    },
    agents: {
      audience: "Builders designing agentic workflows, context pipelines, and AI-assisted products.",
      outcome: "You leave with the core glossary needed to ground LLM and tooling conversations in Solana terms.",
    },
  },
  pt: {
    anchor: {
      audience: "Builders que entregam com Anchor, IDLs e padrões de validação de accounts.",
      outcome: "Você termina com um modelo mental prático de como o Anchor organiza o desenvolvimento em Solana.",
    },
    runtime: {
      audience: "Devs depurando execução, performance, escalonamento e comportamento de validators.",
      outcome: "Você entende como os conceitos de runtime se encaixam antes de entrar em otimização mais profunda.",
    },
    defi: {
      audience: "Times construindo swaps, produtos de liquidez, fluxos de roteamento ou infraestrutura de mercado.",
      outcome: "Você ganha o vocabulário necessário para raciocinar sobre DEXs e mecânicas de liquidez em Solana.",
    },
    agents: {
      audience: "Builders desenhando workflows agentic, pipelines de contexto e produtos assistidos por IA.",
      outcome: "Você sai com o núcleo do glossário necessário para aterrar conversas de LLM e tooling em termos de Solana.",
    },
  },
  es: {
    anchor: {
      audience: "Builders que envían con Anchor, IDLs y patrones de validación de accounts.",
      outcome: "Terminas con un modelo mental práctico de cómo Anchor organiza el desarrollo en Solana.",
    },
    runtime: {
      audience: "Devs depurando ejecución, performance, scheduling y comportamiento de validators.",
      outcome: "Entiendes cómo encajan los conceptos de runtime antes de entrar en trabajo de optimización más profundo.",
    },
    defi: {
      audience: "Equipos construyendo swaps, productos de liquidez, flujos de routing o infraestructura de mercado.",
      outcome: "Obtienes el vocabulario necesario para razonar sobre DEXs y mecánicas de liquidez en Solana.",
    },
    agents: {
      audience: "Builders diseñando workflows agentic, pipelines de contexto y productos asistidos por IA.",
      outcome: "Sales con el núcleo del glosario necesario para aterrizar conversaciones de LLM y tooling en términos de Solana.",
    },
  },
};

const specialMentalModelsByLocale: Record<Locale, Record<string, string>> = {
  en: {
    pda: "Think of it as a program-owned address that behaves like a wallet or storage slot your program can control without a private key.",
    account: "Think of it as the state container every Solana app reads from or writes to.",
    transaction: "Think of it as the execution envelope that carries one or more instructions through the runtime.",
    "proof-of-history": "Think of it as Solana's cryptographic clock, giving the network a shared sense of ordering before validators vote.",
    cpi: "Think of it as one Solana program calling another program during execution.",
    anchor: "Think of it as the developer framework that wraps low-level Solana program work in safer, faster conventions.",
    rpc: "Think of it as the gateway your app uses to read chain data and submit work to the network.",
    amm: "Think of it as the pricing engine that lets users swap assets against liquidity in a pool instead of matching against a live order book.",
    validator: "Think of it as the machine and software stack that helps produce blocks, vote on forks, and keep the network alive.",
    rag: "Think of it as a retrieval layer that feeds the right Solana context into an LLM before it answers.",
  },
  pt: {
    pda: "Pense nele como um endereço controlado pelo programa, parecido com uma wallet ou slot de storage que seu programa consegue usar sem chave privada.",
    account: "Pense nela como o contêiner de estado que toda app em Solana lê ou escreve.",
    transaction: "Pense nela como o envelope de execução que carrega uma ou mais instruções pelo runtime.",
    "proof-of-history": "Pense nisso como o relógio criptográfico da Solana, dando à rede uma noção compartilhada de ordenação antes dos votos dos validators.",
    cpi: "Pense nisso como um programa Solana chamando outro programa durante a execução.",
    anchor: "Pense nisso como o framework de desenvolvimento que empacota o trabalho low-level em Solana em convenções mais seguras e rápidas.",
    rpc: "Pense nisso como a porta de entrada que sua app usa para ler dados da chain e enviar trabalho para a rede.",
    amm: "Pense nisso como o motor de precificação que permite swaps contra liquidez em pool em vez de depender de order book ao vivo.",
    validator: "Pense nisso como a máquina e a pilha de software que ajudam a produzir blocos, votar em forks e manter a rede viva.",
    rag: "Pense nisso como uma camada de recuperação que injeta o contexto certo de Solana em um LLM antes da resposta.",
  },
  es: {
    pda: "Piensa en él como una dirección controlada por el programa, parecida a una wallet o slot de storage que tu programa puede usar sin clave privada.",
    account: "Piensa en ella como el contenedor de estado que toda app en Solana lee o escribe.",
    transaction: "Piensa en ella como el sobre de ejecución que lleva una o más instrucciones por el runtime.",
    "proof-of-history": "Piensa en esto como el reloj criptográfico de Solana, dando a la red un sentido compartido de orden antes de que voten los validators.",
    cpi: "Piensa en esto como un programa de Solana llamando a otro programa durante la ejecución.",
    anchor: "Piensa en esto como el framework de desarrollo que envuelve el trabajo low-level de Solana en convenciones más rápidas y seguras.",
    rpc: "Piensa en esto como la puerta de entrada que tu app usa para leer datos de la chain y enviar trabajo a la red.",
    amm: "Piensa en esto como el motor de precios que permite swaps contra liquidez en un pool en lugar de depender de un order book en vivo.",
    validator: "Piensa en esto como la máquina y la pila de software que ayudan a producir bloques, votar forks y mantener viva la red.",
    rag: "Piensa en esto como una capa de recuperación que mete el contexto correcto de Solana en un LLM antes de responder.",
  },
};

const useCaseCopyByLocale: Record<Locale, UseCase[]> = {
  en: [
    {
      slug: "understand-transactions",
      title: "Understand transactions",
      description: "Learn the minimum runtime vocabulary needed to reason about how Solana executes user actions.",
      outcome: "You leave with the mental model needed to read explorer output, runtime logs, and basic execution flow.",
      pathSlug: "runtime",
      termIds: ["transaction", "instruction", "slot", "proof-of-history"],
    },
    {
      slug: "deploy-a-program",
      title: "Deploy a program",
      description: "Start with the terms that matter when you are writing, structuring, and shipping Solana programs.",
      outcome: "You can navigate program structure, account handling, and Anchor conventions with less guesswork.",
      pathSlug: "anchor",
      termIds: ["anchor", "account", "pda", "idl", "cpi"],
    },
    {
      slug: "build-a-token-flow",
      title: "Build a token flow",
      description: "Focus on the token and liquidity concepts that show up when building wallets, swaps, or asset UX.",
      outcome: "You gain enough vocabulary to reason about minting, swapping, and token movement across apps.",
      pathSlug: "defi",
      termIds: ["spl-token", "swap", "amm", "liquidity-pool"],
    },
    {
      slug: "ship-an-ai-copilot",
      title: "Ship an AI copilot",
      description: "Use glossary context to ground AI products that need Solana-native vocabulary and retrieval.",
      outcome: "You understand the LLM, RAG, and RPC terms that usually appear in agentic Solana workflows.",
      pathSlug: "agents",
      termIds: ["llm", "rag", "embedding", "rpc"],
    },
  ],
  pt: [
    {
      slug: "understand-transactions",
      title: "Entender transações",
      description: "Aprenda o vocabulário mínimo de runtime para raciocinar sobre como Solana executa ações de usuário.",
      outcome: "Você sai com o modelo mental necessário para ler explorer, logs de runtime e fluxo básico de execução.",
      pathSlug: "runtime",
      termIds: ["transaction", "instruction", "slot", "proof-of-history"],
    },
    {
      slug: "deploy-a-program",
      title: "Publicar um programa",
      description: "Comece pelos termos que importam ao escrever, estruturar e entregar programas em Solana.",
      outcome: "Você navega melhor por estrutura de programa, accounts e convenções de Anchor.",
      pathSlug: "anchor",
      termIds: ["anchor", "account", "pda", "idl", "cpi"],
    },
    {
      slug: "build-a-token-flow",
      title: "Construir um fluxo de token",
      description: "Foque nos conceitos de token e liquidez que aparecem ao construir wallets, swaps ou UX de ativos.",
      outcome: "Você ganha vocabulário suficiente para raciocinar sobre mint, swap e movimento de tokens entre apps.",
      pathSlug: "defi",
      termIds: ["spl-token", "swap", "amm", "liquidity-pool"],
    },
    {
      slug: "ship-an-ai-copilot",
      title: "Lançar um copiloto de IA",
      description: "Use o contexto do glossário para aterrar produtos de IA que precisam de vocabulário e recuperação nativos de Solana.",
      outcome: "Você entende os termos de LLM, RAG e RPC que aparecem em workflows agentic em Solana.",
      pathSlug: "agents",
      termIds: ["llm", "rag", "embedding", "rpc"],
    },
  ],
  es: [
    {
      slug: "understand-transactions",
      title: "Entender transacciones",
      description: "Aprende el vocabulario mínimo de runtime para razonar sobre cómo Solana ejecuta acciones de usuario.",
      outcome: "Sales con el modelo mental necesario para leer explorer, logs de runtime y flujo básico de ejecución.",
      pathSlug: "runtime",
      termIds: ["transaction", "instruction", "slot", "proof-of-history"],
    },
    {
      slug: "deploy-a-program",
      title: "Desplegar un programa",
      description: "Empieza por los términos que importan al escribir, estructurar y enviar programas en Solana.",
      outcome: "Navegas mejor por estructura de programa, accounts y convenciones de Anchor.",
      pathSlug: "anchor",
      termIds: ["anchor", "account", "pda", "idl", "cpi"],
    },
    {
      slug: "build-a-token-flow",
      title: "Construir un flujo de token",
      description: "Enfócate en los conceptos de token y liquidez que aparecen al construir wallets, swaps o UX de activos.",
      outcome: "Ganas vocabulario suficiente para razonar sobre mint, swap y movimiento de tokens entre apps.",
      pathSlug: "defi",
      termIds: ["spl-token", "swap", "amm", "liquidity-pool"],
    },
    {
      slug: "ship-an-ai-copilot",
      title: "Lanzar un copiloto de IA",
      description: "Usa el contexto del glosario para aterrizar productos de IA que necesitan vocabulario y recuperación nativos de Solana.",
      outcome: "Entiendes los términos de LLM, RAG y RPC que aparecen en workflows agentic en Solana.",
      pathSlug: "agents",
      termIds: ["llm", "rag", "embedding", "rpc"],
    },
  ],
};

const localeOverrides: Partial<Record<Locale, LocaleOverride>> = {
  pt: ptOverrides,
  es: esOverrides,
};

export const allTerms: GlossaryTerm[] = [
  ...coreProtocol,
  ...programmingModel,
  ...tokenEcosystem,
  ...defi,
  ...zkCompression,
  ...infrastructure,
  ...security,
  ...devTools,
  ...network,
  ...blockchainGeneral,
  ...web3,
  ...programmingFundamentals,
  ...aiMl,
  ...solanaEcosystem,
] as GlossaryTerm[];

const termById = new Map(allTerms.map((term) => [term.id, term]));

export const categoryOrder = Object.keys(categoryMetaByLocale.en) as Category[];

function getNormalizedTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3);
}

function getAcronym(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/g)
    .filter(Boolean)
    .map((token) => token[0]?.toLowerCase() ?? "")
    .join("");
}

function getCompactContextLabels(locale: Locale): {
  category: string;
  definition: string;
  aliases: string;
  related: string;
} {
  switch (locale) {
    case "pt":
      return {
        category: "Categoria",
        definition: "Definição",
        aliases: "Aliases",
        related: "Relacionados",
      };
    case "es":
      return {
        category: "Categoría",
        definition: "Definición",
        aliases: "Aliases",
        related: "Relacionados",
      };
    default:
      return {
        category: "Category",
        definition: "Definition",
        aliases: "Aliases",
        related: "Related",
      };
  }
}

export function getAllTerms(locale: Locale = "en"): GlossaryTerm[] {
  if (locale === "en") return allTerms;

  const overrides = localeOverrides[locale];
  if (!overrides) return allTerms;

  return allTerms.map((term) => {
    const override = overrides[term.id];
    if (!override) return term;

    return {
      ...term,
      term: override.term ?? term.term,
      definition: override.definition ?? term.definition,
    };
  });
}

export function getLocalizedTerms(locale: Locale = "en"): GlossaryTerm[] {
  return getAllTerms(locale);
}

export function isCategory(value: string): value is Category {
  return categoryOrder.includes(value as Category);
}

export function getCategoryMeta(category: Category, locale: Locale = "en"): CategoryMeta {
  return categoryMetaByLocale[locale]?.[category] ?? categoryMetaByLocale.en[category];
}

export function getCategoryCount(category: Category): number {
  return allTerms.filter((term) => term.category === category).length;
}

export function getTermById(id: string, locale: Locale = "en"): GlossaryTerm | undefined {
  const baseTerm = termById.get(id);
  if (!baseTerm) return undefined;

  if (locale === "en") return baseTerm;

  const override = localeOverrides[locale]?.[id];
  if (!override) return baseTerm;

  return {
    ...baseTerm,
    term: override.term ?? baseTerm.term,
    definition: override.definition ?? baseTerm.definition,
  };
}

export function getTermsByCategory(category: Category, locale: Locale = "en"): GlossaryTerm[] {
  return getAllTerms(locale).filter((term) => term.category === category);
}

export function searchTerms(query: string, locale: Locale = "en"): GlossaryTerm[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return getAllTerms(locale);
  }

  return getAllTerms(locale).filter(
    (term) =>
      term.term.toLowerCase().includes(normalizedQuery) ||
      term.definition.toLowerCase().includes(normalizedQuery) ||
      term.id.toLowerCase().includes(normalizedQuery) ||
      term.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery)),
  );
}

export function getRelatedTerms(term: GlossaryTerm, locale: Locale = "en"): GlossaryTerm[] {
  return (term.related ?? [])
    .map((relatedId) => getTermById(relatedId, locale))
    .filter((relatedTerm): relatedTerm is GlossaryTerm => Boolean(relatedTerm));
}

export function getSiblingTerms(term: GlossaryTerm, locale: Locale = "en"): {
  previous?: GlossaryTerm;
  next?: GlossaryTerm;
} {
  const termsInCategory = getTermsByCategory(term.category, locale)
    .slice()
    .sort((left, right) => left.term.localeCompare(right.term));
  const index = termsInCategory.findIndex((candidate) => candidate.id === term.id);

  if (index === -1) {
    return {};
  }

  return {
    previous: index > 0 ? termsInCategory[index - 1] : undefined,
    next: index < termsInCategory.length - 1 ? termsInCategory[index + 1] : undefined,
  };
}

export function getCategoryTermPreview(
  term: GlossaryTerm,
  locale: Locale = "en",
  limit = 4,
): GlossaryTerm[] {
  return getTermsByCategory(term.category, locale)
    .filter((candidate) => candidate.id !== term.id)
    .slice(0, limit);
}

export function getBuilderPathsForTerm(termId: string, locale: Locale = "en"): BuilderPath[] {
  return getBuilderPaths(locale).filter((path) => path.termIds.includes(termId));
}

export function getCompactContext(term: GlossaryTerm, locale: Locale = "en"): string {
  const relatedTerms = getRelatedTerms(term, locale)
    .slice(0, 4)
    .map((relatedTerm) => relatedTerm.term);
  const category = getCategoryMeta(term.category, locale).label;
  const labels = getCompactContextLabels(locale);

  return [
    `${term.term} (${term.id})`,
    `${labels.category}: ${category}`,
    `${labels.definition}: ${term.definition}`,
    term.aliases?.length ? `${labels.aliases}: ${term.aliases.join(", ")}` : null,
    relatedTerms.length ? `${labels.related}: ${relatedTerms.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getConfusableTerms(
  term: GlossaryTerm,
  locale: Locale = "en",
  limit = 3,
): GlossaryTerm[] {
  const currentAcronym = getAcronym(term.term);
  const currentTokens = new Set([
    ...getNormalizedTokens(term.term),
    ...getNormalizedTokens(term.id),
    ...(term.aliases ?? []).flatMap((alias) => getNormalizedTokens(alias)),
  ]);

  return getTermsByCategory(term.category, locale)
    .filter((candidate) => candidate.id !== term.id)
    .map((candidate) => {
      let score = 0;
      const candidateAcronym = getAcronym(candidate.term);
      const candidateTokens = [
        ...getNormalizedTokens(candidate.term),
        ...getNormalizedTokens(candidate.id),
        ...(candidate.aliases ?? []).flatMap((alias) => getNormalizedTokens(alias)),
      ];

      if (currentAcronym && candidateAcronym && currentAcronym === candidateAcronym) {
        score += 6;
      }

      if ((term.aliases ?? []).some((alias) => (candidate.aliases ?? []).includes(alias))) {
        score += 5;
      }

      if (candidate.term.split(" ")[0]?.toLowerCase() === term.term.split(" ")[0]?.toLowerCase()) {
        score += 3;
      }

      const sharedTokens = candidateTokens.filter((token) => currentTokens.has(token));
      score += sharedTokens.length * 2;

      if (candidate.id.includes(term.id) || term.id.includes(candidate.id)) {
        score += 2;
      }

      return { candidate, score };
    })
    .filter((entry) => entry.score >= 4)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.candidate.term.localeCompare(right.candidate.term);
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getFeaturedTerms(locale: Locale = "en"): GlossaryTerm[] {
  const featuredIds = ["proof-of-history", "account", "transaction", "anchor", "amm", "rpc"];
  return featuredIds
    .map((id) => getTermById(id, locale))
    .filter((term): term is GlossaryTerm => Boolean(term));
}

export function getBuilderPaths(locale: Locale = "en"): BuilderPath[] {
  const localizedCopy = builderPathCopyByLocale[locale] ?? builderPathCopyByLocale.en;
  return builderPaths.map((path) => ({
    ...path,
    title: localizedCopy[path.slug]?.title ?? path.title,
    description: localizedCopy[path.slug]?.description ?? path.description,
  }));
}

export function getBuilderPath(slug: string, locale: Locale = "en"): BuilderPath | undefined {
  return getBuilderPaths(locale).find((path) => path.slug === slug);
}

export function getBuilderPathDetails(slug: string, locale: Locale = "en"): BuilderPathDetails | undefined {
  return builderPathDetailsByLocale[locale]?.[slug] ?? builderPathDetailsByLocale.en[slug];
}

export function getBuilderPathSiblings(
  slug: string,
  locale: Locale = "en",
): { previous?: BuilderPath; next?: BuilderPath } {
  const paths = getBuilderPaths(locale);
  const index = paths.findIndex((path) => path.slug === slug);
  if (index === -1) return {};

  return {
    previous: index > 0 ? paths[index - 1] : undefined,
    next: index < paths.length - 1 ? paths[index + 1] : undefined,
  };
}

export function getBuilderPathCategorySummary(
  slug: string,
  locale: Locale = "en",
): CategoryMeta[] {
  const terms = getBuilderPathTerms(slug, locale);
  const seen = new Set<Category>();

  return terms
    .map((term) => term.category)
    .filter((category) => {
      if (seen.has(category)) return false;
      seen.add(category);
      return true;
    })
    .map((category) => getCategoryMeta(category, locale));
}

export function getBuilderPathTerms(slug: string, locale: Locale = "en"): GlossaryTerm[] {
  const path = getBuilderPath(slug, locale);
  if (!path) return [];

  return path.termIds
    .map((termId) => getTermById(termId, locale))
    .filter((term): term is GlossaryTerm => Boolean(term));
}

export function getMentalModel(term: GlossaryTerm, locale: Locale = "en"): string {
  const special = specialMentalModelsByLocale[locale]?.[term.id] ?? specialMentalModelsByLocale.en[term.id];
  if (special) return special;

  switch (locale) {
    case "pt":
      switch (term.category) {
        case "programming-model":
          return "Pense nisso como uma das peças centrais que seu programa lê, escreve ou invoca durante a execução.";
        case "core-protocol":
          return "Pense nisso como parte da engrenagem que mantém a ordenação, execução ou consenso da rede funcionando.";
        case "defi":
          return "Pense nisso como uma mecânica de mercado usada para precificar, rotear ou mover capital em apps de liquidez.";
        case "dev-tools":
          return "Pense nisso como uma ferramenta ou abstração que reduz atrito no workflow de desenvolvimento em Solana.";
        case "ai-ml":
          return "Pense nisso como uma peça da pilha de contexto ou inferência usada em produtos com agentes ou LLMs.";
        default:
          return "Pense nisso como um bloco de construção que ajuda a ligar uma definição isolada ao sistema maior onde ela vive.";
      }
    case "es":
      switch (term.category) {
        case "programming-model":
          return "Piensa en esto como una de las piezas centrales que tu programa lee, escribe o invoca durante la ejecución.";
        case "core-protocol":
          return "Piensa en esto como parte del engranaje que mantiene funcionando el orden, la ejecución o el consenso de la red.";
        case "defi":
          return "Piensa en esto como una mecánica de mercado usada para poner precio, rutear o mover capital en apps de liquidez.";
        case "dev-tools":
          return "Piensa en esto como una herramienta o abstracción que reduce fricción en el workflow de desarrollo en Solana.";
        case "ai-ml":
          return "Piensa en esto como una pieza de la pila de contexto o inferencia usada en productos con agentes o LLMs.";
        default:
          return "Piensa en esto como un bloque de construcción que conecta una definición aislada con el sistema mayor donde vive.";
      }
    default:
      switch (term.category) {
        case "programming-model":
          return "Think of it as one of the core moving pieces your program reads, writes, or invokes at runtime.";
        case "core-protocol":
          return "Think of it as part of the chain machinery that keeps ordering, execution, or consensus moving.";
        case "defi":
          return "Think of it as a market mechanic used to price, route, or move capital through liquidity apps.";
        case "dev-tools":
          return "Think of it as a tool or abstraction that removes friction from shipping on Solana.";
        case "ai-ml":
          return "Think of it as a piece of the context or inference stack behind agentic and LLM-powered Solana products.";
        default:
          return "Think of it as a building block that connects one definition to the larger Solana system around it.";
      }
  }
}

export function getConceptGraph(
  term: GlossaryTerm,
  locale: Locale = "en",
  limit = 4,
): ConceptGraphNode[] {
  const primary = getRelatedTerms(term, locale).slice(0, limit);
  const seenChildren = new Set<string>([term.id, ...primary.map((item) => item.id)]);

  return primary.map((primaryTerm) => {
    const children = getRelatedTerms(primaryTerm, locale)
      .filter((candidate) => candidate.id !== term.id && !seenChildren.has(candidate.id))
      .slice(0, 2);

    for (const child of children) {
      seenChildren.add(child.id);
    }

    return {
      term: primaryTerm,
      children,
    };
  });
}

export function getUseCases(locale: Locale = "en"): UseCase[] {
  return useCaseCopyByLocale[locale] ?? useCaseCopyByLocale.en;
}

export function getUseCaseTerms(useCase: UseCase, locale: Locale = "en"): GlossaryTerm[] {
  return useCase.termIds
    .map((termId) => getTermById(termId, locale))
    .filter((term): term is GlossaryTerm => Boolean(term));
}
