export interface TermContext {
  analogy: string; // "Como pensar sobre isso"
  builderUse: string; // "Por que builders usam"
  commonMistake: string; // "Erro comum"
}

export const TERM_CONTEXTS: Record<string, TermContext> = {
  "proof-of-history": {
    analogy:
      "Pense no PoH como um relógio criptográfico global — ele cria um registro verificável de que eventos ocorreram em uma sequência específica, sem precisar que todos os validadores concordem a cada passo.",
    builderUse:
      "Permite que transações sejam ordenadas e processadas em paralelo com alta certeza temporal, tornando possível o throughput de 50.000+ TPS do Solana.",
    commonMistake:
      "Confundir PoH com o mecanismo de consenso: PoH é um relógio, não um sistema de votação. O consenso real é feito pelo Tower BFT por cima do PoH.",
  },

  pda: {
    analogy:
      "Pense em PDAs como contas cujas chaves privadas simplesmente não existem — só o programa que as derivou pode 'assinar' por elas, tornando-as cofres perfeitos para guardar estado de programa.",
    builderUse:
      "Criar contas de estado determinísticas por usuário sem precisar gerenciar chaves privadas — o endereço é sempre derivável a partir de seeds conhecidas.",
    commonMistake:
      "Recalcular o canonical bump a cada instrução: armazene o bump na própria conta ao criá-la e reutilize-o. Recalcular gasta compute units desnecessários.",
  },

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

  instruction: {
    analogy:
      "Uma instrução é uma chamada de função para um programa on-chain: especifica qual programa executar, quais contas passar como argumentos, e os bytes de dados de entrada.",
    builderUse:
      "Compor múltiplas instruções de programas diferentes em uma única transação atômica — por exemplo, criar uma conta e inicializá-la em uma só transação.",
    commonMistake:
      "Passar contas na ordem errada. Programas Anchor validam a ordem via macros e retornam erros genéricos se a ordem não bater com o struct de contexto.",
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

  rent: {
    analogy:
      "Rent é o custo de alugar espaço no estado global do blockchain — cada byte armazenado em uma conta custa SOL. Pague o mínimo de uma vez (rent-exemption) e fica para sempre.",
    builderUse:
      "Calcular o depósito exato para rent-exemption ao criar contas novas para usuários, evitando que o runtime colete a conta por falta de saldo.",
    commonMistake:
      "Criar contas sem saldo suficiente para rent-exemption e assumir que vão persistir. Contas 'below rent-exempt minimum' podem ser coletadas pelo runtime.",
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

  "spl-token": {
    analogy:
      "SPL Token é o ERC-20 do Solana, mas centralizado em um único programa global: em vez de milhares de contratos de token, há um programa que gerencia todos os tokens fungíveis.",
    builderUse:
      "Criar tokens customizados, integrar pagamentos, ou construir qualquer protocolo DeFi que manipule tokens — tudo passa pelo mesmo Token Program.",
    commonMistake:
      "Tentar interagir diretamente com a conta mint em vez da Associated Token Account (ATA) do usuário. Sempre derive a ATA corretamente com `getAssociatedTokenAddress`.",
  },

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

  ata: {
    analogy:
      "ATA (Associated Token Account) é o endereço de token determinístico para cada par (carteira, mint) — como um IBAN único derivado automaticamente para cada combinação usuário-token.",
    builderUse:
      "Derivar o endereço de token do usuário sem precisar armazená-lo off-chain. `getAssociatedTokenAddress(mint, owner)` sempre retorna o mesmo endereço.",
    commonMistake:
      "Assumir que a ATA já existe antes de tentar fazer um transfer. Sempre crie com `createAssociatedTokenAccountIdempotent` se puder não existir.",
  },

  "compute-units": {
    analogy:
      "Compute Units são o gas do Solana, mas mais granulares e previsíveis: cada operação tem custo fixo em CUs, e cada transação tem limite de 1.4M CUs.",
    builderUse:
      "Otimizar CUs reduz o custo de priority fees e permite incluir mais instruções por transação. Use `SetComputeUnitLimit` para declarar o uso exato.",
    commonMistake:
      "Não solicitar CUs adicionais para transações complexas. O default de 200k CUs pode ser insuficiente para programas com loops ou múltiplos CPIs.",
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
};
