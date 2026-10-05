# PROMPT GRÁFICO DETALLADO — STITCH AI (Nippon Destruction — ND)

## OBJETIVO
Genera diseño gráfico completo, concept art y frames HTML/CSS/JS visuales para ND. Crear identidad propia, inspirarse SOLO en referencias Stitch (no copiar NPAD).

## ESTILO
- Cine 2D anime/action, lighting cinematográfico contraluz (backlit).
- Siluetas negras 100% sólidas, cuerpos con formas geométricas limpias.
- Atardecer: cielo degradado #150E2B (violeta profundo) → #4A2247 → #A84A38 (naranja óxido) → #F0A65A (ámbar). Solo color: #ff2d6f peligro, #ffc400 aviso, #F2DCC0 acento.
- Ciudad posapocalíptica japonesa: bloques de hormigón rotos, vigas expuestas, rejas torcidas, escaparates destrozados, postes caídos. Arquitectura brutalista + casas bajas japonesas destruidas. Calles estrechas inclinadas, alcantarillas abiertas.
- Lluvia ácida: líneas verticales finas, gotas con halo, charcos reflectantes, vapor ácido.
- Rayos/truenos: bloom direccional, flare, flash blanco azulino, thunder delay.
- Parallax 3 capas: Cielo (0.05), Edificios medios rotos (0.26), Edificios delanteros destruidos (0.48), Suelo/acera (1.0). Viñeta radial suave (negro hacia bordes).
- Sin pixelado. Render suave, formas nítidas, contraste alto.

## PRESENTACIÓN (SPLASH)
Secuencia animada 6–8s:
1. Negro → cielo atardecer tormentoso
2. Cámara lateral avanza por calle destruida (parallax)
3. Relámpago ilumina silueta heroína en contraluz (silhouette reveal)
4. Título aparece: "NIPPON DESTRUCTION" (grande, bold) + "— ND" (pequeño). Glow ámbar sutil en borde.
5. Fade a pantalla título

## PANTALLA TÍTULO + SELECCIÓN HÉROES
- Fondo calle destruida, lluvia, cielo tormentoso, luz dorada lateral tras edificios (rim light).
- Título centrado superior: ND logotipo moderno geométrico.
- 4 héroes en fila horizontal: RIKA (hoja), GORO (yunque), REN (relámpago), YUI (eco). 2 mujeres, 2 hombres.
- Cada slot: marco geométrico, seleccionado brilla con #F2DCC0, silueta + línea de contraluz.
- Bio corta JA+ES debajo. Pose de pie dinámica, contraluz.

## HÉROES (DETALES GRÁFICOS)
- RIKA (mujer): delgada, haori corto ondeando, coleta alta, katana/hoja, silueta larga estrecha.
- GORO (hombre): ancho, bajo, robusto, escudo/puño, silueta trapezoidal maciza.
- REN (hombre): delgado nervioso, postura agachada dinámica, zigzag, estela eléctrica sugerida por líneas.
- YUI (mujer): esbelta, moño, silueta limpia, eco (doble contorno tenue en sombra).

## ENEMIGOS 6 (SILUETAS DISTINTAS)
1. DOBLE: 2 torsos/mitad, simétrico, copia
2. LANZADOR: hombros anchos, brazo largo proyectil, postura cargando
3. AGRESOR: encorvado agresivo, garras/puños, piernas abiertas (acoso)
4. BLINDADO: bloque cuadrado, hombreras enormes, centro bajo, inmune frontal
5. RESUCITADO: torso roto, miembro colgando, silueta irregular, amenazante
6. MIMÉTICO: humanoide distorsionado, borde ondulado (copia jugador)

Subjefes 6 + Jefes 6: volumétricos en silueta, masa mayor, 1–2 elementos únicos, telégrafo anillo rojo #ff2d6f pulsante.

## COMBATE/RUPTURAS
- Golpe: speedlines radiales, polvo negro, squash/stretch ligero
- Ruptura: corte diagonal cinemático, siluetas en pausa, líneas de velocidad, flash contraluz, hitstop visible.
- Dash: estela negra, partículas polvo, i-frames sugerido por desenfoque direccional.
- Daño: borde rojo pulsado, impacto.

## UI/HUD
HUD minimal: HP barra recta geométrica, Oleada, Bajas, Dash cooldown. Tipografía bold, tracking amplio, color #F2DCC0 sobre negro.

## MAPAS
Nivel 1–6: calle, túnel, estacionamiento ruinas, archivo, clínica, núcleo torre. Fondos con parallax destruido.

## REQUISITO DE SALIDA
Generar: splash.html, title.html, select.html, game.html, ND_CONCEPT.png (key art), HEROES_4.png, ENEMIES_6.png, BOSSES.png, PALETTE.png + descripción + CSS variables. Código Canvas funcional. Orientación landscape forzada.
