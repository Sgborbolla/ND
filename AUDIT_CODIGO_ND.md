# ND — auditoría del código frente al diseño

Fecha: 2026-10-05. Compara `nd.js` (768 líneas), `index.html` y `test/nd-test.js`
contra `DESIGN_ND.md`, `AUDIT_STITCH_ND.md` y el prompt canónico `PROMPT_ND.md`.
Todo lo que sigue está verificado leyendo el código, no inferido de los documentos.

Tests: `node test/nd-test.js` → **27 ok / 0 fail**. Los tests pasan, y aun así hay
14 defectos: los dos más graves (shake inexistente, hitstop fuera de canon) caen
justo en lo que los tests no cubren (§5, T7).

---

## 1. Crítico

### 1.1 El shake de cámara se acumula y nunca se dibuja

`tr` se incrementa en 8 sitios y se decrementa en `nd.js:712`:

```
nd.js:496  aterrizaje      tr+=.16      nd.js:537  dash        tr+=.22
nd.js:510  guardia         tr+=.1       nd.js:559  dash-rompe  tr+=.3
nd.js:516  rompe-guardia   tr+=.24      nd.js:616  toma-daño   tr+=.5
nd.js:522  golpe normal    tr+=.17      nd.js:530  ruptura     tr+=.42
```

**Ninguna función de pintado lo lee.** `paintPlay()` (`nd.js:622-704`) y
`paintTitle()` (`nd.js:328-390`) hacen `g.save(); g.translate(-cam,0)` y nada más;
el único `translate` con coordenada distinta de 0 es el de la cámara. El resultado es
que el jugador siente el *hitstop* y el *slow-motion* (que sí funcionan) pero **el
impacto nunca tiembla**.

`PROMPT_ND.md` §9 y `AUDIT_STITCH_ND.md` §4 exigen `shakeLight` 0.22s y `shakeHeavy`
0.38s con keyframes. `DESIGN_ND.md` §4 no llega a reclamar el shake, pero §7.2 lo
lista como pendiente de portar: el pendiente está a medias, a un solo paso.

**Arreglo:** aplicar `tr` como offset aleatorio en el `translate` de cámara dentro de
`paintPlay`, con dos intensidades según el valor (`light` ≤0.2, `heavy` >0.2).

### 1.2 El hitstop nunca llega al valor canónico

`DESIGN_ND.md` §3 fija **14 frames**; `AUDIT_STITCH_ND.md` §4 pide 16f para la ruptura.
Valores reales aplicados (`punch(n)`, `nd.js:462`):

| Evento | Frames | nd.js |
|---|---|---|
| bloqueo de guardia | 3 | 510 |
| golpe normal | 5 | 522 |
| **ruptura de guardia** | 7 | 516 |
| muerte de enemigo | 8 | 475 |
| dash rompe guardia | 8 | 559 |
| daño recibido | 9 | 616 |
| **ruptura de combo** | **13** | 530 |

El techo es 13. Nunca se alcanza 14 ni 16.

---

## 2. Contradicciones con el diseño

### 2.1 Oleadas infinitas y sin condición de victoria

`spawn()` (`nd.js:443-451`):

```js
lvl=Math.min(6,1+Math.floor(wv/2));   // oleada 1-2 → arquetipo 1 ... 11-12 → arquetipo 6
const n=Math.min(3+wv,13);           // tope de 13 enemigos
```

A partir de la oleada 12 `lvl` queda clavado en 6 y `n` en 13: el juego se convierte en
un farm infinito de MIMÉTICO sin final. El diseño pide un contador con total
(`OLEADA 01 / 06`, `WAVE 04/06`) y el HUD no lo tiene: `nd.js:608` imprime
`'OLEADA '+wv` a secas. **No existe fin de partida ni pantalla de victoria.**

### 2.2 «6 arquetipos, uno por nivel» se rompe en la oleada 7

`nd.js:450`: `if(lvl>=4&&n>4)E.push(mk(ARCH[2],W+300))` — inyecta un AGRESOR extra
(nivel 3) en las oleadas de arquetipos 4, 5 y 6. `README.md` y `DESIGN_ND.md` §4
afirman "uno por nivel". El test 7 (`test/nd-test.js:264-271`) solo comprueba que los 6
arquetipos *aparecen* en 12 oleadas, nunca que sean *exclusivos*.

### 2.3 El texto `teach` del RESUCITADO describe una mecánica inexistente

`nd.js:33` — `teach:'soltar tiene castigo'`. En el código atacar al RESUCITADO no cuesta
nada: no hay coste de vida, ni de dash, ni cooldown extra. Al morir simplemente
**divide en 2 DOBLEs** (`nd.js:479-484`), que es un premio para el jugador. La etiqueta
enseña una regla que no existe.

### 2.4 Knockback declarado como hecho, inexistente

`DESIGN_ND.md` §4 marca `[x] Dash con i-frames, hitstop, slow-motion, combo con ruptura,
knockback`. **`knockback` no está implementado**: ningún impacto modifica
`P.x`, `P.vx`, `e.x` ni `e.vx`. Los únicos efectos de golpe son `burst`, `punch`, `slow`
y `tr`. El único empuje es el inherente a la velocidad del dash.

### 2.5 Habilidades de héroe inexistentes

Los 4 héroes comparten el mismo moveset; solo difieren en `spd`, `hp`, `dash`, `jp` y la
forma de la silueta (`nd.js:13-26`). No hay roles, ni `TIER 01/02/03`, ni
`VOX-FREQ`, ni las 4 métricas de la ficha, ni la iaido de Rika, el baluarte de Goro, el
zigzag de Ren o la resonancia de Yui. El diseño es explícito en `PROMPT_ND.md` §2 y
`AUDIT_STITCH_ND.md` §5, y **ningún documento recognize que falta**.

### 2.6 Enemigos: tamaños y velocidades fuera de canon

`AUDIT_STITCH_ND.md` §7 fija `w×h` y velocidad por arquetipo. El código no los usa:

| | AUDIT w×h | AUDIT sp | Código sp (`nd.js:29-34`) | Código dibuja |
|---|---|---|---|---|
| DOBLE | 50×90 | 2.2 | 128 | 32×33.6 |
| LANZADOR | 65×85 | 1.8 | 62 | 36×37.8 |
| AGRESOR | 55×80 | 3.8 | 148 | 38×39.9 |
| BLINDADO | 75×95 | 1.2 | 82 | 48×50.4 |
| RESUCITADO | 50×90 | 1.5 | 112 | 36×37.8 |
| MIMÉTICO | 48×92 | 3.2 | 138 | 40×42 |

Dos desvíos:

- **Proporción**: el canon es ~1:1.8 (siluetas altas). El código dibuja `s*2 × s*2.1`
  (`nd.js:658-668`), es decir ~1:1.05, casi cuadrados y **más bajos que el héroe**
  (45px). Se pierde la lectura de silueta que da nombre al proyecto.
- **Orden de velocidad**: el canon ordena AGRESOR > MIMÉTICO > DOBLE > LANZADOR >
  RESUCITADO > BLINDADO. El código invierte la cola: RESUCITADO (112) > BLINDADO (82) >
  LANZADOR (62). El BLINDADO, que debe ser el más lento, corre más que el RESUCITADO, y
  el LANZADOR —un enemigo a distancia— es el más lento del juego.

### 2.7 Cielo de 4 tonos documentado, 5 en el código

`DESIGN_ND.md` §3 y todos los prompts: `#150E2B → #4A2247 → #A84A38 → #F0A65A`.
`sky()` (`nd.js:273-276`) inserta **`#E8813F`** al 88% entre `#A84A38` y `#F0A65A`.
Ninguna doc lo registra. (Se ha canonicizado en `PROMPT_ND.md` §0.)

### 2.8 Parallax documentado distinto del código, y distinto entre escenas

Docs: `0.05 / 0.26 / 0.48 / 1.0`. Código:

- `paintTitle` (`nd.js:334-337`): `.10 / .24 / .46`
- `paintPlay` (`nd.js:629-632`): `.10 / .26 / .48`

`DESIGN_ND.md` §4 declara `[x] parallax 3 capas (.10/.24/.46)` citando los valores de
la pantalla de título como si fueran los del juego. La capa de cielo `0.05` no existe
como parallax: el gradiente es estático y no responde a la cámara.

### 2.9 Color fuera de paleta

`#8FE8FF` (cian) en `nd.js:680` y `nd.js:693` para el destello de i-frames de dash. Todos
los prompts, incluido el canónico, restringen el color de juego a `#FF2D6F` / `#FFC400` /
`#F2DCC0`. Está canonicizado ahora en `PROMPT_ND.md` §0, pero el código y la doc
previos no coincidían.

### 2.10 El HUD de canvas y el pad de DOM no comparten coordenadas

`paintPlay` dibuja la barra de dash en la esquina inferior izquierda del canvas
(`fillRect(16,H-16,132,7)`, `nd.js:701-703`). Los botones `#l`/`#r` están anclados a
`left:14px; bottom:18px` del **viewport** (`index.html:29`). `resize()`
(`nd.js:187-192`) hace letterbox con `Math.min(innerWidth/W, innerHeight/H)`: en una
pantalla 20:9 el canvas se centra y los botones quedan fuera de él. El HUD en canvas y
el pad en DOM se solapan y se desalinean en cuanto la relación de aspecto no es 16:9.

En general: **el HUD de 4 cuadrantes de `AUDIT_STITCH_ND.md` §4 no existe**. No hay
joystick, ni botón de ruptura, ni zonas táctiles, ni `safe areas`, ni haptic, ni
medidor trifásico. Los 4 botones DOM son círculos de 80px fijos. Correcto como
"pendiente F1", pero `DESIGN_ND.md` §4 no lo aclara y da a entender que el HUD está.

---

## 3. Defectos menores y código muerto

| # | Hallazgo | nd.js |
|---|---|---|
| 1 | `fire(fn)` definida y nunca llamada | 752 |
| 2 | `dead` asignada dos veces, nunca leída | 414, 421 |
| 3 | `SFX.jump` y `SFX.splat` nunca disparadas | 112, 118 |
| 4 | Forma `silo('core')` que ningún héroe/enemigo usa — parece la casilla reservada de NÚCLEO ND | 236-240 |
| 5 | `e.burn` y `z.hit` nunca leídos; `e.mhp` solo se escribe | 457, 468, 482 |
| 6 | `tch.u` se inicializa a 0 pero ningún elemento llama a `bind(...,'u')` → **el dash hacia arriba es solo teclado** | 392, 409 |
| 7 | `EVO` no tiene `mimetico`: el jefe de arquetipo telegrafia con sonido pero **no grita** | 98-105 |
| 8 | Línea 99 es un whitespace huérfano dentro del literal `EVO` | 99 |
| 9 | Estela del héroe en `'#000'` mientras el cuerpo usa `INK='#05030A'` | 675 |
| 10 | `ctx.letterSpacing` es solo Chromium: en Firefox/Safari el título y la selección pierden el tracking | 366-389 |
| 11 | Manifest `#0B0710` vs `<meta theme-color>` `#080510`; sin service worker → PWA instalable pero no offline | nd.webmanifest, index.html:6 |

---

## 4. Documentos

| # | Hallazgo |
|---|---|
| D1 | `DESIGN_ND.md` §4 marca `[x] knockback` sin existir (§2.4 de esta auditoría) |
| D2 | `AUDIT_STITCH_ND.md` §6 deja dos decisiones abiertas («DOBLE: decidir», «Ruptura: automática o `Q`»). El código ya decidió ambas: **mantiene DOBLE** y **ruptura automática**. La decisión nunca se escribió en la tabla de canónicos de `DESIGN_ND.md` §3. Ahora está en `PROMPT_ND.md` §0 |
| D3 | `DESIGN_ND.md` §2 remitía a `PROMPT_ND_*.md` ("V2 es el maestro"); ahora es `PROMPT_ND.md` |
| D4 | `README.md` (50 líneas) no menciona la auditoría, las fases F0-F6 ni las trampas de `refs/` |
| D5 | `README.md` y `DESIGN_ND.md` presentan `python3 -m http.server` / `node server.js` / `start.bat` como necesarios. **El juego no necesita servidor**: no hay `fetch`, ni ES modules, ni XHR. `file://` funciona |
| D6 | `DESIGN_ND.md` §5.4 dice que los subjefes "entran en oleadas altas" y §6 no dice en cuál. Sin criterio verificable |
| D7 | `DESIGN_ND.md` §5.6 deja abierto «`Q` / ruptura manual (decidir)» — decidido: automática |
| D8 | `icons/candidates/` está en `.gitignore` y no se menciona en ningún documento |

---

## 5. Tests

Tests: 27 ok / 0 fail. Problemas:

| # | Hallazgo |
|---|---|
| T1 | Funciones muertas `musicTimers()` y `countMusic()` (líneas 141-148). `countMusic` lee `t.dt`, campo que nunca se define. No prueban nada |
| T2 | «no se duplican bucles» comprueba `timers.length<8`: umbral arbitrario, no una invariante del código |
| T3 | El comentario del test de dash dice «el clamp del jugador lo deja fuera de alcance en x>938», pero el test coloca al jugador en `x=580` y al enemigo en `600`. El comentario describe otra cosa |
| T4 | El test 7 llama a `T.spawn()` 12 veces sin limpiar `E`: acumula enemigos de 12 oleadas. Pasa porque solo lee `ARCH[lvl-1].label` |
| T5 | `SRC` tiene una ruta absoluta hardcodeada a `/storage/emulated/0/silueta/nd.js` (línea 3): los tests no corren en otro equipo |
| T6 | El hook expone `update` pero no `paintPlay`/`paintTitle`; la sección 5 depende de que `step()` llegue al pintado a través del callback de rAF: acoplado al flujo de `frame()` |
| T7 | **Sin cobertura de hitstop, shake, total de oleadas, fin de partida ni texto del HUD.** Son exactamente los hallazgos §1.1 y §1.2 y el §2.1 |

---

## 6. Veredicto por archivo

| Documento | Estado |
|---|---|
| `nd.js` | Sólido en lo mecánico: audio, input, oleadas, IA de los 6 arquetipos, zonas. Los fallos se concentran en *game feel* (shake ausente, hitstop corto) y en lo que el diseño promete y no está (skills por héroe, subjefes, jefes, HUD, knockback) |
| `index.html` | Correcto y mínimo. El problema no es el archivo sino el mix canvas/DOM (§2.10) |
| `test/nd-test.js` | Verde pero con 2 funciones muertas, 1 ruta absoluta y un hueco de cobertura justo sobre los defectos principales |
| `DESIGN_ND.md` | Honesto en §5 (lo que falta) pero **optimista en §4** (knockback) y desactualizado en §2 tras la consolidación de prompts |
| `AUDIT_STITCH_ND.md` | Íntegro. Sus dos decisiones abiertas (§4 D2) ya están tomadas por el código |
| `PROMPT_ND.md` | Nuevo. Consolida los 11 prompts y cierra las contradicciones que los mantenía vivos |

## 7. Orden de arreglo sugerido

1. **Shake** (§1.1) — 6 líneas, el mayor salto de sensación de impacto.
2. **Hitstop a 14f** en la ruptura (§1.2) — 1 número.
3. **Tests de hitstop y shake** (§5 T7) — para que no vuelvan a romperse en silencio.
4. **Fin de partida** (§2.1) — total de oleadas + victoria.
5. **Corregir §4 de `DESIGN_ND.md`**: quitar `knockback` de la lista de hechos (§4 D1).
6. **Proporción y velocidad de enemigos** (§2.6) — es lo que recupera la silueta.
7. **Limpieza de código muerto** (§3) y `Q`/DOBLE resueltos en las docs (§4 D2, D7).
8. Fases de producto ya planificadas: F1 HUD, F2 ficha, F3 splash, F4 subjefes, F5 jefes.
