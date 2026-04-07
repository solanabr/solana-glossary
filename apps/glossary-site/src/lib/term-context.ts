export interface TermContext {
  analogy: string; // "Como pensar sobre isso"
  builderUse: string; // "Por que builders usam"
  commonMistake: string; // "Erro comum"
}

export const TERM_CONTEXTS: Record<string, TermContext> = {
  // ── Core Protocol ────────────────────────────────────────────────────────
  "proof-of-history": {
    analogy:
      "Pense no PoH como um relógio criptográfico global — ele cria um registro verificável de que eventos ocorreram em uma sequência específica, sem precisar que todos os validadores concordem a cada passo.",
    builderUse:
      "Permite que transações sejam ordenadas e processadas em paralelo com alta certeza temporal, tornando possível o throughput de 50.000+ TPS do Solana.",
    commonMistake:
      "Confundir PoH com o mecanismo de consenso: PoH é um relógio, não um sistema de votação. O consenso real é feito pelo Tower BFT por cima do PoH.",
  },

  "tower-bft": {
    analogy:
      "Tower BFT é o mecanismo de votação do Solana: validators apostam votos em forks específicos e o custo de mudar de ideia aumenta exponencialmente com o tempo — como um tribunal onde testemunhos passados pesam cada vez mais.",
    builderUse:
      "Determina quando uma transação atinge 'finality' — você pode confiar em commitment level 'finalized' para pagamentos irreversíveis e usar 'confirmed' para UX mais rápida com risco mínimo.",
    commonMistake:
      "Usar 'processed' (1 confirmação) para lógica financeira crítica. Um bloco 'processed' ainda pode ser revertido por um fork. Prefira 'confirmed' (supermajority) para a maioria dos casos.",
  },

  sealevel: {
    analogy:
      "Sealevel é o runtime paralelo do Solana — como uma cozinha industrial com vários chefs trabalhando simultaneamente em pratos diferentes, sem se atrapalhar.",
    builderUse:
      "Estruturar programas para minimizar contas compartilhadas entre transações concorrentes permite execução paralela real, aumentando throughput da sua dApp.",
    commonMistake:
      "Criar gargalos de estado global: uma conta acessada por muitas transações simultâneas força serialização, eliminando o benefício do paralelismo.",
  },

  turbine: {
    analogy:
      "Turbine divide blocos em shreds (fragmentos) que se propagam pela rede como um torrent BitTorrent — eficiente mesmo com mais de 1.000 validators geograficamente distribuídos.",
    builderUse:
      "Entender Turbine explica por que a latência de finalização do Solana é baixa mesmo em rede global — a propagação de blocos é projetada para ser sub-segundo.",
    commonMistake:
      "Assumir que propagação de bloco é instantânea. Ainda existe latência de rede real que afeta quando sua transação é confirmada em diferentes regiões.",
  },

  "gulf-stream": {
    analogy:
      "Gulf Stream é o protocolo de mempool do Solana: encaminha transações diretamente ao próximo líder antes do bloco atual terminar, como já colocar o pedido antes de sentar na mesa.",
    builderUse:
      "Permite pré-processamento de transações pelo próximo validator, reduzindo latência de confirmação e eliminando a necessidade de mempool tradicional.",
    commonMistake:
      "Enviar transações com blockhash muito antigo (>~150 slots). Gulf Stream descarta transações com blockhash expirado — sempre use o blockhash mais recente.",
  },

  gossip: {
    analogy:
      "O protocolo Gossip é a rede social dos validators do Solana: cada nó conta suas novidades para alguns vizinhos, que contam para outros, até a informação se espalhar por toda a rede em segundos.",
    builderUse:
      "Entender gossip explica por que informações de stake, vote e contato de validators se propagam rapidamente sem um coordenador central — é o mecanismo de descoberta da rede.",
    commonMistake:
      "Assumir que todos os nós têm a mesma visão da rede ao mesmo tempo. Gossip tem latência — RPCs em diferentes regiões podem ter informações levemente desatualizadas.",
  },

  shred: {
    analogy:
      "Shreds são os fragmentos em que um bloco Solana é dividido antes de ser propagado pela rede — como dividir um arquivo grande em partes menores para fazer upload mais rápido via BitTorrent.",
    builderUse:
      "Irrelevante para a maioria dos builders, mas crucial para entender latência: a reconstrução de blocos a partir de shreds é o principal bottleneck em RPC nodes com hardware limitado.",
    commonMistake:
      "Confundir shreds com transações. Um shred é um fragmento de bloco, não de transação. Uma transação pode ser dividida em múltiplos shreds na propagação.",
  },

  slot: {
    analogy:
      "Um slot é a unidade básica de tempo no Solana — aproximadamente 400ms, durante o qual um líder eleito produz (ou não) um bloco.",
    builderUse:
      "Timestamps on-chain são derivados de slots via `clock.slot`. Use para lógica temporal em programas, como cooldowns e períodos de lock.",
    commonMistake:
      "Usar `clock.unix_timestamp` para lógica crítica de segurança. Pode ser manipulado pelo líder dentro de um intervalo — prefira `clock.slot` para alta precisão.",
  },

  epoch: {
    analogy:
      "Um epoch é um período de ~432.000 slots (~2 dias) ao final do qual rewards de stake são distribuídos e o schedule de líderes é recalculado.",
    builderUse:
      "Implementar lógica de vesting, distribuição periódica de rewards ou qualquer mecanismo que precisa de granularidade de dias usa epochs como referência.",
    commonMistake:
      "Assumir que epochs têm duração exata em segundos. A duração real varia com slots pulados e pode ser ligeiramente diferente do esperado.",
  },

  leader: {
    analogy:
      "O líder é o validator com 'vez' de produzir blocos — o schedule é determinístico e público, então qualquer um pode saber de antemão quem será o líder nos próximos slots.",
    builderUse:
      "Enviar transações diretamente ao líder atual via staked connections (Jito, staked RPCs) reduz latência significativamente comparado a RPCs genéricos.",
    commonMistake:
      "Depender de um único RPC para submissão. RPCs podem estar geograficamente distantes do líder atual, adicionando dezenas de milissegundos desnecessários.",
  },

  fork: {
    analogy:
      "Um fork no Solana é temporário por design — múltiplos líderes podem produzir blocos conflitantes que são resolvidos pelo Tower BFT em poucos segundos.",
    builderUse:
      "Esperar ~32 confirmações (supermajority commitment) antes de tratar uma transação como final em aplicações que movem valor significativo.",
    commonMistake:
      "Tratar 1 confirmação como finalidade. Em condições de rede adversas, transações podem ser revertidas por forks até atingir supermajority commitment.",
  },

  consensus: {
    analogy:
      "Consenso é o processo pelo qual todos os validators concordam sobre o estado da blockchain — como um júri que precisa chegar a um veredicto unânime antes de o estado ser oficial.",
    builderUse:
      "O nível de commitment que você escolhe ao ler dados (processed, confirmed, finalized) determina o trade-off entre velocidade e segurança para seu produto.",
    commonMistake:
      "Usar 'processed' para exibir saldos em interfaces financeiras. Use 'confirmed' ou 'finalized' para dados que afetam decisões do usuário.",
  },

  finality: {
    analogy:
      "Finality é o ponto sem retorno — quando uma transação foi confirmada por supermajority de validators e não pode mais ser revertida, como uma assinatura no contrato que não pode ser desfeita.",
    builderUse:
      "Após finality (~25-32 slots / ~10 segundos), você pode liberar ativos ou executar ações irreversíveis com total segurança, sem risco de reorganização.",
    commonMistake:
      "Confundir 'confirmed' com 'finalized'. 'Confirmed' significa supermajority no fork atual — mas o fork ainda pode mudar. 'Finalized' significa que o bloco não pode mais ser revertido.",
  },

  validator: {
    analogy:
      "Um validador é um participante da rede que verifica e processa transações — similar a um minerador no Bitcoin, mas sem prova de trabalho computacional.",
    builderUse:
      "Entender validators ajuda a otimizar latência: submeter transações via stake-weighted connections reduz o tempo de confirmação para os slots do líder atual.",
    commonMistake:
      "Assumir que todos os validators são iguais. Hardware, localização geográfica e quantidade de stake afetam drasticamente latência e taxa de skip de slots.",
  },

  stake: {
    analogy:
      "Stake é colateral bloqueado que dá ao validator influência proporcional no consenso — quanto mais stake delegado, mais peso tem o voto daquele validator.",
    builderUse:
      "Liquid staking protocols (Marinade, Jito) permitem usar SOL em staking como liquidez via LSTs (mSOL, jitoSOL) em protocolos DeFi simultaneamente.",
    commonMistake:
      "Confundir APY de staking com rendimento garantido. Rewards variam com performance do validator, inflação da rede e quantidade total de SOL em staking.",
  },

  cluster: {
    analogy:
      "Um cluster Solana é uma rede independente com seus próprios validators e estado — como ambientes separados de desenvolvimento, staging e produção, cada um com seu próprio banco de dados.",
    builderUse:
      "Desenvolva e teste no devnet (tokens sem valor), use testnet para testes de stress e mainnet apenas para produção com dinheiro real.",
    commonMistake:
      "Misturar configurações de cluster no código. Uma transação enviada para devnet não vai aparecer no mainnet — confirme sempre a URL do cluster antes de submeter.",
  },

  devnet: {
    analogy:
      "Devnet é o playground gratuito do Solana — uma rede completa com todos os programas reais, mas com SOL sem valor que você pode solicitar via airdrop.",
    builderUse:
      "Teste todo fluxo completo no devnet antes de ir para mainnet: criação de contas, transações, programas deployados. Use `solana airdrop 2` para obter SOL de teste.",
    commonMistake:
      "Assumir que o comportamento do devnet é idêntico ao mainnet. Devnet pode ter versões diferentes do runtime, menor TPS real e validators com menos uptime.",
  },

  mainnet: {
    analogy:
      "Mainnet é a rede de produção do Solana — onde transações têm valor real, erros custam dinheiro e não há botão de 'desfazer'.",
    builderUse:
      "Deploy em mainnet exige RPC confiável (Helius, QuickNode), priority fees adequadas e testes exaustivos em devnet. Nunca faça deploy direto sem testar antes.",
    commonMistake:
      "Usar RPC público gratuito em produção. Os endpoints públicos do Solana têm rate limits agressivos e downtime frequente — use um RPC dedicado para qualquer produto real.",
  },

  // ── Programming Model ─────────────────────────────────────────────────────
  account: {
    analogy:
      "No Solana, tudo é uma conta — programas, tokens, dados do usuário. É o oposto do Ethereum, onde contratos e contas são tipos distintos. Pense como um sistema de arquivos: tudo é um arquivo.",
    builderUse:
      "O modelo de conta separado do programa permite que o mesmo programa gerencie milhares de contas de dados distintas sem redesenhar a lógica.",
    commonMistake:
      "Esquecer que contas precisam de saldo mínimo para rent-exemption. Contas abaixo do mínimo (~0.002 SOL para 165 bytes) são elegíveis para coleta pelo runtime.",
  },

  transaction: {
    analogy:
      "Uma transação é um envelope atômico de instruções — ou todas executam com sucesso, ou nenhuma é aplicada. Como uma operação bancária: ou transfere, ou reverte.",
    builderUse:
      "Agrupar múltiplas instruções em uma única transação garante atomicidade — essencial para swaps multi-etapa que não podem falhar pela metade.",
    commonMistake:
      "Exceder o limite de 1232 bytes por transação ou 1.4M compute units. Transações muito grandes falham na submissão, não na execução — difícil de debugar.",
  },

  "versioned-transaction": {
    analogy:
      "Versioned Transactions adicionaram suporte a Address Lookup Tables no Solana — como um índice de endereços que permite referenciar 256 contas por ID de 1 byte em vez de 32 bytes cada.",
    builderUse:
      "Use versioned transactions com ALTs para superar o limite de ~35 contas por transação legacy — essencial para swaps complexos no Jupiter que tocam muitas contas de pool.",
    commonMistake:
      "Misturar transações legacy e versioned no mesmo fluxo sem checar compatibilidade da carteira. Wallets mais antigas podem não suportar versioned transactions.",
  },

  instruction: {
    analogy:
      "Uma instrução é uma chamada de função para um programa on-chain: especifica qual programa executar, quais contas passar como argumentos, e os bytes de dados de entrada.",
    builderUse:
      "Compor múltiplas instruções de programas diferentes em uma única transação atômica — por exemplo, criar uma conta e inicializá-la em uma só transação.",
    commonMistake:
      "Passar contas na ordem errada. Programas Anchor validam a ordem via macros e retornam erros genéricos se a ordem não bater com o struct de contexto.",
  },

  program: {
    analogy:
      "Programas Solana são contratos inteligentes stateless — eles não guardam estado próprio, apenas processam instruções e modificam contas externas que lhes são passadas.",
    builderUse:
      "Como programas são stateless, você pode fazer upgrade sem migrar dados: deploy uma nova versão e as contas de dados existentes são compatíveis desde que o schema não mude.",
    commonMistake:
      "Esquecer que programas não têm acesso a dados externos não passados como contas. Se sua lógica precisa de um dado on-chain, essa conta precisa estar listada na instrução.",
  },

  pda: {
    analogy:
      "Pense em PDAs como contas cujas chaves privadas simplesmente não existem — só o programa que as derivou pode 'assinar' por elas, tornando-as cofres perfeitos para guardar estado de programa.",
    builderUse:
      "Criar contas de estado determinísticas por usuário sem precisar gerenciar chaves privadas — o endereço é sempre derivável a partir de seeds conhecidas.",
    commonMistake:
      "Recalcular o canonical bump a cada instrução: armazene o bump na própria conta ao criá-la e reutilize-o. Recalcular gasta compute units desnecessários.",
  },

  bump: {
    analogy:
      "O bump seed é o número (0-255) adicionado às seeds para garantir que o endereço derivado caia fora da curva ed25519 — como um ajuste fino que faz a chave não ter par privado.",
    builderUse:
      "Sempre armazene o canonical bump (o maior encontrado) no momento de criação do PDA. Isso evita recomputação cara na `find_program_address` em chamadas futuras.",
    commonMistake:
      "Aceitar qualquer bump passado pelo cliente como argumento. Valide que o bump armazenado bate com o PDA derivado para evitar ataques de substituição de endereço.",
  },

  "system-program": {
    analogy:
      "O System Program é o programa base do Solana — ele executa operações fundamentais como criar contas, transferir SOL e alocar espaço. Tudo mais se apoia nele.",
    builderUse:
      "Usado via CPI para criar novas contas de dados no seu programa: `system_instruction::create_account` para alocar espaço e assignar ownership ao seu programa.",
    commonMistake:
      "Esquecer de incluir o System Program como conta em instruções que criam contas via CPI. Anchor exige `system_program: Program<'info, System>` no contexto.",
  },

  "address-lookup-table": {
    analogy:
      "ALTs são listas compartilhadas de endereços que transações podem referenciar com um índice de 1 byte — como abreviações que permitem citar 256 endereços completos sem repetir os 32 bytes cada vez.",
    builderUse:
      "Essencial para transações complexas com muitas contas (Jupiter swaps, programas DeFi): reduz o tamanho da transação e permite incluir mais de ~35 contas numa única tx.",
    commonMistake:
      "Criar uma ALT nova para cada transação. ALTs são recursos reutilizáveis — crie uma, popule com as contas frequentes do seu protocolo e reutilize indefinidamente.",
  },

  keypair: {
    analogy:
      "Um keypair é o par chave pública/privada da sua identidade no Solana — a chave pública é seu endereço visível, a privada é o que você usa para assinar e nunca deve compartilhar.",
    builderUse:
      "Em scripts e CLIs, carregue keypairs de arquivos JSON locais. Em produção, use signers de hardware ou multisig. Nunca hardcode chaves privadas no código.",
    commonMistake:
      "Commitar arquivos de keypair no git ou expor chaves privadas em variáveis de ambiente sem proteção. Use `.gitignore` agressivo e gestores de segredo.",
  },

  "private-key": {
    analogy:
      "A chave privada é a senha mestra do Solana — quem a tem pode assinar qualquer transação como você, transferir todos os seus ativos, e não há banco central para reverter.",
    builderUse:
      "Nunca transmita, logue ou armazene chaves privadas em texto plano. Use hardware wallets (Ledger) para contas com valores significativos e multisig para tesouraria de protocolo.",
    commonMistake:
      "Usar a mesma chave privada como fee payer e como authority de programas críticos. Se a chave for comprometida, toda a autoridade sobre o protocolo vai junto.",
  },

  signature: {
    analogy:
      "Uma assinatura criptográfica prova que o dono de uma chave privada autorizou uma ação — como uma assinatura biométrica que só você pode fazer, mas qualquer um pode verificar.",
    builderUse:
      "Transações exigem assinatura do fee payer e de qualquer signer declarado. Em Anchor, contas marcadas com `#[account(signer)]` ou `Signer<'info>` são validadas automaticamente.",
    commonMistake:
      "Confundir 'assinatura de transação' (para executar on-chain) com 'assinatura de mensagem' (para autenticação off-chain). São operações criptográficas distintas com propósitos diferentes.",
  },

  "public-key-cryptography": {
    analogy:
      "Criptografia de chave pública é o fundamento matemático de toda identidade no Solana — um par de números relacionados onde o que um cifra só o outro pode decifrar, e uma assinatura com a privada pode ser verificada pela pública.",
    builderUse:
      "Entender o modelo ed25519 usado pelo Solana explica por que PDAs funcionam (pontos fora da curva) e por que multisig precisa de múltiplas chaves distintas.",
    commonMistake:
      "Assumir que derivar um endereço de uma chave pública é reversível. A derivação é unidirecional — você não pode calcular a chave privada a partir do endereço público.",
  },

  rent: {
    analogy:
      "Rent é o custo de alugar espaço no estado global do blockchain — cada byte armazenado em uma conta custa SOL. Pague o mínimo de uma vez (rent-exemption) e fica para sempre.",
    builderUse:
      "Calcular o depósito exato para rent-exemption ao criar contas novas para usuários, evitando que o runtime colete a conta por falta de saldo.",
    commonMistake:
      "Criar contas sem saldo suficiente para rent-exemption e assumir que vão persistir. Contas 'below rent-exempt minimum' podem ser coletadas pelo runtime.",
  },

  lamport: {
    analogy:
      "Lamports são os centavos do SOL — 1 SOL = 1 bilhão de lamports. Toda aritmética on-chain usa lamports para evitar ponto flutuante e garantir precisão exata.",
    builderUse:
      "Sempre trabalhe em lamports internamente nos seus programas. Use `LAMPORTS_PER_SOL` para conversões ao exibir para usuários. Nunca use floats para valores financeiros.",
    commonMistake:
      "Exibir lamports diretamente no frontend sem converter. 1.000.000 lamports = 0.001 SOL — erros de conversão geram experiências confusas e podem custar caro.",
  },

  blockhash: {
    analogy:
      "O blockhash é o 'timestamp de validade' de uma transação Solana — ela só é válida dentro de uma janela de ~150 slots (~1 minuto) do blockhash usado, prevenindo replays.",
    builderUse:
      "Sempre busque o blockhash mais recente imediatamente antes de montar a transação. Para fluxos de UI longos, implemente retry automático com blockhash fresco.",
    commonMistake:
      "Cachear blockhashes por mais de ~30 segundos. Transações com blockhash expirado falham com 'Blockhash not found' — difícil de debugar em produção.",
  },

  "compute-units": {
    analogy:
      "Compute Units são o gas do Solana, mas mais granulares e previsíveis: cada operação tem custo fixo em CUs, e cada transação tem limite de 1.4M CUs.",
    builderUse:
      "Otimizar CUs reduz o custo de priority fees e permite incluir mais instruções por transação. Use `SetComputeUnitLimit` para declarar o uso exato.",
    commonMistake:
      "Não solicitar CUs adicionais para transações complexas. O default de 200k CUs pode ser insuficiente para programas com loops ou múltiplos CPIs.",
  },

  "priority-fee": {
    analogy:
      "Priority fees são gorjetas pagas aos validators para processar sua transação mais rapidamente — como pagar extra para entrega expressa quando há fila na fila.",
    builderUse:
      "Em períodos de alta congestão, transações sem priority fee adequada ficam presas. Use APIs de fee estimativa (Helius, Jito) para pagar o mínimo necessário sem desperdiçar.",
    commonMistake:
      "Usar priority fee fixa para todas as situações. Em congestionamento alto, fees muito baixas resultam em transações descartadas. Em períodos calmos, fees altas são desperdício.",
  },

  serialization: {
    analogy:
      "Serialização é a tradução de dados de estruturas de memória para bytes que podem ser armazenados on-chain — como converter um objeto JavaScript em JSON para salvar em disco.",
    builderUse:
      "Entender serialização Borsh é fundamental para ler e escrever dados de contas corretamente, especialmente em programas nativos sem Anchor que abstraia isso.",
    commonMistake:
      "Usar order de campos diferente entre Rust e TypeScript. Borsh serializa em ordem de declaração — mismatches resultam em dados corrompidos silenciosamente.",
  },

  borsh: {
    analogy:
      "Borsh (Binary Object Representation Serializer for Hashing) é o formato de serialização padrão do Solana — compacto, determinístico e sem ambiguidade, como um protocolo binário bem definido.",
    builderUse:
      "Use `BorshSerialize` e `BorshDeserialize` em structs Rust para codificar/decodificar dados de contas. Anchor gera o discriminator de 8 bytes automaticamente.",
    commonMistake:
      "Tentar usar JSON ou outros formatos para dados on-chain. Borsh é obrigatório por eficiência — 8 bytes de overhead vs centenas em JSON para dados equivalentes.",
  },

  bpf: {
    analogy:
      "BPF (Berkeley Packet Filter) é a arquitetura de bytecode na qual programas Solana são compilados antes de rodar no runtime — como o Java bytecode que roda na JVM.",
    builderUse:
      "Compilar para BPF com `cargo build-sbf` e analisar o binary permite otimizar tamanho do programa (limite de 1.28MB deployado) e debugar erros de compilação crípticos.",
    commonMistake:
      "Confundir BPF com SBF (Solana Bytecode Format), o successor. Programas novos usam SBF — a terminologia mudou mas muitas ferramentas ainda referem 'BPF' no nome.",
  },

  // ── Anchor ────────────────────────────────────────────────────────────────
  anchor: {
    analogy:
      "Anchor é o Hardhat/Foundry do Solana — abstrai o boilerplate de segurança, serialização Borsh e validação de contas para você focar na lógica de negócio.",
    builderUse:
      "Gerar IDL automaticamente do código Rust, ter validação de contas declarativa com constraints, e usar o cliente TypeScript gerado para integrar no frontend.",
    commonMistake:
      "Pular constraints de validação de conta (`has_one`, `constraint`, `seeds`) por pressa para fazer algo funcionar. Isso abre vulnerabilidades sérias de autorização.",
  },

  cpi: {
    analogy:
      "CPI (Cross-Program Invocation) é como chamar uma função de uma biblioteca externa dentro do seu programa — seu código pode invocar outros programas on-chain durante execução.",
    builderUse:
      "Compor com protocolos existentes (Token Program, System Program, Metaplex, Jupiter) sem reimplementar funcionalidade — reutilize o que já está auditado.",
    commonMistake:
      "Não recarregar contas após um CPI que as modifica. O estado in-memory pode estar desatualizado após a chamada — use `reload()` em Anchor ou releia os bytes.",
  },

  // ── Token Ecosystem ───────────────────────────────────────────────────────
  "spl-token": {
    analogy:
      "SPL Token é o ERC-20 do Solana, mas centralizado em um único programa global: em vez de milhares de contratos de token, há um programa que gerencia todos os tokens fungíveis.",
    builderUse:
      "Criar tokens customizados, integrar pagamentos, ou construir qualquer protocolo DeFi que manipule tokens — tudo passa pelo mesmo Token Program.",
    commonMistake:
      "Tentar interagir diretamente com a conta mint em vez da Associated Token Account (ATA) do usuário. Sempre derive a ATA corretamente com `getAssociatedTokenAddress`.",
  },

  "associated-token-account": {
    analogy:
      "ATA (Associated Token Account) é o endereço de token determinístico para cada par (carteira, mint) — como um IBAN único derivado automaticamente para cada combinação usuário-token.",
    builderUse:
      "Derivar o endereço de token do usuário sem precisar armazená-lo off-chain. `getAssociatedTokenAddress(mint, owner)` sempre retorna o mesmo endereço.",
    commonMistake:
      "Assumir que a ATA já existe antes de tentar fazer um transfer. Sempre crie com `createAssociatedTokenAccountIdempotent` se puder não existir.",
  },

  mint: {
    analogy:
      "A conta Mint define um token no Solana — armazena supply total, decimais, mint authority e freeze authority. É o 'contrato de token' do ecossistema SPL.",
    builderUse:
      "Ao criar um token, você cria uma conta Mint e define quem pode emitir novos tokens (mint authority) e quem pode congelar contas (freeze authority).",
    commonMistake:
      "Perder ou revogar a mint authority sem intenção. Uma vez revogada, nenhum token adicional pode ser emitido — isso é permanente e pode ser catastrófico para tokenomics.",
  },

  "token-2022": {
    analogy:
      "Token-2022 é a versão extendida do Token Program que adiciona funcionalidades como transfer fees, confidential transfers e transfer hooks — como um token programável por natureza.",
    builderUse:
      "Use Token-2022 para implementar royalties on-chain via transfer fees, privacidade via confidential transfers, ou lógica customizada via transfer hooks sem precisar de wrapper.",
    commonMistake:
      "Assumir compatibilidade automática com dApps existentes. Muitos DEXs e wallets ainda não suportam todas as extensões do Token-2022 — verifique compatibilidade antes de lançar.",
  },

  nft: {
    analogy:
      "NFTs no Solana são tokens com supply de 1 e 0 decimais, acompanhados de metadados on-chain ou em Arweave/IPFS — a propriedade é verificável sem intermediários.",
    builderUse:
      "Use Metaplex Token Metadata para criar NFTs com metadados padronizados compatíveis com marketplaces. Compressed NFTs (cNFTs) reduzem custo de mint para frações de centavo.",
    commonMistake:
      "Armazenar imagens diretamente on-chain. O custo de storage em Solana proíbe isso na prática — use Arweave para permanência ou IPFS para custos menores.",
  },

  // ── DeFi ─────────────────────────────────────────────────────────────────
  amm: {
    analogy:
      "Um AMM (Automated Market Maker) é uma exchange que usa uma fórmula matemática para precificar ativos automaticamente — sem order book, sem market makers humanos, apenas liquidez em pool.",
    builderUse:
      "Integrar com AMMs via Jupiter abstrai a complexidade de escolher qual pool usar. Para construir um AMM, implemente a fórmula xy=k (constant product) ou CLMM para liquidez concentrada.",
    commonMistake:
      "Ignorar impermanent loss ao fornecer liquidez. Se os preços dos ativos divergirem significativamente, provedores de liquidez podem sair com menos valor do que entraram.",
  },

  swap: {
    analogy:
      "Um swap é a troca atômica de um token por outro — acontece em milissegundos on-chain com garantia matemática de execução ou falha total, sem risco de contraparte.",
    builderUse:
      "Use a Jupiter API para swaps na sua dApp: ela agrega liquidez de todos os DEXs do Solana e encontra o melhor preço automaticamente com um endpoint simples.",
    commonMistake:
      "Não configurar slippage tolerance adequado. Swaps com slippage muito baixo falham em mercados voláteis; muito alto expõe o usuário a price impact excessivo.",
  },

  slippage: {
    analogy:
      "Slippage é a diferença entre o preço esperado e o preço executado de um swap — como pedir um produto por R$100 e pagar R$102 porque o estoque era limitado.",
    builderUse:
      "Configure slippage tolerance baseado no par de ativos: tokens líquidos (SOL/USDC) permitem 0.5%, tokens illíquidos podem precisar de 1-3%. Implemente slippage dinâmico.",
    commonMistake:
      "Usar slippage de 100% ('accept any price') para evitar falhas de transação. Isso torna o usuário vulnerável a sandwich attacks de MEV que extraem valor máximo.",
  },

  tvl: {
    analogy:
      "TVL (Total Value Locked) é a soma de todos os ativos depositados em um protocolo DeFi — como o saldo total de uma cooperativa de crédito, indicando sua escala de adoção.",
    builderUse:
      "TVL é a métrica principal de adoção DeFi. Para calcular o seu, some os saldos de todas as contas de vault do seu protocolo e converta para USD usando preços de oracle.",
    commonMistake:
      "Usar TVL como única métrica de saúde. TVL pode ser artificialmente inflado com capital mercenário que sai assim que incentivos diminuem — analise também volume e retenção.",
  },

  lending: {
    analogy:
      "Protocolos de lending no Solana são bancos algorítmicos — você deposita ativos como colateral, toma emprestado outros ativos e paga juros determinados por oferta e demanda.",
    builderUse:
      "Integrar com protocolos como Kamino ou Marginfi para oferecer yield aos seus usuários sobre ativos ociosos, ou criar estratégias de leveraged yield com empréstimos flash.",
    commonMistake:
      "Subestimar o risco de liquidação em posições alavancadas. Em mercados voláteis, uma queda rápida de preço pode liquidar colateral antes que o usuário reaja.",
  },

  collateral: {
    analogy:
      "Colateral é o ativo bloqueado como garantia para um empréstimo — se você não pagar, o protocolo liquida automaticamente o colateral para cobrir a dívida, sem intervenção humana.",
    builderUse:
      "Ao implementar lending, defina loan-to-value (LTV) conservadores por asset class. Ativos voláteis (altcoins) precisam de LTV menor que ativos estáveis (SOL, USDC).",
    commonMistake:
      "Aceitar colateral com liquidez baixa. Um ativo illíquido como colateral não pode ser liquidado rapidamente sem impacto massivo no preço, criando bad debt para o protocolo.",
  },

  liquidation: {
    analogy:
      "Liquidação é o processo automático de venda forçada do colateral quando o valor cai abaixo do threshold de saúde — como um margin call que executa sem aviso.",
    builderUse:
      "Implemente liquidadores como bots autônomos que monitoram posições e executam liquidações quando o health factor cai abaixo de 1.0, lucrando o liquidation bonus.",
    commonMistake:
      "Deixar o threshold de liquidação muito próximo do LTV máximo. Sem buffer, movimentos de preço rápidos podem resultar em bad debt antes de liquidadores reagirem.",
  },

  "flash-loan": {
    analogy:
      "Flash loans são empréstimos sem colateral que devem ser devolvidos na mesma transação — como pegar dinheiro emprestado de manhã, fazer arbitragem e devolver tudo antes do fim do dia, atomicamente.",
    builderUse:
      "Use flash loans para arbitragem sem capital inicial, liquidações sem colateral, ou refinanciamento de posições. O empréstimo não tem risco para o protocolo pois é atômico.",
    commonMistake:
      "Achar que flash loans são inerentemente maliciosos. Eles são neutros — a maioria do uso é arbitragem legítima e liquidações saudáveis para o ecossistema.",
  },

  // ── Security ──────────────────────────────────────────────────────────────
  reentrancy: {
    analogy:
      "Reentrância no Solana é diferente do Ethereum: como o runtime proíbe chamadas circulares entre programas, o risco real é de 'reentrância cross-program' via CPIs que modificam contas compartilhadas.",
    builderUse:
      "Ao fazer CPIs, recarregue contas que possam ter sido modificadas antes de continuar a execução. Verifique o estado atual, não o estado em memória que pode estar desatualizado.",
    commonMistake:
      "Assumir que Solana não tem reentrância por proibir recursão direta. CPIs em cadeia podem criar padrões equivalentes se contas mutáveis forem compartilhadas entre programas.",
  },

  "integer-overflow": {
    analogy:
      "Integer overflow é quando uma soma ultrapassa o valor máximo de um tipo e 'dá a volta' — 255 + 1 = 0 em u8. Em programas financeiros, isso pode criar tokens do nada.",
    builderUse:
      "Use sempre aritmética checked em Rust (`checked_add`, `checked_sub`, `checked_mul`) e retorne erro explícito em vez de deixar overflow silencioso causar dano.",
    commonMistake:
      "Usar `as u64` para conversões sem verificar se o valor cabe. Truncamento silencioso em casts pode ser tão perigoso quanto overflow em lógica financeira.",
  },

  signer: {
    analogy:
      "Um signer é uma conta que assinou a transação com sua chave privada — é a prova criptográfica de que o dono da conta autorizou a operação.",
    builderUse:
      "Valide sempre que contas que deveriam ser o usuário são de fato signers. Em Anchor, use `Signer<'info>` ou `#[account(signer)]` para validação automática.",
    commonMistake:
      "Não verificar se uma conta é signer antes de executar operações privilegiadas em seu nome. Isso permite que qualquer um passe qualquer conta como 'usuário' sem autorização.",
  },

  "type-cosplay": {
    analogy:
      "Type cosplay é um ataque onde uma conta maliciosa se passa por outro tipo de conta — como apresentar uma carteira de estudante para conseguir desconto de idoso.",
    builderUse:
      "Use discriminators de Anchor (8 bytes no início de cada conta) para garantir que você está lendo o tipo correto de conta. Sempre verifique `account.discriminator`.",
    commonMistake:
      "Desserializar dados de uma conta sem verificar o discriminator primeiro. Um atacante pode passar uma conta com dados maliciosos que, sem verificação de tipo, parecem válidos.",
  },

  // ── Ecosystem ─────────────────────────────────────────────────────────────
  jupiter: {
    analogy:
      "Jupiter é o Google Maps do Solana para swaps — agrega todas as rotas de liquidez disponíveis e calcula automaticamente o caminho que dá o melhor preço.",
    builderUse:
      "Integre a Jupiter API v6 para swaps na sua dApp com uma única chamada REST: você recebe a melhor rota, quotas e a transação pronta para assinar.",
    commonMistake:
      "Construir roteamento próprio de DEX em vez de usar Jupiter. A liquidez agregada do Jupiter quase sempre supera rotas diretas — reinventar isso custa meses e resulta em pior execução.",
  },

  marinade: {
    analogy:
      "Marinade Finance é o principal protocolo de liquid staking do Solana — você deposita SOL, recebe mSOL (que representa SOL em staking) e pode usar mSOL em DeFi enquanto acumula rewards.",
    builderUse:
      "Aceite mSOL como colateral ou integre o stake pool da Marinade para oferecer yield nativo de staking aos seus usuários sem eles precisarem fazer unstake.",
    commonMistake:
      "Confundir o preço do mSOL com 1:1 de SOL. O mSOL aprecia em relação ao SOL conforme rewards se acumulam — use o exchange rate atualizado para conversões corretas.",
  },

  jito: {
    analogy:
      "Jito é a infraestrutura de MEV do Solana — permite enviar bundles de transações atômicos que garantem ordem de execução e distribuem parte do MEV de volta para validators.",
    builderUse:
      "Use Jito bundles para transações time-sensitive (liquidações, arbitragem) onde garantir posição no bloco é crítico. Pague tip em SOL para prioridade de execução.",
    commonMistake:
      "Usar Jito em todas as transações indiscriminadamente. O overhead de tip e latência extra de bundle simulation é desnecessário para transações de usuário comum sem competição de MEV.",
  },

  helius: {
    analogy:
      "Helius é o provedor de RPC premium do Solana com APIs especializadas — não apenas um endpoint de rede, mas ferramentas como webhooks, DAS API e priority fee estimativa.",
    builderUse:
      "Use Helius para webhooks de eventos on-chain (alertas quando uma carteira faz transação), DAS API para NFTs e tokens comprimidos, e RPC confiável em produção.",
    commonMistake:
      "Usar o RPC público da Solana Foundation em produção. Rate limits agressivos e menor uptime resultam em erros de usuário que uma conta Helius paga evita completamente.",
  },

  orca: {
    analogy:
      "Orca é um DEX do Solana focado em experiência do usuário com liquidez concentrada (Whirlpools) — como um AMM onde provedores de liquidez escolhem ranges de preço específicos para maximizar eficiência.",
    builderUse:
      "Integre Whirlpools da Orca para oferecer liquidez concentrada no seu protocolo — maior eficiência de capital que AMMs constant-product para pares de ativos correlacionados.",
    commonMistake:
      "Fornecer liquidez em ranges muito amplos para 'jogar seguro'. Ranges concentrados de liquidez (tight) têm 10-100x mais eficiência mas exigem rebalanceamento frequente.",
  },

  raydium: {
    analogy:
      "Raydium é um DEX híbrido do Solana que combina AMM com order book do OpenBook — provedores de liquidez se beneficiam tanto de trades AMM quanto de market making no order book.",
    builderUse:
      "Use Raydium para criar pools de liquidez para novos tokens com baixo custo de lançamento. A integração com OpenBook garante price discovery eficiente desde o início.",
    commonMistake:
      "Lançar pools com liquidez inicial insuficiente. Pools com pouca liquidez têm slippage alto, price impact de manipulação e afastam traders sérios — comece com liquidez adequada.",
  },

  squads: {
    analogy:
      "Squads é o protocolo de multisig do Solana — como um cofre compartilhado onde múltiplas chaves são necessárias para mover fundos, protegendo tesouraria e upgrades de protocolo.",
    builderUse:
      "Use Squads para proteger upgrade authority de programas, tesouraria de protocolo e qualquer operação administrativa crítica que não deve depender de um único ponto de falha.",
    commonMistake:
      "Manter upgrade authority de programa em uma única carteira pessoal em produção. Se comprometida ou perdida, você perde controle permanente sobre o protocolo.",
  },

  phantom: {
    analogy:
      "Phantom é a carteira mais popular do Solana — o browser extension que conecta usuários a dApps, assina transações e gerencia tokens e NFTs em uma interface familiar.",
    builderUse:
      "Use o Wallet Adapter do Solana para suportar Phantom e todas as outras carteiras com um único componente React — nunca integre diretamente com a API do Phantom.",
    commonMistake:
      "Hardcodar integração com Phantom ignorando outros wallets. Backpack, Solflare, Ledger e dezenas de outros também usam o Wallet Standard — use o adapter para suportar todos.",
  },

  tensor: {
    analogy:
      "Tensor é o marketplace de NFTs profissional do Solana — focado em traders com analytics avançado, order books, sweeps em lote e ferramentas de market making para coleções.",
    builderUse:
      "Integre a API do Tensor para mostrar listings de NFTs, floor prices e histórico de vendas no seu produto. O SDK permite executar compras e vendas programaticamente.",
    commonMistake:
      "Assumir que Magic Eden e Tensor têm os mesmos listings. Cada marketplace tem sua própria liquidez — use agregadores para garantir que está vendo todas as ofertas disponíveis.",
  },

  "magic-eden": {
    analogy:
      "Magic Eden é o maior marketplace de NFTs do Solana e também suporta Bitcoin Ordinals — o marketplace de adoção mais ampla, com mais vendedores casuais e compradores novatos.",
    builderUse:
      "Use a API pública do Magic Eden para buscar coleções, floor prices e listagens ativas. Para integrações mais profundas, o programa on-chain permite compras diretas.",
    commonMistake:
      "Confiar apenas nos dados de floor price do Magic Eden para avaliação de coleções. O floor pode ser manipulado com listagens falsas — verifique volume e histórico de vendas.",
  },

  rpc: {
    analogy:
      "Um RPC (Remote Procedure Call) node é a porta de entrada para o Solana — você faz chamadas JSON-RPC e ele responde com dados da blockchain ou executa transações.",
    builderUse:
      "Use RPCs pagos (Helius, QuickNode, Triton) para produção com SLA de uptime. Configure fallback entre múltiplos providers para evitar ponto único de falha.",
    commonMistake:
      "Usar o endpoint público `api.mainnet-beta.solana.com` em produção. Ele tem rate limits de 100 req/s, sem SLA e cai com frequência — inaceitável para qualquer produto sério.",
  },

  "wallet-general": {
    analogy:
      "Uma carteira blockchain não guarda tokens — guarda as chaves privadas que provam propriedade. Os ativos ficam on-chain; a carteira é apenas o controle de acesso.",
    builderUse:
      "Integre wallets via Wallet Adapter (@solana/wallet-adapter-react) para suportar todas as carteiras Solana com um único hook: `useWallet()` retorna publicKey e signTransaction.",
    commonMistake:
      "Pedir assinatura de transações desnecessárias ou com mensagens confusas. Usuários desconfiam de prompts de assinatura pouco claros — seja explícito sobre o que está sendo autorizado.",
  },

  "commitment-levels": {
    analogy:
      "Níveis de commitment no Solana são como graus de confiança: 'processed' é o rascunho, 'confirmed' é aprovado pela maioria, 'finalized' é o documento com força legal.",
    builderUse:
      "Use 'confirmed' para exibir saldos e status de transações na UI (rápido, seguro para a maioria dos casos). Use 'finalized' para liberar ativos de alto valor.",
    commonMistake:
      "Usar 'processed' para tudo por ser mais rápido. Transações processadas ainda podem ser revertidas — exibir saldos 'processed' pode mostrar valores que desaparecem logo depois.",
  },

  "compressed-account": {
    analogy:
      "Contas comprimidas usam ZK proofs e árvores de Merkle para armazenar milhões de ativos no estado mínimo on-chain — como comprimir 1.000 arquivos em um zip que prova que cada um existe.",
    builderUse:
      "Use cNFTs (compressed NFTs via Bubblegum) para mint em massa a custo de frações de centavo — ideal para airdrops, gaming items e tickets digitais em escala.",
    commonMistake:
      "Assumir que contas comprimidas são idênticas em performance a contas normais. Provar inclusão requer a merkle proof inteira, adicionando latência e payload à transação.",
  },

  "zk-proofs": {
    analogy:
      "Zero-Knowledge Proofs permitem provar que você sabe um segredo sem revelar o segredo — como provar que você tem mais de 18 anos sem mostrar sua data de nascimento.",
    builderUse:
      "ZK proofs no Solana habilitam contas comprimidas (Light Protocol), transfers confidenciais (Token-2022) e rollups de estado eficientes. Use syscalls otimizadas como `alt_bn128`.",
    commonMistake:
      "Subestimar o custo computacional de verificação de ZK proofs. Verificar uma prova on-chain consome muitos compute units — planeje o orçamento de CUs cuidadosamente.",
  },

  "metaplex-foundation": {
    analogy:
      "A Metaplex Foundation é a organização por trás do padrão de NFTs do Solana — como a W3C para HTML, define os padrões de metadata, royalties e coleções que todos os marketplaces respeitam.",
    builderUse:
      "Use os programas da Metaplex (Token Metadata, Bubblegum, Candy Machine) para criar NFTs com metadados padronizados compatíveis com todo o ecossistema — wallets, marketplaces e indexers.",
    commonMistake:
      "Criar um formato de metadata customizado para NFTs 'para evitar dependência'. Você perde compatibilidade com todos os marketplaces e wallets que esperam o padrão Metaplex.",
  },

  sbf: {
    analogy:
      "SBF (Solana Bytecode Format) é o successor do BPF — o formato de bytecode otimizado para o runtime do Solana com suporte a instruções SIMD que aumentam performance de programas.",
    builderUse:
      "Compile programas com `cargo build-sbf` (substitui `cargo build-bpf`). SBF permite uso de instruções SIMD para acelerar operações criptográficas e matemáticas intensivas.",
    commonMistake:
      "Usar `cargo build-bpf` em novos projetos. O comando está deprecado — projetos novos devem usar `cargo build-sbf` para aproveitar as otimizações do formato atual.",
  },

  "wallet-adapter": {
    analogy:
      "Wallet Adapter é o conector universal de carteiras do Solana — como um adaptador de tomada que funciona com qualquer carteira, sem integrar cada uma individualmente.",
    builderUse:
      "Use `@solana/wallet-adapter-react` e `<WalletMultiButton>` para ter suporte instantâneo a Phantom, Backpack, Solflare e dezenas de outras carteiras em qualquer dApp React.",
    commonMistake:
      "Integrar diretamente com a API do `window.solana` de um wallet específico. Isso quebra com outros wallets — sempre use o adapter layer para portabilidade.",
  },
};
