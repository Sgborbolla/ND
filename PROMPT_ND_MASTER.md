# PROMPT MASTER COMPLETO — STITCH AI (Nippon Destruction — ND)

Generar diseño gráfico completo, concept art, sprites, animaciones, UI y CÓDIGO FUNCIONAL 100%.

## 1. PROYECTO
Nombre: NIPPON DESTRUCTION — ND
Género: Action Roguelite 2D lateral (side-scroller)
Plataformas: Android (horizontal) + Web (PWA)
Motor: HTML5 + Canvas 2D + Vanilla JavaScript + Web Audio API
Inspiración: SOLO referencias visuales Stitch del estilo NPAD. NO copiar código/texto. Crear identidad propia 100%.

## 2. REGLA DE COLOR — CRÍTICA
ÚNICOS colores permitidos en personajes/elementos jugables:
- Peligro: #ff2d6f
- Aviso/Alerta: #ffc400
- Acento/UI: #F2DCC0
NUNCA usar rojo/ámbar/naranja para decoración. Siluetas 100% negras (#000000).

Fondo cielo atardecer tormentoso:
Gradiente vertical: #150E2B 0% → #4A2247 40% → #A84A38 70% → #F0A65A 100%

## 3. ESTILO VISUAL
- 2D Anime Cinematic (render suave, no pixel art). Formas limpias geométricas.
- Iluminación: Backlit (contraluz) cinematográfico. Rim light dorado sobre siluetas.
- Ambiente: Ciudad japonesa posapocalíptica brutalista. Bloques hormigón rotos, vigas expuestas, rejas torcidas, escaparates destrozados, postes caídos, casas bajas japonesas destruidas, alcantarillas, calle estrecha inclinada.
- Efectos: Lluvia ácida (líneas finas verticales, gotas, charcos, vapor), relámpagos/truenos (flash blanco-azulado, bloom, delay), parallax 3 capas (Cielo 0.05, Medios 0.26, Delanteros 0.48, Suelo 1.0), viñeta radial suave.
- Perspectiva: 3/4 lateral, mirando hacia derecha. Sin pixelado forzado. Alto contraste, legible 24px.

## 4. PERSONAJES — 4 HÉROES (EXACTOS NPAD)

### RIKA TSUKIMI — "La Hoja" (MUJER)
- Tipo: hoja/velocidad. Marca única: HAORI corto claro ondeando detrás (vela). Única prenda clara elenco.
- Proporción: 6 cabezas, delgada, estrecha. Hombros 13px, cintura 8px, altura 42px (48x48). 158cm aprox.
- Rasgos: coleta alta, pelo rojo apagado #e04a5a, haori #e8e2ee, yukata #3c3648, piel #f0c8a8, katana diagonal cadera largo 30px, hoja #c0d8e8 filo #f4f0ff.
- Anim: Idle 8 (haori ondea), Correr 8 (delay pelo/haori), Tajo 6, Dash-ataque 6, Ruptura 12, Herida 4.
- Pose/actitud: guardia baja, ágil.

### GORO ARASHI — "El Yunque" (HOMBRE)
- Tipo: tanque/yunque. Marca: ESCUDO atado espalda (puerta).
- Proporción: 5 cabezas, ancho macizo, hombros 22px (doble Rika), cintura 18px, 44px, cabeza hundida entre hombros.
- Rasgos: escudo 14x20 espalda, maza 26px mango, placas #8a6a4a, acero #5a5448, tela #6a5a42, guante brasa #ff8a3d.
- Anim: Idle 6 pesado, Caminar 8 (balanceo escudo), Golpe 8 carga, Dash-carga 6 embestida, Ruptura 14, Herida 4 (resistente).
- Silueta: trapezoidal maciza, opuesta a Rika.

### REN HAYASHI — "El Relámpago" (HOMBRE)
- Tipo: dash/ráfagas. Marca: VENDAS + acento amarillo mínimo (#ffc400 SOLO en UI/aviso, no decorativo abusivo).
- Rasgos: delgado nervioso, manos inquietas, cabeza grande, postura agachada dinámica, zigzag, sugerir estela eléctrica por líneas.
- Anim dinámico, ráfagas.

### YUI NAKAMURA — "El Eco" (MUJER)
- Tipo: técnico/eco. Marca: MOÑO ALTO + trazador (torre).
- Rasgos: esbelta, erguida, apagada vs otros, doble contorno tenue en sombra para eco.

2M/2H. 4 siluetas 100% distinguibles a 24px. Perspectiva 3/4 derecha.

## 5. ENEMIGOS — 6 ARQUETIPOS (1 POR NIVEL)
1. NIVEL 1 — DOBLE (k:twin): simétrico 2 cuerpos, copia movimiento. Silueta dividida.
2. NIVEL 2 — LANZADOR (k:arc): hombros anchos, brazo largo, carga proyectil, postura inclinada atrás.
3. NIVEL 3 — AGRESOR (k:stick): encorvado agresivo, garras/puños, piernas abiertas, acosa constante.
4. NIVEL 4 — BLINDADO (k:block): masa cuadrada, hombreras enormes, centro bajo, resistente frontal.
5. NIVEL 5 — RESUCITADO (k:broken): torso roto, miembro colgando, irregular, amenazante.
6. NIVEL 6 — MIMÉTICO (k:echo): humanoide distorsionado, borde ondulado, copia forma/golpes jugador (aprendizaje mínimo).

## 6. JEFES/SUBJEFES
6 subjefes + 6 jefes originales silueteados. Masa mayor, 1–2 elementos únicos. Telégrafo: anillo pulsante #ff2d6f + flash + audio bark.

## 7. PANTALLAS + SECUENCIAS
- SPLASH (6–8s): negro→cielo, cámara avanza calle, relámpago revela héroe contraluz, título "NIPPON DESTRUCTION — ND" aparece (glow ámbar sutil), fade out.
- TÍTULO: fondo calle destruida lluvia+rayos, logo centrado arriba.
- SELECCIÓN HÉROES: 4 slots horizontales, seleccionado resalta #F2DCC0, bio JA+ES debajo.
- JUEGO, GAME OVER, HUD.

## 8. UI/HUD
Vida barra geométrica, Oleada, Bajas, Dash cooldown. Tipografía bold, tracking amplio, #F2DCC0 sobre negro. Botones táctiles grandes, landscape forzado.

## 9. COMBATE/ANIMACIÓN
Combos cortos, ruptura cinemática (silhouettes pause, speedlines, flash contraluz), hitstop 8–16 frames, slow 0.30–0.40s, dash i-frames, squash/stretch ligero, polvo negro, impactos.

## 10. AUDIO
Web Audio API generativo: cyberpunk/funk loopable BPM 104, capas percusión+sub+bass, pads. Barks japoneses cortos (gritos formantes) por héroe/enemigo. SFX pasos/golpe/dash/daño/muerte/telégrafo.

## 11. ARCHIVOS A GENERAR (OBLIGATORIOS)
Imágenes (renders suaves cinematográficos): ND_KEYART.png, SPLASH_FRAME_01.png–06.png, TITLE_BG.png, HERO_SELECT.png, HEROES_FULL_4.png, ENEMIES_6.png, SUBBOSSES_6.png, BOSSES_6.png, UI_HUD.png, GAMEPLAY_MOCK.png, PALETTE.png
Código funcional completo: index.html, nd.js, nd.webmanifest (fullscreen, orientation landscape, standalone)

## 12. INSTRUCCIONES TÉCNICAS
Canvas 2D, requestAnimationFrame, vanilla, sin build, PWA. Generar TODO completo y funcional (no bocetos). Fotográfico/suave, cinematográfico, detallado al máximo. Usar medidas 48x48 base, escalado nativo suave. Siluetas negras sólidas SIEMPRE.
