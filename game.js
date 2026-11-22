/* ==========================================================================
   EINMALEINS ARCADE - GAME ENGINE
   Vollständige Spiellogik, Timer, Multiple-Choice, Numpad, Bestenliste & Partikel
   ========================================================================== */

(function () {
  'use strict';

  // ==================== STANDARD-EINSTELLUNGEN ====================
  const DEFAULT_SETTINGS = {
    startTime: 8.0,          // Startzeit in Sekunden (Normal)
    minTime: 2.5,            // Minimales Zeitlimit (Cut-Off in Normal)
    stepInterval: 5,         // Alle wie viele Aufgaben wird es schneller
    stepReduction: 0.5,      // Zeitkürzung pro Stufe
    sfxVolume: 1.0,          // Soundeffekte Lautstärke
    musicVolume: 0.35        // Hintergrundmusik Lautstärke
  };

  // ==================== STANDARDFÜLLUNG BESTENLISTE: SAMMY & FLOCKE ====================
  const DEFAULT_HIGHSCORES = {
    easy: [
      { name: 'Flocke 🐱', score: 28, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 20, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 14, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 9, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 5, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 3, date: '14.11.2026' }
    ],
    normal: [
      { name: 'Sammy 🐱', score: 22, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 16, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 11, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 7, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 4, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 2, date: '14.11.2026' }
    ],
    hardcore: [
      { name: 'Flocke 🐱', score: 15, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 10, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 6, date: '14.11.2026' },
      { name: 'Sammy 🐱', score: 3, date: '14.11.2026' },
      { name: 'Flocke 🐱', score: 2, date: '14.11.2026' }
    ]
  };

  // ==================== COOLE RANG-NAMEN & LEVEL ====================
  const LEVEL_RANKS = [
    { level: 1, name: 'Rechen-Rookie', icon: '🟢', color: '#10b981' },
    { level: 2, name: 'Blitz-Rechner', icon: '⚡', color: '#00e5ff' },
    { level: 3, name: 'Zahlen-Ninja', icon: '🥋', color: '#9d4edd' },
    { level: 4, name: 'Turbo-Brain', icon: '🚀', color: '#ffb703' },
    { level: 5, name: 'Arcade-Champion', icon: '👑', color: '#f72585' },
    { level: 6, name: 'Mathe-Titan', icon: '🔥', color: '#ef4444' }
  ];

  function getRankForLevel(lvl) {
    if (lvl >= 6) {
      return { 
        level: lvl, 
        name: lvl === 6 ? 'Mathe-Titan' : `Titan (Gottmodus +${lvl - 6})`, 
        icon: '🔥', 
        color: '#ef4444' 
      };
    }
    return LEVEL_RANKS[lvl - 1] || LEVEL_RANKS[0];
  }

  // ==================== ZUSTAND (STATE) ====================
  const state = {
    screen: 'menu',           // 'menu', 'learnSetup', 'game', 'gameover'
    mode: 'normal',           // 'learn', 'easy', 'normal', 'hardcore'
    learnSelectedTables: [2, 3, 4, 5, 10], // Standardmäßig ausgewählte Reihen
    learnHasTimer: false,     // Timer im Lernmodus aktiv?
    
    // Spielrunde
    streak: 0,
    currentProblem: null,
    currentInput: '',
    
    // Timer
    timerRunning: false,
    allocatedTime: 8.0,
    remainingTime: 8.0,
    timerLastTimestamp: 0,
    lastTickSecond: 999,

    // Konfiguration & Bestenliste
    settings: { ...DEFAULT_SETTINGS },
    highscores: {
      easy: [],
      normal: [],
      hardcore: []
    }
  };

  // ==================== DOM-ELEMENTE ====================
  const dom = {
    // Screens
    screenMenu: document.getElementById('screenMenu'),
    screenLearnSetup: document.getElementById('screenLearnSetup'),
    screenGame: document.getElementById('screenGame'),
    screenGameOver: document.getElementById('screenGameOver'),
    
    // Modals
    modalHighscores: document.getElementById('modalHighscores'),
    modalSettings: document.getElementById('modalSettings'),
    
    // Nav & Badges
    btnHome: document.getElementById('btnHome'),
    btnQr: document.getElementById('btnQr'),
    btnSound: document.getElementById('btnSound'),
    soundIcon: document.getElementById('soundIcon'),
    btnHighscores: document.getElementById('btnHighscores'),
    btnSettings: document.getElementById('btnSettings'),
    modeBadge: document.getElementById('modeBadge'),
    
    // Menu Buttons
    btnModeLearn: document.getElementById('btnModeLearn'),
    btnModeEasy: document.getElementById('btnModeEasy'),
    btnModeNormal: document.getElementById('btnModeNormal'),
    btnModeHardcore: document.getElementById('btnModeHardcore'),
    
    // Learn Setup
    tablesGrid: document.getElementById('tablesGrid'),
    btnSelectAll: document.getElementById('btnSelectAll'),
    btnSelectNone: document.getElementById('btnSelectNone'),
    chkLearnTimer: document.getElementById('chkLearnTimer'),
    btnStartLearn: document.getElementById('btnStartLearn'),
    
    // Game HUD & Elements
    levelStatusBar: document.getElementById('levelStatusBar'),
    levelNrDisplay: document.getElementById('levelNrDisplay'),
    levelNameDisplay: document.getElementById('levelNameDisplay'),
    levelDots: document.getElementById('levelDots'),
    levelHintText: document.getElementById('levelHintText'),
    levelUpOverlay: document.getElementById('levelUpOverlay'),
    levelUpRankText: document.getElementById('levelUpRankText'),
    levelUpSpeedText: document.getElementById('levelUpSpeedText'),
    hudStreak: document.getElementById('hudStreak'),
    hudBest: document.getElementById('hudBest'),
    hudTimeLeft: document.getElementById('hudTimeLeft'),
    timerContainer: document.getElementById('timerContainer'),
    timerBar: document.getElementById('timerBar'),
    questionCard: document.getElementById('questionCard'),
    numA: document.getElementById('numA'),
    numB: document.getElementById('numB'),
    answerPlaceholder: document.getElementById('answerPlaceholder'),
    feedbackMsg: document.getElementById('feedbackMsg'),
    
    // Eingabefelder
    choiceContainer: document.getElementById('choiceContainer'),
    numpadContainer: document.getElementById('numpadContainer'),
    padBackspace: document.getElementById('padBackspace'),
    padEnter: document.getElementById('padEnter'),
    
    // Game Over
    gameoverPraiseTitle: document.getElementById('gameoverPraiseTitle'),
    gameoverPraiseDesc: document.getElementById('gameoverPraiseDesc'),
    gameoverReason: document.getElementById('gameoverReason'),
    gameoverModeName: document.getElementById('gameoverModeName'),
    gameoverLeaderboardList: document.getElementById('gameoverLeaderboardList'),
    highscoreEntryArea: document.getElementById('highscoreEntryArea'),
    playerNameInput: document.getElementById('playerNameInput'),
    btnSaveHighscore: document.getElementById('btnSaveHighscore'),
    correctSolutionBox: document.getElementById('correctSolutionBox'),
    correctSolutionText: document.getElementById('correctSolutionText'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    btnGoMenu: document.getElementById('btnGoMenu'),

    // QR Modal
    modalQr: document.getElementById('modalQr'),
    btnCloseQr: document.getElementById('btnCloseQr'),
    btnOkQr: document.getElementById('btnOkQr'),
    qrCanvas: document.getElementById('qrCanvas'),
    qrUrlInput: document.getElementById('qrUrlInput'),
    btnCopyUrl: document.getElementById('btnCopyUrl'),
    
    // Highscore Modal
    leaderboardList: document.getElementById('leaderboardList'),
    btnCloseHighscores: document.getElementById('btnCloseHighscores'),
    btnClearHighscores: document.getElementById('btnClearHighscores'),
    
    // Settings Modal
    cfgStartTime: document.getElementById('cfgStartTime'),
    valStartTime: document.getElementById('valStartTime'),
    cfgMinTime: document.getElementById('cfgMinTime'),
    valMinTime: document.getElementById('valMinTime'),
    cfgStepInterval: document.getElementById('cfgStepInterval'),
    valStepInterval: document.getElementById('valStepInterval'),
    cfgStepReduction: document.getElementById('cfgStepReduction'),
    valStepReduction: document.getElementById('valStepReduction'),
    cfgSoundVolume: document.getElementById('cfgSoundVolume'),
    valSoundVolume: document.getElementById('valSoundVolume'),
    cfgMusicVolume: document.getElementById('cfgMusicVolume'),
    valMusicVolume: document.getElementById('valMusicVolume'),
    btnResetSettings: document.getElementById('btnResetSettings'),
    btnSaveSettings: document.getElementById('btnSaveSettings'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    
    // Particle Canvas
    canvas: document.getElementById('particleCanvas')
  };

  // ==================== SPEICHER-VERWALTUNG (LOCALSTORAGE) ====================
  function loadPersistedData() {
    try {
      const savedSettings = localStorage.getItem('1x1_settings');
      if (savedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
      const savedHighscores = localStorage.getItem('1x1_highscores');
      if (savedHighscores) {
        state.highscores = JSON.parse(savedHighscores);
      } else {
        state.highscores = JSON.parse(JSON.stringify(DEFAULT_HIGHSCORES));
      }
    } catch (e) {
      console.warn('LocalStorage nicht verfügbar oder fehlerhaft:', e);
      state.highscores = JSON.parse(JSON.stringify(DEFAULT_HIGHSCORES));
    }

    // Sicherstellen, dass Listen nicht leer sind (immer mindestens Sammy & Flocke)
    ['easy', 'normal', 'hardcore'].forEach(m => {
      if (!state.highscores[m] || state.highscores[m].length === 0) {
        state.highscores[m] = JSON.parse(JSON.stringify(DEFAULT_HIGHSCORES[m]));
      }
    });

    // Audio initialisieren
    window.audio.setVolumes(state.settings.sfxVolume, state.settings.musicVolume);
  }

  function saveSettings() {
    try {
      localStorage.setItem('1x1_settings', JSON.stringify(state.settings));
    } catch (e) {}
  }

  function saveHighscores() {
    try {
      localStorage.setItem('1x1_highscores', JSON.stringify(state.highscores));
    } catch (e) {}
  }

  // ==================== SCREEN WECHSEL ====================
  function showScreen(screenName) {
    state.screen = screenName;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    if (screenName === 'menu') {
      dom.screenMenu.classList.add('active');
      dom.modeBadge.textContent = '1×1 ARCADE';
      window.audio.stopMusic();
    } else if (screenName === 'learnSetup') {
      dom.screenLearnSetup.classList.add('active');
      dom.modeBadge.textContent = 'LERNMODUS';
      renderLearnTablesGrid();
    } else if (screenName === 'game') {
      dom.screenGame.classList.add('active');
      const badgeTexts = {
        learn: 'LERNEN',
        easy: 'ARCADE • LEICHT',
        normal: 'ARCADE • NORMAL',
        hardcore: 'ARCADE • HARDCORE 🔥'
      };
      dom.modeBadge.textContent = badgeTexts[state.mode] || 'SPIEL';
      window.audio.startMusic();
    } else if (screenName === 'gameover') {
      dom.screenGameOver.classList.add('active');
      window.audio.stopMusic();
    }
  }

  // ==================== LERNMODUS SETUP ====================
  function renderLearnTablesGrid() {
    dom.tablesGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.className = 'table-btn' + (state.learnSelectedTables.includes(i) ? ' selected' : '');
      btn.innerHTML = `${i}er <span class="sub">${i}×</span>`;
      btn.addEventListener('click', () => {
        window.audio.playClick();
        if (state.learnSelectedTables.includes(i)) {
          // Mindestens eine Reihe muss ausgewählt bleiben
          if (state.learnSelectedTables.length > 1) {
            state.learnSelectedTables = state.learnSelectedTables.filter(x => x !== i);
            btn.classList.remove('selected');
          }
        } else {
          state.learnSelectedTables.push(i);
          btn.classList.add('selected');
        }
      });
      dom.tablesGrid.appendChild(btn);
    }
  }

  // ==================== SPIEL-LOGIK & BERECHNUNGEN ====================
  function startGame(mode) {
    state.mode = mode;
    state.streak = 0;
    state.currentInput = '';
    stopTimer();

    // Layout je nach Modus anpassen
    if (mode === 'easy') {
      dom.choiceContainer.style.display = 'grid';
      dom.numpadContainer.style.display = 'none';
    } else {
      dom.choiceContainer.style.display = 'none';
      dom.numpadContainer.style.display = 'block';
    }

    // Timer Sichtbarkeit im Lernmodus
    if (mode === 'learn' && !state.learnHasTimer) {
      dom.timerContainer.style.visibility = 'hidden';
      dom.hudTimeLeft.textContent = '∞';
    } else {
      dom.timerContainer.style.visibility = 'visible';
    }

    updateHud();
    showScreen('game');
    nextProblem();
  }

  function getBestStreakForCurrentMode() {
    if (state.mode === 'learn') return 0;
    const list = state.highscores[state.mode] || [];
    return list.length > 0 ? list[0].score : 0;
  }

  function updateHud() {
    dom.hudStreak.textContent = state.streak;
    dom.hudBest.textContent = getBestStreakForCurrentMode();

    if (state.mode === 'learn') {
      dom.levelStatusBar.style.display = 'none';
      return;
    }

    dom.levelStatusBar.style.display = 'flex';
    const interval = state.settings.stepInterval || 5;
    const lvl = Math.floor(state.streak / interval) + 1;
    const rank = getRankForLevel(lvl);

    dom.levelNrDisplay.textContent = `LVL ${rank.level}`;
    dom.levelNameDisplay.textContent = `${rank.name} ${rank.icon}`;

    // Fortschrittspunkte zeichnen (z. B. 5 Punkte)
    dom.levelDots.innerHTML = '';
    const progressInLevel = state.streak % interval;
    for (let i = 0; i < interval; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i < progressInLevel ? ' filled' : '');
      dom.levelDots.appendChild(dot);
    }

    const tasksRemaining = interval - progressInLevel;
    dom.levelHintText.textContent = tasksRemaining === 1 
      ? 'Noch 1 Aufgabe bis Level Up!' 
      : `Noch ${tasksRemaining} bis Level ${lvl + 1}`;
  }

  // Zeitlimit für die aktuelle Aufgabe berechnen
  function calculateAllocatedTime() {
    if (state.mode === 'learn') {
      return state.learnHasTimer ? 12.0 : 999;
    }

    const cfg = state.settings;
    const base = state.mode === 'easy' ? cfg.startTime + 2.0 : cfg.startTime;
    const steps = Math.floor(state.streak / cfg.stepInterval);
    const reduction = steps * cfg.stepReduction;

    if (state.mode === 'hardcore') {
      // In Hardcore: Schnellerer Abfall, kein Mindestlimit bis unter 0.8s!
      return Math.max(0.65, base - (steps * (cfg.stepReduction * 1.35)));
    } else {
      // Normal / Leicht: Stoppt beim konfigurierten Cut-Off (minTime)
      return Math.max(cfg.minTime, base - reduction);
    }
  }

  // Nächste Aufgabe generieren
  function nextProblem() {
    let a, b;
    if (state.mode === 'learn') {
      // Reihe aus den gewählten auswählen
      const tables = state.learnSelectedTables;
      a = tables[Math.floor(Math.random() * tables.length)];
      b = Math.floor(Math.random() * 10) + 1; // 1 bis 10
    } else {
      // Arcade Mix (1 bis 10)
      a = Math.floor(Math.random() * 9) + 2; // 2 bis 10 bevorzugt
      b = Math.floor(Math.random() * 9) + 2;
      // Ab und zu auch 1x oder 10x
      if (Math.random() < 0.15) a = Math.random() < 0.5 ? 1 : 10;
    }

    const answer = a * b;

    // 4 Multiple Choice Antworten generieren (für Leicht-Modus)
    const choices = generateChoices(a, b, answer);

    state.currentProblem = { a, b, answer, choices };
    state.currentInput = '';

    // UI aktualisieren
    dom.numA.textContent = a;
    dom.numB.textContent = b;
    dom.answerPlaceholder.textContent = '?';
    dom.answerPlaceholder.classList.remove('has-val');
    dom.feedbackMsg.textContent = '';
    dom.questionCard.classList.remove('shake');

    if (state.mode === 'easy') {
      renderChoices(choices);
    }

    // Timer starten
    startTimer();
  }

  // Kluge Antwort-Distraktoren für 4er-Auswahl erzeugen
  function generateChoices(a, b, correct) {
    const set = new Set();
    set.add(correct);

    // Naheliegende 1x1-Verwechslungen
    const candidates = [
      (a + 1) * b,
      (a - 1) * b,
      a * (b + 1),
      a * (b - 1),
      correct + 10,
      correct - 10,
      correct + 2,
      correct - 2,
      (a + 1) * (b + 1)
    ].filter(val => val > 0 && val <= 100 && val !== correct);

    // Zufällig aus den Kandidaten ziehen
    candidates.sort(() => Math.random() - 0.5);
    for (const cand of candidates) {
      if (set.size < 4) set.add(cand);
    }

    // Falls noch nicht 4, zufällige nahe Zahlen auffüllen
    let offset = 1;
    while (set.size < 4) {
      const candidate = correct + (Math.random() < 0.5 ? offset : -offset);
      if (candidate > 0 && candidate <= 100) set.add(candidate);
      offset++;
    }

    // Mischen
    const result = Array.from(set);
    result.sort(() => Math.random() - 0.5);
    return result;
  }

  function renderChoices(choices) {
    const buttons = dom.choiceContainer.querySelectorAll('.choice-btn');
    buttons.forEach((btn, idx) => {
      btn.textContent = choices[idx];
      btn.dataset.val = choices[idx];
      btn.className = 'choice-btn';
    });
  }

  // ==================== TIMER-ENGINE (60 FPS REQUESTANIMATIONFRAME) ====================
  let timerRafId = null;

  function stopTimer() {
    state.timerRunning = false;
    if (timerRafId) {
      cancelAnimationFrame(timerRafId);
      timerRafId = null;
    }
  }

  function startTimer() {
    stopTimer(); // Vorherigen Timer-Frame stoppen
    state.allocatedTime = calculateAllocatedTime();
    state.remainingTime = state.allocatedTime;
    state.timerLastTimestamp = performance.now();
    state.timerRunning = true;
    state.lastTickSecond = Math.ceil(state.remainingTime);

    updateTimerDisplay();

    // Loop starten (nur wenn Timer im Modus aktiv ist)
    if (state.mode !== 'learn' || state.learnHasTimer) {
      timerRafId = requestAnimationFrame(updateTimerLoop);
    }
  }

  function updateTimerLoop(timestamp) {
    if (!state.timerRunning || (state.mode === 'learn' && !state.learnHasTimer)) {
      timerRafId = null;
      return;
    }

    const rawDelta = (timestamp - state.timerLastTimestamp) / 1000;
    // Schutz gegen Aussetzer (z.B. wenn Bildschirm kurz gesperrt war)
    const delta = Math.min(0.5, Math.max(0, rawDelta));
    state.timerLastTimestamp = timestamp;
    state.remainingTime -= delta;

    if (state.remainingTime <= 0) {
      state.remainingTime = 0;
      stopTimer();
      updateTimerDisplay();
      handleTimeout();
      return;
    }

    // Akustisches Ticken in den letzten 2.5 Sekunden
    const currentSecFloor = Math.ceil(state.remainingTime);
    if (state.remainingTime <= 2.5 && currentSecFloor !== state.lastTickSecond) {
      state.lastTickSecond = currentSecFloor;
      const urgency = state.remainingTime < 1.2 ? 2 : 1;
      window.audio.playTick(urgency);
    }

    updateTimerDisplay();
    timerRafId = requestAnimationFrame(updateTimerLoop);
  }

  function updateTimerDisplay() {
    if (state.mode === 'learn' && !state.learnHasTimer) {
      dom.timerBar.style.width = '100%';
      dom.hudTimeLeft.textContent = '∞';
      return;
    }

    const pct = Math.max(0, Math.min(100, (state.remainingTime / state.allocatedTime) * 100));
    dom.timerBar.style.width = `${pct}%`;
    dom.hudTimeLeft.textContent = state.remainingTime.toFixed(1) + 's';

    if (pct < 25) {
      dom.timerBar.className = 'timer-bar critical';
    } else if (pct < 50) {
      dom.timerBar.className = 'timer-bar warning';
    } else {
      dom.timerBar.className = 'timer-bar';
    }
  }

  // ==================== ANTWORT-PRÜFUNG & SUDDEN DEATH ====================
  function handleInputDigit(digit) {
    if (state.currentInput.length >= 3) return; // Maximal dreistellig (bis 100)
    window.audio.playClick();
    state.currentInput += digit;
    dom.answerPlaceholder.textContent = state.currentInput;
    dom.answerPlaceholder.classList.add('has-val');
  }

  function handleBackspace() {
    window.audio.playClick();
    if (state.currentInput.length > 0) {
      state.currentInput = state.currentInput.slice(0, -1);
      dom.answerPlaceholder.textContent = state.currentInput || '?';
      if (!state.currentInput) {
        dom.answerPlaceholder.classList.remove('has-val');
      }
    }
  }

  function submitAnswer() {
    if (!state.currentInput) return;
    const num = parseInt(state.currentInput, 10);
    checkAnswer(num);
  }

  function checkAnswer(userAnswer) {
    if (!state.currentProblem) return;
    const correct = state.currentProblem.answer;

    if (userAnswer === correct) {
      // RICHTIG!
      state.streak++;
      updateHud();

      const interval = state.settings.stepInterval || 5;
      const isLevelUp = (state.streak > 0 && state.streak % interval === 0 && state.mode !== 'learn');

      if (isLevelUp) {
        // LEVEL UP! Belohnung & Atempause
        stopTimer();
        const newLvl = Math.floor(state.streak / interval) + 1;
        triggerLevelUp(newLvl);
      } else {
        window.audio.playCorrect();
        triggerConfetti(25);
        dom.feedbackMsg.textContent = 'Richtig! ⭐';
        dom.feedbackMsg.style.color = 'var(--accent-green)';
        
        // Kurze visuelle Pause für gutes Gefühl
        setTimeout(() => {
          nextProblem();
        }, 180);
      }

    } else {
      // FALSCH!
      window.audio.playWrong();
      dom.questionCard.classList.add('shake');

      if (state.mode === 'learn') {
        // Im Lernmodus kein Game Over! Freundliche Korrektur:
        dom.feedbackMsg.textContent = `Nicht ganz! ${state.currentProblem.a} × ${state.currentProblem.b} = ${correct}`;
        dom.feedbackMsg.style.color = 'var(--accent-yellow)';
        state.currentInput = '';
        dom.answerPlaceholder.textContent = '?';
        dom.answerPlaceholder.classList.remove('has-val');
      } else {
        // Sudden Death in Arcade-Modi!
        stopTimer();
        triggerGameOver(`Falsches Ergebnis eingetippt (${userAnswer})!`);
      }
    }
  }

  // ==================== LEVEL UP CELEBRATION ====================
  function triggerLevelUp(newLevel) {
    const rank = getRankForLevel(newLevel);
    const nextTime = calculateAllocatedTime();

    window.audio.playLevelUp();
    triggerConfetti(70);

    dom.feedbackMsg.textContent = '⚡ LEVEL UP! ⚡';
    dom.feedbackMsg.style.color = 'var(--accent-yellow)';

    dom.levelUpRankText.textContent = `LEVEL ${rank.level}: ${rank.name.toUpperCase()} ${rank.icon}`;
    dom.levelUpSpeedText.textContent = `Tempo zieht an: ${nextTime.toFixed(1)}s pro Aufgabe!`;
    dom.levelUpOverlay.classList.add('active');

    // 1.1s verdiente Atempause & Belohnung zum Genießen
    setTimeout(() => {
      dom.levelUpOverlay.classList.remove('active');
      nextProblem();
    }, 1100);
  }

  function handleTimeout() {
    window.audio.playWrong();
    dom.questionCard.classList.add('shake');

    if (state.mode === 'learn') {
      // Im Lernmodus mit Timer: Lösung anzeigen und weiter
      dom.feedbackMsg.textContent = `Zeit um! ${state.currentProblem.a} × ${state.currentProblem.b} = ${state.currentProblem.answer}`;
      dom.feedbackMsg.style.color = 'var(--accent-yellow)';
      setTimeout(() => {
        nextProblem();
      }, 1400);
    } else {
      triggerGameOver('Die Zeit ist abgelaufen!');
    }
  }

  // ==================== GAME OVER & REKORDE ====================
  function triggerGameOver(reason) {
    stopTimer();
    window.audio.playGameOver();

    const interval = state.settings.stepInterval || 5;
    const finalLvl = Math.max(1, Math.floor(state.streak / interval) + 1);
    const finalRank = getRankForLevel(finalLvl);

    // Motivierende Auswertung & Lob
    if (state.streak === 0) {
      dom.gameoverPraiseTitle.textContent = 'Kopf hoch! 🐱';
      dom.gameoverPraiseDesc.innerHTML = 'Beim nächsten Mal klappt es bestimmt! Probier es gleich nochmal.';
    } else {
      dom.gameoverPraiseTitle.textContent = 'Starke Leistung! ⭐';
      dom.gameoverPraiseDesc.innerHTML = `Du hast <strong>${state.streak} ${state.streak === 1 ? 'Aufgabe' : 'Aufgaben'}</strong> gelöst und <strong>Level ${finalRank.level} (${finalRank.name} ${finalRank.icon})</strong> erreicht!`;
    }

    dom.gameoverReason.textContent = reason;
    dom.correctSolutionText.textContent = `${state.currentProblem.a} × ${state.currentProblem.b} = ${state.currentProblem.answer}`;
    dom.gameoverModeName.textContent = state.mode.toUpperCase();

    // Bestenliste auf dem Game-Over-Screen anzeigen
    renderGameoverLeaderboard(state.mode, null);

    // Prüfen, ob der Score für die Bestenliste reicht (Top 10 und Streak > 0)
    const qualifies = isHighscore(state.mode, state.streak);

    if (qualifies) {
      dom.highscoreEntryArea.style.display = 'block';
      dom.playerNameInput.value = '';
      setTimeout(() => {
        dom.playerNameInput.focus();
        window.audio.playCheer();
        triggerConfetti(65);
      }, 350);
    } else {
      dom.highscoreEntryArea.style.display = 'none';
    }

    showScreen('gameover');
  }

  function renderGameoverLeaderboard(mode, highlightedName) {
    const list = state.highscores[mode] || [];
    dom.gameoverLeaderboardList.innerHTML = '';

    list.slice(0, 6).forEach((item, idx) => {
      const row = document.createElement('div');
      const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';
      const isPlayer = (highlightedName && item.name.toUpperCase().startsWith(highlightedName.toUpperCase()));
      row.className = `lb-row ${rankClass} ${isPlayer ? 'player-row' : ''}`;

      const medals = ['🥇', '🥈', '🥉'];
      const rankDisplay = medals[idx] || `#${idx + 1}`;

      row.innerHTML = `
        <span class="lb-rank">${rankDisplay}</span>
        <span class="lb-name">${item.name}</span>
        <span class="lb-score">${item.score} <small style="font-size:0.7rem; color:var(--text-muted)">Serie</small></span>
      `;
      dom.gameoverLeaderboardList.appendChild(row);
    });
  }

  function isHighscore(mode, score) {
    if (score <= 0 || mode === 'learn') return false;
    const list = state.highscores[mode] || [];
    if (list.length < 10) return true;
    return score > list[list.length - 1].score;
  }

  function saveCurrentPlayerHighscore() {
    const rawName = dom.playerNameInput.value.trim().toUpperCase() || 'PROFI';
    const name = rawName.slice(0, 10);
    const score = state.streak;

    if (!state.highscores[state.mode]) {
      state.highscores[state.mode] = [];
    }

    state.highscores[state.mode].push({
      name: `${name} ⭐`,
      score: score,
      date: new Date().toLocaleDateString('de-DE')
    });

    // Nach Punkten sortieren (absteigend)
    state.highscores[state.mode].sort((a, b) => b.score - a.score);
    // Nur Top 10 behalten
    state.highscores[state.mode] = state.highscores[state.mode].slice(0, 10);

    saveHighscores();
    dom.highscoreEntryArea.style.display = 'none';
    window.audio.playCorrect();
    triggerConfetti(50);
    
    // Bestenliste auf dem Screen sofort mit hervorhebung aktualisieren!
    renderGameoverLeaderboard(state.mode, name);
  }

  // ==================== MODALS: BESTENLISTE ====================
  function openHighscoresModal(activeTab = 'normal') {
    window.audio.playClick();
    dom.modalHighscores.classList.add('active');
    switchHighscoreTab(activeTab);
  }

  function closeHighscoresModal() {
    window.audio.playClick();
    dom.modalHighscores.classList.remove('active');
  }

  function switchHighscoreTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const list = state.highscores[tabName] || [];
    dom.leaderboardList.innerHTML = '';

    if (list.length === 0) {
      dom.leaderboardList.innerHTML = '<div class="lb-empty">Noch keine Rekorde eingetragen.<br>Spiele eine Runde und sei der Erste! 🚀</div>';
      return;
    }

    list.forEach((item, idx) => {
      const row = document.createElement('div');
      const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';
      row.className = `lb-row ${rankClass}`;
      
      const medals = ['🥇', '🥈', '🥉'];
      const rankDisplay = medals[idx] || `#${idx + 1}`;

      row.innerHTML = `
        <span class="lb-rank">${rankDisplay}</span>
        <span class="lb-name">${item.name}</span>
        <span class="lb-score">${item.score} <small style="font-size:0.75rem; color:var(--text-muted)">Serie</small></span>
      `;
      dom.leaderboardList.appendChild(row);
    });
  }

  // ==================== MODALS: EINSTELLUNGEN ====================
  function openSettingsModal() {
    window.audio.playClick();
    const cfg = state.settings;
    dom.cfgStartTime.value = cfg.startTime;
    dom.valStartTime.textContent = `${cfg.startTime.toFixed(1)}s`;

    dom.cfgMinTime.value = cfg.minTime;
    dom.valMinTime.textContent = `${cfg.minTime.toFixed(1)}s`;

    dom.cfgStepInterval.value = cfg.stepInterval;
    dom.valStepInterval.textContent = `${cfg.stepInterval} Aufgaben`;

    dom.cfgStepReduction.value = cfg.stepReduction;
    dom.valStepReduction.textContent = `${cfg.stepReduction.toFixed(1)}s`;

    dom.cfgSoundVolume.value = cfg.sfxVolume;
    dom.valSoundVolume.textContent = `${Math.round(cfg.sfxVolume * 100)}%`;

    dom.cfgMusicVolume.value = cfg.musicVolume;
    dom.valMusicVolume.textContent = `${Math.round(cfg.musicVolume * 100)}%`;

    dom.modalSettings.classList.add('active');
  }

  function closeSettingsModal() {
    window.audio.playClick();
    dom.modalSettings.classList.remove('active');
  }

  function saveSettingsFromModal() {
    window.audio.playClick();
    state.settings.startTime = parseFloat(dom.cfgStartTime.value);
    state.settings.minTime = parseFloat(dom.cfgMinTime.value);
    state.settings.stepInterval = parseInt(dom.cfgStepInterval.value, 10);
    state.settings.stepReduction = parseFloat(dom.cfgStepReduction.value);
    state.settings.sfxVolume = parseFloat(dom.cfgSoundVolume.value);
    state.settings.musicVolume = parseFloat(dom.cfgMusicVolume.value);

    window.audio.setVolumes(state.settings.sfxVolume, state.settings.musicVolume);
    saveSettings();
    dom.modalSettings.classList.remove('active');
  }

  // ==================== MODALS: QR-CODE FÜRS TABLET ====================
  function openQrModal() {
    window.audio.playClick();
    const url = window.location.href;
    dom.qrUrlInput.value = url;

    try {
      if (typeof QRCode !== 'undefined' && dom.qrCanvas) {
        QRCode.generateCanvas(dom.qrCanvas, url, 200);
      }
    } catch (err) {
      console.warn('QR Code Generierung:', err);
    }

    dom.modalQr.classList.add('active');
  }

  function closeQrModal() {
    window.audio.playClick();
    dom.modalQr.classList.remove('active');
  }

  // ==================== PARTIKEL SYSTEM (CONFETTI / STARS) ====================
  let particles = [];
  const pCtx = dom.canvas.getContext('2d');

  function resizeCanvas() {
    dom.canvas.width = window.innerWidth;
    dom.canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function triggerConfetti(count = 35) {
    const colors = ['#00e5ff', '#ffb703', '#10b981', '#f72585', '#9d4edd', '#ffffff'];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.015
      });
    }
  }

  function updateParticles() {
    pCtx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Schwerkraft
      p.rotation += p.vr;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      pCtx.save();
      pCtx.globalAlpha = p.life;
      pCtx.translate(p.x, p.y);
      pCtx.rotate((p.rotation * Math.PI) / 180);
      pCtx.fillStyle = p.color;
      pCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      pCtx.restore();
    }

    requestAnimationFrame(updateParticles);
  }
  requestAnimationFrame(updateParticles);

  // ==================== EVENT LISTENER REGISTRIERUNG ====================
  function initEvents() {
    // Top-Navigation
    dom.btnHome.addEventListener('click', () => {
      window.audio.playClick();
      stopTimer();
      showScreen('menu');
    });

    dom.btnSound.addEventListener('click', () => {
      const isMuted = window.audio.toggleMute();
      dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    dom.btnQr.addEventListener('click', openQrModal);
    dom.btnHighscores.addEventListener('click', () => openHighscoresModal('normal'));
    dom.btnSettings.addEventListener('click', openSettingsModal);

    // Hauptmenü Modi
    dom.btnModeLearn.addEventListener('click', () => {
      window.audio.playClick();
      showScreen('learnSetup');
    });

    dom.btnModeEasy.addEventListener('click', () => {
      window.audio.playClick();
      startGame('easy');
    });

    dom.btnModeNormal.addEventListener('click', () => {
      window.audio.playClick();
      startGame('normal');
    });

    dom.btnModeHardcore.addEventListener('click', () => {
      window.audio.playClick();
      startGame('hardcore');
    });

    // Lernmodus Setup
    dom.btnSelectAll.addEventListener('click', () => {
      window.audio.playClick();
      state.learnSelectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      renderLearnTablesGrid();
    });

    dom.btnSelectNone.addEventListener('click', () => {
      window.audio.playClick();
      state.learnSelectedTables = [2]; // mindestens die 2er
      renderLearnTablesGrid();
    });

    dom.btnStartLearn.addEventListener('click', () => {
      window.audio.playClick();
      state.learnHasTimer = dom.chkLearnTimer.checked;
      startGame('learn');
    });

    // Multiple Choice Buttons (Leicht)
    dom.choiceContainer.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        checkAnswer(val);
      });
    });

    // On-Screen Numpad Buttons (Normal & Hardcore)
    dom.numpadContainer.querySelectorAll('.pad-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        handleInputDigit(btn.dataset.val);
      });
    });

    dom.padBackspace.addEventListener('click', handleBackspace);
    dom.padEnter.addEventListener('click', submitAnswer);

    // Game Over Buttons
    dom.btnPlayAgain.addEventListener('click', () => {
      window.audio.playClick();
      startGame(state.mode);
    });

    dom.btnGoMenu.addEventListener('click', () => {
      window.audio.playClick();
      showScreen('menu');
    });

    dom.btnSaveHighscore.addEventListener('click', saveCurrentPlayerHighscore);
    dom.playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveCurrentPlayerHighscore();
    });

    // Modal Close Buttons
    dom.btnCloseHighscores.addEventListener('click', closeHighscoresModal);
    dom.btnCloseSettings.addEventListener('click', closeSettingsModal);
    dom.btnCloseQr.addEventListener('click', closeQrModal);
    dom.btnOkQr.addEventListener('click', closeQrModal);

    dom.btnCopyUrl.addEventListener('click', () => {
      window.audio.playClick();
      navigator.clipboard.writeText(dom.qrUrlInput.value).then(() => {
        dom.btnCopyUrl.textContent = 'Kopiert! ✓';
        setTimeout(() => { dom.btnCopyUrl.textContent = 'Kopieren'; }, 1800);
      }).catch(() => {
        dom.qrUrlInput.select();
      });
    });

    dom.btnClearHighscores.addEventListener('click', () => {
      if (confirm('Möchtest du die Bestenliste auf die Katzen-Rekorde von Sammy & Flocke zurücksetzen?')) {
        state.highscores = JSON.parse(JSON.stringify(DEFAULT_HIGHSCORES));
        saveHighscores();
        switchHighscoreTab('normal');
        window.audio.playCorrect();
      }
    });

    // Highscore Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.audio.playClick();
        switchHighscoreTab(btn.dataset.tab);
      });
    });

    // Settings Sliders Live-Anzeige
    dom.cfgStartTime.addEventListener('input', (e) => {
      dom.valStartTime.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
    });
    dom.cfgMinTime.addEventListener('input', (e) => {
      dom.valMinTime.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
    });
    dom.cfgStepInterval.addEventListener('input', (e) => {
      dom.valStepInterval.textContent = `${e.target.value} Aufgaben`;
    });
    dom.cfgStepReduction.addEventListener('input', (e) => {
      dom.valStepReduction.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
    });
    dom.cfgSoundVolume.addEventListener('input', (e) => {
      dom.valSoundVolume.textContent = `${Math.round(e.target.value * 100)}%`;
    });
    dom.cfgMusicVolume.addEventListener('input', (e) => {
      dom.valMusicVolume.textContent = `${Math.round(e.target.value * 100)}%`;
    });
    // App-Update per Klick im Einstellungsmenü
    const btnUpdateApp = document.getElementById('btnUpdateApp');
    if (btnUpdateApp) {
      btnUpdateApp.addEventListener('click', async () => {
        btnUpdateApp.textContent = 'Aktualisiere... ⏳';
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) await reg.unregister();
          const keys = await caches.keys();
          for (const key of keys) await caches.delete(key);
        }
		    // Changelog einmalig nach Versionswechsel anzeigen
    const CURRENT_VERSION = '1.1';
	const versionDisplay = document.getElementById('appVersion');
    if (versionDisplay) versionDisplay.textContent = `v${CURRENT_VERSION}`;
    const lastSeenVersion = localStorage.getItem('1x1_version');
    const modalChangelog = document.getElementById('modalChangelog');
    const btnOkChangelog = document.getElementById('btnOkChangelog');

    if (lastSeenVersion !== CURRENT_VERSION && modalChangelog) {
      modalChangelog.classList.add('active');
    }

    if (btnOkChangelog) {
      btnOkChangelog.addEventListener('click', () => {
        window.audio.playClick();
        localStorage.setItem('1x1_version', CURRENT_VERSION);
        modalChangelog.classList.remove('active');
      });
    }
        window.location.reload();
      });
    }
    dom.btnResetSettings.addEventListener('click', () => {
      window.audio.playClick();
      state.settings = { ...DEFAULT_SETTINGS };
      openSettingsModal(); // Werte neu ins Modal schreiben
    });

    dom.btnSaveSettings.addEventListener('click', saveSettingsFromModal);

    // ==================== TASTATUR-STEUERUNG (PC) ====================
    window.addEventListener('keydown', (e) => {
      // Wenn Modal oder Name-Input aktiv ist, normale Tastatur nutzen
      if (document.activeElement === dom.playerNameInput) return;

      // Sound Stummschalten per 'M'
      if (e.key === 'm' || e.key === 'M') {
        const isMuted = window.audio.toggleMute();
        dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
        return;
      }

      // Escape schließt Modals oder geht ins Menü
      if (e.key === 'Escape') {
        if (dom.modalHighscores.classList.contains('active')) closeHighscoresModal();
        else if (dom.modalSettings.classList.contains('active')) closeSettingsModal();
        else if (dom.modalQr.classList.contains('active')) closeQrModal();
        else if (state.screen === 'game') showScreen('menu');
        return;
      }

      // Nur im Spiel relevant:
      if (state.screen !== 'game') return;

      // Zifferntasten 0-9 (auch Numpad!)
      if (e.key >= '0' && e.key <= '9') {
        if (state.mode === 'easy') {
          // Im Leicht-Modus: Tasten 1, 2, 3, 4 wählen die jeweilige Karte
          const idx = parseInt(e.key, 10) - 1;
          const choiceBtns = dom.choiceContainer.querySelectorAll('.choice-btn');
          if (idx >= 0 && idx < choiceBtns.length) {
            checkAnswer(parseInt(choiceBtns[idx].dataset.val, 10));
          }
        } else {
          // Im Normal / Hardcore Modus: Ziffer ins Eingabefeld
          handleInputDigit(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        submitAnswer();
      }
    });
  }

  // ==================== APP INITIALISIERUNG ====================
  loadPersistedData();
  initEvents();
  showScreen('menu');

})();
