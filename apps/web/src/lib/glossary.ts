/**
 * Client glossary: fetches /public/data (copied from repo `data/` on prebuild).
 * `terms-all.json` merges `data/terms/*.json`. i18n overlays: `i18n/pt.json`, `i18n/es.json`.
 */

export type Locale = "pt-BR" | "es" | "en";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  categoryLabel: string;
  locale: Locale;
  related?: string[];
  aliases?: string[];
}

/** Shape of entries in `data/terms/*.json`. */
export interface RawTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  related?: string[];
}

/** `data/i18n/pt.json` and `es.json` map term id → localized strings. */
export type I18nMap = Record<string, { term: string; definition: string }>;

const TERM_FILES = [
  "ai-ml",
  "blockchain-general",
  "core-protocol",
  "defi",
  "dev-tools",
  "infrastructure",
  "network",
  "programming-fundamentals",
  "programming-model",
  "security",
  "solana-ecosystem",
  "token-ecosystem",
  "web3",
  "zk-compression",
] as const;

export function slugToLabel(slug: string): string {
  const MAP: Record<string, string> = {
    "ai-ml": "AI & ML",
    "blockchain-general": "Blockchain",
    "core-protocol": "Core Protocol",
    defi: "DeFi",
    "dev-tools": "Dev Tools",
    infrastructure: "Infrastructure",
    network: "Network",
    "programming-fundamentals": "Programming",
    "programming-model": "Programming Model",
    security: "Security",
    "solana-ecosystem": "Solana Ecosystem",
    "token-ecosystem": "Tokens",
    web3: "Web3",
    "zk-compression": "ZK & Compression",
  };
  return (
    MAP[slug] ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const base =
    typeof window !== "undefined"
      ? ""
      : process.env.BASE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

  const res = await fetch(`${base}${path}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function loadAllRawTerms(): Promise<RawTerm[]> {
  try {
    const bundle = await fetchJson<RawTerm[]>("/data/terms-all.json");
    if (Array.isArray(bundle) && bundle.length > 0) return bundle;
  } catch {
    /* bundle missing or failed — fall back to per-file fetches */
  }

  const results = await Promise.allSettled(
    TERM_FILES.map((file) => fetchJson<RawTerm[]>(`/data/terms/${file}.json`)),
  );

  const terms: RawTerm[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      terms.push(...result.value);
    } else {
      console.warn(
        `[glossary] Failed to load ${TERM_FILES[i]}.json:`,
        result.reason,
      );
    }
  });
  return terms;
}

async function loadI18n(locale: "pt-BR" | "es"): Promise<I18nMap> {
  const file = locale === "pt-BR" ? "pt" : "es";
  try {
    return await fetchJson<I18nMap>(`/data/i18n/${file}.json`);
  } catch {
    console.warn(`[glossary] i18n ${file}.json not found, using English.`);
    return {};
  }
}

export function applyI18n(
  rawTerms: RawTerm[],
  i18n: I18nMap,
  locale: Locale,
): GlossaryTerm[] {
  return rawTerms.map((raw) => {
    const t = i18n[raw.id];
    return {
      id: raw.id,
      term: t?.term ?? raw.term,
      definition: t?.definition ?? raw.definition,
      category: raw.category,
      categoryLabel: slugToLabel(raw.category),
      locale,
      related: raw.related,
      aliases: raw.aliases,
    };
  });
}

const _cache: Partial<Record<Locale, GlossaryTerm[]>> = {};
let _rawCache: RawTerm[] | null = null;

export async function getTerms(locale: Locale): Promise<GlossaryTerm[]> {
  if (_cache[locale]) return _cache[locale]!;

  if (!_rawCache) _rawCache = await loadAllRawTerms();

  const terms =
    locale === "en"
      ? applyI18n(_rawCache, {}, "en")
      : applyI18n(_rawCache, await loadI18n(locale), locale);

  _cache[locale] = terms;
  return terms;
}

export function clearCache(): void {
  (Object.keys(_cache) as Locale[]).forEach((k) => delete _cache[k]);
  _rawCache = null;
}

export function getCategories(
  terms: GlossaryTerm[],
): { slug: string; label: string }[] {
  const map = new Map<string, string>();
  terms.forEach((t) => map.set(t.category, t.categoryLabel));
  return Array.from(map.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterByCategories(
  terms: GlossaryTerm[],
  slugs: string[],
): GlossaryTerm[] {
  if (slugs.length === 0) return terms;
  return terms.filter((t) => slugs.includes(t.category));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type UiDict = Record<string, string>;

/** Replace `{key}` placeholders in UI copy. */
export function formatUi(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export const UI_LABELS: Record<Locale, UiDict> = {
  "pt-BR": {
    search_placeholder: "Buscar termos, definições...",
    all_categories: "Todas as categorias",
    categories: "Categorias",
    flashcard_mode: "Flashcards",
    glossary: "Glossário",
    home: "Início",
    terms_found: "termos encontrados",
    flip_card: "Toque para ver a definição",
    flip_back: "Toque para ver o termo",
    next: "Próximo",
    previous: "Anterior",
    shuffle: "Embaralhar",
    progress: "Progresso",
    related: "Relacionados",
    no_results: "Nenhum resultado",
    no_results_hint: "Tente outras palavras ou limpe os filtros.",
    lang_label: "Idioma",
    loading: "Carregando…",
    card_of: "de",
    filter_active: "filtros",
    reset_filters: "Limpar filtros",
    brand: "Solana Glossary",
    nav_flashcards: "Flashcards",
    nav_github: "GitHub",
    nav_contribute: "Contribua",
    contribute_intro:
      "Guia para propor termos novos ou traduções. O texto abaixo segue o CONTRIBUTING.md do repositório.",
    contribute_back: "Voltar ao glossário",
    contribute_github_md: "CONTRIBUTING.md no GitHub",
    contribute_repo: "Repositório no GitHub",
    hero_title_rest: "Glossário",
    hero_tagline_prefix:
      "O glossário que a comunidade Solana abraçou está de volta. ",
    hero_tagline_suffix: "+ termos, referências cruzadas. ",
    hero_tagline_after_learn: ", explore ",
    hero_tagline_after_flashcards: ", ",
    hero_tagline_after_graph: ", ",
    hero_tagline_before_contribute: ", e se quiser ajudar, ",
    hero_contribute_inline: "contribua",
    hero_tagline_tail: " — feito para devs, vibe coders e LLMs.",
    nav_vscode: "VS Code",
    filter_button: "Filtro",
    stat_terms: "Termos",
    stat_categories: "Categorias",
    stat_langs: "Idiomas",
    filters: "Filtros",
    mobile_filter_title: "Categorias",
    mobile_see_results: "Ver {n} resultados",
    fuzzy_hint: "Busca aproximada — inclui correspondências parciais.",
    clear_search: "Limpar busca",
    read_more: "Ler mais",
    read_less: "Mostrar menos",
    see_also: "Ver também",
    lang_active: "Ativo",
    category_clear: "limpar",
    load_more: "Carregar mais",
    showing_n_of_m: "Mostrando {n} de {m}",
    flash_study_zone: "Modo estudo",
    flash_study_sub: "Vire o cartão, marque o que já sabe e avance no deck.",
    label_term: "Termo",
    label_definition: "Definição",
    flash_config_title: "Filtrar deck",
    flash_apply: "Aplicar",
    flash_deck: "Deck",
    flash_cards: "cartões",
    flash_known: "Conhecidos",
    flash_restart: "Reiniciar",
    flash_empty_title: "Deck vazio",
    flash_empty_hint: "Escolha categorias nos filtros ou use todos os termos.",
    flash_use_all: "Usar todos os termos",
    flash_session_done: "Sessão concluída",
    flash_session_studied: "Você revisou {n} termos.",
    flash_known_review: "{k} conhecidos · {r} para revisar",
    flash_redo: "Refazer tudo",
    flash_review_unknown: "Revisar os {n} pendentes",
    flash_back: "Voltar ao glossário",
    flash_finish: "Finalizar",
    flash_settings: "Configurações",
    flash_still_learning: "Ainda não sei",
    flash_i_know: "Eu sei",
    flash_keys: "← → navegar · Enter ou espaço para virar",
    flash_known_history: "Conhecidos nesta sessão",
    flash_known_history_empty: 'Marque "Eu sei" para listar aqui.',
    flash_share_twitter: "Compartilhar no X",
    flash_confetti: "Confete",
    flash_confetti_aria:
      "Ativar ou desativar animação de confete ao marcar «Eu sei»",
    flash_share_text: "Acertei {n} termos no Solana Glossary 🎉",
    nav_learn: "Comece aqui",
    learn_title: "Trilha de aprendizado",
    learn_intro:
      "Rota em quatro módulos — do relógio do protocolo até tokens e mainnet. Pensada como os learning paths de docs de blockchain: blocos curtos, ordem didática, aprofundamento nos links.",
    learn_outcome:
      "Objetivo: sair com uma linha mental clara — tempo de rede → estado on-chain → execução → mundo real.",
    learn_stats:
      "{topics} tópicos · {modules} módulos · ~{minutes} min de leitura",
    learn_how_title: "Como seguir",
    learn_how_body:
      "Percorra os módulos na ordem. Em cada tópico, leia a definição; use «relacionados» ou o mapa para ir além quando quiser.",
    learn_close: "Fechar",
    learn_path_loading: "Carregando trilha…",
    learn_mark_read: "Marcar como lido",
    learn_mark_unread: "Desmarcar leitura",
    learn_read_badge: "Lido",
    learn_toggle_read_aria: "Alternar lido",
    learn_term_full_page: "Abrir página do termo",
    learn_back_path: "Voltar à trilha",
    learn_next_steps: "Próximos passos",
    learn_cta_start: "Abrir primeiro tópico",
    learn_cta_flashcards: "Praticar com flashcards",
    learn_cta_graph: "Explorar no mapa",
    learn_stage_consensus_title: "Tempo e consenso",
    learn_stage_consensus_desc:
      "Como a Solana ordena eventos, fecha slots e quem participa da validação.",
    learn_stage_accounts_title: "Contas e rent",
    learn_stage_accounts_desc:
      "O modelo de conta e por que armazenar estado tem custo recorrente.",
    learn_stage_programs_title: "Programas e execução",
    learn_stage_programs_desc:
      "Bytecode on-chain, transações atômicas e PDAs para endereços determinísticos.",
    learn_stage_network_title: "Tokens e rede",
    learn_stage_network_desc:
      "SPL Token e o que muda quando você fala de mainnet-beta.",
    term_back: "Voltar ao glossário",
    term_flashcards_link: "Flashcards",
    term_other_lang: "Idioma",
    term_share: "Compartilhar no X",
    term_copied: "Link copiado",
    load_error:
      "Não foi possível carregar o glossário. Verifique a conexão ou tente de novo.",
    retry: "Tentar novamente",
    no_categories: "Sem categorias",
    nav_graph: "Mapa",
    nav_menu: "Menu",
    nav_open_menu: "Abrir menu",
    nav_close_menu: "Fechar menu",
    graph_title: "Mapa de relações",
    graph_intro:
      "Visualização interativa das ligações entre termos (campo “relacionados” e referências inversas). O termo em foco fica no centro; ajuste a profundidade para ver vizinhos de 1 ou 2 saltos.",
    graph_focus: "Focar termo",
    graph_depth: "Profundidade",
    graph_depth1: "1 salto (vizinhos diretos)",
    graph_depth2: "2 saltos (vizinhos dos vizinhos)",
    graph_nodes: "{n} termos neste mapa",
    graph_hint:
      "Toque ou clique num nó para ver a definição. Duplo toque/clique recentra. Arraste o fundo para mover; use + e − para zoom (sem roda — evita conflito com a página).",
    graph_modal_close: "Fechar",
    graph_modal_center: "Centrar mapa aqui",
    graph_reset_view: "Resetar",
    graph_zoom: "Zoom",
    graph_zoom_in: "Aumentar zoom",
    graph_zoom_out: "Diminuir zoom",
    graph_legend: "Categorias",
    graph_search_placeholder: "Buscar para focar…",
    graph_meta_description:
      "Grafo interativo das relações entre termos do glossário Solana.",
    term_graph_link: "Ver no mapa",
    nav_match: "Combina",
    match_title: "Combina termos",
    match_subtitle:
      "Arrasta cada termo para a definição certa. Começas no nível 0 (1 par) e avanças até 16 pares no nível 15. Entre níveis há 2 segundos de pausa (com confete); o cronómetro para aí. Tens 2 minutos no total.",
    match_level_hud: "Nível {n}/{max}",
    match_level_complete: "Nível {n} concluído!",
    match_next_level_s: "Próximo nível em {s}s",
    match_won_all: "Completaste todos os níveis!",
    match_levels_summary: "Níveis 0 a {max} completos",
    match_share_all_levels:
      "🎮 Solana Glossary Match · Níveis 0–{max} · ⏱ {time} · ✓ {matches} acertos · ✗ {errors} erros · {score} pts",
    match_level_n: "Nível {n}",
    match_pairs: "{n} pares",
    match_timer: "Tempo",
    match_errors: "Erros",
    match_matches: "Acertos",
    match_score: "Pontuação",
    match_score_hint: "Acertos × 100 − erros × 40 − segundos",
    match_start: "Começar",
    match_menu_intro: "Junta cada termo à definição certa.",
    match_play_again: "Jogar de novo",
    match_terms: "Termos",
    match_definitions: "Definições",
    match_drag_hint:
      "Arraste o termo ate a definição certa. Soltar muito depressa não conta.",
    match_won: "Concluíste!",
    match_lost: "Tempo esgotado",
    match_time_up: "O tempo acabou antes de combinares todos os pares.",
    match_result: "Resultado",
    match_share_x: "Compartilhar no X",
    match_back: "Voltar ao glossário",
    match_share_text:
      "🎮 Solana Glossary Match · {level} · ⏱ {time} · ✓ {matches} acertos · ✗ {errors} erros · {score} pts",
    match_meta_description:
      "Jogo de arrastar e largar: associa termos do glossário Solana às definições certas.",
    match_aria_matched: "Acerto: {term} combinado com a definição.",
    match_aria_wrong: "Combinação errada.",
    match_aria_level: "Nível {n} concluído. A seguir, o próximo nível.",
    match_aria_won: "Ganhaste: completaste todos os níveis.",
    match_aria_lost: "Tempo esgotado. Fim de jogo.",
    home_recent_title: "Vistos recentemente",
    home_recent_open: "Recentes",
    home_recent_open_aria: "Abrir termos vistos recentemente",
    home_recent_close: "Fechar",
    term_read_tag: "Lido",
    home_hero_kicker: "Glossário da comunidade",
    home_rail_title: "Explorar",
    home_footer_built_prefix: "Feito com carinho ❤️ ",
    home_footer_superteam: "Superteam Brazil",
    home_footer_superteam_aria: "Superteam Brazil no GitHub",
    home_mode_learn_desc: "Trilha guiada, passo a passo.",
    home_mode_graph_desc: "Mapa de conceitos relacionados.",
    home_mode_flash_desc: "Memorização ativa com cartas.",
    home_mode_match_desc: "Arrasta e associa definições.",
    empty_state_search_tip:
      "A busca aproximada precisa de pelo menos 2 caracteres; limpa filtros ou experimenta outras palavras.",
    load_error_hint:
      "Verifica a ligação à rede ou bloqueadores; depois tenta carregar de novo.",
    flash_meta_description:
      "Estuda termos Solana com flashcards: filtra por categoria, marca o que já sabes e revisa o deck.",
  },
  es: {
    search_placeholder: "Buscar términos, definiciones...",
    all_categories: "Todas las categorías",
    categories: "Categorías",
    flashcard_mode: "Flashcards",
    glossary: "Glosario",
    home: "Inicio",
    terms_found: "términos encontrados",
    flip_card: "Toca para ver la definición",
    flip_back: "Toca para ver el término",
    next: "Siguiente",
    previous: "Anterior",
    shuffle: "Mezclar",
    progress: "Progreso",
    related: "Relacionados",
    no_results: "Sin resultados",
    no_results_hint: "Prueba otras palabras o limpia los filtros.",
    lang_label: "Idioma",
    loading: "Cargando…",
    card_of: "de",
    filter_active: "filtros",
    reset_filters: "Limpiar filtros",
    brand: "Solana Glossary",
    nav_flashcards: "Flashcards",
    nav_github: "GitHub",
    nav_contribute: "Contribuye",
    contribute_intro:
      "Guía para proponer términos nuevos o traducciones. El texto sigue el CONTRIBUTING.md del repositorio.",
    contribute_back: "Volver al glosario",
    contribute_github_md: "CONTRIBUTING.md en GitHub",
    contribute_repo: "Repositorio en GitHub",
    hero_title_rest: "Glosario",
    hero_tagline_prefix:
      "El glosario de Solana que abrazó la comunidad vuelve. ",
    hero_tagline_suffix: "+ términos, referencias cruzadas. ",
    hero_tagline_after_learn: ", explora ",
    hero_tagline_after_flashcards: ", ",
    hero_tagline_after_graph: ", ",
    hero_tagline_before_contribute: ", y si quieres ayudar, ",
    hero_contribute_inline: "contribuye",
    hero_tagline_tail: " — pensado para devs, vibe coders y LLMs.",
    nav_vscode: "VS Code",
    filter_button: "Filtro",
    stat_terms: "Términos",
    stat_categories: "Categorías",
    stat_langs: "Idiomas",
    filters: "Filtros",
    mobile_filter_title: "Categorías",
    mobile_see_results: "Ver {n} resultados",
    fuzzy_hint: "Búsqueda difusa — incluye coincidencias parciales.",
    clear_search: "Borrar búsqueda",
    read_more: "Leer más",
    read_less: "Mostrar menos",
    see_also: "Ver también",
    lang_active: "Activo",
    category_clear: "limpiar",
    load_more: "Cargar más",
    showing_n_of_m: "Mostrando {n} de {m}",
    flash_study_zone: "Modo estudio",
    flash_study_sub: "Gira la tarjeta, marca lo que sabes y avanza en el mazo.",
    label_term: "Término",
    label_definition: "Definición",
    flash_config_title: "Filtrar mazo",
    flash_apply: "Aplicar",
    flash_deck: "Mazo",
    flash_cards: "tarjetas",
    flash_known: "Conocidos",
    flash_restart: "Reiniciar",
    flash_empty_title: "Mazo vacío",
    flash_empty_hint:
      "Elige categorías en los filtros o usa todos los términos.",
    flash_use_all: "Usar todos los términos",
    flash_session_done: "Sesión completada",
    flash_session_studied: "Revisaste {n} términos.",
    flash_known_review: "{k} conocidos · {r} para repasar",
    flash_redo: "Repetir todo",
    flash_review_unknown: "Repasar los {n} pendientes",
    flash_back: "Volver al glosario",
    flash_finish: "Terminar",
    flash_settings: "Ajustes",
    flash_still_learning: "Todavía no",
    flash_i_know: "Lo sé",
    flash_keys: "← → navegar · Enter o espacio para girar",
    flash_known_history: "Conocidos en esta sesión",
    flash_known_history_empty: 'Marca "Lo sé" para verlos aquí.',
    flash_share_twitter: "Compartir en X",
    flash_confetti: "Confeti",
    flash_confetti_aria:
      "Activar o desactivar animación de confeti al marcar «Lo sé»",
    flash_share_text: "¡Acerté {n} términos en Solana Glossary! 🎉",
    nav_learn: "Empieza aquí",
    learn_title: "Ruta de aprendizaje",
    learn_intro:
      "Cuatro módulos — del reloj del protocolo a tokens y mainnet. Inspirada en learning paths de documentación blockchain: bloques cortos, orden pedagógico, profundización con enlaces.",
    learn_outcome:
      "Meta: una línea clara — tiempo de red → estado on-chain → ejecución → uso real.",
    learn_stats:
      "{topics} temas · {modules} módulos · ~{minutes} min de lectura",
    learn_how_title: "Cómo seguirla",
    learn_how_body:
      "Avanza los módulos en orden. En cada término lee la definición; usa «relacionados» o el mapa para profundizar.",
    learn_close: "Cerrar",
    learn_path_loading: "Cargando ruta…",
    learn_mark_read: "Marcar como leído",
    learn_mark_unread: "Quitar leído",
    learn_read_badge: "Leído",
    learn_toggle_read_aria: "Alternar leído",
    learn_term_full_page: "Abrir página del término",
    learn_back_path: "Volver a la ruta",
    learn_next_steps: "Próximos pasos",
    learn_cta_start: "Abrir el primer tema",
    learn_cta_flashcards: "Practicar con flashcards",
    learn_cta_graph: "Ver en el mapa",
    learn_stage_consensus_title: "Tiempo y consenso",
    learn_stage_consensus_desc:
      "Cómo Solana ordena eventos, cierra slots y quién valida.",
    learn_stage_accounts_title: "Cuentas y rent",
    learn_stage_accounts_desc:
      "Modelo de cuentas y por qué el estado on-chain tiene coste recurrente.",
    learn_stage_programs_title: "Programas y ejecución",
    learn_stage_programs_desc:
      "Bytecode on-chain, transacciones atómicas y PDAs para direcciones deterministas.",
    learn_stage_network_title: "Tokens y red",
    learn_stage_network_desc: "SPL Token y qué implica hablar de mainnet-beta.",
    term_back: "Volver al glosario",
    term_flashcards_link: "Flashcards",
    term_other_lang: "Idioma",
    term_share: "Compartir en X",
    term_copied: "Enlace copiado",
    load_error:
      "No se pudo cargar el glosario. Comprueba la conexión o inténtalo de nuevo.",
    retry: "Reintentar",
    no_categories: "Sin categorías",
    nav_graph: "Mapa",
    nav_menu: "Menú",
    nav_open_menu: "Abrir menú",
    nav_close_menu: "Cerrar menú",
    graph_title: "Mapa de relaciones",
    graph_intro:
      "Visualización interactiva de enlaces entre términos (campo “relacionados” y referencias inversas). El término en foco queda al centro; ajusta la profundidad para ver vecinos a 1 o 2 saltos.",
    graph_focus: "Enfocar término",
    graph_depth: "Profundidad",
    graph_depth1: "1 salto (vecinos directos)",
    graph_depth2: "2 saltos (vecinos de vecinos)",
    graph_nodes: "{n} términos en este mapa",
    graph_hint:
      "Toca o haz clic en un nodo para ver la definición. Doble toque/clic para recentrar. Arrastra el fondo; usa + y − para zoom (sin rueda, sin conflicto con el scroll).",
    graph_modal_close: "Cerrar",
    graph_modal_center: "Centrar mapa aquí",
    graph_reset_view: "Restablecer",
    graph_zoom: "Zoom",
    graph_zoom_in: "Acercar",
    graph_zoom_out: "Alejar",
    graph_legend: "Categorías",
    graph_search_placeholder: "Buscar para enfocar…",
    graph_meta_description:
      "Grafo interactivo de relaciones entre términos del glosario Solana.",
    term_graph_link: "Ver en el mapa",
    nav_match: "Combina",
    match_title: "Empareja términos",
    match_subtitle:
      "Arrastra cada término a su definición. Empiezas en el nivel 0 (1 par) y subes hasta 16 pares en el nivel 15. Entre niveles hay 2 s de pausa (con confeti); el cronómetro se detiene. Tienes 2 minutos en total.",
    match_level_hud: "Nivel {n}/{max}",
    match_level_complete: "¡Nivel {n} completado!",
    match_next_level_s: "Siguiente nivel en {s}s",
    match_won_all: "¡Completaste todos los niveles!",
    match_levels_summary: "Niveles 0 a {max} completados",
    match_share_all_levels:
      "🎮 Solana Glossary Match · Niveles 0–{max} · ⏱ {time} · ✓ {matches} aciertos · ✗ {errors} errores · {score} pts",
    match_level_n: "Nivel {n}",
    match_pairs: "{n} pares",
    match_timer: "Tiempo",
    match_errors: "Errores",
    match_matches: "Aciertos",
    match_score: "Puntuación",
    match_score_hint: "Aciertos × 100 − errores × 40 − segundos",
    match_start: "Empezar",
    match_menu_intro: "Une cada término con su definición.",
    match_play_again: "Jugar otra vez",
    match_terms: "Términos",
    match_definitions: "Definiciones",
    match_drag_hint:
      "Arrastra el termino a la definicion correcta. Soltar demasiado rapido no cuenta.",
    match_won: "¡Completado!",
    match_lost: "Se acabó el tiempo",
    match_time_up: "Se acabó el tiempo antes de emparejar todos los pares.",
    match_result: "Resultado",
    match_share_x: "Compartir en X",
    match_back: "Volver al glosario",
    match_share_text:
      "🎮 Solana Glossary Match · {level} · ⏱ {time} · ✓ {matches} aciertos · ✗ {errors} errores · {score} pts",
    match_meta_description:
      "Juego de arrastrar y soltar: relaciona términos del glosario Solana con sus definiciones.",
    match_aria_matched: "Correcto: {term} emparejado con la definición.",
    match_aria_wrong: "Definición incorrecta.",
    match_aria_level: "Nivel {n} completado. Siguiente nivel.",
    match_aria_won: "Ganaste: completaste todos los niveles.",
    match_aria_lost: "Se acabó el tiempo. Fin del juego.",
    home_recent_title: "Vistos recientemente",
    home_recent_open: "Recientes",
    home_recent_open_aria: "Abrir términos vistos recientemente",
    home_recent_close: "Cerrar",
    term_read_tag: "Leído",
    home_hero_kicker: "Glosario comunitario",
    home_rail_title: "Explorar",
    home_footer_built_prefix: "Hecho con cariño ❤️ ",
    home_footer_superteam: "Superteam Brazil",
    home_footer_superteam_aria: "Superteam Brazil en GitHub",
    home_mode_learn_desc: "Ruta guiada paso a paso.",
    home_mode_graph_desc: "Mapa de conceptos relacionados.",
    home_mode_flash_desc: "Memorización activa con tarjetas.",
    home_mode_match_desc: "Arrastra y empareja definiciones.",
    empty_state_search_tip:
      "La búsqueda difusa necesita al menos 2 caracteres; limpia filtros o prueba otras palabras.",
    load_error_hint:
      "Comprueba la red o bloqueadores; luego intenta cargar de nuevo.",
    flash_meta_description:
      "Estudia términos Solana con flashcards: filtra por categoría, marca lo que sabes y repasa el mazo.",
  },
  en: {
    search_placeholder: "Search terms, definitions...",
    all_categories: "All categories",
    categories: "Categories",
    flashcard_mode: "Flashcards",
    glossary: "Glossary",
    home: "Home",
    terms_found: "terms found",
    flip_card: "Tap to reveal the definition",
    flip_back: "Tap to see the term",
    next: "Next",
    previous: "Previous",
    shuffle: "Shuffle",
    progress: "Progress",
    related: "Related",
    no_results: "No results",
    no_results_hint: "Try different words or clear filters.",
    lang_label: "Language",
    loading: "Loading…",
    card_of: "of",
    filter_active: "filters",
    reset_filters: "Clear filters",
    brand: "Solana Glossary",
    nav_flashcards: "Flashcards",
    nav_github: "GitHub",
    nav_contribute: "Contribute",
    contribute_intro:
      "How to propose new terms or translations. The content below mirrors the repo CONTRIBUTING.md.",
    contribute_back: "Back to glossary",
    contribute_github_md: "CONTRIBUTING.md on GitHub",
    contribute_repo: "GitHub repository",
    hero_title_rest: "Glossary",
    hero_tagline_prefix: "The Solana glossary the community embraced is back. ",
    hero_tagline_suffix: "+ terms, cross\u2011referenced. ",
    hero_tagline_after_learn: ", explore ",
    hero_tagline_after_flashcards: ", ",
    hero_tagline_after_graph: ", ",
    hero_tagline_before_contribute: ", and if you want to help ",
    hero_contribute_inline: "contribute",
    hero_tagline_tail: " — built for devs, vibe coders, and LLMs.",
    nav_vscode: "VS Code",
    filter_button: "Filter",
    stat_terms: "Terms",
    stat_categories: "Categories",
    stat_langs: "Languages",
    filters: "Filters",
    mobile_filter_title: "Categories",
    mobile_see_results: "Show {n} results",
    fuzzy_hint: "Fuzzy search — partial matches included.",
    clear_search: "Clear search",
    read_more: "Read more",
    read_less: "Show less",
    see_also: "See also",
    lang_active: "Active",
    category_clear: "clear",
    load_more: "Load more",
    showing_n_of_m: "Showing {n} of {m}",
    flash_study_zone: "Study mode",
    flash_study_sub:
      "Flip the card, mark what you know, and move through the deck.",
    label_term: "Term",
    label_definition: "Definition",
    flash_config_title: "Filter deck",
    flash_apply: "Apply",
    flash_deck: "Deck",
    flash_cards: "cards",
    flash_known: "Known",
    flash_restart: "Restart",
    flash_empty_title: "Empty deck",
    flash_empty_hint: "Pick categories in filters or use all terms.",
    flash_use_all: "Use all terms",
    flash_session_done: "Session complete",
    flash_session_studied: "You reviewed {n} terms.",
    flash_known_review: "{k} known · {r} to review",
    flash_redo: "Study all again",
    flash_review_unknown: "Review the {n} remaining",
    flash_back: "Back to glossary",
    flash_finish: "Finish",
    flash_settings: "Settings",
    flash_still_learning: "Still learning",
    flash_i_know: "I know this",
    flash_keys: "← → navigate · Enter or space to flip",
    flash_known_history: "Known this session",
    flash_known_history_empty: 'Tap "I know this" to list them here.',
    flash_share_twitter: "Share on X",
    flash_confetti: "Confetti",
    flash_confetti_aria:
      'Turn celebration confetti on or off when you tap "I know this"',
    flash_share_text: "I got {n} terms right on Solana Glossary 🎉",
    nav_learn: "Start here",
    learn_title: "Learning path",
    learn_intro:
      "Four modules — from protocol timekeeping to tokens and mainnet. Modeled after learning paths in major blockchain docs: short steps, teaching order, go deeper via related links.",
    learn_outcome:
      "Goal: a clear mental model — network time → on-chain state → execution → real-world usage.",
    learn_stats: "{topics} topics · {modules} modules · ~{minutes} min read",
    learn_how_title: "How to use it",
    learn_how_body:
      "Work through the modules in order. For each term, read the definition; use “related” or the graph when you want more context.",
    learn_close: "Close",
    learn_path_loading: "Loading path…",
    learn_mark_read: "Mark as read",
    learn_mark_unread: "Mark as unread",
    learn_read_badge: "Read",
    learn_toggle_read_aria: "Toggle read",
    learn_term_full_page: "Open term page",
    learn_back_path: "Back to path",
    learn_next_steps: "Next steps",
    learn_cta_start: "Open the first topic",
    learn_cta_flashcards: "Practice with flashcards",
    learn_cta_graph: "Explore the map",
    learn_stage_consensus_title: "Time & consensus",
    learn_stage_consensus_desc:
      "How Solana orders events, closes slots, and who validates the chain.",
    learn_stage_accounts_title: "Accounts & rent",
    learn_stage_accounts_desc:
      "The account model and why storing state has ongoing cost.",
    learn_stage_programs_title: "Programs & execution",
    learn_stage_programs_desc:
      "On-chain bytecode, atomic transactions, and PDAs for deterministic addresses.",
    learn_stage_network_title: "Tokens & network",
    learn_stage_network_desc:
      "SPL Token and what mainnet-beta means in practice.",
    term_back: "Back to glossary",
    term_flashcards_link: "Flashcards",
    term_other_lang: "Language",
    term_share: "Share on X",
    term_copied: "Link copied",
    load_error:
      "Could not load the glossary. Check your connection and try again.",
    retry: "Try again",
    no_categories: "No categories",
    nav_graph: "Map",
    nav_menu: "Menu",
    nav_open_menu: "Open menu",
    nav_close_menu: "Close menu",
    graph_title: "Relation map",
    graph_intro:
      "Interactive view of how terms link via the “related” field and reverse references. The focused term stays centered; choose depth to show 1-hop or 2-hop neighbors.",
    graph_focus: "Focus term",
    graph_depth: "Depth",
    graph_depth1: "1 hop (direct neighbors)",
    graph_depth2: "2 hops (neighbors of neighbors)",
    graph_nodes: "{n} terms in this map",
    graph_hint:
      "Tap or click a node for the definition preview. Double-tap/click refocuses. Drag the canvas to pan; use + and − to zoom (no wheel — avoids fighting page scroll).",
    graph_modal_close: "Close",
    graph_modal_center: "Center map here",
    graph_reset_view: "Reset",
    graph_zoom: "Zoom",
    graph_zoom_in: "Zoom in",
    graph_zoom_out: "Zoom out",
    graph_legend: "Categories",
    graph_search_placeholder: "Search to focus…",
    graph_meta_description:
      "Interactive graph of cross-references between Solana glossary terms.",
    term_graph_link: "View on map",
    nav_match: "Match",
    match_title: "Term match",
    match_subtitle:
      "Drag each term onto its definition. You start at level 0 (1 pair) and work up to 16 pairs at level 15. Between levels you get a 2s confetti break—the timer pauses there. You have 2 minutes total.",
    match_level_hud: "Level {n}/{max}",
    match_level_complete: "Level {n} complete!",
    match_next_level_s: "Next level in {s}s",
    match_won_all: "You cleared every level!",
    match_levels_summary: "Levels 0 through {max} cleared",
    match_share_all_levels:
      "🎮 Solana Glossary Match · Levels 0–{max} · ⏱ {time} · ✓ {matches} matches · ✗ {errors} mistakes · {score} pts",
    match_level_n: "Level {n}",
    match_pairs: "{n} pairs",
    match_timer: "Time",
    match_errors: "Mistakes",
    match_matches: "Matches",
    match_score: "Score",
    match_score_hint: "Matches × 100 − mistakes × 40 − seconds",
    match_start: "Start",
    match_menu_intro: "Match each term to its definition.",
    match_play_again: "Play again",
    match_terms: "Terms",
    match_definitions: "Definitions",
    match_drag_hint:
      "Drag the term to the right definition. Releasing too fast won't count.",
    match_won: "You matched them all!",
    match_lost: "Time’s up",
    match_time_up: "Time ran out before you matched every pair.",
    match_result: "Results",
    match_share_x: "Share on X",
    match_back: "Back to glossary",
    match_share_text:
      "🎮 Solana Glossary Match · {level} · ⏱ {time} · ✓ {matches} matches · ✗ {errors} mistakes · {score} pts",
    match_meta_description:
      "Drag-and-drop game: match Solana glossary terms to the right definitions.",
    match_aria_matched: "Match: {term} paired with the right definition.",
    match_aria_wrong: "Wrong definition.",
    match_aria_level: "Level {n} complete. Next level starting.",
    match_aria_won: "You won: all levels complete.",
    match_aria_lost: "Time is up. Game over.",
    home_recent_title: "Recently viewed",
    home_recent_open: "Recent",
    home_recent_open_aria: "Open recently viewed terms",
    home_recent_close: "Close",
    term_read_tag: "Read",
    home_hero_kicker: "Community glossary",
    home_rail_title: "Explore",
    home_footer_built_prefix: "Built with love ❤️ ",
    home_footer_superteam: "Superteam Brazil",
    home_footer_superteam_aria: "Superteam Brazil on GitHub",
    home_mode_learn_desc: "Guided path, step by step.",
    home_mode_graph_desc: "Map of related concepts.",
    home_mode_flash_desc: "Active recall with cards.",
    home_mode_match_desc: "Drag and match definitions.",
    empty_state_search_tip:
      "Fuzzy search needs at least 2 characters; clear filters or try other words.",
    load_error_hint: "Check your network or blockers, then try loading again.",
    flash_meta_description:
      "Study Solana terms with flashcards: filter by category, mark what you know, and review your deck.",
  },
};
