import { createContext, useContext, useState, ReactNode } from "react";

export type Locale = "en" | "pt" | "es";

const translations = {
  en: {
    // Hero
    "hero.title.before": "Understand",
    "hero.title.solana": "Solana",
    "hero.title.after": "instantly.",
    "hero.badge": "terms . 14 categories . Official Solana Glossary",
    "hero.subtitle":
      "From concepts to real code -- powered by an intelligent glossary.",
    "hero.input_placeholder": "Search a term or paste code... Try: ",
    "hero.code_detected": "Code detected -- Explain with AI",
    "hero.helper_text": 'Try: "PDA", "Turbine", or paste Anchor code',
    // Buttons
    "btn.copilot": "AI Copilot",
    "btn.explain_code": "Explain Code",
    "btn.browse_glossary": "Browse Glossary",
    // Nav
    "nav.glossary": "Glossary",
    "nav.copilot": "Copilot",
    "nav.explain_code": "Explain Code",
    // Copilot tabs
    "tab.copilot": "Copilot",
    "tab.explain_code": "Explain Code",
    "tab.explain_file": "Explain File",
    // Category
    "category.all": "All",
    "category.showing": "Showing",
    "category.of": "of",
    "category.load_more": "Load more",
    "category.categories": "Categories",
    "category.all_terms": "All Terms",
    "category.terms_suffix": "Terms",
    "category.terms_count": "terms",
    "category.remaining": "remaining",
    // Category names
    "cat.core-protocol": "Core Protocol",
    "cat.programming-model": "Programming Model",
    "cat.token-ecosystem": "Token Ecosystem",
    "cat.defi": "DeFi",
    "cat.zk-compression": "ZK Compression",
    "cat.infrastructure": "Infrastructure",
    "cat.security": "Security",
    "cat.dev-tools": "Dev Tools",
    "cat.network": "Network",
    "cat.blockchain-general": "Blockchain General",
    "cat.web3": "Web3",
    "cat.programming-fundamentals": "Programming",
    "cat.ai-ml": "AI / ML",
    "cat.solana-ecosystem": "Solana Ecosystem",
    // Search
    "search.placeholder": "Search 1001 Solana terms...",
    // Chat
    "chat.title": "Solana Dev Copilot",
    "chat.subtitle":
      "Ask me anything about Solana development. I use the official glossary (1001 terms) + AI to give you accurate, contextual answers.",
    "chat.explain_title": "Explain Solana Code",
    "chat.explain_subtitle":
      "Paste any Solana/Anchor code and I'll explain every concept using the official glossary with 1001 terms.",
    "chat.placeholder": "Ask about Solana concepts...",
    "chat.explain_placeholder": "Paste Solana code to explain...",
    "chat.thinking": "Thinking...",
    // Chat demo questions
    "chat.demo.pda": "What is PDA in Solana?",
    "chat.demo.accounts": "Explain accounts like I'm a beginner",
    "chat.demo.poh": "How does Proof of History work?",
    "chat.demo.bft":
      "What's the difference between Tower BFT and traditional PBFT?",
    "chat.demo.amm": "What is an AMM and how does it work on Solana?",
    "chat.demo.zk": "Explain ZK Compression in Solana",
    // Code examples
    "chat.code.pda_label": "Explain PDA derivation",
    "chat.code.transfer_label": "Explain token transfer",
    // Explain file
    "file.paste_title": "Paste Code to Analyze",
    "file.try_example": "Try Example",
    "file.analyzing": "Analyzing file and glossary context...",
    "file.explain_btn": "Explain Entire File",
    "file.paste_placeholder":
      "Paste your Solana / Anchor / Rust / TypeScript code here...",
    "file.empty_hint":
      'Paste code above and click "Explain Entire File" to get a structured breakdown with glossary-powered insights.',
    "file.upload_btn": "Upload File",
    "file.export_btn": "Export Explanation",
    "file.drop_hint": "Drop a code file here",
    // Term detail
    "term.related": "Related Terms",
    "term.usage": "Used in Context",
    "term.ai_insight": "AI Insight",
    "term.cta_explain": "Explain with AI",
    "term.cta_simplify": "Simplify (ELI5)",
    "term.cta_code": "Use in real code",
    "term.cta_compare": "Compare",
    "term.cta_graph": "View Knowledge Graph",
    // Graph
    "graph.title": "Knowledge Graph",
    "graph.subtitle":
      "Explore how concepts connect across the Solana ecosystem.",
    // Learning Path
    "learn.mode": "Learning Mode",
    "learn.title": "Learning Path",
    "learn.steps_label": "steps",
    "learn.based_on_graph": "Based on Knowledge Graph",
    "learn.not_found": "Term not found. Go back to the glossary.",
    "learn.explanation": "AI Explanation",
    "learn.prev": "Previous",
    "learn.next": "Next Step",
    "learn.complete": "Complete Path",
    "learn.restart": "Restart",
    "learn.start": "Start Learning Path",
    // Quiz
    "quiz.title": "Practice with this concept",
    "quiz.description":
      "Test your understanding using AI-generated questions based on this concept and its relationships.",
    "quiz.difficulty": "Difficulty",
    "quiz.beginner": "Beginner",
    "quiz.intermediate": "Intermediate",
    "quiz.advanced": "Advanced",
    "quiz.mode_label": "Mode",
    "quiz.mode_concept": "Concept",
    "quiz.mode_connections": "Connections",
    "quiz.mode_realworld": "Real-world",
    "quiz.start": "Start AI Quiz",
    "quiz.generating": "Generating questions...",
    "quiz.correct": "Correct!",
    "quiz.incorrect": "Incorrect",
    "quiz.next": "Next Question",
    "quiz.finish": "Finish Session",
    "quiz.complete": "Session Complete",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "You understand core concepts well! Try a harder difficulty.",
    "quiz.insight_review":
      "Review the related terms below to strengthen your understanding.",
    "quiz.review_terms": "You should review",
    "quiz.new_session": "Start New Session",
    "quiz.explore_graph": "Explore Graph",
    // Apply Code
    "apply.title": "Apply what you just learned",
    "apply.description":
      "Turn knowledge into real development -- generate a practical Solana example based on your quiz results.",
    "apply.generate": "Generate Real Code",
    "apply.generating": "Generating real-world example...",
    "apply.explanation": "Explanation",
    "apply.key_concepts": "Key Concepts",
    "apply.explain_code": "Explain this code",
    "apply.view_graph": "View in Graph",
    "apply.regenerate": "Generate a different example",
    // AI availability
    "ai.unavailable": "AI features require backend configuration.",
    "ai.glossary_works": "The glossary works without AI.",
    // Misc
    "term.copy": "Copy",
    "term.copied": "Copied!",
    "quiz.score_correct": "correct",
    "learn.step": "Step",
    // 404
    "notfound.title": "404",
    "notfound.message": "Oops! Page not found",
    "notfound.link": "Return to Home",
  },
  pt: {
    "hero.title.before": "Entenda",
    "hero.title.solana": "Solana",
    "hero.title.after": "instantaneamente.",
    "hero.badge": "termos . 14 categorias . Glossario Oficial Solana",
    "hero.subtitle":
      "De conceitos a codigo real -- alimentado por um glossario inteligente.",
    "hero.input_placeholder": "Pesquise um termo ou cole codigo... Tente: ",
    "hero.code_detected": "Codigo detectado -- Explicar com IA",
    "hero.helper_text": 'Tente: "PDA", "Turbine", ou cole codigo Anchor',
    "btn.copilot": "IA Copilot",
    "btn.explain_code": "Explicar Codigo",
    "btn.browse_glossary": "Explorar Glossario",
    "nav.glossary": "Glossario",
    "nav.copilot": "Copilot",
    "nav.explain_code": "Explicar Codigo",
    "tab.copilot": "Copilot",
    "tab.explain_code": "Explicar Codigo",
    "tab.explain_file": "Explicar Arquivo",
    "category.all": "Todos",
    "category.showing": "Mostrando",
    "category.of": "de",
    "category.load_more": "Carregar mais",
    "category.categories": "Categorias",
    "category.all_terms": "Todos os Termos",
    "category.terms_suffix": "Termos",
    "category.terms_count": "termos",
    "category.remaining": "restantes",
    "cat.core-protocol": "Protocolo Central",
    "cat.programming-model": "Modelo de Programacao",
    "cat.token-ecosystem": "Ecossistema de Tokens",
    "cat.defi": "DeFi",
    "cat.zk-compression": "Compressao ZK",
    "cat.infrastructure": "Infraestrutura",
    "cat.security": "Seguranca",
    "cat.dev-tools": "Ferramentas Dev",
    "cat.network": "Rede",
    "cat.blockchain-general": "Blockchain Geral",
    "cat.web3": "Web3",
    "cat.programming-fundamentals": "Programacao",
    "cat.ai-ml": "IA / ML",
    "cat.solana-ecosystem": "Ecossistema Solana",
    "search.placeholder": "Pesquisar 1001 termos Solana...",
    "chat.title": "Solana Dev Copilot",
    "chat.subtitle":
      "Pergunte qualquer coisa sobre desenvolvimento Solana. Uso o glossario oficial (1001 termos) + IA para respostas precisas e contextuais.",
    "chat.explain_title": "Explicar Codigo Solana",
    "chat.explain_subtitle":
      "Cole qualquer codigo Solana/Anchor e eu explico cada conceito usando o glossario oficial com 1001 termos.",
    "chat.placeholder": "Pergunte sobre conceitos Solana...",
    "chat.explain_placeholder": "Cole codigo Solana para explicar...",
    "chat.thinking": "Pensando...",
    "chat.demo.pda": "O que e PDA na Solana?",
    "chat.demo.accounts": "Explique accounts como se eu fosse iniciante",
    "chat.demo.poh": "Como funciona o Proof of History?",
    "chat.demo.bft": "Qual a diferenca entre Tower BFT e PBFT tradicional?",
    "chat.demo.amm": "O que e um AMM e como funciona na Solana?",
    "chat.demo.zk": "Explique ZK Compression na Solana",
    "chat.code.pda_label": "Explicar derivacao de PDA",
    "chat.code.transfer_label": "Explicar transferencia de token",
    "file.paste_title": "Cole o Codigo para Analisar",
    "file.try_example": "Tentar Exemplo",
    "file.analyzing": "Analisando arquivo e contexto do glossario...",
    "file.explain_btn": "Explicar Arquivo Inteiro",
    "file.paste_placeholder":
      "Cole seu codigo Solana / Anchor / Rust / TypeScript aqui...",
    "file.empty_hint":
      'Cole o codigo acima e clique em "Explicar Arquivo Inteiro" para obter uma analise estruturada com insights do glossario.',
    "file.upload_btn": "Enviar Arquivo",
    "file.export_btn": "Exportar Explicacao",
    "file.drop_hint": "Solte um arquivo de codigo aqui",
    "term.related": "Termos Relacionados",
    "term.usage": "Usado em Contexto",
    "term.ai_insight": "Insight da IA",
    "term.cta_explain": "Explicar com IA",
    "term.cta_simplify": "Simplificar (ELI5)",
    "term.cta_code": "Usar em codigo",
    "term.cta_compare": "Comparar",
    "term.cta_graph": "Ver Grafo de Conhecimento",
    "graph.title": "Grafo de Conhecimento",
    "graph.subtitle":
      "Explore como conceitos se conectam no ecossistema Solana.",
    "learn.mode": "Modo Aprendizado",
    "learn.title": "Trilha de Aprendizado",
    "learn.steps_label": "passos",
    "learn.based_on_graph": "Baseado no Grafo de Conhecimento",
    "learn.not_found": "Termo nao encontrado. Volte ao glossario.",
    "learn.explanation": "Explicacao da IA",
    "learn.prev": "Anterior",
    "learn.next": "Proximo Passo",
    "learn.complete": "Completar Trilha",
    "learn.restart": "Recomecar",
    "learn.start": "Iniciar Trilha de Aprendizado",
    "quiz.title": "Pratique com este conceito",
    "quiz.description":
      "Teste seu entendimento com perguntas geradas por IA baseadas neste conceito e suas relacoes.",
    "quiz.difficulty": "Dificuldade",
    "quiz.beginner": "Iniciante",
    "quiz.intermediate": "Intermediario",
    "quiz.advanced": "Avancado",
    "quiz.mode_label": "Modo",
    "quiz.mode_concept": "Conceito",
    "quiz.mode_connections": "Conexoes",
    "quiz.mode_realworld": "Mundo real",
    "quiz.start": "Iniciar Quiz IA",
    "quiz.generating": "Gerando perguntas...",
    "quiz.correct": "Correto!",
    "quiz.incorrect": "Incorreto",
    "quiz.next": "Proxima Pergunta",
    "quiz.finish": "Finalizar Sessao",
    "quiz.complete": "Sessao Completa",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "Voce entende bem os conceitos! Tente uma dificuldade maior.",
    "quiz.insight_review":
      "Revise os termos abaixo para fortalecer seu entendimento.",
    "quiz.review_terms": "Voce deve revisar",
    "quiz.new_session": "Nova Sessao",
    "quiz.explore_graph": "Explorar Grafo",
    "apply.title": "Aplique o que acabou de aprender",
    "apply.description":
      "Transforme conhecimento em desenvolvimento real -- gere um exemplo pratico de Solana baseado nos seus resultados.",
    "apply.generate": "Gerar Codigo Real",
    "apply.generating": "Gerando exemplo real...",
    "apply.explanation": "Explicacao",
    "apply.key_concepts": "Conceitos-chave",
    "apply.explain_code": "Explicar este codigo",
    "apply.view_graph": "Ver no Grafo",
    "apply.regenerate": "Gerar outro exemplo",
    "ai.unavailable": "Recursos de IA requerem configuracao do backend.",
    "ai.glossary_works": "O glossario funciona sem IA.",
    "term.copy": "Copiar",
    "term.copied": "Copiado!",
    "quiz.score_correct": "corretas",
    "learn.step": "Passo",
    "notfound.title": "404",
    "notfound.message": "Ops! Pagina nao encontrada",
    "notfound.link": "Voltar para o Inicio",
  },
  es: {
    "hero.title.before": "Entiende",
    "hero.title.solana": "Solana",
    "hero.title.after": "al instante.",
    "hero.badge": "terminos . 14 categorias . Glosario Oficial Solana",
    "hero.subtitle":
      "De conceptos a codigo real -- impulsado por un glosario inteligente.",
    "hero.input_placeholder": "Busca un termino o pega codigo... Prueba: ",
    "hero.code_detected": "Codigo detectado -- Explicar con IA",
    "hero.helper_text": 'Prueba: "PDA", "Turbine", o pega codigo Anchor',
    "btn.copilot": "IA Copilot",
    "btn.explain_code": "Explicar Codigo",
    "btn.browse_glossary": "Explorar Glosario",
    "nav.glossary": "Glosario",
    "nav.copilot": "Copilot",
    "nav.explain_code": "Explicar Codigo",
    "tab.copilot": "Copilot",
    "tab.explain_code": "Explicar Codigo",
    "tab.explain_file": "Explicar Archivo",
    "category.all": "Todos",
    "category.showing": "Mostrando",
    "category.of": "de",
    "category.load_more": "Cargar mas",
    "category.categories": "Categorias",
    "category.all_terms": "Todos los Terminos",
    "category.terms_suffix": "Terminos",
    "category.terms_count": "terminos",
    "category.remaining": "restantes",
    "cat.core-protocol": "Protocolo Central",
    "cat.programming-model": "Modelo de Programacion",
    "cat.token-ecosystem": "Ecosistema de Tokens",
    "cat.defi": "DeFi",
    "cat.zk-compression": "Compresion ZK",
    "cat.infrastructure": "Infraestructura",
    "cat.security": "Seguridad",
    "cat.dev-tools": "Herramientas Dev",
    "cat.network": "Red",
    "cat.blockchain-general": "Blockchain General",
    "cat.web3": "Web3",
    "cat.programming-fundamentals": "Programacion",
    "cat.ai-ml": "IA / ML",
    "cat.solana-ecosystem": "Ecosistema Solana",
    "search.placeholder": "Buscar 1001 terminos Solana...",
    "chat.title": "Solana Dev Copilot",
    "chat.subtitle":
      "Preguntame lo que sea sobre desarrollo Solana. Uso el glosario oficial (1001 terminos) + IA para respuestas precisas y contextuales.",
    "chat.explain_title": "Explicar Codigo Solana",
    "chat.explain_subtitle":
      "Pega cualquier codigo Solana/Anchor y te explico cada concepto usando el glosario oficial con 1001 terminos.",
    "chat.placeholder": "Pregunta sobre conceptos Solana...",
    "chat.explain_placeholder": "Pega codigo Solana para explicar...",
    "chat.thinking": "Pensando...",
    "chat.demo.pda": "Que es PDA en Solana?",
    "chat.demo.accounts": "Explica accounts como si fuera principiante",
    "chat.demo.poh": "Como funciona Proof of History?",
    "chat.demo.bft":
      "Cual es la diferencia entre Tower BFT y PBFT tradicional?",
    "chat.demo.amm": "Que es un AMM y como funciona en Solana?",
    "chat.demo.zk": "Explica ZK Compression en Solana",
    "chat.code.pda_label": "Explicar derivacion de PDA",
    "chat.code.transfer_label": "Explicar transferencia de token",
    "file.paste_title": "Pega el Codigo para Analizar",
    "file.try_example": "Probar Ejemplo",
    "file.analyzing": "Analizando archivo y contexto del glosario...",
    "file.explain_btn": "Explicar Archivo Completo",
    "file.paste_placeholder":
      "Pega tu codigo Solana / Anchor / Rust / TypeScript aqui...",
    "file.empty_hint":
      'Pega el codigo arriba y haz clic en "Explicar Archivo Completo" para obtener un analisis estructurado con insights del glosario.',
    "file.upload_btn": "Subir Archivo",
    "file.export_btn": "Exportar Explicacion",
    "file.drop_hint": "Suelta un archivo de codigo aqui",
    "term.related": "Terminos Relacionados",
    "term.usage": "Usado en Contexto",
    "term.ai_insight": "Insight de IA",
    "term.cta_explain": "Explicar con IA",
    "term.cta_simplify": "Simplificar (ELI5)",
    "term.cta_code": "Usar en codigo",
    "term.cta_compare": "Comparar",
    "term.cta_graph": "Ver Grafo de Conocimiento",
    "graph.title": "Grafo de Conocimiento",
    "graph.subtitle":
      "Explora como se conectan los conceptos en el ecosistema Solana.",
    "learn.mode": "Modo Aprendizaje",
    "learn.title": "Ruta de Aprendizaje",
    "learn.steps_label": "pasos",
    "learn.based_on_graph": "Basado en el Grafo de Conocimiento",
    "learn.not_found": "Termino no encontrado. Vuelve al glosario.",
    "learn.explanation": "Explicacion de IA",
    "learn.prev": "Anterior",
    "learn.next": "Siguiente Paso",
    "learn.complete": "Completar Ruta",
    "learn.restart": "Reiniciar",
    "learn.start": "Iniciar Ruta de Aprendizaje",
    "quiz.title": "Practica con este concepto",
    "quiz.description":
      "Pon a prueba tu comprension con preguntas generadas por IA basadas en este concepto y sus relaciones.",
    "quiz.difficulty": "Dificultad",
    "quiz.beginner": "Principiante",
    "quiz.intermediate": "Intermedio",
    "quiz.advanced": "Avanzado",
    "quiz.mode_label": "Modo",
    "quiz.mode_concept": "Concepto",
    "quiz.mode_connections": "Conexiones",
    "quiz.mode_realworld": "Mundo real",
    "quiz.start": "Iniciar Quiz IA",
    "quiz.generating": "Generando preguntas...",
    "quiz.correct": "Correcto!",
    "quiz.incorrect": "Incorrecto",
    "quiz.next": "Siguiente Pregunta",
    "quiz.finish": "Finalizar Sesion",
    "quiz.complete": "Sesion Completa",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "Entiendes bien los conceptos! Prueba una dificultad mayor.",
    "quiz.insight_review":
      "Revisa los terminos abajo para fortalecer tu comprension.",
    "quiz.review_terms": "Deberias revisar",
    "quiz.new_session": "Nueva Sesion",
    "quiz.explore_graph": "Explorar Grafo",
    "apply.title": "Aplica lo que acabas de aprender",
    "apply.description":
      "Transforma el conocimiento en desarrollo real -- genera un ejemplo practico de Solana basado en tus resultados.",
    "apply.generate": "Generar Codigo Real",
    "apply.generating": "Generando ejemplo real...",
    "apply.explanation": "Explicacion",
    "apply.key_concepts": "Conceptos clave",
    "apply.explain_code": "Explicar este codigo",
    "apply.view_graph": "Ver en Grafo",
    "apply.regenerate": "Generar otro ejemplo",
    "ai.unavailable":
      "Las funciones de IA requieren configuracion del backend.",
    "ai.glossary_works": "El glosario funciona sin IA.",
    "term.copy": "Copiar",
    "term.copied": "Copiado!",
    "quiz.score_correct": "correctas",
    "learn.step": "Paso",
    "notfound.title": "404",
    "notfound.message": "Ups! Pagina no encontrada",
    "notfound.link": "Volver al Inicio",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("locale");
    return (saved as Locale) || "en";
  });

  const handleSetLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem("locale", l);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};
