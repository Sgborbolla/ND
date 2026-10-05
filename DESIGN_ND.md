# ND — Nippon Destruction
Diseño práctico para seguir desde cualquier sesión.

## 1. Idea
Juego 2D de acción con 2 botones (golpe + dash), estilo siluetas negras, ambiente atardecer con contraluz.
Nombre: Nippon Destruction → ND.

## 2. Objetivo
Crear algo pegadizo, funcional, agradable al ver/jugar, que guste en móvil (horizontal) + web.

## 3. Estilo visual
- Siluetas negras para personajes/enemigos (legible, barato)
- Atardecer con contraluz (cielo morado-naranja)
- Parallax suave, niebla cálida, viñeta ligera
- Sin pixelado (suavizado nativo)
- Uso de color solo para peligro (#ff2d6f), atención (#ffc400), acento
- Inspirado en referencias Stitch del proyecto NPAD (usar solo como guía, no copiar fielmente)

## 4. Jugabilidad
- 2 botones: MOVER (izq/der), GOLPE, DASH
- Combos cortos (1–2 hits) + dash evasivo
- Hitstop breve para dar peso
- Knockback sutil, i-frames con dash
- Olas crecientes
- 6 arquetipos enemigos → uno por nivel (1–6)
- Subjefes/jefes mínimos si scope lo permite

## 5. Audio (Cyberpunk/Funk)
- BGM loopable cyberpunk+funk (sintetizado)
- SFX: pasos, golpe, dash, daño, muerte enemigo, aterrizaje, telégrafo
- Voces japonés muy cortas (barks) + subtítulos ES (opcional)
- CC0 si se descargan, o generados por código

## 6. UI/UX
- Pantalla inicio minimalista (ND + roster)
- HUD: vida + oleada + bajas
- Controles táctiles grandes (móvil)
- Landscape obligatorio
- PWA: fullscreen/orientation=landscape

## 7. Arquitectura (vanilla)
index.html + nd.js + nd.webmanifest
Canvas 2D, requestAnimationFrame
Sin build. Servir con python/http-server
Escalable a Astro solo para UI si se quiere

## 8. Roadmap
- [ ] 6 arquetipos con comportamiento distinto
- [ ] Combos + rupturas sencillas
- [ ] Más feedback (squash/stretch, polvo, chispas)
- [ ] Música funcional
- [ ] Balance dash/golpe
- [ ] Test móvil horizontal

## 9. Notas
- No replicar NPAD tal cual. Inspiración ligera.
- Priorizar "se siente bien" sobre cantidad.
- Siluetas + color solo peligro = legible.
