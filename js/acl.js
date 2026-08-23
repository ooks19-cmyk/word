// js/acl.js - AFC 챔피언스리그 (아챔) & UEFA 챔피언스리그 (챔스) UI 및 토너먼트 모듈

// 0. 활성 리그 연동 헬퍼 함수
function getActiveAclTournamentName() {
    if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') {
        return "UEFA 챔피언스리그";
    }
    return "AFC 챔피언스리그";
}

function getActiveAclUserTeamId() {
    if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') {
        return "liverpool";
    }
    return "jeonbuk";
}

function getActiveAclUserTeamName() {
    if (typeof getActiveUserTeamName === 'function') {
        return getActiveUserTeamName();
    }
    if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') {
        return "리버풀 FC";
    }
    return "전북 현대";
}

function getActiveAclTeamsPreset() {
    if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') {
        if (typeof UCL_TEAMS_PRESET_EPL !== 'undefined' && UCL_TEAMS_PRESET_EPL.length > 0) {
            return UCL_TEAMS_PRESET_EPL;
        }
    }
    return (typeof ACL_TEAMS_PRESET !== 'undefined') ? ACL_TEAMS_PRESET : [];
}

function getActiveAclPlayersPreset() {
    if (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') {
        if (typeof UCL_PLAYERS_PRESET_EPL !== 'undefined' && UCL_PLAYERS_PRESET_EPL.length > 0) {
            return UCL_PLAYERS_PRESET_EPL;
        }
    }
    return (typeof OTHER_TEAMS_PLAYERS_PRESET !== 'undefined') ? OTHER_TEAMS_PLAYERS_PRESET : [];
}

function getAclStorageKey() {
    const leagueId = (typeof currentLeagueId !== 'undefined' && currentLeagueId) ? currentLeagueId : 'kleague1';
    return `fc_star_acl_state_${leagueId}`;
}

// 1. 챔피언스리그 상태 및 변수 선언
let aclState = {
    year: 2026,
    round: 16, // 16: 16강, 8: 8강, 4: 4강, 2: 결승, 1: 종료 (우승자 탄생)
    teams: [], // 16개 참여팀 리스트 { id, name, rating, color }
    bracket: {
        16: [], // 8개 경기 객체 { id, team1, team2, score1, score2, winner, status }
        8: [],  // 4개 경기 객체
        4: [],  // 2개 경기 객체
        2: [],  // 1개 경기 객체 (결승)
        winner: null // 최종 우승팀 객체
    },
    isFinished: false,
    stats: {
        scorers: [], // { name, teamName, goals, teamId }
        assisters: [] // { name, teamName, assists, teamId }
    }
};

// 2. 챔피언스리그 초기화 함수
function initAcl() {
    try {
        const key = getAclStorageKey();
        let savedState = localStorage.getItem(key);
        if (!savedState && (!currentLeagueId || currentLeagueId === 'kleague1')) {
            savedState = localStorage.getItem('fc_star_acl_state');
        }
        if (savedState) {
            aclState = JSON.parse(savedState);
            if (aclState.hasResetThisSeason === undefined) {
                aclState.hasResetThisSeason = false;
            }
            if (!aclState.stats) {
                aclState.stats = { scorers: [], assisters: [] };
            }
            if (typeof leagueYear !== 'undefined') {
                aclState.year = leagueYear;
            }
            checkAndRecoverEliminatedAcl();
            return;
        }
    } catch (e) {
        console.warn("localStorage에 접근할 수 없습니다. 메모리 상태를 사용합니다.");
    }
    
    // 신규 시즌 설정
    resetAclStateData();
}

function resetAclStateData() {
    const curYear = (typeof leagueYear !== 'undefined') ? leagueYear : 2026;
    const pureOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    const formBonus = (typeof getPlayerFormationTacticBonuses === 'function') ? getPlayerFormationTacticBonuses().formationBonus : 0;
    const playerOvr = pureOvr + formBonus; // 포메이션 전술 완성 보너스 포함
    const top20Ovr = (typeof getPlayerTop20Ovr === 'function') ? getPlayerTop20Ovr() : 70;
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
    const playerTeamId = getActiveAclUserTeamId();
    const playerTeamName = getActiveAclUserTeamName();
    const presetTeams = getActiveAclTeamsPreset();

    if (isEpl) {
        // ==========================================
        // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 프리미어리그: UEFA 챔피언스리그 (UCL 16강)
        // ==========================================
        // 1. EPL 구단 중 우리팀(리버풀)을 제외한 상위 3개 팀 선발
        let eplQualifiers = [];
        if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams) && leagueTeams.length > 0) {
            const sorted = [...leagueTeams]
                .filter(t => t.id !== playerTeamId)
                .sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    return b.gf - a.gf;
                });
            
            for (let i = 0; i < Math.min(3, sorted.length); i++) {
                eplQualifiers.push({ id: sorted[i].id, name: sorted[i].name, rating: sorted[i].rating, color: sorted[i].color || '#034694' });
            }
        }
        
        // Fallback EPL 진출 구단
        if (eplQualifiers.length < 3) {
            eplQualifiers = [
                { id: "mancity", name: "맨체스터 시티", rating: 95, color: "#6cabdd" },
                { id: "arsenal", name: "아스날", rating: 94, color: "#ef0107" },
                { id: "chelsea", name: "첼시", rating: 91, color: "#034694" }
            ];
        }

        const initializedTeams = [];
        
        // 플레이어 구단 (리버풀 FC)
        initializedTeams.push({ id: playerTeamId, name: playerTeamName, rating: playerOvr, color: '#c8102e' });
        
        // EPL 진출 3구단
        eplQualifiers.forEach(team => {
            initializedTeams.push({ id: team.id, name: team.name, rating: team.rating, color: team.color || '#2563eb' });
        });

        // 유럽 12대 명문 구단 추가 (OVR을 플레이어 OVR 기준 보정)
        presetTeams.forEach(team => {
            let adjustedRating = team.rating;
            if (["real_madrid", "bayern_munchen"].includes(team.id)) {
                // 초강호 보스팀: 플레이어 상위20개 평균 OVR + (1~2)
                adjustedRating = Math.max(88, top20Ovr + Math.floor(Math.random() * 2) + 1);
            } else if (["barcelona", "psg", "inter_milan", "leverkusen"].includes(team.id)) {
                // 강호팀: 플레이어 상위20개 평균 OVR + (0~-2)
                const offset = Math.floor(Math.random() * 3) - 2;
                adjustedRating = Math.max(85, top20Ovr + offset);
            } else {
                // 다크호스: 플레이어 상위20개 평균 OVR - (2~6)
                const offset = Math.floor(Math.random() * 5) - 6;
                adjustedRating = Math.max(80, top20Ovr + offset);
            }
            initializedTeams.push({
                id: team.id,
                name: team.name,
                rating: adjustedRating,
                color: team.color,
                emblem: team.emblem
            });
        });

        // EPL 4구단과 유럽 12구단 분산 셔플 매칭 (16강에서 EPL 구단끼리 맞붙지 않도록 분산)
        const allEplTeams = shuffleAclArray([initializedTeams[0], ...eplQualifiers]); // 4팀
        const europeanTeams = shuffleAclArray(initializedTeams.slice(4)); // 12팀

        // 16강 8경기 매칭:
        // 4경기: EPL 팀 vs 유럽 팀
        // 4경기: 유럽 팀 vs 유럽 팀
        const matches16 = [];
        for (let i = 0; i < 4; i++) {
            const isEplHome = Math.random() < 0.5;
            matches16.push({
                id: `16_${i}`,
                team1: isEplHome ? allEplTeams[i] : europeanTeams[i],
                team2: isEplHome ? europeanTeams[i] : allEplTeams[i],
                score1: null,
                score2: null,
                winner: null,
                status: "scheduled"
            });
        }
        for (let i = 0; i < 4; i++) {
            matches16.push({
                id: `16_${i + 4}`,
                team1: europeanTeams[4 + i * 2],
                team2: europeanTeams[4 + i * 2 + 1],
                score1: null,
                score2: null,
                winner: null,
                status: "scheduled"
            });
        }

        const shuffledMatches16 = shuffleAclArray(matches16);
        shuffledMatches16.forEach((m, idx) => { m.id = `16_${idx}`; });

        const matches8 = Array.from({ length: 4 }, (_, i) => ({ id: `8_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
        const matches4 = Array.from({ length: 2 }, (_, i) => ({ id: `4_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
        const matches2 = [{ id: `2_0`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }];

        aclState = {
            year: curYear,
            round: 16,
            teams: initializedTeams,
            bracket: {
                16: shuffledMatches16,
                8: matches8,
                4: matches4,
                2: matches2,
                winner: null
            },
            isFinished: false,
            stats: {
                scorers: [],
                assisters: []
            },
            hasResetThisSeason: false
        };

    } else {
        // ==========================================
        // 🇰🇷 K리그 1: AFC 챔피언스리그 (ACL 16강)
        // ==========================================
        let kLeagueQualifiers = [];
        if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams) && leagueTeams.length > 0) {
            const sorted = [...leagueTeams]
                .filter(t => t.id !== 'jeonbuk')
                .sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if (b.gd !== a.gd) return b.gd - a.gd;
                    return b.gf - a.gf;
                });
            
            if (sorted.length >= 2) {
                kLeagueQualifiers.push({ id: sorted[0].id, name: sorted[0].name, rating: sorted[0].rating });
                kLeagueQualifiers.push({ id: sorted[1].id, name: sorted[1].name, rating: sorted[1].rating });
            }
        }
        
        if (kLeagueQualifiers.length < 2) {
            kLeagueQualifiers = [
                { id: "ulsan", name: "울산 HD", rating: 80 },
                { id: "seoul", name: "FC 서울", rating: 78 }
            ];
        }

        const initializedTeams = [];
        
        // 플레이어 팀 추가 (전북)
        initializedTeams.push({ id: 'jeonbuk', name: '전북 현대', rating: playerOvr, color: '#005a3c' });
        
        // K리그 진출 구단 2팀 추가
        kLeagueQualifiers.forEach(team => {
            initializedTeams.push({ id: team.id, name: team.name, rating: team.rating, color: '#2563eb' });
        });
        
        // 해외 13개 팀 추가 (OVR을 플레이어 OVR 기준 보정)
        const westTeamIds = ["al_hilal", "al_nassr", "al_ahli", "al_itihad", "al_ain", "al_sadd", "persepolis", "pakhtakor"];
        const chosenBossWestTeamId = westTeamIds[Math.floor(Math.random() * westTeamIds.length)];
        const strongAclTeams = ["vissel_kobe", "yokohama_marinos", "kawasaki_frontale", "al_hilal", "al_nassr", "al_ahli", "al_itihad", "al_ain", "al_sadd"];

        presetTeams.forEach(team => {
            let adjustedRating;
            if (team.id === chosenBossWestTeamId) {
                adjustedRating = Math.max(55, top20Ovr + 1);
            } else if (strongAclTeams.includes(team.id)) {
                const offset = Math.floor(Math.random() * 3) - 2;
                adjustedRating = Math.max(55, top20Ovr + offset);
            } else {
                const offset = Math.floor(Math.random() * 9) - 10;
                adjustedRating = Math.max(55, top20Ovr + offset);
            }
            initializedTeams.push({
                id: team.id,
                name: team.name,
                rating: adjustedRating,
                color: team.color
            });
        });

        // 동아시아(8팀) 및 서아시아(8팀) 브라켓 분리 및 16강 경기 배치
        const eastTeams = initializedTeams.filter(t => ['jeonbuk', 'ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon', 'vissel_kobe', 'yokohama_marinos', 'kawasaki_frontale', 'shanghai_port', 'buriram_united'].includes(t.id));
        const westTeams = initializedTeams.filter(t => !eastTeams.some(et => et.id === t.id));
        
        const kLeagueIds = ['jeonbuk', ...kLeagueQualifiers.map(q => q.id)];
        const eastKLeagueTeams = eastTeams.filter(t => kLeagueIds.includes(t.id));
        const eastForeignTeams = eastTeams.filter(t => !kLeagueIds.includes(t.id));
        
        const shuffledKLeague = shuffleAclArray(eastKLeagueTeams);
        const shuffledForeign = shuffleAclArray(eastForeignTeams);
        
        const eastMatches = [
            { team1: shuffledKLeague[0], team2: shuffledForeign[0] },
            { team1: shuffledKLeague[1], team2: shuffledForeign[1] },
            { team1: shuffledKLeague[2], team2: shuffledForeign[2] },
            { team1: shuffledForeign[3], team2: shuffledForeign[4] }
        ];
        
        const shuffledEastMatches = shuffleAclArray(eastMatches);
        const shuffledWest = shuffleAclArray(westTeams);
        
        const matches16 = [];
        
        // 동아시아 16강 (4경기: 16_0 ~ 16_3)
        for (let i = 0; i < 4; i++) {
            matches16.push({
                id: `16_${i}`,
                team1: shuffledEastMatches[i].team1,
                team2: shuffledEastMatches[i].team2,
                score1: null,
                score2: null,
                winner: null,
                status: "scheduled"
            });
        }
        
        // 서아시아 16강 (4경기: 16_4 ~ 16_7)
        for (let i = 4; i < 8; i++) {
            matches16.push({
                id: `16_${i}`,
                team1: shuffledWest[(i - 4) * 2],
                team2: shuffledWest[(i - 4) * 2 + 1],
                score1: null,
                score2: null,
                winner: null,
                status: "scheduled"
            });
        }

        const matches8 = Array.from({ length: 4 }, (_, i) => ({ id: `8_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
        const matches4 = Array.from({ length: 2 }, (_, i) => ({ id: `4_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
        const matches2 = [{ id: `2_0`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }];

        aclState = {
            year: curYear,
            round: 16,
            teams: initializedTeams,
            bracket: {
                16: matches16,
                8: matches8,
                4: matches4,
                2: matches2,
                winner: null
            },
            isFinished: false,
            stats: {
                scorers: [],
                assisters: []
            },
            hasResetThisSeason: false
        };
    }

    saveAclState();
}

function saveAclState() {
    try {
        const key = getAclStorageKey();
        localStorage.setItem(key, JSON.stringify(aclState));
        if (!currentLeagueId || currentLeagueId === 'kleague1') {
            localStorage.setItem('fc_star_acl_state', JSON.stringify(aclState));
        }
    } catch(e) {}
    if (typeof saveUserProgress === 'function' && typeof currentUser !== 'undefined' && currentUser) {
        saveUserProgress();
    }
}

// 플레이어가 탈락했을 때 자동 복구 및 남은 토너먼트 시뮬레이션
function checkAndRecoverEliminatedAcl() {
    if (aclState.isFinished) return;
    const playerTeamId = getActiveAclUserTeamId();
    
    let isPlayerEliminated = false;
    [16, 8, 4, 2].forEach(roundKey => {
        const matches = aclState.bracket[roundKey] || [];
        matches.forEach(match => {
            if (match.status === 'completed') {
                const hasPlayer = (match.team1 && match.team1.id === playerTeamId) || (match.team2 && match.team2.id === playerTeamId);
                if (hasPlayer) {
                    const isPlayerWinner = (match.winner === 'team1' && match.team1.id === playerTeamId) ||
                                          (match.winner === 'team2' && match.team2.id === playerTeamId);
                    if (!isPlayerWinner) {
                        isPlayerEliminated = true;
                    }
                }
            }
        });
    });
    
    if (isPlayerEliminated) {
        console.log(`플레이어가 ${getActiveAclTournamentName()}에서 탈락한 상태를 감지했습니다. 남은 대회를 자동 시뮬레이션 처리합니다.`);
        simulateRemainingAclRounds();
    }
}

function simulateRemainingAclRounds() {
    while (!aclState.isFinished) {
        const curRound = aclState.round;
        
        simulateAclAiMatches(curRound);
        
        if (curRound === 16) {
            const matches16 = aclState.bracket[16];
            const matches8 = aclState.bracket[8];
            const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
            
            if (isEpl) {
                // EPL 챔스: 16강 승자 8팀을 순차적으로 8강 매칭
                for (let i = 0; i < 4; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
            } else {
                // K리그 아챔: 동아시아(16_0~3) 8강전 2경기, 서아시아(16_4~7) 8강전 2경기
                for (let i = 0; i < 2; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
                for (let i = 2; i < 4; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
            }
            aclState.round = 8;
        } else if (curRound === 8) {
            const matches8 = aclState.bracket[8];
            const matches4 = aclState.bracket[4];
            const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
            
            if (isEpl) {
                // EPL 챔스: 8강 승자 매칭 (8_0 vs 8_1, 8_2 vs 8_3)
                for (let i = 0; i < 2; i++) {
                    const m1 = matches8[i * 2];
                    const m2 = matches8[i * 2 + 1];
                    matches4[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches4[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches4[i].status = "scheduled";
                }
            } else {
                // K리그 아챔: 동-서 교차 4강전 매치 생성 (East 1 vs West 1, East 2 vs West 2)
                matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
                matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
                matches4[0].status = "scheduled";
                
                matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
                matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
                matches4[1].status = "scheduled";
            }
            
            aclState.round = 4;
        } else if (curRound === 4) {
            const matches4 = aclState.bracket[4];
            const matches2 = aclState.bracket[2];
            const m1 = matches4[0];
            const m2 = matches4[1];
            matches2[0].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
            matches2[0].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
            matches2[0].status = "scheduled";
            aclState.round = 2;
        } else if (curRound === 2) {
            const finalMatch = aclState.bracket[2][0];
            if (finalMatch.status !== 'completed') {
                const rateDiff = (finalMatch.team1 ? finalMatch.team1.rating : 70) - (finalMatch.team2 ? finalMatch.team2.rating : 70);
                let score1 = Math.floor(Math.random() * 3);
                let score2 = Math.floor(Math.random() * 3);
                if (rateDiff > 5) score1 += 1;
                else if (rateDiff < -5) score2 += 1;
                if (score1 === score2) {
                    if (Math.random() > 0.5) score1 += 1;
                    else score2 += 1;
                }
                finalMatch.score1 = score1;
                finalMatch.score2 = score2;
                finalMatch.winner = score1 > score2 ? 'team1' : 'team2';
                finalMatch.status = 'completed';
                
                const winnerTeam = score1 > score2 ? finalMatch.team1 : finalMatch.team2;
                if (typeof determineOpponentScorerAndAssister === 'function') {
                    const oppGoalData = determineOpponentScorerAndAssister(winnerTeam.id);
                    addAclPlayerStatRecord(winnerTeam, oppGoalData.scorerName, oppGoalData.assisterName);
                } else {
                    addAclPlayerStatRecord(winnerTeam, null, null);
                }
            }
            
            const champion = finalMatch.winner === 'team1' ? finalMatch.team1 : finalMatch.team2;
            aclState.bracket.winner = champion;
            aclState.round = 1;
            aclState.isFinished = true;
        }
    }
    saveAclState();
}

// 3. 아챔/챔스 탭 로드 시 렌더링 호출
function initAclTab() {
    checkAndRecoverEliminatedAcl();

    const tournamentName = getActiveAclTournamentName();
    const seasonText = document.getElementById('aclSeasonYearText');
    if (seasonText) {
        seasonText.textContent = `${aclState.year} ${tournamentName}`;
    }
    
    const roundValText = document.getElementById('aclRoundVal');
    if (roundValText) {
        roundValText.textContent = getAclRoundText(aclState.round);
    }

    updateAclPlayerTeamOvr();
    updateAclScoreboard();
    renderAclBracket();
    renderAclStats();
}

// 4. 플레이어 팀 및 상대팀 OVR 동적 동기화
function updateAclPlayerTeamOvr() {
    const pureOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    const formBonus = (typeof getPlayerFormationTacticBonuses === 'function') ? getPlayerFormationTacticBonuses().formationBonus : 0;
    const playerOvr = pureOvr + formBonus; // 포메이션 전술 완성 보너스 포함
    const playerTeamId = getActiveAclUserTeamId();
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
    
    // 1. aclState.teams 동기화
    aclState.teams.forEach(team => {
        if (team.id === playerTeamId) {
            team.rating = playerOvr;
        } else if (!isEpl && ['ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon'].includes(team.id)) {
            // 다른 K리그 구단은 리그 OVR과 맞춤 동기화
            if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                const leagueTeam = leagueTeams.find(t => t.id === team.id);
                if (leagueTeam && leagueTeam.rating !== undefined) {
                    team.rating = leagueTeam.rating;
                }
            }
        } else if (isEpl) {
            // EPL 국내 진출 구단(맨시티, 아스날, 첼시 등)은 리그 OVR 동기화
            if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                const leagueTeam = leagueTeams.find(t => t.id === team.id);
                if (leagueTeam && leagueTeam.rating !== undefined) {
                    team.rating = leagueTeam.rating;
                }
            }
        }
    });
    
    // 2. 대진표(bracket) 내의 팀들 동기화
    [16, 8, 4, 2].forEach(roundKey => {
        aclState.bracket[roundKey].forEach(match => {
            if (match.team1) {
                if (match.team1.id === playerTeamId) {
                    match.team1.rating = playerOvr;
                } else if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                    const leagueTeam = leagueTeams.find(t => t.id === match.team1.id);
                    if (leagueTeam && leagueTeam.rating !== undefined) {
                        match.team1.rating = leagueTeam.rating;
                    }
                }
            }
            if (match.team2) {
                if (match.team2.id === playerTeamId) {
                    match.team2.rating = playerOvr;
                } else if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                    const leagueTeam = leagueTeams.find(t => t.id === match.team2.id);
                    if (leagueTeam && leagueTeam.rating !== undefined) {
                        match.team2.rating = leagueTeam.rating;
                    }
                }
            }
        });
    });
    
    saveAclState();
}

// 5. 스코어보드 정보 업데이트
function updateAclScoreboard() {
    // 상대팀 분석 카드 숨기기
    const analysisCard = document.getElementById('aclOpponentAnalysisCard');
    if (analysisCard) analysisCard.style.display = 'none';

    const playerTeamId = getActiveAclUserTeamId();
    const playerTeamName = getActiveAclUserTeamName();
    const tournamentName = getActiveAclTournamentName();
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');

    if (aclState.isFinished) {
        const winner = aclState.bracket.winner || { name: playerTeamName, rating: 75 };
        const isPlayerWinner = winner.id === playerTeamId;
        
        document.getElementById('aclRoundVal').textContent = "대회 종료";
        document.getElementById('aclHomeTeamName').textContent = winner.name;
        document.getElementById('aclAwayTeamName').textContent = isPlayerWinner ? "우승 달성!" : "우승 차지!";
        document.getElementById('aclHomeTeamOvr').textContent = winner.rating;
        document.getElementById('aclAwayTeamOvr').textContent = "-";
        document.getElementById('aclHomeScore').textContent = "🏆";
        document.getElementById('aclAwayScore').textContent = "";
        document.getElementById('aclSbTimeDisplay').textContent = "FINISH";
        document.getElementById('aclSbTimeDisplay').classList.remove('live-ticking');
        document.getElementById('aclMatchVenueDisplay').textContent = isPlayerWinner 
            ? `${tournamentName} 우승을 축하합니다! 최정상 구단에 등극했습니다.` 
            : `${tournamentName} 시즌 완료. (${winner.name} 우승)`;
        
        const btn = document.getElementById('btnStartAclMatch');
        if (btn) {
            btn.disabled = true;
            if (isPlayerWinner) {
                btn.innerHTML = `<i class="fa-solid fa-trophy" style="margin-right: 8px;"></i>${tournamentName} 우승 완료`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락 (대회 종료)`;
            }
        }
        return;
    }

    const curRound = aclState.round;
    const matches = aclState.bracket[curRound];
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === playerTeamId) || (m.team2 && m.team2.id === playerTeamId));

    const btn = document.getElementById('btnStartAclMatch');
    const timeDisplay = document.getElementById('aclSbTimeDisplay');

    if (!playerMatch) {
        document.getElementById('aclHomeTeamName').textContent = playerTeamName;
        document.getElementById('aclAwayTeamName').textContent = "토너먼트 탈락";
        document.getElementById('aclHomeTeamOvr').textContent = "-";
        document.getElementById('aclAwayTeamOvr').textContent = "-";
        document.getElementById('aclHomeScore').textContent = "L";
        document.getElementById('aclAwayScore').textContent = "O";
        if (timeDisplay) {
            timeDisplay.textContent = "OUT";
            timeDisplay.classList.remove('live-ticking');
        }
        document.getElementById('aclMatchVenueDisplay').textContent = `${playerTeamName}가 탈락했습니다.`;
        
        if (analysisCard) analysisCard.style.display = 'none';
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락`;
        }
        return;
    }

    const t1 = playerMatch.team1;
    const t2 = playerMatch.team2;

    document.getElementById('aclHomeTeamName').textContent = t1.name;
    document.getElementById('aclAwayTeamName').textContent = t2.name;
    document.getElementById('aclHomeTeamOvr').textContent = t1.rating;
    document.getElementById('aclAwayTeamOvr').textContent = t2.rating;

    // 상대팀 정보 요약 프레임 연동
    const opponent = t1.id === playerTeamId ? t2 : t1;
    const oppFormation = TEAM_FORMATIONS_PRESET[opponent.id] || "4-4-2";
    const compBonus = getFormationCompatibilityBonus(currentFormation, oppFormation);
    
    if (analysisCard) {
        analysisCard.style.display = 'block';
        document.getElementById('aclOpponentFormationText').innerText = oppFormation;
        document.getElementById('aclOpponentMoodText').innerHTML = `보통 😐`;
        
        const compTextEl = document.getElementById('aclOpponentCompatibilityText');
        if (compTextEl) {
            compTextEl.className = 'opponent-analysis-tactic-row';
            if (compBonus > 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-advantage');
                compTextEl.innerHTML = `${playerTeamName}의 <strong>${currentFormation}</strong> 전술이 상대의 <strong>${oppFormation}</strong> 전술에 상성상 우세합니다! (공격 찬스 확률 +5.0% ⚡)`;
            } else if (compBonus < 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-disadvantage');
                compTextEl.innerHTML = `상대의 <strong>${oppFormation}</strong> 전술이 ${playerTeamName}의 <strong>${currentFormation}</strong> 전술에 상성상 우세합니다. (공격 찬스 확률 -5.0% ⚠️)`;
            } else {
                compTextEl.style.display = 'none';
            }
        }
    }
    
    if (playerMatch.status === 'completed') {
        let score1Str = playerMatch.score1;
        let score2Str = playerMatch.score2;
        if (playerMatch.pkScore1 !== undefined && playerMatch.pkScore2 !== undefined) {
            score1Str += ` (${playerMatch.pkScore1})`;
            score2Str += ` (${playerMatch.pkScore2})`;
        }
        document.getElementById('aclHomeScore').textContent = score1Str;
        document.getElementById('aclAwayScore').textContent = score2Str;
        
        if (timeDisplay) {
            timeDisplay.textContent = '종료';
            timeDisplay.classList.remove('live-ticking');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-forward" style="margin-right: 8px;"></i>다음 라운드 진출 확정`;
        }
    } else {
        document.getElementById('aclHomeScore').textContent = "0";
        document.getElementById('aclAwayScore').textContent = "0";
        if (timeDisplay) {
            timeDisplay.textContent = `${isEpl ? 'UCL' : 'ACL'} VS`;
            timeDisplay.classList.remove('live-ticking');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i>${tournamentName} 경기 시작 (15초 소요)`;
        }
    }

    const homeEmblemEl = document.getElementById('aclHomeEmblem');
    const awayEmblemEl = document.getElementById('aclAwayEmblem');
    if (homeEmblemEl) {
        homeEmblemEl.innerHTML = getAclTeamEmblemHtml(t1, 48);
        if (t1.id === playerTeamId) {
            homeEmblemEl.classList.add('jeonbuk-emblem-box');
        } else {
            homeEmblemEl.classList.remove('jeonbuk-emblem-box');
        }
    }
    if (awayEmblemEl) {
        awayEmblemEl.innerHTML = getAclTeamEmblemHtml(t2, 48);
        if (t2.id === playerTeamId) {
            awayEmblemEl.classList.add('jeonbuk-emblem-box');
        } else {
            awayEmblemEl.classList.remove('jeonbuk-emblem-box');
        }
    }
    
    document.getElementById('aclMatchVenueDisplay').textContent = `${getAclRoundText(curRound)} 단판 승부 (중립 구장)`;
}

// 6. 대진표 (Bracket Tree) 렌더링 함수
function renderAclBracket() {
    const container = document.getElementById('aclBracketContainer');
    if (!container) return;

    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
    const tournamentName = getActiveAclTournamentName();
    let html = '';

    // 16강전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title" style="color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">16강전</div>
        <div class="bracket-match-list">`;
    aclState.bracket[16].forEach(match => {
        html += renderAclMatchNode(match, 16);
    });
    html += `</div></div>`;

    // 8강전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title" style="color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">8강전</div>
        <div class="bracket-match-list">`;
    aclState.bracket[8].forEach(match => {
        html += renderAclMatchNode(match, 8);
    });
    html += `</div></div>`;

    // 준결승전 컬럼
    const semiTitle = isEpl ? '준결승전 (4강)' : '준결승 (동-서 교차)';
    html += `<div class="bracket-round">
        <div class="bracket-round-title" style="color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">${semiTitle}</div>
        <div class="bracket-match-list">`;
    aclState.bracket[4].forEach(match => {
        html += renderAclMatchNode(match, 4);
    });
    html += `</div></div>`;

    // 결승전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title" style="color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">결승전</div>
        <div class="bracket-match-list">`;
    aclState.bracket[2].forEach(match => {
        html += renderAclMatchNode(match, 2);
    });
    html += `</div></div>`;

    // 우승팀 정보 컬럼
    html += `<div class="bracket-round" style="justify-content: center; align-items: center; min-width: 150px;">
        <div class="bracket-round-title" style="width: 100%; color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">우승팀</div>`;
    if (aclState.bracket.winner) {
        html += `
        <div class="bracket-winner-node" style="border-color: rgba(0, 255, 135, 0.4); box-shadow: 0 8px 24px rgba(0, 255, 135, 0.2); background: radial-gradient(circle at top, rgba(0, 255, 135, 0.15) 0%, rgba(10, 14, 26, 0.95) 100%);">
            <div class="bracket-winner-title" style="color:#00ff87;"><i class="fa-solid fa-trophy"></i> ${isEpl ? 'UCL' : 'ACL'} CHAMPION</div>
            <div class="bracket-winner-name">
                ${getAclTeamEmblemHtml(aclState.bracket.winner, 20)}
                <span style="margin-left: 4px;">${aclState.bracket.winner.name}</span>
            </div>
        </div>`;
    } else {
        html += `
        <div class="bracket-winner-node" style="opacity: 0.5; border-style: dashed; background: transparent; box-shadow: none; animation: none;">
            <div class="bracket-winner-title" style="color:var(--text-muted);">${isEpl ? 'UCL' : 'ACL'} CHAMPION</div>
            <div class="bracket-winner-name" style="color: var(--text-muted);">대기 중</div>
        </div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
}

function renderAclMatchNode(match, round) {
    const playerTeamId = getActiveAclUserTeamId();
    const isPlayerMatch = (match.team1 && match.team1.id === playerTeamId) || (match.team2 && match.team2.id === playerTeamId);
    const isActive = (aclState.round === round && isPlayerMatch && match.status !== 'completed');
    const activeClass = isActive ? 'match-active' : '';
    
    let t1Html = '';
    if (match.team1) {
        let t1Class = '';
        if (match.winner === 'team1') t1Class = 'team-won';
        else if (match.winner === 'team2') t1Class = 'team-lost';
        if (match.team1.id === playerTeamId) t1Class += ' team-player';
        
        let score1Val = match.score1 !== null ? match.score1 : '-';
        if (match.pkScore1 !== undefined && match.pkScore2 !== undefined) {
            score1Val = `${match.score1} (${match.pkScore1})`;
        }
        
        t1Html = `
            <div class="bracket-team ${t1Class}">
                <span class="bracket-team-name">
                    ${getAclTeamEmblemHtml(match.team1, 14)}
                    <span>${match.team1.name}</span>
                </span>
                <span class="bracket-team-score">${score1Val}</span>
            </div>
        `;
    } else {
        t1Html = `
            <div class="bracket-team">
                <span class="bracket-team-name" style="color: var(--text-muted);">미정</span>
                <span class="bracket-team-score">-</span>
            </div>
        `;
    }

    let t2Html = '';
    if (match.team2) {
        let t2Class = '';
        if (match.winner === 'team2') t2Class = 'team-won';
        else if (match.winner === 'team1') t2Class = 'team-lost';
        if (match.team2.id === playerTeamId) t2Class += ' team-player';
        
        let score2Val = match.score2 !== null ? match.score2 : '-';
        if (match.pkScore1 !== undefined && match.pkScore2 !== undefined) {
            score2Val = `${match.score2} (${match.pkScore2})`;
        }
        
        t2Html = `
            <div class="bracket-team ${t2Class}">
                <span class="bracket-team-name">
                    ${getAclTeamEmblemHtml(match.team2, 14)}
                    <span>${match.team2.name}</span>
                </span>
                <span class="bracket-team-score">${score2Val}</span>
            </div>
        `;
    } else {
        t2Html = `
            <div class="bracket-team">
                <span class="bracket-team-name" style="color: var(--text-muted);">미정</span>
                <span class="bracket-team-score">-</span>
            </div>
        `;
    }

    return `
        <div class="bracket-match ${activeClass}">
            ${t1Html}
            ${t2Html}
        </div>
    `;
}

// 7. 팀 엠블럼 렌더링 헬퍼
function getAclTeamEmblemHtml(team, size = 20) {
    if (!team) return '';
    const emblem = team.emblem || (typeof getTeamEmblemPath === 'function' ? getTeamEmblemPath(team.id) : '');
    if (emblem && (emblem.endsWith('.png') || emblem.endsWith('.svg') || emblem.endsWith('.jpg') || emblem.includes('/'))) {
        return `<img src="${emblem}" alt="${team.name}" style="width: ${size}px; height: ${size}px; object-fit: contain; vertical-align: middle; margin-right: 4px; display: inline-block;">`;
    }
    return `<span style="font-size: ${Math.max(10, size - 4)}px; margin-right: 4px;">⚽</span>`;
}

// 8. 득점/도움 순위판 렌더링
function renderAclStats() {
    const goalsBody = document.getElementById('aclGoalsBody');
    const assistsBody = document.getElementById('aclAssistsBody');
    if (!goalsBody || !assistsBody) return;

    const playerTeamId = getActiveAclUserTeamId();

    if (aclState.stats && aclState.stats.scorers) {
        aclState.stats.scorers.sort((a, b) => b.goals - a.goals);
    }
    if (aclState.stats && aclState.stats.assisters) {
        aclState.stats.assisters.sort((a, b) => b.assists - a.assists);
    }

    goalsBody.innerHTML = '';
    if (!aclState.stats.scorers || aclState.stats.scorers.length === 0) {
        goalsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px; font-size: 0.8rem;">득점 기록이 없습니다.</td></tr>`;
    } else {
        aclState.stats.scorers.slice(0, 5).forEach((p, idx) => {
            const isPlayer = p.teamId === playerTeamId;
            const rowStyle = isPlayer ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #ffd700;"' : '';
            goalsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #ffd700;">${p.goals}</td>
                </tr>
            `;
        });
    }

    assistsBody.innerHTML = '';
    if (!aclState.stats.assisters || aclState.stats.assisters.length === 0) {
        assistsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px; font-size: 0.8rem;">도움 기록이 없습니다.</td></tr>`;
    } else {
        aclState.stats.assisters.slice(0, 5).forEach((p, idx) => {
            const isPlayer = p.teamId === playerTeamId;
            const rowStyle = isPlayer ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #00ff87;"' : '';
            assistsBody.innerHTML += `
                <tr ${rowStyle} style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <td style="padding: 6px; text-align: center;">${idx + 1}</td>
                    <td style="padding: 6px;">${p.name}</td>
                    <td style="padding: 6px; color: #94a3b8; font-size: 0.72rem;">${p.teamName}</td>
                    <td style="padding: 6px; text-align: center; font-weight: bold; color: #00ff87;">${p.assists}</td>
                </tr>
            `;
        });
    }
}

// 9. 챔피언스리그 경기 시뮬레이터 (15초 라이브 텍스트 중계)
function startAclMatchSimulation() {
    const tournamentName = getActiveAclTournamentName();
    const playerTeamId = getActiveAclUserTeamId();
    const playerTeamName = getActiveAclUserTeamName();

    if (aclState.isFinished) {
        alert(`이미 이번 시즌 ${tournamentName}가 종료되었습니다.`);
        return;
    }

    const curRound = aclState.round;
    const matches = aclState.bracket[curRound];
    
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === playerTeamId) || (m.team2 && m.team2.id === playerTeamId));
    if (!playerMatch) {
        alert("플레이어 매치를 찾을 수 없습니다.");
        return;
    }

    if (playerMatch.status === 'completed') {
        advanceAclRound();
        initAclTab();
        return;
    }

    const btn = document.getElementById('btnStartAclMatch');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>경기 중계 중...`;
    }

    const commBox = document.getElementById('aclCommentaryScroll');
    if (commBox) commBox.innerHTML = '';

    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#00ff87; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    if (typeof playMatchStartSound === 'function') {
        try { playMatchStartSound(); } catch (e) {}
    }

    const timeDisplay = document.getElementById('aclSbTimeDisplay');
    if (timeDisplay) {
        timeDisplay.textContent = "0'";
        timeDisplay.classList.add('live-ticking');
    }

    let playerScorerName = (currentLeagueId === 'epl') ? "살라" : "이승우";
    let playerAssisterName = (currentLeagueId === 'epl') ? "소보슬라이" : "송민규";
    try {
        if (typeof squadFormation !== 'undefined' && squadFormation["ST"] && CARDS_DATABASE[squadFormation["ST"]]) {
            playerScorerName = CARDS_DATABASE[squadFormation["ST"]].name;
        }
        if (typeof squadFormation !== 'undefined' && squadFormation["CM"] && CARDS_DATABASE[squadFormation["CM"]]) {
            playerAssisterName = CARDS_DATABASE[squadFormation["CM"]].name;
        }
    } catch(e) {}

    const formTactic = getPlayerFormationTacticBonuses();
    const formationAttackBoost = formTactic.formationAttackBoost;
    const formationScoreBoost = formTactic.formationScoreBoost;
    const formationTacticDetailsHtml = formTactic.formationTacticDetailsHtml;

    const detailedTactic = getPlayerDetailedTacticBonuses();
    const detailedTacticBonus = detailedTactic.detailedTacticBonus;
    const suitabilityBonus = detailedTactic.suitabilityBonus;
    const detailedTacticLabel = detailedTactic.detailedTacticLabel;
    const suitabilityLabel = detailedTactic.suitabilityLabel;

    const isHome = playerMatch.team1.id === playerTeamId;
    const opponent = isHome ? playerMatch.team2 : playerMatch.team1;

    const finalOvrs = calculateFinalMatchOvrs('neutral', isHome, opponent.rating, false);
    const playerOvr = finalOvrs.playerOvr;
    const opponentOvr = finalOvrs.opponentOvr;
    const diff = playerOvr - opponentOvr;
    
    const maxProb = 0.80;
    const minProb = 0.20;
    
    const oppFormation = TEAM_FORMATIONS_PRESET[opponent.id] || "4-4-2";
    const compatibilityBonus = getFormationCompatibilityBonus(currentFormation, oppFormation);
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
    
    let activeDiff = diff;
    let activePlayerAttackProb = playerAttackProb;

    const commentaryData = {
        playerOvr: playerOvr,
        opponentName: opponent.name,
        opponentOvr: opponentOvr,
        isPlayerHome: isHome,
        playerScoreVal: 0,
        opponentScoreVal: 0,
        activeGk: (squadFormation["GK"] && CARDS_DATABASE[squadFormation["GK"]]) ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼",
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: playerAttackProb,
        compatibilityBonus: compatibilityBonus
    };

    let playerScoreVal = 0;
    let opponentScoreVal = 0;

    addCommentary('SYSTEM', getMatchEventCommentary('PRE_ANALYZE', commentaryData, false), 'system');
    if (formationTacticDetailsHtml) addCommentary('SYSTEM', formationTacticDetailsHtml, 'attack');
    if (detailedTacticLabel || suitabilityLabel) {
        addCommentary('SYSTEM', getMatchEventCommentary('TACTIC_ANALYZE', commentaryData, false), 'attack');
    }

    const matchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
    const eventMins = [15, 45, 63, 82, 88];
    let tickIdx = 0;

    if (isDeveloperMode) {
        if (timeDisplay) {
            timeDisplay.textContent = "종료";
            timeDisplay.classList.remove('live-ticking');
        }
        
        matchMinutes.forEach(currentMin => {
            if (currentMin === 0) {
                addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false), 'normal');
            } else if (eventMins.includes(currentMin)) {
                const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
                const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
                
                if (specialEvent) {
                    addCommentary(currentMin, specialEvent.eventDesc, 'system');
                    if (specialEvent.type === "pk_player") {
                        const isGoal = specialEvent.isGoal;
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(1);
                            addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "pk_opponent") {
                        const isGoal = specialEvent.isGoal;
                        if (isGoal) {
                            opponentScoreVal++;
                            let oppGoalData = { scorerName: null, assisterName: null };
                            if (typeof determineOpponentScorerAndAssister === 'function') {
                                oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            }
                            addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                            let pkCommentaryText = specialEvent.eventGoal;
                            if (oppGoalData.scorerName) {
                                pkCommentaryText = `⚽ <strong>[PK 실점]</strong> 상대 키커 <strong>${oppGoalData.scorerName}</strong>의 강력한 슛이 그대로 그물을 출렁입니다! 골키퍼가 방향을 읽지 못했습니다.`;
                            }
                            addCommentary(currentMin, pkCommentaryText, 'normal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "red_opponent") {
                        activeDiff += specialEvent.ovrChange;
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    } else if (specialEvent.type === "red_player") {
                        activeDiff += specialEvent.ovrChange;
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else {
                    const isPlayerAttack = Math.random() < activePlayerAttackProb;
                    if (isPlayerAttack) {
                        let attackOptions = [0, 1, 2];
                        if (currentFormation === '4-2-3-1') attackOptions.push(5);
                        
                        const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                        let chancePlayerStat = 75;
                        
                        if (selectedOption === 0) {
                            const lwCardId = squadFormation['LW'];
                            if (lwCardId && CARDS_DATABASE[lwCardId]) chancePlayerStat = getWingerChanceStat('LW', getAwakenedCard(lwCardId));
                        } else if (selectedOption === 1) {
                            const stCardId = squadFormation['ST'];
                            if (stCardId && CARDS_DATABASE[stCardId]) chancePlayerStat = getStrikerChanceStat('ST', getAwakenedCard(stCardId), strikerStyles);
                        } else if (selectedOption === 2) {
                            const rwCardId = squadFormation['RW'];
                            if (rwCardId && CARDS_DATABASE[rwCardId]) chancePlayerStat = getWingerChanceStat('RW', getAwakenedCard(rwCardId));
                        } else if (selectedOption === 5) {
                            const cmCardId = squadFormation['CM'];
                            if (cmCardId && CARDS_DATABASE[cmCardId]) chancePlayerStat = getAwakenedCard(cmCardId).stats.dri || 75;
                        }
                        
                        const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus);
                        const isGoal = Math.random() < scoreProb;
                        
                        const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                        const isTacticActive = detailedTacticBonus > 0;
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles);
                        
                        addCommentary(currentMin, eventDesc, 'attack');
                        
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(selectedOption);
                            addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, eventFail, 'normal');
                        }
                    } else {
                        let playerGkStat = 70;
                        const gkCardId = squadFormation['GK'];
                        if (gkCardId && CARDS_DATABASE[gkCardId]) {
                            playerGkStat = getAwakenedCard(gkCardId).stats.def || getAwakenedCard(gkCardId).rating || 70;
                        }
                        
                        const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                        const isGoal = Math.random() < oppScoreProb;
                        
                        addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                        
                        if (isGoal) {
                            opponentScoreVal++;
                            let oppGoalData = { scorerName: null, assisterName: null };
                            if (typeof determineOpponentScorerAndAssister === 'function') {
                                oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            }
                            addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                            const goalCommentaryData = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', goalCommentaryData, false), 'normal');
                        } else {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commentaryData, false), 'normal');
                        }
                    }
                }
            } else if (currentMin === 45) {
                commentaryData.playerScoreVal = isHome ? playerScoreVal : opponentScoreVal;
                commentaryData.opponentScoreVal = isHome ? opponentScoreVal : playerScoreVal;
                addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, false), 'system');
            }
        });

        // 스코어판 갱신
        if (isHome) {
            document.getElementById('aclHomeScore').innerText = playerScoreVal;
            document.getElementById('aclAwayScore').innerText = opponentScoreVal;
        } else {
            document.getElementById('aclHomeScore').innerText = opponentScoreVal;
            document.getElementById('aclAwayScore').innerText = playerScoreVal;
        }

        commentaryData.playerScoreVal = isHome ? playerScoreVal : opponentScoreVal;
        commentaryData.opponentScoreVal = isHome ? opponentScoreVal : playerScoreVal;
        addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'system');

        if (playerScoreVal === opponentScoreVal) {
            addCommentary('SYSTEM', "⚖️ 정규 시간 90분 무승부! 토너먼트 규정에 따라 연장전으로 돌입합니다.", "system");
            runActualAclExtraTime(playerScoreVal, opponentScoreVal, playerMatch, playerOvr, opponent.rating, playerScorerName, playerAssisterName, isHome);
        } else {
            finalizeAclMatch(isHome ? playerScoreVal : opponentScoreVal, isHome ? opponentScoreVal : playerScoreVal, playerMatch);
        }
        return;
    }

    // 일반 15초 실시간 중계 모드
    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        if (timeDisplay) timeDisplay.textContent = `${currentMin}'`;

        if (currentMin === 0) {
            addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false), 'normal');
        } else if (eventMins.includes(currentMin)) {
            const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
            const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
            
            if (specialEvent) {
                addCommentary(currentMin, specialEvent.eventDesc, 'system');
                if (specialEvent.type === "pk_player") {
                    const isGoal = specialEvent.isGoal;
                    setTimeout(() => {
                        if (isGoal) {
                            playerScoreVal++;
                            if (isHome) {
                                document.getElementById('aclHomeScore').innerText = playerScoreVal;
                            } else {
                                document.getElementById('aclAwayScore').innerText = playerScoreVal;
                            }
                            if (typeof playGoalSound === 'function') {
                                try { playGoalSound(); } catch (e) {}
                            }
                            const goalData = determineScorerAndAssister(1);
                            addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    }, 400);
                } else if (specialEvent.type === "pk_opponent") {
                    const isGoal = specialEvent.isGoal;
                    setTimeout(() => {
                        if (isGoal) {
                            opponentScoreVal++;
                            if (isHome) {
                                document.getElementById('aclAwayScore').innerText = opponentScoreVal;
                            } else {
                                document.getElementById('aclHomeScore').innerText = opponentScoreVal;
                            }
                            if (typeof playGoalSound === 'function') {
                                try { playGoalSound(); } catch (e) {}
                            }
                            let oppGoalData = { scorerName: null, assisterName: null };
                            if (typeof determineOpponentScorerAndAssister === 'function') {
                                oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            }
                            addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                            let pkCommentaryText = specialEvent.eventGoal;
                            if (oppGoalData.scorerName) {
                                pkCommentaryText = `⚽ <strong>[PK 실점]</strong> 상대 키커 <strong>${oppGoalData.scorerName}</strong>의 강력한 슛이 그대로 그물을 출렁입니다! 골키퍼가 방향을 읽지 못했습니다.`;
                            }
                            addCommentary(currentMin, pkCommentaryText, 'normal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    }, 400);
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange;
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 400);
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange;
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 400);
                }
            } else {
                const isPlayerAttack = Math.random() < activePlayerAttackProb;
                
                if (isPlayerAttack) {
                    let attackOptions = [0, 1, 2];
                    if (currentFormation === '4-2-3-1') attackOptions.push(5);
                    
                    const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    let chancePlayerStat = 75;
                    
                    if (selectedOption === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId]) chancePlayerStat = getWingerChanceStat('LW', getAwakenedCard(lwCardId));
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) chancePlayerStat = getStrikerChanceStat('ST', getAwakenedCard(stCardId), strikerStyles);
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) chancePlayerStat = getWingerChanceStat('RW', getAwakenedCard(rwCardId));
                    } else if (selectedOption === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) chancePlayerStat = getAwakenedCard(cmCardId).stats.dri || 75;
                    }
                    
                    const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus);
                    const isGoal = Math.random() < scoreProb;
                    
                    const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                    const isTacticActive = detailedTacticBonus > 0;
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles);
                    
                    addCommentary(currentMin, eventDesc, 'attack');
                    
                    if (isGoal) {
                        playerScoreVal++;
                        if (isHome) {
                            document.getElementById('aclHomeScore').innerText = playerScoreVal;
                        } else {
                            document.getElementById('aclAwayScore').innerText = playerScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        const goalData = determineScorerAndAssister(selectedOption);
                        addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, eventGoal, 'goal');
                        }, 400);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, eventFail, 'normal');
                        }, 400);
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        playerGkStat = getAwakenedCard(gkCardId).stats.def || getAwakenedCard(gkCardId).rating || 70;
                    }
                    
                    const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                    const isGoal = Math.random() < oppScoreProb;
                    
                    addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                    
                    if (isGoal) {
                        opponentScoreVal++;
                        if (isHome) {
                            document.getElementById('aclAwayScore').innerText = opponentScoreVal;
                        } else {
                            document.getElementById('aclHomeScore').innerText = opponentScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        let oppGoalData = { scorerName: null, assisterName: null };
                        if (typeof determineOpponentScorerAndAssister === 'function') {
                            oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        }
                        addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                        
                        setTimeout(() => {
                            const goalCommentaryData = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', goalCommentaryData, false), 'normal');
                        }, 400);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commentaryData, false), 'normal');
                        }, 400);
                    }
                }
            }
        } else if (currentMin === 45) {
            commentaryData.playerScoreVal = isHome ? playerScoreVal : opponentScoreVal;
            commentaryData.opponentScoreVal = isHome ? opponentScoreVal : playerScoreVal;
            addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, false), 'system');
        }

        tickIdx++;

        if (tickIdx >= matchMinutes.length) {
            clearInterval(matchTimer);
            
            commentaryData.playerScoreVal = isHome ? playerScoreVal : opponentScoreVal;
            commentaryData.opponentScoreVal = isHome ? opponentScoreVal : playerScoreVal;
            addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'system');

            if (playerScoreVal === opponentScoreVal) {
                addCommentary('SYSTEM', "⚖️ 정규 시간 90분 무승부! 토너먼트 규정에 따라 연장전으로 돌입합니다.", "system");
                setTimeout(() => {
                    runActualAclExtraTime(playerScoreVal, opponentScoreVal, playerMatch, playerOvr, opponent.rating, playerScorerName, playerAssisterName, isHome);
                }, 1500);
            } else {
                finalizeAclMatch(isHome ? playerScoreVal : opponentScoreVal, isHome ? opponentScoreVal : playerScoreVal, playerMatch);
            }
        }
    }, 1200);
}

// 연장전 실제 경기 루틴 (공통 엔진 연동)
function runActualAclExtraTime(score1, score2, playerMatch, playerOvr, opponentOvr, playerScorerName, playerAssisterName, isHome) {
    const timeDisplay = document.getElementById('aclSbTimeDisplay');
    const commBox = document.getElementById('aclCommentaryScroll');
    const playerTeamName = getActiveAclUserTeamName();
    
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#00ff87; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    let attackOptions = [0, 1, 2];
    if (typeof currentFormation !== 'undefined' && currentFormation === '4-2-3-1') attackOptions.push(5);
    const selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
    const etGoalData = determineScorerAndAssister(selectedOption);
    const activeScorerName = etGoalData.scorerName;
    const activeAssisterName = etGoalData.assisterName;

    const etData = {
        team1Name: isHome ? playerTeamName : playerMatch.team1.name,
        team2Name: isHome ? playerMatch.team2.name : playerTeamName,
        rating1: isHome ? playerOvr : playerMatch.team1.rating,
        rating2: isHome ? playerMatch.team2.rating : playerOvr,
        score1: isHome ? score1 : score2,
        score2: isHome ? score2 : score1,
        playerScorerName: activeScorerName,
        playerAssisterName: activeAssisterName,
        isTeam1Jeonbuk: isHome,
        opponentTeamId: isHome ? playerMatch.team2.id : playerMatch.team1.id
    };

    const etResult = simulateExtraTimeEngine(etData);
    
    if (isDeveloperMode) {
        if (timeDisplay) {
            timeDisplay.innerText = "종료";
            timeDisplay.classList.remove('live-ticking');
        }
        
        etResult.events.forEach(ev => {
            addCommentary(ev.min, ev.text, ev.type);
        });

        const finalScore1 = isHome ? etResult.finalScore1 : etResult.finalScore2;
        const finalScore2 = isHome ? etResult.finalScore2 : etResult.finalScore1;
        document.getElementById('aclHomeScore').innerText = finalScore1;
        document.getElementById('aclAwayScore').innerText = finalScore2;

        if (etResult.hasGoal) {
            if (isHome) {
                if (etResult.finalScore1 > score1) {
                    addAclPlayerStatRecord(playerMatch.team1, activeScorerName, activeAssisterName);
                }
                if (etResult.finalScore2 > score2) {
                    const oppGoalData = determineOpponentScorerAndAssister(playerMatch.team2.id);
                    addAclPlayerStatRecord(playerMatch.team2, oppGoalData.scorerName, oppGoalData.assisterName);
                }
            } else {
                if (etResult.finalScore2 > score2) {
                    addAclPlayerStatRecord(playerMatch.team2, activeScorerName, activeAssisterName);
                }
                if (etResult.finalScore1 > score1) {
                    const oppGoalData = determineOpponentScorerAndAssister(playerMatch.team1.id);
                    addAclPlayerStatRecord(playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                }
            }
        }

        if (finalScore1 === finalScore2) {
            addCommentary('SYSTEM', "⚖️ 120분 혈투 끝 무승부! 승부차기로 돌입합니다.", "system");
            runActualAclPenaltyShootout(finalScore1, finalScore2, playerMatch, isHome, isHome ? playerMatch.team2 : playerMatch.team1);
        } else {
            finalizeAclMatch(finalScore1, finalScore2, playerMatch);
        }
        return;
    }

    let etIdx = 0;
    const etTimer = setInterval(() => {
        const ev = etResult.events[etIdx];
        if (ev) {
            addCommentary(ev.min, ev.text, ev.type);
            if (timeDisplay) timeDisplay.innerText = ev.min;
        }

        etIdx++;

        if (etIdx >= etResult.events.length) {
            clearInterval(etTimer);
            
            const finalScore1 = isHome ? etResult.finalScore1 : etResult.finalScore2;
            const finalScore2 = isHome ? etResult.finalScore2 : etResult.finalScore1;
            document.getElementById('aclHomeScore').innerText = finalScore1;
            document.getElementById('aclAwayScore').innerText = finalScore2;

            if (etResult.hasGoal) {
                if (isHome) {
                    if (etResult.finalScore1 > score1) {
                        addAclPlayerStatRecord(playerMatch.team1, activeScorerName, activeAssisterName);
                    }
                    if (etResult.finalScore2 > score2) {
                        const oppGoalData = determineOpponentScorerAndAssister(playerMatch.team2.id);
                        addAclPlayerStatRecord(playerMatch.team2, oppGoalData.scorerName, oppGoalData.assisterName);
                    }
                } else {
                    if (etResult.finalScore2 > score2) {
                        addAclPlayerStatRecord(playerMatch.team2, activeScorerName, activeAssisterName);
                    }
                    if (etResult.finalScore1 > score1) {
                        const oppGoalData = determineOpponentScorerAndAssister(playerMatch.team1.id);
                        addAclPlayerStatRecord(playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                    }
                }
            }

            if (finalScore1 === finalScore2) {
                addCommentary('SYSTEM', "⚖️ 120분 혈투 끝 무승부! 승부차기로 돌입합니다.", "system");
                setTimeout(() => {
                    runActualAclPenaltyShootout(finalScore1, finalScore2, playerMatch, isHome, isHome ? playerMatch.team2 : playerMatch.team1);
                }, 1500);
            } else {
                finalizeAclMatch(finalScore1, finalScore2, playerMatch);
            }
        }
    }, 1200);
}

// 승부차기 실제 경기 루틴 (공통 엔진 연동)
function runActualAclPenaltyShootout(etScore1, etScore2, playerMatch, isHome, opponent) {
    const timeDisplay = document.getElementById('aclSbTimeDisplay');
    const commBox = document.getElementById('aclCommentaryScroll');
    const playerTeamName = getActiveAclUserTeamName();
    
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#00ff87; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    const pkData = {
        team1Name: isHome ? playerTeamName : opponent.name,
        team2Name: isHome ? opponent.name : playerTeamName,
        isTeam1Jeonbuk: isHome,
        opponentTeamId: opponent.id
    };

    const pkResult = (typeof simulatePenaltyShootoutEngine === 'function') 
        ? simulatePenaltyShootoutEngine(pkData)
        : simulateActualAclPenaltyShootout(isHome, opponent.name);

    if (isDeveloperMode) {
        if (timeDisplay) {
            timeDisplay.innerText = "종료";
            timeDisplay.classList.remove('live-ticking');
        }
        
        pkResult.events.forEach(ev => {
            addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? "goal" : "normal");
        });

        const pkScore1 = isHome ? pkResult.pkScore1 : pkResult.pkScore2;
        const pkScore2 = isHome ? pkResult.pkScore2 : pkResult.pkScore1;
        document.getElementById('aclHomeScore').innerText = `${etScore1} (${pkScore1})`;
        document.getElementById('aclAwayScore').innerText = `${etScore2} (${pkScore2})`;

        finalizeAclMatch(etScore1, etScore2, playerMatch, pkScore1, pkScore2);
        return;
    }

    let pkIdx = 0;
    const pkTimer = setInterval(() => {
        const ev = pkResult.events[pkIdx];
        if (ev) {
            addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? "goal" : "normal");
            if (ev.success && typeof playGoalSound === 'function') {
                try { playGoalSound(); } catch (e) {}
            }
            if (timeDisplay) timeDisplay.innerText = "PK";
            
            const curPk1 = isHome ? ev.score1 : ev.score2;
            const curPk2 = isHome ? ev.score2 : ev.score1;
            document.getElementById('aclHomeScore').innerText = `${etScore1} (${curPk1})`;
            document.getElementById('aclAwayScore').innerText = `${etScore2} (${curPk2})`;
        }

        pkIdx++;

        if (pkIdx >= pkResult.events.length) {
            clearInterval(pkTimer);
            const pkScore1 = isHome ? pkResult.pkScore1 : pkResult.pkScore2;
            const pkScore2 = isHome ? pkResult.pkScore2 : pkResult.pkScore1;
            finalizeAclMatch(etScore1, etScore2, playerMatch, pkScore1, pkScore2);
        }
    }, 1200);
}

// 득점/도움 순위 실시간 가산
function addAclPlayerStatRecord(team, scorerName, assisterName) {
    if (!team) return;
    
    const playerTeamId = getActiveAclUserTeamId();
    const isPlayer = team.id === playerTeamId;
    const sName = scorerName ? scorerName : (isPlayer ? "에이스 선수" : `${team.name} 에이스`);
    const existScorer = aclState.stats.scorers.find(s => s.name === sName && s.teamId === team.id);
    if (existScorer) {
        existScorer.goals += 1;
    } else {
        aclState.stats.scorers.push({ name: sName, teamName: team.name, goals: 1, teamId: team.id });
    }

    if (isPlayer && scorerName) {
        let scorerId = null;
        if (typeof CARDS_DATABASE !== 'undefined') {
            scorerId = Object.keys(CARDS_DATABASE).find(key => CARDS_DATABASE[key].name === scorerName);
        }
        if (scorerId) {
            if (typeof careerStats !== 'undefined' && careerStats) {
                if (!careerStats.playerGoals) careerStats.playerGoals = {};
                if (!careerStats.playerGoals[scorerId]) {
                    careerStats.playerGoals[scorerId] = { name: scorerName, goals: 0 };
                }
                careerStats.playerGoals[scorerId].goals += 1;
                try {
                    localStorage.setItem('fc_star_career_stats', JSON.stringify(careerStats));
                } catch (e) {}
                if (typeof renderCareerStats === 'function') renderCareerStats();
            }
        }
    }

    if (assisterName) {
        const existAssister = aclState.stats.assisters.find(a => a.name === assisterName && a.teamId === team.id);
        if (existAssister) {
            existAssister.assists += 1;
        } else {
            aclState.stats.assisters.push({ name: assisterName, teamName: team.name, assists: 1, teamId: team.id });
        }
    } else if (!isPlayer) {
        if (Math.random() < 0.5) {
            const aName = `${team.name} 에이스`;
            const existAssister = aclState.stats.assisters.find(a => a.name === aName && a.teamId === team.id);
            if (existAssister) {
                existAssister.assists += 1;
            } else {
                aclState.stats.assisters.push({ name: aName, teamName: team.name, assists: 1, teamId: team.id });
            }
        }
    }
}

// 경기 최종 종료 처리 및 보상 분배
function finalizeAclMatch(score1, score2, playerMatch, pkScore1 = undefined, pkScore2 = undefined) {
    const timeDisplay = document.getElementById('aclSbTimeDisplay');
    if (timeDisplay) timeDisplay.classList.remove('live-ticking');

    const playerTeamId = getActiveAclUserTeamId();
    const playerTeamName = getActiveAclUserTeamName();
    const tournamentName = getActiveAclTournamentName();

    playerMatch.score1 = score1;
    playerMatch.score2 = score2;
    playerMatch.pkScore1 = pkScore1;
    playerMatch.pkScore2 = pkScore2;
    
    if (pkScore1 !== undefined && pkScore2 !== undefined) {
        playerMatch.winner = pkScore1 > pkScore2 ? 'team1' : 'team2';
    } else {
        playerMatch.winner = score1 > score2 ? 'team1' : 'team2';
    }
    
    playerMatch.status = 'completed';

    const isPlayerWinner = (playerMatch.winner === 'team1' && playerMatch.team1.id === playerTeamId) ||
                          (playerMatch.winner === 'team2' && playerMatch.team2.id === playerTeamId);

    const btn = document.getElementById('btnStartAclMatch');
    const commBox = document.getElementById('aclCommentaryScroll');
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        item.innerHTML = `<strong>${min}</strong> ${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    if (btn) btn.disabled = false;

    if (isPlayerWinner) {
        if (typeof playVictorySound === 'function') {
            try { playVictorySound(); } catch (e) {}
        }
        
        let scoreDisplayStr = `${score1} : ${score2}`;
        if (pkScore1 !== undefined) scoreDisplayStr += ` (PK ${pkScore1} : ${pkScore2})`;
        
        addCommentary("종료", `[승리] 최종 스코어 ${scoreDisplayStr}로 ${playerTeamName}이 ${tournamentName} 다음 라운드로 진출합니다!`, "goal");
        showToast(`승리했습니다! ${tournamentName} 다음 라운드에 진출합니다.`);

        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-forward" style="margin-right: 8px;"></i>다음 라운드 대진표 갱신`;
        }
    } else {
        if (typeof playDefeatSound === 'function') {
            try { playDefeatSound(); } catch (e) {}
        }
        
        let scoreDisplayStr = `${score1} : ${score2}`;
        if (pkScore1 !== undefined) scoreDisplayStr += ` (PK ${pkScore1} : ${pkScore2})`;

        addCommentary("종료", `[패배] 최종 스코어 ${scoreDisplayStr}로 ${playerTeamName}의 ${tournamentName} 도전이 여기서 마감됩니다.`, "system");
        
        let rewardPoints = 0;
        let rewardText = "";
        
        if (aclState.round === 8 || aclState.round === 4) {
            rewardPoints = 10;
            rewardText = "대회 8강/4강 탈락 보상 10 FP를 획득했습니다!";
        } else if (aclState.round === 2) {
            rewardPoints = 15;
            rewardText = "결승 준우승 보상 15 FP를 획득했습니다!";
        }

        if (rewardPoints > 0) {
            userPoints += rewardPoints;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            if (typeof renderUserPoints === 'function') renderUserPoints();
            showToast(`아쉽게 패배했습니다. 하지만 ${rewardText}`);
        } else {
            showToast(`패배하여 탈락했습니다. (16강 탈락은 보상이 없습니다)`);
        }
        
        simulateRemainingAclRounds();
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락 (대회 종료)`;
        }
    }

    aclState.stats.scorers.sort((a, b) => b.goals - a.goals);
    aclState.stats.assisters.sort((a, b) => b.assists - a.assists);

    saveAclState();
    renderAclBracket();
    renderAclStats();
}

// 라운드 진출 대진표 업데이트
function advanceAclRound() {
    const curRound = aclState.round;
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
    const playerTeamId = getActiveAclUserTeamId();
    const tournamentName = getActiveAclTournamentName();

    simulateAclAiMatches(curRound);

    if (curRound === 16) {
        const matches16 = aclState.bracket[16];
        const matches8 = aclState.bracket[8];
        
        if (isEpl) {
            for (let i = 0; i < 4; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
        } else {
            // 동아시아 8강 대진 (16_0 vs 16_1, 16_2 vs 16_3)
            for (let i = 0; i < 2; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
            // 서아시아 8강 대진 (16_4 vs 16_5, 16_6 vs 16_7)
            for (let i = 2; i < 4; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
        }
        aclState.round = 8;
    } else if (curRound === 8) {
        const matches8 = aclState.bracket[8];
        const matches4 = aclState.bracket[4];
        
        if (isEpl) {
            for (let i = 0; i < 2; i++) {
                const m1 = matches8[i * 2];
                const m2 = matches8[i * 2 + 1];
                matches4[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches4[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches4[i].status = "scheduled";
            }
        } else {
            matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
            matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
            matches4[0].status = "scheduled";
            
            matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
            matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
            matches4[1].status = "scheduled";
        }
        aclState.round = 4;
    } else if (curRound === 4) {
        const matches4 = aclState.bracket[4];
        const matches2 = aclState.bracket[2];
        
        const m1 = matches4[0];
        const m2 = matches4[1];
        
        matches2[0].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
        matches2[0].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
        matches2[0].status = "scheduled";
        aclState.round = 2;
    } else if (curRound === 2) {
        const finalMatch = aclState.bracket[2][0];
        const champion = finalMatch.winner === 'team1' ? finalMatch.team1 : finalMatch.team2;
        
        aclState.bracket.winner = champion;
        aclState.round = 1;
        aclState.isFinished = true;

        if (champion.id === playerTeamId) {
            userPoints += 20;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            if (typeof renderUserPoints === 'function') renderUserPoints();
            
            setTimeout(() => {
                showAclWinnerCelebrationModal(20, `${tournamentName} 우승!`);
            }, 500);
        } else {
            const isHomePlayer = finalMatch.team1 && finalMatch.team1.id === playerTeamId;
            const isAwayPlayer = finalMatch.team2 && finalMatch.team2.id === playerTeamId;
            if (isHomePlayer || isAwayPlayer) {
                userPoints += 15;
                try {
                    localStorage.setItem('fc_star_user_points', userPoints.toString());
                } catch(e) {}
                if (typeof renderUserPoints === 'function') renderUserPoints();
                showToast(`결승전에서 패배해 준우승에 머물렀습니다. 준우승 보상 15 FP를 획득했습니다!`);
            }
        }
    }

    saveAclState();
}

// AI간 매치 시뮬레이션
function simulateAclAiMatches(round) {
    const playerTeamId = getActiveAclUserTeamId();
    const playersPreset = getActiveAclPlayersPreset();
    const matches = aclState.bracket[round];
    
    matches.forEach(match => {
        const isPlayerMatch = (match.team1 && match.team1.id === playerTeamId) || (match.team2 && match.team2.id === playerTeamId);
        if (isPlayerMatch || match.status === 'completed') return;

        const rateDiff = (match.team1 ? match.team1.rating : 70) - (match.team2 ? match.team2.rating : 70);
        
        let score1 = Math.floor(Math.random() * 3);
        let score2 = Math.floor(Math.random() * 3);
        
        if (rateDiff > 5) score1 += 1;
        else if (rateDiff < -5) score2 += 1;
        
        if (score1 === score2) {
            if (Math.random() > 0.5) score1 += 1;
            else score2 += 1;
        }

        match.score1 = score1;
        match.score2 = score2;
        match.winner = score1 > score2 ? 'team1' : 'team2';
        match.status = 'completed';

        const winnerTeam = score1 > score2 ? match.team1 : match.team2;
        
        // 득점자/도움자 프리셋에서 탐색
        let scorerName = null;
        let assisterName = null;
        if (playersPreset && playersPreset.length > 0) {
            const teamPlayers = playersPreset.filter(p => p.teamId === winnerTeam.id);
            if (teamPlayers.length > 0) {
                scorerName = teamPlayers[Math.floor(Math.random() * teamPlayers.length)].name;
                if (teamPlayers.length > 1) {
                    const remain = teamPlayers.filter(p => p.name !== scorerName);
                    if (remain.length > 0 && Math.random() < 0.7) {
                        assisterName = remain[Math.floor(Math.random() * remain.length)].name;
                    }
                }
            }
        }
        
        if (!scorerName && typeof determineOpponentScorerAndAssister === 'function') {
            const oppGoalData = determineOpponentScorerAndAssister(winnerTeam.id);
            scorerName = oppGoalData.scorerName;
            assisterName = oppGoalData.assisterName;
        }

        addAclPlayerStatRecord(winnerTeam, scorerName, assisterName);
    });
}

function getAclRoundText(round) {
    if (round === 16) return "16강전";
    if (round === 8) return "8강전";
    if (round === 4) return "준결승전";
    if (round === 2) return "결승전";
    if (round === 1) return "대회 완료";
    return "";
}

function shuffleAclArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 챔피언스리그 우승 축하 모달 팝업
function showAclWinnerCelebrationModal(pointsVal, title) {
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');
    const playerTeamName = getActiveAclUserTeamName();
    const tournamentName = getActiveAclTournamentName();

    const iconHtml = isEpl ? '<i class="fa-solid fa-trophy"></i>' : '<i class="fa-solid fa-earth-asia"></i>';
    const mainTitle = isEpl ? "유럽 챔피언! (빅이어)" : "아시아 챔피언!";
    const subDesc = isEpl 
        ? `${playerTeamName}이 유럽 최고 권위의 UEFA 챔피언스리그 정상에 등극했습니다!<br>레알 마드리드, 바이에른 뮌헨 등 유럽 최고의 명문 구단들을 꺾고 이뤄낸 위대한 역사입니다.`
        : `${playerTeamName}이 아시아 최정상에 등극했습니다!<br>동아시아와 서아시아의 쟁쟁한 강호들을 꺾고 이뤄낸 역사적인 순간입니다.`;

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(8, 10, 16, 0.9)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backdropFilter = 'blur(10px)';
    
    modal.innerHTML = `
        <div style="text-align: center; max-width: 500px; padding: 2rem; border-radius: 24px; background: radial-gradient(circle at top, rgba(0, 255, 135, 0.15) 0%, rgba(10, 14, 26, 0.95) 100%); border: 2px solid rgba(0, 255, 135, 0.4); box-shadow: 0 0 40px rgba(0, 255, 135, 0.3); animation: matchViewFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="font-size: 5rem; color: #00ff87; filter: drop-shadow(0 0 15px rgba(0, 255, 135, 0.6)); margin-bottom: 1rem; animation: winnerPulse 2s infinite ease-in-out;">
                ${iconHtml}
            </div>
            <h1 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; letter-spacing: 1px;">${mainTitle}</h1>
            <p style="font-size: 1rem; color: #00ff87; font-weight: 800; margin-bottom: 1.5rem;">${playerTeamName} ${tournamentName} 우승 달성!</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
                ${subDesc}<br>
                당신은 클럽 축구 역사의 정점에 섰습니다!
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 1rem; border-radius: 14px; width: 100%; margin-bottom: 2rem;">
                <span style="font-size: 0.8rem; color: #ffd700; font-weight: 800;"><i class="fa-solid fa-gift"></i> 우승 보상</span>
                <span style="font-size: 1.2rem; font-weight: 900; color: #fff;">+${pointsVal} FP (드림 포인트)</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); initAclTab();" class="btn-open-pack" style="background: linear-gradient(135deg, #00ff87, #00ffbc); color: #080a10; font-weight: 800; font-size: 1rem; padding: 0.8rem 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 255, 135, 0.3); border: none; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 개발자 모드 전용: 결승전 워프 함수
function skipToAclFinal() {
    if (typeof aclState === 'undefined' || !aclState) {
        console.warn("챔피언스리그 상태 데이터가 로드되지 않았습니다.");
        return;
    }
    if (aclState.isFinished) {
        console.warn("이미 이번 시즌 대회가 종료되었습니다. 다음 시즌 시작 후 시도하세요.");
        return;
    }
    
    const playerTeamId = getActiveAclUserTeamId();
    const isEpl = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl');

    while (aclState.round > 2) {
        const curRound = aclState.round;
        const matches = aclState.bracket[curRound];
        if (!matches || matches.length === 0) break;
        
        matches.forEach(match => {
            if (match.status === 'completed') return;
            
            const hasPlayer = (match.team1 && match.team1.id === playerTeamId) || (match.team2 && match.team2.id === playerTeamId);
            if (hasPlayer) {
                const isHomePlayer = match.team1 && match.team1.id === playerTeamId;
                match.score1 = isHomePlayer ? 3 : 1;
                match.score2 = isHomePlayer ? 1 : 3;
                match.winner = isHomePlayer ? 'team1' : 'team2';
                match.status = 'completed';
            } else {
                const rateDiff = (match.team1 ? match.team1.rating : 70) - (match.team2 ? match.team2.rating : 70);
                let score1 = Math.floor(Math.random() * 3);
                let score2 = Math.floor(Math.random() * 3);
                if (rateDiff > 5) score1 += 1;
                else if (rateDiff < -5) score2 += 1;
                if (score1 === score2) {
                    if (Math.random() > 0.5) score1 += 1;
                    else score2 += 1;
                }
                match.score1 = score1;
                match.score2 = score2;
                match.winner = score1 > score2 ? 'team1' : 'team2';
                match.status = 'completed';
            }
        });
        
        if (curRound === 16) {
            const matches16 = aclState.bracket[16];
            const matches8 = aclState.bracket[8];
            if (isEpl) {
                for (let i = 0; i < 4; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
            } else {
                for (let i = 0; i < 2; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
                for (let i = 2; i < 4; i++) {
                    const m1 = matches16[i * 2];
                    const m2 = matches16[i * 2 + 1];
                    matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches8[i].status = "scheduled";
                }
            }
            aclState.round = 8;
        } else if (curRound === 8) {
            const matches8 = aclState.bracket[8];
            const matches4 = aclState.bracket[4];
            if (isEpl) {
                for (let i = 0; i < 2; i++) {
                    const m1 = matches8[i * 2];
                    const m2 = matches8[i * 2 + 1];
                    matches4[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                    matches4[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                    matches4[i].status = "scheduled";
                }
            } else {
                matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
                matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
                matches4[0].status = "scheduled";
                
                matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
                matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
                matches4[1].status = "scheduled";
            }
            aclState.round = 4;
        } else if (curRound === 4) {
            const matches4 = aclState.bracket[4];
            const matches2 = aclState.bracket[2];
            const m1 = matches4[0];
            const m2 = matches4[1];
            matches2[0].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
            matches2[0].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
            matches2[0].status = "scheduled";
            aclState.round = 2;
        }
    }
    
    saveAclState();
    initAclTab();
    console.log(`🏆 플레이어팀(${getActiveAclUserTeamName()})이 결승전(Round 2) 대진으로 바로 진출 완료되었습니다!`);
}

function resetAclSeasonWithFP() {
    const tournamentName = getActiveAclTournamentName();

    if (aclState.hasResetThisSeason) {
        alert(`${tournamentName} 초기화는 한 시즌에 한 번만 가능합니다!`);
        return;
    }
    
    if (typeof userPoints === 'undefined' || userPoints < 5) {
        alert(`포인트가 부족합니다! (현재 포인트: ${typeof userPoints !== 'undefined' ? userPoints : 0} FP / 필요 포인트: 5 FP)`);
        return;
    }
    
    if (!confirm(`5 FP를 소모하여 ${tournamentName} 대회를 리셋하고 16강 첫 경기부터 새로 시작하시겠습니까?\n(현재 진행 정보 및 스탯이 모두 초기화됩니다)`)) {
        return;
    }
    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }
    
    userPoints -= 5;
    localStorage.setItem('fc_star_user_points', userPoints.toString());
    if (typeof renderUserPoints === 'function') {
        renderUserPoints();
    }
    
    resetAclStateData();
    aclState.hasResetThisSeason = true;
    saveAclState();
    
    initAclTab();
    
    const commBox = document.getElementById('aclCommentaryScroll');
    if (commBox) {
        commBox.innerHTML = `<div class="comm-item comm-system">5 FP를 사용하여 ${tournamentName}가 리셋되었습니다. 아래 경기 시작 버튼을 클릭하면 16강 대회가 진행됩니다.</div>`;
    }
    
    alert(`${tournamentName}가 성공적으로 초기화되었습니다! (5 FP 차감)`);
}
