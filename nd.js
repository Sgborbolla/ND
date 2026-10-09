(function() {
  'use strict';

  const COLORS = {
    skyTop: '#150E2B', skyMid: '#4A2247', skyBot: '#A84A38', skyHor: '#F0A65A',
    rim: '#F2DCC0', danger: '#FF2D6F', warning: '#FFC400', ink: '#000000', white: '#FFFFFF'
  };
  const CANVAS_W = 960;
  const CANVAS_H = 540;
  const GROUND_Y = 420;
  const FPS = 60;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const btnMenu = document.getElementById('btn-menu');

  // === VIEWPORT DINÁMICO (horizontal llena, vertical letterbox) ===
  let VIEW_W = CANVAS_W;
  let VIEW_H = CANVAS_H;
  let viewOffsetX = 0;

  function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspectRatio = w / h;
    const baseAspect = CANVAS_W / CANVAS_H;
    if (aspectRatio > baseAspect) {
      // Horizontal: expandir el ancho lógico para llenar la pantalla
      VIEW_H = CANVAS_H;
      VIEW_W = Math.round(CANVAS_H * aspectRatio);
    } else {
      // Vertical: mantener 16:9 y encajar con letterbox (nada se recorta)
      VIEW_W = CANVAS_W;
      VIEW_H = CANVAS_H;
    }
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const scale = Math.min(w / VIEW_W, h / VIEW_H);
    canvas.style.width = Math.round(VIEW_W * scale) + 'px';
    canvas.style.height = Math.round(VIEW_H * scale) + 'px';
    viewOffsetX = (VIEW_W - CANVAS_W) / 2;
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  resizeCanvas();

  let lastTime = 0;
  let timeScale = 1.0;
  let shakeX = 0, shakeY = 0;
  let scrollX = 0;
  let time = 0;
  let hitstopTimer = 0;
  let combo = 0;
  let comboDecayTimer = 0;
  let gameState = 'select';
  let wave = 1;
  let spawnTimer = 0;

  const HERO_DATA = {
    RIKA: { name: 'RIKA', kanji: '里花', title: 'LA HOJA', role: 'DPS', color: '#F2DCC0' },
    GORO: { name: 'GORO', kanji: '五郎', title: 'EL YUNQUE', role: 'TANK', color: '#FFC400' },
    REN: { name: 'REN', kanji: '蓮', title: 'EL RELÁMPAGO', role: 'SPEED', color: '#FFC400' },
    YUI: { name: 'YUI', kanji: '結衣', title: 'EL ECO', role: 'CHRONO', color: '#F2DCC0' }
  };

  let player = {
    type: 'RIKA', x: 200, y: GROUND_Y, facing: 1,
    state: 'idle', animTimer: 0, speed: 180, vx: 0,
    attackTimer: 0, attackDuration: 0.18,
    cargas: 3, maxCargas: 3, cargaTimer: 0,
    isRupturing: false, rupturaTimer: 0
  };

  // === JOYSTICK VIRTUAL HORIZONTAL ===
  const joystickZone = document.getElementById('joystick-zone');
  const joystickStick = document.getElementById('joystick-stick');
  let joystickActive = false;
  let joystickVectorX = 0;
  const JOYSTICK_MAX_RADIUS = 40;
  const JOYSTICK_DEAD_ZONE = 8;

  function updateJoystickPosition(clientX, clientY) {
    const rect = joystickZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    let dx = clientX - centerX;
    const distance = Math.abs(dx);
    if (distance > JOYSTICK_MAX_RADIUS) dx = Math.sign(dx) * JOYSTICK_MAX_RADIUS;
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
    joystickVectorX = dx / JOYSTICK_MAX_RADIUS;
    if (Math.abs(joystickVectorX) < JOYSTICK_DEAD_ZONE / JOYSTICK_MAX_RADIUS) joystickVectorX = 0;
  }
  function resetJoystick() {
    joystickActive = false;
    joystickVectorX = 0;
    joystickStick.style.transform = 'translate(-50%, -50%)';
  }
  joystickZone.addEventListener('pointerdown', (e) => {
    e.preventDefault(); joystickActive = true;
    joystickZone.setPointerCapture(e.pointerId);
    updateJoystickPosition(e.clientX, e.clientY);
  });
  joystickZone.addEventListener('pointermove', (e) => {
    if (joystickActive) { e.preventDefault(); updateJoystickPosition(e.clientX, e.clientY); }
  });
  joystickZone.addEventListener('pointerup', (e) => { e.preventDefault(); resetJoystick(); });
  joystickZone.addEventListener('pointercancel', () => { resetJoystick(); });

  // === ENEMIGOS MEJORADOS ===
  const enemies = [];
  function spawnEnemy() {
    enemies.push({
      type: 'DOBLE', x: CANVAS_W + 50, y: GROUND_Y, facing: -1,
      state: 'walk', animTimer: 0, hp: 1, attackTimer: 0
    });
  }
  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.animTimer += dt;
      const dist = player.x - e.x;
      if (Math.abs(dist) > 60) {
        e.x += (dist > 0 ? 1 : -1) * 60 * dt;
        e.facing = dist > 0 ? 1 : -1;
        e.state = 'walk';
      } else {
        e.state = 'idle';
        if (e.attackTimer <= 0 && Math.random() < 0.02) e.attackTimer = 0.5;
      }
      if (e.attackTimer > 0) e.attackTimer -= dt;
      if (player.state === 'attack' || player.isRupturing) {
        const attackRange = 80;
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (Math.abs(dx) < attackRange && Math.abs(dy) < 50 && Math.sign(dx) === player.facing) {
          e.hp--;
          if (e.hp <= 0) {
            for (let j = 0; j < 20; j++) {
              particles.push({
                x: e.x, y: e.y - 40,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                life: 20, maxLife: 20, color: COLORS.danger, type: 'ray'
              });
            }
            enemies.splice(i, 1);
            combo++;
            comboDecayTimer = 2.5;
          }
        }
      }
    }
  }
  function drawDoble(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.facing, 1);
    const t = e.animTimer;
    const legSwing = e.state === 'walk' ? Math.sin(t * 8) * 10 : 0;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas con armadura
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-8 - legSwing * 0.5, 0); ctx.lineTo(-4 - legSwing * 0.5, 0); ctx.lineTo(-2, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(8 + legSwing * 0.5, 0); ctx.lineTo(4 + legSwing * 0.5, 0); ctx.lineTo(2, -20); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Grebas (armadura de piernas)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-9 - legSwing * 0.5, -8, 6, 8);
    ctx.fillRect(3 + legSwing * 0.5, -8, 6, 8);

    // Torso con armadura samurái
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-12, -65); ctx.lineTo(12, -65); ctx.lineTo(10, -20); ctx.lineTo(-10, -20); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Peto (armadura del pecho)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-10, -60, 20, 35);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -60, 20, 35);

    // Casco samurái
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(0, -75, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Cuernos del casco
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -78); ctx.lineTo(-14, -85); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -78); ctx.lineTo(14, -85); ctx.stroke();

    // Visor del casco
    ctx.fillStyle = COLORS.danger;
    ctx.shadowBlur = 8;
    ctx.shadowColor = COLORS.danger;
    ctx.fillRect(-6, -76, 12, 3);
    ctx.shadowBlur = 0;

    // Hombros con hombreras
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.arc(-12, -62, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, -62, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Brazos
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-10, -60); ctx.lineTo(-15, -40); ctx.lineTo(-12, -30); ctx.lineTo(-8, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -60); ctx.lineTo(15, -40); ctx.lineTo(12, -30); ctx.lineTo(8, -40); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Espadas (dos katanas)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, -30); ctx.lineTo(-12, -5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -30); ctx.lineTo(12, -5); ctx.stroke();

    // Brillo de las espadas
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-11, -28); ctx.lineTo(-11, -7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, -28); ctx.lineTo(13, -7); ctx.stroke();

    ctx.restore();
  }
  function drawEnemies(ctx) { enemies.forEach(e => { if (e.type === 'DOBLE') drawDoble(ctx, e); }); }

  // === CONTROL DEL BOTÓN MENU ===
  function updateMenuButton() {
    if (gameState === 'play') btnMenu.classList.add('visible');
    else btnMenu.classList.remove('visible');
  }
  function goToSelect() {
    gameState = 'select'; combo = 0;
    particles.length = 0; attackEffects.length = 0; ruptureEffects.length = 0; enemies.length = 0;
    updateMenuButton();
  }

  // === SILUETA DETALLADA DE RIKA (MEJORADA) ===
  function drawRika(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 12 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 8 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Piernas con hakama (pantalón samurái)
    ctx.beginPath(); ctx.moveTo(-6, -25); ctx.lineTo(-10 - legSwing * 0.5, -10); ctx.lineTo(-8 - legSwing * 0.5, 0); ctx.lineTo(-4 - legSwing * 0.5, 0); ctx.lineTo(-4, -10); ctx.lineTo(-2, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -25); ctx.lineTo(10 + legSwing * 0.5, -10); ctx.lineTo(8 + legSwing * 0.5, 0); ctx.lineTo(4 + legSwing * 0.5, 0); ctx.lineTo(4, -10); ctx.lineTo(2, -25); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Torso con haori (chaqueta samurái)
    ctx.beginPath(); ctx.moveTo(-14, -70 + breathe); ctx.lineTo(14, -70 + breathe); ctx.lineTo(12, -50); ctx.lineTo(10, -25); ctx.lineTo(-10, -25); ctx.lineTo(-12, -50); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Cinturón obi
    ctx.fillStyle = COLORS.rim;
    ctx.fillRect(-11, -28, 22, 3);
    ctx.fillStyle = COLORS.ink;

    // Mangas del haori
    ctx.beginPath(); ctx.moveTo(-12, -65 + breathe); ctx.lineTo(-16 - armSwing, -45); ctx.lineTo(-14 - armSwing, -30); ctx.lineTo(-10 - armSwing, -30); ctx.lineTo(-10, -45); ctx.lineTo(-8, -65 + breathe); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Cabeza
    ctx.beginPath(); ctx.arc(0, -78 + breathe, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Pelo largo en cola de caballo (más detallado)
    ctx.beginPath();
    ctx.moveTo(-2, -82 + breathe);
    ctx.quadraticCurveTo(-8, -85 + breathe, -12, -82 + breathe);
    ctx.quadraticCurveTo(-15, -78 + breathe, -14, -72 + breathe);
    ctx.quadraticCurveTo(-18, -65 + breathe, -22, -55 + breathe);
    ctx.quadraticCurveTo(-26, -45 + breathe, -28, -35 + breathe);
    ctx.quadraticCurveTo(-30, -25 + breathe, -26, -20 + breathe);
    ctx.quadraticCurveTo(-22, -18 + breathe, -20, -22 + breathe);
    ctx.quadraticCurveTo(-18, -30 + breathe, -16, -40 + breathe);
    ctx.quadraticCurveTo(-14, -50 + breathe, -12, -60 + breathe);
    ctx.quadraticCurveTo(-10, -68 + breathe, -6, -75 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brazo delantero con katana
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.9 : 0.2;
    ctx.save();
    ctx.translate(12, -65 + breathe);
    ctx.rotate(armAngle);

    // Manga
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(5, 18); ctx.lineTo(3, 22); ctx.lineTo(-3, 22); ctx.lineTo(-5, 18); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Katana mejorada
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 65); ctx.stroke();

    // Tsuba (guarda)
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-4, 18, 8, 3);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, 18, 8, 3);

    // Brillo del filo
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1, 22); ctx.lineTo(1, 63); ctx.stroke();

    ctx.restore();

    // Efecto de tajo mejorado
    if (isAttacking && attackProgress < 1) {
      const prog = p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress;
      ctx.strokeStyle = p.isRupturing ? COLORS.white : COLORS.danger;
      ctx.lineWidth = p.isRupturing ? 6 : 3;
      ctx.globalAlpha = 1 - prog;
      ctx.shadowBlur = p.isRupturing ? 25 : 15;
      ctx.shadowColor = p.isRupturing ? COLORS.warning : COLORS.danger;
      ctx.beginPath(); ctx.arc(0, -40, p.isRupturing ? 100 : 50, -Math.PI / 3, Math.PI / 3 + prog * Math.PI); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  // === SILUETA DETALLADA DE GORO (MEJORADA) ===
  function drawGoro(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 10 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 6 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;

    // Piernas musculosas
    ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(-14 - legSwing * 0.5, -10); ctx.lineTo(-12 - legSwing * 0.5, 0); ctx.lineTo(-6 - legSwing * 0.5, 0); ctx.lineTo(-6, -10); ctx.lineTo(-4, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -25); ctx.lineTo(14 + legSwing * 0.5, -10); ctx.lineTo(12 + legSwing * 0.5, 0); ctx.lineTo(6 + legSwing * 0.5, 0); ctx.lineTo(6, -10); ctx.lineTo(4, -25); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Torso musculoso
    ctx.beginPath(); ctx.moveTo(-22, -65 + breathe); ctx.lineTo(22, -65 + breathe); ctx.lineTo(20, -45); ctx.lineTo(18, -25); ctx.lineTo(-18, -25); ctx.lineTo(-20, -45); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Pectorales
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -60 + breathe); ctx.lineTo(0, -40); ctx.stroke();

    // Brazos musculosos
    ctx.beginPath(); ctx.moveTo(-20, -60 + breathe); ctx.lineTo(-26 - armSwing, -40); ctx.lineTo(-22 - armSwing, -25); ctx.lineTo(-16 - armSwing, -25); ctx.lineTo(-16, -40); ctx.lineTo(-14, -60 + breathe); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Cabeza calva
    ctx.beginPath(); ctx.arc(0, -75 + breathe, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Brazo delantero con maza
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.8 : 0.3;
    ctx.save();
    ctx.translate(20, -60 + breathe);
    ctx.rotate(armAngle);

    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(7, 20); ctx.lineTo(4, 24); ctx.lineTo(-4, 24); ctx.lineTo(-7, 20); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Maza mejorada
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 40); ctx.stroke();

    // Cabeza de la maza
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-12, 38, 24, 16);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, 38, 24, 16);

    ctx.restore();

    // Escudo a la espalda
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-22, -45, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-22, -45, 8, 0, Math.PI * 2); ctx.stroke();

    // Efecto de impacto
    if (isAttacking && attackProgress < 1) {
      const prog = p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress;
      ctx.strokeStyle = p.isRupturing ? COLORS.danger : COLORS.warning;
      ctx.lineWidth = p.isRupturing ? 8 : 5;
      ctx.globalAlpha = 1 - prog;
      ctx.shadowBlur = p.isRupturing ? 35 : 20;
      ctx.shadowColor = p.isRupturing ? COLORS.danger : COLORS.warning;
      ctx.beginPath(); ctx.arc(0, 0, p.isRupturing ? 140 * prog : 70 * prog, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  // === SILUETA DETALLADA DE REN (MEJORADA) ===
  function drawRen(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 10) * 15 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 10) * 10 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;

    // Piernas con vendas
    ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(-8 - legSwing * 0.5, -10); ctx.lineTo(-6 - legSwing * 0.5, 0); ctx.lineTo(-3 - legSwing * 0.5, 0); ctx.lineTo(-3, -10); ctx.lineTo(-2, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5, -20 + i * 6); ctx.lineTo(-7, -18 + i * 6); ctx.stroke(); }

    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.moveTo(5, -22); ctx.lineTo(8 + legSwing * 0.5, -10); ctx.lineTo(6 + legSwing * 0.5, 0); ctx.lineTo(3 + legSwing * 0.5, 0); ctx.lineTo(3, -10); ctx.lineTo(2, -22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Torso con chaqueta
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.moveTo(-11, -65 + breathe); ctx.lineTo(11, -65 + breathe); ctx.lineTo(10, -45); ctx.lineTo(9, -22); ctx.lineTo(-9, -22); ctx.lineTo(-10, -45); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Brazos con vendas
    ctx.beginPath(); ctx.moveTo(-9, -60 + breathe); ctx.lineTo(-13 - armSwing, -42); ctx.lineTo(-11 - armSwing, -28); ctx.lineTo(-7 - armSwing, -28); ctx.lineTo(-7, -42); ctx.lineTo(-5, -60 + breathe); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10, -55 + breathe + i * 8); ctx.lineTo(-12, -53 + breathe + i * 8); ctx.stroke(); }

    // Cabeza
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.arc(0, -75 + breathe, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pelo puntiagudo
    ctx.beginPath();
    ctx.moveTo(-7, -78 + breathe);
    ctx.lineTo(-10, -85 + breathe);
    ctx.lineTo(-6, -82 + breathe);
    ctx.lineTo(-3, -88 + breathe);
    ctx.lineTo(0, -84 + breathe);
    ctx.lineTo(3, -89 + breathe);
    ctx.lineTo(6, -83 + breathe);
    ctx.lineTo(9, -86 + breathe);
    ctx.lineTo(7, -78 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brazo delantero con daga
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.9 : 0.3;
    ctx.save();
    ctx.translate(9, -60 + breathe);
    ctx.rotate(armAngle);

    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(4, 16); ctx.lineTo(2, 19); ctx.lineTo(-2, 19); ctx.lineTo(-4, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Daga
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 28); ctx.stroke();
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, 18); ctx.lineTo(1, 27); ctx.stroke();

    ctx.restore();

    // Efecto de arcos dorados
    if (isAttacking && attackProgress < 1) {
      const prog = p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress;
      ctx.strokeStyle = COLORS.warning;
      ctx.lineWidth = p.isRupturing ? 6 : 4;
      ctx.globalAlpha = 1 - prog;
      ctx.shadowBlur = p.isRupturing ? 20 : 12;
      ctx.shadowColor = COLORS.warning;
      ctx.beginPath(); ctx.arc(0, -30, p.isRupturing ? 70 : 45, -Math.PI / 2 + prog * Math.PI * 2, Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
      if (p.isRupturing) { ctx.beginPath(); ctx.arc(0, -30, 50, -Math.PI / 2 - prog * Math.PI * 2, Math.PI / 2 - prog * Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  // === SILUETA DETALLADA DE YUI (MEJORADA) ===
  function drawYui(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 11 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 7 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;

    // Piernas
    ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(-8 - legSwing * 0.5, -10); ctx.lineTo(-6 - legSwing * 0.5, 0); ctx.lineTo(-3 - legSwing * 0.5, 0); ctx.lineTo(-3, -10); ctx.lineTo(-2, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(8 + legSwing * 0.5, -10); ctx.lineTo(6 + legSwing * 0.5, 0); ctx.lineTo(3 + legSwing * 0.5, 0); ctx.lineTo(3, -10); ctx.lineTo(2, -24); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Torso con ropa táctica
    ctx.beginPath(); ctx.moveTo(-12, -68 + breathe); ctx.lineTo(12, -68 + breathe); ctx.lineTo(11, -48); ctx.lineTo(10, -24); ctx.lineTo(-10, -24); ctx.lineTo(-11, -48); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Brazos
    ctx.beginPath(); ctx.moveTo(-10, -63 + breathe); ctx.lineTo(-14 - armSwing, -45); ctx.lineTo(-12 - armSwing, -30); ctx.lineTo(-8 - armSwing, -30); ctx.lineTo(-8, -45); ctx.lineTo(-6, -63 + breathe); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Cabeza
    ctx.beginPath(); ctx.arc(0, -76 + breathe, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Pelo corto
    ctx.beginPath();
    ctx.moveTo(-7, -79 + breathe);
    ctx.quadraticCurveTo(-9, -83 + breathe, -5, -84 + breathe);
    ctx.quadraticCurveTo(0, -85 + breathe, 5, -84 + breathe);
    ctx.quadraticCurveTo(9, -83 + breathe, 7, -79 + breathe);
    ctx.quadraticCurveTo(8, -74 + breathe, 6, -72 + breathe);
    ctx.lineTo(-6, -72 + breathe);
    ctx.quadraticCurveTo(-8, -74 + breathe, -7, -79 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brazo delantero con rifle
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.7 : 0.2;
    ctx.save();
    ctx.translate(10, -63 + breathe);
    ctx.rotate(armAngle);

    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(5, 18); ctx.lineTo(3, 21); ctx.lineTo(-3, 21); ctx.lineTo(-5, 18); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Rifle detallado
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-2, 19); ctx.lineTo(-2, 50); ctx.stroke();

    // Cuerpo del rifle
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-4, 17, 8, 6);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, 17, 8, 6);

    // Mira telescópica
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-2, 14, 4, 4);
    ctx.strokeRect(-2, 14, 4, 4);

    // Cañón
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-1, 48); ctx.lineTo(-1, 55); ctx.stroke();

    // Trazador
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 48); ctx.stroke();

    ctx.restore();

    // Efecto de disparo
    if (isAttacking && attackProgress < 1) {
      const prog = p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress;
      ctx.strokeStyle = p.isRupturing ? COLORS.warning : COLORS.danger;
      ctx.lineWidth = p.isRupturing ? 5 : 3;
      ctx.globalAlpha = 1 - prog;
      ctx.shadowBlur = p.isRupturing ? 25 : 12;
      ctx.shadowColor = p.isRupturing ? COLORS.warning : COLORS.danger;
      ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(p.isRupturing ? 250 : 80, -40); ctx.stroke();
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  function drawHeroSilhouette(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    if (p.type === 'RIKA') drawRika(ctx, p);
    else if (p.type === 'GORO') drawGoro(ctx, p);
    else if (p.type === 'REN') drawRen(ctx, p);
    else if (p.type === 'YUI') drawYui(ctx, p);
    ctx.restore();
  }

  // === LÓGICA DEL JUGADOR ===
  function updatePlayer(dt) {
    player.animTimer += dt;
    player.cargaTimer += dt;
    if (player.cargaTimer >= 5.0 && player.cargas < player.maxCargas) {
      player.cargas++;
      player.cargaTimer = 0;
    }

    let moveDir = 0;
    if (joystickActive && Math.abs(joystickVectorX) > 0.1) {
      moveDir = joystickVectorX > 0 ? 1 : -1;
    }
    if (keys['ArrowLeft'] || keys['KeyA']) moveDir -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveDir += 1;

    if (player.isRupturing) {
      player.rupturaTimer += dt;
      if (player.rupturaTimer >= 0.6) {
        player.isRupturing = false;
        player.rupturaTimer = 0;
        player.state = 'idle';
        player.animTimer = 0;
      }
      return;
    }

    if (moveDir !== 0) {
      player.facing = moveDir;
      player.vx = moveDir * player.speed;
      player.state = 'run';
    } else {
      player.vx = 0;
      player.state = 'idle';
    }

    player.x += player.vx * dt;
    const safeMargin = CANVAS_W * 0.25;
    if (player.x < safeMargin) player.x = safeMargin;
    if (player.x > CANVAS_W - safeMargin) player.x = CANVAS_W - safeMargin;

    if ((keys['Space'] || keys['KeyJ'] || touchState.tajo) && player.state !== 'attack') {
      player.state = 'attack';
      player.attackTimer = player.attackDuration;
      player.animTimer = 0;
      spawnAttackEffect(player.type, player.x + player.facing * 60, player.y - 60, player.facing);
      triggerImpact(player.x + player.facing * 60, player.y - 60, combo);
    }

    if ((keys['KeyQ'] || touchState.ruptura) && player.cargas >= 1 && player.state !== 'attack' && !player.isRupturing) {
      player.cargas--;
      player.isRupturing = true;
      player.rupturaTimer = 0;
      player.animTimer = 0;
      combo = 0;
      hitstopTimer = 24 / FPS;
      shakeX = (Math.random() - 0.5) * 25;
      shakeY = (Math.random() - 0.5) * 25;
      flashAlpha = 0.9;
      spawnRuptureEffect(player.type, player.x, player.y - 40, player.facing);
    }

    if (player.state === 'attack') {
      player.attackTimer -= dt;
      if (player.attackTimer <= 0) {
        player.state = 'idle';
        player.attackTimer = 0;
        player.animTimer = 0;
      }
    }
    scrollX += player.vx * dt * 0.5;
  }

  // === EFECTOS DE RUPTURA ===
  const ruptureEffects = [];
  function spawnRuptureEffect(heroType, x, y, facing) {
    ruptureEffects.push({ type: heroType, x, y, facing, life: 1.0, duration: 0.8, radius: 0, maxRadius: heroType === 'GORO' ? 200 : 150 });
  }
  function updateRuptureEffects(dt) {
    for (let i = ruptureEffects.length - 1; i >= 0; i--) {
      const eff = ruptureEffects[i];
      eff.life -= dt / eff.duration;
      eff.radius = eff.maxRadius * (1 - eff.life);
      if (eff.life <= 0) ruptureEffects.splice(i, 1);
    }
  }
  function drawRuptureEffects(ctx) {
    ruptureEffects.forEach(eff => {
      const alpha = Math.max(0, eff.life);
      ctx.save(); ctx.globalAlpha = alpha;
      if (eff.type === 'RIKA') {
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = 4; ctx.shadowBlur = 30; ctx.shadowColor = COLORS.danger;
        ctx.beginPath(); ctx.moveTo(eff.x - 100, eff.y); ctx.lineTo(eff.x + 100 * eff.facing, eff.y); ctx.stroke();
      } else if (eff.type === 'GORO') {
        const grad = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, eff.radius);
        grad.addColorStop(0, COLORS.white); grad.addColorStop(0.4, COLORS.warning); grad.addColorStop(1, 'rgba(255, 45, 111, 0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2); ctx.fill();
      } else if (eff.type === 'REN') {
        ctx.strokeStyle = COLORS.warning; ctx.lineWidth = 6; ctx.shadowBlur = 20; ctx.shadowColor = COLORS.warning;
        ctx.beginPath(); ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2); ctx.stroke();
      } else if (eff.type === 'YUI') {
        ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 3; ctx.shadowBlur = 25; ctx.shadowColor = COLORS.warning;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(eff.x, eff.y, eff.radius * (0.2 + i * 0.2), 0, Math.PI * 2); ctx.stroke(); }
      }
      ctx.restore();
    });
  }

  // === EFECTOS DE ATAQUE NORMAL ===
  const attackEffects = [];
  function spawnAttackEffect(heroType, x, y, facing) {
    const effect = { type: heroType, x, y, facing, life: 1.0, maxLife: 1.0, particles: [] };
    if (heroType === 'RIKA') {
      effect.duration = 0.4;
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        effect.particles.push({ x, y, vx: Math.cos(angle) * (Math.random() * 6 + 2), vy: Math.sin(angle) * (Math.random() * 6 + 2), life: 1.0, color: Math.random() > 0.5 ? COLORS.danger : COLORS.warning, size: Math.random() * 3 + 1 });
      }
    } else if (heroType === 'GORO') {
      effect.duration = 0.6; effect.shockwaveRadius = 0; effect.maxShockwaveRadius = 120;
      for (let i = 0; i < 40; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        effect.particles.push({ x, y, vx: Math.cos(angle) * (Math.random() * 8 + 3), vy: Math.sin(angle) * (Math.random() * 8 + 3), life: 1.0, color: Math.random() > 0.3 ? COLORS.warning : COLORS.danger, size: Math.random() * 5 + 2 });
      }
    } else if (heroType === 'REN') {
      effect.duration = 0.5; effect.arc1Angle = 0; effect.arc2Angle = Math.PI * 0.3; effect.arcRadius = 70;
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        effect.particles.push({ x, y, vx: Math.cos(angle) * (Math.random() * 5 + 2), vy: Math.sin(angle) * (Math.random() * 5 + 2), life: 1.0, color: COLORS.warning, size: Math.random() * 2 + 1 });
      }
    } else if (heroType === 'YUI') {
      effect.duration = 0.35; effect.trailLength = 0; effect.maxTrailLength = 200; effect.trailX = x; effect.trailY = y;
      for (let i = 0; i < 20; i++) {
        effect.particles.push({ x: x + i * 10 * facing, y: y + (Math.random() - 0.5) * 20, vx: 0, vy: 0, life: 1.0 - i * 0.05, color: COLORS.danger, size: Math.random() * 3 + 2 });
      }
    }
    attackEffects.push(effect);
  }
  function updateAttackEffects(dt) {
    for (let i = attackEffects.length - 1; i >= 0; i--) {
      const effect = attackEffects[i];
      effect.life -= dt / effect.duration;
      if (effect.type === 'GORO') effect.shockwaveRadius = effect.maxShockwaveRadius * (1 - effect.life);
      else if (effect.type === 'REN') { effect.arc1Angle += dt * 8; effect.arc2Angle += dt * 8; }
      else if (effect.type === 'YUI') effect.trailLength = effect.maxTrailLength * (1 - effect.life);
      for (let j = effect.particles.length - 1; j >= 0; j--) {
        const p = effect.particles[j];
        p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.life -= dt * 3;
        if (p.life <= 0) effect.particles.splice(j, 1);
      }
      if (effect.life <= 0) attackEffects.splice(i, 1);
    }
  }
  function drawAttackEffects(ctx) {
    attackEffects.forEach(effect => {
      const alpha = Math.max(0, effect.life);
      ctx.save(); ctx.globalAlpha = alpha;
      if (effect.type === 'RIKA') {
        ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.shadowBlur = 15; ctx.shadowColor = COLORS.danger;
        ctx.beginPath(); ctx.arc(effect.x, effect.y, 60, -Math.PI / 3, Math.PI / 3); ctx.stroke();
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = 2; ctx.stroke();
      } else if (effect.type === 'GORO') {
        const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.shockwaveRadius);
        gradient.addColorStop(0, COLORS.white); gradient.addColorStop(0.3, COLORS.warning); gradient.addColorStop(0.7, COLORS.danger); gradient.addColorStop(1, 'rgba(255, 45, 111, 0)');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.shockwaveRadius, 0, Math.PI * 2); ctx.fill();
      } else if (effect.type === 'REN') {
        ctx.strokeStyle = COLORS.warning; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.shadowBlur = 12; ctx.shadowColor = COLORS.warning;
        ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.arcRadius, effect.arc1Angle, effect.arc1Angle + Math.PI * 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.arcRadius * 0.8, effect.arc2Angle, effect.arc2Angle + Math.PI * 0.6); ctx.stroke();
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (effect.type === 'YUI') {
        ctx.strokeStyle = COLORS.danger; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.shadowBlur = 12; ctx.shadowColor = COLORS.danger;
        ctx.beginPath(); ctx.moveTo(effect.trailX, effect.trailY); ctx.lineTo(effect.trailX + effect.trailLength * effect.facing, effect.trailY); ctx.stroke();
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = 1.5; ctx.stroke();
      }
      effect.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    });
  }

  // === PARTÍCULAS DE IMPACTO (120 RAYOS) ===
  const particles = [];
  function spawnImpactRays(x, y, intensity = 1) {
    for (let i = 0; i < 120; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 4);
      const speed = (Math.random() * 8 + 4) * intensity;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 16, maxLife: 16, color: COLORS.danger, type: 'ray' });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles(ctx) {
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // === EFECTOS GLOBALES ===
  let flashAlpha = 0;
  function triggerImpact(x, y, comboCount) {
    spawnImpactRays(x, y, 1 + comboCount / 70);
    hitstopTimer = 14 / FPS;
    shakeX = (Math.random() - 0.5) * Math.min(15, 5 + comboCount * 0.2);
    shakeY = (Math.random() - 0.5) * Math.min(15, 5 + comboCount * 0.2);
    flashAlpha = 0.65;
    if (comboCount >= 10) { timeScale = 0.55; setTimeout(() => { timeScale = 1.0; }, 80); }
    if (comboCount >= 20) { timeScale = 0.40; setTimeout(() => { timeScale = 1.0; }, 120); }
    if (comboCount >= 40) { timeScale = 0.25; setTimeout(() => { timeScale = 1.0; }, 180); }
    if (comboCount >= 70) { timeScale = 0.15; setTimeout(() => { timeScale = 1.0; }, 250); }
  }
  function updateEffects(dt) {
    if (flashAlpha > 0) { flashAlpha -= dt * 3.25; if (flashAlpha < 0) flashAlpha = 0; }
    shakeX *= 0.9; shakeY *= 0.9;
    if (Math.abs(shakeX) < 0.5) shakeX = 0;
    if (Math.abs(shakeY) < 0.5) shakeY = 0;
    if (combo > 0) { comboDecayTimer -= dt; if (comboDecayTimer <= 0) combo = 0; }
  }
  function drawEffects(ctx) {
    if (flashAlpha > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  // === FONDO MEJORADO (PRIMER NIVEL: VESTÍBULO) ===
  function drawVectorBackground(ctx, scrollX, time) {
    // Cielo degradado de 4 tonos
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, COLORS.skyTop);
    grad.addColorStop(0.33, COLORS.skyMid);
    grad.addColorStop(0.66, COLORS.skyBot);
    grad.addColorStop(1, COLORS.skyHor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Sol con glow intenso
    ctx.save();
    ctx.shadowBlur = 80;
    ctx.shadowColor = COLORS.skyHor;
    ctx.fillStyle = COLORS.warning;
    ctx.beginPath();
    ctx.arc(VIEW_W / 2, GROUND_Y - 60, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Capa lejana de edificios (parallax lento)
    ctx.fillStyle = '#0a0a0a';
    const offset1 = (scrollX * 0.10) % 200;
    for (let i = -1; i < 7; i++) {
      const x = i * 200 - offset1;
      // Edificio principal
      ctx.fillRect(x, GROUND_Y - 140, 160, 140);
      // Torre
      ctx.fillRect(x + 60, GROUND_Y - 180, 40, 40);
      // Ventanas iluminadas
      ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      for (let wy = 0; wy < 5; wy++) {
        for (let wx = 0; wx < 4; wx++) {
          if (Math.random() > 0.3) {
            ctx.fillRect(x + 20 + wx * 30, GROUND_Y - 120 + wy * 25, 15, 18);
          }
        }
      }
      ctx.fillStyle = '#0a0a0a';
    }

    // Capa media de edificios
    const offset2 = (scrollX * 0.26) % 300;
    for (let i = -1; i < 5; i++) {
      const x = i * 300 - offset2;
      ctx.fillRect(x, GROUND_Y - 200, 140, 200);
      ctx.fillRect(x + 160, GROUND_Y - 160, 120, 160);
      // Neones
      ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.fillRect(x + 20, GROUND_Y - 180, 30, 5);
      ctx.fillStyle = 'rgba(255, 45, 111, 0.4)';
      ctx.fillRect(x + 180, GROUND_Y - 140, 40, 5);
      ctx.fillStyle = '#0a0a0a';
    }

    // Capa cercana de edificios
    const offset3 = (scrollX * 0.48) % 400;
    for (let i = -1; i < 4; i++) {
      const x = i * 400 - offset3;
      ctx.fillRect(x, GROUND_Y - 260, 180, 260);
      ctx.fillRect(x + 220, GROUND_Y - 200, 160, 200);
      // Detalles arquitectónicos
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 40, GROUND_Y - 240, 100, 20);
      ctx.fillRect(x + 260, GROUND_Y - 180, 80, 20);
      ctx.fillStyle = '#0a0a0a';
    }

    // Suelo
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

    // Lluvia ácida
    ctx.strokeStyle = 'rgba(242, 220, 192, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      let rx = (Math.sin(i * 132.1) * 0.5 + 0.5) * VIEW_W;
      let ry = ((time * 400 + i * 73) % VIEW_H);
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 12, ry + 25);
    }
    ctx.stroke();

    // Relámpago ocasional
    if (Math.random() < 0.008) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  // === UI / SELECCIÓN / HUD ===
  function drawUI(ctx) {
    if (gameState === 'select') {
      drawVectorBackground(ctx, 0, time);
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 36px Arial Black'; ctx.textAlign = 'center';
      ctx.fillText('NIPPON DESTRUCTION', VIEW_W / 2, 60);
      ctx.font = 'bold 22px Arial Black'; ctx.fillText('SELECT YOUR HERO', VIEW_W / 2, 90);
      const cardWidth = 140, cardHeight = 220, cardGap = 20;
      const totalWidth = cardWidth * 4 + cardGap * 3;
      const startX = (VIEW_W - totalWidth) / 2;
      const cardY = 120;
      ['RIKA', 'GORO', 'REN', 'YUI'].forEach((hero, index) => {
        const x = startX + index * (cardWidth + cardGap);
        const data = HERO_DATA[hero];
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)'; ctx.strokeStyle = data.color; ctx.lineWidth = 2;
        ctx.fillRect(x, cardY, cardWidth, cardHeight); ctx.strokeRect(x, cardY, cardWidth, cardHeight);
        const preview = { type: hero, x: x + cardWidth / 2, y: cardY + cardHeight - 15, facing: 1, state: 'idle', animTimer: time };
        drawHeroSilhouette(ctx, preview);
        ctx.fillStyle = data.color; ctx.font = 'bold 20px Arial Black'; ctx.fillText(data.kanji, x + cardWidth / 2, cardY + cardHeight + 22);
        ctx.font = 'bold 13px Arial Black'; ctx.fillText(data.name, x + cardWidth / 2, cardY + cardHeight + 38);
        ctx.font = '11px Arial Black'; ctx.fillText(data.title, x + cardWidth / 2, cardY + cardHeight + 52);
        ctx.fillStyle = '#999'; ctx.font = '10px Arial Black'; ctx.fillText(data.role, x + cardWidth / 2, cardY + cardHeight + 66);
      });
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 16px Arial Black';
      ctx.fillText('PRESS 1-4 OR TAP A CARD', VIEW_W / 2, VIEW_H - 20);
    } else {
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 18px Arial Black'; ctx.textAlign = 'left';
      ctx.fillText(`CARGAS: ${'■'.repeat(player.cargas)}${'□'.repeat(player.maxCargas - player.cargas)}`, 15, 30);
      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 14px Arial Black';
      ctx.fillText(`WAVE ${String(wave).padStart(2, '0')}/06`, VIEW_W - 15, 25);
      if (combo > 0) {
        ctx.fillStyle = COLORS.danger; ctx.font = 'bold 36px Arial Black';
        ctx.fillText(`${combo}`, VIEW_W - 15, 65);
        ctx.font = 'bold 12px Arial Black'; ctx.fillStyle = COLORS.rim;
        ctx.fillText('HITS', VIEW_W - 15, 80);
      }
    }
  }

  function handleHeroSelect(x, y) {
    const cardWidth = 140, cardHeight = 220, cardGap = 20;
    const totalWidth = cardWidth * 4 + cardGap * 3;
    const startX = (VIEW_W - totalWidth) / 2;
    const cardY = 120;
    ['RIKA', 'GORO', 'REN', 'YUI'].forEach((hero, index) => {
      const cardX = startX + index * (cardWidth + cardGap);
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        player.type = hero; player.x = 200; player.y = GROUND_Y; player.facing = 1;
        player.state = 'idle'; player.animTimer = 0; player.cargas = 3; player.cargaTimer = 0;
        player.isRupturing = false; player.rupturaTimer = 0;
        gameState = 'play';
        updateMenuButton();
      }
    });
  }

  // === CONTROLES ===
  const touchState = { retro: false, avan: false, tajo: false, dash: false, ruptura: false, def: false };
  function bindButton(id, stateKey) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); touchState[stateKey] = true; });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); touchState[stateKey] = false; });
    btn.addEventListener('pointercancel', () => { touchState[stateKey] = false; });
  }
  bindButton('btn-tajo', 'tajo');
  bindButton('btn-dash', 'dash'); bindButton('btn-rupt', 'ruptura'); bindButton('btn-def', 'def');

  btnMenu.addEventListener('pointerdown', (e) => { e.preventDefault(); goToSelect(); });

  canvas.addEventListener('click', (e) => {
    if (gameState === 'select') {
      const rect = canvas.getBoundingClientRect();
      handleHeroSelect((e.clientX - rect.left) * (VIEW_W / rect.width), (e.clientY - rect.top) * (VIEW_H / rect.height));
    }
  });

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameState === 'select') {
      if (e.code === 'Digit1') { player.type = 'RIKA'; player.x = 200; gameState = 'play'; updateMenuButton(); }
      if (e.code === 'Digit2') { player.type = 'GORO'; player.x = 200; gameState = 'play'; updateMenuButton(); }
      if (e.code === 'Digit3') { player.type = 'REN'; player.x = 200; gameState = 'play'; updateMenuButton(); }
      if (e.code === 'Digit4') { player.type = 'YUI'; player.x = 200; gameState = 'play'; updateMenuButton(); }
    }
    if (gameState === 'play' && e.code === 'Escape') { goToSelect(); }
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // === BUCLE PRINCIPAL ===
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    time += dt;

    if (hitstopTimer > 0) {
      hitstopTimer -= dt;
      if (hitstopTimer < 0) hitstopTimer = 0;
    }

    if (hitstopTimer <= 0) {
      if (gameState === 'play') {
        update(dt * timeScale);
        spawnTimer += dt;
        if (spawnTimer > 3.0 && enemies.length < 3) {
          spawnEnemy();
          spawnTimer = 0;
        }
      }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    if (gameState === 'select') {
      drawUI(ctx);
    } else {
      drawVectorBackground(ctx, scrollX, time);
      // Mundo del juego (960 de ancho) centrado en el viewport
      ctx.save();
      ctx.translate(viewOffsetX, 0);
      drawEnemies(ctx);
      drawHeroSilhouette(ctx, player);
      drawAttackEffects(ctx);
      drawRuptureEffects(ctx);
      drawParticles(ctx);
      ctx.restore();
      drawEffects(ctx);
      drawUI(ctx);
    }
    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateParticles(dt);
    updateAttackEffects(dt);
    updateRuptureEffects(dt);
    updateEffects(dt);
  }

  console.log('Nippon Destruction Engine - Gráficos mejorados');
  requestAnimationFrame(gameLoop);
})();
