/* ==========================================================================
   Zuzu's Decompression Zone - Main Game Logic
   ========================================================================== */

(function () {
  'use strict';

  // --- GAME CONSTANTS & CONFIG ---
  const TARGET_SMASHES = 30;
  const FRUIT_TYPES = [
    { name: 'watermelon', img: './assets/images/watermelon_slice.png', splatImg: './assets/images/watermelon_slice_splat.png', color: '#ff2d4b' },
    { name: 'strawberry', img: './assets/images/strawberry.png', splatImg: './assets/images/strawberry_splat.png', color: '#ff4d4d' },
    { name: 'melon', img: './assets/images/melon.png', splatImg: './assets/images/melon_splat.png', color: '#6bb043' },
    { name: 'orange', img: './assets/images/orange.png', splatImg: './assets/images/orange_splat.png', color: '#ff944d' },
    { name: 'lemon', img: './assets/images/lemon.png', splatImg: './assets/images/lemon_splat.png', color: '#ffe600' }
  ];

  // Cat cheer quotes
  const CAT_CHEER_QUOTES = {
    white: ["Marshmallow: Take that!", "Marshmallow: Nice!", "Marshmallow: Splatted!", "Marshmallow: Pop!"],
    orange: ["Mango: Crunchy!", "Mango: Get 'em!", "Mango: Boom!", "Mango: Way to go!"],
    black: ["Midnight: Kaboom!", "Midnight: Super!", "Midnight: Got 'em!", "Midnight: Decompress!"],
    calico: ["Patches: Purrfect!", "Patches: Zuzu rules!", "Patches: Boom!", "Patches: Awesome!"]
  };

  // 5 Dynamic Themes for Page Refresh
  const THEMES = [
    { id: 'theme-sunset', name: '🌅 Sunset Meadow', sparkleEmoji: '✨' },
    { id: 'theme-starlight', name: '🌌 Starlight Haven', sparkleEmoji: '⭐' },
    { id: 'theme-sakura', name: '🌸 Sakura Spring', sparkleEmoji: '🌸' },
    { id: 'theme-autumn', name: '🍂 Autumn Gold', sparkleEmoji: '🍁' },
    { id: 'theme-cozy', name: '☀️ Cozy Farm', sparkleEmoji: '🌻' }
  ];

  // --- STATE ---
  let smashedCount = 0;
  let startTime = 0;
  let hasStartedTimer = false;
  let gameTimerInterval = null;
  let isGameActive = false;
  let activeFruits = [];
  let animFrameId = null;
  let currentTheme = null;

  // --- DOM ELEMENTS ---
  const gameArea = document.getElementById('game-area');
  const particleContainer = document.getElementById('particle-container');
  const smashCountEl = document.getElementById('smash-count');
  const timerDisplayEl = document.getElementById('timer-display');
  const victoryOverlay = document.getElementById('victory-overlay');
  const playAgainBtn = document.getElementById('play-again-btn');
  const musicToggle = document.getElementById('music-player');
  const themeNameText = document.getElementById('theme-name-text');
  const themeParticles = document.getElementById('theme-particles');

  const scoreCurrentEl = document.getElementById('score-current');
  const scorePreviousEl = document.getElementById('score-previous');
  const scoreBestEl = document.getElementById('score-best');
  const newRecordBadge = document.getElementById('new-record-badge');

  const cats = {
    white: { el: document.getElementById('cat-white'), bubble: document.getElementById('bubble-white'), name: "Marshmallow" },
    orange: { el: document.getElementById('cat-orange'), bubble: document.getElementById('bubble-orange'), name: "Mango" },
    black: { el: document.getElementById('cat-black'), bubble: document.getElementById('bubble-black'), name: "Midnight" },
    calico: { el: document.getElementById('cat-calico'), bubble: document.getElementById('bubble-calico'), name: "Patches" }
  };

  // --- APPLY DYNAMIC THEME ON REFRESH ---
  function initDynamicTheme() {
    const lastThemeIdx = parseInt(sessionStorage.getItem('zuzu_theme_idx') || '-1', 10);
    let nextThemeIdx = (lastThemeIdx + 1) % THEMES.length;
    if (lastThemeIdx === -1) {
      nextThemeIdx = Math.floor(Math.random() * THEMES.length);
    }
    sessionStorage.setItem('zuzu_theme_idx', nextThemeIdx);

    currentTheme = THEMES[nextThemeIdx];
    document.body.className = currentTheme.id;
    if (themeNameText) {
      themeNameText.textContent = currentTheme.name;
    }

    spawnThemeBackgroundParticles(currentTheme.sparkleEmoji);
  }

  function spawnThemeBackgroundParticles(emoji) {
    if (!themeParticles) return;
    themeParticles.innerHTML = '';
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'theme-sparkle';
      p.textContent = emoji;
      p.style.fontSize = `${14 + Math.random() * 14}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${-20 - Math.random() * 50}px`;
      p.style.animationDuration = `${8 + Math.random() * 12}s`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      themeParticles.appendChild(p);
    }
  }

  // --- WEB AUDIO API (Zero Latency Splat & Music Synth) ---
  let audioCtx = null;
  let isMusicPlaying = false;
  let musicTimer = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSplatSound() {
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    filter.Q.setValueAtTime(3.5, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start(now);

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380 + Math.random() * 220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  function startCozyMusic() {
    if (isMusicPlaying) return;
    initAudio();
    isMusicPlaying = true;
    musicToggle.classList.add('playing');

    const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25];
    musicTimer = setInterval(() => {
      if (!isMusicPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const freq = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    }, 400);
  }

  function stopCozyMusic() {
    isMusicPlaying = false;
    musicToggle.classList.remove('playing');
    if (musicTimer) clearInterval(musicTimer);
  }

  // --- DIRECT GAME INITIALIZATION ---
  function startGame() {
    smashedCount = 0;
    hasStartedTimer = false;
    smashCountEl.textContent = '0';
    timerDisplayEl.textContent = '00.000';
    isGameActive = true;

    clearAllFruits();
    victoryOverlay.classList.add('hidden');

    if (gameTimerInterval) clearInterval(gameTimerInterval);

    // Initial fruit batch spawn immediately so user can smash right away
    for (let i = 0; i < 5; i++) {
      spawnFruit();
    }

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(updateFruitPositions);
  }

  function updateTimer() {
    if (!isGameActive || !hasStartedTimer) return;
    const elapsedMs = performance.now() - startTime;
    const seconds = Math.floor(elapsedMs / 1000);
    const ms = Math.floor(elapsedMs % 1000);
    const secStr = String(seconds).padStart(2, '0');
    const msStr = String(ms).padStart(3, '0');
    timerDisplayEl.textContent = `${secStr}.${msStr}`;
  }

  // --- FRUIT SPAWNING & FLOATING PHYSICS ---
  function spawnFruit() {
    if (!isGameActive && smashedCount >= TARGET_SMASHES) return;

    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const el = document.createElement('div');
    el.className = 'fruit-target';

    const img = document.createElement('img');
    img.src = type.img;
    img.className = 'fruit-img';
    img.alt = type.name;
    el.appendChild(img);

    const bounds = gameArea.getBoundingClientRect();
    const margin = 60;
    const x = margin + Math.random() * (bounds.width - margin * 2);
    const y = 150 + Math.random() * (bounds.height - 250);

    const vx = (Math.random() - 0.5) * 3.6;
    const vy = (Math.random() - 0.5) * 3.6;

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    gameArea.appendChild(el);

    const fruitObj = {
      el: el,
      x: x,
      y: y,
      vx: vx === 0 ? 1.2 : vx,
      vy: vy === 0 ? 1.2 : vy,
      type: type,
      isSmashed: false
    };

    const handleSmash = (e) => {
      e.preventDefault();
      e.stopPropagation();
      smashFruit(fruitObj, e);
    };

    el.addEventListener('pointerdown', handleSmash);
    activeFruits.push(fruitObj);
  }

  function updateFruitPositions() {
    if (!isGameActive) return;

    const bounds = gameArea.getBoundingClientRect();
    const minX = 50;
    const maxX = bounds.width - 50;
    const minY = 145;
    const maxY = bounds.height - 75;

    activeFruits.forEach(fruit => {
      if (fruit.isSmashed) return;

      fruit.x += fruit.vx;
      fruit.y += fruit.vy;

      if (fruit.x <= minX || fruit.x >= maxX) {
        fruit.vx *= -1;
        fruit.x = Math.max(minX, Math.min(maxX, fruit.x));
      }
      if (fruit.y <= minY || fruit.y >= maxY) {
        fruit.vy *= -1;
        fruit.y = Math.max(minY, Math.min(maxY, fruit.y));
      }

      fruit.el.style.transform = `translate3d(${fruit.x}px, ${fruit.y}px, 0)`;
    });

    animFrameId = requestAnimationFrame(updateFruitPositions);
  }

  function clearAllFruits() {
    activeFruits.forEach(f => {
      if (f.el && f.el.parentNode) {
        f.el.parentNode.removeChild(f.el);
      }
    });
    activeFruits = [];
  }

  // --- THE SMASH ACTION ---
  function smashFruit(fruit, event) {
    if (!isGameActive || fruit.isSmashed) return;

    // Start timer & audio on first smash
    if (!hasStartedTimer) {
      initAudio();
      startCozyMusic();
      hasStartedTimer = true;
      startTime = performance.now();
      gameTimerInterval = setInterval(updateTimer, 16);
    }

    fruit.isSmashed = true;
    playSplatSound();

    smashedCount++;
    smashCountEl.textContent = smashedCount;

    const rect = fruit.el.getBoundingClientRect();
    const clickX = event.clientX || (rect.left + rect.width / 2);
    const clickY = event.clientY || (rect.top + rect.height / 2);

    fruit.el.style.display = 'none';
    spawnSplatEffect(clickX, clickY, fruit.type);
    spawnJuiceParticles(clickX, clickY, fruit.type.color);
    spawnFloatingText(clickX, clickY, "+1");

    triggerCatCheer();

    const idx = activeFruits.indexOf(fruit);
    if (idx !== -1) activeFruits.splice(idx, 1);

    if (smashedCount >= TARGET_SMASHES) {
      endGame();
    } else {
      if (activeFruits.length < 5) {
        spawnFruit();
      }
    }
  }

  // --- VISUAL EFFECTS ---
  function spawnSplatEffect(x, y, fruitType) {
    const splat = document.createElement('img');
    splat.src = fruitType.splatImg;
    splat.className = 'splat-effect';
    splat.style.left = `${x}px`;
    splat.style.top = `${y}px`;

    gameArea.appendChild(splat);
    setTimeout(() => {
      if (splat.parentNode) splat.parentNode.removeChild(splat);
    }, 600);
  }

  function spawnJuiceParticles(x, y, color) {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.backgroundColor = color;
      
      const size = 6 + Math.random() * 9;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = 45 + Math.random() * 65;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);

      particleContainer.appendChild(p);
      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 500);
    }
  }

  function spawnFloatingText(x, y, text) {
    const txt = document.createElement('div');
    txt.className = 'floating-score';
    txt.textContent = text;
    txt.style.left = `${x - 15}px`;
    txt.style.top = `${y - 20}px`;

    gameArea.appendChild(txt);
    setTimeout(() => {
      if (txt.parentNode) txt.parentNode.removeChild(txt);
    }, 600);
  }

  // --- CAT CHEER SQUAD ANIMATION ---
  function triggerCatCheer() {
    const catKeys = Object.keys(cats);
    const randomKey = catKeys[Math.floor(Math.random() * catKeys.length)];
    const cat = cats[randomKey];

    if (cat && cat.el) {
      cat.el.classList.remove('cheer');
      void cat.el.offsetWidth;
      cat.el.classList.add('cheer');

      const quotes = CAT_CHEER_QUOTES[randomKey];
      const msg = quotes[Math.floor(Math.random() * quotes.length)];
      cat.bubble.textContent = msg;
      cat.bubble.classList.add('pop');

      setTimeout(() => {
        cat.bubble.classList.remove('pop');
      }, 1000);
    }
  }

  // --- VICTORY & SCOREBOARD (localStorage) ---
  function endGame() {
    isGameActive = false;
    clearInterval(gameTimerInterval);
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const elapsedMs = performance.now() - startTime;
    const finalSeconds = (elapsedMs / 1000).toFixed(3);
    const finalFormatted = `${finalSeconds}s`;

    const prevTime = localStorage.getItem('zuzu_prev_time') || null;
    const bestTime = localStorage.getItem('zuzu_best_time') || null;

    let isNewRecord = false;
    if (!bestTime || elapsedMs < parseFloat(bestTime)) {
      localStorage.setItem('zuzu_best_time', elapsedMs);
      isNewRecord = true;
    }
    localStorage.setItem('zuzu_prev_time', elapsedMs);

    scoreCurrentEl.textContent = finalFormatted;
    scorePreviousEl.textContent = prevTime ? `${(parseFloat(prevTime) / 1000).toFixed(3)}s` : '—';
    scoreBestEl.textContent = isNewRecord ? finalFormatted : `${(parseFloat(bestTime) / 1000).toFixed(3)}s`;

    if (isNewRecord) {
      newRecordBadge.classList.remove('hidden');
    } else {
      newRecordBadge.classList.add('hidden');
    }

    setTimeout(() => {
      victoryOverlay.classList.remove('hidden');
    }, 300);
  }

  // --- EVENT LISTENERS ---
  playAgainBtn.addEventListener('click', startGame);

  musicToggle.addEventListener('click', () => {
    if (isMusicPlaying) {
      stopCozyMusic();
    } else {
      startCozyMusic();
    }
  });

  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // Initialize theme & start game immediately on load
  initDynamicTheme();
  startGame();

})();
