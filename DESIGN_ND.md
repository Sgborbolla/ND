# ND — Nippon Destruction · diseño y estado

Documento único para retomar el proyecto en cualquier sesión.
Auditoría detallada de las referencias Stitch en `AUDIT_STITCH_ND.md`.

## 1. Idea

Juego 2D de acción con 2 botones (golpe + dash), estilo **siluetas negras**, ambiente
atardecer con contraluz. Nombre: Nippon Destruction → **ND**.

Objetivo: algo pegadizo, funcional y agradable en móvil (horizontal) + web.

## 2. Arquitectura

Vanilla, sin build, sin dependencias:

```
index.html      markup + CSS del HUD táctil
nd.js           IIFE con todo el juego (canvas 2D + WebAudio)
nd.webmanifest  PWA (fullscreen, landscape)
server.js       servidor estático para Node (puerto 8123)
start.bat       abre index.html en PC
test/nd-test.js 27 pruebas con dobles de canvas/audio/DOM/reloj
icons/          icono real 192/512, maskable, apple-touch, favicons
refs/           referencias Stitch descargadas + manifiesto de URLs
DESIGN_ND.md    este archivo
AUDIT_STITCH_ND.md  auditoría de los HTML de Stitch
PROMPT_ND_*.md  prompts de diseño (V2 es el maestro)
```

Interno: `960×540`, suelo en `y=468`. Runs: `python3 -m http.server 8000` o `node server.js`.

## 3. Canónico de diseño (fijado en la auditoría)

Decisiones tomadas para eliminar las contradicciones entre los 26 HTML de Stitch:

| Tema | Canónico | Descartado |
|---|---|---|
| Kanji Rika | **里花** (12 vs 3) | 里香 |
| Kanji Goro | **五郎** | 吾郎 |
| Kanji Ren / Yui | 林 蓮 / 中村 結衣 | — |
| Amarillo | **#FFC400** | #FEC300, #FFB871 |
| Magenta | **#FF2D6F** | #FF4E7C, #FFB2BD |
| Hitstop | **14 frames** | 8 / 12 / 16 / 18 |
| Año del setting | **2088** | 2025, 2048 |
| Ruptura | **automática al encadenar** (ND) | botón `Q` aparte de Stitch |
| Assets | 16 disponibles | 17 declarados, 5 URLs muertas |

Paleta: `#150E2B → #4A2247 → #A84A38 → #F0A65A` (cielo de 4 tonos), `#FF2D6F` peligro,
`#FFC400` aviso, `#F2DCC0` acento, `#05030A` tinta de siluetas.

## 4. Estado: HECHO

- [x] Bucle canvas 960×540 con parallax 3 capas (`.10 / .24 / .46`) + suelo y niebla
- [x] Atardecer 4 tonos + sol con glow + lluvia ácida
- [x] **4 héroes** (RIKA, GORO, REN, YUI) con voz sintetizada distinta y cita JA/ES
- [x] **6 arquetipos** enemies, uno por nivel: El Doble, Lanzador, El Agresor,
      Blindado, Resucitado, El Mimético — cada uno con comportamiento propio
- [x] Guardia del Blindado: 3 golpes la rompen, o un dash atravesándola
- [x] Dash con i-frames, hitstop, slow-motion, combo con ruptura, knockback
- [x] Enemigos con grito + telegrafia visual/audio antes de atacar (sin spam de audio)
- [x] Zonas de peligro dibujadas en coordenadas de mundo
- [x] Música cyberpunk/funk generativa **BPM 104** (bajo, percusión, lead)
- [x] SFX sintetizados + voces japonesas (ataque, ruptura, daño, muerte)
- [x] Controles teclado (`A`/`D`, `Espacio`/`J`, `Shift`/`K`) y táctiles (◀ ▶ GOLPE DASH)
- [x] PWA: manifest, fullscreen, orientation landscape
- [x] **Icono real** derivado del key-art (192/512, maskable, apple-touch, favicons)
      y conectado a `index.html` + `nd.webmanifest`
- [x] `test/nd-test.js` → **27 ok / 0 fail**

## 5. Estado: FALTA

### 5.1 Splash / presentación
`SPLASH_01 → 06` animada: cámara lateral por la calle destruida, relámpago que
revela al héroe en contraluz, título `NIPPON DESTRUCTION` + `日本崩壊` con glow
`#F2DCC0`, fundido a la selección. Referencia: `splash_01..06` + `01._pr_logo_cinematográfico`.

### 5.2 Selección de héroes (actualmente básica)
Slots de 88×104 sin más. Falta la ficha del sistema táctico:
- placa kanji + nombre + apodo + rol (`DPS` / `TANK` / `SPEED` / `CHRONO`)
- descripción ES y cita de campo JA/ES
- 4 métricas: fuerza de impacto, velocidad, hitstop (14F), radio de dash
- 3 niveles de habilidad, matriz cromática por héroe
- navegación teclado `1..4` + táctil, confirmación `DESPLEGAR UNIDAD`

### 5.3 HUD táctico (ahora solo 2 líneas de texto)
**Se adopta el de Stitch tal cual**: está diseñado para móvil en 16:9 forzado
(zonas táctiles por cuadrante, safe areas, botones ≥48px WCAG). Hoy ND solo
pinta `VIDA 05/05` y `OLEADA 3 · LANZADOR · 7 BAJAS`. Falta el sistema completo:

| Zona | Elemento | Valores de referencia |
|---|---|---|
| Sup. izq. `QUAD_01` | barra de vida + medidor trifásico de dash | `1,840/2,000 HP (85%)`, `2/3 CARGAS`, recarga 40% |
| Sup. der. `QUAD_02` | combo + tacómetro de amenaza | `38 HITS // SSS`, `MULTIPLICADOR x4.8`, `THREAT LEVEL S-RANK`, `WAVE 04/06` |
| Inf. izq. `QUAD_03` | joystick flotante | radio 64px, deadzone 12% |
| Inf. der. `QUAD_04` | botonera | Tajo 72px a 30°, Ruptura `#FF2D6F`, Dash 56px |
| Global | telégrafo | `⚠ ¡TELÉGRAFO DETECTADO! ⚠`, `DASH CD`, `RUPTURA: MAX` |

### 5.4 Subjefes (ninguno)
`EL CIERRE` · `LA CADENA` · `EL DESGARRO` · `EL MURO` · `EL ECO ROTO` · `LA CUCHILLA COLGADA`
Silueta propia cada uno, barra de vida propia y patrón de ataque. Entran en oleadas altas.

### 5.5 Jefes colosales (ninguno)
`PUERTA DE ACERO` · `COLAPSO` · `HORNO` · `CEMENTERIO` · `RESONANCIA` · `NÚCLEO ND`
Con fases por porcentaje de vida y barra de jefe dedicada.

### 5.6 Otros
- [ ] puntuación máxima local
- [ ] pausa
- [ ] catálogo modal de los 16 assets (como en el HTML de Stitch)
- [ ] `Q` / ruptura manual (decidir: se mantiene automática)
- [ ] imbalancear y afinar dificultad

## 6. Plan

| Fase | Bloque | Estado |
|---|---|---|
| F0 | tests + icono + documentación | **hecho** |
| F1 | HUD táctico de 4 cuadrantes en canvas | siguiente |
| F2 | Selección de héroes con ficha táctica completa | pendiente |
| F3 | Splash animado de 6 frames | pendiente |
| F4 | 6 subjefes | pendiente |
| F5 | 6 jefes colosales con fases | pendiente |
| F6 | puntuación, pausa, catálogo, balance | pendiente |

Cada fase debe dejar `node test/nd-test.js` en verde y que el commit siga la
convención: `ND: <qué se añadió>`.

## 7. Referencias Stitch

Carpeta: `/storage/emulated/0/stitch_nippon_destruction_canvas_game` (40 carpetas,
26 con `code.html`). El **prototipo jugable completo** es
`nippon_destruction_nd_juego_cinematogr_fico_2d_completo/code.html`
(1531 líneas, canvas 1280×720, `STATE.mode = SPLASH → SELECT → PLAYING`).

Imágenes descargadas en `refs/hi/*.jpg` (1376×768, 11 archivos) a partir de las
URLs del HTML "Archivo Táctico" (manifiesto en `refs/archivo-tactico.tsv`).
**No hay imágenes square: el ícono se recorta del key-art.**

## 8. Trampas conocidas

- **No puedo ver imágenes** (el modelo no tiene visión): los `.png` de Stitch solo
  sirven por nombre y por el texto que los acompaña en el `code.html`.
- Las 11 imágenes de `refs/hi` y las 16:9 de la carpeta Stitch **son renders
  distintos del mismo prompt** (0 coincidencias por md5). No son duplicados ni
  copias unas de otras.
- 5 URLs del HTML "Archivo Táctico" están **muertas (HTTP 400)**: `ui-hud`,
  `splash-01`, `splash-02`, `splash-03`, `splash-05`.
- Ese HTML dice "TODOS (17)" pero su array tiene **16** entradas.
- Falta la carpeta `06` en Stitch (la `04` numera solo 01–05).
- `refs/hi/` y `refs/stitch/` están en `.gitignore` (se redescargan).

## 9. Controles actuales

| Acción | Teclado | Táctil |
|---|---|---|
| Mover | `A`/`D` o flechas | `◀` `▶` |
| Golpe | `Espacio` o `J` | `GOLPE` |
| Dash | `Shift` o `K` | `DASH` |
