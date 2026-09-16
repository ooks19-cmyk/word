const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('js/achievements.js', 'utf8');
const achievementIds = ['double', 'treble', 'invincible', 'threepeat', 'fivepeat', 'collector', 'worldclass', 'hardworldclass', 'streak10', 'streak20', 'streak30'];

function createContext({ hallOfFame = [], playerDeck = {}, ovr = 70, isHardMode = false } = {}) {
    const userAchievements = Object.fromEntries(achievementIds.map(id => [id, { unlocked: false, rewarded: false }]));
    const local = new Map();
    let saves = 0;
    const context = {
        userAchievements,
        hallOfFame,
        playerDeck,
        isHardMode,
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

const season = createContext({
    hallOfFame: [{
        year: 2026, leagueId: 'kleague1', isHardMode: false, resigned: false,
        userTeamRank: 1, userTeamStats: { l: 0 },
        cupRecord: '우승 🏆', aclRecord: '우승 🏆'
    }]
});
vm.runInContext('reconcileSeasonAchievements()', season.context);
assert.equal(season.context.userAchievements.invincible.unlocked, true);
assert.equal(season.context.userAchievements.double.unlocked, true);
assert.equal(season.context.userAchievements.treble.unlocked, true);
assert.equal(season.saves, 1, 'season reconciliation should save once');

const current = createContext({
    playerDeck: Object.fromEntries(Array.from({ length: 5 }, (_, index) => [`card${index}`, { awakening: 6 }])),
    ovr: 90
});
vm.runInContext('reconcileAchievements()', current.context);
assert.equal(current.context.userAchievements.collector.unlocked, true);
assert.equal(current.context.userAchievements.worldclass.unlocked, true);
assert.equal(current.context.userAchievements.hardworldclass.unlocked, false);
assert.equal(current.saves, 1, 'page reconciliation should save once');

const hard = createContext({ ovr: 90, isHardMode: true });
vm.runInContext('reconcileAchievements()', hard.context);
assert.equal(hard.context.userAchievements.hardworldclass.unlocked, true);
assert.equal(hard.context.userAchievements.worldclass.unlocked, false);

console.log('PASS: season achievements use Hall of Fame records; collector and world-class reconcile on page entry.');
