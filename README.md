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
- 6 arquetipos enemigos, uno por nivel: El Doble, Lanzador, El Agresor,
  Blindado, Resucitado, El Mimético.
- El Blindado tiene guardia: 3 golpes la rompen (1 de daño + aturdimiento),
  o un dash atravesándolo la rompe entera.
- Voces sintetizadas para ataques, rupturas, daño y muerte.
- Enemigos con gritos y telegrafia visual/audio antes de atacar.
- Combo con ruptura a partir de golpes encadenados, hitstop y slow-motion.
- Musica cyberpunk/funk generada con Web Audio (sin archivos externos).

## Tests

El juego es un IIFE sin exports, asi que las pruebas inyectan un hook para
leer el estado interno y simular frames con dobles de canvas, audio, DOM y
reloj:

```bash
node test/nd-test.js
```

Para comprobar que las pruebas detectan una regresion, se pueden lanzar contra
el commit anterior:

```bash
git show HEAD~1:nd.js > /tmp/old.js
ND_SRC=/tmp/old.js node test/nd-test.js
```
