# Nippon Destruction — ND

Action roguelite 2D de siluetas. Silueta negra contra atardecer con contraluz,
ciudad destruida, lluvia acida y musica cyberpunk/funk sintetizada en tiempo real.

Vanilla: HTML5 + Canvas 2D + Web Audio. Sin build, sin dependencias.

## Jugar

Abre `index.html` en el navegador. **No hace falta servidor**: no hay `fetch`, ni
ES modules, ni XHR, así que `file://` funciona.

Para probarlo desde el móvil en la misma red, o para servirlo en local:

```bash
python3 -m http.server 8000 --directory .   # http://127.0.0.1:8000 (horizontal)
node server.js                              # o el servidor propio, en el 8123
```

En PC, `start.bat` abre el juego directamente.

## Controles

| Accion | Teclado | Tactil |
|---|---|---|
| Mover | `A`/`D` o flechas | `◀` `▶` |
| Golpe | `Espacio` o `J` | `GOLPE` |
| Dash | `Shift` o `K` | `DASH` |
| Dash hacia arriba | `W` / `↑` | — (solo teclado) |
| Empezar / reiniciar | `Enter` / `R` | `ENTRAR` / `REINTENTAR` |

## Contenido

- 4 heroes (Rika, Goro, Ren, Yui) con voz sintetizada distinta.
- 6 arquetipos enemigos, uno por nivel: El Doble, Lanzador, El Agresor,
  Blindado, Resucitado, El Mimético.
- El Blindado tiene guardia: 3 golpes la rompen (1 de daño + aturdimiento),
  o un dash atravesándolo la rompe entera.
- Voces sintetizadas para ataques, rupturas, daño y muerte.
- Enemigos con gritos y telegrafia visual/audio antes de atacar.
- Ruptura a partir de golpes encadenados, con hitstop y slow-motion.
- Zonas de peligro dibujadas en coordenadas de mundo.
- Musica cyberpunk/funk BPM 104 generada con Web Audio (sin archivos externos).
- PWA instalable: fullscreen, orientation landscape, icono propio.

## Estado

Lo que falta está en `DESIGN_ND.md` §5 (F1-F6). Lo que está implementado pero solo
a medias, en `DESIGN_ND.md` §4.1. Los 14 defectos conocidos del codigo, con
referencias `archivo:linea`, en `AUDIT_CODIGO_ND.md` — los dos graves son que **el
shake de camara nunca se dibuja** y que **el hitstop se queda en 13 frames** cuando
el canonico son 14.

## Documentos

| Archivo | Que es |
|---|---|
| `DESIGN_ND.md` | Documento de estádo. Retoma el proyecto desde aqui. |
| `PROMPT_ND.md` | Prompt canonico de diseno (consolida los 11 anteriores, ya borrados) |
| `AUDIT_STITCH_ND.md` | Auditoria de los 26 HTML de Stitch de referencia |
| `AUDIT_CODIGO_ND.md` | Auditoria del codigo frente al diseno |

## Tests

El juego es un IIFE sin exports, asi que las pruebas inyectan un hook para
leer el estádo interno y simular frames con dobles de canvas, audio, DOM y
reloj:

```bash
node test/nd-test.js          # 27 ok / 0 fail
```

`ND_SRC` permite apuntar a otro `nd.js` (la ruta por defecto está hardcodeada a
este dispositivo):

```bash
git show HEAD~1:nd.js > /tmp/old.js
ND_SRC=/tmp/old.js node test/nd-test.js   # debe fallar: comprueba que detectan regresiones
```

## Trampas

- Las imagenes de `refs/` (Stitch) **no se usan en el juego**: todo se dibuja por
  codigo. Son referencia visual, y solo por nombre, porque no se pueden mirar.
- `refs/hi/` y `refs/stitch/` están en `.gitignore`: se redescargan.
- El icono se **recorta** del key-art, porque no hay ningun asset square.
- Sin service worker: la PWA es instalable, pero no funciona offline.
