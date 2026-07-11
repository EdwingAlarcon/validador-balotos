# Portafolio Estratégico — Diseño

Fecha: 2026-07-11
Estado: Aprobado por usuario, pendiente de plan de implementación

## Contexto y objetivo

El usuario pidió adaptar la app para que genere, para Baloto/Revancha/Miloto/Colorloto, un
portafolio de combinaciones "matemáticamente diversificado" siguiendo una metodología extensa
(verificación de reglas, análisis descriptivo, pruebas de aleatoriedad, popularidad estimada,
optimización de portafolio, escenarios de presupuesto, reporte en 20 secciones), sin afirmar
capacidad predictiva.

El prompt original está escrito para que un LLM redacte un reporte narrativo en el momento.
Se decidió (con el usuario) que la app calculará todo en código JS de forma determinística
contra `data/historical.db`, sin llamadas a IA en runtime. Es una funcionalidad nueva e
independiente del generador rápido existente (`intelligentGenerator.js`), no lo reemplaza.

## Reglas y precios verificados

Fuente: baloto.com/como-jugar, baloto.com, dataifx.com — consultado 2026-07-11.

| Juego | Números | Superbalota | Precio | Días de sorteo |
|---|---|---|---|---|
| Baloto | 5 de 1–43 | 1 de 1–16 | $6.000 COP | Lun/Mié/Sáb 11:00–11:15pm |
| Baloto Revancha | **mismos** 5 números y superbalota del tiquete de Baloto (no se eligen por separado) | — (comparte la de Baloto) | +$3.000 COP add-on (total $9.000 con Baloto) | mismo sorteo; tabla de resultados independiente |
| Miloto | 5 de 1–39 | no aplica | $4.000 COP | Lun/Mar/Jue/Vie 10:00–10:15pm |
| Colorloto | 6 pares color-número, colores {amarillo, azul, rojo, verde, blanco, negro}, número 1–7 por color | no aplica | $5.000 COP | Lun 11:40pm, Jue 11:00pm |

Nota crítica sobre Revancha: como el jugador usa el mismo tiquete y los mismos números para
ambos sorteos, el reporte **no genera 20 combinaciones independientes para Revancha**. En su
lugar, muestra las mismas 20 combinaciones de Baloto marcadas como "válidas también para
Revancha (add-on +$3.000)", y calcula sus métricas de popularidad/estratégicas usando el
historial de sorteos de Revancha (que sí es una tabla de resultados estadísticamente
independiente en la BD: `game = 'Baloto Revancha'`).

Estos datos se guardan como config estática (`lotteryRules.js`) con campo `verifiedAt` y
`sources[]`. No se vuelven a scrapear en cada request — si cambian, se actualiza el archivo
manualmente (igual patrón que el resto del repo, que no tiene scraping de precios).

## Alcance explícito — qué se implementa y qué no

Implementado:
- Estadística descriptiva completa (frecuencias, calientes/fríos, sorteos desde última
  aparición, paridad, bajo/medio/alto, suma con media/mediana/dispersión, consecutivos,
  terminaciones, primos, múltiplos, pares/tríos repetidos).
- Prueba chi-cuadrado de uniformidad y prueba de rachas (paridad) sobre el historial disponible.
- Popularidad estimada (heurística 0–100, documentada como estimación, no dato de ventas real).
- Optimización de portafolio por búsqueda heurística greedy (maximiza cobertura marginal /
  distancia de Hamming y Jaccard, minimiza redundancia) — **no** algoritmos genéticos reales
  ni Monte Carlo pesado; se declara así explícitamente en el reporte.
- Puntaje estratégico 0–100 por combinación.
- 4 estrategias (A equilibrada, B antipopular, C máxima cobertura, D híbrida) — 5 combinaciones
  cada una = 20 por juego (excepto Revancha, que reutiliza las de Baloto).
- 3 escenarios de presupuesto (básico/moderado/amplio) con precios reales verificados.
- Portafolio de control aleatorio y comparación de métricas.
- Top 5 "estratégicamente optimizadas" por juego.
- Reporte ensamblado en las 20 secciones pedidas, en JSON estructurado + render en frontend.
- Advertencias de juego responsable con lenguaje fijo (no generado).

No implementado (declarado como limitación en el reporte, no se inventa):
- Autocorrelación temporal y corrección por comparaciones múltiples.
- Simulación Monte Carlo / bootstrap real, algoritmos genéticos, redes neuronales.
- Verificación en vivo de reglas/precios en cada request (son estáticos, con fecha de
  verificación visible).

## Componentes (backend)

Todos en `src/services/`, siguiendo el patrón existente de módulos con funciones exportadas
(no clases), consistente con `intelligentGenerator.js` y `database.js`.

- **`lotteryRules.js`** — exporta la tabla de reglas/precios de arriba como objeto estático,
  con `verifiedAt: '2026-07-11'` y `sources: [...]`.
- **`statisticsEngine.js`** — funciones de estadística descriptiva por juego, reutilizando
  `db.getAllResults` y las funciones de frecuencia ya existentes en `intelligentGenerator.js`
  (se importan, no se duplican). Incluye `chiSquareUniformity(freqMap)` y `runsTest(sequence)`.
- **`popularityScorer.js`** — `scorePopularity(numbers, extra)` → 0–100, con las reglas de
  penalización listadas en el prompt original (rango 1–31, escaleras, todo par/impar, sumas
  bajas, fechas, simetría, etc.).
- **`portfolioOptimizer.js`** — `buildPortfolio(game, strategy, count)`, `computeCoverage(combos)`,
  `hammingDistance`, `jaccardIndex`, `strategicScore(combo, portfolio)`, `budgetScenarios(game)`,
  `randomControlPortfolio(game, count)`.
- **`reportBuilder.js`** — `buildFullReport()` → ensambla las 20 secciones para los 4 juegos
  usando los módulos de arriba; es la única función que consume el endpoint.

## API

`GET /api/portfolio` → devuelve el reporte completo (los 4 juegos) como JSON, siguiendo el
orden de las 20 secciones del prompt. Sin parámetros de query en la v1 (no hay necesidad de
paginar; el payload es de tamaño acotado — 80 combinaciones con metadata).

Rate limiting: mismo esquema de 30 req/10min ya usado en endpoints de scraping, porque construir
el reporte recorre el historial completo (costo similar a `/api/statistics`).

## Frontend

Nueva pestaña "Portafolio Estratégico" en `public/index.html`, junto a las pestañas existentes.
`app.js` agrega una función `loadPortfolioReport()` que hace fetch a `/api/portfolio` y renderiza
las 20 secciones como bloques colapsables (reutilizando clases CSS existentes de `styles.css`
donde aplique, agregando las mínimas nuevas para tablas de combinaciones). El generador rápido
actual (botón "Generar") no se modifica.

## Testing

- Tests unitarios para `statisticsEngine.js` (chi-cuadrado y rachas con datos sintéticos de
  distribución conocida), `popularityScorer.js` (casos límite: 1-2-3-4-5 debe dar score alto;
  combinación dispersa debe dar score bajo) y `portfolioOptimizer.js` (verificar que
  `buildPortfolio` no repite combinaciones y que la cobertura marginal es no-decreciente).
- Test de integración en `tests/test-endpoints.js` (patrón ya usado en el repo) para
  `GET /api/portfolio`: valida estructura de las 20 secciones y que cada juego tenga 20
  combinaciones (o 20 reutilizadas para Revancha).

## Riesgos / decisiones abiertas para el plan de implementación

- El plan debe definir el algoritmo greedy exacto de `buildPortfolio` (orden de construcción,
  criterio de desempate) para que sea determinístico y testeable.
- Definir estructura exacta del JSON de respuesta antes de tocar el frontend, para no
  renderizar sobre un contrato inestable.
