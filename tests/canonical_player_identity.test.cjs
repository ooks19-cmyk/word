const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const playerDataSrc = fs.readFileSync('player_data.js', 'utf8');
const squadSrc = fs.readFileSync('js/squad.js', 'utf8');
const leagueSrc = fs.readFileSync('js/league.js', 'utf8');
const cupSrc = fs.readFileSync('js/cup.js', 'utf8');
const aclSrc = fs.readFileSync('js/acl.js', 'utf8');
const nationalDataSrc = fs.readFileSync('js/national_data.js', 'utf8');
const nationalSquadSrc = fs.readFileSync('js/national_squad.js', 'utf8');
const nationalSrc = fs.readFileSync('js/national.js', 'utf8');
const achievementsSrc = fs.readFileSync('js/achievements.js', 'utf8');

function createBaseContext(extra = {}) {
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
        currentFormation: '4-4-2',
        currentLeagueId: 'kleague1',
        leagueYear: 2026,
        isHardMode: false,
        hallOfFame: [],
        careerStats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        careerStatsHard: { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        playerDeck: {},
        squadCaptain: null,
        wingerStyles: { '4-4-2': { LW: 'dribble', RW: 'sprint' }, '4-3-3': { LW: 'dribble', RW: 'sprint' } },
        strikerStyles: { '4-4-2': { ST: 'targetman' }, '4-3-3': { ST: 'targetman' } },
        showToast: (msg) => toasts.push(msg),
        saveUserProgress: () => {},
        renderCareerStats: () => {},
        renderUserPoints: () => {},
        closeDrawer: () => {},
        getAwakenedCard: (id, deckArg) => {
            const deck = deckArg || context.playerDeck;
            const base = context.CARDS_DATABASE[id];
            if (!base) return null;
            const awk = (deck && deck[id] && deck[id].awakening) || 0;
            return { ...base, rating: base.rating + awk, awakening: awk, condition: 0 };
        },
        isPositionCompatible: (displayPos, cardPos) => {
            if (displayPos === 'GK') return cardPos === 'GK';
            if (displayPos === 'ST') return ['ST', 'LW', 'RW'].includes(cardPos);
            if (['LW', 'RW', 'LM', 'RM'].includes(displayPos)) return ['LW', 'RW', 'CAM', 'AM', 'ST'].includes(cardPos);
            if (['CM', 'LCM', 'RCM', 'DM', 'AM'].includes(displayPos)) return ['CM', 'CAM', 'AM', 'LW', 'RW'].includes(cardPos);
            if (['CB', 'LCB', 'RCB', 'LB', 'RB'].includes(displayPos)) return ['CB', 'LB', 'RB'].includes(cardPos);
            return true;
        },
        ...extra
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(playerDataSrc, context);
    context.CARDS_DATABASE = vm.runInContext('CARDS_DATABASE', context);
    return { context, storage, toasts };
}

// 1. Verify all 12 duplicate player groups + super_maradona/super_kaka keep UI names intact and map to unified canonical IDs & record names
{
    const { context } = createBaseContext();
    const groups = [
        { ids: ['son_heung_min', 'son_heung_min_W', 'super_son'], canonicalId: 'son_heung_min', recordName: '손흥민' },
        { ids: ['lionel_messi', 'super_messi'], canonicalId: 'lionel_messi', recordName: '리오넬 메시' },
        { ids: ['mbappe', 'super_mbappe'], canonicalId: 'mbappe', recordName: '음바페' },
        { ids: ['ki_sung_yueng', 'super_ki_sung_yueng'], canonicalId: 'ki_sung_yueng', recordName: '기성용' },
        { ids: ['kim_seung_gyu', 'super_kim_seung_gyu'], canonicalId: 'kim_seung_gyu', recordName: '김승규' },
        { ids: ['lee_dong_gook', 'lee_dong_gook_99'], canonicalId: 'lee_dong_gook', recordName: '이동국' },
        { ids: ['kim_jin_gyu', 'kim_jin_gyu_S'], canonicalId: 'kim_jin_gyu', recordName: '김진규' },
        { ids: ['na_sang_ho', 'na_sang_ho_L'], canonicalId: 'na_sang_ho', recordName: '나상호' },
        { ids: ['neymar', 'neymar_W'], canonicalId: 'neymar', recordName: '네이마르' },
        { ids: ['kaoru_mitoma', 'kaoru_mitoma_L'], canonicalId: 'kaoru_mitoma', recordName: '미토마' },
        { ids: ['lee_jae_sung', 'lee_jae_sung_L'], canonicalId: 'lee_jae_sung', recordName: '이재성' },
        { ids: ['hwang_in_beom', 'hwang_in_beom_L'], canonicalId: 'hwang_in_beom', recordName: '황인범' }
    ];

    // Option A: Card display names remain unchanged
    assert.strictEqual(context.CARDS_DATABASE.super_son.name, 'S손흥민');
    assert.strictEqual(context.CARDS_DATABASE.super_messi.name, 'S메시');
    assert.strictEqual(context.CARDS_DATABASE.lee_dong_gook_99.name, '이동국99');
    assert.strictEqual(context.CARDS_DATABASE.super_kaka.name, 'S카카');

    for (const g of groups) {
        for (const id of g.ids) {
            assert.strictEqual(context.getCanonicalPlayerId(id), g.canonicalId, `canonicalId mismatch for ${id}`);
            assert.strictEqual(context.getCanonicalPlayerName(id), g.recordName, `recordName mismatch for ${id}`);
        }
        assert.strictEqual(context.isSamePlayer(g.ids[0], g.ids[g.ids.length - 1]), true);
    }
    assert.strictEqual(context.isSamePlayer('super_son', 'super_messi'), false);
    assert.strictEqual(context.getCanonicalPlayerId('super_kaka'), 'kaka');
    assert.strictEqual(context.getCanonicalPlayerName('super_kaka'), '카카');
    assert.strictEqual(context.getCanonicalPlayerId('super_maradona'), 'maradona');
    assert.strictEqual(context.getCanonicalPlayerName('super_maradona'), '마라도나');
    // Unknown opponent AI player stays untouched
    assert.strictEqual(context.getCanonicalPlayerId('ulsan_joo_min_kyu'), 'ulsan_joo_min_kyu');
    assert.strictEqual(context.getCanonicalPlayerName('ulsan_joo_min_kyu', '주민규'), '주민규');
}

// 2. Verify League, Cup, ACL, National, Achievements unify goals/assists across classes
{
    const { context } = createBaseContext();
    vm.runInContext(leagueSrc, context);
    vm.runInContext(cupSrc, context);
    vm.runInContext(aclSrc, context);
    vm.runInContext(nationalDataSrc, context);
    vm.runInContext(nationalSquadSrc, context);
    vm.runInContext(nationalSrc, context);
    vm.runInContext(achievementsSrc, context);

    // 2-a. League registerGoal / registerAssist unifies son_heung_min + son_heung_min_W + super_son
    vm.runInContext(`
        leaguePlayerStats = {};
        registerGoal('son_heung_min', '손흥민', 'jeonbuk', '전북 현대');
        registerGoal('son_heung_min_W', '손흥민', 'jeonbuk', '전북 현대');
        registerGoal('super_son', 'S손흥민', 'jeonbuk', '전북 현대');
        registerAssist('super_messi', 'S메시', 'jeonbuk', '전북 현대');
        registerAssist('lionel_messi', '리오넬 메시', 'jeonbuk', '전북 현대');
        registerGoal('ulsan_ai_1', '울산 공격수', 'ulsan', '울산 HD');
    `, context);

    const lpStats = vm.runInContext('leaguePlayerStats', context);
    assert.strictEqual(lpStats['son_heung_min'].goals, 3);
    assert.strictEqual(lpStats['son_heung_min'].name, '손흥민');
    assert.strictEqual(lpStats['super_son'], undefined);
    assert.strictEqual(lpStats['son_heung_min_W'], undefined);
    assert.strictEqual(lpStats['lionel_messi'].assists, 2);
    assert.strictEqual(lpStats['lionel_messi'].name, '리오넬 메시');
    assert.strictEqual(lpStats['ulsan_ai_1'].goals, 1);

    // 2-b. Legacy split careerStats + leaguePlayerStats merge cleanly
    const legacyGoals = {
        son_heung_min: { name: '손흥민', goals: 120 },
        son_heung_min_W: { name: '손흥민', goals: 90 },
        super_son: { name: 'S손흥민', goals: 105 }
    };
    const mergedCareer = context.mergePlayerGoalsMap(legacyGoals);
    assert.strictEqual(mergedCareer.changed, true);
    assert.strictEqual(mergedCareer.merged.son_heung_min.goals, 315);
    assert.strictEqual(mergedCareer.merged.son_heung_min.name, '손흥민');
    assert.strictEqual(Object.keys(mergedCareer.merged).length, 1);

    // 2-c. Achievements getTopPlayerCareerGoals sums across split classes
    vm.runInContext(`
        careerStats = {
            w: 100, d: 10, l: 5, gf: 300, ga: 50,
            playerGoals: {
                mbappe: { name: '음바페', goals: 180 },
                super_mbappe: { name: 'S음바페', goals: 150 }
            }
        };
        careerStatsHard = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        leaguePlayerStats = {
            super_mbappe: { id: 'super_mbappe', name: 'S음바페', teamId: 'jeonbuk', teamName: '전북 현대', goals: 20, assists: 5 }
        };
    `, context);
    assert.strictEqual(vm.runInContext('getTopPlayerCareerGoals()', context), 350);

    // 2-d. Cup & ACL stat records unify S손흥민 + 손흥민 into 손흥민 & son_heung_min
    vm.runInContext(`
        cupState = { stats: { scorers: [], assisters: [] } };
        careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} };
        const jbTeam = { id: 'jeonbuk', name: '전북 현대' };
        addPlayerStatRecord(jbTeam, '손흥민', 'S메시');
        addPlayerStatRecord(jbTeam, 'S손흥민', '리오넬 메시');
    `, context);
    const cupStats = vm.runInContext('cupState.stats', context);
    assert.strictEqual(cupStats.scorers.length, 1);
    assert.strictEqual(cupStats.scorers[0].name, '손흥민');
    assert.strictEqual(cupStats.scorers[0].goals, 2);
    assert.strictEqual(cupStats.assisters.length, 1);
    assert.strictEqual(cupStats.assisters[0].name, '리오넬 메시');
    assert.strictEqual(cupStats.assisters[0].assists, 2);
    assert.strictEqual(vm.runInContext('careerStats.playerGoals.son_heung_min.goals', context), 2);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.lionel_messi.assists', context), 2);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.lionel_messi.name', context), '리오넬 메시');

    vm.runInContext(`
        aclState = { stats: { scorers: [], assisters: [] } };
        addAclPlayerStatRecord({ id: 'jeonbuk', name: '전북 현대' }, '이동국', 'S기성용');
        addAclPlayerStatRecord({ id: 'jeonbuk', name: '전북 현대' }, '이동국99', '기성용');
    `, context);
    const aclStats = vm.runInContext('aclState.stats', context);
    assert.strictEqual(aclStats.scorers.length, 1);
    assert.strictEqual(aclStats.scorers[0].name, '이동국');
    assert.strictEqual(aclStats.scorers[0].goals, 2);
    assert.strictEqual(aclStats.assisters.length, 1);
    assert.strictEqual(aclStats.assisters[0].name, '기성용');
    assert.strictEqual(aclStats.assisters[0].assists, 2);
    assert.strictEqual(vm.runInContext('careerStats.playerGoals.lee_dong_gook.goals', context), 2);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.ki_sung_yueng.assists', context), 2);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.ki_sung_yueng.name', context), '기성용');

    // 2-f. Season progress records league assists into careerStats.playerAssists and renders Hall of Fame dashboard
    const dashboardMock = { style: {}, innerHTML: '' };
    context.document.getElementById = (id) => (id === 'careerStatsDashboardNormal' ? dashboardMock : null);
    vm.runInContext(`
        hallOfFame = [];
        leagueYear = 2026;
        leagueRound = 33;
        leagueTeams = [{ id: 'jeonbuk', name: '전북 현대', w: 25, d: 5, l: 3, gf: 70, ga: 20, gd: 50, pts: 80 }];
        leaguePlayerStats = {
            son_heung_min_W: { id: 'son_heung_min_W', name: '손흥민', teamId: 'jeonbuk', teamName: '전북 현대', goals: 10, assists: 7 },
            super_son: { id: 'super_son', name: 'S손흥민', teamId: 'jeonbuk', teamName: '전북 현대', goals: 12, assists: 5 },
            super_messi: { id: 'super_messi', name: 'S메시', teamId: 'jeonbuk', teamName: '전북 현대', goals: 8, assists: 14 }
        };
        careerStats = { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {}, playerAssists: { lionel_messi: { name: '리오넬 메시', assists: 3 } } };
        recordSeasonProgressToFame(false);
        renderCareerStatsSub('normal');
    `, context);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.lionel_messi.assists', context), 17);
    assert.strictEqual(vm.runInContext('careerStats.playerAssists.son_heung_min.assists', context), 12);
    assert.ok(dashboardMock.innerHTML.includes('클럽 통산 도움 랭킹 (Top 3)'), 'Dashboard should render Top 3 assists ranking');
    assert.ok(dashboardMock.innerHTML.includes('리오넬 메시') && dashboardMock.innerHTML.includes('17도움'), 'Dashboard should show unified assists total for Messi');
    assert.ok(dashboardMock.innerHTML.includes('손흥민') && dashboardMock.innerHTML.includes('12도움'), 'Dashboard should show unified assists total for Son');

    // 2-e. National recordNationalGoal normalizes S손흥민 -> 손흥민
    const natEngine = { state: { stats: { playerGoals: {}, playerAssists: {} } } };
    context.recordNationalGoal(natEngine, { scorerId: 'super_son', scorerName: 'S손흥민', assisterId: 'lee_jae_sung_L', assisterName: '이재성' });
    context.recordNationalGoal(natEngine, { scorerId: 'son_heung_min_W', scorerName: '손흥민', assisterId: 'lee_jae_sung', assisterName: '이재성' });
    assert.strictEqual(natEngine.state.stats.playerGoals['손흥민'], 2);
    assert.strictEqual(natEngine.state.stats.playerGoals['S손흥민'], undefined);
    assert.strictEqual(natEngine.state.stats.playerAssists['이재성'], 2);
}

// 3. Verify Club Squad blocks duplicate same-player placement, allows same-slot upgrade, and auto-deduplicates legacy saves keeping highest OVR
{
    const { context, toasts } = createBaseContext({
        playerDeck: {
            son_heung_min: { quantity: 1, awakening: 0 },     // OVR 89
            son_heung_min_W: { quantity: 1, awakening: 0 },   // OVR 91
            super_son: { quantity: 1, awakening: 0 },         // OVR 94
            lionel_messi: { quantity: 1, awakening: 6 },      // OVR 93 + 6 = 99
            super_messi: { quantity: 1, awakening: 0 }        // OVR 94 + 0 = 94
        }
    });
    vm.runInContext(squadSrc, context);

    // 3-a. Legacy duplicate save cleanup keeps highest effective OVR
    const legacySquad = {
        LW: 'son_heung_min',
        ST: 'super_son',
        RW: 'lionel_messi',
        CM: 'super_messi'
    };
    const dedup = context.deduplicateSquadByPlayer(legacySquad, context.playerDeck);
    assert.strictEqual(dedup.changed, true);
    assert.strictEqual(legacySquad.ST, 'super_son', 'Should keep super_son (OVR 94)');
    assert.strictEqual(legacySquad.LW, undefined, 'Should remove lower-OVR son_heung_min (OVR 89)');
    assert.strictEqual(legacySquad.RW, 'lionel_messi', 'Should keep awakened lionel_messi (OVR 99 > 94)');
    assert.strictEqual(legacySquad.CM, undefined, 'Should remove lower-OVR super_messi (OVR 94)');

    // 3-b. Blocking placement of another class of same player in a different slot
    vm.runInContext(`
        currentFormation = '4-3-3';
        squadFormations['4-3-3'] = { LW: 'son_heung_min' };
        squadFormation = squadFormations['4-3-3'];
        activeSelectorPosition = 'ST';
        selectPlayerForPosition('super_son');
    `, context);
    assert.strictEqual(vm.runInContext(`squadFormation['ST']`, context), undefined, 'Should block placing super_son in ST when son_heung_min is in LW');
    assert.strictEqual(vm.runInContext(`squadFormation['LW']`, context), 'son_heung_min');
    assert.ok(toasts.some(t => t.includes('중복 배치할 수 없습니다')), 'Should notify user with toast');

    // 3-c. Allowing upgrading/replacing the same player in the SAME slot
    vm.runInContext(`
        activeSelectorPosition = 'LW';
        selectPlayerForPosition('super_son');
    `, context);
    assert.strictEqual(vm.runInContext(`squadFormation['LW']`, context), 'super_son', 'Should allow upgrading son_heung_min -> super_son in the same LW slot');
}

// 4. Verify National Squad blocks duplicate same-player placement & auto-deduplicates legacy saves
{
    const { context, toasts } = createBaseContext({
        playerDeck: {
            son_heung_min: { quantity: 1, awakening: 0, isStored: false },
            super_son: { quantity: 1, awakening: 0, isStored: false },
            lee_jae_sung: { quantity: 1, awakening: 0, isStored: false },
            lee_jae_sung_L: { quantity: 1, awakening: 0, isStored: false }
        }
    });
    vm.runInContext(nationalDataSrc, context);
    vm.runInContext(nationalSquadSrc, context);
    vm.runInContext(nationalSrc, context);

    vm.runInContext(`
        nationalModeState = createNationalState(2026);
        nationalModeState.selectedNationId = 'KR';
        nationalModeState.formation = '4-3-3';
        nationalModeState.squad.LW = 'son_heung_min';
        nationalSelectedSlot = 'ST';
        assignNationalCard('super_son');
    `, context);
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.ST`, context), null, 'National squad should block super_son in ST when son_heung_min is in LW');
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.LW`, context), 'son_heung_min');
    assert.ok(toasts.some(t => t.includes('중복 배치할 수 없습니다')));

    // Same slot upgrade in national squad should succeed
    vm.runInContext(`
        nationalSelectedSlot = 'LW';
        assignNationalCard('super_son');
    `, context);
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.LW`, context), 'super_son');

    // Legacy national squad dedup keeps highest OVR and sets dropped slot to null
    vm.runInContext(`
        nationalModeState.squad.LW = 'son_heung_min';
        nationalModeState.squad.ST = 'super_son';
        nationalModeState.squad.LCM = 'lee_jae_sung';
        nationalModeState.squad.RCM = 'lee_jae_sung_L';
        normalizeNationalPlayerStats(nationalModeState);
    `, context);
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.ST`, context), 'super_son');
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.LW`, context), null);
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.RCM`, context), 'lee_jae_sung_L');
    assert.strictEqual(vm.runInContext(`nationalModeState.squad.LCM`, context), null);
}

console.log('PASS: All canonical player identity, unified stats/records, and duplicate lineup prevention tests passed!');
