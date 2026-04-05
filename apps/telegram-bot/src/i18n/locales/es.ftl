start-welcome =
    👋 <b>Solana Glossary Bot</b>

    Entiende términos de Solana, practica y sigue aprendiendo sin salir de Telegram.

    💬 <code>/explicar</code> — decodifica términos dentro de la conversación
    🔍 <code>/glosario</code> — busca cualquier concepto directamente
    🧠 <code>/quiz</code> — practica y construye tu racha
    💻 <code>/path</code> — sigue rutas guiadas de aprendizaje

help-message =
    📘 <b>Solana Glossary Bot</b>

    <b>Entender</b>
    <code>/glosario &lt;término&gt;</code> — búsqueda directa por concepto
    <code>/explicar</code> — explica términos desde una reply
    <code>/comparar termino1 termino2</code> — compara dos conceptos lado a lado

    <b>Aprender</b>
    <code>/path</code> — abre rutas guiadas
    <code>/quiz</code> — práctica rápida con opciones de ronda

    <b>Progreso</b>
    <code>/streak</code> — muestra tu constancia
    <code>/leaderboard</code> — muestra tu posición en el ranking

    <b>Biblioteca</b>
    <code>/categorias</code> — explora el glosario por tema
    <code>/favoritos</code> — revisa términos guardados
    <code>/historial</code> — muestra tus últimos términos
    <code>/aleatorio</code> — descubre un término aleatorio
    <code>/terminodelhoy</code> — destaca el término del día

    🌐 Idioma: <code>/idioma pt|en|es</code>

term-aliases = 🔗 Alias
term-related = 📂 Relacionados

btn-related = 🔍 Términos relacionados
btn-category = 📂 Ver categoría
btn-share = 📤 Compartir

btn-prev = ← Volver
btn-next = Siguiente →
btn-page = Pág { $current }/{ $total }
btn-back-categories = 🔙 Categorías
btn-back-menu = 🏠 Menú

random-term-header = 🎲 Término aleatorio

quiz-question =
    🧠 <b>¿Qué término describe esto?</b>  { $difficulty }

    <i>{ $definition }</i>
quiz-difficulty-beginner = 🟢 Principiante
quiz-difficulty-basic = 🟢 Básico
quiz-difficulty-intermediate = 🟡 Intermedio
quiz-difficulty-advanced = 🔴 Avanzado
quiz-difficulty-expert = 🔴 Experto
quiz-difficulty-fallback = ⚠️ No hay suficientes términos en ese nivel — mostrando aleatorio.
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.
quiz-correct-with-streak =
    ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.

    🔥 Racha: <b>{ $current }</b> días
quiz-correct-new-record =
    ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.

    🎉 <b>¡Nuevo récord!</b> { $max } días!

    🔥 Racha: <b>{ $max }</b> días
quiz-wrong-retry =
    ❌ <b>¡Casi!</b>

    ¿Qué quieres hacer?
quiz-btn-retry = 🔄 Intentar de nuevo
quiz-btn-result = 📖 Ver respuesta
quiz-try-again = 🔄 ¡Intentémoslo de nuevo!
quiz-result = 📖 La respuesta correcta es <b>{ $term }</b>.
quiz-no-session = ❌ No hay quiz activo. Usa <code>/quiz</code> para empezar.
quiz-no-user = ❌ Se requiere usuario para quiz.

btn-fav-add = ⭐ Guardar
btn-fav-remove = ★ Quitar
favorite-added = ⭐ ¡Guardado!
favorite-removed = Quitado.
favorites-header = ⭐ <b>Tus favoritos</b> — { $count } términos
favorites-empty = Aún no tienes términos guardados. Toca ⭐ en cualquier término.
favorites-limit = ⚠️ Límite de 50 favoritos alcanzado.

history-header = 🕐 <b>Vistos recientemente</b>
history-empty = Aún no has consultado ningún término.

streak-day = 🔥 { $count } día seguido
streak-days = 🔥 { $count } días seguidos
streak-first = 🔥 ¡Primer día!
streak-message =
    { $fire } <b>Tu racha</b>

    🔥 Actual: <b>{ $current }</b> días
    🏆 Récord: <b>{ $max }</b> días
    ❄️ Congelamientos: <b>{ $freezes }</b>/1 restante

    📅 Últimos 7 días:
    { $calendar }
group-streak-section-title = 👥 <b>Racha del grupo</b>
group-streak-current = 🔥 Actual: <b>{ $current }</b> días
group-streak-record = 🏆 Récord del grupo: <b>{ $max }</b> días
group-streak-calendar-label = 📅 Últimos 7 días:
streak-no-user = ❌ Se requiere usuario para ver la racha.
group-streak-started = 🔥 ¡La racha del grupo empezó! Hagan <code>/quiz</code> todos los días para mantenerla.
group-streak-maintained = ✅ ¡Racha del grupo mantenida! { $count } miembros participaron hoy.
group-streak-milestone = { $emoji} <b>{ $days } días de racha grupal!</b> { $celebration }
group-streak-milestone-3 = El grupo está calentando.
group-streak-milestone-7 = Una semana completa. Van con constancia.
group-streak-milestone-14 = Este grupo es imparable.
group-streak-milestone-30 = Legendarios.
group-streak-broken = 💔 La racha del grupo se perdió. Hagan <code>/quiz</code> hoy para reiniciarla.
group-streak-no-participation = 👥 Haz <code>/quiz</code> en este grupo para ver la racha compartida.
group-streak-today-progress = 👤 Hoy: { $count }/{ $threshold } miembros participaron

notification-streak-warning = 🔥 ¡Alerta de racha! Tienes 2 horas para hacer el <code>/quiz</code> y mantener tu racha.

quiz-new-record = 🎉 <b>¡Nuevo récord!</b> { $max } días!
quiz-streak-continued = 🔥 Racha: <b>{ $current }</b> días

leaderboard-title = 🏆 <b>Ranking Global — Top 10</b>
leaderboard-empty = 🏆 Aún no hay participantes. ¡Sé el primero en hacer quizzes!
group-leaderboard-title = 🏆 <b>Top de este grupo</b>
group-leaderboard-empty = 🏆 Ningún miembro del grupo ha hecho quiz todavía. ¡Sé el primero!
group-rank-position = 📊 <b>Tu posición:</b> #{ $rank } de { $total } miembros
group-rank-cta = Haz <code>/quiz</code> para subir en el ranking.
rank-no-user = ❌ Se requiere usuario para ver posición.
rank-no-streak = Aún no tienes una racha. Haz un <code>/quiz</code> para empezar.
rank-position = 📊 <b>Tu posición:</b> #{ $rank } de { $total } participantes
rank-max-streak = 🔥 Tu récord: { $max } días
rank-you = → <b>Tú</b>
leaderboard-entry = { $medal } { $name } — { $streak } días
rank-entry-simple = { $rank } — { $streak } días
rank-nearby = 📈 Competidores cercanos:

did-you-mean =
    ❌ No encontré resultados para ese término.

    ¿Quisiste decir: <code>{ $term }</code>?
btn-did-you-mean = Sí, mostrar →

term-read-more-label = Ver documentación de Solana

onboarding-tips =
    💡 <b>Empieza aquí</b>

    Usa el menú para elegir tu siguiente paso:
    entender un término, practicar con quiz o seguir una ruta.

btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = ¡Gracias por tu feedback!

term-not-found = ❌ No encontré resultados para <b>{ $query }</b>. Usa <code>/categorias</code> para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Elige uno:
usage-glossary =
    💡 Uso: <code>/glosario &lt;término&gt;</code>
    Ejemplo: <code>/glosario proof-of-history</code>
usage-compare =
    🔀 Uso: <code>/comparar &lt;termino1&gt; &lt;termino2&gt;</code>
    Ejemplo: <code>/comparar poh pos</code>
usage-quiz =
    🧠 Uso: <code>/quiz</code> · <code>/quiz easy</code> · <code>/quiz medium</code> · <code>/quiz hard</code>
prompt-glossary-query =
    🔍 <b>¿Qué quieres buscar?</b>

    Envía el término ahora.
    Ejemplo: <code>proof-of-history</code>

compare-header = 🔀 <b>{ $term1 }</b> vs <b>{ $term2 }</b>
compare-shared-related = 🔗 Relacionado con ambos: { $terms }
compare-not-found-one = ❌ Término no encontrado: <b>{ $query }</b>. ¿Quisiste decir <code>{ $suggestion }</code>?
compare-not-found-one-no-suggestion = ❌ Término no encontrado: <b>{ $query }</b>. Usa <code>/glosario</code> para buscar.
compare-not-found-both = ❌ Ninguno de los dos términos fue reconocido. Usa <code>/categorias</code> para explorar.
compare-same-term = 💡 Comparaste un término consigo mismo. Prueba <code>/glosario { $term }</code> para ver la tarjeta completa.
compare-side-left = primer
compare-side-right = segundo
compare-ambiguous-header = ⚠️ <b>El { $side } término quedó ambiguo:</b> <code>{ $query }</code>
compare-ambiguous-footer = Refina el comando con un ID más específico.

categories-choose =
    📚 <b>Solana Glossary — 14 Categorías</b>
    Elige una categoría:
categories-header =
    📚 <b>Solana Glossary — 14 Categorías</b>
    Usa <code>/categoria &lt;nombre&gt;</code> para listar los términos.
category-not-found = ❌ Categoría <b>{ $name }</b> no encontrada. Usa <code>/categorias</code> para ver las disponibles.
usage-category =
    💡 Uso: <code>/categoria &lt;nombre&gt;</code>
    Ejemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } términos

daily-term-header = Término del día

menu-explain = 💬 Explicar
menu-glossary = 🔍 Glosario
menu-categories = 📂 Categorías
menu-random = 🎲 Aleatorio
menu-quiz = 🧠 Quiz
menu-path = 💻 Rutas
menu-progress = 🔥 Progreso
menu-library = 🗂️ Biblioteca
menu-favorites = ⭐ Favoritos
menu-history = 🕐 Historial
menu-daily = 📆 Término del Día
menu-help = 📘 Ayuda

progress-menu-title =
    🔥 <b>Progreso</b>

    Sigue tu constancia y mira cómo vas en el ranking.
library-menu-title =
    🗂️ <b>Biblioteca</b>

    Explora el glosario, revisa términos guardados y descubre algo nuevo.

path-menu-header =
    💻 <b>Rutas de aprendizaje</b>

    Cada ruta es un mini-curso enfocado.
    Tu progreso se guarda — retoma donde te quedaste.
path-step-header = { $emoji } <b>{ $name }</b> · Paso { $step } de { $total }
path-step-badge = { $current }/{ $total }
path-completed =
    ✅ <b>Ruta completada: { $name }</b>

    Ya cubriste los conceptos principales de esta ruta.

    Próximo paso recomendado:
    🧠 Haz el quiz de la ruta para mantener tu racha

    o
    ➡️ Empieza { $next_path }
path-completed-final =
    ✅ <b>Ruta completada: { $name }</b>

    Ya cubriste los conceptos principales de esta ruta.

    Próximo paso recomendado:
    🧠 Haz el quiz de la ruta para mantener tu racha
path-quiz = 🧠 Quiz de la ruta
path-restart = 🔄 Reiniciar
path-name-solana-basics = Fundamentos de Solana
path-desc-solana-basics = Fundamentos del protocolo: PoH, slots, epochs y validators
path-name-defi-foundations = Fundamentos de DeFi
path-desc-defi-foundations = Cómo funciona DeFi en Solana: AMMs, pools y swaps
path-name-builders-path = Ruta Builder
path-desc-builders-path = Lo que todo dev Solana debe saber: programs, PDAs y CPIs

explain-no-reply =
    💬 <b>Cómo usar /explicar:</b>

    1. Mantén pulsado el mensaje que quieres entender
    2. Toca <b>Responder</b>
    3. Envía <code>/explicar</code>

    El bot explicará los términos Solana presentes en ese mensaje.
    También puedes enviar <code>/explicar &lt;término&gt;</code> directamente.
explain-missing-reply-context =
    ⚠️ <b>Recibí el comando, pero no recibí el contexto del mensaje respondido.</b>

    En este grupo, Telegram no le entregó al bot el contenido del mensaje al que <code>/explicar</code> respondió.

    Prueba usar <code>/explicar &lt;término&gt;</code> directamente.
    Si esto sigue pasando, revisa la configuración del bot y los permisos del grupo.
explain-not-found = ❌ No encontré términos Solana reconocibles en ese mensaje.
explain-summary = 💬 Encontré { $count } término(s) en este mensaje: { $terms }
group-welcome =
    👋 <b>Solana Glossary Bot ya está aquí.</b>

    Usa el bot en este grupo para explicar términos en contexto, comparar conceptos y practicar rápido.

    Empieza con <code>/explicar</code> sobre un mensaje respondido.
    Luego usa <code>/quiz</code> y <code>/leaderboard</code> desde el menú.

language-changed = ✅ Idioma cambiado a español.
language-invalid = ❌ Idioma inválido. Usa: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo salió mal. Inténtalo de nuevo.
rate-limit = ⏳ Ve más despacio. Espera un momento antes de enviar más mensajes.

quiz-correct-group-with-streak =
    ✅ { $name } acertó. Era <b>{ $term }</b>.
    🔥 Racha personal: <b>{ $personal }</b> días · 👥 Racha del grupo: <b>{ $group }</b> días{ $status }
quiz-correct-group-new-record-with-streak =
    ✅ { $name } acertó. Era <b>{ $term }</b>.
    🎉 <b>¡Nuevo récord personal!</b> { $max } días.
    🔥 Racha personal: <b>{ $personal }</b> días · 👥 Racha del grupo: <b>{ $group }</b> días{ $status }

tips-menu-title =
    💡 <b>Cómo usar el bot</b>

    Elige un tema o abre uno de los menús agrupados.
tips-menu-back = ← Volver a tips
tips-btn-explain = 💬 Explicar
tips-btn-compare = 🔀 Comparar
tips-btn-path = 💻 Rutas
tips-btn-quiz = 🧠 Quiz
tips-btn-glossary = 🔍 Glosario
tips-btn-categories = 📂 Categorías
tips-btn-streak = 🔥 Racha
tips-btn-leaderboard = 🏆 Ranking
tips-btn-help = 📘 Ayuda
tips-explain =
    💬 <b>Cómo usar /explicar</b>

    1. Responde a un mensaje en un grupo
    2. Envía <code>/explicar</code>
    3. El bot detecta términos Solana y los explica al instante

    Ejemplo: responde a un mensaje sobre "turbine" y envía <code>/explicar</code>.
tips-compare =
    🔀 <b>Cómo usar /comparar</b>

    Compara dos conceptos lado a lado:
    <code>/comparar poh pos</code>
    <code>/comparar account pda</code>
tips-path =
    💻 <b>Cómo usar /path</b>

    Envía <code>/path</code> para abrir rutas guiadas.
    Elige una ruta, avanza término por término y termina con el quiz de la ruta.
tips-quiz =
    🧠 <b>Cómo usar /quiz</b>

    Niveles disponibles:
    <code>/quiz</code>
    <code>/quiz easy</code>
    <code>/quiz medium</code>
    <code>/quiz hard</code>
    <code>/quiz 1</code> hasta <code>/quiz 5</code>
tips-glossary =
    🔍 <b>Cómo usar /glosario</b>

    Busca un término directo:
    <code>/glosario proof-of-history</code>

    También funciona inline:
    <code>@{ $bot_username } poh</code>
tips-categories =
    📂 <b>Cómo usar categorías</b>

    Envía <code>/categorias</code> para navegar por el menú
    o <code>/categoria defi</code> para abrir una categoría específica.
tips-streak =
    🔥 <b>Cómo usar /streak</b>

    En DM, muestra tu racha personal.
    En grupos, muestra tu racha y la racha compartida del grupo.
tips-leaderboard =
    🏆 <b>Cómo usar /leaderboard</b>

    En DM, muestra el ranking global.
    En grupos, muestra el ranking local de ese grupo.
tips-help =
    📘 <b>Cómo usar /help</b>

    Envía <code>/help</code> para ver el bot organizado por intención: entender, aprender, progreso y biblioteca.
quiz-wrong = ❌ <b>Incorrecto.</b> La respuesta era <b>{ $term }</b>.

quiz-menu-title = 🧠 <b>Configurar Quiz</b>
quiz-menu-mode = Modo
quiz-menu-mode-single = 1 pregunta
quiz-menu-mode-round = Ronda
quiz-menu-difficulty = Dificultad
quiz-menu-difficulty-all = Cualquiera
quiz-menu-difficulty-easy = Fácil
quiz-menu-difficulty-medium = Medio
quiz-menu-difficulty-hard = Difícil
quiz-menu-difficulty-level = Nivel { $level }
quiz-menu-count = Preguntas
quiz-menu-failure = Al fallar
quiz-menu-failure-continue = Continuar
quiz-menu-failure-sudden-death = Eliminación
quiz-menu-start = ▶️ Empezar
quiz-menu-group-note = En grupos el quiz usa el modo rápido: una pregunta por vez para evitar spam.
quiz-round-progress = 🎯 <b>Pregunta { $current }/{ $total }</b> · ✅ { $correct } · ❌ { $wrong } · { $mode }
quiz-round-count-adjusted = ⚠️ Ajusté la ronda de <b>{ $requested }</b> a <b>{ $available }</b> preguntas según el pool disponible.
quiz-round-feedback-correct = ✅ ¡Correcto! Era <b>{ $term }</b>.
quiz-round-feedback-correct-streak = ✅ ¡Correcto! Era <b>{ $term }</b>. 🔥 Racha: <b>{ $current }</b>
quiz-round-feedback-wrong = ❌ Incorrecto. La respuesta correcta era <b>{ $term }</b>.
quiz-round-summary =
    🏁 <b>Ronda finalizada</b>

    Preguntas respondidas: <b>{ $answered }/{ $total }</b>
    Correctas: <b>{ $correct }</b>
    Incorrectas: <b>{ $wrong }</b>
    Precisión: <b>{ $accuracy }%</b>
    Dificultad: <b>{ $difficulty }</b>
quiz-btn-play-again = 🔁 Jugar otra vez
quiz-btn-menu = ⚙️ Menú del Quiz

language-changed-confirmation =
    ✅ Idioma cambiado a español.

    ℹ️ <i>El menú de comandos (/) sigue el idioma de tu app de Telegram. Usa /help para ver todos los comandos en español.</i>

start-language-picker =
    🌐 <b>Elige tu idioma</b>
    Elige abajo el idioma de la interfaz del bot.
start-language-option-pt = 🇧🇷 Português
start-language-option-en = 🇺🇸 English
start-language-option-es = 🇪🇸 Español

group-language-picker =
    🌐 <b>Elige el idioma de este grupo</b>

    Selecciona el idioma del grupo.
    Después de eso, enviaré el menú y el onboarding del grupo en el idioma elegido.
group-language-changed = ✅ Idioma del grupo actualizado.
group-onboarding-tips =
    💡 <b>Empieza rápido en grupos</b>

    Usa <code>/explicar</code> en una respuesta para decodificar términos en la conversación.
    Usa <code>/quiz</code> para práctica rápida.
    Usa <code>/leaderboard</code> y <code>/streak</code> para seguir el ritmo del grupo.
