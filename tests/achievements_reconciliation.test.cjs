const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('js/achievements.js', 'utf8');
const achievementIds = [
    'double', 'treble', 'invincible', 'threepeat', 'fivepeat',
    'collector', 'worldclass', 'hardworldclass',
    'streak10', 'streak20', 'streak30',
    'goals300', 'goals500', 'goals1000',
    'wins1000', 'wins2000'
];

function createContext({ hallOfFame = [], playerDeck = {}, ovr = 70, isHardMode = false, careerStats = null, careerStatsHard = null, leagueTeams = [], config = null } = {}) {
    const userAchievements = Object.fromEntries(achievementIds.map(id => [id, { unlocked: false, rewarded: false }]));
    const local = new Map();
    let saves = 0;
    const context = {
        userAchievements,
        hallOfFame,
        playerDeck,
        isHardMode,
        careerStats: careerStats || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        careerStatsHard: careerStatsHard || { w: 0, d: 0, l: 0, gf: 0, ga: 0, playerGoals: {} },
        leagueTeams,
        getActiveLeagueConfig: () => config || { id: 'kleague1', userTeamId: 'jeonbuk', userTeamName: '전북 현대' },
        consecutiveLeagueTitles: 0,
        maxWinStreak: 0,
        getPlayerPureOvr: () => ovr,
        localStorage: { setItem: (key, value) => local.set(key, value) },
        saveUserProgress: () => { saves++; },
        showToast: () => {},
        renderUserPoints: () => {},
        document: { getElementById: () => null, createElement: () => ({}) }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { context, local, get saves() { return saves; } };
}

// 1. 시즌 명예의 전당 기반 업적 검증 (무패, 더블, 트레블)
const season = createContext({
    hallOfFame: [{
        year: 2026, leagueId: 'kleague1', isHardMode: false, resigned: false,
        userTeamRank: 1, userTeamStats: { l: 0, w: 30, gf: 80 },
        cupRecord: '우승 🏆', aclRecord: '우승 🏆'
    }]
});
vm.runInContext('reconcileSeasonAchievements()', season.context);
assert.equal(season.context.userAchievements.invincible.unlocked, true);
assert.equal(season.context.userAchievements.double.unlocked, true);
assert.equal(season.context.userAchievements.treble.unlocked, true);
assert.equal(season.saves, 1, 'season reconciliation should save once');

// 2. 수집가 및 오버롤 업적 검증
const current = createContext({
    playerDeck: Object.fromEntries(Array.from({ length: 5 }, (_, index) => [`card${index}`, { awakening: 6 }])),
    ovr: 90
});
vm.runInContext('reconcileAchievements()', current.context);
assert.equal(current.context.userAchievements.collector.unlocked, true);
assert.equal(current.context.userAchievements.worldclass.unlocked, true);
assert.equal(current.context.userAchievements.hardworldclass.unlocked, false);
assert.equal(current.saves, 1, 'page reconciliation should save once');

// 3. 어려움 모드 오버롤 업적 검증
const hard = createContext({ ovr: 90, isHardMode: true });
vm.runInContext('reconcileAchievements()', hard.context);
assert.equal(hard.context.userAchievements.hardworldclass.unlocked, true);
assert.equal(hard.context.userAchievements.worldclass.unlocked, false);

// 4. 최다 득점 선수 통산 득점 (300, 500, 1000) 및 클럽 통산 승리 (1000, 2000) 업적 검증
const careerTest = createContext({
    careerStats: {
        w: 600, d: 50, l: 50, gf: 600, ga: 100,
        playerGoals: {
            mbappe: { name: '음바페', goals: 501 },
            messi: { name: '메시', goals: 261 }
        }
    },
    careerStatsHard: { w: 450, d: 20, l: 30, gf: 450, ga: 50, playerGoals: {} },
    leagueTeams: [{ id: 'jeonbuk', w: 10, d: 2, l: 0, gf: 30, ga: 5 }]
});
vm.runInContext('reconcileAchievements()', careerTest.context);
// 총 승수: 600 + 450 + 10 = 1060승 -> wins1000 달성, wins2000 미달성
assert.equal(careerTest.context.userAchievements.wins1000.unlocked, true);
assert.equal(careerTest.context.userAchievements.wins2000.unlocked, false);

// 최다 득점 선수: 음바페 501골 -> goals300, goals500 달성, goals1000 미달성
assert.equal(careerTest.context.userAchievements.goals300.unlocked, true);
assert.equal(careerTest.context.userAchievements.goals500.unlocked, true);
assert.equal(careerTest.context.userAchievements.goals1000.unlocked, false);

// 5. 최다 득점 선수 1000골 및 클럽 2000승 달성 테스트
const win2000Test = createContext({
    careerStats: {
        w: 1500, d: 50, l: 50, gf: 2000, ga: 100,
        playerGoals: {
            ronaldo: { name: '호날두', goals: 1050 }
        }
    },
    careerStatsHard: { w: 500, d: 20, l: 30, gf: 500, ga: 50, playerGoals: {} }
});
vm.runInContext('reconcileAchievements()', win2000Test.context);
assert.equal(win2000Test.context.userAchievements.wins2000.unlocked, true);
assert.equal(win2000Test.context.userAchievements.goals1000.unlocked, true);

console.log('PASS: All achievement tests (season, collector, worldclass, player goals 300/500/1000, career wins 1000/2000) passed successfully.');
