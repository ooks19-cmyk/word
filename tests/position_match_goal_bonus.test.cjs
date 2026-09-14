// Run: node tests/position_match_goal_bonus.test.cjs
// Uses actual game functions and chance-calculation branches, without Firebase or a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const roles = ['GK', 'LB', 'CB', 'RB', 'CM', 'CAM', 'LW', 'ST', 'RW'];
const slots = ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'ST', 'RW'];
const formations = ['4-4-2', '4-3-3', '3-4-3', '5-4-1', '4-2-3-1'];
const defaultRoles = { GK: 'GK', LB: 'LB', LCB: 'CB', RCB: 'CB', RB: 'RB',
    LCM: 'CM', CM: 'CM', RCM: 'CM', LW: 'LW', ST: 'ST', RW: 'RW' };
const overrides = {
    '4-4-2': { RW: 'ST', CM: 'RW' },
    '3-4-3': { CM: 'CAM', LB: 'CM', RB: 'CM', LCM: 'CB', RCM: 'CM' },
    '5-4-1': { CM: 'CB' },
    '4-2-3-1': { CM: 'CAM' }
};
const database = Object.fromEntries(roles.map(role => [role, {
    id: role, name: `Test ${role}`, position: role, rating: 85,
    stats: { pac: 94, sho: 88, pas: 79, dri: 86, def: 75, phy: 80 }
}]));
database.ST.stats.sho = 90;
database.CM.stats.sho = 82;
database.CAM.stats.dri = 89;
const original = Object.fromEntries(roles.map(role => [role,
    { rating: database[role].rating, stats: { ...database[role].stats } }]));
roles.forEach(role => Object.freeze(database[role].stats));
const ctx = {
    CARDS_DATABASE: database, currentFormation: '4-3-3', playerDeck: {},
    wingerStyles: { LW: 'dribble', RW: 'sprint' }, strikerStyles: { ST: 'targetman' },
    localStorage: { getItem: () => null }, console: { log() {}, warn() {}, error() {} }
};
vm.createContext(ctx);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['js/card.js', 'js/utils.js', 'js/squad.js', 'js/match_algorithm.js', 'js/realtime.js']) {
    vm.runInContext(read(file), ctx, { filename: file });
}
const run = source => vm.runInContext(source, ctx);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
function fill(formation) {
    ctx.currentFormation = formation;
    ctx.fixtureSquad = Object.fromEntries(slots.map(slot => [slot,
        overrides[formation]?.[slot] || defaultRoles[slot]]));
    run('squadFormation = fixtureSquad');
    return ctx.fixtureSquad;
}

// Every formation/slot/card-role combination: allowed off-position placement is not an exact match.
for (const formation of formations) {
    for (const slot of slots) {
        const expectedRole = overrides[formation]?.[slot] || defaultRoles[slot];
        for (const role of roles) {
            assert.equal(ctx.getPositionMatchGoalBonus(slot, database[role], formation),
                role === expectedRole ? 1 : 0, `${formation} ${slot} ${role}`);
        }
    }
}
assert.equal(ctx.getPositionMatchGoalBonus('ST', null), 0);
assert.equal(ctx.getPositionMatchGoalBonus('unknown', { position: 'unknown' }), 0);
assert.equal(ctx.getPositionMatchGoalBonus('LW', database.RW, '5-4-1'), 0);
assert.equal(ctx.getPositionMatchGoalBonus('CM', database.CM, '4-2-3-1'), 0);
assert.equal(ctx.getPositionMatchGoalBonus('CM', database.CAM, '4-2-3-1'), 1);

// Each of the six stats gets +1, while the target-man average gets +1 total, not +2.
for (const stat of ['pac', 'sho', 'pas', 'dri', 'def', 'phy']) {
    assert.equal(ctx.getGoalCalculationStat('ST', database.ST, stat, '4-3-3'), database.ST.stats[stat] + 1);
    assert.equal(ctx.getGoalCalculationStat('LW', database.ST, stat, '4-3-3'), database.ST.stats[stat]);
}
assert.equal(ctx.getStrikerChanceStat('ST', database.ST, { ST: 'targetman' }, '4-3-3'), 86);
assert.equal(ctx.getStrikerChanceStat('ST', database.ST, { ST: 'linebreaker' }, '4-3-3'), 93);
assert.equal(ctx.getStrikerChanceStat('ST', database.LW, { ST: 'targetman' }, '4-3-3'), 84);
assert.equal(ctx.getWingerChanceStat('LW', database.LW, { LW: 'dribble' }, '5-4-1'), 88);
assert.equal(ctx.getWingerChanceStat('RW', database.RW, { RW: 'sprint' }, '4-2-3-1'), 92);

// Awakening and condition stack once; repeated reads cannot accumulate the position bonus.
ctx.playerDeck = { ST: { awakening: 2, condition: 1 } };
const awakened = ctx.getAwakenedCard('ST');
assert.equal(awakened.rating, 88);
assert.equal(awakened.stats.sho, 93);
for (let i = 0; i < 20; i++) {
    assert.equal(ctx.getStrikerChanceStat('ST', awakened, { ST: 'targetman' }, '4-3-3'), 89);
}
assert.equal(awakened.stats.sho, 93);
ctx.playerDeck = {};

// Execute every actual regular-match chance branch in league/cup/ACL/challenge modules.
let chanceBranches = 0;
for (const [file, expectedCount] of [['js/league.js', 3], ['js/cup.js', 2], ['js/acl.js', 2], ['js/friendly.js', 1]]) {
    const blocks = read(file).match(/let chancePlayerStat = 75;[\s\S]*?(?=const scoreProb\s*=)/g) || [];
    assert.equal(blocks.length, expectedCount, file);
    for (const block of blocks) {
        for (const formation of formations) {
            const squad = fill(formation);
            const midfielders = ctx.getFormationMidfielders(formation, squad, ctx.playerDeck);
            const expected = {
                0: ctx.getWingerChanceStat('LW', database.LW),
                1: 86,
                2: ctx.getWingerChanceStat('RW', database[squad.RW]),
                3: Math.max(...midfielders.map(m => m.sho + 1)),
                5: database[squad.CM].stats.dri + 1
            };
            for (const option of [0, 1, 2, 3, 5]) {
                ctx.selectedOption = option;
                const actual = run(`(() => { ${block}\n return chancePlayerStat; })()`);
                assert.equal(actual, expected[option], `${file} ${formation} option ${option}`);
            }
            ctx.fixtureSquad.ST = 'LW';
            ctx.selectedOption = 1;
            assert.equal(run(`(() => { ${block}\n return chancePlayerStat; })()`), 84,
                `${file}: winger at striker gets no match bonus`);
        }
        chanceBranches++;
    }
}

// Goal-stat bonuses must not leak into OVR, team stat display, tactic thresholds or attack chances.
function metrics() {
    return JSON.stringify({ pureOvr: ctx.getPlayerPureOvr(), avgPas: ctx.getTeamAverageStat('pas'),
        avgDef: ctx.getTeamAverageStat('def'), formation: ctx.getPlayerFormationTacticBonuses(),
        detailed: ctx.getPlayerDetailedTacticBonuses(), ovrs: ctx.calculateFinalMatchOvrs('league', true, 85) });
}
const bonus = ctx.getPositionMatchGoalBonus;
for (const formation of formations) {
    fill(formation);
    const normal = metrics();
    ctx.getPositionMatchGoalBonus = () => 0;
    assert.equal(metrics(), normal);
    ctx.getPositionMatchGoalBonus = bonus;
    assert.equal(ctx.getTeamAverageStat('def'), 75);
    assert.equal(ctx.getGoalTeamAverageStat('def'), 76);
}
fill('4-3-3');
close(ctx.calculatePlayerScoreProb(0, 85, 80, 0, 0, 0), 0.29);
close(ctx.calculatePlayerScoreProb(0, 86, 80, 0, 0, 0), 0.30);
close(ctx.calculateOpponentScoreProb(0, 80, 76), 0.33);
assert.equal(ctx.calculatePlayerScoreProb(100, 999, 80, 0, 0, 0), 0.5);
assert.equal(ctx.calculatePlayerScoreProb(-100, 1, 80, 0, 0, 0), 0.1);

// PvP uses each participant's formation and style, including regular time, extra time and PSO.
ctx.attackerInfo = { id: 'attacker', formation: '3-4-3', squad: fill('3-4-3'), playerDeck: {},
    strikerStyles: { '3-4-3': { ST: 'linebreaker' }, '4-3-3': { ST: 'targetman' } } };
ctx.defenderInfo = { id: 'defender', formation: '4-2-3-1', squad: fill('4-2-3-1'), playerDeck: {} };
ctx.currentFormation = '4-3-3';
const pvp = read('js/realtime.js');
const pvpBlocks = pvp.match(/const attStId = attackerInfo\.squad\["ST"\];[\s\S]*?(?=const attFormTactic\s*=)/g) || [];
assert.equal(pvpBlocks.length, 2);
for (const block of pvpBlocks) {
    const result = run(`(() => { ${block}\n return [attStSho, defGkDef, defDefAvg]; })()`);
    assert.deepEqual(Array.from(result), [93, 76, 76]);
}
ctx.activeTeam = ctx.attackerInfo;
ctx.defenderTeam = ctx.defenderInfo;
ctx.positions = ['ST'];
ctx.kickerIdx = 0;
const psoBlock = pvp.match(/const posKey = positions\[kickerIdx % positions\.length\];[\s\S]*?(?=const psoProb\s*=)/)[0];
const pso = run(`(() => { ${psoBlock}\n return [kickerSho, gkDef]; })()`);
assert.deepEqual(Array.from(pso), [91, 76]);
for (const role of roles) {
    assert.equal(database[role].rating, original[role].rating);
    assert.deepEqual(database[role].stats, original[role].stats);
}
console.log(`PASS: 5 formation mappings; all 6 stats +1; style/awakening/condition; ${chanceBranches} match chance branches; PvP/PSO; raw stats, OVR and attack tactics unchanged.`);
