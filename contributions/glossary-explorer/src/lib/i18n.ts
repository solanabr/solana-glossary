import type { LocaleCode } from "./types";

export interface TranslationEntry {
  term: string;
  definition: string;
}

export type TranslationMap = Record<string, TranslationEntry>;

export const defaultLocale: LocaleCode = "en";

export const availableLocales = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "es", label: "ES" },
] as const;

export function isLocaleCode(value: string): value is LocaleCode {
  return availableLocales.some((locale) => locale.code === value);
}

export async function loadLocaleTranslations(
  locale: LocaleCode,
): Promise<TranslationMap> {
  switch (locale) {
    case "pt":
      return (await import("@/data/i18n/pt.json")).default as TranslationMap;
    case "es":
      return (await import("@/data/i18n/es.json")).default as TranslationMap;
    default:
      return {};
  }
}

export const uiCopy = {
  en: {
    nav: {
      home: "Home",
      explore: "Explore Graph",
      learn: "Learn",
      askAi: "Ask AI",
      commandHint: "Search",
    },
    home: {
      subtitle:
        "1001 terms across 14 categories. Search, browse, and explore the Solana ecosystem.",
      categories: "Categories",
      totalTerms: "total terms",
      graphMode: "Graph mode",
      graphTitle: "Explore the Relationship Graph",
      graphSubtitle: "Visualize connections between 1001 Solana concepts",
      graphCta: "Open interactive graph",
    },
    search: {
      placeholder: "Search 1001 Solana terms...",
      emptyPrompt: "Start typing to search the glossary",
    },
    chat: {
      title: "Ask Solana",
      subtitle: "AI chat with live MCP tool calling across the full glossary",
      badge: "Powered by MCP Server",
      inputPlaceholder: "Ask about any Solana concept...",
      send: "Send",
      thinking: "Thinking",
      emptyPrompt: "Ask me anything about Solana",
      modes: {
        normal: "Normal",
        learn: "Professor",
        bro: "Solana Bro",
      },
      suggestionsTitle: "Try one of these",
      openGraph: "View in Graph",
      openTerm: "Open term",
      minimize: "Minimize",
      expand: "Open AI assistant",
    },
    graph: {
      all: "All",
      nodes: "nodes",
      edges: "edges",
      clickToView: "Click to view",
      askAi: "Ask AI about this",
    },
    term: {
      related: "Related Terms",
      viewGraph: "View in Relationship Graph",
    },
    category: {
      terms: "terms",
      topTerms: "Top related terms",
    },
    learn: {
      title: "Learn Solana",
      subtitle: "Master the ecosystem with spaced repetition and guided paths",
      flashcards: "Flashcards",
      flashcardsDesc: "Study with SM-2 spaced repetition",
      learningPaths: "Learning Paths",
      pathsDesc: "Guided journeys through Solana concepts",
      startStudying: "Start Studying",
      continueStudying: "Continue Studying",
      dueToday: "due today",
      streak: "day streak",
      accuracy: "accuracy",
      mastered: "mastered",
      learning: "learning",
      newCards: "new",
      showAnswer: "Show Answer",
      nextCard: "Next Card",
      sessionComplete: "Session Complete!",
      reviewedCards: "cards reviewed",
      again: "Again",
      hard: "Hard",
      good: "Good",
      easy: "Easy",
      progress: "Progress",
      termsCompleted: "terms completed",
      beginPath: "Begin Path",
      continuePath: "Continue",
      completed: "Completed",
      estimatedTime: "Estimated time",
      hours: "hours",
      difficulty: "Difficulty",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      dailyChallenge: "Daily Challenge",
      liveData: "Live Network Data",
      codeExamples: "Code Examples",
      noExamples: "No code examples yet for this term.",
      openPlayground: "Open in Solana Playground",
      resetProgress: "Reset Progress",
      resetConfirm: "This will erase all your learning progress. Are you sure?",
    },
    footer: {
      builtOn: "Built on",
      suffix: "1001 terms across 14 categories",
    },
  },
  pt: {
    nav: {
      home: "Início",
      explore: "Explorar Grafo",
      learn: "Aprender",
      askAi: "Perguntar à IA",
      commandHint: "Buscar",
    },
    home: {
      subtitle:
        "1001 termos em 14 categorias. Busque, navegue e explore o ecossistema Solana.",
      categories: "Categorias",
      totalTerms: "termos",
      graphMode: "Modo grafo",
      graphTitle: "Explore o Grafo de Relações",
      graphSubtitle: "Visualize conexões entre 1001 conceitos de Solana",
      graphCta: "Abrir grafo interativo",
    },
    search: {
      placeholder: "Busque entre 1001 termos de Solana...",
      emptyPrompt: "Comece a digitar para buscar no glossário",
    },
    chat: {
      title: "Ask Solana",
      subtitle: "Chat com IA usando MCP ao vivo em todo o glossário",
      badge: "Powered by MCP Server",
      inputPlaceholder: "Pergunte sobre qualquer conceito de Solana...",
      send: "Enviar",
      thinking: "Pensando",
      emptyPrompt: "Pergunte qualquer coisa sobre Solana",
      modes: {
        normal: "Normal",
        learn: "Professor",
        bro: "Solana Bro",
      },
      suggestionsTitle: "Experimente uma destas",
      openGraph: "Ver no Grafo",
      openTerm: "Abrir termo",
      minimize: "Minimizar",
      expand: "Abrir assistente",
    },
    graph: {
      all: "Todos",
      nodes: "nós",
      edges: "arestas",
      clickToView: "Clique para abrir",
      askAi: "Perguntar à IA",
    },
    term: {
      related: "Termos Relacionados",
      viewGraph: "Ver no Grafo de Relações",
    },
    category: {
      terms: "termos",
      topTerms: "Termos mais conectados",
    },
    learn: {
      title: "Aprenda Solana",
      subtitle: "Domine o ecossistema com repetição espaçada e trilhas guiadas",
      flashcards: "Flashcards",
      flashcardsDesc: "Estude com repetição espaçada SM-2",
      learningPaths: "Trilhas de Aprendizado",
      pathsDesc: "Jornadas guiadas pelos conceitos Solana",
      startStudying: "Começar a Estudar",
      continueStudying: "Continuar Estudando",
      dueToday: "para hoje",
      streak: "dias seguidos",
      accuracy: "acerto",
      mastered: "dominados",
      learning: "aprendendo",
      newCards: "novos",
      showAnswer: "Mostrar Resposta",
      nextCard: "Próximo Card",
      sessionComplete: "Sessão Completa!",
      reviewedCards: "cards revisados",
      again: "De Novo",
      hard: "Difícil",
      good: "Bom",
      easy: "Fácil",
      progress: "Progresso",
      termsCompleted: "termos completos",
      beginPath: "Iniciar Trilha",
      continuePath: "Continuar",
      completed: "Completo",
      estimatedTime: "Tempo estimado",
      hours: "horas",
      difficulty: "Dificuldade",
      beginner: "Iniciante",
      intermediate: "Intermediário",
      advanced: "Avançado",
      dailyChallenge: "Desafio Diário",
      liveData: "Dados da Rede ao Vivo",
      codeExamples: "Exemplos de Código",
      noExamples: "Ainda sem exemplos de código para este termo.",
      openPlayground: "Abrir no Solana Playground",
      resetProgress: "Resetar Progresso",
      resetConfirm:
        "Isso vai apagar todo seu progresso de aprendizado. Tem certeza?",
    },
    footer: {
      builtOn: "Construído sobre",
      suffix: "1001 termos em 14 categorias",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      explore: "Explorar Grafo",
      learn: "Aprender",
      askAi: "Preguntar a IA",
      commandHint: "Buscar",
    },
    home: {
      subtitle:
        "1001 términos en 14 categorías. Busca, navega y explora el ecosistema de Solana.",
      categories: "Categorías",
      totalTerms: "términos",
      graphMode: "Modo grafo",
      graphTitle: "Explora el Grafo de Relaciones",
      graphSubtitle: "Visualiza conexiones entre 1001 conceptos de Solana",
      graphCta: "Abrir grafo interactivo",
    },
    search: {
      placeholder: "Busca entre 1001 términos de Solana...",
      emptyPrompt: "Empieza a escribir para buscar en el glosario",
    },
    chat: {
      title: "Ask Solana",
      subtitle: "Chat con IA usando MCP en vivo sobre todo el glosario",
      badge: "Powered by MCP Server",
      inputPlaceholder: "Pregunta sobre cualquier concepto de Solana...",
      send: "Enviar",
      thinking: "Pensando",
      emptyPrompt: "Pregúntame cualquier cosa sobre Solana",
      modes: {
        normal: "Normal",
        learn: "Profesor",
        bro: "Solana Bro",
      },
      suggestionsTitle: "Prueba una de estas",
      openGraph: "Ver en el Grafo",
      openTerm: "Abrir término",
      minimize: "Minimizar",
      expand: "Abrir asistente",
    },
    graph: {
      all: "Todos",
      nodes: "nodos",
      edges: "aristas",
      clickToView: "Haz clic para abrir",
      askAi: "Preguntar a IA",
    },
    term: {
      related: "Términos Relacionados",
      viewGraph: "Ver en el Grafo de Relaciones",
    },
    category: {
      terms: "términos",
      topTerms: "Términos más conectados",
    },
    learn: {
      title: "Aprende Solana",
      subtitle: "Domina el ecosistema con repetición espaciada y rutas guiadas",
      flashcards: "Flashcards",
      flashcardsDesc: "Estudia con repetición espaciada SM-2",
      learningPaths: "Rutas de Aprendizaje",
      pathsDesc: "Jornadas guiadas por los conceptos de Solana",
      startStudying: "Empezar a Estudiar",
      continueStudying: "Continuar Estudiando",
      dueToday: "para hoy",
      streak: "días seguidos",
      accuracy: "acierto",
      mastered: "dominados",
      learning: "aprendiendo",
      newCards: "nuevos",
      showAnswer: "Mostrar Respuesta",
      nextCard: "Siguiente Card",
      sessionComplete: "¡Sesión Completa!",
      reviewedCards: "cards revisados",
      again: "Otra vez",
      hard: "Difícil",
      good: "Bien",
      easy: "Fácil",
      progress: "Progreso",
      termsCompleted: "términos completados",
      beginPath: "Iniciar Ruta",
      continuePath: "Continuar",
      completed: "Completado",
      estimatedTime: "Tiempo estimado",
      hours: "horas",
      difficulty: "Dificultad",
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
      dailyChallenge: "Desafío Diario",
      liveData: "Datos de Red en Vivo",
      codeExamples: "Ejemplos de Código",
      noExamples: "Aún no hay ejemplos de código para este término.",
      openPlayground: "Abrir en Solana Playground",
      resetProgress: "Reiniciar Progreso",
      resetConfirm:
        "Esto borrará todo tu progreso de aprendizaje. ¿Estás seguro?",
    },
    footer: {
      builtOn: "Construido sobre",
      suffix: "1001 términos en 14 categorías",
    },
  },
} as const;

export function getUiCopy(locale: LocaleCode) {
  return uiCopy[locale] ?? uiCopy.en;
}
