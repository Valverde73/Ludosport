/**
 * LudoSport Arena - Sistema de Medallero y Títulos Automáticos
 * Pure service logic for monthly league badges calculation.
 * Follows Addy Osmani's software engineering principles:
 * - High cohesion, loose coupling (DOM-independent)
 * - Pure, deterministic calculations
 * - Robust handling of ties and edge cases
 */

(function (global) {
  'use strict';

  // Badge Definitions & Metadata
  const BADGE_DEFINITIONS = {
    INVICTUS: {
      id: 'invictus',
      title: 'Invicto del Mes',
      emoji: '🏆',
      icon: 'trophy',
      color: 'amber',
      accentClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      glowClass: 'shadow-amber-500/10',
      description: '100% de victorias en el mes (mínimo 3 combates disputados).',
      minMatches: 3
    },
    TOP_SCORER: {
      id: 'top_scorer',
      title: 'Máximo Anotador de OHs',
      emoji: '⚡',
      icon: 'zap',
      color: 'cyan',
      accentClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
      glowClass: 'shadow-cyan-500/10',
      description: 'Mayor número total de tocados (OHs a favor) anotados en el mes.',
      minMatches: 1
    },
    IRON_DEFENSE: {
      id: 'iron_defense',
      title: 'Defensa de Hierro',
      emoji: '🛡️',
      icon: 'shield-check',
      color: 'emerald',
      accentClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      glowClass: 'shadow-emerald-500/10',
      description: 'Menor promedio de OHs recibidos por combate (mínimo 3 combates disputados).',
      minMatches: 3
    },
    MOST_ACTIVE: {
      id: 'most_active',
      title: 'Rival más Activo',
      emoji: '⚔️',
      icon: 'swords',
      color: 'purple',
      accentClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      glowClass: 'shadow-purple-500/10',
      description: 'Mayor número total de combates disputados en el mes.',
      minMatches: 1
    },
    WIN_STREAK: {
      id: 'win_streak',
      title: 'Racha de Victorias',
      emoji: '🔥',
      icon: 'flame',
      color: 'rose',
      accentClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
      glowClass: 'shadow-rose-500/10',
      description: 'Secuencia más larga de victorias consecutivas en el mes (mínimo 2 consecutivas).',
      minStreak: 2
    }
  };

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function formatMonthName(monthKey) {
    if (!monthKey || monthKey.length < 6) return monthKey || '';
    const cleanKey = String(monthKey).replace('TEST_', '');
    const mm = parseInt(cleanKey.substring(0, 2), 10);
    const yyyy = cleanKey.substring(2);
    const name = MONTH_NAMES[mm - 1] || 'Mes';
    return `${name} ${yyyy}`;
  }

  class LeagueBadgesService {
    /**
     * Parse fencer match stats from matches array
     * @param {Array} matches
     * @param {Array} fencers
     * @returns {Object} map of fencerId -> aggregate performance
     */
    static computeFencerAggregates(matches = [], fencers = []) {
      const aggregates = {};

      fencers.forEach(f => {
        aggregates[f.id] = {
          fencer: f,
          matchesPlayed: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          personalMatches: []
        };
      });

      matches.forEach(m => {
        const fA = aggregates[m.fighterAId];
        const fB = aggregates[m.fighterBId];

        const sA = (typeof m.scoreA === 'number') ? m.scoreA : (m.result === 'VICTORY_A' ? 1 : 0);
        const sB = (typeof m.scoreB === 'number') ? m.scoreB : (m.result === 'VICTORY_B' ? 1 : 0);

        if (fA) {
          fA.matchesPlayed++;
          fA.pointsFor += sA;
          fA.pointsAgainst += sB;
          fA.personalMatches.push({ ...m, isFighterA: true, scoreFor: sA, scoreAgainst: sB });
          if (m.result === 'VICTORY_A') fA.won++;
          else if (m.result === 'DRAW') fA.drawn++;
          else if (m.result === 'VICTORY_B') fA.lost++;
        }

        if (fB) {
          fB.matchesPlayed++;
          fB.pointsFor += sB;
          fB.pointsAgainst += sA;
          fB.personalMatches.push({ ...m, isFighterA: false, scoreFor: sB, scoreAgainst: sA });
          if (m.result === 'VICTORY_B') fB.won++;
          else if (m.result === 'DRAW') fB.drawn++;
          else if (m.result === 'VICTORY_A') fB.lost++;
        }
      });

      return aggregates;
    }

    /**
     * Calculate longest winning streak for a fencer's matches
     * @param {Array} personalMatches
     * @param {string} fencerId
     * @returns {number} maximum consecutive wins
     */
    static calculateMaxWinningStreak(personalMatches = [], fencerId) {
      if (!personalMatches || personalMatches.length === 0) return 0;

      // Sort chronologically by date/timestamp/order
      const sorted = [...personalMatches].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : (b.date ? new Date(b.date).getTime() : 0);
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || '').localeCompare(b.id || '');
      });

      let currentStreak = 0;
      let maxStreak = 0;

      for (const m of sorted) {
        const isA = m.fighterAId === fencerId;
        const isWin = (m.result === 'VICTORY_A' && isA) || (m.result === 'VICTORY_B' && !isA);

        if (isWin) {
          currentStreak++;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else {
          currentStreak = 0;
        }
      }

      return maxStreak;
    }

    /**
     * Compute all monthly badges for a specific month
     * @param {Array} matches
     * @param {Array} fencers
     * @param {string} monthKey
     * @returns {Array} List of badge results
     */
    static calculateMonthlyBadges(matches = [], fencers = [], monthKey = '') {
      const aggregates = this.computeFencerAggregates(matches, fencers);
      const fencerList = Object.values(aggregates);
      const monthLabel = formatMonthName(monthKey);

      // 1. INVICTO DEL MES (100% victorias, min 3 combates)
      const invictusDef = BADGE_DEFINITIONS.INVICTUS;
      const invictusCandidates = fencerList.filter(item => 
        item.matchesPlayed >= invictusDef.minMatches &&
        item.won === item.matchesPlayed &&
        item.lost === 0 &&
        item.drawn === 0
      );

      const invictusWinners = invictusCandidates.map(item => ({
        fencerId: item.fencer.id,
        fencer: item.fencer,
        value: item.won,
        formattedValue: `${item.won}V de ${item.matchesPlayed}PJ (100%)`,
        detail: `100% de victorias en ${item.matchesPlayed} combates jugados`
      }));

      // 2. MÁXIMO ANOTADOR DE OHS (Mayor cantidad de puntos a favor)
      const topScorerDef = BADGE_DEFINITIONS.TOP_SCORER;
      let maxOHs = 0;
      fencerList.forEach(item => {
        if (item.pointsFor > maxOHs) maxOHs = item.pointsFor;
      });

      let topScorerWinners = [];
      if (maxOHs > 0) {
        topScorerWinners = fencerList
          .filter(item => item.pointsFor === maxOHs)
          .map(item => ({
            fencerId: item.fencer.id,
            fencer: item.fencer,
            value: maxOHs,
            formattedValue: `${maxOHs} OHs`,
            detail: `${maxOHs} tocados a favor conseguidos en el mes`
          }));
      }

      // 3. DEFENSA DE HIERRO (Menor promedio de OHs recibidos por combate, min 3 combates)
      const defenseDef = BADGE_DEFINITIONS.IRON_DEFENSE;
      const defenseCandidates = fencerList.filter(item => item.matchesPlayed >= defenseDef.minMatches);
      let defenseWinners = [];

      if (defenseCandidates.length > 0) {
        // Compute average for each candidate
        defenseCandidates.forEach(item => {
          item.avgConceded = item.pointsAgainst / item.matchesPlayed;
        });

        const minAvg = Math.min(...defenseCandidates.map(item => item.avgConceded));
        defenseWinners = defenseCandidates
          .filter(item => Math.abs(item.avgConceded - minAvg) < 0.0001)
          .map(item => ({
            fencerId: item.fencer.id,
            fencer: item.fencer,
            value: Number(minAvg.toFixed(2)),
            formattedValue: `${minAvg.toFixed(2)} OHs/combate`,
            detail: `${item.pointsAgainst} OHs recibidos en ${item.matchesPlayed} combates (${minAvg.toFixed(2)} media)`
          }));
      }

      // 4. RIVAL MÁS ACTIVO (Mayor número de combates disputados)
      const mostActiveDef = BADGE_DEFINITIONS.MOST_ACTIVE;
      let maxMatches = 0;
      fencerList.forEach(item => {
        if (item.matchesPlayed > maxMatches) maxMatches = item.matchesPlayed;
      });

      let mostActiveWinners = [];
      if (maxMatches > 0) {
        mostActiveWinners = fencerList
          .filter(item => item.matchesPlayed === maxMatches)
          .map(item => ({
            fencerId: item.fencer.id,
            fencer: item.fencer,
            value: maxMatches,
            formattedValue: `${maxMatches} combates`,
            detail: `${maxMatches} asaltos disputados este mes`
          }));
      }

      // 5. RACHA DE VICTORIAS (Secuencia consecutiva de victorias más larga, min 2)
      const streakDef = BADGE_DEFINITIONS.WIN_STREAK;
      let maxStreakOverall = 0;
      const streakData = [];

      fencerList.forEach(item => {
        const streak = this.calculateMaxWinningStreak(item.personalMatches, item.fencer.id);
        streakData.push({ item, streak });
        if (streak > maxStreakOverall) {
          maxStreakOverall = streak;
        }
      });

      let streakWinners = [];
      if (maxStreakOverall >= streakDef.minStreak) {
        streakWinners = streakData
          .filter(sd => sd.streak === maxStreakOverall)
          .map(sd => ({
            fencerId: sd.item.fencer.id,
            fencer: sd.item.fencer,
            value: maxStreakOverall,
            formattedValue: `${maxStreakOverall} consecutivas`,
            detail: `Racha impecable de ${maxStreakOverall} victorias consecutivas`
          }));
      }

      // Build structured return array
      const badges = [
        {
          ...invictusDef,
          monthKey,
          monthLabel,
          winners: invictusWinners,
          hasWinner: invictusWinners.length > 0,
          isTie: invictusWinners.length > 1,
          emptyStateText: `En disputa (mínimo ${invictusDef.minMatches} combates y 100% victorias)`
        },
        {
          ...topScorerDef,
          monthKey,
          monthLabel,
          winners: topScorerWinners,
          hasWinner: topScorerWinners.length > 0,
          isTie: topScorerWinners.length > 1,
          emptyStateText: 'En disputa (se requiere anotar al menos 1 OH)'
        },
        {
          ...defenseDef,
          monthKey,
          monthLabel,
          winners: defenseWinners,
          hasWinner: defenseWinners.length > 0,
          isTie: defenseWinners.length > 1,
          emptyStateText: `En disputa (mínimo ${defenseDef.minMatches} combates)`
        },
        {
          ...mostActiveDef,
          monthKey,
          monthLabel,
          winners: mostActiveWinners,
          hasWinner: mostActiveWinners.length > 0,
          isTie: mostActiveWinners.length > 1,
          emptyStateText: 'En disputa (sin combates disputados aún)'
        },
        {
          ...streakDef,
          monthKey,
          monthLabel,
          winners: streakWinners,
          hasWinner: streakWinners.length > 0,
          isTie: streakWinners.length > 1,
          emptyStateText: `En disputa (mínimo ${streakDef.minStreak} victorias consecutivas)`
        }
      ];

      return badges;
    }

    /**
     * Get all historical badges earned by a specific fencer across months
     * @param {string} fencerId
     * @param {Array<string>} availableMonths
     * @param {string} currentMonthKey
     * @param {Array} currentMatches
     * @param {Array} fencers
     * @param {boolean} isTestMode
     * @returns {Array} array of earned badge objects with month and details
     */
    static getFencerBadgesHistory(fencerId, availableMonths = [], currentMonthKey = '', currentMatches = [], fencers = [], isTestMode = false) {
      if (!fencerId) return [];

      const earnedBadges = [];
      const distinctMonths = Array.from(new Set([currentMonthKey, ...availableMonths])).filter(Boolean);

      distinctMonths.forEach(mKey => {
        let matches = [];
        const isCurrent = mKey === currentMonthKey;

        if (isCurrent && currentMatches) {
          matches = currentMatches;
        } else {
          try {
            const storageKey = isTestMode ? `ls_test_matches_${mKey}` : `ls_matches_${mKey}`;
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
            if (raw) matches = JSON.parse(raw);
          } catch (e) {
            matches = [];
          }
        }

        if (!matches || matches.length === 0) return;

        const monthlyBadges = this.calculateMonthlyBadges(matches, fencers, mKey);

        monthlyBadges.forEach(badge => {
          const winnerEntry = badge.winners.find(w => w.fencerId === fencerId);
          if (winnerEntry) {
            const monthLabel = formatMonthName(mKey);
            earnedBadges.push({
              badgeId: badge.id,
              title: badge.title,
              emoji: badge.emoji,
              icon: badge.icon,
              color: badge.color,
              accentClass: badge.accentClass,
              monthKey: mKey,
              monthLabel: monthLabel,
              isCurrentMonth: isCurrent,
              value: winnerEntry.value,
              formattedValue: winnerEntry.formattedValue,
              detail: winnerEntry.detail,
              tooltip: `${badge.emoji} ${badge.title}: ${winnerEntry.formattedValue} en ${monthLabel}`
            });
          }
        });
      });

      return earnedBadges;
    }
  }

  // Export for Browser and Node/CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      LeagueBadgesService,
      BADGE_DEFINITIONS,
      formatMonthName
    };
  } else {
    global.LeagueBadgesService = LeagueBadgesService;
    global.BADGE_DEFINITIONS = BADGE_DEFINITIONS;
    global.formatMonthName = formatMonthName;
  }
})(typeof window !== 'undefined' ? window : this);
