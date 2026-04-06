import type { Locale } from "./locales";

type Copy = {
  brand: {
    subtitle: string;
    footer: string;
  };
  nav: {
    home: string;
    explore: string;
    paths: string;
    learn: string;
    copilot: string;
    about: string;
    languageLabel: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
  };
  common: {
    terms: string;
    indexedTerms: string;
    query: string;
    alias: string;
    id: string;
    openTerm: string;
    openPath: string;
    openLearn: string;
    takeQuiz: string;
    backToExplore: string;
    builderPath: string;
    loadingExplore: string;
    resetFilters: string;
  };
  search: {
    label: string;
    description: string;
    placeholder: string;
    button: string;
    starterQueries: string[];
  };
  landing: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaExplore: string;
    ctaPaths: string;
    coverage: string;
    coverageBody: string;
    discovery: string;
    discoveryBody: string;
    locales: string;
    localesBody: string;
    whyExists: string;
    whyExistsBody: string;
    browseEyebrow: string;
    browseTitle: string;
    browseBody: string;
    builderEyebrow: string;
    builderTitle: string;
    builderBody: string;
    featuredEyebrow: string;
    featuredTitle: string;
    featuredBody: string;
    speed: string;
    speedBody: string;
    builderFocus: string;
    builderFocusBody: string;
    aiReady: string;
    aiReadyBody: string;
    previewEyebrow: string;
    previewTitle: string;
    previewBody: string;
    quickStartEyebrow: string;
    quickStartTitle: string;
    quickStartBody: string;
  };
  explore: {
    eyebrow: string;
    title: string;
    lead: string;
    searchLabel: string;
    placeholder: string;
    clear: string;
    resultSingular: string;
    resultPlural: string;
    visibleCategories: string;
    visibleCategoriesLead: string;
    quickStarts: string;
    quickStartsLead: string;
    noMatchesEyebrow: string;
    noMatchesTitle: string;
    noMatchesBody: string;
    filterLabel: string;
    allCategories: string;
  };
  term: {
    context: string;
    aiHandoff: string;
    aiHandoffLead: string;
    keepGoing: string;
    plainMeaning: string;
    plainMeaningLead: string;
    mentalModel: string;
    mentalModelLead: string;
    technicalContext: string;
    technicalContextLead: string;
    builderUse: string;
    builderUseLead: string;
    graphEyebrow: string;
    graphTitle: string;
    graphBody: string;
    graphBranch: string;
    nextExploreEyebrow: string;
    nextExploreTitle: string;
    nextExploreBody: string;
    previousInCategory: string;
    nextInCategory: string;
    relatedEyebrow: string;
    relatedTitle: string;
    relatedBody: string;
    confusedEyebrow: string;
    confusedTitle: string;
    confusedBody: string;
    noMappedRelationsEyebrow: string;
    noMappedRelationsTitle: string;
    noMappedRelationsBody: string;
    builderEyebrow: string;
    builderTitle: string;
    builderBody: string;
    moreInCategoryEyebrow: string;
    moreInCategoryTitle: string;
    moreInCategoryBody: string;
    copyLink: string;
    copyDefinition: string;
    copyContext: string;
    linkCopied: string;
    definitionCopied: string;
    contextCopied: string;
    clipboardFailed: string;
  };
  paths: {
    eyebrow: string;
    title: string;
    lead: string;
    pathEyebrow: string;
    detailEyebrow: string;
    startPath: string;
    sequenceEyebrow: string;
    sequenceTitle: string;
    sequenceLead: string;
    overview: string;
    idealFor: string;
    outcome: string;
    categories: string;
    startHere: string;
    nextPath: string;
    previousPath: string;
    workflowTitle: string;
    workflowStep1: string;
    workflowStep2: string;
    workflowStep3: string;
    quizCta: string;
    learnCta: string;
  };
  learn: {
    eyebrow: string;
    title: string;
    lead: string;
    newDevTitle: string;
    newDevBody: string;
    onboardingTitle: string;
    onboardingBody: string;
    quizTitle: string;
    quizBody: string;
    useCaseTitle: string;
    useCaseBody: string;
    startHere: string;
    recommendedOrder: string;
    progressLabel: string;
    questionLabel: string;
    scoreLabel: string;
    restartQuiz: string;
    finishTitle: string;
    finishBody: string;
    finishHighScore: string;
    finishMidScore: string;
    finishLowScore: string;
    reviewPath: string;
    continueLearning: string;
    answerCta: string;
    nextQuestion: string;
    oneCorrect: string;
    onboardingSteps: string[];
  };
  copilot: {
    eyebrow: string;
    title: string;
    lead: string;
    pageTitle: string;
    pageLead: string;
    pickerTitle: string;
    pickerBody: string;
    activeTermTitle: string;
    activeTermBody: string;
    switchTerm: string;
    openTermPage: string;
    questionLabel: string;
    questionPlaceholder: string;
    codeLabel: string;
    codeHint: string;
    codePlaceholder: string;
    submit: string;
    submitting: string;
    copyAnswer: string;
    answerCopied: string;
    copyFailed: string;
    errorTitle: string;
    genericError: string;
    loadingTitle: string;
    loadingBody: string;
    emptyTitle: string;
    emptyBody: string;
    explanationTitle: string;
    keyConceptsTitle: string;
    nextTermsTitle: string;
    caveatTitle: string;
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    pillarsTitle: string;
    pillars: Array<{ title: string; body: string }>;
    challengeTitle: string;
    challengeBody: string;
    integrationTitle: string;
    integrationBody: string;
    outcomesTitle: string;
    outcomes: string[];
  };
};

const copyByLocale: Record<Locale, Copy> = {
  en: {
    brand: {
      subtitle: "Solana vocabulary rebuilt for builders.",
      footer: "Built on top of the official Solana glossary data. Premium frontend for multilingual builders.",
    },
    nav: {
      home: "Home",
      explore: "Explore",
      paths: "Builder Paths",
      learn: "Learn",
      copilot: "Copilot",
      about: "About",
      languageLabel: "Language selector",
      themeLabel: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
    },
    common: {
      terms: "terms",
      indexedTerms: "indexed terms",
      query: "Query",
      alias: "Alias",
      id: "ID",
      openTerm: "Open term",
      openPath: "Open path",
      openLearn: "Open learn hub",
      takeQuiz: "Take quiz",
      backToExplore: "Back to explore",
      builderPath: "Builder Path",
      loadingExplore: "Loading explore...",
      resetFilters: "Reset filters",
    },
    search: {
      label: "Search the glossary",
      description: "Start with a protocol primitive, an Anchor term, a DeFi concept, or an agentic workflow keyword.",
      placeholder: "Search Proof of History, PDA, AMM, RPC, Anchor...",
      button: "Open glossary",
      starterQueries: ["proof of history", "pda", "anchor", "amm", "rpc", "rag"],
    },
    landing: {
      eyebrow: "The OG glossary is back",
      title: "Solana vocabulary, rebuilt for builders instead of docs drift.",
      lead: "Browse 1004 interconnected terms, jump across concepts, and learn the language of Solana through a surface that feels closer to a product map than a flat terminology page.",
      ctaExplore: "Explore all terms",
      ctaPaths: "Open builder paths",
      coverage: "Coverage",
      coverageBody: "Terms across protocol internals, dev tooling, DeFi, security, infra, and AI.",
      discovery: "Discovery",
      discoveryBody: "Editorial categories to turn lookup into navigation, not just search results.",
      locales: "Locales",
      localesBody: "Translation-ready routing so the hosted version can serve multilingual builders.",
      whyExists: "Why it exists",
      whyExistsBody: "The old Solana glossary helped people orient themselves quickly. This version is meant to restore that role while scaling to newer surfaces like consumer apps and agentic tooling.",
      browseEyebrow: "Browse by category",
      browseTitle: "Start with the layer you are actually building on.",
      browseBody: "Category blocks give the homepage structure immediately and make the glossary feel navigable before users even type.",
      builderEyebrow: "Builder paths",
      builderTitle: "Curated routes for Anchor, runtime, DeFi, and agents.",
      builderBody: "The point is not just to define terms. It is to sequence them so someone can build with less context switching.",
      featuredEyebrow: "Featured terms",
      featuredTitle: "Entries that define how people reason about Solana quickly.",
      featuredBody: "Spotlight terms give the landing page immediate utility even before the dedicated explore view gets the full instant-search treatment.",
      speed: "Understand fast",
      speedBody: "Start with the shortest useful explanation, then branch deeper only when you need more detail.",
      builderFocus: "Build with intent",
      builderFocusBody: "Move by workflow: Anchor, runtime, DeFi, agents, and the terms that actually matter inside each path.",
      aiReady: "AI-ready context",
      aiReadyBody: "Export compact context blocks grounded in glossary definitions instead of re-explaining Solana from scratch.",
      previewEyebrow: "Why this feels different",
      previewTitle: "A glossary that behaves more like a product map than a documentation appendix.",
      previewBody: "The goal is not just to search terms. It is to help someone understand what matters, what is related, and what to learn next.",
      quickStartEyebrow: "Start learning in one click",
      quickStartTitle: "Pick the part of Solana you want to understand first.",
      quickStartBody: "Jump straight into a guided path instead of starting from a blank search box.",
    },
    explore: {
      eyebrow: "Explore",
      title: "Find any term in seconds.",
      lead: "Search across term names, aliases, IDs, and definitions. Results update as you type and the URL stays shareable.",
      searchLabel: "Search glossary terms",
      placeholder: "Search PDA, account compression, Jupiter, rent, validator...",
      clear: "Clear",
      resultSingular: "result",
      resultPlural: "results",
      visibleCategories: "Visible categories",
      visibleCategoriesLead: "Distribution updates with the current result set.",
      quickStarts: "Quick starts",
      quickStartsLead: "Fast entry points when you want orientation without typing much.",
      noMatchesEyebrow: "No matches",
      noMatchesTitle: "No glossary terms matched that query.",
      noMatchesBody: "Try a shorter phrase, use a common alias like PDA or PoH, or jump from one of the quick-start terms.",
      filterLabel: "Filter by category",
      allCategories: "All categories",
    },
    term: {
      context: "Context",
      aiHandoff: "AI handoff",
      aiHandoffLead: "Use this compact block when you want to give an agent or assistant grounded context without dumping the entire page.",
      keepGoing: "Keep going",
      plainMeaning: "Plain meaning",
      plainMeaningLead: "Start with the shortest useful explanation before going deeper.",
      mentalModel: "Mental model",
      mentalModelLead: "Use the quick analogy first so the term is easier to reason about when you meet it in code, docs, or prompts.",
      technicalContext: "Technical context",
      technicalContextLead: "Place the term inside its Solana layer so the definition is easier to reason about.",
      builderUse: "Why builders care",
      builderUseLead: "Turn the term from vocabulary into something operational for product and engineering work.",
      graphEyebrow: "Concept graph",
      graphTitle: "See the term as part of a network, not a dead-end definition.",
      graphBody: "These branches show which concepts this term touches directly and what sits one layer beyond them.",
      graphBranch: "Branch",
      nextExploreEyebrow: "Next concepts to explore",
      nextExploreTitle: "Keep the learning chain moving instead of stopping at one definition.",
      nextExploreBody: "These are the next concepts worth opening if you want this term to make more sense inside a real Solana workflow.",
      previousInCategory: "Previous in category",
      nextInCategory: "Next in category",
      relatedEyebrow: "Related terms",
      relatedTitle: "Follow the concepts that give this term its actual context.",
      relatedBody: "Glossary entries become useful when they are connected. These links are the shortest path to adjacent ideas.",
      confusedEyebrow: "Commonly confused with",
      confusedTitle: "Terms nearby in vocabulary, acronym, or conceptual neighborhood.",
      confusedBody: "These entries are easy to mix up when you are reading quickly, prompting an LLM, or onboarding into a new layer of Solana.",
      noMappedRelationsEyebrow: "No mapped relations",
      noMappedRelationsTitle: "This entry does not have related terms yet.",
      noMappedRelationsBody: "Use the category continuation below to keep navigating nearby concepts.",
      builderEyebrow: "Builder paths",
      builderTitle: "This term is part of a curated learning route.",
      builderBody: "Use these paths when you want to move from isolated lookup into guided exploration.",
      moreInCategoryEyebrow: "More in category",
      moreInCategoryTitle: "Stay in the same layer and keep building context.",
      moreInCategoryBody: "These entries live beside the current term and help the page feel like part of a larger knowledge graph instead of a dead end.",
      copyLink: "Copy link",
      copyDefinition: "Copy definition",
      copyContext: "Copy AI context",
      linkCopied: "Link copied",
      definitionCopied: "Definition copied",
      contextCopied: "AI context copied",
      clipboardFailed: "Clipboard failed",
    },
    paths: {
      eyebrow: "Builder paths scaffold",
      title: "Editorial paths are already modeled in the app layer.",
      lead: "Each path has its own slug, description, accent, and ordered list of glossary terms. That keeps the later onboarding mode small and easy to iterate on.",
      pathEyebrow: "Path",
      detailEyebrow: "Builder path",
      startPath: "Start path",
      sequenceEyebrow: "Path sequence",
      sequenceTitle: "Follow the terms in order and branch deeper when needed.",
      sequenceLead: "The path is sequenced to reduce context switching. Start at the top, open each term, and use related links when a concept needs more depth.",
      overview: "Overview",
      idealFor: "Ideal for",
      outcome: "Outcome",
      categories: "Categories covered",
      startHere: "Start here",
      nextPath: "Next path",
      previousPath: "Previous path",
      workflowTitle: "How to use this path",
      workflowStep1: "Read the path in order instead of jumping randomly between terms.",
      workflowStep2: "Open term pages whenever a concept needs definitions, aliases, and related links.",
      workflowStep3: "Use related terms and category continuation to go deeper without losing the path context.",
      quizCta: "Take path quiz",
      learnCta: "Open onboarding flow",
    },
    learn: {
      eyebrow: "Learning mode",
      title: "Start from zero, then build confidence with guided paths and quick quizzes.",
      lead: "This layer turns the glossary into onboarding: choose a path, move through the terms in order, and validate understanding with lightweight quiz rounds.",
      newDevTitle: "New to Solana?",
      newDevBody: "Start with Runtime if you need the chain mental model first, then move into Anchor or DeFi depending on what you want to ship.",
      onboardingTitle: "How onboarding works",
      onboardingBody: "Pick a builder path, read the sequence in order, open terms when you need more depth, then use the quiz to check whether the vocabulary actually stuck.",
      quizTitle: "Interactive path quizzes",
      quizBody: "Each path gets a short multiple-choice quiz generated from glossary definitions and adjacent terms. The goal is quick reinforcement, not exam-mode friction.",
      useCaseTitle: "Navigate by use case",
      useCaseBody: "Start from the job you actually want to do, then follow the terms, path, and learning flow attached to that outcome.",
      startHere: "Recommended first stop",
      recommendedOrder: "Recommended order",
      progressLabel: "Progress",
      questionLabel: "Question",
      scoreLabel: "Score",
      restartQuiz: "Restart quiz",
      finishTitle: "Quiz complete",
      finishBody: "Use the score to decide whether to continue into the next path or review the current sequence again.",
      finishHighScore: "Strong result. You can move forward to the next path and use term pages only for reinforcement.",
      finishMidScore: "Solid progress. Review the path once more and reopen the terms that felt fuzzy before moving on.",
      finishLowScore: "You should revisit the path sequence and reopen the key term pages before continuing.",
      reviewPath: "Review path",
      continueLearning: "Continue learning",
      answerCta: "Check answer",
      nextQuestion: "Next question",
      oneCorrect: "One correct answer",
      onboardingSteps: [
        "Choose the path closest to what you want to build.",
        "Read the path sequence in order and open terms when needed.",
        "Take the quiz to reinforce vocabulary before moving on.",
      ],
    },
    copilot: {
      eyebrow: "Glossary Copilot",
      title: "Ask grounded Solana questions directly inside the term page.",
      lead: "This panel turns the glossary into a context-aware AI interface. It uses the current term, related concepts, confusions, next steps, and optional code snippets to answer with grounded developer explanations.",
      pageTitle: "Glossary Copilot, outside the term page.",
      pageLead: "Use this workspace when you want to interrogate Solana concepts more freely. Pick a glossary term, ask a question, and keep the answer grounded in the official glossary graph.",
      pickerTitle: "Choose the concept you want to anchor the answer to.",
      pickerBody: "The Copilot works best when it starts from a glossary node. Switch terms here before asking broader questions or pasting code.",
      activeTermTitle: "Active glossary anchor",
      activeTermBody: "The selected term defines the first layer of retrieval context for the answer.",
      switchTerm: "Switch term",
      openTermPage: "Open term page",
      questionLabel: "Question",
      questionPlaceholder: "Ask how this concept works, when to use it, or how it connects to the rest of Solana.",
      codeLabel: "Explain this code",
      codeHint: "Optional. Paste Anchor or Solana code and the Copilot will map detected concepts back to the glossary before answering.",
      codePlaceholder: "Paste Anchor or Solana code here to get a glossary-grounded explanation.",
      submit: "Ask AI",
      submitting: "Thinking...",
      copyAnswer: "Copy answer",
      answerCopied: "Answer copied",
      copyFailed: "Clipboard failed",
      errorTitle: "Copilot error",
      genericError: "The Copilot could not answer right now.",
      loadingTitle: "Grounding answer",
      loadingBody: "Glossary Copilot is building context and composing a response.",
      emptyTitle: "Ask about this term",
      emptyBody: "Start with a concrete Solana question. You can also attach a code snippet if you want a more implementation-oriented explanation.",
      explanationTitle: "Explanation",
      keyConceptsTitle: "Key concepts",
      nextTermsTitle: "Suggested next terms",
      caveatTitle: "Scope note",
    },
    about: {
      eyebrow: "About this frontend",
      title: "A Solana glossary frontend built as a navigation system for builders.",
      lead: "This project is the product layer for the glossary challenge: a hostable, multilingual frontend that turns the official term dataset into discovery, onboarding, and builder-oriented context.",
      pillarsTitle: "What this frontend is optimizing for",
      pillars: [
        {
          title: "Fast understanding",
          body: "The landing page, instant search, and term pages are designed to reduce time-to-context, not just expose raw definitions.",
        },
        {
          title: "Builder navigation",
          body: "Builder paths, related terms, category continuation, and next concepts turn the glossary into guided exploration instead of flat lookup.",
        },
        {
          title: "AI-ready context",
          body: "Term pages can export compact context blocks so the glossary becomes useful inside agent workflows, not only in-browser reading.",
        },
      ],
      challengeTitle: "Why this fits the hackathon",
      challengeBody: "The challenge asks for something searchable, browsable, beautiful, and genuinely useful on top of the glossary SDK/data. This frontend is meant to be that hostable surface: multilingual, polished, and focused on understanding Solana faster.",
      integrationTitle: "How it uses the glossary data",
      integrationBody: "The app reads the official glossary data from this repository and builds its pages around term IDs, definitions, aliases, localized content, categories, and mapped relationships. The routing and UI layers stay separate from the data layer so the frontend can evolve without breaking the glossary source.",
      outcomesTitle: "What the product already delivers",
      outcomes: [
        "Instant term discovery across names, aliases, IDs, and definitions.",
        "Builder paths for Anchor, Runtime, DeFi, and Agents.",
        "Localized browsing in English, Portuguese, and Spanish.",
        "Term pages with related concepts, confused neighbors, and AI handoff context.",
      ],
    },
  },
  pt: {
    brand: {
      subtitle: "Vocabulário de Solana reconstruído para builders.",
      footer: "Construído sobre os dados oficiais do glossário Solana. Frontend premium para builders multilíngues.",
    },
    nav: {
      home: "Início",
      explore: "Explorar",
      paths: "Trilhas",
      learn: "Aprender",
      copilot: "Copilot",
      about: "Sobre",
      languageLabel: "Seletor de idioma",
      themeLabel: "Tema",
      themeLight: "Claro",
      themeDark: "Escuro",
    },
    common: {
      terms: "termos",
      indexedTerms: "termos indexados",
      query: "Busca",
      alias: "Alias",
      id: "ID",
      openTerm: "Abrir termo",
      openPath: "Abrir trilha",
      openLearn: "Abrir hub de aprendizagem",
      takeQuiz: "Fazer quiz",
      backToExplore: "Voltar para explorar",
      builderPath: "Trilha",
      loadingExplore: "Carregando exploração...",
      resetFilters: "Resetar filtros",
    },
    search: {
      label: "Buscar no glossário",
      description: "Comece por um primitivo de protocolo, um termo de Anchor, um conceito de DeFi ou uma palavra-chave de workflow agentic.",
      placeholder: "Busque Proof of History, PDA, AMM, RPC, Anchor...",
      button: "Abrir glossário",
      starterQueries: ["proof of history", "pda", "anchor", "amm", "rpc", "rag"],
    },
    landing: {
      eyebrow: "O glossário OG está de volta",
      title: "Vocabulário de Solana, reconstruído para builders em vez de virar deriva de docs.",
      lead: "Navegue por 1004 termos interconectados, salte entre conceitos e aprenda a linguagem de Solana por uma superfície que se parece mais com um mapa de produto do que com uma página fria de terminologia.",
      ctaExplore: "Explorar todos os termos",
      ctaPaths: "Abrir trilhas",
      coverage: "Cobertura",
      coverageBody: "Termos sobre protocolo, tooling, DeFi, segurança, infraestrutura e IA.",
      discovery: "Descoberta",
      discoveryBody: "Categorias editoriais que transformam lookup em navegação, não só resultado de busca.",
      locales: "Idiomas",
      localesBody: "Roteamento pronto para tradução para servir builders em vários idiomas.",
      whyExists: "Por que existe",
      whyExistsBody: "O glossário antigo da Solana ajudava as pessoas a se orientarem rápido. Esta versão quer recuperar esse papel e escalar para superfícies como consumer apps e tooling agentic.",
      browseEyebrow: "Navegar por categoria",
      browseTitle: "Comece pela camada em que você realmente está construindo.",
      browseBody: "Os blocos de categoria dão estrutura imediata à home e fazem o glossário parecer navegável antes mesmo de qualquer busca.",
      builderEyebrow: "Trilhas",
      builderTitle: "Rotas curadas para Anchor, runtime, DeFi e agentes.",
      builderBody: "O objetivo não é só definir termos. É sequenciá-los para que alguém consiga construir com menos troca de contexto.",
      featuredEyebrow: "Termos em destaque",
      featuredTitle: "Entradas que moldam como as pessoas entendem Solana rapidamente.",
      featuredBody: "Os destaques dão utilidade imediata à landing antes mesmo da explore page receber a experiência completa de busca instantânea.",
      speed: "Entenda rápido",
      speedBody: "Comece pela explicação mais curta e útil, depois aprofunde só quando precisar de mais detalhe.",
      builderFocus: "Construa com intenção",
      builderFocusBody: "Navegue por workflow: Anchor, runtime, DeFi, agentes e os termos que realmente importam dentro de cada trilha.",
      aiReady: "Contexto para IA",
      aiReadyBody: "Exporte blocos compactos de contexto ancorados no glossário em vez de reexplicar Solana do zero.",
      previewEyebrow: "Por que isso é diferente",
      previewTitle: "Um glossário que se comporta mais como um mapa de produto do que como um apêndice de documentação.",
      previewBody: "O objetivo não é só buscar termos. É ajudar alguém a entender o que importa, o que se conecta e o que aprender depois.",
      quickStartEyebrow: "Comece a aprender com um clique",
      quickStartTitle: "Escolha a parte de Solana que você quer entender primeiro.",
      quickStartBody: "Entre direto em uma trilha guiada em vez de começar de uma busca vazia.",
    },
    explore: {
      eyebrow: "Explorar",
      title: "Encontre qualquer termo em segundos.",
      lead: "Busque por nomes, aliases, IDs e definições. Os resultados atualizam enquanto você digita e a URL continua compartilhável.",
      searchLabel: "Buscar termos do glossário",
      placeholder: "Busque PDA, account compression, Jupiter, rent, validator...",
      clear: "Limpar",
      resultSingular: "resultado",
      resultPlural: "resultados",
      visibleCategories: "Categorias visíveis",
      visibleCategoriesLead: "A distribuição é atualizada conforme o conjunto atual de resultados.",
      quickStarts: "Começos rápidos",
      quickStartsLead: "Pontos de entrada rápidos quando você quer se orientar sem digitar muito.",
      noMatchesEyebrow: "Sem resultados",
      noMatchesTitle: "Nenhum termo do glossário correspondeu à busca.",
      noMatchesBody: "Tente uma frase menor, use um alias comum como PDA ou PoH, ou parta de um dos termos sugeridos.",
      filterLabel: "Filtrar por categoria",
      allCategories: "Todas as categorias",
    },
    term: {
      context: "Contexto",
      aiHandoff: "Handoff para IA",
      aiHandoffLead: "Use este bloco compacto quando quiser dar contexto aterrado para um agente ou assistente sem despejar a página inteira.",
      keepGoing: "Continue",
      plainMeaning: "Leitura rápida",
      plainMeaningLead: "Comece pela explicação mais curta e útil antes de aprofundar.",
      mentalModel: "Modelo mental",
      mentalModelLead: "Use primeiro a analogia curta para raciocinar melhor sobre o termo quando ele aparecer em código, docs ou prompts.",
      technicalContext: "Contexto técnico",
      technicalContextLead: "Coloque o termo dentro da camada de Solana em que ele vive para raciocinar melhor sobre ele.",
      builderUse: "Por que builders ligam para isso",
      builderUseLead: "Transforme o termo de vocabulário em algo operacional para produto e engenharia.",
      graphEyebrow: "Grafo conceitual",
      graphTitle: "Veja o termo como parte de uma rede, não como uma definição sem saída.",
      graphBody: "Esses ramos mostram quais conceitos esse termo toca diretamente e o que existe uma camada além deles.",
      graphBranch: "Ramo",
      nextExploreEyebrow: "Próximos conceitos para explorar",
      nextExploreTitle: "Continue a cadeia de aprendizado em vez de parar em uma única definição.",
      nextExploreBody: "Estes são os próximos conceitos que valem abrir se você quiser que este termo faça mais sentido dentro de um workflow real de Solana.",
      previousInCategory: "Anterior na categoria",
      nextInCategory: "Próximo na categoria",
      relatedEyebrow: "Termos relacionados",
      relatedTitle: "Siga os conceitos que realmente dão contexto a este termo.",
      relatedBody: "Entradas de glossário só ficam úteis quando estão conectadas. Esses links são o caminho mais curto para ideias adjacentes.",
      confusedEyebrow: "Comumente confundido com",
      confusedTitle: "Termos próximos em vocabulário, sigla ou vizinhança conceitual.",
      confusedBody: "Essas entradas são fáceis de misturar quando você lê rápido, faz prompting em um LLM ou está entrando em uma nova camada de Solana.",
      noMappedRelationsEyebrow: "Sem relações mapeadas",
      noMappedRelationsTitle: "Esta entrada ainda não tem termos relacionados.",
      noMappedRelationsBody: "Use a continuação da categoria abaixo para continuar navegando por conceitos próximos.",
      builderEyebrow: "Trilhas",
      builderTitle: "Este termo faz parte de uma rota curada de aprendizado.",
      builderBody: "Use essas trilhas quando quiser sair do lookup isolado e entrar em uma exploração guiada.",
      moreInCategoryEyebrow: "Mais na categoria",
      moreInCategoryTitle: "Permaneça na mesma camada e continue construindo contexto.",
      moreInCategoryBody: "Essas entradas vivem ao lado do termo atual e ajudam a página a parecer parte de um grafo maior, não um beco sem saída.",
      copyLink: "Copiar link",
      copyDefinition: "Copiar definição",
      copyContext: "Copiar contexto para IA",
      linkCopied: "Link copiado",
      definitionCopied: "Definição copiada",
      contextCopied: "Contexto para IA copiado",
      clipboardFailed: "Falha ao copiar",
    },
    paths: {
      eyebrow: "Base das trilhas",
      title: "As trilhas editoriais já estão modeladas na camada do app.",
      lead: "Cada trilha tem slug, descrição, destaque visual e lista ordenada de termos. Isso mantém o modo de onboarding pequeno e fácil de iterar.",
      pathEyebrow: "Trilha",
      detailEyebrow: "Trilha",
      startPath: "Começar trilha",
      sequenceEyebrow: "Sequência da trilha",
      sequenceTitle: "Siga os termos em ordem e aprofunde quando precisar.",
      sequenceLead: "A trilha foi organizada para reduzir troca de contexto. Comece do topo, abra cada termo e use os links relacionados quando um conceito precisar de mais profundidade.",
      overview: "Visão geral",
      idealFor: "Ideal para",
      outcome: "Resultado",
      categories: "Categorias cobertas",
      startHere: "Comece por aqui",
      nextPath: "Próxima trilha",
      previousPath: "Trilha anterior",
      workflowTitle: "Como usar esta trilha",
      workflowStep1: "Leia a trilha em ordem em vez de saltar aleatoriamente entre termos.",
      workflowStep2: "Abra as páginas de termo sempre que um conceito precisar de definição, aliases e links relacionados.",
      workflowStep3: "Use termos relacionados e a continuação por categoria para aprofundar sem perder o contexto da trilha.",
      quizCta: "Fazer quiz da trilha",
      learnCta: "Abrir fluxo de onboarding",
    },
    learn: {
      eyebrow: "Modo de aprendizagem",
      title: "Comece do zero e ganhe confiança com trilhas guiadas e quizzes rápidos.",
      lead: "Esta camada transforma o glossário em onboarding: escolha uma trilha, avance pelos termos em ordem e valide o entendimento com rodadas leves de quiz.",
      newDevTitle: "Novo em Solana?",
      newDevBody: "Comece por Runtime se você precisa do modelo mental da chain primeiro, depois avance para Anchor ou DeFi conforme o que quer construir.",
      onboardingTitle: "Como o onboarding funciona",
      onboardingBody: "Escolha uma builder path, leia a sequência em ordem, abra termos quando precisar de mais profundidade e depois use o quiz para validar se o vocabulário realmente ficou.",
      quizTitle: "Quizzes interativos por trilha",
      quizBody: "Cada trilha recebe um quiz curto de múltipla escolha gerado a partir das definições do glossário e termos adjacentes. O objetivo é reforço rápido, não fricção de prova.",
      useCaseTitle: "Navegue por caso de uso",
      useCaseBody: "Comece pelo trabalho real que você quer fazer e depois siga os termos, a trilha e o fluxo de aprendizagem ligados a esse objetivo.",
      startHere: "Primeira parada recomendada",
      recommendedOrder: "Ordem recomendada",
      progressLabel: "Progresso",
      questionLabel: "Pergunta",
      scoreLabel: "Pontuação",
      restartQuiz: "Reiniciar quiz",
      finishTitle: "Quiz concluído",
      finishBody: "Use a pontuação para decidir se avança para a próxima trilha ou se revisa a sequência atual.",
      finishHighScore: "Resultado forte. Você já pode avançar para a próxima trilha e usar as páginas de termo só como reforço.",
      finishMidScore: "Bom progresso. Vale revisar a trilha mais uma vez e reabrir os termos que ainda ficaram nebulosos.",
      finishLowScore: "O melhor próximo passo é revisitar a sequência da trilha e reabrir as páginas de termo principais antes de seguir.",
      reviewPath: "Revisar trilha",
      continueLearning: "Continuar aprendendo",
      answerCta: "Validar resposta",
      nextQuestion: "Próxima pergunta",
      oneCorrect: "Uma resposta correta",
      onboardingSteps: [
        "Escolha a trilha mais próxima do que você quer construir.",
        "Leia a sequência em ordem e abra os termos quando precisar.",
        "Faça o quiz para reforçar o vocabulário antes de seguir.",
      ],
    },
    copilot: {
      eyebrow: "Glossary Copilot",
      title: "Faça perguntas de Solana com contexto direto na página do termo.",
      lead: "Este painel transforma o glossário em uma interface de IA orientada por contexto. Ele usa o termo atual, conceitos relacionados, confusões comuns, próximos passos e snippets de código opcionais para responder com explicações aterradas para devs.",
      pageTitle: "Glossary Copilot fora da página do termo.",
      pageLead: "Use este workspace quando quiser interrogar conceitos de Solana com mais liberdade. Escolha um termo do glossário, faça a pergunta e mantenha a resposta grounded no grafo oficial do glossário.",
      pickerTitle: "Escolha o conceito que vai ancorar a resposta.",
      pickerBody: "O Copilot funciona melhor quando começa de um nó do glossário. Troque de termo aqui antes de fazer perguntas mais amplas ou colar código.",
      activeTermTitle: "Âncora ativa do glossário",
      activeTermBody: "O termo selecionado define a primeira camada de contexto recuperado para a resposta.",
      switchTerm: "Trocar termo",
      openTermPage: "Abrir página do termo",
      questionLabel: "Pergunta",
      questionPlaceholder: "Pergunte como esse conceito funciona, quando usar ou como ele se conecta ao resto de Solana.",
      codeLabel: "Explique este código",
      codeHint: "Opcional. Cole código Anchor ou Solana e o Copilot vai mapear os conceitos detectados de volta para o glossário antes de responder.",
      codePlaceholder: "Cole aqui um trecho de código Anchor ou Solana para receber uma explicação grounded no glossário.",
      submit: "Perguntar para IA",
      submitting: "Pensando...",
      copyAnswer: "Copiar resposta",
      answerCopied: "Resposta copiada",
      copyFailed: "Falha ao copiar",
      errorTitle: "Erro do Copilot",
      genericError: "O Copilot não conseguiu responder agora.",
      loadingTitle: "Aterrando a resposta",
      loadingBody: "O Glossary Copilot está montando o contexto e compondo a resposta.",
      emptyTitle: "Pergunte sobre este termo",
      emptyBody: "Comece com uma pergunta concreta sobre Solana. Você também pode anexar um snippet de código se quiser uma explicação mais orientada à implementação.",
      explanationTitle: "Explicação",
      keyConceptsTitle: "Conceitos-chave",
      nextTermsTitle: "Próximos termos sugeridos",
      caveatTitle: "Nota de escopo",
    },
    about: {
      eyebrow: "Sobre este frontend",
      title: "Um frontend do glossário Solana construído como sistema de navegação para builders.",
      lead: "Este projeto é a camada de produto do challenge: um frontend hosteável e multilíngue que transforma o dataset oficial do glossário em descoberta, onboarding e contexto orientado a build.",
      pillarsTitle: "O que este frontend está otimizando",
      pillars: [
        {
          title: "Entendimento rápido",
          body: "A landing, a busca instantânea e as páginas de termo foram desenhadas para reduzir o tempo até o contexto, não só expor definições cruas.",
        },
        {
          title: "Navegação para builders",
          body: "Builder paths, related terms, continuação por categoria e próximos conceitos transformam o glossário em exploração guiada em vez de lookup plano.",
        },
        {
          title: "Contexto para IA",
          body: "As páginas de termo conseguem exportar blocos compactos de contexto para que o glossário também seja útil dentro de workflows com agentes.",
        },
      ],
      challengeTitle: "Por que isso encaixa no hackathon",
      challengeBody: "O challenge pede algo pesquisável, navegável, bonito e genuinamente útil em cima do SDK/dados do glossário. Este frontend tenta ser exatamente essa superfície hosteável: multilíngue, polida e focada em entender Solana mais rápido.",
      integrationTitle: "Como usa os dados do glossário",
      integrationBody: "A app lê os dados oficiais do glossário deste repositório e monta as páginas a partir de IDs, definições, aliases, conteúdo localizado, categorias e relações mapeadas. A camada de rotas e UI fica separada da camada de dados, então o frontend pode evoluir sem quebrar a fonte do glossário.",
      outcomesTitle: "O que o produto já entrega",
      outcomes: [
        "Descoberta instantânea de termos por nome, alias, ID e definição.",
        "Builder paths para Anchor, Runtime, DeFi e Agents.",
        "Navegação localizada em inglês, português e espanhol.",
        "Páginas de termo com conceitos relacionados, termos confundíveis e contexto para AI handoff.",
      ],
    },
  },
  es: {
    brand: {
      subtitle: "Vocabulario de Solana reconstruido para builders.",
      footer: "Construido sobre los datos oficiales del glosario de Solana. Frontend premium para builders multilingües.",
    },
    nav: {
      home: "Inicio",
      explore: "Explorar",
      paths: "Rutas",
      learn: "Aprender",
      copilot: "Copilot",
      about: "Acerca de",
      languageLabel: "Selector de idioma",
      themeLabel: "Tema",
      themeLight: "Claro",
      themeDark: "Oscuro",
    },
    common: {
      terms: "términos",
      indexedTerms: "términos indexados",
      query: "Búsqueda",
      alias: "Alias",
      id: "ID",
      openTerm: "Abrir término",
      openPath: "Abrir ruta",
      openLearn: "Abrir hub de aprendizaje",
      takeQuiz: "Hacer quiz",
      backToExplore: "Volver a explorar",
      builderPath: "Ruta",
      loadingExplore: "Cargando exploración...",
      resetFilters: "Reiniciar filtros",
    },
    search: {
      label: "Buscar en el glosario",
      description: "Empieza por un primitivo del protocolo, un término de Anchor, un concepto de DeFi o una palabra clave de workflow agentic.",
      placeholder: "Busca Proof of History, PDA, AMM, RPC, Anchor...",
      button: "Abrir glosario",
      starterQueries: ["proof of history", "pda", "anchor", "amm", "rpc", "rag"],
    },
    landing: {
      eyebrow: "El glosario OG está de vuelta",
      title: "Vocabulario de Solana, reconstruido para builders en lugar de perderse en docs genéricas.",
      lead: "Explora 1004 términos interconectados, salta entre conceptos y aprende el lenguaje de Solana a través de una superficie que se siente más como un mapa de producto que como una página plana de terminología.",
      ctaExplore: "Explorar todos los términos",
      ctaPaths: "Abrir rutas",
      coverage: "Cobertura",
      coverageBody: "Términos sobre protocolo, tooling, DeFi, seguridad, infraestructura e IA.",
      discovery: "Descubrimiento",
      discoveryBody: "Categorías editoriales para convertir lookup en navegación, no solo en resultados de búsqueda.",
      locales: "Idiomas",
      localesBody: "Ruteo listo para traducción para servir a builders en varios idiomas.",
      whyExists: "Por qué existe",
      whyExistsBody: "El antiguo glosario de Solana ayudaba a orientarse rápido. Esta versión quiere recuperar ese papel mientras escala a superficies como consumer apps y tooling agentic.",
      browseEyebrow: "Explorar por categoría",
      browseTitle: "Empieza por la capa en la que realmente estás construyendo.",
      browseBody: "Los bloques de categorías le dan estructura inmediata a la home y hacen que el glosario se sienta navegable antes incluso de escribir.",
      builderEyebrow: "Rutas",
      builderTitle: "Rutas curadas para Anchor, runtime, DeFi y agentes.",
      builderBody: "El objetivo no es solo definir términos. Es secuenciarlos para que alguien pueda construir con menos cambio de contexto.",
      featuredEyebrow: "Términos destacados",
      featuredTitle: "Entradas que definen cómo la gente entiende Solana rápidamente.",
      featuredBody: "Los destacados le dan utilidad inmediata a la landing incluso antes de que explore tenga la experiencia completa de búsqueda instantánea.",
      speed: "Entiende rápido",
      speedBody: "Empieza por la explicación más corta y útil, y profundiza solo cuando necesites más detalle.",
      builderFocus: "Construye con intención",
      builderFocusBody: "Muévete por workflow: Anchor, runtime, DeFi, agentes y los términos que realmente importan dentro de cada ruta.",
      aiReady: "Contexto para IA",
      aiReadyBody: "Exporta bloques compactos de contexto anclados al glosario en lugar de reexplicar Solana desde cero.",
      previewEyebrow: "Por qué esto se siente distinto",
      previewTitle: "Un glosario que se comporta más como un mapa de producto que como un apéndice de documentación.",
      previewBody: "El objetivo no es solo buscar términos. Es ayudar a alguien a entender qué importa, qué se conecta y qué aprender después.",
      quickStartEyebrow: "Empieza a aprender con un clic",
      quickStartTitle: "Elige la parte de Solana que quieres entender primero.",
      quickStartBody: "Entra directo a una ruta guiada en lugar de empezar desde una búsqueda vacía.",
    },
    explore: {
      eyebrow: "Explorar",
      title: "Encuentra cualquier término en segundos.",
      lead: "Busca por nombres, aliases, IDs y definiciones. Los resultados se actualizan mientras escribes y la URL sigue siendo compartible.",
      searchLabel: "Buscar términos del glosario",
      placeholder: "Busca PDA, account compression, Jupiter, rent, validator...",
      clear: "Limpiar",
      resultSingular: "resultado",
      resultPlural: "resultados",
      visibleCategories: "Categorías visibles",
      visibleCategoriesLead: "La distribución se actualiza según el conjunto actual de resultados.",
      quickStarts: "Inicios rápidos",
      quickStartsLead: "Puntos de entrada rápidos cuando quieres orientarte sin escribir demasiado.",
      noMatchesEyebrow: "Sin resultados",
      noMatchesTitle: "Ningún término del glosario coincide con esa búsqueda.",
      noMatchesBody: "Prueba una frase más corta, usa un alias común como PDA o PoH, o parte desde uno de los términos sugeridos.",
      filterLabel: "Filtrar por categoría",
      allCategories: "Todas las categorías",
    },
    term: {
      context: "Contexto",
      aiHandoff: "Handoff para IA",
      aiHandoffLead: "Usa este bloque compacto cuando quieras dar contexto sólido a un agente o asistente sin volcar toda la página.",
      keepGoing: "Sigue",
      plainMeaning: "Lectura rápida",
      plainMeaningLead: "Empieza por la explicación más corta y útil antes de profundizar.",
      mentalModel: "Modelo mental",
      mentalModelLead: "Usa primero la analogía corta para razonar mejor sobre el término cuando aparezca en código, docs o prompts.",
      technicalContext: "Contexto técnico",
      technicalContextLead: "Ubica el término dentro de la capa de Solana en la que vive para razonar mejor sobre él.",
      builderUse: "Por qué le importa a un builder",
      builderUseLead: "Convierte el término de vocabulario en algo operacional para producto e ingeniería.",
      graphEyebrow: "Grafo conceptual",
      graphTitle: "Ve el término como parte de una red, no como una definición aislada.",
      graphBody: "Estas ramas muestran qué conceptos toca este término directamente y qué existe una capa más allá de ellos.",
      graphBranch: "Rama",
      nextExploreEyebrow: "Siguientes conceptos para explorar",
      nextExploreTitle: "Mantén la cadena de aprendizaje en movimiento en lugar de parar en una sola definición.",
      nextExploreBody: "Estos son los siguientes conceptos que vale la pena abrir si quieres que este término tenga más sentido dentro de un workflow real de Solana.",
      previousInCategory: "Anterior en la categoría",
      nextInCategory: "Siguiente en la categoría",
      relatedEyebrow: "Términos relacionados",
      relatedTitle: "Sigue los conceptos que realmente le dan contexto a este término.",
      relatedBody: "Las entradas del glosario se vuelven útiles cuando están conectadas. Estos enlaces son el camino más corto hacia ideas adyacentes.",
      confusedEyebrow: "Comúnmente confundido con",
      confusedTitle: "Términos cercanos en vocabulario, acrónimo o vecindad conceptual.",
      confusedBody: "Estas entradas son fáciles de mezclar cuando lees rápido, haces prompting a un LLM o estás entrando en una nueva capa de Solana.",
      noMappedRelationsEyebrow: "Sin relaciones mapeadas",
      noMappedRelationsTitle: "Esta entrada todavía no tiene términos relacionados.",
      noMappedRelationsBody: "Usa la continuación de categoría de abajo para seguir navegando conceptos cercanos.",
      builderEyebrow: "Rutas",
      builderTitle: "Este término forma parte de una ruta curada de aprendizaje.",
      builderBody: "Usa estas rutas cuando quieras pasar de un lookup aislado a una exploración guiada.",
      moreInCategoryEyebrow: "Más en la categoría",
      moreInCategoryTitle: "Quédate en la misma capa y sigue construyendo contexto.",
      moreInCategoryBody: "Estas entradas viven junto al término actual y ayudan a que la página se sienta parte de un grafo de conocimiento más amplio en lugar de un callejón sin salida.",
      copyLink: "Copiar enlace",
      copyDefinition: "Copiar definición",
      copyContext: "Copiar contexto para IA",
      linkCopied: "Enlace copiado",
      definitionCopied: "Definición copiada",
      contextCopied: "Contexto para IA copiado",
      clipboardFailed: "Falló el portapapeles",
    },
    paths: {
      eyebrow: "Base de rutas",
      title: "Las rutas editoriales ya están modeladas en la capa del app.",
      lead: "Cada ruta tiene slug, descripción, acento visual y lista ordenada de términos. Eso mantiene el modo de onboarding pequeño y fácil de iterar.",
      pathEyebrow: "Ruta",
      detailEyebrow: "Ruta",
      startPath: "Comenzar ruta",
      sequenceEyebrow: "Secuencia de la ruta",
      sequenceTitle: "Sigue los términos en orden y profundiza cuando haga falta.",
      sequenceLead: "La ruta está ordenada para reducir cambio de contexto. Empieza arriba, abre cada término y usa los enlaces relacionados cuando un concepto necesite más profundidad.",
      overview: "Resumen",
      idealFor: "Ideal para",
      outcome: "Resultado",
      categories: "Categorías cubiertas",
      startHere: "Empieza aquí",
      nextPath: "Ruta siguiente",
      previousPath: "Ruta anterior",
      workflowTitle: "Cómo usar esta ruta",
      workflowStep1: "Lee la ruta en orden en lugar de saltar aleatoriamente entre términos.",
      workflowStep2: "Abre las páginas de término siempre que un concepto necesite definiciones, aliases y enlaces relacionados.",
      workflowStep3: "Usa términos relacionados y continuación por categoría para profundizar sin perder el contexto de la ruta.",
      quizCta: "Hacer quiz de la ruta",
      learnCta: "Abrir flujo de onboarding",
    },
    learn: {
      eyebrow: "Modo de aprendizaje",
      title: "Empieza desde cero y gana confianza con rutas guiadas y quizzes rápidos.",
      lead: "Esta capa convierte el glosario en onboarding: elige una ruta, recorre los términos en orden y valida el entendimiento con rondas ligeras de quiz.",
      newDevTitle: "¿Nuevo en Solana?",
      newDevBody: "Empieza por Runtime si primero necesitas el modelo mental de la chain y luego avanza a Anchor o DeFi según lo que quieras construir.",
      onboardingTitle: "Cómo funciona el onboarding",
      onboardingBody: "Elige una builder path, lee la secuencia en orden, abre términos cuando necesites más profundidad y luego usa el quiz para comprobar si el vocabulario realmente quedó.",
      quizTitle: "Quizzes interactivos por ruta",
      quizBody: "Cada ruta recibe un quiz corto de opción múltiple generado a partir de definiciones del glosario y términos cercanos. El objetivo es refuerzo rápido, no fricción de examen.",
      useCaseTitle: "Navega por caso de uso",
      useCaseBody: "Empieza por el trabajo real que quieres hacer y luego sigue los términos, la ruta y el flujo de aprendizaje conectados con ese objetivo.",
      startHere: "Primer paso recomendado",
      recommendedOrder: "Orden recomendado",
      progressLabel: "Progreso",
      questionLabel: "Pregunta",
      scoreLabel: "Puntaje",
      restartQuiz: "Reiniciar quiz",
      finishTitle: "Quiz completado",
      finishBody: "Usa el puntaje para decidir si sigues con la siguiente ruta o si revisas otra vez la secuencia actual.",
      finishHighScore: "Resultado fuerte. Ya puedes avanzar a la siguiente ruta y usar las páginas de término solo como refuerzo.",
      finishMidScore: "Buen progreso. Vale la pena revisar la ruta una vez más y reabrir los términos que todavía se sientan borrosos.",
      finishLowScore: "Lo mejor ahora es volver a la secuencia de la ruta y reabrir las páginas de término clave antes de continuar.",
      reviewPath: "Revisar ruta",
      continueLearning: "Seguir aprendiendo",
      answerCta: "Comprobar respuesta",
      nextQuestion: "Siguiente pregunta",
      oneCorrect: "Una respuesta correcta",
      onboardingSteps: [
        "Elige la ruta más cercana a lo que quieres construir.",
        "Lee la secuencia en orden y abre términos cuando haga falta.",
        "Haz el quiz para reforzar el vocabulario antes de seguir.",
      ],
    },
    copilot: {
      eyebrow: "Glossary Copilot",
      title: "Haz preguntas de Solana con contexto directamente dentro de la página del término.",
      lead: "Este panel convierte el glosario en una interfaz de IA guiada por contexto. Usa el término actual, conceptos relacionados, confusiones comunes, siguientes pasos y snippets opcionales de código para responder con explicaciones sólidas para developers.",
      pageTitle: "Glossary Copilot fuera de la página del término.",
      pageLead: "Usa este workspace cuando quieras interrogar conceptos de Solana con más libertad. Elige un término del glosario, haz tu pregunta y mantén la respuesta grounded en el grafo oficial del glosario.",
      pickerTitle: "Elige el concepto que anclará la respuesta.",
      pickerBody: "El Copilot funciona mejor cuando empieza desde un nodo del glosario. Cambia de término aquí antes de hacer preguntas más amplias o pegar código.",
      activeTermTitle: "Ancla activa del glosario",
      activeTermBody: "El término seleccionado define la primera capa de contexto recuperado para la respuesta.",
      switchTerm: "Cambiar término",
      openTermPage: "Abrir página del término",
      questionLabel: "Pregunta",
      questionPlaceholder: "Pregunta cómo funciona este concepto, cuándo usarlo o cómo se conecta con el resto de Solana.",
      codeLabel: "Explica este código",
      codeHint: "Opcional. Pega código de Anchor o Solana y el Copilot mapeará los conceptos detectados al glosario antes de responder.",
      codePlaceholder: "Pega aquí código de Anchor o Solana para obtener una explicación grounded en el glosario.",
      submit: "Preguntar a la IA",
      submitting: "Pensando...",
      copyAnswer: "Copiar respuesta",
      answerCopied: "Respuesta copiada",
      copyFailed: "Falló el portapapeles",
      errorTitle: "Error del Copilot",
      genericError: "El Copilot no pudo responder ahora mismo.",
      loadingTitle: "Aterrizando la respuesta",
      loadingBody: "Glossary Copilot está construyendo el contexto y componiendo la respuesta.",
      emptyTitle: "Pregunta sobre este término",
      emptyBody: "Empieza con una pregunta concreta sobre Solana. También puedes adjuntar un snippet de código si quieres una explicación más orientada a implementación.",
      explanationTitle: "Explicación",
      keyConceptsTitle: "Conceptos clave",
      nextTermsTitle: "Siguientes términos sugeridos",
      caveatTitle: "Nota de alcance",
    },
    about: {
      eyebrow: "Sobre este frontend",
      title: "Un frontend del glosario de Solana construido como sistema de navegación para builders.",
      lead: "Este proyecto es la capa de producto del challenge: un frontend hosteable y multilingüe que convierte el dataset oficial del glosario en descubrimiento, onboarding y contexto orientado a construcción.",
      pillarsTitle: "Qué optimiza este frontend",
      pillars: [
        {
          title: "Entendimiento rápido",
          body: "La landing, la búsqueda instantánea y las páginas de término están diseñadas para reducir el tiempo hasta el contexto, no solo mostrar definiciones crudas.",
        },
        {
          title: "Navegación para builders",
          body: "Builder paths, términos relacionados, continuidad por categoría y siguientes conceptos convierten el glosario en exploración guiada y no en lookup plano.",
        },
        {
          title: "Contexto para IA",
          body: "Las páginas de término pueden exportar bloques compactos de contexto para que el glosario también sea útil dentro de flujos con agentes.",
        },
      ],
      challengeTitle: "Por qué encaja con el hackathon",
      challengeBody: "El challenge pide algo searchable, browsable, beautiful y realmente útil sobre el SDK/data del glosario. Este frontend busca ser justamente esa superficie hosteable: multilingüe, pulida y enfocada en entender Solana más rápido.",
      integrationTitle: "Cómo usa los datos del glosario",
      integrationBody: "La app lee los datos oficiales del glosario desde este repositorio y construye sus páginas a partir de IDs, definiciones, aliases, contenido localizado, categorías y relaciones mapeadas. La capa de rutas y UI se mantiene separada de la capa de datos para que el frontend pueda evolucionar sin romper la fuente del glosario.",
      outcomesTitle: "Qué entrega ya el producto",
      outcomes: [
        "Descubrimiento instantáneo de términos por nombre, alias, ID y definición.",
        "Builder paths para Anchor, Runtime, DeFi y Agents.",
        "Navegación localizada en inglés, portugués y español.",
        "Páginas de término con conceptos relacionados, vecinos confusos y contexto para AI handoff.",
      ],
    },
  },
};

export function getCopy(locale: Locale): Copy {
  return copyByLocale[locale] ?? copyByLocale.en;
}
