// ND — lineas de voz japonesas.
// Fuente unica de verdad: la usa el juego (nd.js) y el descargador
// (tools/fetch_voice.sh). Se carga por <script>, no por fetch, para que
// el juego siga funcionando en file:// sin servidor.
//
// Para regenerar los .mp3 hacen falta conexion y el script; para jugar, no.

var ND_VOICE = {
  // --- Cita de campo al elegir heroe (texto canonico ya existente) ---
  rika_cita:   { ja:'まだ名前を覚えている。…絶対に、消させはしない。', hero:0 },
  goro_cita:   { ja:'俺がこの扉を作った。最後に、俺が閉める。',           hero:1 },
  ren_cita:    { ja:'誰も行かねえなら…俺が行く。',                       hero:2 },
  yui_cita:    { ja:'もう、誰かの残響にはなりたくない。',                 hero:3 },

  // --- Tier 1: RUPTURA (boton Q) ---
  rika_rup:    { ja:'一閃。斬れ！',                                    hero:0 },
  goro_rup:    { ja:'砕けろ！',                                        hero:1 },
  ren_rup:     { ja:'雷鳴一閃！',                                      hero:2 },
  yui_rup:     { ja:'時を歪めろ！',                                    hero:3 },

  // --- Tier 3: DEFINITIVA (boton E) ---
  rika_def:    { ja:'血の歌、響け渡れ！荒野を斬り刻め！',                hero:0 },
  goro_def:    { ja:'天が崩れる！地獄へ沈め！',                          hero:1 },
  ren_def:     { ja:'嵐を巻き起こせ！',                                hero:2 },
  yui_def:     { ja:'虚無へ帰れ！',                                    hero:3 },

  // --- Dano recibido ---
  rika_hurt:   { ja:'っ…！',                                          hero:0 },
  goro_hurt:   { ja:'うっ…だ…',                                       hero:1 },
  ren_hurt:    { ja:'っ！…まだ…',                                     hero:2 },
  yui_hurt:    { ja:'っ…！ま…っ…',                                    hero:3 },

  // --- Enemigos: grito de ataque ---
  e_doble:     { ja:'影を映せ！',                                      kind:'doble' },
  e_lanzador:  { ja:'食らえ！',                                        kind:'lanzador' },
  e_agresor:   { ja:'寄るな！',                                        kind:'agresor' },
  e_blindado:  { ja:'鋼の壁だ！',                                      kind:'blindado' },
  e_resucitado:{ ja:'死なせぬ。苏るぞ！',                              kind:'resucitado' },
  e_mimetico:  { ja:'お前は誰だ？',                                    kind:'mimetico' },

  // --- Enemigos: muerte ---
  d_doble:     { ja:'消えろ…',                                        kind:'doble' },
  d_lanzador:  { ja:'うそ…っ…',                                       kind:'lanzador' },
  d_agresor:   { ja:'ぐわっ…',                                        kind:'agresor' },
  d_blindado:  { ja:'鋼が…折れる…',                                   kind:'blindado' },
  d_resucitado:{ ja:'まだ…まだだ！',                                  kind:'resucitado' },
  d_mimetico:  { ja:'偽物は…偽物…',                                   kind:'mimetico' }
};