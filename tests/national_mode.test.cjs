const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const localStore = {};
let cloudSaveCalls = 0;
let cloudSaveForces = [];
let nationalNextSeasonCalls = 0;
let randomSeed = 20260915;
const seededRandom = () => {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 0x100000000;
};

const context = {
    console: { ...console, log() {} },
    Math: Object.assign(Object.create(Math), { random: seededRandom }),
    leagueYear: 2026,
    userPoints: 20,
    showToast() {}, renderUserPoints() {}, confirm: () => true, alert() {},
    startNextSeason() { nationalNextSeasonCalls++; },
    saveUserProgress(forceImmediate = false) { cloudSaveCalls++; cloudSaveForces.push(forceImmediate); },
    localStorage: { getItem: key => localStore[key] || null, setItem(key, value) { localStore[key] = value; } },
    document: { getElementById: () => null },
    playerDeck: {}, CARDS_DATABASE: {},
    currentFormation: '4-3-3', squadFormation: {},
    TACTICAL_POSITIONS: ['GK','LB','LCB','RCB','RB','LCM','CM','RCM','LW','ST','RW'],
    wingerStyles: {
        '4-3-3': { LW: 'dribble', RW: 'sprint' },
        '3-4-3': { LW: 'dribble', RW: 'sprint' },
        '5-4-1': { LW: 'dribble', RW: 'sprint' },
        '4-2-3-1': { LW: 'dribble', RW: 'sprint' }
    },
    strikerStyles: {
        '4-3-3': { ST: 'targetman' },
        '3-4-3': { ST: 'linebreaker' },
        '5-4-1': { ST: 'linebreaker' },
        '4-2-3-1': { ST: 'targetman' }
    },
    getActiveUserTeamName: () => '테스트팀', getActiveUserShortName: () => '테스트팀', getActiveUserStadiumName: () => '테스트 경기장',
    getAwakenedCard(id) { return context.CARDS_DATABASE[id]; },
    getFormationDisplayPosition(slot, formation = '4-3-3') {
        const overrides = {
            '4-3-3': { CM: 'DM' },
            '3-4-3': { CM: 'AM', RCM: 'DM', LCM: 'CB', LB: 'CM', RB: 'CM' },
            '5-4-1': { LW: 'LM', RW: 'RM', CM: 'CB' },
            '4-2-3-1': { LW: 'LM', RW: 'RM', CM: 'AM', LCM: 'DM', RCM: 'DM' }
        };
        return overrides[formation]?.[slot] || slot;
    }
};
const nationalEditorRoot = { innerHTML: '' };
const nationalModeRoot = { innerHTML: '' };
const nationalDrawerContent = { innerHTML: '' };
const nationalNextSeasonActionBar = { style: { display: 'none' } };
const btnNationalNextSeason = { innerHTML: '', title: '' };
context.document.getElementById = id => id === 'nationalSquadEditor' ? nationalEditorRoot : (id === 'nationalModeRoot' ? nationalModeRoot : (id === 'nationalDrawerContent' ? nationalDrawerContent : (id === 'nationalNextSeasonActionBar' ? nationalNextSeasonActionBar : (id === 'btnNationalNextSeason' ? btnNationalNextSeason : null))));
const roles = { GK:'GK', LB:'LB', LCB:'CB', RCB:'CB', RB:'RB', LCM:'CM', CM:'CM', RCM:'CM', LW:'LW', ST:'ST', RW:'RW' };
Object.entries(roles).forEach(([slot, position], index) => {
    const id = `kr_${index}`;
    context.CARDS_DATABASE[id] = { name: id, nation: 'South Korea', position, rating: 95, stats: { pac:95, sho:95, pas:95, dri:95, def:95, phy:95 } };
    context.playerDeck[id] = { isStored: false };
});
['CB','CM','CAM'].forEach((position, index) => {
    const id = `kr_extra_${position.toLowerCase()}_${index}`;
    context.CARDS_DATABASE[id] = { name: id, nation: 'South Korea', position, rating: 95, stats: { pac:95, sho:95, pas:95, dri:95, def:95, phy:95 } };
    context.playerDeck[id] = { isStored: false };
});
vm.createContext(context);
['js/utils.js', 'js/match_algorithm.js', 'js/national_data.js', 'js/national_squad.js', 'js/national.js'].forEach(file => vm.runInContext(fs.readFileSync(file, 'utf8'), context));
const yearSyncCheck=vm.runInContext(`(()=>{const originalState=nationalModeState,originalYear=leagueYear;nationalModeState=createNationalState(2026,{recordsByNation:{KR:[{year:2038}]},careerByNation:{}});leagueYear=2039;const synced=syncNationalModeYear(false),tournament=nationalTournamentForYear(synced.year);const result={year:synced.year,tournament:tournament[1],size:tournament[2],archiveYear:synced.archive.recordsByNation.KR[0].year};leagueYear=originalYear;nationalModeState=originalState;return result;})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(yearSyncCheck)),{year:2039,tournament:'아시안컵',size:16,archiveYear:2038});
const nationalSelectionLifecycle=vm.runInContext(`(()=>{const originalState=nationalModeState,originalYear=leagueYear,originalSelections=JSON.stringify(nationalNationSelections),originalTab=nationalActiveSubTab;nationalNationSelections={'2039':'KR'};leagueYear=2040;nationalModeState=createNationalState(2039);const inherited=syncNationalModeYear(false),autoSelected=inherited.selectedNationId,autoSaved=nationalNationSelections['2040'];nationalActiveSubTab='formation';renderNationalMode();const changeButtonVisible=document.getElementById('nationalModeRoot').innerHTML.includes('changeNationalTeamSelection()');changeNationalTeamSelection();const result={autoSelected,autoSaved,changeButtonVisible,selectedAfterChange:nationalModeState.selectedNationId,selectionAfterChange:nationalNationSelections['2040'],tournamentAfterChange:nationalModeState.tournament};leagueYear=originalYear;nationalModeState=originalState;nationalNationSelections=JSON.parse(originalSelections);nationalActiveSubTab=originalTab;persistNationalNationSelections();return result;})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalSelectionLifecycle)),{autoSelected:'KR',autoSaved:'KR',changeButtonVisible:true,selectedAfterChange:null,selectionAfterChange:null,tournamentAfterChange:null});
const legacyPresetMigration=vm.runInContext(`(()=>{nationalSquadPresets.LEGACY={LW:'legacy_lw'};const migrated=normalizeNationalSquadPreset('LEGACY');return {formation:migrated.currentFormation,lw:migrated.formations['4-3-3'].LW,persisted:JSON.parse(localStorage.getItem('fc_star_national_squad_presets')).LEGACY.formations['4-3-3'].LW};})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(legacyPresetMigration)),{formation:'4-3-3',lw:'legacy_lw',persisted:'legacy_lw'});
assert.equal(vm.runInContext("canBuildNationalSquad('KR').ok", context), true);
assert.equal(vm.runInContext("canBuildNationalSquad('JP').ok", context), false);
const nationalSeasonGate=vm.runInContext(`(()=>{
    const original=nationalModeState,originalToast=showToast;
    let toast='';
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';
    nationalModeState=sample;
    showToast=message=>{toast=message;};
    startNationalTournament();
    const blocked=sample.tournament===null;
    openNationalTournamentWindow();
    startNationalTournament();
    const started=!!sample.tournament;
    sample.finished=true;sample.seasonWindowOpen=false;sample.tournament={id:'worldcup',name:'월드컵',size:32};
    createNationalSeasonTransition(sample);
    startNextSeasonAfterNationalTournament();
    const nextDayToast=toast;
    const nextDayBlocked=sample.seasonTransitionPending;
    sample.seasonTransition.availableOn=getNationalCalendarDate();sample.nextSeasonAvailableDate=getNationalCalendarDate();
    startNextSeasonAfterNationalTournament();
    const result={blocked,toast:nextDayToast,started,nextDayBlocked,seasonWindowOpen:sample.seasonWindowOpen,seasonTransitionPending:sample.seasonTransitionPending,nextSeasonAvailableDate:sample.nextSeasonAvailableDate};
    nationalModeState=original;showToast=originalToast;
    return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalSeasonGate)),{blocked:true,toast:`새 시즌은 ${vm.runInContext('getNationalCalendarDate(1)',context)}부터 시작 가능합니다.`,started:true,nextDayBlocked:true,seasonWindowOpen:false,seasonTransitionPending:false,nextSeasonAvailableDate:null});
assert.equal(nationalNextSeasonCalls,1,'the next season should start only after the national tournament finishes');
const nationalFinishedFallbackCheck=vm.runInContext(`(()=>{
    const originalState=nationalModeState,originalToast=showToast,originalTab=nationalActiveSubTab,originalStartNextSeason=startNextSeason;
    let toast='',nextSeasonCalls=0;
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';sample.tournament={id:'worldcup',name:'월드컵',size:32};sample.finished=true;sample.rounds=[];
    nationalModeState=sample;nationalActiveSubTab='match';showToast=message=>{toast=message;};startNextSeason=()=>{nextSeasonCalls++;};
    renderNationalMode();
    const buttonVisible=document.getElementById('nationalNextSeasonActionBar').style.display==='flex'&&document.getElementById('btnNationalNextSeason').innerHTML.includes('진행');
    const normalizedPending=sample.seasonTransitionPending,availableDate=sample.seasonTransition.availableOn;
    startNationalMatchSimulation();
    const blockedToast=toast,blockedNextSeasonCalls=nextSeasonCalls;
    sample.seasonTransition.availableOn=getNationalCalendarDate();sample.nextSeasonAvailableDate=getNationalCalendarDate();
    startNationalMatchSimulation();
    const startedNextSeasonCalls=nextSeasonCalls;
    nationalModeState=originalState;nationalActiveSubTab=originalTab;showToast=originalToast;startNextSeason=originalStartNextSeason;
    return {buttonVisible,normalizedPending,availableDate,blockedToast,blockedNextSeasonCalls,startedNextSeasonCalls};
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalFinishedFallbackCheck)),{buttonVisible:true,normalizedPending:true,availableDate:vm.runInContext('getNationalCalendarDate(1)',context),blockedToast:`새 시즌은 ${vm.runInContext('getNationalCalendarDate(1)',context)}부터 시작 가능합니다.`,blockedNextSeasonCalls:0,startedNextSeasonCalls:1},'finished national mode must show a next-season action and route a stale match-start click through the next-season guard');
const nationalSkipTransitionCheck=vm.runInContext(`(()=>{
    const original=nationalModeState,originalToast=showToast;
    const sample=createNationalState(2026);sample.selectedNationId='KR';nationalModeState=sample;showToast=()=>{};
    openNationalTournamentWindow();skipNationalTournament();
    const cloud=serializeNationalModeStateForCloud(sample);
    const result={source:sample.seasonTransition.source,finishedOn:sample.seasonTransition.finishedOn,availableOn:sample.seasonTransition.availableOn,status:sample.seasonTransition.status,windowOpen:sample.seasonWindowOpen,cloudAvailableOn:cloud.seasonTransition.availableOn};
    nationalModeState=original;showToast=originalToast;return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalSkipTransitionCheck)),{source:'skipped',finishedOn:vm.runInContext('getNationalCalendarDate()',context),availableOn:vm.runInContext('getNationalCalendarDate(1)',context),status:'waiting',windowOpen:false,cloudAvailableOn:vm.runInContext('getNationalCalendarDate(1)',context)},'skipping national mode must create the same cloud-persisted next-season transition record');
const nationalResumeCheck=vm.runInContext(`(()=>{
    const original=nationalModeState;
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';sample.tournament={id:'worldcup',name:'월드컵',size:32};sample.rounds=[[{status:'scheduled'}]];
    sample.seasonWindowOpen=false;sample.seasonTransitionPending=true;sample.nextSeasonAvailableDate='2026-12-31';
    nationalModeState=sample;
    openNationalTournamentWindow();
    const result={sameTournament:nationalModeState.tournament===sample.tournament,seasonWindowOpen:sample.seasonWindowOpen,seasonTransitionPending:sample.seasonTransitionPending,nextSeasonAvailableDate:sample.nextSeasonAvailableDate};
    nationalModeState=original;
    return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalResumeCheck)),{sameTournament:true,seasonWindowOpen:false,seasonTransitionPending:true,nextSeasonAvailableDate:'2026-12-31'});
vm.runInContext("chooseNationalTeam('KR'); openNationalTournamentWindow(); startNationalTournament();", context);
assert.equal(vm.runInContext("nationalModeState.tournament.name", context), '월드컵', 'an incomplete national squad can start a tournament');
assert.equal(vm.runInContext("nationalRoleOvr()", context), 70, 'empty national slots use the default rating');
vm.runInContext("Object.keys(nationalModeState.squad).forEach((slot, index) => nationalModeState.squad[slot] = `kr_${index}`); Object.values(playerDeck).forEach(item=>item.isStored=true);", context);
assert.equal(vm.runInContext("isNationalSquadComplete(nationalModeState)", context), true, 'owned cards already placed in the national squad remain valid when stored');
assert.ok(vm.runInContext("getNationalEligibleCards('KR','LW','4-3-3').includes('kr_8')", context), 'stored owned cards remain selectable for the isolated national squad');
const nationalPositionCompatibility=vm.runInContext(`({
    lwToSt:getNationalEligibleCards('KR','ST','4-3-3').includes('kr_8'),
    rwToSt:getNationalEligibleCards('KR','ST','4-3-3').includes('kr_10'),
    lwToAm:getNationalEligibleCards('KR','CM','3-4-3').includes('kr_8'),
    rwToAm:getNationalEligibleCards('KR','CM','3-4-3').includes('kr_10'),
    camToLw:getNationalEligibleCards('KR','LW','4-3-3').includes('kr_extra_cam_2'),
    camToRw:getNationalEligibleCards('KR','RW','4-3-3').includes('kr_extra_cam_2'),
    rbToLb:getNationalEligibleCards('KR','LB','4-3-3').includes('kr_4'),
    lbToRb:getNationalEligibleCards('KR','RB','4-3-3').includes('kr_1')
})`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalPositionCompatibility)),{lwToSt:true,rwToSt:true,lwToAm:true,rwToAm:true,camToLw:true,camToRw:true,rbToLb:true,lbToRb:true});
vm.runInContext("startNationalTournament()", context);
assert.match(nationalModeRoot.innerHTML, /국대 라이브 중계/);
assert.match(nationalModeRoot.innerHTML, /startNationalMatchSimulation\(\)/);
const nationalFormationDataCheck=vm.runInContext(`(()=>{const allAiTeamsConfigured=nationalModeState.teams.filter(team=>team.id!=='KR').every(team=>team.formation===getNationalTeamConfig(team.id).formation),playerMatch=nationalModeState.rounds[0].find(match=>match.home.id==='KR'||match.away.id==='KR'),opponent=playerMatch.home.id==='KR'?playerMatch.away:playerMatch.home;Object.assign(opponent,{id:'MA',name:'모로코',flag:'',stars:[]});renderNationalMode();const favored=createNationalMatchEngine(playerMatch),neutralMatch={home:{...playerMatch.home},away:{...playerMatch.away}};if(neutralMatch.home.id==='KR')neutralMatch.away.id='ZZ';else neutralMatch.home.id='ZZ';const neutral=createNationalMatchEngine(neutralMatch);return {allAiTeamsConfigured,opponentFormation:favored.opponentFormation,compatibilityBonus:favored.compatibilityBonus,attackChanceDelta:Number((favored.activePlayerAttackProb-neutral.activePlayerAttackProb).toFixed(3))};})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalFormationDataCheck)),{allAiTeamsConfigured:true,opponentFormation:'5-4-1',compatibilityBonus:0.05,attackChanceDelta:0.05});
assert.match(nationalModeRoot.innerHTML,/상대 포메이션: <strong>5-4-1<\/strong>/);
assert.match(nationalModeRoot.innerHTML,/상성상 우세합니다! \(공격 찬스 확률 \+5\.0%/);
const fourThreeThreeTactics=vm.runInContext(`(()=>{const engine=createNationalMatchEngine({home:{id:'KR',name:'대한민국',rating:95,formation:'4-3-3',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:[]}});return {formationBonus:engine.formTactic.formationBonus,formationAttackBoost:engine.formTactic.formationAttackBoost,hasKeyPlayer:engine.formTactic.hasKeyPlayer,hasTeamTactic:engine.formTactic.hasTeamTactic,detailedBonus:engine.detailed.detailedTacticBonus,suitabilityBonus:engine.detailed.suitabilityBonus,playerOvr:engine.playerOvr};})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(fourThreeThreeTactics)),{formationBonus:2,formationAttackBoost:0.075,hasKeyPlayer:true,hasTeamTactic:true,detailedBonus:0.05,suitabilityBonus:0.125,playerOvr:97});
const engineCheck=vm.runInContext(`(()=>{const original=nationalModeState;const sample=createNationalState(2026);sample.selectedNationId='KR';Object.keys(sample.squad).forEach((slot,index)=>sample.squad[slot]=\`kr_\${index}\`);nationalModeState=sample;const match={home:{id:'KR',name:'대한민국',rating:95,formation:'4-3-3',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:['테스트 공격수']}};simulateNationalMatch(match);const result={home:match.score1,away:match.score2,pk1:match.pkScore1,pk2:match.pkScore2,winner:match.winner.id,gf:sample.stats.gf,ga:sample.stats.ga,played:sample.stats.w+sample.stats.l};nationalModeState=original;return result;})()`,context);
assert.equal(engineCheck.played, 1);
assert.equal(engineCheck.gf, engineCheck.home);
assert.equal(engineCheck.ga, engineCheck.away);
assert.ok(['KR','JP'].includes(engineCheck.winner));
assert.ok(engineCheck.home !== engineCheck.away || engineCheck.pk1 !== engineCheck.pk2, 'knockout match must resolve a winner');
const eliminationCompletion=vm.runInContext(`(()=>{
    const original=nationalModeState;
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';
    Object.keys(sample.squad).forEach((slot,index)=>sample.squad[slot]=\`kr_\${index}\`);
    nationalModeState=sample;
    openNationalTournamentWindow();
    startNationalTournament();
    const round=sample.rounds[0],match=round.find(item=>item.home.id==='KR'||item.away.id==='KR');
    const engine=createNationalMatchEngine(match),homeScore=engine.playerHome?0:1,awayScore=engine.playerHome?1:0;
    const won=completeNationalMatch(engine,homeScore,awayScore);
    finalizeNationalPlayerMatch(won);
    renderNationalMode();
    const record=sample.archive.recordsByNation.KR[0];
    const result={finished:sample.finished,championId:sample.championId,championNotPlayer:sample.championId!=='KR',finalResult:sample.finalResult,recordResult:record.result,allResolved:sample.rounds.every(items=>items.every(item=>item.status==='completed')),roundCount:sample.rounds.length,finalLength:sample.rounds.at(-1).length};
    nationalModeState=original;
    return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(eliminationCompletion)),{finished:true,championId:eliminationCompletion.championId,championNotPlayer:true,finalResult:'32강 진출',recordResult:'32강 진출',allResolved:true,roundCount:5,finalLength:1});
assert.ok(eliminationCompletion.championId, 'eliminated national tournament must still determine a champion');
assert.match(nationalModeRoot.innerHTML,/최종 성적: 32강 진출/);
assert.equal(vm.runInContext('nationalEliminationResult(1)',context),'준우승');
const championResetCheck=vm.runInContext(`(()=>{
    const originalState=nationalModeState,originalToast=showToast;
    let toast='';
    showToast=message=>{toast=message;};
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';sample.tournament={id:'worldcup',name:'월드컵',size:32};sample.teams=[{id:'KR',name:'대한민국',flag:'',rating:95,stars:[]}];sample.championId='KR';
    nationalModeState=sample;
    renderNationalMode();
    resetNationalTournament();
    const result={toast,statePreserved:nationalModeState===sample};
    nationalModeState=originalState;showToast=originalToast;
    return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(championResetCheck)),{toast:'🏆 우승한 대회는 초기화할 수 없습니다.',statePreserved:true});
assert.match(nationalModeRoot.innerHTML,/resetNationalTournament\(\)/);
const nationalSource=fs.readFileSync('js/national.js','utf8');
assert.match(nationalSource,/function showNationalWinnerCelebrationModal\(\)/);
assert.match(nationalSource,/window\.showNationalWinnerCelebrationModal=showNationalWinnerCelebrationModal/);
assert.match(nationalSource,/function dismissNationalWinnerCelebrationModal\(\)/);
assert.match(nationalSource,/function configureNationalWinnerConfirmation\(\)/);
assert.match(nationalSource,/button\.textContent='확인'/);
assert.match(nationalSource,/function updateNationalNextSeasonAction\(\)/);
assert.match(nationalSource,/function createNationalSeasonTransition\(state,source='completed'\)/);
assert.match(nationalSource,/finishedOn:transition\.finishedOn,availableOn:transition\.availableOn/);
assert.match(nationalSource,/function skipNationalTournament\(\)/);
assert.doesNotMatch(nationalSource, /national-formation-page[\s\S]*?skipNationalTournament/, 'the national formation page should not contain a skip tournament button');
assert.match(nationalSource,/우승 보상[\s\S]*\+10 FP/);
assert.match(nationalSource,/if\(champion\)showNationalWinnerCelebrationModal\(\);else showToast/);
assert.match(nationalSource,/새 시즌은 \$\{availableDate\}부터 시작/);
['calculateFinalMatchOvrs','getPlayerFormationTacticBonuses','getPlayerDetailedTacticBonuses','calculatePlayerScoreProb','calculateOpponentScoreProb','rollSpecialMatchEvent','simulateExtraTimeEngine','simulatePenaltyShootoutEngine'].forEach(name=>assert.match(nationalSource,new RegExp(`${name}\\(`)));
assert.match(nationalSource,/function renderNationalMode\(\)[\s\S]*state=syncNationalModeYear\(\)/);
const appSource=fs.readFileSync('app.js','utf8');
const leagueSource=fs.readFileSync('js/league.js','utf8');
const indexSource=fs.readFileSync('index.html','utf8');
const closeChampModalSource=leagueSource.match(/function closeChampModal\(\) \{([\s\S]*?)\r?\n\}\r?\n\r?\nfunction closeChampModalAndSkipNational/);
assert.ok(closeChampModalSource, 'the league champion modal close handler should exist');
const executableCloseChampModalSource=closeChampModalSource[1].replace(/\/\*[\s\S]*?\*\//g, '');
assert.match(executableCloseChampModalSource, /openNationalTournamentWindow\(\)/, 'the league champion modal should open the national-tournament window');
assert.match(executableCloseChampModalSource, /switchMatchSubTab\('national'\)/, 'the league champion modal should move to national mode');
assert.match(executableCloseChampModalSource, /startNextSeason\(\);/, 'a compatibility fallback should remain when the national script is unavailable');
assert.match(closeChampModalSource[1], /종료일 레코드/, 'the league close flow should document the transition-record gate');
assert.match(leagueSource, /function closeChampModalAndSkipNational\(\) \{[\s\S]*?skipNationalTournament\(\)/, 'the skip handler should invoke national tournament skipping');
assert.equal((leagueSource.match(/국대 대회 진행하기/g) || []).length, 3, 'every league ending result should offer national tournament entry action');
assert.equal((leagueSource.match(/국대 건너뛰기/g) || []).length, 0, 'every league ending result should not offer national tournament skip action in modal');
assert.ok(indexSource.includes(`id="matchSubTabNational" onclick="switchMatchSubTab('national')"`));
assert.match(indexSource, /id="matchLayoutLeague"[\s\S]*id="nationalNextSeasonActionBar"/, 'the next-season action belongs to the league page');
assert.doesNotMatch(appSource,/tabId === 'national' && !isDevEntry/);
assert.match(appSource,/else if \(tabId === 'national'\)[\s\S]*renderNationalMode\(\)/);
assert.doesNotMatch(leagueSource,/시즌 완료 후 페이지 새로고침 시 챔피언 확인 모달 자동 복구/);
const cloudRoundTrip=vm.runInContext(`(()=>{const source=createNationalState(2026);source.rounds=[[{status:'scheduled'}],[{status:'completed'}]];const encoded=serializeNationalModeStateForCloud(source);const decoded=deserializeNationalModeStateFromCloud(encoded);return {encodedRoundsAreArray:Array.isArray(encoded.rounds),encodedRound0IsArray:Array.isArray(encoded.rounds['0']),decodedRoundsAreArray:Array.isArray(decoded.rounds),decodedLength:decoded.rounds.length,secondStatus:decoded.rounds[1][0].status};})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(cloudRoundTrip)),{encodedRoundsAreArray:false,encodedRound0IsArray:true,decodedRoundsAreArray:true,decodedLength:2,secondStatus:'completed'});
assert.match(fs.readFileSync('js/auth.js','utf8'), /serializeNationalModeStateForCloud\(nationalModeState\)/);
assert.match(fs.readFileSync('js/auth.js','utf8'), /syncNationalModeYear\(false\)/);
const nationalStyleStorageCheck=vm.runInContext(`(()=>{
    const originalState=nationalModeState;
    const sample=createNationalState(2026);
    sample.selectedNationId='KR';
    nationalModeState=sample;
    setNationalWingerStyle('LW',true);
    setNationalStrikerStyle(true);
    const local=JSON.parse(localStorage.getItem('fc_star_national_mode_state'));
    const cloud=serializeNationalModeStateForCloud(sample);
    const restored=deserializeNationalModeStateFromCloud(cloud);
    nationalModeState=originalState;
    return {
        localLW:local.wingerStyles['4-3-3'].LW,
        localST:local.strikerStyles['4-3-3'].ST,
        cloudLW:cloud.wingerStyles['4-3-3'].LW,
        cloudST:cloud.strikerStyles['4-3-3'].ST,
        restoredLW:restored.wingerStyles['4-3-3'].LW,
        restoredST:restored.strikerStyles['4-3-3'].ST
    };
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify({localLW:nationalStyleStorageCheck.localLW,localST:nationalStyleStorageCheck.localST,cloudLW:nationalStyleStorageCheck.cloudLW,cloudST:nationalStyleStorageCheck.cloudST,restoredLW:nationalStyleStorageCheck.restoredLW,restoredST:nationalStyleStorageCheck.restoredST})),{localLW:'sprint',localST:'linebreaker',cloudLW:'sprint',cloudST:'linebreaker',restoredLW:'sprint',restoredST:'linebreaker'},'national player styles must persist locally and survive cloud serialization');
const nationalStylePresetReentryCheck=vm.runInContext(`(()=>{
    const originalState=nationalModeState,originalPresets=JSON.parse(JSON.stringify(nationalSquadPresets));
    nationalSquadPresets={};
    const configured=createNationalState(2026);configured.selectedNationId='KR';nationalModeState=configured;
    setNationalWingerStyle('LW',true);setNationalStrikerStyle(true);
    const cloudPresets=JSON.parse(JSON.stringify(nationalSquadPresets));
    const reentered=createNationalState(2027);reentered.selectedNationId='KR';nationalSquadPresets=cloudPresets;applyNationalSquadPreset(reentered,'KR');
    const result={version:cloudPresets.KR.styleSettingsVersion,lw:reentered.wingerStyles['4-3-3'].LW,st:reentered.strikerStyles['4-3-3'].ST};
    nationalModeState=originalState;nationalSquadPresets=originalPresets;
    return result;
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(nationalStylePresetReentryCheck)),{version:true,lw:'sprint',st:'linebreaker'},'national style presets must survive login re-entry even when a national season state is recreated');
for(let index=0;index<100;index++){
    const result=vm.runInContext(`(()=>{const original=nationalModeState;const sample=createNationalState(2026);sample.selectedNationId='KR';Object.keys(sample.squad).forEach((slot,i)=>sample.squad[slot]=\`kr_\${i}\`);nationalModeState=sample;const match={home:{id:'KR',name:'대한민국',rating:95,formation:'4-3-3',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:['테스트 공격수']}};simulateNationalMatch(match);nationalModeState=original;return {status:match.status,winner:match.winner.id,resolved:match.score1!==match.score2||match.pkScore1!==match.pkScore2,gf:sample.stats.gf,ga:sample.stats.ga,home:match.score1,away:match.score2,played:sample.stats.w+sample.stats.l};})()`,context);
    assert.deepEqual({status:result.status,resolved:result.resolved,played:result.played},{status:'completed',resolved:true,played:1});
    assert.equal(result.gf,result.home);
    assert.equal(result.ga,result.away);
}
assert.equal(JSON.parse(localStore.fc_star_national_nation_selections)['2026'], 'KR');
cloudSaveCalls = 0;
vm.runInContext("nationalDevState=nationalModeState; nationalDevMode=true; nationalSelectedSlot='LW'; assignNationalCard('kr_8'); nationalDevMode=false;", context);
assert.ok(cloudSaveCalls > 0, 'development formation edit should request a cloud save');
assert.equal(JSON.parse(localStore.fc_star_national_squad_presets).KR.formations['4-3-3'].LW, 'kr_8');
assert.match(fs.readFileSync('js/auth.js','utf8'), /nationalSquadPresets:/);
vm.runInContext('renderNationalSquadEditor()', context);
assert.match(nationalEditorRoot.innerHTML, /football-pitch/);
assert.match(nationalEditorRoot.innerHTML, /selector-drawer/);
assert.match(nationalEditorRoot.innerHTML, /national-formation-button active[^>]*>4-3-3<\/button>/);
assert.match(nationalEditorRoot.innerHTML, /pitch-position-label">LW/);
assert.match(nationalEditorRoot.innerHTML, /pitch-position-label">RW/);
assert.match(nationalEditorRoot.innerHTML, /팀 OVR/);
assert.match(nationalEditorRoot.innerHTML, /top:8%;left:50%/);
assert.doesNotMatch(nationalEditorRoot.innerHTML,/정포지션 \+1|national-position-bonus/);
assert.equal((nationalEditorRoot.innerHTML.match(/key-player-slot/g)||[]).length,1);
assert.match(nationalEditorRoot.innerHTML,/national-pitch-slot key-player-slot" data-key-label="★핵심 DM"/);
assert.match(nationalEditorRoot.innerHTML,/4-3-3 핵심 선수 <strong>DM<\/strong> · PAS 80 이상/);
assert.match(nationalEditorRoot.innerHTML,/활성 ✓ · kr_6 95/);
assert.doesNotMatch(nationalEditorRoot.innerHTML,/공격수 플레이스타일|선수 스타일/);
assert.match(nationalEditorRoot.innerHTML,/national-style-badge dribble" title="드리블 돌파"/);
assert.match(nationalEditorRoot.innerHTML,/national-style-badge targetman" title="타겟맨"/);
assert.match(nationalEditorRoot.innerHTML,/national-style-badge sprint" title="치고 달리기"/);
vm.runInContext("openNationalCardSelector('LW')", context);
assert.match(nationalEditorRoot.innerHTML,/national-drawer-header[\s\S]*선수 배치하기 \(LW\)[\s\S]*national-drawer-close-button[\s\S]*fa-xmark/);
assert.match(nationalDrawerContent.innerHTML,/LW 윙어 플레이스타일 설정/);
assert.match(nationalDrawerContent.innerHTML,/setNationalWingerStyle\('LW', this\.checked\)/);
assert.doesNotMatch(nationalDrawerContent.innerHTML,/국적 · 실제 .* 포지션 카드만 표시됩니다/);
const drawerBeforeStyleToggle=nationalDrawerContent.innerHTML;
vm.runInContext("setNationalWingerStyle('LW', true)", context);
assert.equal(nationalDrawerContent.innerHTML,drawerBeforeStyleToggle,'style changes must not re-render the player selector');
vm.runInContext("openNationalCardSelector('ST')", context);
assert.match(nationalDrawerContent.innerHTML,/스트라이커 플레이스타일 설정/);
assert.match(nationalDrawerContent.innerHTML,/setNationalStrikerStyle\(this\.checked\)/);
vm.runInContext("openNationalCardSelector('CM')", context);
assert.doesNotMatch(nationalDrawerContent.innerHTML,/선수 스타일/);
const nationalPitchStyleBadgeCheck=vm.runInContext(`(()=>{
    const state=nationalModeState,formation=normalizeNationalFormation(state.formation);normalizeNationalStyleSettings(state);const wingers=state.wingerStyles[formation],strikers=state.strikerStyles[formation],original={lw:wingers.LW,rw:wingers.RW,st:strikers.ST};
    wingers.LW='sprint';wingers.RW='dribble';strikers.ST='linebreaker';
    const result={lw:nationalPitchStyleBadge('LW',state,formation),st:nationalPitchStyleBadge('ST',state,formation),rw:nationalPitchStyleBadge('RW',state,formation)};
    wingers.LW=original.lw;wingers.RW=original.rw;strikers.ST=original.st;
    return result;
})()`,context);
assert.match(nationalPitchStyleBadgeCheck.lw,/national-style-badge sprint[\s\S]*치고 달리기/);
assert.match(nationalPitchStyleBadgeCheck.st,/national-style-badge linebreaker[\s\S]*라인브레이커/);
assert.match(nationalPitchStyleBadgeCheck.rw,/national-style-badge dribble[\s\S]*드리블 돌파/);
assert.ok(nationalEditorRoot.innerHTML.includes("changeNationalFormation('3-4-3')"));
assert.ok(nationalEditorRoot.innerHTML.includes("changeNationalFormation('5-4-1')"));
assert.ok(nationalEditorRoot.innerHTML.includes("changeNationalFormation('4-2-3-1')"));
const nationalStyleGoalProbability=vm.runInContext(`(()=>{
    const state=nationalModeState,originalStyles={winger:JSON.stringify(state.wingerStyles||{}),striker:JSON.stringify(state.strikerStyles||{})},originalStats={...CARDS_DATABASE.kr_8.stats};
    state.formation='4-3-3';state.squad.LW='kr_8';state.squad.ST='kr_9';
    CARDS_DATABASE.kr_8.stats={...originalStats,pac:99,sho:80,dri:70,phy:70};
    setNationalWingerStyle('LW',false);setNationalStrikerStyle(false);
    const match={home:{id:'KR',name:'대한민국',rating:95,formation:'4-3-3',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:[]}};
    const dribbleEngine=createNationalMatchEngine(match),dribbleChance=getWingerChanceStat('LW',getAwakenedCard('kr_8'),dribbleEngine.stylesW,dribbleEngine.formation),targetChance=getStrikerChanceStat('ST',getAwakenedCard('kr_8'),dribbleEngine.stylesS,dribbleEngine.formation),dribbleScoreProb=calculatePlayerScoreProb(0,dribbleChance,80,0,0,getStrikerStyleHiddenBonus(dribbleEngine.formation,dribbleEngine.stylesS)),targetScoreProb=calculatePlayerScoreProb(0,targetChance,80,0,0,getStrikerStyleHiddenBonus(dribbleEngine.formation,dribbleEngine.stylesS));
    setNationalWingerStyle('LW',true);setNationalStrikerStyle(true);
    const sprintEngine=createNationalMatchEngine(match),sprintChance=getWingerChanceStat('LW',getAwakenedCard('kr_8'),sprintEngine.stylesW,sprintEngine.formation),linebreakerChance=getStrikerChanceStat('ST',getAwakenedCard('kr_8'),sprintEngine.stylesS,sprintEngine.formation),sprintScoreProb=calculatePlayerScoreProb(0,sprintChance,80,0,0,getStrikerStyleHiddenBonus(sprintEngine.formation,sprintEngine.stylesS)),linebreakerScoreProb=calculatePlayerScoreProb(0,linebreakerChance,80,0,0,getStrikerStyleHiddenBonus(sprintEngine.formation,sprintEngine.stylesS));
    CARDS_DATABASE.kr_8.stats=originalStats;state.wingerStyles=JSON.parse(originalStyles.winger);state.strikerStyles=JSON.parse(originalStyles.striker);
    return {dribbleStyle:dribbleEngine.stylesW.LW,sprintStyle:sprintEngine.stylesW.LW,targetStyle:dribbleEngine.stylesS.ST,linebreakerStyle:sprintEngine.stylesS.ST,dribbleChance,sprintChance,targetChance,linebreakerChance,dribbleScoreProb,sprintScoreProb,targetScoreProb,linebreakerScoreProb};
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify({dribbleStyle:nationalStyleGoalProbability.dribbleStyle,sprintStyle:nationalStyleGoalProbability.sprintStyle,targetStyle:nationalStyleGoalProbability.targetStyle,linebreakerStyle:nationalStyleGoalProbability.linebreakerStyle})),{dribbleStyle:'dribble',sprintStyle:'sprint',targetStyle:'targetman',linebreakerStyle:'linebreaker'});
assert.ok(nationalStyleGoalProbability.sprintChance > nationalStyleGoalProbability.dribbleChance, 'national winger style must change its chance stat');
assert.ok(nationalStyleGoalProbability.sprintScoreProb > nationalStyleGoalProbability.dribbleScoreProb, 'national winger style must change actual goal success probability');
assert.ok(nationalStyleGoalProbability.linebreakerChance > nationalStyleGoalProbability.targetChance, 'national striker style must change its chance stat');
assert.ok(nationalStyleGoalProbability.linebreakerScoreProb > nationalStyleGoalProbability.targetScoreProb, 'national striker style must change actual goal success probability');
const formationChecks=vm.runInContext(`(()=>{
    const fillActive=()=>{
        const used=new Set();
        NATIONAL_SQUAD_SLOTS.forEach(slot=>{
            const candidates=getNationalEligibleCards('KR',slot,nationalModeState.formation).filter(candidate=>!used.has(candidate));
            const id=candidates.find(candidate=>getPositionMatchGoalBonus(slot,getAwakenedCard(candidate),nationalModeState.formation)===1)||candidates[0];
            nationalModeState.squad[slot]=id||null;
            if(id)used.add(id);
        });
        rememberNationalSquadPreset(nationalModeState);
    };
    const result={};
    changeNationalFormation('3-4-3');
    fillActive();
    const threeFourThreeEngine=createNationalMatchEngine({home:{id:'KR',name:'대한민국',rating:95,formation:'3-4-3',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:[]}});
    result.threeFourThree={
        formation:nationalModeState.formation,
        complete:isNationalSquadComplete(nationalModeState),
        labels:[getNationalSlotLabel('CM'),getNationalSlotLabel('RCM'),getNationalSlotLabel('LCM')],
        allPositionBonuses:NATIONAL_SQUAD_SLOTS.every(slot=>getPositionMatchGoalBonus(slot,getAwakenedCard(nationalModeState.squad[slot]),nationalModeState.formation)===1),
        engineFormation:threeFourThreeEngine.formation,
        formationBonus:threeFourThreeEngine.formTactic.formationBonus,
        formationAttackBoost:threeFourThreeEngine.formTactic.formationAttackBoost,
        suitabilityBonus:threeFourThreeEngine.detailed.suitabilityBonus,
        detailedBonus:threeFourThreeEngine.detailed.detailedTacticBonus,
        snapshotFormation:nationalModeState.teams.find(team=>team.id==='KR').formation,
        keySlots:NATIONAL_SQUAD_SLOTS.filter(slot=>nationalPitchCard(slot,nationalModeState).includes('key-player-slot')),
        keyStatus:getNationalKeyPlayerStatus(nationalModeState)
    };
    changeNationalFormation('5-4-1');
    fillActive();
    const fiveFourOneEngine=createNationalMatchEngine({home:{id:'KR',name:'대한민국',rating:95,formation:'5-4-1',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:[]}});
    result.fiveFourOne={
        formation:nationalModeState.formation,
        complete:isNationalSquadComplete(nationalModeState),
        labels:[getNationalSlotLabel('LW'),getNationalSlotLabel('RW'),getNationalSlotLabel('CM')],
        allPositionBonuses:NATIONAL_SQUAD_SLOTS.every(slot=>getPositionMatchGoalBonus(slot,getAwakenedCard(nationalModeState.squad[slot]),nationalModeState.formation)===1),
        formationBonus:fiveFourOneEngine.formTactic.formationBonus,
        formationAttackBoost:fiveFourOneEngine.formTactic.formationAttackBoost,
        formationScoreBoost:fiveFourOneEngine.formTactic.formationScoreBoost,
        suitabilityBonus:Number(fiveFourOneEngine.detailed.suitabilityBonus.toFixed(3)),
        detailedBonus:fiveFourOneEngine.detailed.detailedTacticBonus,
        snapshotFormation:nationalModeState.teams.find(team=>team.id==='KR').formation,
        keySlots:NATIONAL_SQUAD_SLOTS.filter(slot=>nationalPitchCard(slot,nationalModeState).includes('key-player-slot')),
        keyStatus:getNationalKeyPlayerStatus(nationalModeState)
    };
    changeNationalFormation('4-2-3-1');
    fillActive();
    const fourTwoThreeOneEngine=createNationalMatchEngine({home:{id:'KR',name:'대한민국',rating:95,formation:'4-2-3-1',stars:[]},away:{id:'JP',name:'일본',rating:95,formation:'4-4-2',stars:[]}});
    result.fourTwoThreeOne={
        formation:nationalModeState.formation,
        complete:isNationalSquadComplete(nationalModeState),
        labels:[getNationalSlotLabel('LW'),getNationalSlotLabel('CM'),getNationalSlotLabel('LCM')],
        allPositionBonuses:NATIONAL_SQUAD_SLOTS.every(slot=>getPositionMatchGoalBonus(slot,getAwakenedCard(nationalModeState.squad[slot]),nationalModeState.formation)===1),
        formationBonus:fourTwoThreeOneEngine.formTactic.formationBonus,
        formationAttackBoost:fourTwoThreeOneEngine.formTactic.formationAttackBoost,
        suitabilityBonus:fourTwoThreeOneEngine.detailed.suitabilityBonus,
        detailedBonus:fourTwoThreeOneEngine.detailed.detailedTacticBonus,
        snapshotFormation:nationalModeState.teams.find(team=>team.id==='KR').formation,
        keySlots:NATIONAL_SQUAD_SLOTS.filter(slot=>nationalPitchCard(slot,nationalModeState).includes('key-player-slot')),
        keyStatus:getNationalKeyPlayerStatus(nationalModeState)
    };
    result.saved=JSON.parse(localStorage.getItem('fc_star_national_squad_presets')).KR;
    return result;
})()`,context);
const threeFourThreeResult=JSON.parse(JSON.stringify(formationChecks.threeFourThree));
assert.deepEqual({...threeFourThreeResult,keyStatus:undefined},{
    formation:'3-4-3',complete:true,labels:['AM','DM','CB'],allPositionBonuses:true,engineFormation:'3-4-3',formationBonus:2,formationAttackBoost:0.075,suitabilityBonus:0.125,detailedBonus:0.05,snapshotFormation:'3-4-3',keySlots:['CM'],keyStatus:undefined
});
assert.deepEqual({slot:threeFourThreeResult.keyStatus.slot,role:threeFourThreeResult.keyStatus.role,stat:threeFourThreeResult.keyStatus.stat,minimum:threeFourThreeResult.keyStatus.minimum,value:threeFourThreeResult.keyStatus.value,active:threeFourThreeResult.keyStatus.active},{slot:'CM',role:'AM',stat:'dri',minimum:80,value:95,active:true});
const fiveFourOneResult=JSON.parse(JSON.stringify(formationChecks.fiveFourOne));
assert.deepEqual({...fiveFourOneResult,keyStatus:undefined},{
    formation:'5-4-1',complete:true,labels:['LM','RM','CB'],allPositionBonuses:true,formationBonus:2,formationAttackBoost:0,formationScoreBoost:0.075,suitabilityBonus:0.175,detailedBonus:0.05,snapshotFormation:'5-4-1',keySlots:['LW','RW'],keyStatus:undefined
});
assert.deepEqual({role:fiveFourOneResult.keyStatus.role,stat:fiveFourOneResult.keyStatus.stat,minimum:fiveFourOneResult.keyStatus.minimum,value:fiveFourOneResult.keyStatus.value,active:fiveFourOneResult.keyStatus.active,slots:fiveFourOneResult.keyStatus.slots},{role:'LM/RM',stat:'pac',minimum:80,value:95,active:true,slots:['LW','RW']});
const fourTwoThreeOneResult=JSON.parse(JSON.stringify(formationChecks.fourTwoThreeOne));
assert.deepEqual({...fourTwoThreeOneResult,keyStatus:undefined},{
    formation:'4-2-3-1',complete:true,labels:['LM','AM','DM'],allPositionBonuses:true,formationBonus:2,formationAttackBoost:0.075,suitabilityBonus:0.125,detailedBonus:0.05,snapshotFormation:'4-2-3-1',keySlots:['CM'],keyStatus:undefined
});
assert.deepEqual({slot:fourTwoThreeOneResult.keyStatus.slot,role:fourTwoThreeOneResult.keyStatus.role,stat:fourTwoThreeOneResult.keyStatus.stat,minimum:fourTwoThreeOneResult.keyStatus.minimum,value:fourTwoThreeOneResult.keyStatus.value,active:fourTwoThreeOneResult.keyStatus.active},{slot:'CM',role:'AM',stat:'dri',minimum:80,value:95,active:true});
assert.equal(formationChecks.saved.currentFormation,'4-2-3-1');
assert.equal(formationChecks.saved.formations['4-3-3'].LW,'kr_8');
assert.ok(formationChecks.saved.formations['3-4-3']);
assert.ok(formationChecks.saved.formations['5-4-1']);
assert.ok(formationChecks.saved.formations['4-2-3-1']);
assert.equal(vm.runInContext('nationalModeState.rounds[0].length', context), 16);
for (let index = 0; index < 5 && !vm.runInContext('nationalModeState.finished', context); index++) vm.runInContext('playNationalNextMatch()', context);
assert.equal(vm.runInContext('nationalModeState.finished', context), true);
assert.equal(vm.runInContext("nationalModeState.archive.recordsByNation.KR.length", context), 1);
vm.runInContext('openNationalModeDev()', context);
assert.equal(vm.runInContext('nationalDevState.selectedNationId', context), 'KR');
vm.runInContext("resetNationalModeDev(); openNationalTournamentWindow(); startNationalTournament();", context);
cloudSaveForces = [];
vm.runInContext('playNationalNextMatch()', context);
assert.equal(vm.runInContext('nationalModeState === nationalDevState', context), true);
assert.equal(JSON.parse(localStore.fc_star_national_mode_state).rounds[0].some(match=>match.status==='completed'), true);
assert.equal(cloudSaveForces.at(-1), true, 'national match completion should force an immediate cloud save');
assert.match(fs.readFileSync('js/auth.js','utf8'), /nationalNationSelections:/);
console.log('PASS: national 4-3-3/3-4-3/4-2-3-1 presets, position bonuses, match engine, tournament progression, and country archive.');
