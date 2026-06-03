// js/cup.js - KFA 코리아컵 (리그컵) UI 및 토너먼트 모듈

// 1. 코리아컵 상태 및 변수 선언
let cupState = {
    year: 2026,
    round: 16, // 16: 16강, 8: 8강, 4: 4강, 2: 결승, 1: 종료 (우승자 탄생)
    teams: [], // 16개 참여팀 리스트 { id, name, rating }
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

const CUP_TEAMS_PRESET = [
    { id: "jeonbuk", name: "전북 현대", rating: 70 },
    { id: "ulsan", name: "울산 HD", rating: 80 },
    { id: "seoul", name: "FC 서울", rating: 78 },
    { id: "pohang", name: "포항 스틸러스", rating: 77 },
    { id: "gangwon", name: "강원 FC", rating: 76 },
    { id: "gwangju", name: "광주 FC", rating: 75 },
    { id: "gimcheon", name: "김천 상무", rating: 75 },
    { id: "bucheon_fc", name: "부천 FC", rating: 74 },
    { id: "jeju", name: "제주 유나이티드", rating: 73 },
    { id: "daejeon", name: "대전 하나", rating: 73 },
    { id: "anyang", name: "FC 안양", rating: 71 },
    { id: "incheon", name: "인천 유나이티드", rating: 70 },
    
    // K리그2 추가 팀 (수원삼성, 대구FC, 부산, 서울E)
    { id: "suwon_samsung", name: "수원삼성", rating: 68 },
    { id: "daegu_fc", name: "대구FC", rating: 68 },
    { id: "busan_ipark", name: "부산", rating: 67 },
    { id: "seoul_e_land", name: "서울E", rating: 66 }
];

// 2. 코리아컵 초기화 함수
function initCup() {
    try {
        const savedState = localStorage.getItem('fc_star_cup_state');
        if (savedState) {
            cupState = JSON.parse(savedState);
            // K리그 시즌 연도 동기화 (league.js 연동 대비)
            if (typeof leagueYear !== 'undefined') {
                cupState.year = leagueYear;
            }
            // 플레이어 탈락 시 상태 복구
            checkAndRecoverEliminatedCup();
            return;
        }
    } catch (e) {
        console.warn("localStorage에 접근할 수 없습니다. 메모리 상태를 사용합니다.");
    }
    
    // 신규 시즌 설정
    resetCupStateData();
}

function resetCupStateData() {
    const curYear = (typeof leagueYear !== 'undefined') ? leagueYear : 2026;
    const playerOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    
    // K2 팀의 OVR을 플레이어 OVR - (0~5) 범위로 동적 설정, K1 팀은 리그 상대팀 OVR 적용
    const initializedTeams = CUP_TEAMS_PRESET.map(team => {
        let rating = team.rating;
        if (["suwon_samsung", "daegu_fc", "busan_ipark", "seoul_e_land"].includes(team.id)) {
            const minus = Math.floor(Math.random() * 6);
            rating = Math.max(50, playerOvr - minus);
        } else {
            // K1 팀인 경우 리그의 상대팀 OVR 가져오기
            if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                const leagueTeam = leagueTeams.find(t => t.id === team.id);
                if (leagueTeam && leagueTeam.rating !== undefined) {
                    rating = leagueTeam.rating;
                }
            }
        }
        return { ...team, rating: rating };
    });

    // 16개 팀 무작위 셔플
    const shuffledTeams = shuffleCupArray(initializedTeams);
    
    // 16강전 대진 배치 (8개 경기 생성)
    const matches16 = [];
    for (let i = 0; i < 8; i++) {
        matches16.push({
            id: `16_${i}`,
            team1: shuffledTeams[i * 2],
            team2: shuffledTeams[i * 2 + 1],
            score1: null,
            score2: null,
            winner: null, // 'team1' or 'team2'
            status: "scheduled" // "scheduled", "playing", "completed"
        });
    }

    // 8강, 4강, 결승전 껍데기 생성
    const matches8 = Array.from({ length: 4 }, (_, i) => ({ id: `8_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
    const matches4 = Array.from({ length: 2 }, (_, i) => ({ id: `4_${i}`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }));
    const matches2 = [{ id: `2_0`, team1: null, team2: null, score1: null, score2: null, winner: null, status: "scheduled" }];

    cupState = {
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
            scorers: generateMockScorers(),
            assisters: generateMockAssisters()
        }
    };

    saveCupState();
}

function saveCupState() {
    try {
        localStorage.setItem('fc_star_cup_state', JSON.stringify(cupState));
    } catch(e) {}
}

// 플레이어가 탈락했을 때 자동 복구 및 남은 토너먼트 시뮬레이션 처리
function checkAndRecoverEliminatedCup() {
    if (cupState.isFinished) return;
    
    let isPlayerEliminated = false;
    [16, 8, 4, 2].forEach(roundKey => {
        const matches = cupState.bracket[roundKey] || [];
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
        console.log("플레이어가 코리아컵에서 탈락한 상태를 감지했습니다. 남은 대회를 자동 시뮬레이션 처리합니다.");
        simulateRemainingCupRounds();
    }
}

function simulateRemainingCupRounds() {
    // 플레이어가 탈락했을 때 남은 토너먼트 전체 라운드를 AI 시뮬레이션으로 한 번에 완료 처리
    while (!cupState.isFinished) {
        const curRound = cupState.round;
        
        // 1. 현재 라운드의 모든 AI 경기 시뮬레이션 (플레이어는 이미 경기 완료(패배) 상태이므로 건너뜀)
        simulateCupAiMatches(curRound);
        
        // 2. 다음 라운드로 대진표 갱신
        if (curRound === 16) {
            const matches16 = cupState.bracket[16];
            const matches8 = cupState.bracket[8];
            for (let i = 0; i < 4; i++) {
                const m1 = matches16[i * 2];
                const m2 = matches16[i * 2 + 1];
                matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches8[i].status = "scheduled";
            }
            cupState.round = 8;
        } else if (curRound === 8) {
            const matches8 = cupState.bracket[8];
            const matches4 = cupState.bracket[4];
            for (let i = 0; i < 2; i++) {
                const m1 = matches8[i * 2];
                const m2 = matches8[i * 2 + 1];
                matches4[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
                matches4[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
                matches4[i].status = "scheduled";
            }
            cupState.round = 4;
        } else if (curRound === 4) {
            const matches4 = cupState.bracket[4];
            const matches2 = cupState.bracket[2];
            const m1 = matches4[0];
            const m2 = matches4[1];
            matches2[0].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
            matches2[0].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
            matches2[0].status = "scheduled";
            cupState.round = 2;
        } else if (curRound === 2) {
            const finalMatch = cupState.bracket[2][0];
            
            // 결승전 AI 시뮬레이션 강제 수행
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
                addPlayerStatRecord(score1 > score2 ? finalMatch.team1 : finalMatch.team2, null, null);
            }
            
            const champion = finalMatch.winner === 'team1' ? finalMatch.team1 : finalMatch.team2;
            cupState.bracket.winner = champion;
            cupState.round = 1;
            cupState.isFinished = true;
        }
    }
    saveCupState();
}

// 3. 컵 탭 로드 시 렌더링 호출
function initCupTab() {
    // 컵 탈락 복구 체크 먼저 실행
    checkAndRecoverEliminatedCup();

    const seasonText = document.getElementById('cupSeasonYearText');
    if (seasonText) {
        seasonText.textContent = `${cupState.year} 코리아컵`;
    }
    
    const roundValText = document.getElementById('cupRoundVal');
    if (roundValText) {
        roundValText.textContent = getCupRoundText(cupState.round);
    }

    updatePlayerTeamOvr();
    updateCupScoreboard();
    renderCupBracket();
    renderCupStats();
}

// 4. 플레이어 팀 및 K1 상대팀 OVR 최신 동기화
function updatePlayerTeamOvr() {
    const playerOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    
    // 1. cupState.teams 동기화
    cupState.teams.forEach(team => {
        if (team.id === 'jeonbuk') {
            team.rating = playerOvr;
        } else if (!["suwon_samsung", "daegu_fc", "busan_ipark", "seoul_e_land"].includes(team.id)) {
            // K1 팀인 경우 리그의 최신 OVR로 동기화
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
        cupState.bracket[roundKey].forEach(match => {
            if (match.team1) {
                if (match.team1.id === 'jeonbuk') {
                    match.team1.rating = playerOvr;
                } else if (!["suwon_samsung", "daegu_fc", "busan_ipark", "seoul_e_land"].includes(match.team1.id)) {
                    if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                        const leagueTeam = leagueTeams.find(t => t.id === match.team1.id);
                        if (leagueTeam && leagueTeam.rating !== undefined) {
                            match.team1.rating = leagueTeam.rating;
                        }
                    }
                }
            }
            if (match.team2) {
                if (match.team2.id === 'jeonbuk') {
                    match.team2.rating = playerOvr;
                } else if (!["suwon_samsung", "daegu_fc", "busan_ipark", "seoul_e_land"].includes(match.team2.id)) {
                    if (typeof leagueTeams !== 'undefined' && Array.isArray(leagueTeams)) {
                        const leagueTeam = leagueTeams.find(t => t.id === match.team2.id);
                        if (leagueTeam && leagueTeam.rating !== undefined) {
                            match.team2.rating = leagueTeam.rating;
                        }
                    }
                }
            }
        });
    });
    
    saveCupState();
}

// 5. 스코어보드 정보 업데이트
function updateCupScoreboard() {
    if (cupState.isFinished) {
        const winner = cupState.bracket.winner || { name: '전북 현대', rating: 75 };
        const isPlayerWinner = winner.id === 'jeonbuk';
        
        document.getElementById('cupRoundVal').textContent = "대회 종료";
        document.getElementById('cupHomeTeamName').textContent = winner.name;
        document.getElementById('cupAwayTeamName').textContent = isPlayerWinner ? "우승 달성!" : "우승 차지!";
        document.getElementById('cupHomeTeamOvr').textContent = winner.rating;
        document.getElementById('cupAwayTeamOvr').textContent = "-";
        document.getElementById('cupHomeScore').textContent = "🏆";
        document.getElementById('cupAwayScore').textContent = "";
        document.getElementById('cupSbTimeDisplay').textContent = "FINISH";
        document.getElementById('cupSbTimeDisplay').classList.remove('live-ticking');
        document.getElementById('cupMatchVenueDisplay').textContent = isPlayerWinner 
            ? "코리아컵 시즌이 완료되었습니다. 축하합니다!" 
            : `코리아컵 시즌이 완료되었습니다. (${winner.name} 우승)`;
        
        const btn = document.getElementById('btnStartCupMatch');
        if (btn) {
            btn.disabled = true;
            if (isPlayerWinner) {
                btn.innerHTML = `<i class="fa-solid fa-trophy" style="margin-right: 8px;"></i>코리아컵 우승 완료`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락 (대회 종료)`;
            }
        }
        return;
    }

    const curRound = cupState.round;
    const matches = cupState.bracket[curRound];
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));

    const btn = document.getElementById('btnStartCupMatch');
    const timeDisplay = document.getElementById('cupSbTimeDisplay');

    if (!playerMatch) {
        document.getElementById('cupHomeTeamName').textContent = "전북 현대";
        document.getElementById('cupAwayTeamName').textContent = "토너먼트 탈락";
        document.getElementById('cupHomeTeamOvr').textContent = "-";
        document.getElementById('cupAwayTeamOvr').textContent = "-";
        document.getElementById('cupHomeScore').textContent = "L";
        document.getElementById('cupAwayScore').textContent = "O";
        if (timeDisplay) {
            timeDisplay.textContent = "OUT";
            timeDisplay.classList.remove('live-ticking');
        }
        document.getElementById('cupMatchVenueDisplay').textContent = "전북 현대가 탈락했습니다.";
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락`;
        }
        return;
    }

    const t1 = playerMatch.team1;
    const t2 = playerMatch.team2;

    document.getElementById('cupHomeTeamName').textContent = t1.name;
    document.getElementById('cupAwayTeamName').textContent = t2.name;
    document.getElementById('cupHomeTeamOvr').textContent = t1.rating;
    document.getElementById('cupAwayTeamOvr').textContent = t2.rating;
    
    if (playerMatch.status === 'completed') {
        let score1Str = playerMatch.score1;
        let score2Str = playerMatch.score2;
        if (playerMatch.pkScore1 !== undefined && playerMatch.pkScore2 !== undefined) {
            score1Str += ` (${playerMatch.pkScore1})`;
            score2Str += ` (${playerMatch.pkScore2})`;
        }
        document.getElementById('cupHomeScore').textContent = score1Str;
        document.getElementById('cupAwayScore').textContent = score2Str;
        
        if (timeDisplay) {
            timeDisplay.textContent = '종료';
            timeDisplay.classList.remove('live-ticking');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-forward" style="margin-right: 8px;"></i>다음 라운드 진출 확정`;
        }
    } else {
        document.getElementById('cupHomeScore').textContent = "0";
        document.getElementById('cupAwayScore').textContent = "0";
        if (timeDisplay) {
            timeDisplay.textContent = 'CUP VS';
            timeDisplay.classList.remove('live-ticking');
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i>코리아컵 경기 시작 (10초 소요)`;
        }
    }

    const homeEmblemEl = document.getElementById('cupHomeEmblem');
    const awayEmblemEl = document.getElementById('cupAwayEmblem');
    if (homeEmblemEl) homeEmblemEl.innerHTML = getCupTeamEmblemHtml(t1, 36);
    if (awayEmblemEl) awayEmblemEl.innerHTML = getCupTeamEmblemHtml(t2, 36);
    
    document.getElementById('cupMatchVenueDisplay').textContent = `${getCupRoundText(curRound)} 단판 승부 (중립 구장)`;
}

// 6. 대진표 (Bracket Tree) 렌더링 함수
function renderCupBracket() {
    const container = document.getElementById('cupBracketContainer');
    if (!container) return;

    let html = '';

    // 16강전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title">16강전</div>
        <div class="bracket-match-list">`;
    cupState.bracket[16].forEach(match => {
        html += renderCupMatchNode(match, 16);
    });
    html += `</div></div>`;

    // 8강전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title">8강전</div>
        <div class="bracket-match-list">`;
    cupState.bracket[8].forEach(match => {
        html += renderCupMatchNode(match, 8);
    });
    html += `</div></div>`;

    // 준결승전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title">준결승</div>
        <div class="bracket-match-list">`;
    cupState.bracket[4].forEach(match => {
        html += renderCupMatchNode(match, 4);
    });
    html += `</div></div>`;

    // 결승전 컬럼
    html += `<div class="bracket-round">
        <div class="bracket-round-title">결승전</div>
        <div class="bracket-match-list">`;
    cupState.bracket[2].forEach(match => {
        html += renderCupMatchNode(match, 2);
    });
    html += `</div></div>`;

    // 우승팀 정보 컬럼
    html += `<div class="bracket-round" style="justify-content: center; align-items: center; min-width: 150px;">
        <div class="bracket-round-title" style="width: 100%;">우승팀</div>`;
    if (cupState.bracket.winner) {
        html += `
        <div class="bracket-winner-node">
            <div class="bracket-winner-title"><i class="fa-solid fa-trophy"></i> CHAMPION</div>
            <div class="bracket-winner-name">
                ${getCupTeamEmblemHtml(cupState.bracket.winner, 20)}
                <span style="margin-left: 4px;">${cupState.bracket.winner.name}</span>
            </div>
        </div>`;
    } else {
        html += `
        <div class="bracket-winner-node" style="opacity: 0.5; border-style: dashed; background: transparent; box-shadow: none; animation: none;">
            <div class="bracket-winner-title">CHAMPION</div>
            <div class="bracket-winner-name" style="color: var(--text-muted);">대기 중</div>
        </div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
}

// 개별 경기 노드 그리기 헬퍼
function renderCupMatchNode(match, round) {
    const isPlayerMatch = (match.team1 && match.team1.id === 'jeonbuk') || (match.team2 && match.team2.id === 'jeonbuk');
    const isActive = (cupState.round === round && isPlayerMatch && match.status !== 'completed');
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
                    ${getCupTeamEmblemHtml(match.team1, 14)}
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
                    ${getCupTeamEmblemHtml(match.team2, 14)}
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

    return `
        <div class="bracket-match ${activeClass}">
            ${t1Html}
            ${t2Html}
        </div>
    `;
}

// 팀 엠블럼 HTML 헬퍼 (K1 SVG/PNG 매핑 + K2 컬러 쉴드 아이콘 분기)
function getCupTeamEmblemHtml(team, size = 18) {
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
        return `<img src="${k1Mapping[team.id]}" alt="${team.name}" style="height: ${size}px; width: ${size}px; object-fit: contain; vertical-align: middle; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">`;
    } else {
        let color = '#94a3b8';
        if (team.id === 'suwon_samsung') color = '#2563eb'; // 수원 블루
        else if (team.id === 'daegu_fc') color = '#38bdf8'; // 대구 하늘
        else if (team.id === 'busan_ipark') color = '#dc2626'; // 부산 빨강
        else if (team.id === 'seoul_e_land') color = '#d97706'; // 서울E 금빛/남색 계열 대체
        
        return `<i class="fa-solid fa-shield-halved" style="color: ${color}; font-size: ${size - 2}px; width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));"></i>`;
    }
}

// 7. 득점/도움 순위판 렌더링
function renderCupStats() {
    const goalsBody = document.getElementById('cupGoalsBody');
    const assistsBody = document.getElementById('cupAssistsBody');
    if (!goalsBody || !assistsBody) return;

    goalsBody.innerHTML = '';
    cupState.stats.scorers.slice(0, 5).forEach((p, idx) => {
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

    assistsBody.innerHTML = '';
    cupState.stats.assisters.slice(0, 5).forEach((p, idx) => {
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

// 8. 코리아컵 경기 시뮬레이터 (10초 단판 라이브 텍스트 중계)
function startCupMatchSimulation() {
    if (cupState.isFinished) {
        alert("이미 이번 시즌 코리아컵이 종료되었습니다.");
        return;
    }

    const curRound = cupState.round;
    const matches = cupState.bracket[curRound];
    
    const playerMatch = matches.find(m => (m.team1 && m.team1.id === 'jeonbuk') || (m.team2 && m.team2.id === 'jeonbuk'));
    if (!playerMatch) {
        alert("플레이어 매치를 찾을 수 없습니다. 이미 탈락하셨거나 오류가 발생했습니다.");
        return;
    }

    if (playerMatch.status === 'completed') {
        advanceCupRound();
        initCupTab();
        return;
    }

    const btn = document.getElementById('btnStartCupMatch');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>경기 중계 중...`;
    }

    const commBox = document.getElementById('cupCommentaryScroll');
    if (commBox) commBox.innerHTML = '';

    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    if (typeof playMatchStartSound === 'function') {
        try { playMatchStartSound(); } catch (e) {}
    }

    const timeDisplay = document.getElementById('cupSbTimeDisplay');
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

    // 실제 전북 현대 스쿼드 OVR 및 전술 보너스 연산
    let playerOvr = (typeof getPlayerPureOvr === 'function') ? getPlayerPureOvr() : 70;
    let formationBonus = 0;
    
    if (typeof currentFormation !== 'undefined' && currentFormation !== '4-4-2') {
        let hasKeyPlayer = false;
        let hasTeamTactic = false;
        
        if (currentFormation === '4-3-3') {
            const cmCardId = squadFormation['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.pas >= 80;
            hasTeamTactic = getTeamAverageStat('pas') >= 70;
        } else if (currentFormation === '3-4-3') {
            const cmCardId = squadFormation['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
            hasTeamTactic = getTeamAverageStat('dri') >= 70;
        } else if (currentFormation === '5-4-1') {
            const lwCardId = squadFormation['LW'];
            const rwCardId = squadFormation['RW'];
            if (lwCardId && getAwakenedCard(lwCardId).stats && getAwakenedCard(lwCardId).stats.pac >= 80) hasKeyPlayer = true;
            if (rwCardId && getAwakenedCard(rwCardId).stats && getAwakenedCard(rwCardId).stats.pac >= 80) hasKeyPlayer = true;
            hasTeamTactic = getTeamAverageStat('def') >= 60;
        } else if (currentFormation === '4-2-3-1') {
            const cmCardId = squadFormation['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
            hasTeamTactic = getTeamAverageStat('dri') >= 70;
        }
        
        if (hasKeyPlayer) formationBonus += 1;
        if (hasTeamTactic) formationBonus += 1;
    }
    playerOvr += formationBonus;

    let formationAttackBoost = 0;
    let formationScoreBoost = 0;
    let formationTacticDetailsHtml = "";
    
    if (currentFormation === '4-3-3') {
        const cmCardId = squadFormation['CM'];
        if (cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.pas >= 80 && getTeamAverageStat('pas') >= 70) {
            const cmPas = getAwakenedCard(cmCardId).stats.pas;
            formationAttackBoost = (cmPas - 80) * 0.005;
            formationTacticDetailsHtml = `⚽ <strong>[4-3-3 빌드업 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId).name})의 패스 능력치(${cmPas}) 비례 공격권 획득 확률 <span style="color:#ffd700; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '3-4-3') {
        const cmCardId = squadFormation['CM'];
        if (cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80 && getTeamAverageStat('dri') >= 70) {
            const cmDri = getAwakenedCard(cmCardId).stats.dri;
            formationAttackBoost = (cmDri - 80) * 0.005;
            formationTacticDetailsHtml = `🌀 <strong>[3-4-3 스위칭 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00ff87; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '5-4-1') {
        const lwCardId = squadFormation['LW'];
        const rwCardId = squadFormation['RW'];
        let hasKeyPlayer = false;
        let lwPac = 0;
        let rwPac = 0;
        if (lwCardId) {
            const card = getAwakenedCard(lwCardId);
            if (card && card.stats && card.stats.pac >= 80) { hasKeyPlayer = true; lwPac = card.stats.pac; }
        }
        if (rwCardId) {
            const card = getAwakenedCard(rwCardId);
            if (card && card.stats && card.stats.pac >= 80) { hasKeyPlayer = true; rwPac = card.stats.pac; }
        }
        if (hasKeyPlayer && getTeamAverageStat('def') >= 60) {
            const bestPac = Math.max(lwPac, rwPac);
            formationScoreBoost = (bestPac - 80) * 0.005;
            formationTacticDetailsHtml = `⚡ <strong>[5-4-1 역습 완성]</strong> 에이스 윙어 최고속도(${bestPac}) 비례 득점 성공 확률 <span style="color:#ff3e6c; font-weight:800;">+${(formationScoreBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    } else if (currentFormation === '4-2-3-1') {
        const cmCardId = squadFormation['CM'];
        if (cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80 && getTeamAverageStat('dri') >= 70) {
            const cmDri = getAwakenedCard(cmCardId).stats.dri;
            formationAttackBoost = (cmDri - 80) * 0.005;
            formationTacticDetailsHtml = `⚽ <strong>[4-2-3-1 점유율 완성]</strong> 핵심 AM(${getAwakenedCard(cmCardId).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00d2fc; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
        }
    }

    let detailedTacticBonus = 0;
    let suitabilityBonus = 0;
    let detailedTacticLabel = "";
    let suitabilityLabel = "";
    
    if (currentFormation === '4-3-3') {
        const stCardId = squadFormation['ST'];
        if (stCardId && getAwakenedCard(stCardId).stats && getAwakenedCard(stCardId).stats.phy >= 80) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 타겟맨 활성 (+5.0%)]`;
        }
        suitabilityBonus = Math.max(0, (getTeamAverageStat('pas') - 70) * 0.01);
        if (suitabilityBonus > 0) suitabilityLabel = ` [전술적합(PAS): +${(suitabilityBonus * 100).toFixed(1)}%]`;
    } else if (currentFormation === '3-4-3') {
        let fastAttackersCount = 0;
        ["LW", "ST", "RW"].forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pac >= 90) fastAttackersCount++;
        });
        if (fastAttackersCount >= 2) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 전방압박 활성 (+5.0%)]`;
        }
        suitabilityBonus = Math.max(0, (getTeamAverageStat('dri') - 70) * 0.01);
        if (suitabilityBonus > 0) suitabilityLabel = ` [전술적합(DRI): +${(suitabilityBonus * 100).toFixed(1)}%]`;
    } else if (currentFormation === '5-4-1') {
        let passDefendersCount = 0;
        ["LB", "LCB", "CM", "RCB", "RB"].forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && CARDS_DATABASE[cardId]) {
                const card = getAwakenedCard(cardId);
                if (['CB', 'LB', 'RB'].includes(card.position) && card.stats && card.stats.pas >= 80) passDefendersCount++;
            }
        });
        if (passDefendersCount >= 1) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 다이렉트 패스 활성 (+5.0%)]`;
        }
        suitabilityBonus = Math.max(0, (getTeamAverageStat('def') - 60) * 0.01);
        if (suitabilityBonus > 0) suitabilityLabel = ` [전술적합(DEF): +${(suitabilityBonus * 100).toFixed(1)}%]`;
    } else if (currentFormation === '4-2-3-1') {
        let passMidfieldersCount = 0;
        ["LCM", "CM", "RCM"].forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pas >= 83) passMidfieldersCount++;
        });
        if (passMidfieldersCount === 3) {
            detailedTacticBonus = 0.05;
            detailedTacticLabel = ` [세부전술: 티키타카 활성 (+5.0%)]`;
        }
        suitabilityBonus = Math.max(0, (getTeamAverageStat('dri') - 70) * 0.01);
        if (suitabilityBonus > 0) suitabilityLabel = ` [전술적합(DRI): +${(suitabilityBonus * 100).toFixed(1)}%]`;
    }

    const isHome = playerMatch.team1.id === 'jeonbuk';
    const opponent = isHome ? playerMatch.team2 : playerMatch.team1;
    const diff = playerOvr - opponent.rating;
    
    const maxProb = 0.80;
    const minProb = 0.20;
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
    let activeDiff = diff;
    let activePlayerAttackProb = playerAttackProb;

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
        playerAttackProb: playerAttackProb
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
                // 특별 돌발 변수 체크
                const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
                const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
                
                if (specialEvent) {
                    addCommentary(currentMin, specialEvent.eventDesc, 'system');
                    if (specialEvent.type === "pk_player") {
                        const isGoal = specialEvent.isGoal;
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(1); // PK는 보통 ST가 키커
                            addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "pk_opponent") {
                        const isGoal = specialEvent.isGoal;
                        if (isGoal) {
                            opponentScoreVal++;
                            addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                            addCommentary(currentMin, specialEvent.eventGoal, 'normal');
                        } else {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }
                    } else if (specialEvent.type === "red_opponent") {
                        activeDiff += specialEvent.ovrChange; // +5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    } else if (specialEvent.type === "red_player") {
                        activeDiff += specialEvent.ovrChange; // -5
                        activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
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
                            if (lwCardId && CARDS_DATABASE[lwCardId]) chancePlayerStat = Math.round(((getAwakenedCard(lwCardId).stats.dri || 75) + (getAwakenedCard(lwCardId).stats.sho || 75)) / 2);
                        } else if (selectedOption === 1) {
                            const stCardId = squadFormation['ST'];
                            if (stCardId && CARDS_DATABASE[stCardId]) chancePlayerStat = getAwakenedCard(stCardId).stats.sho || 75;
                        } else if (selectedOption === 2) {
                            const rwCardId = squadFormation['RW'];
                            if (rwCardId && CARDS_DATABASE[rwCardId]) chancePlayerStat = Math.round(((getAwakenedCard(rwCardId).stats.pac || 75) + (getAwakenedCard(rwCardId).stats.sho || 75)) / 2);
                        } else if (selectedOption === 5) {
                            const cmCardId = squadFormation['CM'];
                            if (cmCardId && CARDS_DATABASE[cmCardId]) chancePlayerStat = getAwakenedCard(cmCardId).stats.dri || 75;
                        }
                        
                        const playerChanceBonus = (chancePlayerStat - opponent.rating) * 0.01;
                        const scoreProb = Math.min(0.60, Math.max(0.10, 0.20 + (activeDiff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                        const isGoal = Math.random() < scoreProb;
                        
                        const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                        const isTacticActive = detailedTacticBonus > 0;
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers);
                        
                        addCommentary(currentMin, eventDesc, 'attack');
                        
                        if (isGoal) {
                            playerScoreVal++;
                            const goalData = determineScorerAndAssister(selectedOption);
                            addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
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
                        
                        const oppChanceBonus = (opponent.rating - playerGkStat) * 0.01;
                        const oppScoreProb = Math.min(0.90, Math.max(0.08, 0.35 - (activeDiff * 0.026) + oppChanceBonus));
                        const isGoal = Math.random() < oppScoreProb;
                        
                        addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                        
                        if (isGoal) {
                            opponentScoreVal++;
                            addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commentaryData, false), 'normal');
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
            document.getElementById('cupHomeScore').innerText = playerScoreVal;
            document.getElementById('cupAwayScore').innerText = opponentScoreVal;
        } else {
            document.getElementById('cupHomeScore').innerText = opponentScoreVal;
            document.getElementById('cupAwayScore').innerText = playerScoreVal;
        }

        commentaryData.playerScoreVal = isHome ? playerScoreVal : opponentScoreVal;
        commentaryData.opponentScoreVal = isHome ? opponentScoreVal : playerScoreVal;
        addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'system');

        if (playerScoreVal === opponentScoreVal) {
            addCommentary('SYSTEM', "⚖️ 정규 시간 90분 무승부! 토너먼트 규정에 따라 연장전으로 돌입합니다.", "system");
            runActualCupExtraTime(playerScoreVal, opponentScoreVal, playerMatch, playerOvr, opponent.rating, playerScorerName, playerAssisterName, isHome);
        } else {
            finalizeCupMatch(isHome ? playerScoreVal : opponentScoreVal, isHome ? opponentScoreVal : playerScoreVal, playerMatch);
        }
        return;
    }

    const matchTimer = setInterval(() => {
        const currentMin = matchMinutes[tickIdx];
        if (timeDisplay) timeDisplay.textContent = `${currentMin}'`;

        if (currentMin === 0) {
            addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false), 'normal');
        } else if (eventMins.includes(currentMin)) {
            // 특별 돌발 변수 체크
            const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: commentaryData.activeGk };
            const specialEvent = rollSpecialMatchEvent(activePlayers, opponent.name);
            
            if (specialEvent) {
                addCommentary(currentMin, specialEvent.eventDesc, 'system');
                if (specialEvent.type === "pk_player") {
                    const isGoal = specialEvent.isGoal;
                    if (isGoal) {
                        playerScoreVal++;
                        if (isHome) {
                            document.getElementById('cupHomeScore').innerText = playerScoreVal;
                        } else {
                            document.getElementById('cupAwayScore').innerText = playerScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        
                        const goalData = determineScorerAndAssister(1); // PK는 보통 ST가 키커
                        addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        }, 400);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }, 400);
                    }
                } else if (specialEvent.type === "pk_opponent") {
                    const isGoal = specialEvent.isGoal;
                    if (isGoal) {
                        opponentScoreVal++;
                        if (isHome) {
                            document.getElementById('cupAwayScore').innerText = opponentScoreVal;
                        } else {
                            document.getElementById('cupHomeScore').innerText = opponentScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventGoal, 'normal');
                        }, 400);
                    } else {
                        setTimeout(() => {
                            addCommentary(currentMin, specialEvent.eventFail, 'normal');
                        }, 400);
                    }
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange; // +5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
                    setTimeout(() => {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }, 400);
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange; // -5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus));
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
                        if (lwCardId && CARDS_DATABASE[lwCardId]) chancePlayerStat = Math.round(((getAwakenedCard(lwCardId).stats.dri || 75) + (getAwakenedCard(lwCardId).stats.sho || 75)) / 2);
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId]) chancePlayerStat = getAwakenedCard(stCardId).stats.sho || 75;
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId]) chancePlayerStat = Math.round(((getAwakenedCard(rwCardId).stats.pac || 75) + (getAwakenedCard(rwCardId).stats.sho || 75)) / 2);
                    } else if (selectedOption === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) chancePlayerStat = getAwakenedCard(cmCardId).stats.dri || 75;
                    }
                    
                    const playerChanceBonus = (chancePlayerStat - opponent.rating) * 0.01;
                    const scoreProb = Math.min(0.60, Math.max(0.10, 0.20 + (activeDiff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus));
                    const isGoal = Math.random() < scoreProb;
                    
                    const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName };
                    const isTacticActive = detailedTacticBonus > 0;
                    const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers);
                    
                    addCommentary(currentMin, eventDesc, 'attack');
                    
                    if (isGoal) {
                        playerScoreVal++;
                        if (isHome) {
                            document.getElementById('cupHomeScore').innerText = playerScoreVal;
                        } else {
                            document.getElementById('cupAwayScore').innerText = playerScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        
                        const goalData = determineScorerAndAssister(selectedOption);
                        addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, goalData.scorerName, goalData.assisterName);
                        
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
                    
                    const oppChanceBonus = (opponent.rating - playerGkStat) * 0.01;
                    const oppScoreProb = Math.min(0.90, Math.max(0.08, 0.35 - (activeDiff * 0.026) + oppChanceBonus));
                    const isGoal = Math.random() < oppScoreProb;
                    
                    addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                    
                    if (isGoal) {
                        opponentScoreVal++;
                        if (isHome) {
                            document.getElementById('cupAwayScore').innerText = opponentScoreVal;
                        } else {
                            document.getElementById('cupHomeScore').innerText = opponentScoreVal;
                        }
                        if (typeof playGoalSound === 'function') {
                            try { playGoalSound(); } catch (e) {}
                        }
                        addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                        
                        setTimeout(() => {
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', commentaryData, false), 'normal');
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
                    runActualCupExtraTime(playerScoreVal, opponentScoreVal, playerMatch, playerOvr, opponent.rating, playerScorerName, playerAssisterName, isHome);
                }, 1200);
            } else {
                finalizeCupMatch(isHome ? playerScoreVal : opponentScoreVal, isHome ? opponentScoreVal : playerScoreVal, playerMatch);
            }
        }
    }, 1000);
}

function playerLwName() {
    return (squadFormation["LW"] && CARDS_DATABASE[squadFormation["LW"]]) ? CARDS_DATABASE[squadFormation["LW"]].name : "무명 윙어";
}
function playerRwName() {
    return (squadFormation["RW"] && CARDS_DATABASE[squadFormation["RW"]]) ? CARDS_DATABASE[squadFormation["RW"]].name : "무명 윙백";
}

function runActualCupExtraTime(score1, score2, playerMatch, playerOvr, opponentOvr, playerScorerName, playerAssisterName, isHome) {
    const timeDisplay = document.getElementById('cupSbTimeDisplay');
    const commBox = document.getElementById('cupCommentaryScroll');
    
    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
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
        team1Name: isHome ? "전북 현대" : playerMatch.team1.name,
        team2Name: isHome ? playerMatch.team2.name : "전북 현대",
        rating1: isHome ? playerOvr : playerMatch.team1.rating,
        rating2: isHome ? playerMatch.team2.rating : playerOvr,
        score1: isHome ? score1 : score2,
        score2: isHome ? score2 : score1,
        playerScorerName: activeScorerName,
        playerAssisterName: activeAssisterName,
        isTeam1Jeonbuk: isHome
    };

    const etResult = simulateExtraTimeEngine(etData);
    
    if (isDeveloperMode) {
        if (timeDisplay) {
            timeDisplay.innerText = "종료";
            timeDisplay.classList.remove('live-ticking');
        }
        
        etResult.events.forEach(ev => {
            if (ev.type === 'goal') {
                document.getElementById('cupHomeScore').innerText = ev.score1;
                document.getElementById('cupAwayScore').innerText = ev.score2;
                
                const isGoalByPlayer = (ev.side === 'team1' && isHome) || (ev.side === 'team2' && !isHome);
                if (isGoalByPlayer) {
                    addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, activeScorerName, activeAssisterName);
                } else {
                    addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                }
            }
            addCommentary(ev.min, ev.text, ev.type);
        });

        if (etResult.score1 === etResult.score2) {
            addCommentary('SYSTEM', "⚖️ 연장 120분 혈투 끝에도 승부가 나지 않았습니다! 최후의 승부차기로 돌입합니다.", "system");
            runActualCupPenaltyShootout(etResult.score1, etResult.score2, playerMatch, playerOvr, opponentOvr, isHome);
        } else {
            finalizeCupMatch(etResult.score1, etResult.score2, playerMatch);
        }
        return;
    }

    let etTick = 0;
    const etTimer = setInterval(() => {
        if (etTick < etResult.events.length) {
            const ev = etResult.events[etTick];
            if (timeDisplay) timeDisplay.innerText = ev.min;
            
            if (ev.type === 'goal') {
                if (typeof playGoalSound === 'function') {
                    try { playGoalSound(); } catch (e) {}
                }
                document.getElementById('cupHomeScore').innerText = ev.score1;
                document.getElementById('cupAwayScore').innerText = ev.score2;
                
                const isGoalByPlayer = (ev.side === 'team1' && isHome) || (ev.side === 'team2' && !isHome);
                if (isGoalByPlayer) {
                    addPlayerStatRecord(isHome ? playerMatch.team1 : playerMatch.team2, activeScorerName, activeAssisterName);
                } else {
                    addPlayerStatRecord(isHome ? playerMatch.team2 : playerMatch.team1, null, null);
                }
            }
            
            addCommentary(ev.min, ev.text, ev.type);
            etTick++;
        } else {
            clearInterval(etTimer);
            
            if (etResult.score1 === etResult.score2) {
                addCommentary('SYSTEM', "⚖️ 연장 120분 혈투 끝에도 승부가 나지 않았습니다! 최후의 승부차기로 돌입합니다.", "system");
                setTimeout(() => {
                    runActualCupPenaltyShootout(etResult.score1, etResult.score2, playerMatch, playerOvr, opponentOvr, isHome);
                }, 1200);
            } else {
                finalizeCupMatch(etResult.score1, etResult.score2, playerMatch);
            }
        }
    }, 1000);
}

function runActualCupPenaltyShootout(etScore1, etScore2, playerMatch, playerOvr, opponentOvr, isHome) {
    const timeDisplay = document.getElementById('cupSbTimeDisplay');
    const commBox = document.getElementById('cupCommentaryScroll');
    
    if (timeDisplay) {
        timeDisplay.textContent = "PK";
        timeDisplay.classList.remove('live-ticking');
    }

    const addCommentary = (min, text, type = 'normal') => {
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK') ? '' : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        if (commBox) {
            commBox.appendChild(item);
            commBox.scrollTop = commBox.scrollHeight;
        }
    };

    const pkData = {
        team1Name: isHome ? "전북 현대" : playerMatch.team1.name,
        team2Name: isHome ? playerMatch.team2.name : "전북 현대",
        rating1: isHome ? playerOvr : playerMatch.team1.rating,
        rating2: isHome ? playerMatch.team2.rating : playerOvr,
        isTeam1Jeonbuk: isHome
    };

    const pkResult = simulatePenaltyShootoutEngine(pkData);
    
    if (isDeveloperMode) {
        pkResult.events.forEach(ev => {
            if (ev.round > 0) {
                document.getElementById('cupHomeScore').innerText = `${etScore1} (${ev.score1})`;
                document.getElementById('cupAwayScore').innerText = `${etScore2} (${ev.score2})`;
            }
            addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? 'goal' : 'normal');
        });
        
        finalizeCupMatch(etScore1, etScore2, playerMatch, pkResult.pkScore1, pkResult.pkScore2);
        return;
    }

    let pkTick = 0;
    const pkTimer = setInterval(() => {
        if (pkTick < pkResult.events.length) {
            const ev = pkResult.events[pkTick];
            
            if (ev.round > 0) {
                if (ev.success && typeof playGoalSound === 'function') {
                    try { playGoalSound(); } catch (e) {}
                }
                document.getElementById('cupHomeScore').innerText = `${etScore1} (${ev.score1})`;
                document.getElementById('cupAwayScore').innerText = `${etScore2} (${ev.score2})`;
            }
            
            addCommentary(ev.round === 0 ? 'PK' : `PK ${ev.round}`, ev.text, ev.success ? 'goal' : 'normal');
            pkTick++;
        } else {
            clearInterval(pkTimer);
            finalizeCupMatch(etScore1, etScore2, playerMatch, pkResult.pkScore1, pkResult.pkScore2);
        }
    }, 1200);
}

// 득점/도움 순위 가상 스코어링 누적 함수
function addPlayerStatRecord(team, scorerName, assisterName) {
    if (!team) return;
    
    const isPlayer = team.id === 'jeonbuk';
    const sName = isPlayer ? (scorerName || "무명 선수") : `${team.name} 에이스`;
    const existScorer = cupState.stats.scorers.find(s => s.name === sName && s.teamId === team.id);
    if (existScorer) {
        existScorer.goals += 1;
    } else {
        cupState.stats.scorers.push({ name: sName, teamName: team.name, goals: 1, teamId: team.id });
    }

    if (isPlayer) {
        if (assisterName) {
            const existAssister = cupState.stats.assisters.find(a => a.name === assisterName && a.teamId === team.id);
            if (existAssister) {
                existAssister.assists += 1;
            } else {
                cupState.stats.assisters.push({ name: assisterName, teamName: team.name, assists: 1, teamId: team.id });
            }
        }
    } else {
        // AI 팀은 기존처럼 50% 확률로 도움자를 임의 적립
        if (Math.random() < 0.5) {
            const aName = `${team.name} 에이스`;
            const existAssister = cupState.stats.assisters.find(a => a.name === aName && a.teamId === team.id);
            if (existAssister) {
                existAssister.assists += 1;
            } else {
                cupState.stats.assisters.push({ name: aName, teamName: team.name, assists: 1, teamId: team.id });
            }
        }
    }
}

// 경기 종료 처리
function finalizeCupMatch(score1, score2, playerMatch, pkScore1 = undefined, pkScore2 = undefined) {
    const timeDisplay = document.getElementById('cupSbTimeDisplay');
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

    const btn = document.getElementById('btnStartCupMatch');
    const commBox = document.getElementById('cupCommentaryScroll');
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
        
        addCommentary("종료", `[승리] 최종 스코어 ${scoreDisplayStr}로 전북 현대가 다음 토너먼트 라운드로 진출합니다!`, "goal");
        showToast(`승리했습니다! 전북 현대가 코리아컵 다음 라운드에 진출합니다.`);

        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-forward" style="margin-right: 8px;"></i>다음 라운드 대진표 갱신`;
        }
    } else {
        if (typeof playDefeatSound === 'function') {
            try { playDefeatSound(); } catch (e) {}
        }
        
        let scoreDisplayStr = `${score1} : ${score2}`;
        if (pkScore1 !== undefined) scoreDisplayStr += ` (PK ${pkScore1} : ${pkScore2})`;

        addCommentary("종료", `[패배] 최종 스코어 ${scoreDisplayStr}로 전북 현대의 코리아컵 여정이 여기서 멈춥니다.`, "system");
        
        let rewardPoints = 0;
        let rewardText = "";
        
        if (cupState.round === 4) {
            rewardPoints = 5;
            rewardText = "4강 진출 보상 5 FP를 획득했습니다!";
        } else if (cupState.round === 2) {
            rewardPoints = 10;
            rewardText = "결승 준우승 보상 10 FP를 획득했습니다!";
        }

        if (rewardPoints > 0) {
            userPoints += rewardPoints;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            if (typeof renderUserPoints === 'function') renderUserPoints();
            showToast(`아쉽게 패배하여 탈락했습니다. 하지만 ${rewardText}`);
        } else {
            showToast(`패배하여 탈락했습니다. (16강/8강 탈락은 보상이 없습니다)`);
        }
        
        // 플레이어 탈락 시 남은 대회 자동 시뮬레이션 완료 처리
        simulateRemainingCupRounds();
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>토너먼트 탈락 (대회 종료)`;
        }
    }

    cupState.stats.scorers.sort((a, b) => b.goals - a.goals);
    cupState.stats.assisters.sort((a, b) => b.assists - a.assists);

    saveCupState();
    renderCupBracket();
    renderCupStats();
}

// 다음 라운드 대진표 및 진출 팀 갱신
function advanceCupRound() {
    const curRound = cupState.round;

    simulateCupAiMatches(curRound);

    if (curRound === 16) {
        const matches16 = cupState.bracket[16];
        const matches8 = cupState.bracket[8];
        
        for (let i = 0; i < 4; i++) {
            const m1 = matches16[i * 2];
            const m2 = matches16[i * 2 + 1];
            
            matches8[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
            matches8[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
            matches8[i].status = "scheduled";
        }
        cupState.round = 8;
    } else if (curRound === 8) {
        const matches8 = cupState.bracket[8];
        const matches4 = cupState.bracket[4];
        
        for (let i = 0; i < 2; i++) {
            const m1 = matches8[i * 2];
            const m2 = matches8[i * 2 + 1];
            
            matches4[i].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
            matches4[i].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
            matches4[i].status = "scheduled";
        }
        cupState.round = 4;
    } else if (curRound === 4) {
        const matches4 = cupState.bracket[4];
        const matches2 = cupState.bracket[2];
        
        const m1 = matches4[0];
        const m2 = matches4[1];
        
        matches2[0].team1 = m1.winner === 'team1' ? m1.team1 : m1.team2;
        matches2[0].team2 = m2.winner === 'team1' ? m2.team1 : m2.team2;
        matches2[0].status = "scheduled";
        cupState.round = 2;
    } else if (curRound === 2) {
        const finalMatch = cupState.bracket[2][0];
        const champion = finalMatch.winner === 'team1' ? finalMatch.team1 : finalMatch.team2;
        
        cupState.bracket.winner = champion;
        cupState.round = 1;
        cupState.isFinished = true;

        if (champion.id === 'jeonbuk') {
            userPoints += 10;
            try {
                localStorage.setItem('fc_star_user_points', userPoints.toString());
            } catch(e) {}
            if (typeof renderUserPoints === 'function') renderUserPoints();
            
            setTimeout(() => {
                showCupWinnerCelebrationModal();
            }, 500);
        }
    }

    saveCupState();
}

// 비플레이어 경기 무작위 결과 연산 시뮬레이션
function simulateCupAiMatches(round) {
    const matches = cupState.bracket[round];
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

        addPlayerStatRecord(score1 > score2 ? match.team1 : match.team2, null, null);
    });
}

// 9. 컵 시즌 전체 초기화
function resetCupSeason() {
    if (!confirm("코리아컵 대회를 리셋하고 16강 첫 경기부터 새로 시작하시겠습니까?\n(현재 진행 정보 및 스탯이 모두 초기화됩니다)")) {
        return;
    }
    
    if (typeof playClickSound === 'function') {
        try { playClickSound(); } catch (e) {}
    }

    resetCupStateData();
    initCupTab();
    
    const commBox = document.getElementById('cupCommentaryScroll');
    if (commBox) {
        commBox.innerHTML = '<div class="comm-item comm-system">코리아컵이 리셋되었습니다. 아래 경기 시작 버튼을 클릭하면 16강 대회가 진행됩니다.</div>';
    }
    
    alert("코리아컵이 성공적으로 초기화되었습니다!");
}

// 10. 가상 통계 제너레이터 헬퍼들
function generateMockScorers() {
    return [
        { name: "주민규", teamName: "울산 HD", goals: 4, teamId: "ulsan" },
        { name: "일류첸코", teamName: "FC 서울", goals: 3, teamId: "seoul" },
        { name: "야고", teamName: "강원 FC", goals: 3, teamId: "gangwon" },
        { name: "세징야", teamName: "대구FC", goals: 2, teamId: "daegu_fc" },
        { name: "김신욱", teamName: "인천 유나이티드", goals: 2, teamId: "incheon" }
    ];
}

function generateMockAssisters() {
    return [
        { name: "안데르손", teamName: "FC 서울", assists: 3, teamId: "seoul" },
        { name: "루빅손", teamName: "울산 HD", assists: 2, teamId: "ulsan" },
        { name: "송민규", teamName: "전북 현대", assists: 2, teamId: "jeonbuk" },
        { name: "기성용", teamName: "FC 서울", assists: 2, teamId: "seoul" },
        { name: "아타루", teamName: "울산 HD", assists: 2, teamId: "ulsan" }
    ];
}

// 11. 라운드 정보 텍스트 포맷 헬퍼
function getCupRoundText(round) {
    if (round === 16) return "16강전";
    if (round === 8) return "8강전";
    if (round === 4) return "준결승전";
    if (round === 2) return "결승전";
    if (round === 1) return "대회 완료";
    return "";
}

function getPlayerMatchWinnerScoreString(match) {
    let str = `${match.score1}:${match.score2}`;
    if (match.pkScore1 !== undefined) {
        str += ` (PK ${match.pkScore1}:${match.pkScore2})`;
    }
    return str;
}

// 배열 셔플 헬퍼
function shuffleCupArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 12. 우승 축하 팝업 모달
function showCupWinnerCelebrationModal() {
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
        <div style="text-align: center; max-width: 500px; padding: 2rem; border-radius: 24px; background: radial-gradient(circle at top, rgba(255, 215, 0, 0.15) 0%, rgba(10, 14, 26, 0.95) 100%); border: 2px solid rgba(255, 215, 0, 0.4); box-shadow: 0 0 40px rgba(255, 215, 0, 0.3); animation: matchViewFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="font-size: 5rem; color: #ffd700; filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6)); margin-bottom: 1rem; animation: winnerPulse 2s infinite ease-in-out;">
                <i class="fa-solid fa-trophy"></i>
            </div>
            <h1 style="font-size: 2.2rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; letter-spacing: 1px;">코리아컵 우승!</h1>
            <p style="font-size: 1rem; color: #00d2fc; font-weight: 800; margin-bottom: 1.5rem;">전북 현대가 대한민국 정상에 올랐습니다!</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
                수많은 강팀들을 제치고 이뤄낸 값진 성과입니다.<br>
                선수단과 팬들의 열정적인 응원이 만들어낸 찬란한 우승컵입니다!
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 1rem; border-radius: 14px; width: 100%; margin-bottom: 2rem;">
                <span style="font-size: 0.8rem; color: #ffd700; font-weight: 800;"><i class="fa-solid fa-gift"></i> 우승 보상</span>
                <span style="font-size: 1.2rem; font-weight: 900; color: #fff;">+10 FP (드림 포인트)</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove(); initCupTab();" class="btn-open-pack" style="background: linear-gradient(135deg, #ffd700, #ffa500); color: #080a10; font-weight: 800; font-size: 1rem; padding: 0.8rem 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); border: none; cursor: pointer;">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}
