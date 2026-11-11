/**
 * LudoSport Arena - Liga Mensual
 * Full-Stack Logic & State Management
 */

// Initial Seed Fencers (LudoSport School Pupils)
const DEFAULT_FENCERS = [
  { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-3', name: 'Mario Ferrer', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-4', name: 'Isa Liria', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-5', name: 'Ulises Carmona', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-6', name: 'Paula Carmona', rank: 'Novizio', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-7', name: 'Alberto Delgado', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-8', name: 'Rogelio Carceles', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-9', name: 'Patricia Urquiza', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-10', name: 'Saúl García-Abadillo', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-11', name: 'Virginia García', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-12', name: 'Andrés Saavedra', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-13', name: 'Emilio Valverde', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
  { id: 'f-14', name: 'Trino Góngora', rank: 'Instructor', color: 'emerald', joinedAt: '2026-01-01', photoUrl: '' }
];

// Months Name Dictionary (Spanish)
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Supabase Configuration (Configurada dinámicamente por el usuario desde Ajustes y persistida en LocalStorage)
function normalizeSupabaseUrl(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/project\/([a-z0-9_-]+)/i);
  if (match) return `https://${match[1]}.supabase.co`;
  if (!trimmed.startsWith('http')) return `https://${trimmed}.supabase.co`;
  return trimmed.replace(/\/+$/, '');
}

class LudoSportApp {
  constructor() {
    this.currentMonthKey = this.getDefaultMonthKey();
    this.isAdmin = false;
    this.isTestMode = false;
    this.adminPin = '1234';
    this.supabaseUrl = localStorage.getItem('ls_supabase_url') || '';
    this.supabaseKey = localStorage.getItem('ls_supabase_key') || '';
    this.supabase = null;
    this.fencers = [];
    this.matches = []; // matches for the active month
    this.availableMonths = [];
    this.scoreA = 0;
    this.scoreB = 0;
    this.selectedResult = 'DRAW'; // automatically calculated
    this.matchPendingDeleteId = null;
    this.isSyncing = false;

    // Live Scoreboard & Timer State
    this.liveFighterAId = '';
    this.liveFighterBId = '';
    this.liveScoreA = 0;
    this.liveScoreB = 0;
    this.timerSeconds = 120; // 2 minutes official bout
    this.timerInterval = null;
    this.timerRunning = false;
    this.isSoundEnabled = true;
    this.isPisteMode = false;
    this.currentProfileFencerId = null;

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

  getActiveDbMonthKey() {
    return this.isTestMode ? `TEST_${this.currentMonthKey}` : this.currentMonthKey;
  }

  initSupabaseClient() {
    try {
      const normalizedUrl = normalizeSupabaseUrl(this.supabaseUrl);
      if (window.supabase && typeof window.supabase.createClient === 'function' && normalizedUrl && this.supabaseKey) {
        this.supabase = window.supabase.createClient(normalizedUrl, this.supabaseKey);
      } else {
        this.supabase = null;
      }
    } catch (e) {
      console.warn('Fallo al inicializar cliente de Supabase:', e);
      this.supabase = null;
    }
  }

  // Consulta el endpoint serverless /api/config de Vercel (obtiene credenciales desde variables de entorno)
  async fetchRemoteConfig() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        if (data && data.configured && data.url && data.key) {
          this.supabaseUrl = data.url;
          this.supabaseKey = data.key;
          this.initSupabaseClient();
          const urlInput = document.getElementById('supabaseUrlInput');
          if (urlInput) urlInput.value = this.supabaseUrl;
          const keyInput = document.getElementById('supabaseKeyInput');
          if (keyInput) keyInput.value = this.supabaseKey;
          return true;
        }
      }
    } catch (e) {
      // Entorno local sin serverless o sin conexión
    }
    return false;
  }

  // --- Mappers between Frontend (camelCase) and Supabase (snake_case) ---
  fencerToDb(f) {
    return {
      id: String(f.id),
      name: String(f.name),
      rank: String(f.rank || 'Inizziato'),
      color: String(f.color || 'cyan'),
      joined_at: String(f.joinedAt || new Date().toISOString().split('T')[0]),
      photo_url: String(f.photoUrl || '')
    };
  }

  fencerFromDb(row) {
    return {
      id: String(row.id),
      name: String(row.name),
      rank: String(row.rank || 'Inizziato'),
      color: String(row.color || 'cyan'),
      joinedAt: String(row.joined_at || ''),
      photoUrl: String(row.photo_url || '')
    };
  }

  matchToDb(m) {
    return {
      id: String(m.id),
      date: String(m.date),
      fighter_a_id: String(m.fighterAId),
      fighter_a_name: String(m.fighterAName),
      fighter_b_id: String(m.fighterBId),
      fighter_b_name: String(m.fighterBName),
      result: String(m.result),
      points_a: Number(m.pointsA || 0),
      points_b: Number(m.pointsB || 0),
      winner: String(m.winner),
      notes: String(m.notes || ''),
      score_a: Number(m.scoreA !== undefined ? m.scoreA : 0),
      score_b: Number(m.scoreB !== undefined ? m.scoreB : 0),
      score_text: String(m.scoreText || `${m.scoreA || 0} - ${m.scoreB || 0}`),
      month_key: String(m.monthKey || this.getActiveDbMonthKey()),
      timestamp: String(m.timestamp || new Date().toISOString())
    };
  }

  matchFromDb(row) {
    return {
      id: String(row.id),
      date: String(row.date),
      fighterAId: String(row.fighter_a_id),
      fighterAName: String(row.fighter_a_name),
      fighterBId: String(row.fighter_b_id),
      fighterBName: String(row.fighter_b_name),
      result: String(row.result),
      pointsA: Number(row.points_a || 0),
      pointsB: Number(row.points_b || 0),
      winner: String(row.winner),
      notes: String(row.notes || ''),
      timestamp: String(row.timestamp || ''),
      scoreA: Number(row.score_a !== undefined ? row.score_a : (row.result === 'VICTORY_A' ? 1 : 0)),
      scoreB: Number(row.score_b !== undefined ? row.score_b : (row.result === 'VICTORY_B' ? 1 : 0)),
      scoreText: String(row.score_text || `${row.score_a || 0} - ${row.score_b || 0}`),
      monthKey: String(row.month_key || '')
    };
  }

  async seedInitialFencers() {
    if (!this.supabase) return;
    try {
      const rows = DEFAULT_FENCERS.map(f => this.fencerToDb(f));
      const { error } = await this.supabase.from('fencers').upsert(rows);
      if (error) {
        console.warn('Aviso al sembrar tiradores en Supabase:', error.message);
      } else {
        console.log('Semilla inicial de 14 tiradores cargada con éxito en Supabase');
      }
    } catch (e) {
      console.warn('Excepción al sembrar tiradores en Supabase:', e);
    }
  }

  init() {
    this.loadLocalConfig();
    this.initSupabaseClient();
    this.setupEventListeners();
    this.updateTestModeUI();
    this.renderMonthSelector();
    this.updateAdminUI();
    this.loadData();
    this.updateDuelScoreAndOutcome();
    this.initLiveScoreboard();
    
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

    const storedSupabaseUrl = localStorage.getItem('ls_supabase_url');
    if (storedSupabaseUrl) this.supabaseUrl = storedSupabaseUrl;
    const storedSupabaseKey = localStorage.getItem('ls_supabase_key');
    if (storedSupabaseKey) this.supabaseKey = storedSupabaseKey;

    const urlInput = document.getElementById('supabaseUrlInput');
    if (urlInput) urlInput.value = this.supabaseUrl;
    const keyInput = document.getElementById('supabaseKeyInput');
    if (keyInput) keyInput.value = this.supabaseKey;

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
        fighterAName: 'Mar Garcia',
        fighterBId: 'f-2',
        fighterBName: 'Auri Haro',
        scoreA: 2,
        scoreB: 0,
        scoreText: '2 - 0',
        result: 'VICTORY_A',
        winner: 'Mar Garcia',
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
        fighterAName: 'Mario Ferrer',
        fighterBId: 'f-5',
        fighterBName: 'Ulises Carmona',
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
        fighterAName: 'Isa Liria',
        fighterBId: 'f-7',
        fighterBName: 'Alberto Delgado',
        scoreA: 0,
        scoreB: 2,
        scoreText: '0 - 2',
        result: 'VICTORY_B',
        winner: 'Alberto Delgado',
        pointsA: 0,
        pointsB: 3,
        notes: 'Forma 2',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'm-demo-4',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-6',
        fighterAName: 'Paula Carmona',
        fighterBId: 'f-8',
        fighterBName: 'Rogelio Carceles',
        scoreA: 3,
        scoreB: 1,
        scoreText: '3 - 1',
        result: 'VICTORY_A',
        winner: 'Paula Carmona',
        pointsA: 3,
        pointsB: 0,
        notes: 'Ataques veloces',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'm-demo-5',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-13',
        fighterAName: 'Emilio Valverde',
        fighterBId: 'f-14',
        fighterBName: 'Trino Góngora',
        scoreA: 1,
        scoreB: 2,
        scoreText: '1 - 2',
        result: 'VICTORY_B',
        winner: 'Trino Góngora',
        pointsA: 0,
        pointsB: 3,
        notes: 'Duelo técnico de exhibición',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
      },
      {
        id: 'm-demo-6',
        monthKey: this.currentMonthKey,
        date: today,
        fighterAId: 'f-9',
        fighterAName: 'Patricia Urquiza',
        fighterBId: 'f-10',
        fighterBName: 'Saúl García-Abadillo',
        scoreA: 1,
        scoreB: 0,
        scoreText: '1 - 0',
        result: 'VICTORY_A',
        winner: 'Patricia Urquiza',
        pointsA: 3,
        pointsB: 0,
        notes: 'Defensa sólida y contra',
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
    
    // Si no hay cliente activo, resolver configuración desde /api/config
    if (!this.supabase) {
      await this.fetchRemoteConfig();
    }

    // 1. Intentar cargar desde Supabase si el cliente está listo
    if (this.supabase) {
      try {
        // A. Cargar fencers
        let { data: fencersData, error: fError } = await this.supabase
          .from('fencers')
          .select('*')
          .order('name');

        if (fError) {
          if (fError.code === 'PGRST205') {
            console.warn('Tablas de Supabase no creadas aún. Por favor ejecuta el archivo supabase_schema.sql en el SQL Editor de Supabase.');
          }
          throw fError;
        }

        // Sembrado automático si la tabla de fencers está vacía
        if (!fencersData || fencersData.length === 0) {
          await this.seedInitialFencers();
          const refetch = await this.supabase.from('fencers').select('*').order('name');
          fencersData = refetch.data || [];
        }

        if (fencersData && fencersData.length > 0) {
          this.fencers = fencersData.map(f => this.fencerFromDb(f));
        } else {
          this.fencers = [...DEFAULT_FENCERS];
        }

        // B. Cargar combates del mes activo
        const activeMonthKey = this.getActiveDbMonthKey();
        const { data: matchesData, error: mError } = await this.supabase
          .from('matches')
          .select('*')
          .eq('month_key', activeMonthKey)
          .order('timestamp', { ascending: false });

        if (mError) throw mError;

        this.matches = (matchesData || []).map(m => this.matchFromDb(m));
        this.saveLocalCache();

        const syncLabel = this.isTestMode ? 'Supabase (Modo Pruebas)' : 'Conectado a Supabase';
        this.setSyncStatus(syncLabel, 'emerald');
        this.renderAll();
        return;
      } catch (err) {
        console.warn('Fallo al conectar con Supabase, usando almacenamiento local:', err);
        const offlineLabel = this.isTestMode ? 'Pruebas Local (Offline)' : 'Modo Local (Offline)';
        this.setSyncStatus(offlineLabel, 'amber');
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
    const ROSTER_VERSION = 'v2_official_ludosport_roster';
    const storedVersion = localStorage.getItem('ls_roster_version');

    if (storedFencers && storedVersion === ROSTER_VERSION) {
      try {
        this.fencers = JSON.parse(storedFencers);
        this.fencers.forEach(f => {
          if (f.photoUrl === undefined) f.photoUrl = '';
        });
      } catch (e) {
        this.fencers = [...DEFAULT_FENCERS];
      }
    } else {
      this.fencers = [...DEFAULT_FENCERS];
      localStorage.setItem(fencersKey, JSON.stringify(this.fencers));
      localStorage.setItem('ls_roster_version', ROSTER_VERSION);
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
    this.renderMonthlyMedals();
    this.renderDuelFormOptions();
    this.renderLiveScoreboardOptions();
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
          <div data-fencer-profile="${second.fencer.id}" title="Ver perfil de ${second.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-slate-700/60 flex flex-col items-center justify-end text-center pt-4 hover:border-slate-500 transition-all">
            <span class="w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs flex items-center justify-center mb-1">2</span>
            <div class="mb-1.5 shadow-md">
              ${this.getFencerAvatarHtml(second.fencer, 'w-10 h-10', true)}
            </div>
            <div class="font-bold text-xs text-slate-200 truncate w-full">${second.fencer.name}</div>
            <div class="text-[10px] text-slate-400">${second.points} pts &bull; ${second.won}V &bull; Dif ${second.diff >= 0 ? '+' : ''}${second.diff}</div>
          </div>

          <!-- 1st Place (Gold / Crown) -->
          <div data-fencer-profile="${first.fencer.id}" title="Ver perfil de ${first.fencer.name}" class="podium-card cursor-pointer p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard border border-amber-500/50 flex flex-col items-center justify-end text-center pt-2 relative shadow-lg shadow-amber-500/10 hover:border-amber-400 transition-all">
            <i data-lucide="crown" class="w-5 h-5 text-amber-400 mb-0.5 animate-bounce"></i>
            <div class="mb-1.5 shadow-lg shadow-amber-500/30">
              ${this.getFencerAvatarHtml(first.fencer, 'w-12 h-12', true)}
            </div>
            <div class="font-bold text-xs text-amber-300 truncate w-full">${first.fencer.name}</div>
            <div class="text-[11px] font-bold text-slate-200">${first.points} pts</div>
            <div class="text-[10px] text-amber-400/80">${first.won}V &bull; Dif ${first.diff >= 0 ? '+' : ''}${first.diff}</div>
          </div>

          <!-- 3rd Place -->
          <div data-fencer-profile="${third.fencer.id}" title="Ver perfil de ${third.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-amber-700/40 flex flex-col items-center justify-end text-center pt-4 hover:border-amber-600 transition-all">
            <span class="w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 font-bold text-xs flex items-center justify-center mb-1">3</span>
            <div class="mb-1.5 shadow-md">
              ${this.getFencerAvatarHtml(third.fencer, 'w-10 h-10', true)}
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

        let diffBadge = `<span class="text-slate-500 font-combat font-semibold text-xs">0</span>`;
        if (item.diff > 0) {
          diffBadge = `<span class="text-emerald-400 font-combat font-bold text-xs">+${item.diff}</span>`;
        } else if (item.diff < 0) {
          diffBadge = `<span class="text-rose-400 font-combat font-bold text-xs">${item.diff}</span>`;
        }

        return `
          <tr data-fencer-profile="${item.fencer.id}" title="Clic para ver perfil y estadísticas de ${item.fencer.name}" class="hover:bg-slate-800/40 transition-colors cursor-pointer">
            <td class="py-2.5 pl-3 pr-2 text-center">${posBadge}</td>
            <td class="py-2.5 px-2">
              <div class="flex items-center gap-2">
                ${this.getFencerAvatarHtml(item.fencer, 'w-7 h-7', true)}
                <div>
                  <div class="font-bold text-slate-100 flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                    ${item.fencer.name}
                  </div>
                  <div class="mt-0.5">${this.getRankBadge(item.fencer.rank)}</div>
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

  // Render Monthly Medals and Badges block
  renderMonthlyMedals() {
    const container = document.getElementById('monthlyMedalsSection');
    if (!container) return;

    const badgesService = window.LeagueBadgesService;
    if (!badgesService) {
      container.innerHTML = '';
      return;
    }

    const badges = badgesService.calculateMonthlyBadges(
      this.matches,
      this.fencers,
      this.currentMonthKey
    );

    const monthLabel = this.formatMonthLabel(this.currentMonthKey);

    const badgesCardsHtml = badges.map(badge => {
      const colorScheme = {
        amber: {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          bg: 'from-amber-500/10 via-lsCard to-lsCard',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeText: 'text-amber-300',
          statText: 'text-amber-400'
        },
        cyan: {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          bg: 'from-cyan-500/10 via-lsCard to-lsCard',
          iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          badgeText: 'text-cyan-300',
          statText: 'text-cyan-400'
        },
        emerald: {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'from-emerald-500/10 via-lsCard to-lsCard',
          iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          badgeText: 'text-emerald-300',
          statText: 'text-emerald-400'
        },
        purple: {
          border: 'border-purple-500/30 hover:border-purple-500/60',
          bg: 'from-purple-500/10 via-lsCard to-lsCard',
          iconBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          badgeText: 'text-purple-300',
          statText: 'text-purple-400'
        },
        rose: {
          border: 'border-rose-500/30 hover:border-rose-500/60',
          bg: 'from-rose-500/10 via-lsCard to-lsCard',
          iconBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          badgeText: 'text-rose-300',
          statText: 'text-rose-400'
        }
      }[badge.color] || {
        border: 'border-slate-700/60 hover:border-slate-500',
        bg: 'from-slate-800/40 via-lsCard to-lsCard',
        iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
        badgeText: 'text-slate-200',
        statText: 'text-slate-400'
      };

      let winnersHtml = '';
      let tooltipContent = '';

      if (badge.hasWinner) {
        if (badge.isTie) {
          const names = badge.winners.map(w => w.fencer ? w.fencer.name : 'Tirador').join(', ');
          const avatars = badge.winners.map(w => 
            `<div data-fencer-profile="${w.fencerId}" title="Ver perfil de ${w.fencer ? w.fencer.name : ''}" class="hover:scale-110 transition-transform">
              ${this.getFencerAvatarHtml(w.fencer, 'w-6 h-6', true)}
            </div>`
          ).join('');

          winnersHtml = `
            <div class="flex items-center gap-2 mt-2">
              <div class="flex items-center -space-x-1.5 shrink-0">
                ${avatars}
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-slate-200 truncate" title="${names}">
                  ${names} <span class="text-[10px] text-amber-400/90 font-normal">(Empate)</span>
                </div>
                <div class="text-[11px] font-combat font-bold ${colorScheme.statText}">
                  ${badge.winners[0].formattedValue}
                </div>
              </div>
            </div>
          `;
          tooltipContent = `${badge.title}: ${names} (${badge.winners[0].formattedValue} en ${monthLabel}). ${badge.description}`;
        } else {
          const winner = badge.winners[0];
          winnersHtml = `
            <div data-fencer-profile="${winner.fencerId}" title="Ver perfil de ${winner.fencer ? winner.fencer.name : ''}" class="flex items-center gap-2.5 mt-2 cursor-pointer group/winner">
              <div class="group-hover/winner:scale-105 transition-transform">
                ${this.getFencerAvatarHtml(winner.fencer, 'w-8 h-8', true)}
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-slate-100 truncate group-hover/winner:text-cyan-300 transition-colors">
                  ${winner.fencer ? winner.fencer.name : ''}
                </div>
                <div class="text-[11px] font-combat font-bold ${colorScheme.statText}">
                  ${winner.formattedValue}
                </div>
              </div>
            </div>
          `;
          tooltipContent = `${badge.title}: ${winner.fencer ? winner.fencer.name : ''} (${winner.formattedValue} en ${monthLabel}). ${badge.description}`;
        }
      } else {
        winnersHtml = `
          <div class="mt-2.5 py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-500 italic flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3 h-3 text-slate-600 shrink-0"></i>
            <span class="truncate">${badge.emptyStateText}</span>
          </div>
        `;
        tooltipContent = `${badge.title}: ${badge.description} (Actualmente sin clasificados)`;
      }

      return `
        <div class="badge-card relative p-3 rounded-2xl bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} shadow-lg transition-all"
             tabindex="0"
             role="region"
             aria-label="${badge.title}">
          
          <!-- Tooltip Popover (Hover & Touch focus) -->
          <div class="badge-tooltip bg-slate-950/95 text-slate-200 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-[11px] leading-tight pointer-events-none">
            <div class="font-bold text-xs flex items-center gap-1 mb-1 ${colorScheme.badgeText}">
              <span>${badge.emoji}</span>
              <span>${badge.title}</span>
            </div>
            <p class="text-slate-300 text-[10px] leading-normal">${tooltipContent}</p>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-6 h-6 rounded-lg ${colorScheme.iconBg} border flex items-center justify-center text-xs shrink-0">
                <i data-lucide="${badge.icon}" class="w-3.5 h-3.5"></i>
              </div>
              <span class="font-display font-bold text-xs ${colorScheme.badgeText} truncate">
                ${badge.title}
              </span>
            </div>
            <span class="text-xs select-none">${badge.emoji}</span>
          </div>

          ${winnersHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="bg-lsCard border border-lsBorder rounded-2xl p-3.5 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <i data-lucide="medal" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-display text-xs sm:text-sm font-bold text-slate-100 tracking-wide flex items-center gap-1.5">
                <span>Medallero & Títulos del Mes</span>
                <span class="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ${monthLabel}
                </span>
              </h3>
              <p class="text-[10px] text-slate-400">Premios automáticos calculados en vivo según rendimiento de la liga</p>
            </div>
          </div>
          <span class="text-[10px] text-slate-500 font-combat">5 Categorías</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          ${badgesCardsHtml}
        </div>
      </div>
    `;
  }

  renderDuelFormOptions() {
    const selectA = document.getElementById('fighterASelect');
    const selectB = document.getElementById('fighterBSelect');

    if (!selectA || !selectB) return;

    const currentA = selectA.value;
    const currentB = selectB.value;

    const optionsHtml = `
      <option value="">-- Seleccionar Tirador --</option>
      ${this.fencers.map(f => `<option value="${f.id}">${f.name} (${f.rank || 'Inizziato'})</option>`).join('')}
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

    // Async sync with Supabase if configured
    if (this.supabase) {
      this.syncMatchToSupabase(newMatch);
    }
  }

  async syncMatchToSupabase(match) {
    if (!this.supabase) return;
    try {
      this.setSyncStatus('Sincronizando Supabase...', 'amber');
      const dbRow = this.matchToDb(match);
      const { error } = await this.supabase.from('matches').upsert(dbRow);
      if (error) throw error;
      const syncLabel = this.isTestMode ? 'Supabase (Modo Pruebas)' : 'Conectado a Supabase';
      this.setSyncStatus(syncLabel, 'emerald');
    } catch (err) {
      console.warn('Error al sincronizar con Supabase:', err);
      this.setSyncStatus('Guardado localmente (Supabase pendiente)', 'amber');
    }
  }

  renderHistory() {
    this.renderHistoryPastMonthsList();
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

  // Render clickable pills of all registered months in History tab
  renderHistoryPastMonthsList() {
    const container = document.getElementById('historyPastMonthsList');
    const countBadge = document.getElementById('historyPastMonthsCount');
    if (!container) return;

    if (countBadge) {
      countBadge.textContent = `${this.availableMonths.length} meses registrados`;
    }

    container.innerHTML = this.availableMonths.map(mKey => {
      const isSelected = mKey === this.currentMonthKey;
      return `
        <button type="button" data-month="${mKey}" class="history-month-pill-btn px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          isSelected 
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20' 
            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
        }">
          <span>${this.formatMonthLabel(mKey)}</span>
          ${isSelected ? ' <span class="text-cyan-400 font-bold">&bull;</span>' : ''}
        </button>
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

    // Sync to Supabase
    if (this.supabase && matchToDelete) {
      try {
        await this.supabase.from('matches').delete().eq('id', matchId);
      } catch (e) {
        console.warn('Error al borrar en Supabase:', e);
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
    const activeMonthKey = this.getActiveDbMonthKey();

    this.matches = [];
    this.saveLocalCache();
    this.closeResetMonthModal();
    this.renderAll();
    this.showToast(`Liga de ${monthLabel} reseteada`, 'amber');

    // Sync to Supabase
    if (this.supabase) {
      try {
        this.setSyncStatus('Limpiando en Supabase...', 'amber');
        await this.supabase.from('matches').delete().eq('month_key', activeMonthKey);
        const syncLabel = this.isTestMode ? 'Supabase (Modo Pruebas)' : 'Conectado a Supabase';
        this.setSyncStatus(syncLabel, 'emerald');
      } catch (err) {
        console.warn('Error al resetear en Supabase:', err);
      }
    }
  }

  renderFencersList() {
    const container = document.getElementById('fencersGridList');
    if (!container) return;

    container.innerHTML = this.fencers.map(f => {
      const saberColorLabel = this.getSaberColorName(f.color);
      return `
        <div class="bg-lsCard border border-lsBorder rounded-xl p-3 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
          <div data-fencer-profile="${f.id}" title="Ver perfil de ${f.name}" class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group">
            ${this.getFencerAvatarHtml(f, 'w-10 h-10', true)}
            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-100 truncate group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>${f.name}</span>
                <i data-lucide="chevron-right" class="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                ${this.getRankBadge(f.rank)}
                <span class="text-[10px] text-slate-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full ${f.color === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'}"></span>
                  ${saberColorLabel}
                </span>
              </div>
            </div>
          </div>

          ${this.isAdmin || this.isTestMode ? `
            <div class="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-2">
              <button data-edit-fencer="${f.id}" title="Editar Tirador" class="edit-fencer-btn p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button data-delete-fencer="${f.id}" title="Eliminar Tirador" class="delete-fencer-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : `
            <button data-fencer-profile="${f.id}" title="Ver estadísticas" class="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors shrink-0">
              <i data-lucide="user" class="w-4 h-4"></i>
            </button>
          `}
        </div>
      `;
    }).join('');
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
    const photoInput = document.getElementById('fencerPhotoUrlInput');

    const name = nameInput.value.trim();
    if (!name) return;
    const photoUrl = photoInput ? photoInput.value.trim() : '';

    if (editId) {
      // Edit
      const f = this.fencers.find(item => item.id === editId);
      if (f) {
        f.name = name;
        f.rank = rankInput.value;
        f.color = colorInput.value;
        f.photoUrl = photoUrl;
      }
      this.showToast(`Tirador actualizado: ${name}`, 'emerald');
    } else {
      // Create
      const newFencer = {
        id: 'f-' + Date.now(),
        name: name,
        rank: rankInput.value,
        color: colorInput.value,
        photoUrl: photoUrl,
        joinedAt: new Date().toISOString().split('T')[0]
      };
      this.fencers.push(newFencer);
      this.showToast(`Nuevo alumno inscrito: ${name}`, 'emerald');
    }

    this.saveLocalCache();
    this.closeFencerModal();
    this.renderAll();

    // Async sync to Supabase if not in test mode
    if (this.supabase && !this.isTestMode) {
      const targetFencer = editingFencer || newFencer;
      this.supabase
        .from('fencers')
        .upsert(this.fencerToDb(targetFencer))
        .then(({ error }) => {
          if (error) console.warn('Sync fencer error in Supabase:', error);
        })
        .catch(err => console.warn('Sync fencer exception:', err));
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

    // Async delete from Supabase
    if (this.supabase && !this.isTestMode) {
      this.supabase
        .from('fencers')
        .delete()
        .eq('id', fencerId)
        .then(({ error }) => {
          if (error) console.warn('Error al borrar fencer en Supabase:', error);
        })
        .catch(err => console.warn('Delete fencer exception:', err));
    }
  }

  updateAdminUI() {
    const text = document.getElementById('adminStatusText');
    const btn = document.getElementById('adminAuthBtn');
    const navFencers = document.getElementById('navTabFencers');
    const navSettings = document.getElementById('navTabSettings');
    const rectorDuelControls = document.getElementById('rectorOnlyDuelControls');

    if (this.isAdmin) {
      if (text) text.textContent = 'Rector Activo';
      if (btn) {
        btn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border border-cyan-500/50 bg-cyan-500/15 text-cyan-300 hover:border-cyan-400 shadow-sm shadow-cyan-500/20';
        btn.title = 'Modo Rector Activo (clic para cerrar sesión)';
        btn.innerHTML = `
          <i data-lucide="shield-check" class="w-3.5 h-3.5 text-cyan-400"></i>
          <span id="adminStatusText">Rector Activo</span>
          <i data-lucide="log-out" class="w-3 h-3 text-cyan-400/80 ml-0.5"></i>
        `;
      }
      // Reveal restricted navigation tabs for Rector
      if (navFencers) navFencers.classList.remove('hidden');
      if (navSettings) navSettings.classList.remove('hidden');
      if (rectorDuelControls) rectorDuelControls.classList.remove('hidden');
    } else {
      if (text) text.textContent = 'Acceso Rector';
      if (btn) {
        btn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-white';
        btn.title = 'Acceso para Rectores / Administración';
        btn.innerHTML = `
          <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-400"></i>
          <span id="adminStatusText">Acceso Rector</span>
        `;
      }
      // Hide restricted navigation tabs from Tiradores
      if (navFencers) navFencers.classList.add('hidden');
      if (navSettings) navSettings.classList.add('hidden');
      if (rectorDuelControls) rectorDuelControls.classList.add('hidden');

      // If viewing a restricted section, switch back to Ranking
      const activeSection = document.querySelector('.tab-content:not(.hidden)');
      if (activeSection && (activeSection.id === 'tab-fencers' || activeSection.id === 'tab-settings')) {
        this.switchTab('tab-ranking');
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (err) {}
    }
  }

  // Role-Aware Tab Switcher
  switchTab(targetId) {
    // Restrict Fencers management and Settings exclusively to authenticated Rector
    if ((targetId === 'tab-fencers' || targetId === 'tab-settings') && !this.isAdmin) {
      this.showToast('Acceso exclusivo para Rectores. Introduce tu PIN.', 'rose');
      this.openPinModal();
      return;
    }

    document.querySelectorAll('.nav-tab').forEach(b => {
      const isMatch = b.getAttribute('data-tab') === targetId;
      b.classList.toggle('active', isMatch);
    });

    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.toggle('hidden', section.id !== targetId);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (e) {}
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
      this.showToast('¡Modo Rector desbloqueado! Acceso a Tiradores y Ajustes habilitado', 'emerald');
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
    const photoInput = document.getElementById('fencerPhotoUrlInput');

    if (editFencer) {
      title.textContent = 'Modificar Tirador';
      editId.value = editFencer.id;
      nameInput.value = editFencer.name;
      rankInput.value = editFencer.rank || 'Inizziato';
      colorInput.value = editFencer.color || 'cyan';
      if (photoInput) photoInput.value = editFencer.photoUrl || '';
    } else {
      title.textContent = 'Añadir Nuevo Tirador';
      editId.value = '';
      nameInput.value = '';
      rankInput.value = 'Inizziato';
      colorInput.value = 'cyan';
      if (photoInput) photoInput.value = '';
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

  getRankBadge(rank) {
    const r = (rank || 'Inizziato').trim();
    switch (r) {
      case 'Novizio':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 border border-sky-500/30 text-sky-300">Novizio</span>`;
      case 'Inizziato':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">Inizziato</span>`;
      case 'Academico':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300">Academico</span>`;
      case 'Instructor':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">Instructor</span>`;
      default:
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">${r}</span>`;
    }
  }

  getSaberColorName(color) {
    switch (color) {
      case 'cyan': return 'Azul';
      case 'emerald': return 'Verde';
      case 'amber': return 'Amarillo / Ámbar';
      case 'purple': return 'Púrpura';
      case 'rose': return 'Rojo';
      case 'white': return 'Blanco / Plata';
      default: return color || 'Azul';
    }
  }

  // Dynamic Avatar Generator (Photo URL or Initials + Saber Halo)
  getFencerAvatarHtml(fencer, size = 'w-9 h-9', borderGlow = true) {
    if (!fencer) {
      return `<div class="${size} rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400">?</div>`;
    }
    const ringColor = fencer.color || 'cyan';
    const ringClass = borderGlow ? `border-2 saber-ring-${ringColor}` : 'border border-slate-700';
    const initials = this.getInitials(fencer.name);

    if (fencer.photoUrl && fencer.photoUrl.trim().startsWith('http')) {
      return `
        <div class="${size} rounded-full ${ringClass} bg-slate-900 overflow-hidden relative shrink-0 flex items-center justify-center">
          <img src="${fencer.photoUrl}" alt="${fencer.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <span class="w-full h-full hidden items-center justify-center font-bold text-slate-100 text-xs bg-slate-900">${initials}</span>
        </div>
      `;
    }

    return `
      <div class="${size} rounded-full ${ringClass} bg-slate-900 flex items-center justify-center font-bold text-slate-100 text-xs shrink-0 select-none">
        ${initials}
      </div>
    `;
  }

  // Calculate detailed stats for a single fencer
  getFencerStats(fencerId) {
    let matchesPlayed = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;
    const personalMatches = [];

    this.matches.forEach(m => {
      const isA = m.fighterAId === fencerId;
      const isB = m.fighterBId === fencerId;
      if (!isA && !isB) return;

      matchesPlayed++;
      personalMatches.push(m);

      const sA = (typeof m.scoreA === 'number') ? m.scoreA : (m.result === 'VICTORY_A' ? 1 : 0);
      const sB = (typeof m.scoreB === 'number') ? m.scoreB : (m.result === 'VICTORY_B' ? 1 : 0);

      const myScore = isA ? sA : sB;
      const oppScore = isA ? sB : sA;

      pointsFor += myScore;
      pointsAgainst += oppScore;

      if (m.result === 'DRAW') {
        drawn++;
      } else if ((m.result === 'VICTORY_A' && isA) || (m.result === 'VICTORY_B' && isB)) {
        won++;
      } else {
        lost++;
      }
    });

    const diff = pointsFor - pointsAgainst;
    const winrate = matchesPlayed > 0 ? ((won / matchesPlayed) * 100).toFixed(1) + '%' : '0%';

    return {
      matchesPlayed,
      won,
      drawn,
      lost,
      pointsFor,
      pointsAgainst,
      diff,
      winrate,
      matches: personalMatches
    };
  }

  openFencerProfileModal(fencerId) {
    const fencer = this.fencers.find(f => f.id === fencerId);
    if (!fencer) return;

    this.currentProfileFencerId = fencerId;
    const stats = this.getFencerStats(fencerId);

    const modal = document.getElementById('fencerProfileModal');
    const avatarContainer = document.getElementById('profileAvatarContainer');
    const nameEl = document.getElementById('profileFencerName');
    const rankBadgeEl = document.getElementById('profileRankBadge');
    const colorBadgeEl = document.getElementById('profileSaberColorBadge');

    const statPJ = document.getElementById('statPJ');
    const statV = document.getElementById('statV');
    const statD = document.getElementById('statD');
    const statWinrate = document.getElementById('statWinrate');
    const statOHRealizados = document.getElementById('statOHRealizados');
    const statOHRecibidos = document.getElementById('statOHRecibidos');
    const statOHDiff = document.getElementById('statOHDiff');

    const matchCountEl = document.getElementById('profileMatchCount');
    const matchesListEl = document.getElementById('profileMatchesList');
    const editBtn = document.getElementById('profileEditBtn');

    if (avatarContainer) {
      avatarContainer.innerHTML = this.getFencerAvatarHtml(fencer, 'w-14 h-14', true);
    }
    if (nameEl) nameEl.textContent = fencer.name;
    if (rankBadgeEl) rankBadgeEl.innerHTML = this.getRankBadge(fencer.rank);
    if (colorBadgeEl) {
      const col = fencer.color || 'cyan';
      const colLabel = this.getSaberColorName(col);
      colorBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full ${col === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'}"></span> Sable ${colLabel}`;
    }

    if (statPJ) statPJ.textContent = stats.matchesPlayed;
    if (statV) statV.textContent = stats.won;
    if (statD) statD.textContent = stats.lost;
    if (statWinrate) statWinrate.textContent = stats.winrate;
    if (statOHRealizados) statOHRealizados.textContent = stats.pointsFor;
    if (statOHRecibidos) statOHRecibidos.textContent = stats.pointsAgainst;
    if (statOHDiff) {
      statOHDiff.textContent = (stats.diff > 0 ? '+' : '') + stats.diff;
      statOHDiff.className = `font-combat font-bold text-base ${stats.diff > 0 ? 'text-emerald-400' : stats.diff < 0 ? 'text-rose-400' : 'text-slate-300'}`;
    }

    // Render Fencer Badges (current month & past months history)
    const badgesListEl = document.getElementById('profileBadgesList');
    const badgesCountEl = document.getElementById('profileBadgesCount');

    if (badgesListEl) {
      const badgesService = window.LeagueBadgesService;
      if (badgesService) {
        const earnedBadges = badgesService.getFencerBadgesHistory(
          fencerId,
          this.availableMonths,
          this.currentMonthKey,
          this.matches,
          this.fencers,
          this.isTestMode
        );

        if (badgesCountEl) {
          badgesCountEl.textContent = `${earnedBadges.length} título${earnedBadges.length === 1 ? '' : 's'}`;
        }

        if (earnedBadges.length === 0) {
          badgesListEl.innerHTML = `
            <div class="p-3 text-center text-slate-500 text-xs bg-slate-900/60 rounded-xl border border-slate-800">
              Aún no ha obtenido insignias. ¡Compite para conquistar títulos en la arena!
            </div>
          `;
        } else {
          badgesListEl.innerHTML = earnedBadges.map(b => {
            const isCur = b.isCurrentMonth;
            return `
              <div class="badge-item relative group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 shadow-sm transition-all"
                   tabindex="0"
                   role="article"
                   title="${b.tooltip}">
                
                <!-- Tooltip Popover -->
                <div class="badge-tooltip bg-slate-950/95 text-slate-200 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-[11px] leading-tight pointer-events-none">
                  <div class="font-bold text-xs flex items-center gap-1 mb-1 text-amber-300">
                    <span>${b.emoji}</span>
                    <span>${b.title}</span>
                  </div>
                  <p class="text-slate-300 text-[10px] leading-normal">${b.detail}</p>
                  <div class="mt-1 text-[9px] text-cyan-400 font-semibold">${b.monthLabel}${isCur ? ' (Mes Activo)' : ''}</div>
                </div>

                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0 select-none">${b.emoji}</span>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                      <span>${b.title}</span>
                      ${isCur ? '<span class="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-black">Activo</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-400 truncate">
                      ${b.monthLabel} &bull; <span class="text-slate-300 font-semibold">${b.formattedValue}</span>
                    </div>
                  </div>
                </div>

                <div class="shrink-0 text-right">
                  <span class="px-2 py-0.5 rounded text-[10px] font-combat font-bold bg-slate-950 border border-slate-800 text-slate-300">
                    ${b.formattedValue}
                  </span>
                </div>
              </div>
            `;
          }).join('');
        }
      } else {
        badgesListEl.innerHTML = '';
      }
    }

    if (matchCountEl) {
      matchCountEl.textContent = `${stats.matchesPlayed} combate${stats.matchesPlayed === 1 ? '' : 's'} este mes`;
    }

    if (matchesListEl) {
      if (stats.matches.length === 0) {
        matchesListEl.innerHTML = `
          <div class="p-6 text-center text-slate-500 text-xs bg-slate-900/60 rounded-xl border border-slate-800">
            Aún no ha disputado ningún asalto este mes.
          </div>
        `;
      } else {
        matchesListEl.innerHTML = stats.matches.map(m => {
          const isA = m.fighterAId === fencerId;
          const oppName = isA ? m.fighterBName : m.fighterAName;
          const oppId = isA ? m.fighterBId : m.fighterAId;
          const oppFencer = this.fencers.find(f => f.id === oppId);
          const sA = (typeof m.scoreA === 'number') ? m.scoreA : (m.result === 'VICTORY_A' ? 1 : 0);
          const sB = (typeof m.scoreB === 'number') ? m.scoreB : (m.result === 'VICTORY_B' ? 1 : 0);
          const myScore = isA ? sA : sB;
          const oppScore = isA ? sB : sA;

          let resBadge = '';
          if (m.result === 'DRAW') {
            resBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">Empate</span>`;
          } else if ((m.result === 'VICTORY_A' && isA) || (m.result === 'VICTORY_B' && !isA)) {
            resBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">Victoria</span>`;
          } else {
            resBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">Derrota</span>`;
          }

          return `
            <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
              <div class="flex items-center gap-2 min-w-0">
                ${this.getFencerAvatarHtml(oppFencer, 'w-7 h-7', false)}
                <div class="min-w-0">
                  <div class="text-[11px] font-bold text-slate-200 truncate">vs ${oppName}</div>
                  <div class="text-[9px] text-slate-500">${m.date}${m.notes ? ` &bull; ${m.notes}` : ''}</div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="font-combat font-black text-xs text-slate-100 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  ${myScore} - ${oppScore}
                </span>
                ${resBadge}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (editBtn) {
      if (this.isAdmin || this.isTestMode) {
        editBtn.classList.remove('hidden');
      } else {
        editBtn.classList.add('hidden');
      }
    }

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeFencerProfileModal() {
    const modal = document.getElementById('fencerProfileModal');
    if (modal) modal.classList.add('hidden');
    this.currentProfileFencerId = null;
  }

  // --- LIVE SCOREBOARD & ARBITRATION METHODS ---

  playBeep(freq = 600, duration = 0.15) {
    if (!this.isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  initLiveScoreboard() {
    this.renderLiveScoreboardOptions();
    this.updateLiveFightersUI();
    this.updateLiveTimerDisplay();
  }

  renderLiveScoreboardOptions() {
    const selA = document.getElementById('liveFighterASelect');
    const selB = document.getElementById('liveFighterBSelect');
    if (!selA || !selB) return;

    const curA = selA.value;
    const curB = selB.value;

    const optionsHtmlA = `
      <option value="">-- Tirador Alfa (Lado Azul) --</option>
      ${this.fencers.map(f => `<option value="${f.id}">${f.name} (${f.rank || 'Inizziato'})</option>`).join('')}
    `;

    const optionsHtmlB = `
      <option value="">-- Tirador Beta (Lado Ámbar/Rojo) --</option>
      ${this.fencers.map(f => `<option value="${f.id}">${f.name} (${f.rank || 'Inizziato'})</option>`).join('')}
    `;

    selA.innerHTML = optionsHtmlA;
    selB.innerHTML = optionsHtmlB;

    if (curA) selA.value = curA;
    if (curB) selB.value = curB;

    this.liveFighterAId = selA.value;
    this.liveFighterBId = selB.value;
    this.updateLiveFightersUI();
  }

  updateLiveFightersUI() {
    const selA = document.getElementById('liveFighterASelect');
    const selB = document.getElementById('liveFighterBSelect');
    const idA = selA ? selA.value : this.liveFighterAId;
    const idB = selB ? selB.value : this.liveFighterBId;

    this.liveFighterAId = idA;
    this.liveFighterBId = idB;

    const fA = this.fencers.find(f => f.id === idA);
    const fB = this.fencers.find(f => f.id === idB);

    const nameA = document.getElementById('liveFighterAName');
    const rankA = document.getElementById('liveFighterARank');
    const avatarA = document.getElementById('liveAvatarContainerA');

    const nameB = document.getElementById('liveFighterBName');
    const rankB = document.getElementById('liveFighterBRank');
    const avatarB = document.getElementById('liveAvatarContainerB');

    if (nameA) nameA.textContent = fA ? fA.name : 'Tirador Alfa';
    if (rankA) rankA.textContent = fA ? `${fA.rank || 'Inizziato'} • Sable ${this.getSaberColorName(fA.color)}` : 'Seleccionar alumno';
    if (avatarA) avatarA.innerHTML = this.getFencerAvatarHtml(fA, 'w-10 h-10', true);

    if (nameB) nameB.textContent = fB ? fB.name : 'Tirador Beta';
    if (rankB) rankB.textContent = fB ? `${fB.rank || 'Inizziato'} • Sable ${this.getSaberColorName(fB.color)}` : 'Seleccionar alumno';
    if (avatarB) avatarB.innerHTML = this.getFencerAvatarHtml(fB, 'w-10 h-10', true);

    this.updateLiveOutcomeBanner();
    if (window.lucide) window.lucide.createIcons();
  }

  adjustLiveScoreA(delta) {
    this.liveScoreA = Math.max(0, this.liveScoreA + delta);
    const display = document.getElementById('liveScoreADisplay');
    if (display) display.textContent = this.liveScoreA;
    this.playBeep(delta > 0 ? 520 : 380, 0.08);
    this.updateLiveOutcomeBanner();
  }

  adjustLiveScoreB(delta) {
    this.liveScoreB = Math.max(0, this.liveScoreB + delta);
    const display = document.getElementById('liveScoreBDisplay');
    if (display) display.textContent = this.liveScoreB;
    this.playBeep(delta > 0 ? 520 : 380, 0.08);
    this.updateLiveOutcomeBanner();
  }

  updateLiveOutcomeBanner() {
    const banner = document.getElementById('liveOutcomeBanner');
    if (!banner) return;

    const fA = this.fencers.find(f => f.id === this.liveFighterAId);
    const fB = this.fencers.find(f => f.id === this.liveFighterBId);
    const nameA = fA ? fA.name : 'Tirador Alfa';
    const nameB = fB ? fB.name : 'Tirador Beta';

    const sA = this.liveScoreA;
    const sB = this.liveScoreB;

    if (sA > sB) {
      banner.className = 'w-full p-2.5 rounded-xl border text-xs font-bold transition-all bg-cyan-500/10 border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-2';
      banner.innerHTML = `<i data-lucide="award" class="w-4 h-4 text-cyan-400"></i><span>Victoria para ${nameA} (+${sA - sB}) &bull; [${sA} - ${sB}]</span>`;
    } else if (sB > sA) {
      banner.className = 'w-full p-2.5 rounded-xl border text-xs font-bold transition-all bg-amber-500/10 border-amber-500/40 text-amber-300 flex items-center justify-center gap-2';
      banner.innerHTML = `<i data-lucide="award" class="w-4 h-4 text-amber-400"></i><span>Victoria para ${nameB} (+${sB - sA}) &bull; [${sA} - ${sB}]</span>`;
    } else {
      banner.className = 'w-full p-2.5 rounded-xl border text-xs font-bold transition-all bg-slate-900 border-slate-700 text-slate-300 flex items-center justify-center gap-2';
      banner.innerHTML = `<i data-lucide="scale" class="w-4 h-4 text-slate-400"></i><span>Empate Técnico &bull; [${sA} - ${sB}]</span>`;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  updateLiveTimerDisplay() {
    const display = document.getElementById('liveTimerDisplay');
    const statusText = document.getElementById('liveTimerStatusText');
    const toggleBtn = document.getElementById('liveTimerToggleBtn');
    const icon = document.getElementById('liveTimerIcon');
    const label = document.getElementById('liveTimerActionLabel');

    if (display) {
      const mins = Math.floor(this.timerSeconds / 60);
      const secs = this.timerSeconds % 60;
      display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
        display.classList.add('timer-critical');
      } else {
        display.classList.remove('timer-critical');
      }
    }

    if (toggleBtn && label) {
      if (this.timerRunning) {
        label.textContent = 'Pausar';
        toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all';
        if (icon) icon.setAttribute('data-lucide', 'pause');
        if (statusText) {
          statusText.textContent = 'Combate en curso';
          statusText.className = 'text-[11px] font-semibold text-emerald-400 mt-1';
        }
      } else {
        label.textContent = this.timerSeconds === 0 ? 'Reiniciar' : 'Iniciar';
        toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all';
        if (icon) icon.setAttribute('data-lucide', 'play');
        if (statusText) {
          if (this.timerSeconds === 0) {
            statusText.textContent = '¡Tiempo agotado!';
            statusText.className = 'text-[11px] font-bold text-rose-400 mt-1';
          } else if (this.timerSeconds < 120) {
            statusText.textContent = 'Combate en pausa';
            statusText.className = 'text-[11px] font-semibold text-amber-400 mt-1';
          } else {
            statusText.textContent = 'Listo para iniciar';
            statusText.className = 'text-[11px] font-semibold text-slate-400 mt-1';
          }
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  startLiveTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.timerSeconds === 0) this.timerSeconds = 120;

    this.timerRunning = true;
    this.playBeep(750, 0.15);
    this.updateLiveTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
          this.playBeep(600, 0.08);
        }
        this.updateLiveTimerDisplay();
      } else {
        // Bout time over!
        this.pauseLiveTimer();
        this.playBeep(880, 0.25);
        setTimeout(() => this.playBeep(880, 0.25), 300);
        setTimeout(() => this.playBeep(1100, 0.5), 600);
        this.showToast('🔔 ¡Tiempo de asalto finalizado!', 'rose');
      }
    }, 1000);
  }

  pauseLiveTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerRunning = false;
    this.updateLiveTimerDisplay();
  }

  toggleLiveTimer() {
    if (this.timerRunning) {
      this.pauseLiveTimer();
      this.playBeep(450, 0.1);
    } else {
      this.startLiveTimer();
    }
  }

  resetLiveTimer() {
    this.pauseLiveTimer();
    this.timerSeconds = 120;
    this.updateLiveTimerDisplay();
    this.playBeep(500, 0.1);
  }

  addLiveTimerSeconds(extra = 30) {
    this.timerSeconds += extra;
    this.updateLiveTimerDisplay();
  }

  async finishAndSaveLiveCombat() {
    const fA = this.fencers.find(f => f.id === this.liveFighterAId);
    const fB = this.fencers.find(f => f.id === this.liveFighterBId);

    if (!fA || !fB) {
      this.showToast('Selecciona a ambos tiradores (Alfa y Beta) antes de finalizar', 'amber');
      return;
    }

    if (fA.id === fB.id) {
      this.showToast('No puedes seleccionar al mismo alumno en ambos lados', 'rose');
      return;
    }

    // Check conflict
    const existing = this.findExistingMatch(fA.id, fB.id);
    if (existing) {
      if (!confirm(`Este cruce ya se disputó este mes (${existing.scoreText || existing.result}). ¿Deseas registrar este nuevo resultado de todos modos?`)) {
        return;
      }
    }

    this.pauseLiveTimer();

    const sA = this.liveScoreA;
    const sB = this.liveScoreB;
    let pointsA = 0;
    let pointsB = 0;
    let winner = 'DRAW';
    let result = 'DRAW';

    if (sA > sB) {
      result = 'VICTORY_A';
      pointsA = 3;
      pointsB = 0;
      winner = fA.name;
    } else if (sB > sA) {
      result = 'VICTORY_B';
      pointsA = 0;
      pointsB = 3;
      winner = fB.name;
    } else {
      result = 'DRAW';
      pointsA = 1;
      pointsB = 1;
      winner = 'Empate';
    }

    const matchDate = new Date().toISOString().split('T')[0];
    const newMatch = {
      id: 'm-' + Date.now(),
      monthKey: this.currentMonthKey,
      date: matchDate,
      fighterAId: fA.id,
      fighterAName: fA.name,
      fighterBId: fB.id,
      fighterBName: fB.name,
      scoreA: sA,
      scoreB: sB,
      scoreText: `${sA} - ${sB}`,
      result: result,
      winner: winner,
      pointsA: pointsA,
      pointsB: pointsB,
      notes: 'Marcador en Directo (Pista)',
      timestamp: new Date().toISOString()
    };

    // Save locally
    this.matches.unshift(newMatch);
    this.saveLocalCache();

    // Sync to Supabase
    if (this.supabase) {
      this.syncMatchToSupabase(newMatch);
    }

    this.showToast(`¡Combate guardado! ${fA.name} ${sA} - ${sB} ${fB.name}`, 'emerald');
    this.playBeep(880, 0.2);

    // Reset Live Board for next bout
    this.liveScoreA = 0;
    this.liveScoreB = 0;
    const dispA = document.getElementById('liveScoreADisplay');
    const dispB = document.getElementById('liveScoreBDisplay');
    if (dispA) dispA.textContent = '0';
    if (dispB) dispB.textContent = '0';
    this.resetLiveTimer();

    // Re-render other tabs
    this.renderAll();
  }

  toggleLiveFullscreen() {
    this.isPisteMode = !this.isPisteMode;
    document.body.classList.toggle('piste-mode', this.isPisteMode);

    const icon = document.getElementById('liveFullscreenIcon');
    const label = document.getElementById('liveFullscreenLabel');

    if (this.isPisteMode) {
      if (icon) icon.setAttribute('data-lucide', 'minimize');
      if (label) label.textContent = 'Salir Pista';
      this.showToast('🏟️ Modo Pista Horizontal Activo', 'cyan');
    } else {
      if (icon) icon.setAttribute('data-lucide', 'maximize');
      if (label) label.textContent = 'Modo Pista';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  setupEventListeners() {
    // Navigation Tabs (Protected with Role Access)
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        const targetId = tabBtn.getAttribute('data-tab');
        this.switchTab(targetId);
      });
    });

    // Historial Month Scope switcher (Duelos Actuales vs Histórico de Meses)
    document.getElementById('historyCurrentMonthPill')?.addEventListener('click', () => {
      const curBtn = document.getElementById('historyCurrentMonthPill');
      const pastBtn = document.getElementById('historyPastMonthsPill');
      const pastBox = document.getElementById('historyPastMonthsContainer');
      
      curBtn?.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/30');
      curBtn?.classList.remove('text-slate-400', 'border-transparent');
      
      pastBtn?.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/30');
      pastBtn?.classList.add('text-slate-400', 'border-transparent');
      
      pastBox?.classList.add('hidden');

      const defaultKey = this.getDefaultMonthKey();
      if (this.currentMonthKey !== defaultKey && this.availableMonths.includes(defaultKey)) {
        this.switchMonth(defaultKey);
      }
    });

    document.getElementById('historyPastMonthsPill')?.addEventListener('click', () => {
      const curBtn = document.getElementById('historyCurrentMonthPill');
      const pastBtn = document.getElementById('historyPastMonthsPill');
      const pastBox = document.getElementById('historyPastMonthsContainer');
      
      pastBtn?.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/30');
      pastBtn?.classList.remove('text-slate-400', 'border-transparent');
      
      curBtn?.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/30');
      curBtn?.classList.add('text-slate-400', 'border-transparent');
      
      pastBox?.classList.remove('hidden');
      this.renderHistoryPastMonthsList();
    });

    // History Past month pills delegation
    document.getElementById('historyPastMonthsList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.history-month-pill-btn');
      if (btn) {
        const mKey = btn.getAttribute('data-month');
        if (mKey) {
          this.switchMonth(mKey);
          this.renderHistoryPastMonthsList();
        }
      }
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

    // New Month Button (Protected: only Rector can start a new league month)
    document.getElementById('newMonthBtn')?.addEventListener('click', () => {
      if (!this.isAdmin) {
        this.showToast('Acceso restringido: Se requiere rol de Rector para iniciar un nuevo mes', 'rose');
        this.openPinModal();
        return;
      }
      this.createNewMonth();
    });

    // Admin Auth Button (Toggle Rector session with confirmation)
    document.getElementById('adminAuthBtn')?.addEventListener('click', () => {
      if (this.isAdmin) {
        if (confirm('¿Deseas cerrar la sesión de Rector y volver al Modo Tirador?')) {
          this.isAdmin = false;
          sessionStorage.removeItem('ls_admin_logged');
          this.updateAdminUI();
          this.renderAll();
          this.showToast('Sesión de Rector cerrada. Modo Tirador activo.', 'cyan');
        }
      } else {
        this.openPinModal();
      }
    });

    // Unlock Admin from Duel lock overlay if any
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

    // Settings: Save Supabase Configuration
    document.getElementById('saveSupabaseBtn')?.addEventListener('click', () => {
      const urlInput = document.getElementById('supabaseUrlInput');
      const keyInput = document.getElementById('supabaseKeyInput');
      const rawUrl = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      const normalizedUrl = normalizeSupabaseUrl(rawUrl);
      this.supabaseUrl = normalizedUrl;
      this.supabaseKey = key;

      localStorage.setItem('ls_supabase_url', normalizedUrl);
      localStorage.setItem('ls_supabase_key', key);

      this.initSupabaseClient();
      this.showToast('Configuración de Supabase guardada', 'emerald');
      this.loadData();
    });

    // Settings: Test Supabase Connection
    document.getElementById('testSupabaseBtn')?.addEventListener('click', async () => {
      const urlInput = document.getElementById('supabaseUrlInput');
      const keyInput = document.getElementById('supabaseKeyInput');
      const rawUrl = urlInput ? urlInput.value.trim() : this.supabaseUrl;
      const key = keyInput ? keyInput.value.trim() : this.supabaseKey;

      if (!rawUrl || !key) {
        alert('Por favor introduce la URL y la API Key de Supabase.');
        return;
      }

      const normalizedUrl = normalizeSupabaseUrl(rawUrl);
      try {
        this.showToast('Probando conexión con Supabase...', 'amber');
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
          throw new Error('Librería de Supabase no cargada. Revisa la conexión a Internet.');
        }

        const testClient = window.supabase.createClient(normalizedUrl, key);
        const { data, error } = await testClient.from('fencers').select('id').limit(1);

        if (error) {
          if (error.code === 'PGRST205') {
            alert('¡Conexión establecida con Supabase!\n\nAviso: Las tablas no existen todavía en la base de datos. Ejecuta el archivo "supabase_schema.sql" en el SQL Editor de tu Dashboard.');
            return;
          }
          throw error;
        }

        this.showToast('¡Conexión con Supabase exitosa!', 'emerald');
      } catch (err) {
        alert('Error al conectar con Supabase: ' + (err.message || JSON.stringify(err)));
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

    // --- FENCER PROFILE MODAL LISTENERS ---
    document.addEventListener('click', (e) => {
      const profileTrigger = e.target.closest('[data-fencer-profile]');
      if (profileTrigger && !e.target.closest('.edit-fencer-btn') && !e.target.closest('.delete-fencer-btn')) {
        const fId = profileTrigger.getAttribute('data-fencer-profile');
        if (fId) {
          this.openFencerProfileModal(fId);
        }
      }
    });

    document.getElementById('closeProfileModalBtn')?.addEventListener('click', () => this.closeFencerProfileModal());
    document.getElementById('closeProfileModalBottomBtn')?.addEventListener('click', () => this.closeFencerProfileModal());

    document.getElementById('profileEditBtn')?.addEventListener('click', () => {
      if (this.currentProfileFencerId) {
        const f = this.fencers.find(item => item.id === this.currentProfileFencerId);
        this.closeFencerProfileModal();
        if (f) this.openFencerModal(f);
      }
    });

    // --- LIVE SCOREBOARD LISTENERS ---
    document.getElementById('openLiveFromRankingBtn')?.addEventListener('click', () => this.switchTab('tab-live'));
    document.getElementById('openLiveFromDuelBannerBtn')?.addEventListener('click', () => this.switchTab('tab-live'));

    document.getElementById('liveFighterASelect')?.addEventListener('change', () => this.updateLiveFightersUI());
    document.getElementById('liveFighterBSelect')?.addEventListener('change', () => this.updateLiveFightersUI());

    document.getElementById('liveBtnScoreAInc')?.addEventListener('click', () => this.adjustLiveScoreA(1));
    document.getElementById('liveBtnScoreADec')?.addEventListener('click', () => this.adjustLiveScoreA(-1));
    document.getElementById('liveBtnScoreBInc')?.addEventListener('click', () => this.adjustLiveScoreB(1));
    document.getElementById('liveBtnScoreBDec')?.addEventListener('click', () => this.adjustLiveScoreB(-1));

    document.getElementById('liveTimerToggleBtn')?.addEventListener('click', () => this.toggleLiveTimer());
    document.getElementById('liveTimerResetBtn')?.addEventListener('click', () => this.resetLiveTimer());
    document.getElementById('liveTimerAdd30Btn')?.addEventListener('click', () => this.addLiveTimerSeconds(30));

    document.getElementById('liveFinishAndSaveBtn')?.addEventListener('click', () => this.finishAndSaveLiveCombat());
    document.getElementById('liveFullscreenBtn')?.addEventListener('click', () => this.toggleLiveFullscreen());

    document.getElementById('liveSoundToggleBtn')?.addEventListener('click', () => {
      this.isSoundEnabled = !this.isSoundEnabled;
      const icon = document.getElementById('liveSoundIcon');
      if (icon) {
        icon.setAttribute('data-lucide', this.isSoundEnabled ? 'volume-2' : 'volume-x');
      }
      this.showToast(this.isSoundEnabled ? 'Sonido activado' : 'Sonido silenciado', 'cyan');
      if (window.lucide) window.lucide.createIcons();
    });
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LudoSportApp();
});
