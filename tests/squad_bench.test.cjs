const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const playerDataSrc = fs.readFileSync('player_data.js', 'utf8');
const utilsSrc = fs.readFileSync('js/utils.js', 'utf8');
const squadSrc = fs.readFileSync('js/squad.js', 'utf8');
const matchAlgSrc = fs.readFileSync('js/match_algorithm.js', 'utf8');
const leagueSrc = fs.readFileSync('js/league.js', 'utf8');

function createContext(extra = {}) {
    const storage = new Map();
    const toasts = [];
    const context = {
        console,
        Math,
        Date,
        JSON,
        Set,
        Map,
        Array,
        Object,
        Number,
        String,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        localStorage: {
            getItem: (k) => (storage.has(k) ? storage.get(k) : null),
            setItem: (k, v) => storage.set(k, String(v)),
            removeItem: (k) => storage.delete(k)
        },
        document: {
            getElementById: (id) => {
                if (id && id.toLowerCase().includes('overlay')) {
                    return { classList: { add() {}, remove() {}, toggle() {} }, style: {} };
                }
                return null;
            },
            querySelector: () => null,
            querySelectorAll: () => [],
            createElement: () => ({
                style: {},
                classList: { add() {}, remove() {}, toggle() {} },
                appendChild() {},
                setAttribute() {},
                removeAttribute() {}
            }),
            body: null
        },
        window: {},
        currentFormation: '4-3-3',
        currentLeagueId: 'kleague1',
        leagueYear: 2026,
        isHardMode: false,
        hallOfFame: [],
        careerStats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {}, playerAssists: {} },
        careerStatsHard: { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {}, playerAssists: {} },
        playerDeck: {},
        squadCaptain: null,
        wingerStyles: { '4-3-3': { LW: 'dribble', RW: 'sprint' }, '4-4-2': { LW: 'dribble', RW: 'sprint' } },
        strikerStyles: { '4-3-3': { ST: 'targetman' }, '4-4-2': { ST: 'targetman' } },
        showToast: (msg) => toasts.push(msg),
        saveUserProgress: () => {},
        renderCareerStats: () => {},
        renderUserPoints: () => {},
        getAwakenedCard: (id, deckArg) => {
            const deck = deckArg || context.playerDeck;
            const base = context.CARDS_DATABASE[id];
            if (!base) return null;
            const awk = (deck && deck[id] && deck[id].awakening) || 0;
            const cond = (deck && deck[id] && typeof deck[id].condition === 'number') ? deck[id].condition : 0;
            return { ...base, rating: base.rating + awk + cond, awakening: awk, condition: cond };
        },
        ...extra
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(playerDataSrc, context);
    context.CARDS_DATABASE = vm.runInContext('CARDS_DATABASE', context);
    vm.runInContext(utilsSrc, context);
    context.showToast = (msg) => toasts.push(msg);
    context.alert = (msg) => toasts.push(msg);
    vm.runInContext(squadSrc, context);
    vm.runInContext(matchAlgSrc, context);
    vm.runInContext(leagueSrc, context);
    return { context, storage, toasts };
}

// 1. Bench slot role restrictions (Attack 2: AM/W/ST, Defense 2: CM/CB/LB/RB, GK 1: GK)
{
    const { context, toasts } = createContext({
        playerDeck: {
            super_son: { quantity: 1, awakening: 0, isStored: false },       // LW
            zinedine_zidane: { quantity: 1, awakening: 0, isStored: false }, // AM
            harry_kane: { quantity: 1, awakening: 0, isStored: false },      // ST
            ki_sung_yueng: { quantity: 1, awakening: 0, isStored: false },   // CM
            cucurella: { quantity: 1, awakening: 0, isStored: false },       // LB
            super_kim_seung_gyu: { quantity: 1, awakening: 0, isStored: false }, // GK
            kim_seung_gyu: { quantity: 1, awakening: 0, isStored: false },   // GK (same player as super_kim_seung_gyu)
            son_heung_min: { quantity: 1, awakening: 0, isStored: false }    // LW (same player as super_son)
        }
    });

    // Valid placements
    vm.runInContext(`
        activeSelectorPosition = 'SUB_ATK1'; selectPlayerForPosition('zinedine_zidane');
        activeSelectorPosition = 'SUB_ATK2'; selectPlayerForPosition('harry_kane');
        activeSelectorPosition = 'SUB_DEF1'; selectPlayerForPosition('ki_sung_yueng');
        activeSelectorPosition = 'SUB_DEF2'; selectPlayerForPosition('cucurella');
        activeSelectorPosition = 'SUB_GK';   selectPlayerForPosition('super_kim_seung_gyu');
    `, context);

    assert.strictEqual(vm.runInContext(`squadBench.SUB_ATK1`, context), 'zinedine_zidane');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_ATK2`, context), 'harry_kane');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_DEF1`, context), 'ki_sung_yueng');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_DEF2`, context), 'cucurella');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_GK`, context), 'super_kim_seung_gyu');

    // Invalid role placements must be blocked
    vm.runInContext(`
        squadBenches['4-3-3'] = {};
        squadBench = squadBenches['4-3-3'];
        activeSelectorPosition = 'SUB_ATK1'; selectPlayerForPosition('cucurella');
        activeSelectorPosition = 'SUB_DEF1'; selectPlayerForPosition('harry_kane');
        activeSelectorPosition = 'SUB_DEF2'; selectPlayerForPosition('zinedine_zidane');
        activeSelectorPosition = 'SUB_GK';   selectPlayerForPosition('ki_sung_yueng');
    `, context);
    assert.strictEqual(vm.runInContext(`squadBench.SUB_ATK1`, context), undefined, 'LB should be rejected from SUB_ATK1');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_DEF1`, context), undefined, 'ST should be rejected from SUB_DEF1');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_DEF2`, context), undefined, 'AM should be rejected from SUB_DEF2');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_GK`, context), undefined, 'CM should be rejected from SUB_GK');

    // 16-player canonical duplicate check across starting 11 + bench 5
    vm.runInContext(`
        squadFormations['4-3-3'] = { LW: 'son_heung_min', GK: 'kim_seung_gyu' };
        squadFormation = squadFormations['4-3-3'];
        squadBenches['4-3-3'] = {};
        squadBench = squadBenches['4-3-3'];
        activeSelectorPosition = 'SUB_ATK1'; selectPlayerForPosition('super_son');
        activeSelectorPosition = 'SUB_GK';   selectPlayerForPosition('super_kim_seung_gyu');
    `, context);
    assert.strictEqual(vm.runInContext(`squadBench.SUB_ATK1`, context), undefined, 'Same player (super_son vs starting son_heung_min) must be blocked from bench');
    assert.strictEqual(vm.runInContext(`squadBench.SUB_GK`, context), undefined, 'Same player (super_kim_seung_gyu vs starting kim_seung_gyu) must be blocked from bench');
    assert.ok(toasts.some(t => t.includes('중복 배치할 수 없습니다')));

    // Per-formation bench persistence
    vm.runInContext(`
        squadFormations['4-3-3'] = {};
        squadFormation = squadFormations['4-3-3'];
        activeSelectorPosition = 'SUB_ATK1'; selectPlayerForPosition('harry_kane');
        currentFormation = '4-4-2';
        squadFormation = squadFormations['4-4-2'];
        squadBench = squadBenches['4-4-2'];
        activeSelectorPosition = 'SUB_ATK1'; selectPlayerForPosition('zinedine_zidane');
    `, context);
    assert.strictEqual(vm.runInContext(`squadBenches['4-3-3'].SUB_ATK1`, context), 'harry_kane');
    assert.strictEqual(vm.runInContext(`squadBenches['4-4-2'].SUB_ATK1`, context), 'zinedine_zidane');
}

// 2. Second-half tactical auto-substitution (Option A) preserves original squad and applies joker/lockdown/GK effects
{
    const { context } = createContext({
        playerDeck: {
            son_heung_min: { quantity: 1, awakening: 0, condition: -2 },
            mbappe: { quantity: 1, awakening: 0, condition: 0 },
            harry_kane: { quantity: 1, awakening: 0, condition: 2 },
            zinedine_zidane: { quantity: 1, awakening: 0, condition: 0 },
            ki_sung_yueng: { quantity: 1, awakening: 0, condition: 0 },
            cucurella: { quantity: 1, awakening: 0, condition: 0 },
            kim_seung_gyu: { quantity: 1, awakening: 0, condition: -2 },
            super_kim_seung_gyu: { quantity: 1, awakening: 0, condition: 2 },
            lee_jae_sung: { quantity: 1, awakening: 0, condition: 0 },
            hwang_in_beom: { quantity: 1, awakening: 0, condition: 0 }
        }
    });

    const starting = {
        ST: 'mbappe',
        LW: 'son_heung_min', // condition -2
        RW: 'lee_jae_sung',
        CM: 'hwang_in_beom',
        LCM: 'lee_jae_sung',
        GK: 'kim_seung_gyu'
    };
    const bench = {
        SUB_ATK1: 'harry_kane',
        SUB_ATK2: 'zinedine_zidane',
        SUB_DEF1: 'ki_sung_yueng',
        SUB_DEF2: 'cucurella',
        SUB_GK: 'super_kim_seung_gyu'
    };

    // 2-a. Trailing/tied at 63' and 82' -> attack jokers subbed in, joker bonus stacks to +5%, original squad untouched
    const ctxLose = context.createMatchBenchContext('4-3-3', starting, bench, context.playerDeck);
    assert.strictEqual(context.applySecondHalfBenchSubstitution(ctxLose, 45, 0, 1), null, 'No substitution in first half');

    const sub63 = context.applySecondHalfBenchSubstitution(ctxLose, 63, 0, 1);
    assert.ok(sub63 && sub63.role === 'attack', 'Should sub in attack joker when trailing at 63');
    assert.strictEqual(ctxLose.jokerScoreBonus, 0.025);
    assert.strictEqual(starting.LW, 'son_heung_min', 'Original starting squad must remain immutable');

    const sub82 = context.applySecondHalfBenchSubstitution(ctxLose, 82, 1, 1);
    assert.ok(sub82 && sub82.role === 'attack', 'Should sub in second attack joker when tied at 82');
    assert.strictEqual(ctxLose.jokerScoreBonus, 0.05);
    assert.notStrictEqual(sub63.inCardId, sub82.inCardId);

    // Scorer determination uses substituted player from matchSquad
    const goalFromSub = context.determineScorerAndAssister(1, ctxLose.matchSquad, '4-3-3', context.playerDeck);
    assert.ok(['mbappe', 'harry_kane', 'zinedine_zidane'].includes(goalFromSub.scorerId));

    // 2-b. Leading at 63' -> defense lockdown sub; Leading at 82' with low-condition GK -> GK sub
    const ctxWin = context.createMatchBenchContext('4-3-3', starting, bench, context.playerDeck);
    const winSub63 = context.applySecondHalfBenchSubstitution(ctxWin, 63, 2, 0);
    assert.ok(winSub63 && winSub63.role === 'defense', 'Should sub in defense player when leading at 63');
    assert.strictEqual(ctxWin.lockdownDefenseBonus, 0.025);

    const winSub82 = context.applySecondHalfBenchSubstitution(ctxWin, 82, 2, 0);
    assert.ok(winSub82 && winSub82.role === 'gk', 'Should sub in GK when leading at 82 with low-condition starting GK');
    assert.strictEqual(ctxWin.matchSquad.GK, 'super_kim_seung_gyu');
    assert.strictEqual(ctxWin.lockdownDefenseBonus, 0.055);
    assert.strictEqual(starting.GK, 'kim_seung_gyu', 'Original GK must stay unchanged');

    // 2-c. Knockout GK substitution before extra time/PK when GK sub unused
    const ctxKo = context.createMatchBenchContext('4-3-3', starting, { SUB_GK: 'super_kim_seung_gyu' }, context.playerDeck);
    const koSub = context.applyKnockoutGkSubstitution(ctxKo);
    assert.ok(koSub && koSub.role === 'gk' && koSub.inCardId === 'super_kim_seung_gyu');
    assert.strictEqual(ctxKo.matchSquad.GK, 'super_kim_seung_gyu');
}

// 3. Probability helpers respect bench bonuses & stay backward compatible when omitted
{
    const { context } = createContext();
    const baseScore = context.calculatePlayerScoreProb(0, 80, 80, 0, 0, 0);
    const boostedScore = context.calculatePlayerScoreProb(0, 80, 80, 0, 0, 0, 0.05);
    assert.ok(Math.abs((boostedScore - baseScore) - 0.05) < 1e-6);

    const baseOpp = context.calculateOpponentScoreProb(0, 80, 80, '4-3-3', {}, {});
    const reducedOpp = context.calculateOpponentScoreProb(0, 80, 80, '4-3-3', {}, {}, 0.05);
    assert.ok(Math.abs((baseOpp - reducedOpp) - 0.05) < 1e-6);
}

console.log('PASS: All squad bench (5 slots, role restrictions, 16-player dedup, 2nd-half tactical substitutions) tests passed!');
