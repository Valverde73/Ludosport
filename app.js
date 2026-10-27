/**
 * LudoSport Arena - Liga Mensual
 * Full-Stack Logic & State Management
 */

// Initial Seed Fencers (LudoSport School Pupils)
const DEFAULT_FENCERS = [
  { id: 'f-1', name: 'Marco Silva', rank: 'Avanzado', color: 'cyan', joinedAt: '2026-01-10' },
  { id: 'f-2', name: 'Elena Rostova', rank: 'Intermedio', color: 'emerald', joinedAt: '2026-02-15' },
  { id: 'f-3', name: 'David Kenobi', rank: 'Avanzado', color: 'amber', joinedAt: '2026-01-20' },
  { id: 'f-4', name: 'Sara Vane', rank: 'Iniciado', color: 'purple', joinedAt: '2026-03-01' },
  { id: 'f-5', name: 'Alex Vance', rank: 'Intermedio', color: 'cyan', joinedAt: '2026-02-10' },
  { id: 'f-6', name: 'Lucas Corvo', rank: 'Iniciado', color: 'rose', joinedAt: '2026-03-05' },
  { id: 'f-7', name: 'Nuria Soler', rank: 'Avanzado', color: 'white', joinedAt: '2026-01-12' },
  { id: 'f-8', name: 'Pablo Ruiz', rank: 'Iniciado', color: 'amber', joinedAt: '2026-03-12' }
];

// Months Name Dictionary (Spanish)
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

class LudoSportApp {
  constructor() {
    this.currentMonthKey = this.getDefaultMonthKey();
    this.isAdmin = false;
    this.isTestMode = false;
    this.adminPin = '1234';
    this.sheetsUrl = '';
    this.fencers = [];
    this.matches = []; // matches for the active month
    this.availableMonths = [];
    this.scoreA = 0;
    this.scoreB = 0;
    this.selectedResult = 'DRAW'; // automatically calculated
    this.matchPendingDeleteId = null;
    this.isSyncing = false;

    this.init();
  }

  // Format MMYYYY e.g. "102026"
  getDefaultMonthKey() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${mm}${yyyy}`;
  }

  formatMonthLabel(key) {
    if (!key || key.length < 6) return key;
    const cleanKey = key.replace('TEST_', '');
    const mm = parseInt(cleanKey.substring(0, 2), 10);
    const yyyy = cleanKey.substring(2);
    const monthName = MONTH_NAMES[mm - 1] || 'Mes';
    return `${monthName} ${yyyy}`;
  }

  getActiveStorageMonthKey() {
    return this.isTestMode ? `ls_test_matches_${this.currentMonthKey}` : `ls_matches_${this.currentMonthKey}`;
  }

  getActiveStorageFencersKey() {
    return this.isTestMode ? `ls_test_fencers` : `ls_fencers`;
  }

  getActiveSheetsMonthKey() {
    return this.isTestMode ? `TEST_${this.currentMonthKey}` : this.currentMonthKey;
  }

  init() {
    this.loadLocalConfig();
    this.setupEventListeners();
    this.updateTestModeUI();
    this.renderMonthSelector();
    this.updateAdminUI();
    this.loadData();
    this.updateDuelScoreAndOutcome();
    
    // Set default date input in duel form to today
    const dateInput = document.getElementById('duelDateInput');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  loadLocalConfig() {
    const storedPin = localStorage.getItem('ls_admin_pin');
    if (storedPin) this.adminPin = storedPin;

    const storedSheets = localStorage.getItem('ls_sheets_url');
    if (storedSheets) this.sheetsUrl = storedSheets;
    const sheetsInput = document.getElementById('sheetsUrlInput');
    if (sheetsInput) sheetsInput.value = this.sheetsUrl;

    const storedAuth = sessionStorage.getItem('ls_admin_logged');
    if (storedAuth === 'true') this.isAdmin = true;

    // Test mode state
    const storedTest = localStorage.getItem('ls_test_mode');
    this.isTestMode = storedTest === 'true';

    // Available months stored
    const storedMonths = localStorage.getItem('ls_months_list');
    if (storedMonths) {
      try {
        this.availableMonths = JSON.parse(storedMonths);
      } catch (e) {
        this.availableMonths = [this.currentMonthKey];
      }
    } else {
      this.availableMonths = [this.currentMonthKey];
      this.saveAvailableMonths();
    }

    if (!this.availableMonths.includes(this.currentMonthKey)) {
      this.availableMonths.unshift(this.currentMonthKey);
      this.saveAvailableMonths();
    }
  }

  saveAvailableMonths() {
    localStorage.setItem('ls_months_list', JSON.stringify(this.availableMonths));
  }

  // Toggle Test Mode (Sandbox)
  toggleTestMode(forcedState = null) {
    this.isTestMode = forcedState !== null ? forcedState : !this.isTestMode;
    localStorage.setItem('ls_test_mode', this.isTestMode ? 'true' : 'false');
    
    this.updateTestModeUI();
    this.loadData();

    if (this.isTestMode) {
      this.showToast('🧪 Modo Pruebas Activado (Datos Aislados)', 'amber');
    } else {
      this.showToast('🛡️ Modo Oficial Activado', 'cyan');
    }
  }

  updateTestModeUI() {
    const banner = document.getElementById('testModeBanner');
    const headerBtn = document.getElementById('testModeToggleBtn');
    const navLabel = document.getElementById('testModeNavLabel');
    const switchBall = document.getElementById('testModeSwitchBall');
    const switchContainer = document.getElementById('testModeSettingsToggleBtn');

    if (this.isTestMode) {
      if (banner) banner.classList.remove('hidden');

      if (headerBtn) {
        headerBtn.className = 'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/20';
      }
      if (navLabel) navLabel.textContent = 'Pruebas';

      if (switchBall) {
        switchBall.className = 'inline-block h-4 w-4 transform rounded-full bg-amber-400 transition-transform translate-x-6';
      }
      if (switchContainer) {
        switchContainer.className = 'relative inline-flex h-6 w-11 items-center rounded-full bg-amber-500/30 border border-amber-500/50 transition-colors focus:outline-none';
      }
    } else {
      if (banner) banner.classList.add('hidden');

      if (headerBtn) {
        headerBtn.className = 'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all border-slate-700 bg-slate-800/80 text-slate-400 hover:text-amber-300';
      }
      if (navLabel) navLabel.textContent = 'Oficial';

      if (switchBall) {
        switchBall.className = 'inline-block h-4 w-4 transform rounded-full bg-slate-400 transition-transform translate-x-1';
      }
      if (switchContainer) {
        switchContainer.className = 'relative inline-flex h-6 w-11 items-center rounded-full bg-slate-800 border border-slate-700 transition-colors focus:outline-none';
      }
    }
  }

  // Load sample demo match data with realistic football/combat scores
  loadSampleTestData() {
    if (!this.isTestMode) {
      this.toggleTestMode(true);
    }

    const today = new Date().toISOString().split('T')[0];
    const demoMatches = [
      {
        id: 'm-demo-1',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-1',
        fighterAName: 'Marco Silva',
        fighterBId: 'f-2',
        fighterBName: 'Elena Rostova',
        scoreA: 2,
        scoreB: 0,
        scoreText: '2 - 0',
        result: 'VICTORY_A',
        winner: 'Marco Silva',
        pointsA: 3,
        pointsB: 0,
        notes: 'Forma 1 - Shii-Cho',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'm-demo-2',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-3',
        fighterAName: 'David Kenobi',
        fighterBId: 'f-5',
        fighterBName: 'Alex Vance',
        scoreA: 1,
        scoreB: 1,
        scoreText: '1 - 1',
        result: 'DRAW',
        winner: 'Empate',
        pointsA: 1,
        pointsB: 1,
        notes: 'Doble impacto limpio',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'm-demo-3',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-4',
        fighterAName: 'Sara Vane',
        fighterBId: 'f-7',
        fighterBName: 'Nuria Soler',
        scoreA: 0,
        scoreB: 2,
        scoreText: '0 - 2',
        result: 'VICTORY_B',
        winner: 'Nuria Soler',
        pointsA: 0,
        pointsB: 3,
        notes: 'Forma 2 - Makashi',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'm-demo-4',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-6',
        fighterAName: 'Lucas Corvo',
        fighterBId: 'f-8',
        fighterBName: 'Pablo Ruiz',
        scoreA: 3,
        scoreB: 1,
        scoreText: '3 - 1',
        result: 'VICTORY_A',
        winner: 'Lucas Corvo',
        pointsA: 3,
        pointsB: 0,
        notes: 'Ataques veloces',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'm-demo-5',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-1',
        fighterAName: 'Marco Silva',
        fighterBId: 'f-3',
        fighterBName: 'David Kenobi',
        scoreA: 2,
        scoreB: 1,
        scoreText: '2 - 1',
        result: 'VICTORY_A',
        winner: 'Marco Silva',
        pointsA: 3,
        pointsB: 0,
        notes: 'Duelo reñido',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
      },
      {
        id: 'm-demo-6',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-2',
        fighterAName: 'Elena Rostova',
        fighterBId: 'f-4',
        fighterBName: 'Sara Vane',
        scoreA: 1,
        scoreB: 0,
        scoreText: '1 - 0',
        result: 'VICTORY_A',
        winner: 'Elena Rostova',
        pointsA: 3,
        pointsB: 0,
        notes: 'Contraataque decisivo',
        timestamp: new Date().toISOString()
      }
    ];

    this.matches = demoMatches;
    this.saveLocalCache();
    this.renderAll();
    this.showToast('¡6 combates de prueba con marcador cargados!', 'emerald');
  }

  async loadData() {
    this.setSyncStatus('Cargando...', 'amber');
    const sheetsMonthKey = this.getActiveSheetsMonthKey();
    
    // 1. Try to load from Google Sheets if configured
    if (this.sheetsUrl && this.sheetsUrl.trim().startsWith('http')) {
      try {
        const url = `${this.sheetsUrl}?action=getData&monthKey=${sheetsMonthKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.success) {
          this.fencers = data.fencers && data.fencers.length > 0 ? data.fencers : DEFAULT_FENCERS;
          this.matches = data.matches || [];
          this.saveLocalCache();
          const syncLabel = this.isTestMode ? 'Sheets (Modo Pruebas)' : 'Conectado a Sheets';
          this.setSyncStatus(syncLabel, 'emerald');
          this.renderAll();
          return;
        }
      } catch (err) {
        console.warn('Fallo al conectar con Google Sheets, usando almacenamiento local:', err);
        this.setSyncStatus(this.isTestMode ? 'Pruebas Local (Offline)' : 'Modo Local (Offline)', 'amber');
      }
    }

    // 2. Fallback to LocalStorage
    this.loadFromLocalStorage();
    const defaultLabel = this.isTestMode ? 'Pruebas (Local)' : 'Modo Local';
    this.setSyncStatus(defaultLabel, 'emerald');
    this.renderAll();
  }

  loadFromLocalStorage() {
    const fencersKey = this.getActiveStorageFencersKey();
    const storedFencers = localStorage.getItem(fencersKey);
    if (storedFencers) {
      try {
        this.fencers = JSON.parse(storedFencers);
      } catch (e) {
        this.fencers = DEFAULT_FENCERS;
      }
    } else {
      this.fencers = [...DEFAULT_FENCERS];
      localStorage.setItem(fencersKey, JSON.stringify(this.fencers));
    }

    const matchesKey = this.getActiveStorageMonthKey();
    const storedMatches = localStorage.getItem(matchesKey);
    if (storedMatches) {
      try {
        this.matches = JSON.parse(storedMatches);
      } catch (e) {
        this.matches = [];
      }
    } else {
      this.matches = [];
    }
  }

  saveLocalCache() {
    localStorage.setItem(this.getActiveStorageFencersKey(), JSON.stringify(this.fencers));
    localStorage.setItem(this.getActiveStorageMonthKey(), JSON.stringify(this.matches));
  }

  setSyncStatus(label, color = 'emerald') {
    const dot = document.getElementById('syncIndicatorDot');
    const text = document.getElementById('syncStatusLabel');
    if (dot && text) {
      text.textContent = label;
      dot.className = `w-2 h-2 rounded-full ${
        color === 'emerald' ? 'bg-emerald-400' : color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
      }`;
    }
  }

  // Calculate standings from current month matches and fencer list
  // Standings include Points, Victories, Draws, Losses, PF, PC, and Goal Difference (DIF)
  calculateStandings() {
    const statsMap = {};

    // Initialize every fencer with 0
    this.fencers.forEach(f => {
      statsMap[f.id] = {
        fencer: f,
        matchesPlayed: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
        points: 0
      };
    });

    // Compute matches
    this.matches.forEach(m => {
      const statsA = statsMap[m.fighterAId];
      const statsB = statsMap[m.fighterBId];

      if (statsA) statsA.matchesPlayed++;
      if (statsB) statsB.matchesPlayed++;

      const sA = (typeof m.scoreA === 'number') ? m.scoreA : (m.result === 'VICTORY_A' ? 1 : 0);
      const sB = (typeof m.scoreB === 'number') ? m.scoreB : (m.result === 'VICTORY_B' ? 1 : 0);

      if (statsA) {
        statsA.pointsFor += sA;
        statsA.pointsAgainst += sB;
        statsA.diff = statsA.pointsFor - statsA.pointsAgainst;
      }
      if (statsB) {
        statsB.pointsFor += sB;
        statsB.pointsAgainst += sA;
        statsB.diff = statsB.pointsFor - statsB.pointsAgainst;
      }

      if (m.result === 'VICTORY_A') {
        if (statsA) {
          statsA.won++;
          statsA.points += 3;
        }
        if (statsB) {
          statsB.lost++;
        }
      } else if (m.result === 'VICTORY_B') {
        if (statsB) {
          statsB.won++;
          statsB.points += 3;
        }
        if (statsA) {
          statsA.lost++;
        }
      } else if (m.result === 'DRAW') {
        if (statsA) {
          statsA.drawn++;
          statsA.points += 1;
        }
        if (statsB) {
          statsB.drawn++;
          statsB.points += 1;
        }
      }
    });

    // Sort order:
    // 1. Points descending (PTS)
    // 2. Victories descending (V)
    // 3. Goal/Point difference descending (DIF)
    // 4. Points scored descending (PF)
    // 5. Matches played ascending
    // 6. Name alphabetically
    const standings = Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
      return a.fencer.name.localeCompare(b.fencer.name);
    });

    return standings;
  }

  // Check if a match between two fencers already happened this month
  findExistingMatch(fencerAId, fencerBId) {
    if (!fencerAId || !fencerBId) return null;
    return this.matches.find(m => 
      (m.fighterAId === fencerAId && m.fighterBId === fencerBId) ||
      (m.fighterAId === fencerBId && m.fighterBId === fencerAId)
    );
  }

  // Get list of all pending matchups for the single round-robin
  getPendingMatchups() {
    const pending = [];
    const n = this.fencers.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const fA = this.fencers[i];
        const fB = this.fencers[j];
        const existing = this.findExistingMatch(fA.id, fB.id);
        if (!existing) {
          pending.push({ fencerA: fA, fencerB: fB });
        }
      }
    }
    return pending;
  }

  // Update duel score, calculate winner/draw automatically and update UI
  updateDuelScoreAndOutcome() {
    const inputA = document.getElementById('scoreAInput');
    const inputB = document.getElementById('scoreBInput');
    const labelA = document.getElementById('scoreCardLabelA');
    const labelB = document.getElementById('scoreCardLabelB');
    const selectA = document.getElementById('fighterASelect');
    const selectB = document.getElementById('fighterBSelect');
    const outcomeBadge = document.getElementById('duelCalculatedOutcomeBadge');
    const outcomeTitle = document.getElementById('outcomeTitleText');
    const outcomePoints = document.getElementById('outcomePointsText');
    const iconContainer = document.getElementById('outcomeIconContainer');

    const sA = Math.max(0, parseInt(inputA?.value || '0', 10) || 0);
    const sB = Math.max(0, parseInt(inputB?.value || '0', 10) || 0);
    if (inputA && inputA.value !== String(sA)) inputA.value = sA;
    if (inputB && inputB.value !== String(sB)) inputB.value = sB;

    this.scoreA = sA;
    this.scoreB = sB;

    const fA = this.fencers.find(f => f.id === selectA?.value);
    const fB = this.fencers.find(f => f.id === selectB?.value);

    const nameA = fA ? fA.name : 'Tirador Alfa';
    const nameB = fB ? fB.name : 'Tirador Beta';

    if (labelA) labelA.textContent = nameA;
    if (labelB) labelB.textContent = nameB;

    // Automatic calculation based on score!
    if (sA > sB) {
      this.selectedResult = 'VICTORY_A';
      if (outcomeBadge) {
        outcomeBadge.className = 'mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all bg-cyan-500/10 border-cyan-500/40 text-cyan-300';
      }
      if (outcomeTitle) outcomeTitle.textContent = `Victoria para ${nameA} (${sA} - ${sB})`;
      if (outcomePoints) outcomePoints.textContent = `+3 pts Alfa (Dif +${sA - sB}) | 0 pts Beta`;
      if (iconContainer) {
        iconContainer.innerHTML = '<i data-lucide="award" class="w-4 h-4 text-cyan-400"></i>';
      }
    } else if (sB > sA) {
      this.selectedResult = 'VICTORY_B';
      if (outcomeBadge) {
        outcomeBadge.className = 'mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all bg-rose-500/10 border-rose-500/40 text-rose-300';
      }
      if (outcomeTitle) outcomeTitle.textContent = `Victoria para ${nameB} (${sA} - ${sB})`;
      if (outcomePoints) outcomePoints.textContent = `0 pts Alfa | +3 pts Beta (Dif +${sB - sA})`;
      if (iconContainer) {
        iconContainer.innerHTML = '<i data-lucide="award" class="w-4 h-4 text-rose-400"></i>';
      }
    } else {
      this.selectedResult = 'DRAW';
      if (outcomeBadge) {
        outcomeBadge.className = 'mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all bg-amber-500/10 border-amber-500/40 text-amber-300';
      }
      if (outcomeTitle) outcomeTitle.textContent = `Empate Técnico (${sA} - ${sB})`;
      if (outcomePoints) outcomePoints.textContent = '+1 pt para cada tirador';
      if (iconContainer) {
        iconContainer.innerHTML = '<i data-lucide="scale" class="w-4 h-4 text-amber-400"></i>';
      }
    }

    // Always validate form status
    this.validateDuelForm();

    // Safely render icons if Lucide is available
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (err) {
        // Safe catch to ensure execution never halts
      }
    }
  }

  // Render all UI components
  renderAll() {
    this.renderMonthSelector();
    this.renderRanking();
    this.renderDuelFormOptions();
    this.renderHistory();
    this.renderFencersList();
    this.updateQuickStats();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateQuickStats() {
    const bar = document.getElementById('quickStatsBar');
    if (bar) {
      const modeTag = this.isTestMode ? ' [TEST]' : '';
      bar.innerHTML = `${this.matches.length} Combates &bull; ${this.fencers.length} Tiradores${modeTag}`;
    }
  }

  renderMonthSelector() {
    const label = document.getElementById('currentMonthLabel');
    if (label) {
      label.textContent = this.formatMonthLabel(this.currentMonthKey);
    }

    const duelMonthBadge = document.getElementById('duelFormMonthBadge');
    if (duelMonthBadge) {
      duelMonthBadge.textContent = this.formatMonthLabel(this.currentMonthKey);
    }

    const historyMonthLabel = document.getElementById('historyMonthLabel');
    if (historyMonthLabel) {
      historyMonthLabel.textContent = this.formatMonthLabel(this.currentMonthKey);
    }

    const container = document.getElementById('monthsListContainer');
    if (container) {
      container.innerHTML = this.availableMonths.map(mKey => {
        const isSelected = mKey === this.currentMonthKey;
        return `
          <button data-month="${mKey}" class="month-option-btn w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
            isSelected ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-slate-300'
          }">
            <span>${this.formatMonthLabel(mKey)}</span>
            ${isSelected ? '<i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400"></i>' : ''}
          </button>
        `;
      }).join('');
    }
  }

  renderRanking() {
    const standings = this.calculateStandings();
    const tableBody = document.getElementById('rankingTableBody');
    const podiumContainer = document.getElementById('podiumContainer');
    const searchFilter = (document.getElementById('rankingSearchInput')?.value || '').toLowerCase().trim();

    // Render Podium (Top 3)
    if (podiumContainer) {
      if (standings.length >= 3) {
        const first = standings[0];
        const second = standings[1];
        const third = standings[2];

        podiumContainer.innerHTML = `
          <!-- 2nd Place -->
          <div class="podium-card p-2.5 rounded-2xl bg-lsCard/90 border border-slate-700/60 flex flex-col items-center justify-end text-center pt-4">
            <span class="w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs flex items-center justify-center mb-1">2</span>
            <div class="w-10 h-10 rounded-full border-2 border-slate-400 bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-xs mb-1.5 shadow-md">
              ${this.getInitials(second.fencer.name)}
            </div>
            <div class="font-bold text-xs text-slate-200 truncate w-full">${second.fencer.name}</div>
            <div class="text-[10px] text-slate-400">${second.points} pts &bull; ${second.won}V &bull; Dif ${second.diff >= 0 ? '+' : ''}${second.diff}</div>
          </div>

          <!-- 1st Place (Gold / Crown) -->
          <div class="podium-card p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard border border-amber-500/50 flex flex-col items-center justify-end text-center pt-2 relative shadow-lg shadow-amber-500/10">
            <i data-lucide="crown" class="w-5 h-5 text-amber-400 mb-0.5 animate-bounce"></i>
            <div class="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-500/10 flex items-center justify-center font-bold text-amber-300 text-sm mb-1.5 shadow-lg shadow-amber-500/30">
              ${this.getInitials(first.fencer.name)}
            </div>
            <div class="font-bold text-xs text-amber-300 truncate w-full">${first.fencer.name}</div>
            <div class="text-[11px] font-bold text-slate-200">${first.points} pts</div>
            <div class="text-[10px] text-amber-400/80">${first.won}V &bull; Dif ${first.diff >= 0 ? '+' : ''}${first.diff}</div>
          </div>

          <!-- 3rd Place -->
          <div class="podium-card p-2.5 rounded-2xl bg-lsCard/90 border border-amber-700/40 flex flex-col items-center justify-end text-center pt-4">
            <span class="w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 font-bold text-xs flex items-center justify-center mb-1">3</span>
            <div class="w-10 h-10 rounded-full border-2 border-amber-700 bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-xs mb-1.5 shadow-md">
              ${this.getInitials(third.fencer.name)}
            </div>
            <div class="font-bold text-xs text-slate-200 truncate w-full">${third.fencer.name}</div>
            <div class="text-[10px] text-slate-400">${third.points} pts &bull; ${third.won}V &bull; Dif ${third.diff >= 0 ? '+' : ''}${third.diff}</div>
          </div>
        `;
      } else {
        podiumContainer.innerHTML = '';
      }
    }

    // Render Table Rows
    if (tableBody) {
      const filtered = standings.filter(s => s.fencer.name.toLowerCase().includes(searchFilter));

      if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" class="py-8 text-center text-slate-500 text-xs">
              No se han encontrado tiradores registrados.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = filtered.map((item, index) => {
        const pos = index + 1;
        let posBadge = `<span class="text-slate-400 font-bold">${pos}</span>`;
        if (pos === 1) posBadge = `<span class="inline-flex w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold items-center justify-center text-[10px] border border-amber-400/40">1</span>`;
        if (pos === 2) posBadge = `<span class="inline-flex w-5 h-5 rounded-full bg-slate-400/20 text-slate-300 font-bold items-center justify-center text-[10px] border border-slate-400/40">2</span>`;
        if (pos === 3) posBadge = `<span class="inline-flex w-5 h-5 rounded-full bg-amber-700/20 text-amber-500 font-bold items-center justify-center text-[10px] border border-amber-700/40">3</span>`;

        const saberClass = `saber-ring-${item.fencer.color || 'cyan'}`;

        let diffBadge = `<span class="text-slate-500 font-combat font-semibold text-xs">0</span>`;
        if (item.diff > 0) {
          diffBadge = `<span class="text-emerald-400 font-combat font-bold text-xs">+${item.diff}</span>`;
        } else if (item.diff < 0) {
          diffBadge = `<span class="text-rose-400 font-combat font-bold text-xs">${item.diff}</span>`;
        }

        return `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="py-2.5 pl-3 pr-2 text-center">${posBadge}</td>
            <td class="py-2.5 px-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full border ${saberClass} bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-200">
                  ${this.getInitials(item.fencer.name)}
                </div>
                <div>
                  <div class="font-bold text-slate-100 flex items-center gap-1.5">
                    ${item.fencer.name}
                  </div>
                  <div class="text-[10px] text-slate-400">${item.fencer.rank || 'Tirador'}</div>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-1.5 text-center text-slate-400 font-combat text-xs font-semibold">${item.matchesPlayed}</td>
            <td class="py-2.5 px-1.5 text-center text-emerald-400 font-combat text-xs font-bold">${item.won}</td>
            <td class="py-2.5 px-1.5 text-center text-amber-400 font-combat text-xs font-bold">${item.drawn}</td>
            <td class="py-2.5 px-1.5 text-center text-rose-400 font-combat text-xs font-bold">${item.lost}</td>
            <td class="py-2.5 px-1.5 text-center">${diffBadge}</td>
            <td class="py-2.5 pr-3 pl-2 text-center font-combat font-black text-sm text-cyan-300">${item.points}</td>
          </tr>
        `;
      }).join('');
    }
  }

  renderDuelFormOptions() {
    const selectA = document.getElementById('fighterASelect');
    const selectB = document.getElementById('fighterBSelect');

    if (!selectA || !selectB) return;

    const currentA = selectA.value;
    const currentB = selectB.value;

    const optionsHtml = `
      <option value="">-- Seleccionar Tirador --</option>
      ${this.fencers.map(f => `<option value="${f.id}">${f.name} (${f.rank || 'Alumno'})</option>`).join('')}
    `;

    selectA.innerHTML = optionsHtml;
    selectB.innerHTML = optionsHtml;

    if (currentA) selectA.value = currentA;
    if (currentB) selectB.value = currentB;

    this.renderPendingDuels();
    this.updateDuelScoreAndOutcome();
  }

  renderPendingDuels() {
    const container = document.getElementById('pendingDuelsList');
    const countBadge = document.getElementById('pendingDuelsCount');
    if (!container) return;

    const pending = this.getPendingMatchups();
    if (countBadge) {
      countBadge.textContent = `${pending.length} pendientes`;
    }

    if (pending.length === 0) {
      container.innerHTML = `
        <div class="text-xs text-emerald-400 py-1 font-semibold flex items-center gap-1.5">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          ¡Todos los cruces del mes se han completado!
        </div>
      `;
      return;
    }

    container.innerHTML = pending.map(item => `
      <button type="button" data-fa="${item.fencerA.id}" data-fb="${item.fencerB.id}" class="quick-pair-btn px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5">
        <span>${item.fencerA.name.split(' ')[0]}</span>
        <span class="text-slate-500 font-bold text-[9px]">vs</span>
        <span>${item.fencerB.name.split(' ')[0]}</span>
      </button>
    `).join('');
  }

  validateDuelForm() {
    const selectA = document.getElementById('fighterASelect');
    const selectB = document.getElementById('fighterBSelect');
    const saveBtn = document.getElementById('saveDuelBtn');
    const conflictBanner = document.getElementById('duelConflictBanner');
    const conflictText = document.getElementById('duelConflictText');
    const previewA = document.getElementById('fighterAStatsPreview');
    const previewB = document.getElementById('fighterBStatsPreview');

    if (!selectA || !selectB || !saveBtn) return;

    const idA = selectA.value;
    const idB = selectB.value;

    // Update stats preview
    const standings = this.calculateStandings();
    if (idA) {
      const sA = standings.find(s => s.fencer.id === idA);
      if (previewA && sA) previewA.textContent = `${sA.points} pts | ${sA.won}V-${sA.drawn}E-${sA.lost}D (Dif ${sA.diff >= 0 ? '+' : ''}${sA.diff})`;
    } else if (previewA) {
      previewA.textContent = '0 pts';
    }

    if (idB) {
      const sB = standings.find(s => s.fencer.id === idB);
      if (previewB && sB) previewB.textContent = `${sB.points} pts | ${sB.won}V-${sB.drawn}E-${sB.lost}D (Dif ${sB.diff >= 0 ? '+' : ''}${sB.diff})`;
    } else if (previewB) {
      previewB.textContent = '0 pts';
    }

    // Condition 1: Same fighter selected
    if (idA && idB && idA === idB) {
      saveBtn.disabled = true;
      conflictBanner.classList.remove('hidden');
      conflictText.textContent = 'No puedes seleccionar al mismo alumno como Tirador A y Tirador B.';
      return;
    }

    // Condition 2: Round-robin clash conflict (already fought in active month)
    if (idA && idB) {
      const existing = this.findExistingMatch(idA, idB);
      if (existing) {
        saveBtn.disabled = true;
        conflictBanner.classList.remove('hidden');
        const fA = this.fencers.find(f => f.id === existing.fighterAId)?.name || 'Tirador A';
        const fB = this.fencers.find(f => f.id === existing.fighterBId)?.name || 'Tirador B';
        let resText = 'Empate';
        if (existing.result === 'VICTORY_A') resText = `Victoria para ${fA}`;
        if (existing.result === 'VICTORY_B') resText = `Victoria para ${fB}`;

        const scoreInfo = existing.scoreText ? ` (${existing.scoreText})` : '';
        conflictText.textContent = `¡Cruce duplicado! Este combate ya se disputó el ${existing.date}${scoreInfo} [${resText}]. En liga a una vuelta no se repite cruce.`;
        return;
      }
    }

    // Hide conflict if none
    if (conflictBanner) conflictBanner.classList.add('hidden');

    // Condition 3: Missing fighter
    if (!idA || !idB) {
      saveBtn.disabled = false;
      saveBtn.classList.add('opacity-60');
      return;
    }

    // Fully valid to save!
    saveBtn.disabled = false;
    saveBtn.classList.remove('opacity-60', 'opacity-40', 'cursor-not-allowed');
  }

  async saveCombat() {
    if (!this.isAdmin && !this.isTestMode) {
      this.showToast('Acceso restringido: Introduce tu PIN de Rector', 'rose');
      this.openPinModal();
      return;
    }

    const selectA = document.getElementById('fighterASelect');
    const selectB = document.getElementById('fighterBSelect');
    const dateInput = document.getElementById('duelDateInput');
    const weaponInput = document.getElementById('duelWeaponInput');

    const fighterAId = selectA?.value;
    const fighterBId = selectB?.value;
    const fencerA = this.fencers.find(f => f.id === fighterAId);
    const fencerB = this.fencers.find(f => f.id === fighterBId);

    if (!fencerA || !fencerB) {
      this.showToast('Por favor selecciona a ambos tiradores (Alfa y Beta)', 'amber');
      return;
    }

    // Check repeat match one more time
    if (this.findExistingMatch(fighterAId, fighterBId)) {
      this.showToast('Este combate ya fue registrado este mes', 'rose');
      return;
    }

    const matchDate = dateInput?.value || new Date().toISOString().split('T')[0];
    const notes = weaponInput?.value?.trim() || '';

    const sA = this.scoreA !== undefined ? this.scoreA : 0;
    const sB = this.scoreB !== undefined ? this.scoreB : 0;

    // Calculate points and outcome automatically from score
    let pointsA = 0;
    let pointsB = 0;
    let winner = 'DRAW';

    if (sA > sB) {
      this.selectedResult = 'VICTORY_A';
      pointsA = 3;
      pointsB = 0;
      winner = fencerA.name;
    } else if (sB > sA) {
      this.selectedResult = 'VICTORY_B';
      pointsA = 0;
      pointsB = 3;
      winner = fencerB.name;
    } else {
      this.selectedResult = 'DRAW';
      pointsA = 1;
      pointsB = 1;
      winner = 'Empate';
    }

    const newMatch = {
      id: 'm-' + Date.now(),
      monthKey: this.currentMonthKey,
      date: matchDate,
      fighterAId: fencerA.id,
      fighterAName: fencerA.name,
      fighterBId: fencerB.id,
      fighterBName: fencerB.name,
      scoreA: sA,
      scoreB: sB,
      scoreText: `${sA} - ${sB}`,
      result: this.selectedResult,
      winner: winner,
      pointsA: pointsA,
      pointsB: pointsB,
      notes: notes,
      timestamp: new Date().toISOString()
    };

    // Optimistic local add
    this.matches.unshift(newMatch);
    this.saveLocalCache();

    // Reset inputs before re-rendering so renderDuelFormOptions does not preserve old values
    if (selectA) selectA.value = '';
    if (selectB) selectB.value = '';
    const scoreAInp = document.getElementById('scoreAInput');
    const scoreBInp = document.getElementById('scoreBInput');
    if (scoreAInp) scoreAInp.value = '0';
    if (scoreBInp) scoreBInp.value = '0';
    this.scoreA = 0;
    this.scoreB = 0;
    if (weaponInput) weaponInput.value = '';

    this.renderAll();
    this.showToast(`Combate guardado: ${fencerA.name} ${sA} - ${sB} ${fencerB.name}`, 'emerald');

    // Async sync with Google Sheets if configured
    if (this.sheetsUrl && this.sheetsUrl.startsWith('http')) {
      this.syncMatchToSheets(newMatch, 'saveMatch');
    }
  }

  async syncMatchToSheets(match, action = 'saveMatch') {
    try {
      this.setSyncStatus('Sincronizando Sheets...', 'amber');
      const response = await fetch(this.sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: action,
          monthKey: this.getActiveSheetsMonthKey(),
          match: match
        })
      });
      const res = await response.json();
      if (res.success) {
        const syncLabel = this.isTestMode ? 'Sheets (Modo Pruebas)' : 'Conectado a Sheets';
        this.setSyncStatus(syncLabel, 'emerald');
      } else {
        throw new Error(res.error || 'Error en Google Sheets');
      }
    } catch (err) {
      console.warn('Error al sincronizar con Google Sheets:', err);
      this.setSyncStatus('Guardado localmente (Sheets pendiente)', 'amber');
    }
  }

  renderHistory() {
    const list = document.getElementById('historyMatchesList');
    const countBadge = document.getElementById('historyMatchCount');
    const searchFilter = (document.getElementById('historySearchInput')?.value || '').toLowerCase().trim();

    if (countBadge) countBadge.textContent = this.matches.length;
    if (!list) return;

    let filtered = this.matches;
    if (searchFilter) {
      filtered = filtered.filter(m => 
        (m.fighterAName || '').toLowerCase().includes(searchFilter) ||
        (m.fighterBName || '').toLowerCase().includes(searchFilter)
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="bg-lsCard border border-lsBorder rounded-2xl p-8 text-center text-slate-500 text-xs">
          <i data-lucide="calendar-x" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          No hay combates registrados en este mes.
        </div>
      `;
      return;
    }

    const canDelete = this.isAdmin || this.isTestMode;

    list.innerHTML = filtered.map(m => {
      const sA = (typeof m.scoreA === 'number') ? m.scoreA : (m.result === 'VICTORY_A' ? 1 : 0);
      const sB = (typeof m.scoreB === 'number') ? m.scoreB : (m.result === 'VICTORY_B' ? 1 : 0);

      let resultBadge = '';
      if (m.result === 'VICTORY_A') {
        resultBadge = `
          <div class="flex items-center gap-1 text-xs font-combat font-black">
            <span class="text-cyan-400 text-sm px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">${sA}</span>
            <span class="text-slate-600">-</span>
            <span class="text-slate-400 text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">${sB}</span>
          </div>
          <span class="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">Victoria A</span>
        `;
      } else if (m.result === 'VICTORY_B') {
        resultBadge = `
          <div class="flex items-center gap-1 text-xs font-combat font-black">
            <span class="text-slate-400 text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">${sA}</span>
            <span class="text-slate-600">-</span>
            <span class="text-rose-400 text-sm px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25">${sB}</span>
          </div>
          <span class="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">Victoria B</span>
        `;
      } else {
        resultBadge = `
          <div class="flex items-center gap-1 text-xs font-combat font-black">
            <span class="text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25">${sA}</span>
            <span class="text-slate-600">-</span>
            <span class="text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25">${sB}</span>
          </div>
          <span class="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">Empate</span>
        `;
      }

      return `
        <div class="bg-lsCard border border-lsBorder rounded-xl p-3 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] text-slate-500 font-semibold">${m.date}</span>
              ${m.notes ? `<span class="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">${m.notes}</span>` : ''}
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-slate-200">
              <span class="${m.result === 'VICTORY_A' ? 'text-cyan-300' : 'text-slate-300'} truncate">
                ${m.fighterAName}
              </span>
              <span class="text-slate-600 px-2 font-display text-[10px]">VS</span>
              <span class="${m.result === 'VICTORY_B' ? 'text-rose-300' : 'text-slate-300'} truncate text-right">
                ${m.fighterBName}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-1 shrink-0 border-l border-slate-800/80 pl-3">
            ${resultBadge}
            ${canDelete ? `
              <button data-match-id="${m.id}" class="delete-match-btn text-[10px] text-rose-400/80 hover:text-rose-400 mt-1 transition-colors flex items-center gap-0.5 p-0.5 rounded hover:bg-rose-500/10">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Borrar
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Open Modal to confirm deletion of a single match
  openDeleteMatchModal(matchId) {
    if (!this.isAdmin && !this.isTestMode) {
      this.showToast('Acceso restringido: desbloquea modo Rector', 'rose');
      this.openPinModal();
      return;
    }

    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    this.matchPendingDeleteId = matchId;
    const modal = document.getElementById('deleteMatchModal');
    const detailsContainer = document.getElementById('deleteMatchDetailsText');

    const sA = (typeof match.scoreA === 'number') ? match.scoreA : (match.result === 'VICTORY_A' ? 1 : 0);
    const sB = (typeof match.scoreB === 'number') ? match.scoreB : (match.result === 'VICTORY_B' ? 1 : 0);

    let resDesc = `Empate (${sA} - ${sB})`;
    if (match.result === 'VICTORY_A') resDesc = `Victoria: ${match.fighterAName} (${sA} - ${sB})`;
    if (match.result === 'VICTORY_B') resDesc = `Victoria: ${match.fighterBName} (${sA} - ${sB})`;

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="font-bold text-slate-100">${match.fighterAName} vs ${match.fighterBName}</div>
        <div class="text-[10px] text-slate-400 mt-1">Fecha: ${match.date} &bull; ${resDesc}</div>
      `;
    }

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeDeleteMatchModal() {
    const modal = document.getElementById('deleteMatchModal');
    if (modal) modal.classList.add('hidden');
    this.matchPendingDeleteId = null;
  }

  async confirmDeleteMatch() {
    if (!this.matchPendingDeleteId) return;
    const matchId = this.matchPendingDeleteId;
    const matchToDelete = this.matches.find(m => m.id === matchId);

    this.matches = this.matches.filter(m => m.id !== matchId);
    this.saveLocalCache();
    this.closeDeleteMatchModal();
    this.renderAll();
    this.showToast('Combate eliminado del historial', 'amber');

    // Sync to Sheets
    if (this.sheetsUrl && this.sheetsUrl.startsWith('http') && matchToDelete) {
      try {
        await fetch(this.sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'deleteMatch',
            monthKey: this.getActiveSheetsMonthKey(),
            matchId: matchId
          })
        });
      } catch (e) {
        console.warn('Error al borrar en Sheets:', e);
      }
    }
  }

  // Open Modal to confirm resetting the active month's league
  openResetMonthModal() {
    if (!this.isAdmin && !this.isTestMode) {
      this.showToast('Se requiere modo Rector para resetear la liga', 'rose');
      this.openPinModal();
      return;
    }

    const modal = document.getElementById('resetMonthModal');
    const monthLabel = document.getElementById('resetModalMonthName');
    if (monthLabel) {
      const modeTag = this.isTestMode ? ' [Modo Pruebas]' : '';
      monthLabel.textContent = `${this.formatMonthLabel(this.currentMonthKey)}${modeTag}`;
    }

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeResetMonthModal() {
    const modal = document.getElementById('resetMonthModal');
    if (modal) modal.classList.add('hidden');
  }

  async confirmResetMonth() {
    const monthLabel = this.formatMonthLabel(this.currentMonthKey);
    const sheetsMonthKey = this.getActiveSheetsMonthKey();

    this.matches = [];
    this.saveLocalCache();
    this.closeResetMonthModal();
    this.renderAll();
    this.showToast(`Liga de ${monthLabel} reseteada`, 'amber');

    // Sync to Sheets
    if (this.sheetsUrl && this.sheetsUrl.startsWith('http')) {
      try {
        this.setSyncStatus('Limpiando hoja en Sheets...', 'amber');
        await fetch(this.sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'resetMonth',
            monthKey: sheetsMonthKey
          })
        });
        const syncLabel = this.isTestMode ? 'Sheets (Modo Pruebas)' : 'Conectado a Sheets';
        this.setSyncStatus(syncLabel, 'emerald');
      } catch (err) {
        console.warn('Error al resetear hoja en Sheets:', err);
      }
    }
  }

  renderFencersList() {
    const container = document.getElementById('fencersGridList');
    if (!container) return;

    container.innerHTML = this.fencers.map(f => `
      <div class="bg-lsCard border border-lsBorder rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full border-2 saber-ring-${f.color || 'cyan'} bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-100">
            ${this.getInitials(f.name)}
          </div>
          <div>
            <div class="font-bold text-xs text-slate-100">${f.name}</div>
            <div class="text-[10px] text-slate-400">${f.rank || 'Alumno'}</div>
          </div>
        </div>

        ${this.isAdmin || this.isTestMode ? `
          <div class="flex items-center gap-1">
            <button data-edit-fencer="${f.id}" class="edit-fencer-btn p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button data-delete-fencer="${f.id}" class="delete-fencer-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
              <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  saveFencerFromModal(e) {
    e.preventDefault();
    if (!this.isAdmin && !this.isTestMode) {
      this.showToast('Acceso restringido a administradores', 'rose');
      return;
    }

    const editId = document.getElementById('fencerEditId').value;
    const nameInput = document.getElementById('fencerNameInput');
    const rankInput = document.getElementById('fencerRankInput');
    const colorInput = document.getElementById('fencerColorInput');

    const name = nameInput.value.trim();
    if (!name) return;

    if (editId) {
      // Edit
      const f = this.fencers.find(item => item.id === editId);
      if (f) {
        f.name = name;
        f.rank = rankInput.value;
        f.color = colorInput.value;
      }
      this.showToast(`Tirador actualizado: ${name}`, 'emerald');
    } else {
      // Create
      const newFencer = {
        id: 'f-' + Date.now(),
        name: name,
        rank: rankInput.value,
        color: colorInput.value,
        joinedAt: new Date().toISOString().split('T')[0]
      };
      this.fencers.push(newFencer);
      this.showToast(`Nuevo alumno inscrito: ${name}`, 'emerald');
    }

    this.saveLocalCache();
    this.closeFencerModal();
    this.renderAll();

    // Async sync to Sheets if not in test mode (or test sync)
    if (this.sheetsUrl && this.sheetsUrl.startsWith('http') && !this.isTestMode) {
      fetch(this.sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveFencersList',
          fencers: this.fencers
        })
      }).catch(err => console.warn('Sync fencers error:', err));
    }
  }

  deleteFencer(fencerId) {
    if (!this.isAdmin && !this.isTestMode) return;
    const fencer = this.fencers.find(f => f.id === fencerId);
    if (!fencer) return;

    if (!confirm(`¿Eliminar a ${fencer.name} de la escuela?`)) return;

    this.fencers = this.fencers.filter(f => f.id !== fencerId);
    this.saveLocalCache();
    this.renderAll();
    this.showToast(`Alumno eliminado`, 'amber');
  }

  updateAdminUI() {
    const text = document.getElementById('adminStatusText');
    const btn = document.getElementById('adminAuthBtn');
    const duelLock = document.getElementById('duelAdminLockOverlay');
    const duelForm = document.getElementById('duelFormContainer');

    if (this.isAdmin) {
      if (text) text.textContent = 'Rector (Activo)';
      if (btn) {
        btn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
      }
      if (duelLock) duelLock.classList.add('hidden');
      if (duelForm) duelForm.classList.remove('hidden');
    } else {
      if (text) text.textContent = 'Rector';
      if (btn) {
        btn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500';
      }
      if (this.isTestMode) {
        if (duelLock) duelLock.classList.add('hidden');
        if (duelForm) duelForm.classList.remove('hidden');
      } else {
        if (duelLock) duelLock.classList.remove('hidden');
        if (duelForm) duelForm.classList.add('hidden');
      }
    }
  }

  openPinModal() {
    const modal = document.getElementById('pinModal');
    const input = document.getElementById('adminPinInput');
    const err = document.getElementById('pinErrorMsg');
    if (modal) modal.classList.remove('hidden');
    if (input) {
      input.value = '';
      input.focus();
    }
    if (err) err.classList.add('hidden');
  }

  closePinModal() {
    const modal = document.getElementById('pinModal');
    if (modal) modal.classList.add('hidden');
  }

  submitPin() {
    const input = document.getElementById('adminPinInput');
    const err = document.getElementById('pinErrorMsg');
    if (input && input.value === this.adminPin) {
      this.isAdmin = true;
      sessionStorage.setItem('ls_admin_logged', 'true');
      this.updateAdminUI();
      this.closePinModal();
      this.showToast('¡Modo Rector desbloqueado!', 'emerald');
      this.renderAll();
    } else {
      if (err) err.classList.remove('hidden');
    }
  }

  openFencerModal(editFencer = null) {
    const modal = document.getElementById('fencerModal');
    const title = document.getElementById('fencerModalTitle');
    const editId = document.getElementById('fencerEditId');
    const nameInput = document.getElementById('fencerNameInput');
    const rankInput = document.getElementById('fencerRankInput');
    const colorInput = document.getElementById('fencerColorInput');

    if (editFencer) {
      title.textContent = 'Modificar Tirador';
      editId.value = editFencer.id;
      nameInput.value = editFencer.name;
      rankInput.value = editFencer.rank || 'Iniciado';
      colorInput.value = editFencer.color || 'cyan';
    } else {
      title.textContent = 'Añadir Nuevo Tirador';
      editId.value = '';
      nameInput.value = '';
      rankInput.value = 'Iniciado';
      colorInput.value = 'cyan';
    }

    if (modal) modal.classList.remove('hidden');
    nameInput?.focus();
  }

  closeFencerModal() {
    const modal = document.getElementById('fencerModal');
    if (modal) modal.classList.add('hidden');
  }

  createNewMonth() {
    const input = prompt('Introduce el código del nuevo mes en formato MMYYYY (ej: 112026 para Noviembre 2026):');
    if (!input) return;
    const clean = input.trim().replace(/[^0-9]/g, '');
    if (clean.length !== 6) {
      alert('Formato no válido. Debe tener 6 dígitos numéricos: MMYYYY (ej: 112026)');
      return;
    }

    if (!this.availableMonths.includes(clean)) {
      this.availableMonths.unshift(clean);
      this.saveAvailableMonths();
    }
    this.switchMonth(clean);
  }

  switchMonth(mKey) {
    this.currentMonthKey = mKey;
    const dropdown = document.getElementById('monthDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    this.loadData();
    this.showToast(`Cambiado a ${this.formatMonthLabel(mKey)}`, 'cyan');
  }

  showToast(message, type = 'emerald') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColor = type === 'rose' ? 'border-rose-500/40 bg-slate-900 text-rose-300' :
                        type === 'amber' ? 'border-amber-500/40 bg-slate-900 text-amber-300' :
                        'border-cyan-500/40 bg-slate-900 text-cyan-300';

    toast.className = `p-3 rounded-xl border shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-auto animate-scaleUp ${borderColor}`;
    toast.innerHTML = `
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  getInitials(name) {
    if (!name) return 'LS';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        const targetId = tabBtn.getAttribute('data-tab');
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(section => {
          section.classList.add('hidden');
        });

        const activeSection = document.getElementById(targetId);
        if (activeSection) {
          activeSection.classList.remove('hidden');
        }

        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Test Mode Toggles
    document.getElementById('testModeToggleBtn')?.addEventListener('click', () => {
      this.toggleTestMode();
    });

    document.getElementById('testModeSettingsToggleBtn')?.addEventListener('click', () => {
      this.toggleTestMode();
    });

    document.getElementById('exitTestModeBtn')?.addEventListener('click', () => {
      this.toggleTestMode(false);
    });

    // Load Sample Test Data Buttons
    document.getElementById('loadSampleTestDataBtn')?.addEventListener('click', () => {
      this.loadSampleTestData();
    });

    document.getElementById('loadSampleDataSettingsBtn')?.addEventListener('click', () => {
      this.loadSampleTestData();
    });

    // Month Dropdown Toggle
    const monthBtn = document.getElementById('monthSelectorBtn');
    const monthDropdown = document.getElementById('monthDropdown');
    if (monthBtn && monthDropdown) {
      monthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        monthDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        monthDropdown.classList.add('hidden');
      });
    }

    // Month item selection
    document.getElementById('monthsListContainer')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.month-option-btn');
      if (btn) {
        const mKey = btn.getAttribute('data-month');
        this.switchMonth(mKey);
      }
    });

    // New Month Button
    document.getElementById('newMonthBtn')?.addEventListener('click', () => {
      this.createNewMonth();
    });

    // Admin Auth Button
    document.getElementById('adminAuthBtn')?.addEventListener('click', () => {
      if (this.isAdmin) {
        if (confirm('¿Cerrar sesión de Rector?')) {
          this.isAdmin = false;
          sessionStorage.removeItem('ls_admin_logged');
          this.updateAdminUI();
          this.showToast('Sesión de Rector cerrada');
        }
      } else {
        this.openPinModal();
      }
    });

    // Unlock Admin from Duel lock overlay
    document.getElementById('unlockAdminFromDuelBtn')?.addEventListener('click', () => {
      this.openPinModal();
    });

    // PIN modal buttons
    document.getElementById('cancelPinBtn')?.addEventListener('click', () => this.closePinModal());
    document.getElementById('submitPinBtn')?.addEventListener('click', () => this.submitPin());
    document.getElementById('adminPinInput')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.submitPin();
    });

    // Refresh Data Button
    document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
      this.loadData();
      this.showToast('Datos actualizados', 'cyan');
    });

    // Ranking search
    document.getElementById('rankingSearchInput')?.addEventListener('input', () => {
      this.renderRanking();
    });

    // History search
    document.getElementById('historySearchInput')?.addEventListener('input', () => {
      this.renderHistory();
      if (window.lucide) window.lucide.createIcons();
    });

    // Duel fighter selects change & input
    document.getElementById('fighterASelect')?.addEventListener('change', () => this.updateDuelScoreAndOutcome());
    document.getElementById('fighterASelect')?.addEventListener('input', () => this.updateDuelScoreAndOutcome());
    document.getElementById('fighterBSelect')?.addEventListener('change', () => this.updateDuelScoreAndOutcome());
    document.getElementById('fighterBSelect')?.addEventListener('input', () => this.updateDuelScoreAndOutcome());

    // Scoreboard Increment / Decrement Steppers
    document.getElementById('btnScoreADec')?.addEventListener('click', () => {
      const inp = document.getElementById('scoreAInput');
      if (inp) {
        inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) - 1);
        this.updateDuelScoreAndOutcome();
      }
    });

    document.getElementById('btnScoreAInc')?.addEventListener('click', () => {
      const inp = document.getElementById('scoreAInput');
      if (inp) {
        inp.value = (parseInt(inp.value, 10) || 0) + 1;
        this.updateDuelScoreAndOutcome();
      }
    });

    document.getElementById('btnScoreBDec')?.addEventListener('click', () => {
      const inp = document.getElementById('scoreBInput');
      if (inp) {
        inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) - 1);
        this.updateDuelScoreAndOutcome();
      }
    });

    document.getElementById('btnScoreBInc')?.addEventListener('click', () => {
      const inp = document.getElementById('scoreBInput');
      if (inp) {
        inp.value = (parseInt(inp.value, 10) || 0) + 1;
        this.updateDuelScoreAndOutcome();
      }
    });

    document.getElementById('scoreAInput')?.addEventListener('input', () => this.updateDuelScoreAndOutcome());
    document.getElementById('scoreBInput')?.addEventListener('input', () => this.updateDuelScoreAndOutcome());

    // Quick Score Preset Buttons Delegation
    document.querySelectorAll('.score-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sa = parseInt(btn.getAttribute('data-sa'), 10) || 0;
        const sb = parseInt(btn.getAttribute('data-sb'), 10) || 0;
        const inpA = document.getElementById('scoreAInput');
        const inpB = document.getElementById('scoreBInput');
        if (inpA) inpA.value = sa;
        if (inpB) inpB.value = sb;
        this.updateDuelScoreAndOutcome();
      });
    });

    // Save Combat
    document.getElementById('saveDuelBtn')?.addEventListener('click', () => this.saveCombat());

    // Pending Matchups Quick Click
    document.getElementById('pendingDuelsList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-pair-btn');
      if (btn) {
        const fa = btn.getAttribute('data-fa');
        const fb = btn.getAttribute('data-fb');
        const selectA = document.getElementById('fighterASelect');
        const selectB = document.getElementById('fighterBSelect');
        if (selectA && selectB) {
          selectA.value = fa;
          selectB.value = fb;
          this.updateDuelScoreAndOutcome();
          this.showToast('Cruce cargado en el formulario', 'cyan');
        }
      }
    });

    // Delete single match from history (opens confirmation modal)
    document.getElementById('historyMatchesList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-match-btn');
      if (btn) {
        const id = btn.getAttribute('data-match-id');
        this.openDeleteMatchModal(id);
      }
    });

    // Confirm Delete Match Modal buttons
    document.getElementById('cancelDeleteMatchBtn')?.addEventListener('click', () => this.closeDeleteMatchModal());
    document.getElementById('confirmDeleteMatchBtn')?.addEventListener('click', () => this.confirmDeleteMatch());

    // Reset Current Month Modal triggers & buttons
    document.getElementById('openResetMonthModalBtn')?.addEventListener('click', () => this.openResetMonthModal());
    document.getElementById('resetCurrentMonthDataBtn')?.addEventListener('click', () => this.openResetMonthModal());
    document.getElementById('cancelResetMonthBtn')?.addEventListener('click', () => this.closeResetMonthModal());
    document.getElementById('confirmResetMonthBtn')?.addEventListener('click', () => this.confirmResetMonth());

    // Open Add Fencer Modal
    document.getElementById('addFencerModalOpenBtn')?.addEventListener('click', () => {
      if (!this.isAdmin && !this.isTestMode) {
        this.showToast('Se requiere modo Rector para registrar alumnos', 'rose');
        this.openPinModal();
        return;
      }
      this.openFencerModal();
    });

    document.getElementById('closeFencerModalBtn')?.addEventListener('click', () => this.closeFencerModal());
    document.getElementById('cancelFencerFormBtn')?.addEventListener('click', () => this.closeFencerModal());
    document.getElementById('fencerForm')?.addEventListener('submit', (e) => this.saveFencerFromModal(e));

    // Edit/Delete Fencer delegation
    document.getElementById('fencersGridList')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-fencer-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-edit-fencer');
        const f = this.fencers.find(item => item.id === id);
        if (f) this.openFencerModal(f);
      }

      const delBtn = e.target.closest('.delete-fencer-btn');
      if (delBtn) {
        const id = delBtn.getAttribute('data-delete-fencer');
        this.deleteFencer(id);
      }
    });

    // Settings: Save Google Sheets URL
    document.getElementById('saveSheetsUrlBtn')?.addEventListener('click', () => {
      const input = document.getElementById('sheetsUrlInput');
      const val = input ? input.value.trim() : '';
      this.sheetsUrl = val;
      localStorage.setItem('ls_sheets_url', val);
      this.showToast('URL de Google Sheets guardada', 'emerald');
      this.loadData();
    });

    // Settings: Test Sheets
    document.getElementById('testSheetsBtn')?.addEventListener('click', async () => {
      const input = document.getElementById('sheetsUrlInput');
      const url = input?.value?.trim();
      if (!url) {
        alert('Por favor introduce primero la URL de Google Sheets.');
        return;
      }
      try {
        this.showToast('Probando conexión...', 'amber');
        const res = await fetch(`${url}?action=ping`);
        const json = await res.json();
        if (json.success || json.status === 'ok') {
          this.showToast('¡Conexión con Google Sheets exitosa!', 'emerald');
        } else {
          alert('Respuesta recibida pero sin formato esperado: ' + JSON.stringify(json));
        }
      } catch (err) {
        alert('Error al conectar con la URL: ' + err.message + '\n\nRevisa que hayas implementado la aplicación web con acceso "Cualquier usuario" (Anyone).');
      }
    });

    // Settings: Change PIN
    document.getElementById('savePinBtn')?.addEventListener('click', () => {
      const pinInput = document.getElementById('changePinInput');
      const val = pinInput?.value?.trim();
      if (!val || val.length < 4) {
        alert('El PIN debe tener al menos 4 dígitos o caracteres.');
        return;
      }
      this.adminPin = val;
      localStorage.setItem('ls_admin_pin', val);
      pinInput.value = '';
      this.showToast('PIN de Rector actualizado con éxito', 'emerald');
    });

    // Settings: Export JSON
    document.getElementById('exportDataJsonBtn')?.addEventListener('click', () => {
      const backup = {
        exportedAt: new Date().toISOString(),
        currentMonthKey: this.currentMonthKey,
        isTestMode: this.isTestMode,
        availableMonths: this.availableMonths,
        fencers: this.fencers,
        matches: this.matches
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const modePrefix = this.isTestMode ? 'test_' : '';
      a.download = `ludosport_${modePrefix}backup_${this.currentMonthKey}_${Date.now()}.json`;
      a.click();
      this.showToast('Copia de seguridad descargada', 'cyan');
    });

    // Settings: Import JSON
    document.getElementById('importDataInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.fencers) this.fencers = data.fencers;
          if (data.matches) this.matches = data.matches;
          if (data.availableMonths) this.availableMonths = data.availableMonths;
          this.saveLocalCache();
          this.saveAvailableMonths();
          this.renderAll();
          this.showToast('Datos importados correctamente', 'emerald');
        } catch (err) {
          alert('Error al leer el archivo JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LudoSportApp();
});
