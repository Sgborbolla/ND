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
      VIEW_H = CANVAS_H;
      VIEW_W = Math.round(CANVAS_H * aspectRatio);
    } else {
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
    RIKA: { name: '月見 里花', kanji: '月見 里花', title: 'LA HOJA', role: 'DPS', color: '#F2DCC0' },
    GORO: { name: '嵐 五郎', kanji: '嵐 五郎', title: 'EL YUNQUE', role: 'TANK', color: '#FFC400' },
    REN: { name: '林 蓮', kanji: '林 蓮', title: 'EL RELÁMPAGO', role: 'SPEED', color: '#FFC400' },
    YUI: { name: '中村 結衣', kanji: '中村 結衣', title: 'EL ECO', role: 'CHRONO', color: '#F2DCC0' }
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
    joystickActive = false; joystickVectorX = 0;
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

  // === ENEMIGOS ===
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
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-8 - legSwing * 0.5, 0); ctx.lineTo(-4 - legSwing * 0.5, 0); ctx.lineTo(-2, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(8 + legSwing * 0.5, 0); ctx.lineTo(4 + legSwing * 0.5, 0); ctx.lineTo(2, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-9 - legSwing * 0.5, -8, 6, 8);
    ctx.fillRect(3 + legSwing * 0.5, -8, 6, 8);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-12, -65); ctx.lineTo(12, -65); ctx.lineTo(10, -20); ctx.lineTo(-10, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-10, -60, 20, 35);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.strokeRect(-10, -60, 20, 35);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(0, -75, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -78); ctx.lineTo(-14, -85); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -78); ctx.lineTo(14, -85); ctx.stroke();
    ctx.fillStyle = COLORS.danger;
    ctx.shadowBlur = 8; ctx.shadowColor = COLORS.danger;
    ctx.fillRect(-6, -76, 12, 3);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.arc(-12, -62, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, -62, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-10, -60); ctx.lineTo(-15, -40); ctx.lineTo(-12, -30); ctx.lineTo(-8, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -60); ctx.lineTo(15, -40); ctx.lineTo(12, -30); ctx.lineTo(8, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, -30); ctx.lineTo(-12, -5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -30); ctx.lineTo(12, -5); ctx.stroke();
    ctx.strokeStyle = COLORS.rim; ctx.lineWidth = 1;
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

  // === RIKA: Kimono blanco, pelo largo en cola, katana larga ===
  function drawRika(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 12 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 8 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2); ctx.fill();

    // KIMONO BLANCO (cuerpo principal)
    ctx.fillStyle = '#e8e8e8';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -70 + breathe);
    ctx.lineTo(16, -70 + breathe);
    ctx.lineTo(14, -45);
    ctx.lineTo(18, -20);
    ctx.lineTo(22, 0);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-18, -20);
    ctx.lineTo(-14, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pliegues del kimono
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-8, -65 + breathe); ctx.lineTo(-10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -65 + breathe); ctx.lineTo(0, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -65 + breathe); ctx.lineTo(10, 0); ctx.stroke();

    // CINTURÓN OBI (ancho, atado)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-14, -28, 28, 6);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -28, 28, 6);
    // Nudo del obi
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(12, -28);
    ctx.lineTo(18, -26);
    ctx.lineTo(18, -22);
    ctx.lineTo(12, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // MANGAS LARGAS del kimono
    ctx.fillStyle = '#e8e8e8';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    // Manga trasera
    ctx.beginPath();
    ctx.moveTo(-14, -65 + breathe);
    ctx.lineTo(-20 - armSwing, -40);
    ctx.lineTo(-18 - armSwing, -20);
    ctx.lineTo(-12 - armSwing, -20);
    ctx.lineTo(-10, -40);
    ctx.lineTo(-8, -65 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Manga delantera
    ctx.beginPath();
    ctx.moveTo(14, -65 + breathe);
    ctx.lineTo(20 + armSwing, -40);
    ctx.lineTo(18 + armSwing, -20);
    ctx.lineTo(12 + armSwing, -20);
    ctx.lineTo(10, -40);
    ctx.lineTo(8, -65 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // MANOS (negras, saliendo de las mangas)
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.arc(-15 - armSwing, -18, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15 + armSwing, -18, 3, 0, Math.PI * 2); ctx.fill();

    // CUELLO
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-4, -78 + breathe, 8, 8);
    ctx.strokeRect(-4, -78 + breathe, 8, 8);

    // CABEZA (silueta negra con rostro)
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -85 + breathe, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // PELO LARGO EN COLA DE CABALLO (muy detallado)
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    // Parte superior del pelo
    ctx.beginPath();
    ctx.moveTo(-9, -88 + breathe);
    ctx.quadraticCurveTo(-12, -95 + breathe, -6, -95 + breathe);
    ctx.quadraticCurveTo(0, -96 + breathe, 6, -95 + breathe);
    ctx.quadraticCurveTo(12, -95 + breathe, 9, -88 + breathe);
    ctx.quadraticCurveTo(6, -82 + breathe, 0, -82 + breathe);
    ctx.quadraticCurveTo(-6, -82 + breathe, -9, -88 + breathe);
    ctx.fill();
    ctx.stroke();
    // Cola de caballo larga y ondulada
    ctx.beginPath();
    ctx.moveTo(2, -92 + breathe);
    ctx.quadraticCurveTo(15, -90 + breathe, 25, -80 + breathe);
    ctx.quadraticCurveTo(35, -70 + breathe, 40, -55 + breathe);
    ctx.quadraticCurveTo(42, -40 + breathe, 38, -25 + breathe);
    ctx.quadraticCurveTo(35, -15 + breathe, 30, -10 + breathe);
    ctx.quadraticCurveTo(25, -8 + breathe, 22, -12 + breathe);
    ctx.quadraticCurveTo(28, -20 + breathe, 30, -35 + breathe);
    ctx.quadraticCurveTo(32, -50 + breathe, 25, -65 + breathe);
    ctx.quadraticCurveTo(18, -78 + breathe, 5, -88 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mechones sueltos
    ctx.beginPath();
    ctx.moveTo(-8, -88 + breathe);
    ctx.quadraticCurveTo(-15, -80 + breathe, -20, -70 + breathe);
    ctx.quadraticCurveTo(-22, -60 + breathe, -18, -55 + breathe);
    ctx.quadraticCurveTo(-14, -60 + breathe, -12, -70 + breathe);
    ctx.quadraticCurveTo(-10, -80 + breathe, -6, -88 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // KATANA LARGA (sostenida en la mano delantera)
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.9 : 0.3;
    ctx.save();
    ctx.translate(15 + armSwing, -18);
    ctx.rotate(armAngle);

    // Hoja de la katana (larga y curva)
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2, 40, 0, 80);
    ctx.stroke();
    // Brillo del filo
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1, 2);
    ctx.quadraticCurveTo(3, 40, 1, 78);
    ctx.stroke();
    // Tsuba (guarda)
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-5, -3, 10, 4);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-5, -3, 10, 4);
    // Tsuka (mango)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3, -15, 6, 12);
    ctx.strokeStyle = COLORS.rim;
    ctx.strokeRect(-3, -15, 6, 12);
    // Cordones del mango
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-3, -14 + i * 3);
      ctx.lineTo(3, -12 + i * 3);
      ctx.stroke();
    }

    ctx.restore();

    // Efecto de tajo
    if (isAttacking && attackProgress < 1) {
      const prog = p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress;
      ctx.strokeStyle = p.isRupturing ? COLORS.white : COLORS.danger;
      ctx.lineWidth = p.isRupturing ? 6 : 3;
      ctx.globalAlpha = 1 - prog;
      ctx.shadowBlur = p.isRupturing ? 25 : 15;
      ctx.shadowColor = p.isRupturing ? COLORS.warning : COLORS.danger;
      ctx.beginPath();
      ctx.arc(0, -40, p.isRupturing ? 100 : 60, -Math.PI / 3, Math.PI / 3 + prog * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  // === GORO: Musculoso, maza sobre hombro, escudo redondo ===
  function drawGoro(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 10 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 6 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2); ctx.fill();

    // PIERNAS MUSCULOSAS
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-12, -25); ctx.lineTo(-16 - legSwing * 0.5, -10); ctx.lineTo(-14 - legSwing * 0.5, 0); ctx.lineTo(-6 - legSwing * 0.5, 0); ctx.lineTo(-6, -10); ctx.lineTo(-4, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -25); ctx.lineTo(16 + legSwing * 0.5, -10); ctx.lineTo(14 + legSwing * 0.5, 0); ctx.lineTo(6 + legSwing * 0.5, 0); ctx.lineTo(6, -10); ctx.lineTo(4, -25); ctx.closePath(); ctx.fill(); ctx.stroke();

    // TORSO MUSCULOSO (ancho)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-26, -70 + breathe);
    ctx.lineTo(26, -70 + breathe);
    ctx.lineTo(24, -50);
    ctx.lineTo(22, -25);
    ctx.lineTo(-22, -25);
    ctx.lineTo(-24, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pectorales marcados
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -65 + breathe); ctx.lineTo(0, -40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -55 + breathe); ctx.quadraticCurveTo(-8, -50 + breathe, -12, -45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -55 + breathe); ctx.quadraticCurveTo(8, -50 + breathe, 12, -45); ctx.stroke();

    // ABDOMEN (6-pack simplificado)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-8, -35 + i * 4); ctx.lineTo(8, -35 + i * 4); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -25); ctx.stroke();

    // BRAZO TRASERO (musculoso)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-24, -65 + breathe);
    ctx.lineTo(-30 - armSwing, -45);
    ctx.lineTo(-26 - armSwing, -25);
    ctx.lineTo(-18 - armSwing, -25);
    ctx.lineTo(-18, -45);
    ctx.lineTo(-18, -65 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // CABEZA (calva, robusta)
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.arc(0, -80 + breathe, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Mandíbula cuadrada
    ctx.fillRect(-8, -75 + breathe, 16, 5);

    // BRAZO DELANTERO (sosteniendo maza sobre el hombro)
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.7 : -0.4;
    ctx.save();
    ctx.translate(24, -65 + breathe);
    ctx.rotate(armAngle);

    // Bíceps y antebrazo
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(10, 25);
    ctx.lineTo(6, 28);
    ctx.lineTo(-6, 28);
    ctx.lineTo(-10, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // MAZA SOBRE EL HOMBRO (mango largo + cabeza grande)
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 55); ctx.stroke();
    // Cabeza de la maza (grande y cuadrada)
    ctx.fillStyle = '#2a2a2a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-14, 50, 28, 18);
    ctx.strokeRect(-14, 50, 28, 18);
    // Remaches
    ctx.fillStyle = '#666';
    ctx.beginPath(); ctx.arc(-10, 54, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 54, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-10, 64, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 64, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // ESCUDO REDONDO GRANDE (a la espalda/lado)
    ctx.fillStyle = '#2a2a2a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-26, -45, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Centro del escudo (umbo)
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath(); ctx.arc(-26, -45, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Remaches del escudo
    ctx.fillStyle = '#666';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = -26 + Math.cos(angle) * 16;
      const ry = -45 + Math.sin(angle) * 16;
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    }

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

  // === REN: Pelo puntiagudo, vendas, dos dagas, rayos eléctricos ===
  function drawRen(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 10) * 15 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 10) * 10 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 2, 14, 5, 0, 0, Math.PI * 2); ctx.fill();

    // PIERNAS CON VENDAS
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-9 - legSwing * 0.5, -10); ctx.lineTo(-7 - legSwing * 0.5, 0); ctx.lineTo(-3 - legSwing * 0.5, 0); ctx.lineTo(-3, -10); ctx.lineTo(-2, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(9 + legSwing * 0.5, -10); ctx.lineTo(7 + legSwing * 0.5, 0); ctx.lineTo(3 + legSwing * 0.5, 0); ctx.lineTo(3, -10); ctx.lineTo(2, -22); ctx.closePath(); ctx.fill(); ctx.stroke();

    // VENDAS en piernas
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(-7, -18 + i * 4); ctx.lineTo(-4, -17 + i * 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -18 + i * 4); ctx.lineTo(7, -17 + i * 4); ctx.stroke();
    }

    // TORSO (delgado, con chaqueta abierta)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -68 + breathe);
    ctx.lineTo(13, -68 + breathe);
    ctx.lineTo(12, -45);
    ctx.lineTo(10, -22);
    ctx.lineTo(-10, -22);
    ctx.lineTo(-12, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chaqueta abierta (líneas laterales)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, -65 + breathe); ctx.lineTo(-8, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -65 + breathe); ctx.lineTo(8, -22); ctx.stroke();

    // BRAZO TRASERO con vendas
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -63 + breathe);
    ctx.lineTo(-15 - armSwing, -42);
    ctx.lineTo(-13 - armSwing, -25);
    ctx.lineTo(-9 - armSwing, -25);
    ctx.lineTo(-9, -42);
    ctx.lineTo(-7, -63 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Vendas en brazo
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-12, -55 + breathe + i * 6); ctx.lineTo(-10, -54 + breathe + i * 6); ctx.stroke();
    }

    // CABEZA
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -78 + breathe, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // PELO PUNTIAGUDO (muy detallado, estilo anime)
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -80 + breathe);
    ctx.lineTo(-14, -92 + breathe);
    ctx.lineTo(-8, -86 + breathe);
    ctx.lineTo(-6, -96 + breathe);
    ctx.lineTo(-2, -88 + breathe);
    ctx.lineTo(0, -98 + breathe);
    ctx.lineTo(3, -88 + breathe);
    ctx.lineTo(6, -96 + breathe);
    ctx.lineTo(8, -86 + breathe);
    ctx.lineTo(14, -92 + breathe);
    ctx.lineTo(10, -80 + breathe);
    ctx.quadraticCurveTo(6, -75 + breathe, 0, -75 + breathe);
    ctx.quadraticCurveTo(-6, -75 + breathe, -10, -80 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // BRAZO DELANTERO con daga
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.9 : 0.4;
    ctx.save();
    ctx.translate(11, -63 + breathe);
    ctx.rotate(armAngle);

    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(5, 18);
    ctx.lineTo(3, 21);
    ctx.lineTo(-3, 21);
    ctx.lineTo(-5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vendas en antebrazo
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-4, 5 + i * 5); ctx.lineTo(4, 6 + i * 5); ctx.stroke();
    }

    // DAGA (corta y afilada)
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(0, 32); ctx.stroke();
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, 20); ctx.lineTo(1, 31); ctx.stroke();
    // Guarda de la daga
    ctx.fillStyle = '#444';
    ctx.fillRect(-3, 17, 6, 3);

    ctx.restore();

    // SEGUNDA DAGA (en la otra mano, visible en reposo)
    if (!isAttacking) {
      ctx.save();
      ctx.translate(-13 - armSwing, -23);
      ctx.rotate(-0.3);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
      ctx.strokeStyle = COLORS.warning;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(1, 11); ctx.stroke();
      ctx.restore();
    }

    // RAYOS ELÉCTRICOS alrededor del cuerpo (efecto permanente)
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.warning;
    ctx.globalAlpha = 0.6 + Math.sin(t * 10) * 0.3;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 2;
      const r1 = 20 + Math.sin(t * 5 + i) * 5;
      const r2 = 35 + Math.cos(t * 7 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, -40 + Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle + 0.2) * r2, -40 + Math.sin(angle + 0.2) * r2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Efecto de ataque (arcos dorados)
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

  // === YUI: Pelo corto, rifle de asalto detallado, pose táctica ===
  function drawYui(ctx, p) {
    const t = p.animTimer;
    const breathe = Math.sin(t * 2) * 0.5;
    const legSwing = p.state === 'run' ? Math.sin(t * 8) * 11 : 0;
    const armSwing = p.state === 'run' ? Math.sin(t * 8) * 7 : 0;
    const attackProgress = p.state === 'attack' ? Math.min(1, t / 0.18) : 0;
    const isAttacking = p.state === 'attack' || p.isRupturing;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 2, 14, 5, 0, 0, Math.PI * 2); ctx.fill();

    // PIERNAS (pantalón táctico)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-9 - legSwing * 0.5, -10); ctx.lineTo(-7 - legSwing * 0.5, 0); ctx.lineTo(-3 - legSwing * 0.5, 0); ctx.lineTo(-3, -10); ctx.lineTo(-2, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -24); ctx.lineTo(9 + legSwing * 0.5, -10); ctx.lineTo(7 + legSwing * 0.5, 0); ctx.lineTo(3 + legSwing * 0.5, 0); ctx.lineTo(3, -10); ctx.lineTo(2, -24); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Bolsillos tácticos
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-8 - legSwing * 0.5, -15, 5, 6);
    ctx.fillRect(3 + legSwing * 0.5, -15, 5, 6);

    // TORSO (ropa táctica ajustada)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -70 + breathe);
    ctx.lineTo(13, -70 + breathe);
    ctx.lineTo(12, -50);
    ctx.lineTo(11, -24);
    ctx.lineTo(-11, -24);
    ctx.lineTo(-12, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chaleco táctico
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-10, -65 + breathe, 20, 25);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -65 + breathe, 20, 25);
    // Bolsillos del chaleco
    ctx.fillRect(-8, -60 + breathe, 6, 8);
    ctx.fillRect(2, -60 + breathe, 6, 8);
    ctx.strokeRect(-8, -60 + breathe, 6, 8);
    ctx.strokeRect(2, -60 + breathe, 6, 8);

    // BRAZO TRASERO
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -65 + breathe);
    ctx.lineTo(-15 - armSwing, -45);
    ctx.lineTo(-13 - armSwing, -28);
    ctx.lineTo(-9 - armSwing, -28);
    ctx.lineTo(-9, -45);
    ctx.lineTo(-7, -65 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // CABEZA
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -78 + breathe, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // PELO CORTO (bob cut, estilo táctico)
    ctx.fillStyle = COLORS.ink;
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -80 + breathe);
    ctx.quadraticCurveTo(-12, -88 + breathe, -6, -90 + breathe);
    ctx.quadraticCurveTo(0, -91 + breathe, 6, -90 + breathe);
    ctx.quadraticCurveTo(12, -88 + breathe, 10, -80 + breathe);
    ctx.quadraticCurveTo(11, -74 + breathe, 8, -72 + breathe);
    ctx.lineTo(-8, -72 + breathe);
    ctx.quadraticCurveTo(-11, -74 + breathe, -10, -80 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Flequillo
    ctx.beginPath();
    ctx.moveTo(-8, -82 + breathe);
    ctx.lineTo(-4, -78 + breathe);
    ctx.lineTo(0, -80 + breathe);
    ctx.lineTo(4, -78 + breathe);
    ctx.lineTo(8, -82 + breathe);
    ctx.lineTo(6, -86 + breathe);
    ctx.lineTo(0, -87 + breathe);
    ctx.lineTo(-6, -86 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // BRAZO DELANTERO sosteniendo rifle
    const armAngle = isAttacking ? -Math.PI / 2 + Math.sin((p.isRupturing ? Math.min(1, p.rupturaTimer / 0.6) : attackProgress) * Math.PI) * Math.PI * 0.6 : 0.2;
    ctx.save();
    ctx.translate(11, -65 + breathe);
    ctx.rotate(armAngle);

    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.lineTo(6, 20);
    ctx.lineTo(4, 23);
    ctx.lineTo(-4, 23);
    ctx.lineTo(-6, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // RIFLE DE ASALTO DETALLADO
    // Culata
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-6, 18, 12, 8);
    ctx.strokeStyle = COLORS.rim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, 18, 12, 8);
    // Cuerpo del rifle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-4, 26, 8, 20);
    ctx.strokeRect(-4, 26, 8, 20);
    // Cargador
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3, 46, 6, 10);
    ctx.strokeRect(-3, 46, 6, 10);
    // Cañón
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-2, 26, 4, 35);
    ctx.strokeRect(-2, 26, 4, 35);
    // Mira telescópica
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3, 22, 6, 5);
    ctx.strokeRect(-3, 22, 6, 5);
    // Lente de la mira
    ctx.fillStyle = COLORS.rim;
    ctx.beginPath(); ctx.arc(0, 24, 2, 0, Math.PI * 2); ctx.fill();
    // Guardamano
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3, 30, 6, 12);
    ctx.strokeRect(-3, 30, 6, 12);
    // Bocacha apagallamas
    ctx.fillStyle = '#444';
    ctx.fillRect(-2, 58, 4, 4);

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

  // === FONDO ===
  function drawVectorBackground(ctx, scrollX, time) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, COLORS.skyTop); grad.addColorStop(0.33, COLORS.skyMid); grad.addColorStop(0.66, COLORS.skyBot); grad.addColorStop(1, COLORS.skyHor);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save(); ctx.shadowBlur = 80; ctx.shadowColor = COLORS.skyHor; ctx.fillStyle = COLORS.warning;
    ctx.beginPath(); ctx.arc(VIEW_W / 2, GROUND_Y - 60, 60, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0a0a0a';
    const offset1 = (scrollX * 0.10) % 200;
    for (let i = -1; i < 7; i++) {
      const x = i * 200 - offset1;
      ctx.fillRect(x, GROUND_Y - 140, 160, 140);
      ctx.fillRect(x + 60, GROUND_Y - 180, 40, 40);
      ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      for (let wy = 0; wy < 5; wy++) {
        for (let wx = 0; wx < 4; wx++) {
          if (Math.random() > 0.3) ctx.fillRect(x + 20 + wx * 30, GROUND_Y - 120 + wy * 25, 15, 18);
        }
      }
      ctx.fillStyle = '#0a0a0a';
    }
    const offset2 = (scrollX * 0.26) % 300;
    for (let i = -1; i < 5; i++) {
      const x = i * 300 - offset2;
      ctx.fillRect(x, GROUND_Y - 200, 140, 200);
      ctx.fillRect(x + 160, GROUND_Y - 160, 120, 160);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.fillRect(x + 20, GROUND_Y - 180, 30, 5);
      ctx.fillStyle = 'rgba(255, 45, 111, 0.4)';
      ctx.fillRect(x + 180, GROUND_Y - 140, 40, 5);
      ctx.fillStyle = '#0a0a0a';
    }
    const offset3 = (scrollX * 0.48) % 400;
    for (let i = -1; i < 4; i++) {
      const x = i * 400 - offset3;
      ctx.fillRect(x, GROUND_Y - 260, 180, 260);
      ctx.fillRect(x + 220, GROUND_Y - 200, 160, 200);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x + 40, GROUND_Y - 240, 100, 20);
      ctx.fillRect(x + 260, GROUND_Y - 180, 80, 20);
      ctx.fillStyle = '#0a0a0a';
    }
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.strokeStyle = 'rgba(242, 220, 192, 0.4)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      let rx = (Math.sin(i * 132.1) * 0.5 + 0.5) * VIEW_W;
      let ry = ((time * 400 + i * 73) % VIEW_H);
      ctx.moveTo(rx, ry); ctx.lineTo(rx - 12, ry + 25);
    }
    ctx.stroke();
    if (Math.random() < 0.008) { ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  // === UI / SELECCIÓN / HUD ===
  function drawUI(ctx) {
    if (gameState === 'select') {
      drawVectorBackground(ctx, 0, time);
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 36px Arial Black'; ctx.textAlign = 'center';
      ctx.fillText('NIPPON DESTRUCTION {ND}', VIEW_W / 2, 50);
      const cardWidth = 140, cardHeight = 240, cardGap = 20;
      const totalWidth = cardWidth * 4 + cardGap * 3;
      const startX = (VIEW_W - totalWidth) / 2;
      const cardY = 80;
      ['RIKA', 'GORO', 'REN', 'YUI'].forEach((hero, index) => {
        const x = startX + index * (cardWidth + cardGap);
        const data = HERO_DATA[hero];
        // Tarjeta de cristal
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.fillRect(x, cardY, cardWidth, cardHeight);
        ctx.strokeRect(x, cardY, cardWidth, cardHeight);
        // Preview del héroe
        const preview = { type: hero, x: x + cardWidth / 2, y: cardY + cardHeight - 30, facing: 1, state: 'idle', animTimer: time };
        drawHeroSilhouette(ctx, preview);
        // Texto
        ctx.fillStyle = data.color;
        ctx.font = 'bold 16px Arial Black';
        ctx.fillText(data.kanji, x + cardWidth / 2, cardY + cardHeight + 18);
        ctx.font = 'bold 12px Arial Black';
        ctx.fillText(data.name, x + cardWidth / 2, cardY + cardHeight + 32);
        ctx.font = '10px Arial Black';
        ctx.fillText(data.title, x + cardWidth / 2, cardY + cardHeight + 46);
        ctx.fillStyle = '#999';
        ctx.font = '9px Arial Black';
        ctx.fillText(data.role, x + cardWidth / 2, cardY + cardHeight + 60);
      });
      ctx.fillStyle = COLORS.rim; ctx.font = 'bold 14px Arial Black';
      ctx.fillText('PRESS 1-4 OR TAP A CARD', VIEW_W / 2, VIEW_H - 15);
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
    const cardWidth = 140, cardHeight = 240, cardGap = 20;
    const totalWidth = cardWidth * 4 + cardGap * 3;
    const startX = (VIEW_W - totalWidth) / 2;
    const cardY = 80;
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

  console.log('Nippon Destruction Engine - Héroes detallados estilo referencia');
  requestAnimationFrame(gameLoop);
})();
