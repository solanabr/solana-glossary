import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { allTerms } from "@stbr/solana-glossary";
import { preloadLocale, type GlossaryLocale } from "@/lib/glossary-i18n";

export type Locale = "en" | "pt" | "es";

const LOCALES: readonly Locale[] = ["en", "pt", "es"];

function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

// Live glossary size, interpolated into any string containing `{count}`.
// Keeps term counts from going stale as the SDK grows.
const TERM_COUNT = allTerms.length;

const translations = {
  en: {
    // Hero
    "hero.title.before": "Understand",
    "hero.title.solana": "Solana",
    "hero.title.after": "instantly.",
    "hero.badge": "terms · 14 categories · Official Solana Glossary",
    "hero.subtitle":
      "From concepts to real code — powered by an intelligent glossary.",
    "hero.input_placeholder": "Search a term or paste code... Try: ",
    "hero.code_detected": "Code detected — Explain with AI",
    // Buttons
    "btn.copilot": "AI Copilot",
    "btn.explain_code": "Explain Code",
    "btn.browse_glossary": "Browse Glossary",
    // Nav
    "nav.glossary": "Glossary",
    "nav.code": "Code",
    // Theme
    "theme.label": "Dark theme",
    "theme.to_light": "Switch to light theme",
    "theme.to_dark": "Switch to dark theme",
    "depth.label": "Depth",
    "depth.all": "All",
    "depth.hint": "Knowledge depth — 1 (surface) to 5 (deep)",
    "sort.label": "Sort",
    "sort.random": "Shuffle",
    "sort.az": "A–Z",
    "sort.za": "Z–A",
    "sort.category": "Category",
    "filter.tags": "Tags",
    "filter.clear": "Clear filters",
    "swipe.hint": "Scroll or swipe for the next term",
    "swipe.open": "Open full view",
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
    "term.not_found": "Term not found — it may have been renamed or removed.",
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
    "search.placeholder": "Search {count} Solana terms…",
    // Chat
    "chat.title": "Solana Glossary",
    "chat.subtitle":
      "Ask me anything about Solana development. I use the official glossary ({count} terms) + AI to give you accurate, contextual answers.",
    "chat.explain_title": "Explain Solana Code",
    "chat.explain_subtitle":
      "Paste any Solana/Anchor code and I'll explain every concept using the official glossary with {count} terms.",
    "chat.placeholder": "Ask about Solana concepts…",
    "chat.explain_placeholder": "Paste Solana code to explain…",
    "chat.thinking": "Thinking…",
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
    "file.analyzing": "Analyzing file and glossary context…",
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
    // Graph
    "graph.title": "Knowledge Graph",
    "graph.back": "Back",
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
    "quiz.title": "🧠 Practice with this concept",
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
    "quiz.generating": "Generating questions…",
    "quiz.correct": "✅ Correct!",
    "quiz.incorrect": "❌ Incorrect",
    "quiz.next": "Next Question",
    "quiz.finish": "Finish Session",
    "quiz.complete": "🎯 Session Complete",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "You understand core concepts well! Try a harder difficulty.",
    "quiz.insight_review":
      "Review the related terms below to strengthen your understanding.",
    "quiz.review_terms": "You should review",
    "quiz.new_session": "Start New Session",
    "quiz.explore_graph": "Explore Graph",
    // Apply Code
    "apply.title": "💻 Apply what you just learned",
    "apply.description":
      "Turn knowledge into real development — generate a practical Solana example based on your quiz results.",
    "apply.generate": "Generate Real Code",
    "apply.generating": "Generating real-world example…",
    "apply.explanation": "Explanation",
    "apply.key_concepts": "Key Concepts",
    "apply.explain_code": "Explain this code",
    "apply.view_graph": "View in Graph",
    "apply.regenerate": "↻ Generate a different example",
    // 404
    "notfound.title": "404",
    "notfound.message": "Oops! Page not found",
    "notfound.link": "Return to Home",
    // AI status (Phase-1 gating)
    "ai.resting.title": "Copilot is resting",
    "ai.resting.body":
      "AI features are paused for now — glossary browsing, search, categories, and the knowledge graph all work fully.",
  },
  pt: {
    "hero.title.before": "Entenda",
    "hero.title.solana": "Solana",
    "hero.title.after": "instantaneamente.",
    "hero.badge": "termos · 14 categorias · Glossário Oficial Solana",
    "hero.subtitle":
      "De conceitos a código real — alimentado por um glossário inteligente.",
    "hero.input_placeholder": "Pesquise um termo ou cole código... Tente: ",
    "hero.code_detected": "Código detectado — Explicar com IA",
    "btn.copilot": "IA Copilot",
    "btn.explain_code": "Explicar Código",
    "btn.browse_glossary": "Explorar Glossário",
    "nav.glossary": "Glossário",
    "nav.code": "Código",
    "theme.label": "Tema escuro",
    "theme.to_light": "Mudar para o tema claro",
    "theme.to_dark": "Mudar para o tema escuro",
    "depth.label": "Profundidade",
    "depth.all": "Todas",
    "depth.hint":
      "Profundidade de conhecimento — 1 (superfície) a 5 (profundo)",
    "sort.label": "Ordenar",
    "filter.tags": "Tags",
    "filter.clear": "Limpar filtros",
    "sort.random": "Aleatório",
    "sort.az": "A–Z",
    "sort.za": "Z–A",
    "sort.category": "Categoria",
    "swipe.hint": "Deslize para o próximo termo",
    "swipe.open": "Abrir visão completa",
    "tab.copilot": "Copilot",
    "tab.explain_code": "Explicar Código",
    "tab.explain_file": "Explicar Arquivo",
    "category.all": "Todos",
    "category.showing": "Mostrando",
    "category.of": "de",
    "category.load_more": "Carregar mais",
    "category.categories": "Categorias",
    "category.all_terms": "Todos os Termos",
    "term.not_found":
      "Termo não encontrado — pode ter sido renomeado ou removido.",
    "category.terms_suffix": "Termos",
    "category.terms_count": "termos",
    "category.remaining": "restantes",
    "cat.core-protocol": "Protocolo Central",
    "cat.programming-model": "Modelo de Programação",
    "cat.token-ecosystem": "Ecossistema de Tokens",
    "cat.defi": "DeFi",
    "cat.zk-compression": "Compressão ZK",
    "cat.infrastructure": "Infraestrutura",
    "cat.security": "Segurança",
    "cat.dev-tools": "Ferramentas Dev",
    "cat.network": "Rede",
    "cat.blockchain-general": "Blockchain Geral",
    "cat.web3": "Web3",
    "cat.programming-fundamentals": "Programação",
    "cat.ai-ml": "IA / ML",
    "cat.solana-ecosystem": "Ecossistema Solana",
    "search.placeholder": "Pesquisar {count} termos Solana…",
    "chat.title": "Solana Glossary",
    "chat.subtitle":
      "Pergunte qualquer coisa sobre desenvolvimento Solana. Uso o glossário oficial ({count} termos) + IA para respostas precisas e contextuais.",
    "chat.explain_title": "Explicar Código Solana",
    "chat.explain_subtitle":
      "Cole qualquer código Solana/Anchor e eu explico cada conceito usando o glossário oficial com {count} termos.",
    "chat.placeholder": "Pergunte sobre conceitos Solana…",
    "chat.explain_placeholder": "Cole código Solana para explicar…",
    "chat.thinking": "Pensando…",
    "chat.demo.pda": "O que é PDA na Solana?",
    "chat.demo.accounts": "Explique accounts como se eu fosse iniciante",
    "chat.demo.poh": "Como funciona o Proof of History?",
    "chat.demo.bft": "Qual a diferença entre Tower BFT e PBFT tradicional?",
    "chat.demo.amm": "O que é um AMM e como funciona na Solana?",
    "chat.demo.zk": "Explique ZK Compression na Solana",
    "chat.code.pda_label": "Explicar derivação de PDA",
    "chat.code.transfer_label": "Explicar transferência de token",
    "file.paste_title": "Cole o Código para Analisar",
    "file.try_example": "Tentar Exemplo",
    "file.analyzing": "Analisando arquivo e contexto do glossário…",
    "file.explain_btn": "Explicar Arquivo Inteiro",
    "file.paste_placeholder":
      "Cole seu código Solana / Anchor / Rust / TypeScript aqui...",
    "file.empty_hint":
      'Cole o código acima e clique em "Explicar Arquivo Inteiro" para obter uma análise estruturada com insights do glossário.',
    "file.upload_btn": "Enviar Arquivo",
    "file.export_btn": "Exportar Explicação",
    "file.drop_hint": "Solte um arquivo de código aqui",
    "term.related": "Termos Relacionados",
    "term.usage": "Usado em Contexto",
    "term.ai_insight": "Insight da IA",
    "term.cta_explain": "Explicar com IA",
    "term.cta_simplify": "Simplificar (ELI5)",
    "term.cta_code": "Usar em código",
    "term.cta_compare": "Comparar",
    "graph.title": "Grafo de Conhecimento",
    "graph.back": "Voltar",
    "learn.mode": "Modo Aprendizado",
    "learn.title": "Trilha de Aprendizado",
    "learn.steps_label": "passos",
    "learn.based_on_graph": "Baseado no Grafo de Conhecimento",
    "learn.not_found": "Termo não encontrado. Volte ao glossário.",
    "learn.explanation": "Explicação da IA",
    "learn.prev": "Anterior",
    "learn.next": "Próximo Passo",
    "learn.complete": "Completar Trilha",
    "learn.restart": "Recomeçar",
    "learn.start": "Iniciar Trilha de Aprendizado",
    // Quiz
    "quiz.title": "🧠 Pratique com este conceito",
    "quiz.description":
      "Teste seu entendimento com perguntas geradas por IA baseadas neste conceito e suas relações.",
    "quiz.difficulty": "Dificuldade",
    "quiz.beginner": "Iniciante",
    "quiz.intermediate": "Intermediário",
    "quiz.advanced": "Avançado",
    "quiz.mode_label": "Modo",
    "quiz.mode_concept": "Conceito",
    "quiz.mode_connections": "Conexões",
    "quiz.mode_realworld": "Mundo real",
    "quiz.start": "Iniciar Quiz IA",
    "quiz.generating": "Gerando perguntas…",
    "quiz.correct": "✅ Correto!",
    "quiz.incorrect": "❌ Incorreto",
    "quiz.next": "Próxima Pergunta",
    "quiz.finish": "Finalizar Sessão",
    "quiz.complete": "🎯 Sessão Completa",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "Você entende bem os conceitos! Tente uma dificuldade maior.",
    "quiz.insight_review":
      "Revise os termos abaixo para fortalecer seu entendimento.",
    "quiz.review_terms": "Você deve revisar",
    "quiz.new_session": "Nova Sessão",
    "quiz.explore_graph": "Explorar Grafo",
    // Apply Code
    "apply.title": "💻 Aplique o que acabou de aprender",
    "apply.description":
      "Transforme conhecimento em desenvolvimento real — gere um exemplo prático de Solana baseado nos seus resultados.",
    "apply.generate": "Gerar Código Real",
    "apply.generating": "Gerando exemplo real…",
    "apply.explanation": "Explicação",
    "apply.key_concepts": "Conceitos-chave",
    "apply.explain_code": "Explicar este código",
    "apply.view_graph": "Ver no Grafo",
    "apply.regenerate": "↻ Gerar outro exemplo",
    "notfound.title": "404",
    "notfound.message": "Ops! Página não encontrada",
    "notfound.link": "Voltar para o Início",
    // AI status (Phase-1 gating)
    "ai.resting.title": "O Copilot está descansando",
    "ai.resting.body":
      "Os recursos de IA estão pausados por enquanto — navegação pelo glossário, busca, categorias e o grafo de conhecimento funcionam totalmente.",
  },
  es: {
    "hero.title.before": "Entiende",
    "hero.title.solana": "Solana",
    "hero.title.after": "al instante.",
    "hero.badge": "términos · 14 categorías · Glosario Oficial Solana",
    "hero.subtitle":
      "De conceptos a código real — impulsado por un glosario inteligente.",
    "hero.input_placeholder": "Busca un término o pega código... Prueba: ",
    "hero.code_detected": "Código detectado — Explicar con IA",
    "btn.copilot": "IA Copilot",
    "btn.explain_code": "Explicar Código",
    "btn.browse_glossary": "Explorar Glosario",
    "nav.glossary": "Glosario",
    "nav.code": "Código",
    "theme.label": "Tema oscuro",
    "theme.to_light": "Cambiar al tema claro",
    "theme.to_dark": "Cambiar al tema oscuro",
    "depth.label": "Profundidad",
    "depth.all": "Todas",
    "depth.hint": "Profundidad de conocimiento — 1 (superficie) a 5 (profundo)",
    "sort.label": "Ordenar",
    "filter.tags": "Etiquetas",
    "filter.clear": "Limpiar filtros",
    "sort.random": "Aleatorio",
    "sort.az": "A–Z",
    "sort.za": "Z–A",
    "sort.category": "Categoría",
    "swipe.hint": "Desliza para el siguiente término",
    "swipe.open": "Abrir vista completa",
    "tab.copilot": "Copilot",
    "tab.explain_code": "Explicar Código",
    "tab.explain_file": "Explicar Archivo",
    "category.all": "Todos",
    "category.showing": "Mostrando",
    "category.of": "de",
    "category.load_more": "Cargar más",
    "category.categories": "Categorías",
    "category.all_terms": "Todos los Términos",
    "term.not_found":
      "Término no encontrado — puede haber sido renombrado o eliminado.",
    "category.terms_suffix": "Términos",
    "category.terms_count": "términos",
    "category.remaining": "restantes",
    "cat.core-protocol": "Protocolo Central",
    "cat.programming-model": "Modelo de Programación",
    "cat.token-ecosystem": "Ecosistema de Tokens",
    "cat.defi": "DeFi",
    "cat.zk-compression": "Compresión ZK",
    "cat.infrastructure": "Infraestructura",
    "cat.security": "Seguridad",
    "cat.dev-tools": "Herramientas Dev",
    "cat.network": "Red",
    "cat.blockchain-general": "Blockchain General",
    "cat.web3": "Web3",
    "cat.programming-fundamentals": "Programación",
    "cat.ai-ml": "IA / ML",
    "cat.solana-ecosystem": "Ecosistema Solana",
    "search.placeholder": "Buscar {count} términos Solana…",
    "chat.title": "Solana Glossary",
    "chat.subtitle":
      "Pregúntame lo que sea sobre desarrollo Solana. Uso el glosario oficial ({count} términos) + IA para respuestas precisas y contextuales.",
    "chat.explain_title": "Explicar Código Solana",
    "chat.explain_subtitle":
      "Pega cualquier código Solana/Anchor y te explico cada concepto usando el glosario oficial con {count} términos.",
    "chat.placeholder": "Pregunta sobre conceptos Solana…",
    "chat.explain_placeholder": "Pega código Solana para explicar…",
    "chat.thinking": "Pensando…",
    "chat.demo.pda": "¿Qué es PDA en Solana?",
    "chat.demo.accounts": "Explica accounts como si fuera principiante",
    "chat.demo.poh": "¿Cómo funciona Proof of History?",
    "chat.demo.bft":
      "¿Cuál es la diferencia entre Tower BFT y PBFT tradicional?",
    "chat.demo.amm": "¿Qué es un AMM y cómo funciona en Solana?",
    "chat.demo.zk": "Explica ZK Compression en Solana",
    "chat.code.pda_label": "Explicar derivación de PDA",
    "chat.code.transfer_label": "Explicar transferencia de token",
    "file.paste_title": "Pega el Código para Analizar",
    "file.try_example": "Probar Ejemplo",
    "file.analyzing": "Analizando archivo y contexto del glosario…",
    "file.explain_btn": "Explicar Archivo Completo",
    "file.paste_placeholder":
      "Pega tu código Solana / Anchor / Rust / TypeScript aquí...",
    "file.empty_hint":
      'Pega el código arriba y haz clic en "Explicar Archivo Completo" para obtener un análisis estructurado con insights del glosario.',
    "file.upload_btn": "Subir Archivo",
    "file.export_btn": "Exportar Explicación",
    "file.drop_hint": "Suelta un archivo de código aquí",
    "term.related": "Términos Relacionados",
    "term.usage": "Usado en Contexto",
    "term.ai_insight": "Insight de IA",
    "term.cta_explain": "Explicar con IA",
    "term.cta_simplify": "Simplificar (ELI5)",
    "term.cta_code": "Usar en código",
    "term.cta_compare": "Comparar",
    "graph.title": "Grafo de Conocimiento",
    "graph.back": "Volver",
    "learn.mode": "Modo Aprendizaje",
    "learn.title": "Ruta de Aprendizaje",
    "learn.steps_label": "pasos",
    "learn.based_on_graph": "Basado en el Grafo de Conocimiento",
    "learn.not_found": "Término no encontrado. Vuelve al glosario.",
    "learn.explanation": "Explicación de IA",
    "learn.prev": "Anterior",
    "learn.next": "Siguiente Paso",
    "learn.complete": "Completar Ruta",
    "learn.restart": "Reiniciar",
    "learn.start": "Iniciar Ruta de Aprendizaje",
    // Quiz
    "quiz.title": "🧠 Practica con este concepto",
    "quiz.description":
      "Pon a prueba tu comprensión con preguntas generadas por IA basadas en este concepto y sus relaciones.",
    "quiz.difficulty": "Dificultad",
    "quiz.beginner": "Principiante",
    "quiz.intermediate": "Intermedio",
    "quiz.advanced": "Avanzado",
    "quiz.mode_label": "Modo",
    "quiz.mode_concept": "Concepto",
    "quiz.mode_connections": "Conexiones",
    "quiz.mode_realworld": "Mundo real",
    "quiz.start": "Iniciar Quiz IA",
    "quiz.generating": "Generando preguntas…",
    "quiz.correct": "✅ ¡Correcto!",
    "quiz.incorrect": "❌ Incorrecto",
    "quiz.next": "Siguiente Pregunta",
    "quiz.finish": "Finalizar Sesión",
    "quiz.complete": "🎯 Sesión Completa",
    "quiz.insights": "Insights",
    "quiz.insight_good":
      "¡Entiendes bien los conceptos! Prueba una dificultad mayor.",
    "quiz.insight_review":
      "Revisa los términos abajo para fortalecer tu comprensión.",
    "quiz.review_terms": "Deberías revisar",
    "quiz.new_session": "Nueva Sesión",
    "quiz.explore_graph": "Explorar Grafo",
    // Apply Code
    "apply.title": "💻 Aplica lo que acabas de aprender",
    "apply.description":
      "Transforma el conocimiento en desarrollo real — genera un ejemplo práctico de Solana basado en tus resultados.",
    "apply.generate": "Generar Código Real",
    "apply.generating": "Generando ejemplo real…",
    "apply.explanation": "Explicación",
    "apply.key_concepts": "Conceptos clave",
    "apply.explain_code": "Explicar este código",
    "apply.view_graph": "Ver en Grafo",
    "apply.regenerate": "↻ Generar otro ejemplo",
    "notfound.title": "404",
    "notfound.message": "¡Ups! Página no encontrada",
    "notfound.link": "Volver al Inicio",
    // AI status (Phase-1 gating)
    "ai.resting.title": "El Copilot está descansando",
    "ai.resting.body":
      "Las funciones de IA están en pausa por ahora — la navegación del glosario, la búsqueda, las categorías y el grafo de conocimiento funcionan completamente.",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  // Bumps when a locale's translation data finishes loading. Term consumers
  // depend on it so they recompute once the localized definitions arrive.
  localeDataVersion: number;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("locale");
    return isLocale(saved) ? saved : "en";
  });
  const [localeDataVersion, setLocaleDataVersion] = useState(0);

  const bumpOnLoad = useCallback((l: Locale) => {
    if (l === "en") return;
    preloadLocale(l as GlossaryLocale)
      .then(() => setLocaleDataVersion((v) => v + 1))
      .catch(() => {
        // Localized data unavailable — English fallback already renders.
      });
  }, []);

  // Load data for a non-English locale restored from localStorage on mount.
  useEffect(() => {
    bumpOnLoad(locale);
    // Mount-only: subsequent switches go through handleSetLocale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetLocale = useCallback(
    (l: Locale) => {
      // Labels switch instantly (bundled strings); terms catch up once the
      // localized definitions load.
      setLocale(l);
      localStorage.setItem("locale", l);
      bumpOnLoad(l);
    },
    [bumpOnLoad],
  );

  const t = (key: TranslationKey): string => {
    const raw = translations[locale]?.[key] || translations.en[key] || key;
    return raw.replace("{count}", String(TERM_COUNT));
  };

  return (
    <I18nContext.Provider
      value={{ locale, setLocale: handleSetLocale, t, localeDataVersion }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives beside its provider
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components -- locale-label map co-located with the provider
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};
