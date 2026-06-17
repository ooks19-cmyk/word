// js/acl.js - AFC 챔피언스리그 (아챔) UI 및 토너먼트 모듈

// 1. 아챔 상태 및 변수 선언
let aclState = {
    year: 2026,
    round: 16, // 16: 16강, 8: 8강, 4: 4강, 2: 결승, 1: 종료 (우승자 탄생)
    teams: [], // 16개 참여팀 리스트 { id, name, rating, color }
    bracket: {
        16: [], // 8개 경기 객체 { id, team1, team2, score1, score2, winner, status }
        8: [],  // 4개 경기 객체
        4: [],  // 2개 경기 객체 (동-서 교차)
        2: [],  // 1개 경기 객체 (결승)
        winner: null // 최종 우승팀 객체
    },
    isFinished: false,
    stats: {
        scorers: [], // { name, teamName, goals, teamId }
        assisters: [] // { name, teamName, assists, teamId }
    }
};

// 2. 아챔 초기화 함수
function initAcl() {
    try {
        const savedState = localStorage.getItem('fc_star_acl_state');
        if (savedState) {
            aclState = JSON.parse(savedState);
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
    const playerOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;

    // 1. K리그 구단 중 우리팀(전북)을 제외한 상위 2개 팀 선발
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
    
    // fallback (리그 미진행 상태 대비)
    if (kLeagueQualifiers.length < 2) {
        kLeagueQualifiers = [
            { id: "ulsan", name: "울산 HD", rating: 80 },
            { id: "seoul", name: "FC 서울", rating: 78 }
        ];
    }

    // 2. 프리셋 팀 정보 동적 로드 및 OVR 난수 세팅 (+-2 범위)
    const presetTeams = (typeof ACL_TEAMS_PRESET !== 'undefined') ? ACL_TEAMS_PRESET : [];
    
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

    presetTeams.forEach(team => {
        let adjustedRating;
        if (team.id === chosenBossWestTeamId) {
            // 서부리그 보스팀 1팀은 우리팀 OVR 대비 +3
            adjustedRating = playerOvr + 3;
        } else {
            // 나머지 모든 해외 구단(서부 7팀 + 동부 해외 5팀)은 OVR -2 ~ +1 범위 (난수)
            const randDiff = Math.floor(Math.random() * 4) - 2; // -2, -1, 0, 1 중 하나
            adjustedRating = Math.max(55, playerOvr + randDiff);
        }
        adjustedRating = Math.min(adjustedRating, 92); // 92 캡 적용
        
        initializedTeams.push({
            id: team.id,
            name: team.name,
            rating: adjustedRating,
            color: team.color
        });
    });

    // 3. 동아시아(8팀) 및 서아시아(8팀) 브라켓 분리 및 16강 경기 배치
    const eastTeams = initializedTeams.filter(t => ['jeonbuk', 'ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon', 'vissel_kobe', 'yokohama_marinos', 'kawasaki_frontale', 'shanghai_port', 'buriram_united'].includes(t.id));
    const westTeams = initializedTeams.filter(t => !eastTeams.some(et => et.id === t.id));
    
    // 동아시아 팀에서 K리그 구단(전북 + K리그 진출 2구단) 리스트 추출
    const kLeagueIds = ['jeonbuk', ...kLeagueQualifiers.map(q => q.id)];
    const eastKLeagueTeams = eastTeams.filter(t => kLeagueIds.includes(t.id));
    const eastForeignTeams = eastTeams.filter(t => !kLeagueIds.includes(t.id));
    
    const shuffledKLeague = shuffleAclArray(eastKLeagueTeams); // K리그 3구단 셔플
    const shuffledForeign = shuffleAclArray(eastForeignTeams); // 해외 동부 5구단 셔플
    
    // 16강 맞대결 방지용 경기 리스트 생성
    const eastMatches = [
        { team1: shuffledKLeague[0], team2: shuffledForeign[0] },
        { team1: shuffledKLeague[1], team2: shuffledForeign[1] },
        { team1: shuffledKLeague[2], team2: shuffledForeign[2] },
        { team1: shuffledForeign[3], team2: shuffledForeign[4] }
    ];
    
    // 동아시아 16강 경기 순서 자체를 한 번 더 셔플하여 8강 상/하단 브라켓 배치 분산
    const shuffledEastMatches = shuffleAclArray(eastMatches);
    
    const shuffledWest = shuffleAclArray(westTeams);
    
    const matches16 = [];
    
    // 동아시아 16강 (4경기: acl_16_0 ~ acl_16_3)
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
    
    // 서아시아 16강 (4경기: acl_16_4 ~ acl_16_7)
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

    // 8강(4경기), 4강(2경기), 결승(1경기) 대진 껍데기
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
        }
    };

    saveAclState();
}

function saveAclState() {
    try {
        localStorage.setItem('fc_star_acl_state', JSON.stringify(aclState));
    } catch(e) {}
    if (typeof saveUserProgress === 'function' && typeof currentUser !== 'undefined' && currentUser) {
        saveUserProgress();
    }
}

// 플레이어가 탈락했을 때 자동 복구 및 남은 토너먼트 시뮬레이션
function checkAndRecoverEliminatedAcl() {
    if (aclState.isFinished) return;
    
    let isPlayerEliminated = false;
    [16, 8, 4, 2].forEach(roundKey => {
        const matches = aclState.bracket[roundKey] || [];
        matches.forEach(match => {
            if (match.status === 'completed') {
                const hasPlayer = (match.team1 && match.team1.id === 'jeonbuk') || (match.team2 && match.team2.id === 'jeonbuk');
                if (hasPlayer) {
                    const isPlayerWinner = (match.winner === 'team1' && match.team1.id === 'jeonbuk') ||
                                          (match.winner === 'team2' && match.team2.id === 'jeonbuk');
                    if (!isPlayerWinner) {
                        isPlayerEliminated = true;
                    }
                }
            }
        });
    });
    
    if (isPlayerEliminated) {
        console.log("플레이어가 아챔에서 탈락한 상태를 감지했습니다. 남은 대회를 자동 시뮬레이션 처리합니다.");
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
            // 동아시아 8강전 매칭 (Winner 16_0 vs 16_1, Winner 16_2 vs 16_3)
            for (let i = 0; i < 2; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
            // 서아시아 8강전 매칭 (Winner 16_4 vs 16_5, Winner 16_6 vs 16_7)
            for (let i = 2; i < 4; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
            aclState.round = 8;
        } else if (curRound === 8) {
            const matches8 = aclState.bracket[8];
            const matches4 = aclState.bracket[4];
            // 동-서 교차 4강전 매치 생성 (East Winner 1 vs West Winner 1, East Winner 2 vs West Winner 2)
            // East 8강 위너: matches8[0], matches8[1]
            // West 8강 위너: matches8[2], matches8[3]
            matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
            matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
            matches4[0].status = "scheduled";
            
            matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
            matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
            matches4[1].status = "scheduled";
            
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

// 3. 아챔 탭 로드 시 렌더링 호출
function initAclTab() {
    checkAndRecoverEliminatedAcl();

    const seasonText = document.getElementById('aclSeasonYearText');
    if (seasonText) {
        seasonText.textContent = `${aclState.year} AFC 챔피언스리그`;
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
    const playerOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    
    // 1. aclState.teams 동기화 (전북)
    aclState.teams.forEach(team => {
        if (team.id === 'jeonbuk') {
            team.rating = playerOvr;
        } else if (['ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon'].includes(team.id)) {
            // 다른 K리그 구단은 리그 OVR과 맞춤 동기화
            if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                const leagueTeam = leagueTeams.find(t => t.id === team.id);
                if (leagueTeam && leagueTeam.rating !== undefined) {
                    team.rating = Math.min(leagueTeam.rating, 92);
                }
            }
        } else {
            team.rating = Math.min(team.rating, 92);
        }
    });
    
    // 2. 대진표(bracket) 내의 팀들 동기화
    [16, 8, 4, 2].forEach(roundKey => {
        aclState.bracket[roundKey].forEach(match => {
            if (match.team1) {
                if (match.team1.id === 'jeonbuk') {
                    match.team1.rating = playerOvr;
                } else if (['ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon'].includes(match.team1.id)) {
                    if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                        const leagueTeam = leagueTeams.find(t => t.id === match.team1.id);
                        if (leagueTeam && leagueTeam.rating !== undefined) {
                            match.team1.rating = Math.min(leagueTeam.rating, 92);
                        }
                    }
                } else {
                    match.team1.rating = Math.min(match.team1.rating, 92);
                }
            }
            if (match.team2) {
                if (match.team2.id === 'jeonbuk') {
                    match.team2.rating = playerOvr;
                } else if (['ulsan', 'seoul', 'pohang', 'gangwon', 'gwangju', 'gimcheon', 'bucheon_fc', 'jeju', 'daejeon', 'anyang', 'incheon'].includes(match.team2.id)) {
                    if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                        const leagueTeam = leagueTeams.find(t => t.id === match.team2.id);
                        if (leagueTeam && leagueTeam.rating !== undefined) {
                            match.team2.rating = Math.min(leagueTeam.rating, 92);
                        }
                    }
                } else {
                    match.team2.rating = Math.min(match.team2.rating, 92);
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

    if (aclState.isFinished) {
        const winner = aclState.bracket.winner || { name: '전북 현대', rating: 75 };
        const isPlayerWinner = winner.id === 'jeonbuk';
        
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
            ? "AFC 챔피언스리그 우승을 축하합니다! 아시아 최정상 구단에 등극했습니다." 
            : `AFC 챔피언스리그 시즌 완료. (${winner.name} 우승)`;
        
        const btn = document.getElementById('btnStartAclMatch');
        if (btn) {
            btn.disabled = true;
            if (isPlayerWinner) {
                btn.innerHTML = `<i class="fa-solid fa-trophy" style="margin-right: 8px;"></i>아챔 우승 완료`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락 (대회 종료)`;
            }
        }
        return;
    }

    const curRound = aclState.round;
    const matches = aclState.bracket[curRound];
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));

    const btn = document.getElementById('btnStartAclMatch');
    const timeDisplay = document.getElementById('aclSbTimeDisplay');

    if (!playerMatch) {
        document.getElementById('aclHomeTeamName').textContent = "전북 현대";
        document.getElementById('aclAwayTeamName').textContent = "토너먼트 탈락";
        document.getElementById('aclHomeTeamOvr').textContent = "-";
        document.getElementById('aclAwayTeamOvr').textContent = "-";
        document.getElementById('aclHomeScore').textContent = "L";
        document.getElementById('aclAwayScore').textContent = "O";
        if (timeDisplay) {
            timeDisplay.textContent = "OUT";
            timeDisplay.classList.remove('live-ticking');
        }
        document.getElementById('aclMatchVenueDisplay').textContent = "전북 현대가 탈락했습니다.";
        
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
    const opponent = t1.id === 'jeonbuk' ? t2 : t1;
    const oppFormation = TEAM_FORMATIONS_PRESET[opponent.id] || "4-4-2";
    const compBonus = getFormationCompatibilityBonus(currentFormation, oppFormation);
    
    if (analysisCard) {
        analysisCard.style.display = 'block';
        document.getElementById('aclOpponentFormationText').innerText = oppFormation;
        document.getElementById('aclOpponentMoodText').innerHTML = `보통 😐`; // 아챔 대회 컨디션 보통 고정
        
        const compTextEl = document.getElementById('aclOpponentCompatibilityText');
        if (compTextEl) {
            compTextEl.className = 'opponent-analysis-tactic-row';
            if (compBonus > 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-advantage');
                compTextEl.innerHTML = `전북 현대의 <strong>${currentFormation}</strong> 전술이 상대의 <strong>${oppFormation}</strong> 전술에 상성상 우세합니다! (공격 찬스 확률 +5.0% ⚡)`;
            } else if (compBonus < 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-disadvantage');
                compTextEl.innerHTML = `상대의 <strong>${oppFormation}</strong> 전술이 전북 현대의 <strong>${currentFormation}</strong> 전술에 상성상 우세합니다. (공격 찬스 확률 -5.0% ⚠️)`;
            } else {
                // 피드백 반영: 상성이 비겼을 때(보너스 0)는 설명 숨김
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
            timeDisplay.textContent = 'ACL VS';
            timeDisplay.classList.remove('live-ticking');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i>아챔 경기 시작 (15초 소요)`;
        }
    }

    const homeEmblemEl = document.getElementById('aclHomeEmblem');
    const awayEmblemEl = document.getElementById('aclAwayEmblem');
    if (homeEmblemEl) {
        homeEmblemEl.innerHTML = getAclTeamEmblemHtml(t1, 48);
        if (t1.id === 'jeonbuk') {
            homeEmblemEl.classList.add('jeonbuk-emblem-box');
        } else {
            homeEmblemEl.classList.remove('jeonbuk-emblem-box');
        }
    }
    if (awayEmblemEl) {
        awayEmblemEl.innerHTML = getAclTeamEmblemHtml(t2, 48);
        if (t2.id === 'jeonbuk') {
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
    html += `<div class="bracket-round">
        <div class="bracket-round-title" style="color:#00ff87; border-color:rgba(0,255,135,0.2); background:rgba(0,255,135,0.06);">준결승 (동-서 교차)</div>
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
            <div class="bracket-winner-title" style="color:#00ff87;"><i class="fa-solid fa-trophy"></i> ACL CHAMPION</div>
            <div class="bracket-winner-name">
                ${getAclTeamEmblemHtml(aclState.bracket.winner, 20)}
                <span style="margin-left: 4px;">${aclState.bracket.winner.name}</span>
            </div>
        </div>`;
    } else {
        html += `
        <div class="bracket-winner-node" style="opacity: 0.5; border-style: dashed; background: transparent; box-shadow: none; animation: none;">
            <div class="bracket-winner-title" style="color:var(--text-muted);">ACL CHAMPION</div>
            <div class="bracket-winner-name" style="color: var(--text-muted);">대기 중</div>
        </div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
}

function renderAclMatchNode(match, round) {
    const isPlayerMatch = (match.team1 && match.team1.id === 'jeonbuk') || (match.team2 && match.team2.id === 'jeonbuk');
    const isActive = (aclState.round === round && isPlayerMatch && match.status !== 'completed');
    const activeClass = isActive ? 'match-active' : '';
    
    let t1Html = '';
    if (match.team1) {
        let t1Class = '';
        if (match.winner === 'team1') t1Class = 'team-won';
        else if (match.winner === 'team2') t1Class = 'team-lost';
        if (match.team1.id === 'jeonbuk') t1Class += ' team-player';
        
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
            <div class="bracket-team" style="opacity: 0.5;">
                <span class="bracket-team-name">대기 중</span>
                <span class="bracket-team-score">-</span>
            </div>
        `;
    }

    let t2Html = '';
    if (match.team2) {
        let t2Class = '';
        if (match.winner === 'team2') t2Class = 'team-won';
        else if (match.winner === 'team1') t2Class = 'team-lost';
        if (match.team2.id === 'jeonbuk') t2Class += ' team-player';
        
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
            <div class="bracket-team" style="opacity: 0.5;">
                <span class="bracket-team-name">대기 중</span>
                <span class="bracket-team-score">-</span>
            </div>
        `;
    }

    // 아챔 전용 호버 효과 적용을 위해 border-color 클래스 추가
    return `
        <div class="bracket-match ${activeClass}" style="${isActive ? 'border-color: rgba(0, 255, 135, 0.6); box-shadow: 0 0 12px rgba(0, 255, 135, 0.25); background: rgba(0, 255, 135, 0.04);' : ''}">
            ${t1Html}
            ${t2Html}
        </div>
    `;
}

// 7. 팀 엠블럼 HTML 헬퍼 (K리그 에셋 + 아시아 해외구단 고유 컬러 테마 쉴드)
function getAclTeamEmblemHtml(team, size = 18) {
    const k1Mapping = {
        "jeonbuk": "img/mark_jb.svg",
        "ulsan": "img/mark_ulsan.png",
        "seoul": "img/mark_seoul.png",
        "pohang": "img/mark_pohang.png",
        "gangwon": "img/mark_gangwon.png",
        "gwangju": "img/mark_gwangju.png",
        "gimcheon": "img/mark_kc.png",
        "bucheon_fc": "img/mark_buchn.png",
        "jeju": "img/mark_jeju.png",
        "daejeon": "img/mark_dj.png",
        "anyang": "img/mark_anyang.png",
        "incheon": "img/mark_incheon.png"
    };

    if (k1Mapping[team.id]) {
        const isJeonbukGlow = (team.id === 'jeonbuk' && size >= 30) ? 'match-emblem-glow' : '';
        return `<img src="${k1Mapping[team.id]}" alt="${team.name}" class="match-emblem-img ${isJeonbukGlow}" style="height: ${size}px; width: ${size}px; object-fit: contain; vertical-align: middle; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">`;
    } else {
        // 해외 구단은 컬러 쉴드
        let color = '#a55eea';
        if (typeof ACL_TEAMS_PRESET !== 'undefined') {
            const preset = ACL_TEAMS_PRESET.find(p => p.id === team.id);
            if (preset && preset.color) color = preset.color;
        }
        
        return `<i class="fa-solid fa-shield-halved" style="color: ${color}; font-size: ${size - 2}px; width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></i>`;
    }
}

// 8. 득점/도움 순위판 렌더링
function renderAclStats() {
    const goalsBody = document.getElementById('aclGoalsBody');
    const assistsBody = document.getElementById('aclAssistsBody');
    if (!goalsBody || !assistsBody) return;

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
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #ffd700;"' : '';
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
            const isJeonbuk = p.teamId === 'jeonbuk';
            const rowStyle = isJeonbuk ? 'style="background: rgba(0, 255, 135, 0.08); font-weight: bold; color: #00ff87;"' : '';
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

// 9. 아챔 경기 시뮬레이터 (15초 라이브 텍스트 중계)
function startAclMatchSimulation() {
    if (aclState.isFinished) {
        alert("이미 이번 시즌 AFC 챔피언스리그가 종료되었습니다.");
        return;
    }

    const curRound = aclState.round;
    const matches = aclState.bracket[curRound];
    
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));
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

    let playerScorerName = "이승우";
    let playerAssisterName = "송민규";
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
    const isDetailedActive = detailedTacticBonus > 0;
    const suitabilityBonus = detailedTactic.suitabilityBonus;
    const detailedTacticLabel = detailedTactic.detailedTacticLabel;
    const suitabilityLabel = detailedTactic.suitabilityLabel;

    const isHome = playerMatch.team1.id === 'jeonbuk';
    const opponent = isHome ? playerMatch.team2 : playerMatch.team1;

    const finalOvrs = calculateFinalMatchOvrs('neutral', isHome, opponent.rating, false);
    const playerOvr = finalOvrs.playerOvr;
    const opponentOvr = finalOvrs.opponentOvr;
    let activeDiff = playerOvr - opponentOvr;
    
    const maxProb = 0.80;
    const minProb = 0.20;
    
    const oppFormation = TEAM_FORMATIONS_PRESET[opponent.id] || "4-4-2";
    const compatibilityBonus = getFormationCompatibilityBonus(currentFormation, oppFormation);
    let activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));

    const commentaryData = {
        playerOvr: playerOvr,
        opponentName: opponent.name,
        opponentOvr: opponent.rating,
        isPlayerHome: isHome,
        playerScoreVal: 0,
        opponentScoreVal: 0,
        activeGk: (squadFormation["GK"] && CARDS_DATABASE[squadFormation["GK"]]) ? CARDS_DATABASE[squadFormation["GK"]].name : "무명 골키퍼",
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: activePlayerAttackProb,
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
                // 돌발 변수 룰렛
                const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
                const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
                
                if (specialEvent) {
                    addCommentary(currentMin, specialEvent.eventDesc, 'system');
                    if (specialEvent.type === "pk_player") {
                        if (specialEvent.isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(1);
                            addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "pk_opponent") {
                        if (specialEvent.isGoal) {
                            opponentScoreVal++;
                            const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                            addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "red_opponent") {
                        activeDiff += specialEvent.ovrChange; // +5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    } else if (specialEvent.type === "red_player") {
                        activeDiff += specialEvent.ovrChange; // -5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else {
                    // 일반 경기 찬스 시뮬레이션
                    const isPlayerTurn = Math.random() < activePlayerAttackProb;
                    if (isPlayerTurn) {
                        const attackOptions = [0, 1, 2];
                        if (currentFormation === '4-2-3-1') attackOptions.push(5);
                        const option = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                        
                        let chancePlayerStat = 75;
                        if (option === 0) {
                            const lwCardId = squadFormation['LW'];
                            if (lwCardId && CARDS_DATABASE[lwCardId]) {
                                const card = getAwakenedCard(lwCardId);
                                chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                            }
                        } else if (option === 1) {
                            const stCardId = squadFormation['ST'];
                            if (stCardId && CARDS_DATABASE[stCardId]) {
                                const card = getAwakenedCard(stCardId);
                                chancePlayerStat = card.stats.sho || 75;
                            }
                        } else if (option === 2) {
                            const rwCardId = squadFormation['RW'];
                            if (rwCardId && CARDS_DATABASE[rwCardId]) {
                                const card = getAwakenedCard(rwCardId);
                                chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                            }
                        } else if (option === 5) {
                            const cmCardId = squadFormation['CM'];
                            if (cmCardId && CARDS_DATABASE[cmCardId]) {
                                const card = getAwakenedCard(cmCardId);
                                chancePlayerStat = card.stats.dri || 75;
                            }
                        }
                        
                        const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponent.rating, formationScoreBoost, suitabilityBonus);
                        const isGoal = Math.random() < scoreProb;
                        
                        const commDataLocal = { ...commentaryData, ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(option, currentFormation, isDetailedActive, commDataLocal);
                        
                        addCommentary(currentMin, eventDesc, 'normal');
                        
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(option);
                            addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, eventFail, 'normal');
                        }
                    } else {
                        let playerGkStat = 70;
                        const gkCardId = squadFormation['GK'];
                        if (gkCardId && CARDS_DATABASE[gkCardId]) {
                            const card = getAwakenedCard(gkCardId);
                            playerGkStat = card.stats.def || card.rating || 70;
                        }
                        const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                        const isGoal = Math.random() < oppScoreProb;
                        
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        const commDataLocal = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                        
                        addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commDataLocal, false), 'normal');
                        
                        if (isGoal) {
                            opponentScoreVal++;
                            addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commDataLocal, false), 'goal');
                        } else {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commDataLocal, false), 'normal');
                        }
                    }
                }
            } else if (currentMin === 45) {
                addCommentary('HT', `[하프타임] 전반전이 종료되었습니다. 스코어 ${playerScoreVal}:${opponentScoreVal}. 잠시 휴식 후 후반전이 시작됩니다.`, 'system');
            } else if (currentMin === 90) {
                addCommentary(90, `[정규시간 종료] 주심이 시계를 보며 경기 종료 휘슬을 불 준비를 합니다.`, 'normal');
            }
        });
        
        // 점수 실시간 반영
        if (isHome) {
            document.getElementById('aclHomeScore').textContent = playerScoreVal;
            document.getElementById('aclAwayScore').textContent = opponentScoreVal;
        } else {
            document.getElementById('aclHomeScore').textContent = opponentScoreVal;
            document.getElementById('aclAwayScore').textContent = playerScoreVal;
        }
        
        // 결과 처리
        if (playerScoreVal === opponentScoreVal) {
            addCommentary('FT', `[종료] 전후반 90분이 종료되었습니다. 스코어 ${playerScoreVal}:${opponentScoreVal}. 승부를 가리기 위한 연장/승부차기로 돌입합니다!`, 'system');
            simulateAclOvertimeOrPenalties(playerScoreVal, opponentScoreVal, playerMatch, playerScorerName, playerAssisterName, opponent);
        } else {
            const score1 = isHome ? playerScoreVal : opponentScoreVal;
            const score2 = isHome ? opponentScoreVal : playerScoreVal;
            finalizeAclMatch(score1, score2, playerMatch);
        }
        return;
    }

    const tickInterval = setInterval(() => {
        if (tickIdx >= matchMinutes.length) {
            clearInterval(tickInterval);
            
            // 동점일 경우 연장전/승부차기 돌입
            if (playerScoreVal === opponentScoreVal) {
                addCommentary('FT', `[종료] 전후반 90분이 종료되었습니다. 스코어 ${playerScoreVal}:${opponentScoreVal}. 승부를 가리기 위한 연장/승부차기로 돌입합니다!`, 'system');
                
                setTimeout(() => {
                    simulateAclOvertimeOrPenalties(playerScoreVal, opponentScoreVal, playerMatch, playerScorerName, playerAssisterName, opponent);
                }, 1000);
            } else {
                const score1 = isHome ? playerScoreVal : opponentScoreVal;
                const score2 = isHome ? opponentScoreVal : playerScoreVal;
                finalizeAclMatch(score1, score2, playerMatch);
            }
            return;
        }

        const currentMin = matchMinutes[tickIdx];
        if (timeDisplay) timeDisplay.textContent = `${currentMin}'`;

        if (currentMin === 0) {
            addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false), 'normal');
        } else if (eventMins.includes(currentMin)) {
            // 돌발 변수 룰렛
            const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
            const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
            
            if (specialEvent) {
                addCommentary(currentMin, specialEvent.eventDesc, 'system');
                if (specialEvent.type === "pk_player") {
                    if (specialEvent.isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(1);
                        addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                        addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                    } else {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else if (specialEvent.type === "pk_opponent") {
                    if (specialEvent.isGoal) {
                        opponentScoreVal++;
                        const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                        addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                        addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                    } else {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange; // +5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                    addCommentary(currentMin, specialEvent.eventFail, 'normal');
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange; // -5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));
                    addCommentary(currentMin, specialEvent.eventFail, 'normal');
                }
            } else {
                // 일반 경기 찬스 시뮬레이션
                const isPlayerTurn = Math.random() < activePlayerAttackProb;
                if (isPlayerTurn) {
                    const attackOptions = [0, 1, 2];
                    if (currentFormation === '4-2-3-1') attackOptions.push(5);
                    const option = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    
                    let chancePlayerStat = 75;
                    if (option === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId]) {
                            const card = getAwakenedCard(lwCardId);
                            chancePlayerStat = Math.round(((card.stats.dri || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (option === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) {
                            const card = getAwakenedCard(stCardId);
                            chancePlayerStat = card.stats.sho || 75;
                        }
                    } else if (option === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) {
                            const card = getAwakenedCard(rwCardId);
                            chancePlayerStat = Math.round(((card.stats.pac || 75) + (card.stats.sho || 75)) / 2);
                        }
                    } else if (option === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const card = getAwakenedCard(cmCardId);
                            chancePlayerStat = card.stats.dri || 75;
                        }
                    }
                    
                    const scoreProb = calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponent.rating, formationScoreBoost, suitabilityBonus);
                    const isGoal = Math.random() < scoreProb;
                    
                    const commDataLocal = { ...commentaryData, ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(option, currentFormation, isDetailedActive, commDataLocal);
                    
                    addCommentary(currentMin, eventDesc, 'normal');
                    
                    if (isGoal) {
                        playerScoreVal++;
                        const goalData = determineScorerAndAssister(option);
                        addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, eventGoal, 'goal');
                        }, 200);
                    } else {
                        addCommentary(currentMin, eventFail, 'normal');
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        const card = getAwakenedCard(gkCardId);
                        playerGkStat = card.stats.def || card.rating || 70;
                    }
                    const oppScoreProb = calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat);
                    const isGoal = Math.random() < oppScoreProb;
                    
                    const oppGoalData = determineOpponentScorerAndAssister(opponent.id);
                    const commDataLocal = { ...commentaryData, opponentScorerName: oppGoalData.scorerName, opponentAssisterName: oppGoalData.assisterName };
                    
                    addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commDataLocal, false), 'normal');
                    
                    if (isGoal) {
                        opponentScoreVal++;
                        addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, oppGoalData.scorerName, oppGoalData.assisterName);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commDataLocal, false), 'goal');
                        }, 200);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commDataLocal, false), 'normal');
                        }, 200);
                    }
                }
            }
            
            if (isHome) {
                document.getElementById('aclHomeScore').textContent = playerScoreVal;
                document.getElementById('aclAwayScore').textContent = opponentScoreVal;
            } else {
                document.getElementById('aclHomeScore').textContent = opponentScoreVal;
                document.getElementById('aclAwayScore').textContent = playerScoreVal;
            }
        } else if (currentMin === 45) {
            addCommentary('HT', `[하프타임] 전반전이 종료되었습니다. 스코어 ${playerScoreVal}:${opponentScoreVal}. 잠시 휴식 후 후반전이 시작됩니다.`, 'system');
        } else if (currentMin === 90) {
            addCommentary(90, `[정규시간 종료] 주심이 시계를 보며 경기 종료 휘슬을 불 준비를 합니다.`, 'normal');
        }

        tickIdx++;
    }, 1200);
}

function simulateAclOvertimeOrPenalties(score1, score2, playerMatch, playerScorerName, playerAssisterName, opponent) {
    const isHome = playerMatch.team1.id === 'jeonbuk';
    const timeDisplay = document.getElementById('aclSbTimeDisplay');
    
    const addCommentary = (min, text, type = 'normal') => {
        const commBox = document.getElementById('aclCommentaryScroll');
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#00ff87; margin-right: 6px;">${min}</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    const etData = {
        team1Name: playerMatch.team1.name,
        team2Name: playerMatch.team2.name,
        rating1: playerMatch.team1.rating,
        rating2: playerMatch.team2.rating,
        score1: isHome ? score1 : score2,
        score2: isHome ? score2 : score1,
        playerScorerName: playerScorerName,
        playerAssisterName: playerAssisterName,
        isTeam1Jeonbuk: isHome,
        opponentTeamId: opponent.id
    };

    const etResult = simulateExtraTimeEngine(etData);

    const runActualAclPenaltyShootout = (etScore1, etScore2) => {
        if (timeDisplay) {
            timeDisplay.textContent = "PK";
            timeDisplay.classList.remove('live-ticking');
        }
        
        const pkData = {
            team1Name: playerMatch.team1.name,
            team2Name: playerMatch.team2.name,
            rating1: playerMatch.team1.rating,
            rating2: playerMatch.team2.rating,
            isTeam1Jeonbuk: isHome
        };
        
        const pkResult = simulatePenaltyShootoutEngine(pkData);
        if (isDeveloperMode) {
            pkResult.events.forEach(ev => {
                addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? "goal" : "normal");
                
                // 점수 실시간 반영
                document.getElementById('aclHomeScore').textContent = `${etScore1} (${ev.score1})`;
                document.getElementById('aclAwayScore').textContent = `${etScore2} (${ev.score2})`;
            });
            
            finalizeAclMatch(etScore1, etScore2, playerMatch, pkResult.pkScore1, pkResult.pkScore2);
            return;
        }
        
        let pkIdx = 0;
        const pkTimer = setInterval(() => {
            if (pkIdx < pkResult.events.length) {
                const ev = pkResult.events[pkIdx];
                addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? "goal" : "normal");
                
                if (ev.success && typeof playGoalSound === 'function') {
                    try { playGoalSound(); } catch (e) {}
                }
                
                // 점수 실시간 반영
                document.getElementById('aclHomeScore').textContent = `${etScore1} (${ev.score1})`;
                document.getElementById('aclAwayScore').textContent = `${etScore2} (${ev.score2})`;
                
                pkIdx++;
            } else {
                clearInterval(pkTimer);
                finalizeAclMatch(etScore1, etScore2, playerMatch, pkResult.pkScore1, pkResult.pkScore2);
            }
        }, 1200);
    };

    if (isDeveloperMode) {
        if (timeDisplay) {
            timeDisplay.textContent = "종료";
            timeDisplay.classList.remove('live-ticking');
        }
        
        etResult.events.forEach(ev => {
            if (ev.type === 'goal') {
                document.getElementById('aclHomeScore').textContent = ev.score1;
                document.getElementById('aclAwayScore').textContent = ev.score2;
                
                const isGoalByPlayer = (ev.side === 'team1' && isHome) || (ev.side === 'team2' && !isHome);
                if (isGoalByPlayer) {
                    addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, playerScorerName, playerAssisterName);
                } else {
                    addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, ev.scorerName, ev.assisterName);
                }
            }
            addCommentary(ev.min, ev.text, ev.type === 'goal' ? 'goal' : (ev.type === 'system' ? 'system' : 'normal'));
        });

        if (etResult.score1 === etResult.score2) {
            addCommentary('SYSTEM', "⚖️ 연장 120분 혈투 끝에도 승부가 나지 않았습니다! 최후의 승부차기로 돌입합니다.", "system");
            runActualAclPenaltyShootout(etResult.score1, etResult.score2);
        } else {
            finalizeAclMatch(etResult.score1, etResult.score2, playerMatch);
        }
        return;
    }

    let etTick = 0;
    const etTimer = setInterval(() => {
        if (etTick < etResult.events.length) {
            const ev = etResult.events[etTick];
            if (timeDisplay) timeDisplay.textContent = ev.min;
            
            if (ev.type === 'goal') {
                if (typeof playGoalSound === 'function') {
                    try { playGoalSound(); } catch (e) {}
                }
                document.getElementById('aclHomeScore').textContent = ev.score1;
                document.getElementById('aclAwayScore').textContent = ev.score2;
                
                const isGoalByPlayer = (ev.side === 'team1' && isHome) || (ev.side === 'team2' && !isHome);
                if (isGoalByPlayer) {
                    addAclPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, playerScorerName, playerAssisterName);
                } else {
                    addAclPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, ev.scorerName, ev.assisterName);
                }
            }
            
            addCommentary(ev.min, ev.text, ev.type === 'goal' ? 'goal' : (ev.type === 'system' ? 'system' : 'normal'));
            etTick++;
        } else {
            clearInterval(etTimer);
            
            if (etResult.score1 === etResult.score2) {
                addCommentary('SYSTEM', "⚖️ 연장 120분 혈투 끝에도 승부가 나지 않았습니다! 최후의 승부차기로 돌입합니다.", "system");
                setTimeout(() => {
                    runActualAclPenaltyShootout(etResult.score1, etResult.score2);
                }, 1200);
            } else {
                finalizeAclMatch(etResult.score1, etResult.score2, playerMatch);
            }
        }
    }, 1200);
}

// 득점/도움 순위 실시간 가산
function addAclPlayerStatRecord(team, scorerName, assisterName) {
    if (!team) return;
    
    const isPlayer = team.id === 'jeonbuk';
    const sName = scorerName ? scorerName : (isPlayer ? "무명 선수" : `${team.name} 에이스`);
    const existScorer = aclState.stats.scorers.find(s => s.name === sName && s.teamId === team.id);
    if (existScorer) {
        existScorer.goals += 1;
    } else {
        aclState.stats.scorers.push({ name: sName, teamName: team.name, goals: 1, teamId: team.id });
    }

    if (isPlayer && scorerName) {
        // 통산 누적 득점 기록에 연동
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

    const isPlayerWinner = (playerMatch.winner === 'team1' && playerMatch.team1.id === 'jeonbuk') ||
                          (playerMatch.winner === 'team2' && playerMatch.team2.id === 'jeonbuk');

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
        
        addCommentary("종료", `[승리] 최종 스코어 ${scoreDisplayStr}로 전북 현대가 아챔 다음 라운드로 진출합니다!`, "goal");
        showToast(`승리했습니다! 아챔 다음 라운드에 진출합니다.`);

        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-forward" style="margin-right: 8px;"></i>다음 라운드 대진표 갱신`;
        }
    } else {
        if (typeof playDefeatSound === 'function') {
            try { playDefeatSound(); } catch (e) {}
        }
        
        let scoreDisplayStr = `${score1} : ${score2}`;
        if (pkScore1 !== undefined) scoreDisplayStr += ` (PK ${pkScore1} : ${pkScore2})`;

        addCommentary("종료", `[패배] 최종 스코어 ${scoreDisplayStr}로 전북 현대의 아챔 도전이 여기서 마감됩니다.`, "system");
        
        // 탈락 보상 확인 (8강 또는 4강 탈락 시 10 FP, 결승전 탈락 시는 결승전 승패 분기에서 처리)
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
        
        // AI 시뮬레이션 처리
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

    simulateAclAiMatches(curRound);

    if (curRound === 16) {
        const matches16 = aclState.bracket[16];
        const matches8 = aclState.bracket[8];
        
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
        aclState.round = 8;
    } else if (curRound === 8) {
        const matches8 = aclState.bracket[8];
        const matches4 = aclState.bracket[4];
        
        // 4강 준결승 교차 매칭 (East 1 vs West 1, East 2 vs West 2)
        // East: matches8[0], matches8[1]
        // West: matches8[2], matches8[3]
        matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
        matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
        matches4[0].status = "scheduled";
        
        matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
        matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
        matches4[1].status = "scheduled";
        
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

        if (champion.id === 'jeonbuk') {
            userPoints += 20; // 우승 보상 20 FP
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            if (typeof renderUserPoints === 'function') renderUserPoints();
            
            setTimeout(() => {
                showAclWinnerCelebrationModal(20, "아챔 우승!");
            }, 500);
        } else {
            // 준우승 보상 지급 (결승전에 올라가서 졌을 때 15 FP)
            const isHomeJeonbuk = finalMatch.team1 && finalMatch.team1.id === 'jeonbuk';
            const isAwayJeonbuk = finalMatch.team2 && finalMatch.team2.id === 'jeonbuk';
            if (isHomeJeonbuk || isAwayJeonbuk) {
                userPoints += 15; // 준우승 보상 15 FP
                try {
                    localStorage.setItem('fc_star_user_points', userPoints.toString());
                } catch(e) {}
                if (typeof renderUserPoints === 'function') renderUserPoints();
                showToast("결승전에서 패배해 준우승에 머물렀습니다. 준우승 보상 15 FP를 획득했습니다!");
            }
        }
    }

    saveAclState();
}

// AI간 매치 시뮬레이션
function simulateAclAiMatches(round) {
    const matches = aclState.bracket[round];
    matches.forEach(match => {
        const isPlayerMatch = (match.team1 && match.team1.id === 'jeonbuk') || (match.team2 && match.team2.id === 'jeonbuk');
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
        if (typeof determineOpponentScorerAndAssister === 'function') {
            const oppGoalData = determineOpponentScorerAndAssister(winnerTeam.id);
            addAclPlayerStatRecord(winnerTeam, oppGoalData.scorerName, oppGoalData.assisterName);
        } else {
            addAclPlayerStatRecord(winnerTeam, null, null);
        }
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

// 아챔 우승 축하 모달 팝업
function showAclWinnerCelebrationModal(pointsVal, title) {
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
                <i class="fa-solid fa-earth-asia"></i>
            </div>
            <h1 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; letter-spacing: 1px;">아시아 챔피언!</h1>
            <p style="font-size: 1rem; color: #00ff87; font-weight: 800; margin-bottom: 1.5rem;">전북 현대가 아시아 최정상에 등극했습니다!</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
                동아시아와 서아시아의 쟁쟁한 강호들을 꺾고 이뤄낸 역사적인 순간입니다.<br>
                당신은 아시아 클럽 축구 역사의 정점에 섰습니다!
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

function playerLwName() {
    return (squadFormation["LW"] && CARDS_DATABASE[squadFormation["LW"]]) ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
}
function playerRwName() {
    return (squadFormation["RW"] && CARDS_DATABASE[squadFormation["RW"]]) ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
}

// 개발자 모드 전용: 아챔 결승전 워프 함수
function skipToAclFinal() {
    if (typeof aclState === 'undefined' || !aclState) {
        console.warn("아챔 상태 데이터가 로드되지 않았습니다.");
        return;
    }
    if (aclState.isFinished) {
        console.warn("이미 이번 시즌 아챔이 종료되었습니다. 다음 시즌 시작 후 시도하세요.");
        return;
    }
    
    while (aclState.round > 2) {
        const curRound = aclState.round;
        const matches = aclState.bracket[curRound];
        if (!matches || matches.length === 0) break;
        
        matches.forEach(match => {
            if (match.status === 'completed') return;
            
            const hasPlayer = (match.team1 && match.team1.id === 'jeonbuk') || (match.team2 && match.team2.id === 'jeonbuk');
            if (hasPlayer) {
                const isHomeJeonbuk = match.team1 && match.team1.id === 'jeonbuk';
                match.score1 = isHomeJeonbuk ? 3 : 1;
                match.score2 = isHomeJeonbuk ? 1 : 3;
                match.winner = isHomeJeonbuk ? 'team1' : 'team2';
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
            aclState.round = 8;
        } else if (curRound === 8) {
            const matches8 = aclState.bracket[8];
            const matches4 = aclState.bracket[4];
            matches4[0].team1 = matches8[0].winner === 'team1' ? matches8[0].team1 : matches8[0].team2;
            matches4[0].team2 = matches8[2].winner === 'team1' ? matches8[2].team1 : matches8[2].team2;
            matches4[0].status = "scheduled";
            
            matches4[1].team1 = matches8[1].winner === 'team1' ? matches8[1].team1 : matches8[1].team2;
            matches4[1].team2 = matches8[3].winner === 'team1' ? matches8[3].team1 : matches8[3].team2;
            matches4[1].status = "scheduled";
            
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
    console.log("🏆 플레이어팀(전북 현대)이 아챔 결승전(Round 2) 대진으로 바로 진출 완료되었습니다!");
}
