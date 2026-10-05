# Nippon Destruction — ND

Action roguelite 2D de siluetas. Silueta negra contra atardecer con contraluz,
ciudad destruida, lluvia acida y musica cyberpunk/funk sintetizada en tiempo real.

## Jugar

```bash
python3 -m http.server 8000 --directory .
```

En el propio telefono: `http://127.0.0.1:8000` (horizontal).

## Controles

| Accion | Teclado | Tactil |
|---|---|---|
| Mover | `A`/`D` o flechas | `◀` `▶` |
| Golpe | `Espacio` o `J` | `GOLPE` |
| Dash | `Shift` o `K` | `DASH` |

## Contenido

- 4 heroes (Rika, Goro, Ren, Yui) con voz sintetizada distinta.
- 6 arquetipos enemigos, uno por nivel: Carrilero, El Doble, Lanzador, Blindado, Resucitado, El Nucleo.
- Voces sintetizadas para ataques, rupturas, daño y muerte.
- Enemigos con gritos y telegrafia visual/audio antes de atacar.
- Combo con ruptura a partir de golpes encadenados, hitstop y slow-motion.
- Musica cyberpunk/funk generada con Web Audio (sin archivos externos).
