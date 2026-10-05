# PROMPT CANÓNICO — NIPPON DESTRUCTION (ND)

> **Este archivo sustituye a los 11 `PROMPT_ND_*.md` anteriores** (MASTER, MAX, FULL,
> FULL_V2, FINAL, UNIFIED, ULTRA_DETAILED, STITCH, STITCH_GRAPHIC, SSTIC), ya borrados.
> Historial en `git log`. Todo lo único que tenían (proporciones, animaciones, físico de
> subjefes/jefes, mapas, capas de audio) está consolidado aquí.
>
> Es el **maestro**: las decisiones de §0 ya resuelven las contradicciones entre los 26
> HTML de Stitch (`AUDIT_STITCH_ND.md`) y **no se vuelven a discutir**. El estado real de
> la implementación está en `DESIGN_ND.md`; los defectos código-vs-diseño en
> `AUDIT_CODIGO_ND.md`.

## 0. REGLAS INMUTABLES

- Siluetas **negras sólidas `#05030A`** (la estela admite `#000`). Sin color en el cuerpo.
- Únicos colores de juego: `#FF2D6F` peligro · `#FFC400` aviso · `#F2DCC0` acento ·
  `#8FE8FF` i-frames de dash. Nada de color decorativo.
- Rim light dorado `#FF9A4D` en el borde de la silueta contra el sol (único warm en cuerpo).
- Cielo de atardecer tormentoso, **5 tonos**: `#150E2B → #4A2247 → #A84A38 → #E8813F → #F0A65A`.
- 2D lateral, render suave cinematográfico, **NO pixel art**, legible a 24px.
- Horizontal landscape forzado + PWA (fullscreen, `orientation=landscape`, standalone).
- NO copiar código ni texto de NPAD. Solo referencias visuales Stitch.
- **DOBLE SE MANTIENE** como nivel 1. Los prompts antiguos que lo eliminaban están
  derogados. `AGRESOR` = nivel 3.
- Ruptura **automática** al encadenar golpes. No hay botón `Q`.
- Hitstop canónico **14 frames** (≈230 ms). Slow-motion 0.30–0.40 s.
- Año del setting: **2088**. Kanji canónicos: RIKA 里花 · GORO 五郎 · REN 林 蓮 · YUI 中村 結衣.

## 1. PROYECTO

- Action roguelite 2D lateral, 2 botones (golpe + dash).
- HTML5 + Canvas 2D + Vanilla JS + Web Audio API. Sin build, sin dependencias.
- Android (horizontal) + Web (PWA). Canvas interno 960×540, suelo en `y=468`.
- Fuente tipográfica: `Space Grotesk` + `Chivo` + `JetBrains Mono`.

## 2. LOS 4 HÉROES

| Slot | Kanji | Nombre | Apodo | Rol | Marca | Física |
|---|---|---|---|---|---|---|
| 01 | 月見 里花 | RIKA TSUKIMI | LA HOJA | DPS | vela (haori) | delgada 6 cabezas, hombros 13px, cintura 8px, katana diagonal cadera 30px, coleta alta |
| 02 | 嵐 五郎 | GORO ARASHI | EL YUNQUE | TANK | puerta (escudo) | ancho macizo 5 cabezas, hombros 22px, cabeza hundida, escudo espalda 14×20, mazo 26px |
| 03 | 林 蓮 | REN HAYASHI | EL RELÁMPAGO | SPEED | cohete | delgado nervioso, cabeza grande, vendajes, zigzag + estela eléctrica `#FFC400` |
| 04 | 中村 結衣 | YUI NAKAMURA | EL ECO | CHRONO | torre (trazador) | esbelta, moño alto, doble contorno tenue en sombra |

2 mujeres / 2 hombres. Matriz cromática: Rika `#F2DCC0`+`#FF2D6F` · Goro `#FFC400`+`#A84A38` ·
Ren `#FFC400`+`#4A2247` · Yui `#FFB2BD`+`#150E2B`. Cita de campo JA+ES por héroe.

Animaciones (frames): Rika Idle 8 / Correr 8 / Tajo 6 / Dash-ataque 6 / Ruptura 12 / Herida 4.
Goro Idle 6 / Caminar 8 / Golpe 8 / Dash-carga 6 / Ruptura 14 / Herida 4.

Ficha por héroe seleccionado: `CALIBRACIÓN CANÓNICA: 24PX`, rol, armamento, cita de campo,
`VOX-FREQ: 142.80 MHz` y 4 métricas — fuerza de impacto, velocidad de desplazamiento,
hitstop (parry window) y radio de evasión táctica. Tres niveles de habilidad por héroe
(`TIER 01 PASSIVE`, `TIER 02 TACTICAL`, `TIER 03 APOCALYPSE`) con kanji propio
(`影閃`, `千刃斬`, `残照天裂`).

## 3. HUD TÁCTICO — 4 cuadrantes, 16:9 forzado

| Zona | Elemento | Valores literales |
|---|---|---|
| `QUAD_01` sup. izq. | barra de vida + medidor trifásico de dash | `1,840/2,000 HP (85%)`, `2/3 CARGAS (RECARGA 40%)`, medidor `#FFC400` |
| `QUAD_02` sup. der. | combo + tacómetro de amenaza | `38 HITS // SSS`, `MULTIPLICADOR: x4.8 DINÁMICO`, `THREAT LEVEL S-RANK`, `WAVE 04/06 [142 KILLS]`, pulso carmesí al superar 30 hits |
| `QUAD_03` inf. izq. | joystick flotante | radio 64px, deadzone 12% radial, haptic 8ms, recentrado bajo el dedo |
| `QUAD_04` inf. der. | botonera | Tajo 72px a 30°, Ruptura `#FF2D6F`, Dash 56px, item DEFCON, separación > 12px |

Global: `日本崩壊 // NIPPON DESTRUCTION` · `MIL-SPEC ARCHIVE v2.4` ·
`ESTADO: CRÍTICO // EXTINCIÓN ND` · `ND-DEFCON: LEVEL 1` ·
`⚠️ ¡TELÉGRAFO DE JUGADOR DETECTADO! ⚠️` · `DASH CD: LISTO` · `RUPTURA: MAX` ·
`OLEADA 01 / 06` · `BAJAS / DESTRUCCIÓN 000`.

Ergonomía: botones ≥48px (WCAG 2.5.5), joystick 64px→48px, latencia táctil 1 frame a
60 FPS, zona central de combate 100% despejada, safe areas respetadas.

## 4. LOS 6 ENEMIGOS BÁSICOS (1 por nivel)

1. **DOBLE (N1)** — torso partido vertical, 2 cabezas desplazadas, brazos desiguales,
   piernas arqueadas, simétrico. Copia el movimiento del jugador.
2. **LANZADOR (N2)** — hombros anchísimos, brazo derecho exagerado, torso atrás, cadera
   baja, triangular invertida. El suelo es peligroso.
3. **AGRESOR (N3)** — corcovado, hombros adelante, garras curvas, muslos potentes,
   piernas abiertas. Acosa sin parar.
4. **BLINDADO (N4)** — cúbico macizo, hombreras rectangulares, centro bajo, cuello
   retraído. Guardia: 3 golpes la rompen, o un dash atravesándola la rompe entera.
5. **RESUCITADO (N5)** — asimétrico, torso roto en diagonal, brazo izq colgando, hombro
   dislocado, costillas, pierna rígida torcida. Soltarlo tiene castigo.
6. **MIMÉTICO (N6)** — humanoide base héroe, borde ondulado, articulaciones alargadas,
   distorsión ligera. Copia silueta y ataques con aprendizaje mínimo.

## 5. LOS 6 SUBJEFES (originales, silueta propia, barra de vida propia)

1. **EL CIERRE** — cilíndrico reforzado, 2 hombreras de compuerta, puños-martillo
   gigantes, piernas columnas arqueadas. `POISE BREAK 780 N`, `WEAKPOINT: BACK VENT`.
2. **LA CADENA** — alargado segmentado (vértebras), hombros rotados asimétricos, 2
   brazos larguísimos con eslabones, masa lineal. Telégrafo de anillo amplio.
3. **EL DESGARRO** — tronco superior desproporcionado, joroba afilada, costillas abiertas,
   4 extremidades asimétricas.
4. **EL MURO** — bloque cúbico gigante, cabeza hundida entre placas, brazos-muro con
   bordes, piernas pilar corto, anclado al suelo. Rompe el ritmo.
5. **EL ECO ROTO** — 2 torsos superpuestos desfasados en el eje vertical, cuello
   serpentino distorsionado, brazos desiguales largos, ondulación marcada. Genera réplicas.
6. **LA CUCHILLA COLGADA** — esbelto masivo, hombros estrechos altos, cuchilla gigante en
   un solo brazo, cadera muy baja, balanceo pendular, X invertida.

Telegrafía: `YELLOW: EVADE CONE` / `MAGENTA: FATAL SHOCK`.

## 6. LOS 6 JEFES COLOSALES (fases por porcentaje de vida, barra dedicada)

1. **PUERTA DE ACERO** — trapezoidal colosal, compuerta frontal completa, piernas
   columnas reforzadas, brazos pistón.
2. **COLAPSO** — torso partido simétrico abierto, núcleo hueco central, vigas rotas
   sobresalen, miembros caídos inestables.
3. **HORNO** — ovoide abultado, cúpula de hombreras, brazos martillo de forja, piernas
   anclaje, angular volcánico.
4. **CEMENTERIO** — apilamiento de bloques de hormigón rotos, amalgama asimétrica,
   extremidades fragmentadas, cabeza mínima hundida, aplastante.
5. **RESONANCIA** — triple eco silueteado desfasado, brazos elásticos largos, torso en
   espiral distorsionada, onírico amenazante.
6. **NÚCLEO ND** — `ND-EXT-06-APEX`, torre monolítica, torso cilíndrico con núcleo
   iluminado en contraluz, 4 pilares-brazo, piernas de raíces de cemento, 485 m.
   Fases: 100–75% anclaje tectónico / 74–30% haz vertical / 29–0% sobrecarga crítica con
   autodestrucción de 180 s. Debilidades: ojo central `MULTI-DAÑO x3.5`, articulaciones `x2.0`.

## 7. PANTALLAS

- **SPLASH** — 6–8 frames: negro → cielo, cámara lateral avanzando por la calle
  destruida, relámpago que revela al héroe en contraluz, título `NIPPON DESTRUCTION` +
  `日本崩壊` con glow `#F2DCC0`, fundido a la selección.
- **TÍTULO** — calle destruida, lluvia, cielo tormentoso, logo `ND` centrado.
- **SELECCIÓN** — 4 slots horizontales, siluetas con contraluz, seleccionado resalta
  `#F2DCC0`, ficha táctica completa, bio JA+ES, teclas `1..4`, confirmación
  `DESPLEGAR UNIDAD`.
- **JUEGO** y **GAME OVER**.

## 8. MAPAS (fondo por nivel, parallax destruido)

1 calle · 2 túnel · 3 estacionamiento en ruinas · 4 archivo · 5 clínica · 6 núcleo torre.

## 9. COMBATE Y AMBIENTE

- Parallax 4 capas: cielo `0.05` · medios rotos `0.26` · delanteros `0.48` · suelo `1.0`.
- Viñeta radial, lluvia ácida (líneas finas, charcos, vapor), relámpagos con flash
  blanco-azulado y trueno retardado.
- Golpe: speedlines radiales, polvo negro, squash/stretch ligero.
- Ruptura: corte diagonal cinemático, siluetas en pausa, líneas de velocidad, flash
  contraluz, hitstop visible.
- Daño: borde rojo pulsado. Dash: estela negra, i-frames con desenfoque direccional.
- `shakeLight` 0.22s, `shakeHeavy` 0.38s, `slashGlow`, `shockwaveExpand`,
  `flashLight` / `flashHeavy`.

## 10. AUDIO

- Web Audio API generativo: loop cyberpunk/funk **BPM 104** con capas percusión + sub +
  bass + pads + lead. Sin archivos externos.
- Barks japoneses cortos por formantes para cada héroe y enemigo (ataque, ruptura, daño,
  muerte). Sin spam de audio en la telegrafía.
- SFX: pasos, golpe, dash, daño, muerte, telégrafo, ruptura.

## 11. ENTREGABLES

**Código** (esto es lo que se usa): `index.html`, `nd.js`, `nd.webmanifest`.
Vanilla, sin build, todo funcional.

**Concept art** (referencia visual, **no se carga en el juego**): `ND_KEYART`,
`SPLASH_01..06`, `TITLE_BG`, `HERO_SELECT_FULL`, `HEROES_FULL`, `ENEMIES`,
`SUBBOSSES`, `BOSSES`, `GAMEPLAY_MOCK`, `UI_HUD`, `PALETTE`, `PROMO_LANDSCAPE`.
Todos 1920×1080. En la práctica hay **16 assets** declarados (el original announcing 17
era un error) y **5 URLs están muertas**: `ui-hud`, `splash-01`, `splash-02`,
`splash-03`, `splash-05`. No existe ningún asset square: el icono se **recorta** del
key-art (768×768 del centro → 512×512).

## 12. ESTADO — QUÉ NO HAY QUE REHACER

Ya implementado y testeado (`node test/nd-test.js`): bucle canvas + parallax, atardecer,
lluvia, 4 héroes con voz y cita, 6 arquetipos con comportamiento propio, guardia del
Blindado, dash con i-frames, hitstop, slow-motion, romper ruptura, zonas de peligro,
música generativa, PWA e icono. Ver `DESIGN_ND.md` §5 para lo que falta.
