// ==========================================
// 🏆 CHALLENGE MODE (도전모드 10단계 스테이지 시스템)
// ==========================================

// 10개 스테이지 유럽/세계 명문 구단 프리셋 (Stage 1: OVR 90 ~ Stage 10: OVR 98)
const CHALLENGE_STAGES_PRESET = [
    {
        stage: 1,
        id: "celtic_fc",
        name: "셀틱 FC",
        nation: "Scotland",
        rating: 90,
        bestPlayerName: "후루하시 (ST)",
        activeFormation: "4-3-3",
        initials: "CEL",
        bg: "#016534",
        fg: "#ffffff",
        border: "#fefefe",
        description: "스코틀랜드 최강자 셀틱 FC입니다. 빠른 전방 압박과 기동력 높은 측면 공격이 돋보이는 구단입니다."
    },
    {
        stage: 2,
        id: "afc_ajax",
        name: "아약스",
        nation: "Netherlands",
        rating: 91,
        bestPlayerName: "베르하위스 (RW)",
        activeFormation: "4-3-3",
        initials: "AJX",
        bg: "#d2122e",
        fg: "#ffffff",
        border: "#ffffff",
        description: "네덜란드 전통의 명문 아약스입니다. 유기적인 패스워크와 창의적인 토털 풋볼을 구사합니다."
    },
    {
        stage: 3,
        id: "sl_benfica",
        name: "SL 벤피카",
        nation: "Portugal",
        rating: 92,
        bestPlayerName: "디 마리아 (RW)",
        activeFormation: "4-2-3-1",
        initials: "SLB",
        bg: "#e41b23",
        fg: "#ffffff",
        border: "#ffffff",
        description: "포르투갈의 거함 SL 벤피카입니다. 디 마리아의 노련한 경기 조율과 날카로운 크로스가 위협적입니다."
    },
    {
        stage: 4,
        id: "as_roma",
        name: "AS 로마",
        nation: "Italy",
        rating: 93,
        bestPlayerName: "디발라 (CF)",
        activeFormation: "3-4-2-1",
        initials: "ROM",
        bg: "#8e1f2f",
        fg: "#f0bc42",
        border: "#f0bc42",
        description: "이탈리아 세리에A 명문 AS 로마입니다. 디발라를 중심으로 한 정교한 역습과 단단한 수비 라인을 갖추고 있습니다."
    },
    {
        stage: 5,
        id: "atletico_madrid",
        name: "아틀레티코 마드리드",
        nation: "Spain",
        rating: 94,
        bestPlayerName: "그리즈만 (ST)",
        activeFormation: "5-3-2",
        initials: "ATM",
        bg: "#cb3524",
        fg: "#ffffff",
        border: "#182c54",
        description: "스페인 라리가의 철벽 군단 아틀레티코 마드리드입니다. 그리즈만의 번뜩이는 침투와 견고한 질식 수비가 강점입니다."
    },
    {
        stage: 6,
        id: "arsenal_fc",
        name: "아스날 FC",
        nation: "England",
        rating: 95,
        bestPlayerName: "사카 (RW)",
        activeFormation: "4-3-3",
        initials: "ARS",
        bg: "#ef0107",
        fg: "#ffffff",
        border: "#063672",
        description: "잉글랜드 프리미어리그의 강자 아스날 FC입니다. 사카의 폭발적인 드리블과 높은 템포의 점유율 축구를 선보입니다."
    },
    {
        stage: 7,
        id: "bayern_munich",
        name: "바이에른 뮌헨",
        nation: "Germany",
        rating: 96,
        bestPlayerName: "해리 케인 (ST)",
        activeFormation: "4-2-3-1",
        initials: "FCB",
        bg: "#dc052d",
        fg: "#ffffff",
        border: "#0066b2",
        description: "독일 분데스리가의 절대 강자 바이에른 뮌헨입니다. 세계 최고의 골잡이 해리 케인을 필두로 압도적인 화력을 과시합니다."
    },
    {
        stage: 8,
        id: "man_city",
        name: "맨체스터 시티",
        nation: "England",
        rating: 97,
        bestPlayerName: "엘링 홀란 (ST)",
        activeFormation: "4-3-3",
        initials: "MCI",
        bg: "#6cabdd",
        fg: "#1c2c5b",
        border: "#ffffff",
        description: "세계 최정상 클럽 맨체스터 시티입니다. 괴물 공격수 홀란과 정밀한 패스 네트워크로 상대 진영을 맹폭합니다."
    },
    {
        stage: 9,
        id: "psg",
        name: "파리 생제르맹",
        nation: "France",
        rating: 97,
        bestPlayerName: "뎀벨레 (RW)",
        activeFormation: "4-3-3",
        initials: "PSG",
        bg: "#001c55",
        fg: "#ffffff",
        border: "#da0812",
        description: "프랑스 리그1 챔피언 PSG입니다. 화려한 스타 플레이어 군단과 번개 같은 측면 스피드로 골문을 위협합니다."
    },
    {
        stage: 10,
        id: "real_madrid",
        name: "레알 마드리드",
        nation: "Spain",
        rating: 98,
        bestPlayerName: "킬리안 음바페 (ST)",
        activeFormation: "4-3-3",
        initials: "RMA",
        bg: "#ffffff",
        fg: "#00529f",
        border: "#eeaf22",
        isFinalBoss: true,
        description: "유럽 챔피언스리그 최다 우승에 빛나는 절대 보스 레알 마드리드입니다. 슈퍼스타 음바페가 이끄는 최강의 스쿼드입니다."
    }
];

let selectedFriendlyOpponent = null;

// 오늘 날짜 문자열 반환 (YYYY-MM-DD)
function getFriendlyTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 도전모드 상태 초기화 및 날짜 동기화
function initChallengeState() {
    if (typeof loadChallengeState === 'function') {
        loadChallengeState();
    }
    
    // 현재 스테이지 상대팀 자동 선택
    const stageIdx = Math.max(1, Math.min(10, challengeStage)) - 1;
    selectedFriendlyOpponent = CHALLENGE_STAGES_PRESET[stageIdx] || CHALLENGE_STAGES_PRESET[0];

    updateChallengeMatchPreview();
    renderChallengeRoadmap();
}

// 하위 호환 별칭
function initFriendlyMatchState() {
    initChallengeState();
}

function initFriendlyMatchTab() {
    initChallengeState();
}

// 현재 도전 상대팀 데이터 반환
function getCurrentChallengeOpponent() {
    const stageIdx = Math.max(1, Math.min(10, challengeStage)) - 1;
    return CHALLENGE_STAGES_PRESET[stageIdx] || CHALLENGE_STAGES_PRESET[0];
}

// 도전모드 매치 프리뷰 보드 갱신
function updateChallengeMatchPreview() {
    const opponent = getCurrentChallengeOpponent();
    selectedFriendlyOpponent = opponent;

    // 플레이어 구단 정보
    const pureOvr = getPlayerPureOvr();
    const formTactic = (typeof getPlayerFormationTacticBonuses === 'function') ? getPlayerFormationTacticBonuses() : { formationBonus: 0 };
    const userTotalOvr = pureOvr + (formTactic.formationBonus || 0);

    const userTeamName = (typeof getActiveUserTeamName === 'function') ? getActiveUserTeamName() : ((typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? '리버풀 FC' : '전북 현대');
    const userShortName = (typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? '리버풀' : '전북';
    const userEmblem = (typeof getActiveUserEmblem === 'function') ? getActiveUserEmblem() : ((typeof currentLeagueId !== 'undefined' && currentLeagueId === 'epl') ? 'img/mark_liverpool.png' : 'img/mark_jb.svg');

    const fHomeName = document.getElementById('friendlyHomeTeamName');
    if (fHomeName) fHomeName.innerText = `나의 구단 (${userShortName})`;
    
    const fHomeOvr = document.getElementById('friendlyHomeTeamOvr');
    if (fHomeOvr) fHomeOvr.innerText = userTotalOvr;
    
    const fHomeEmblem = document.getElementById('friendlyHomeEmblem');
    if (fHomeEmblem) {
        fHomeEmblem.innerHTML = `<img src="${userEmblem}" alt="${userTeamName}" class="match-emblem-img match-emblem-glow" style="height: 48px; width: 48px; object-fit: contain;">`;
        fHomeEmblem.removeAttribute('style');
        fHomeEmblem.classList.add('jeonbuk-emblem-box');
    }

    // 상대팀 (원정) 엠블럼 및 정보
    const fAwayName = document.getElementById('friendlyAwayTeamName');
    if (fAwayName) {
        fAwayName.innerHTML = opponent.isFinalBoss
            ? `<span style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #ffd700;"><i class="fa-solid fa-crown"></i> ${opponent.name}</span>`
            : opponent.name;
    }
    
    const fAwayOvr = document.getElementById('friendlyAwayTeamOvr');
    if (fAwayOvr) fAwayOvr.innerText = opponent.rating;
    
    const fAwayEmblem = document.getElementById('friendlyAwayEmblem');
    if (fAwayEmblem) {
        fAwayEmblem.innerHTML = `
            <div style="width: 48px; height: 48px; background: ${opponent.bg}; border: 2.5px solid ${opponent.border}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 900; color: ${opponent.fg}; box-shadow: 0 0 12px ${opponent.border}88; text-shadow: 1px 1px 2px rgba(0,0,0,0.6);">
                ${opponent.initials}
            </div>
        `;
    }

    const fTimeDisplay = document.getElementById('friendlySbTimeDisplay');
    if (fTimeDisplay) {
        fTimeDisplay.innerText = `시즌 ${challengeSeason} · STAGE ${challengeStage}`;
    }

    const fVenueDisp = document.getElementById('friendlyMatchVenueDisplay');
    if (fVenueDisp) {
        fVenueDisp.innerText = `원정팀 전술: ${opponent.activeFormation} | 상대 국적: ${opponent.nation}`;
    }

    // 상단 스테이터스 및 카운트 배지 갱신
    const statusBadge = document.getElementById('friendlyDataStatusBadge');
    if (statusBadge) {
        if (opponent.isFinalBoss) {
            statusBadge.innerHTML = `<i class="fa-solid fa-fire"></i> FINAL BOSS (10R)`;
            statusBadge.style.background = 'rgba(255, 215, 0, 0.15)';
            statusBadge.style.borderColor = 'rgba(255, 215, 0, 0.4)';
            statusBadge.style.color = '#ffd700';
        } else {
            statusBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> STAGE ${challengeStage} / 10`;
            statusBadge.style.background = 'rgba(165, 94, 234, 0.15)';
            statusBadge.style.borderColor = 'rgba(165, 94, 234, 0.4)';
            statusBadge.style.color = '#a55eea';
        }
    }

    const todayCountVal = document.getElementById('friendlyTodayCountVal');
    if (todayCountVal) {
        todayCountVal.innerText = `${challengeStage}/10`;
    }

    // 상대팀 정보 요약 프레임 연동
    const oppFormation = opponent.activeFormation || "4-3-3";
    const compBonus = getFormationCompatibilityBonus(currentFormation, oppFormation);
    
    const analysisCard = document.getElementById('friendlyOpponentAnalysisCard');
    if (analysisCard) {
        analysisCard.style.display = 'block';
        const oppFormText = document.getElementById('friendlyOpponentFormationText');
        if (oppFormText) oppFormText.innerText = oppFormation;
        
        const compTextEl = document.getElementById('friendlyOpponentCompatibilityText');
        if (compTextEl) {
            compTextEl.className = 'opponent-analysis-tactic-row';
            if (compBonus > 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-advantage');
                compTextEl.innerHTML = `${userTeamName}의 <strong>${currentFormation}</strong> 전술이 상대의 <strong>${oppFormation}</strong> 전술에 상성상 우세합니다! (공격 찬스 확률 +5.0% ⚡)`;
            } else if (compBonus < 0) {
                compTextEl.style.display = 'block';
                compTextEl.classList.add('tactic-disadvantage');
                compTextEl.innerHTML = `상대의 <strong>${oppFormation}</strong> 전술이 ${userTeamName}의 <strong>${currentFormation}</strong> 전술에 상성상 우세합니다. (공격 찬스 확률 -5.0% ⚠️)`;
            } else {
                compTextEl.style.display = 'none';
            }
        }
    }

    // 상대 정보 세부 디테일 판넬 업데이트
    const infoDetailEl = document.querySelector('#matchLayoutFriendly .friendly-panel div[style*="background: rgba(255,255,255,0.02)"]');
    if (infoDetailEl) {
        infoDetailEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">상대 포메이션:</span>
                <span style="font-weight: 700; color: #fff;">${opponent.activeFormation}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">핵심 선수:</span>
                <span style="font-weight: 700; color: #ffd700;"><i class="fa-solid fa-crown"></i> ${opponent.bestPlayerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: var(--text-muted);">도전 스테이지:</span>
                <span style="font-weight: 700; color: #a55eea;">시즌 ${challengeSeason} · Stage ${challengeStage} (${opponent.name})</span>
            </div>
        `;
    }

    // 도전모드 버튼 상태 갱신
    updateChallengeButtonState();
}

// 하위 호환 별칭
function updateFriendlyMatchPreview() {
    updateChallengeMatchPreview();
}

// 도전모드 버튼 상태 제어 함수
function updateChallengeButtonState() {
    const startBtn = document.getElementById('btnStartFriendlyMatch');
    if (!startBtn) return;

    // Case 1: 오늘 무료 도전 미사용 -> 무료 도전 가능
    if (!challengeDailyFreeUsed) {
        startBtn.disabled = false;
        startBtn.onclick = () => startChallengeMatchSimulation(false);
        startBtn.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i>무료 도전 시작 (Stage ${challengeStage})`;
        startBtn.style.background = 'linear-gradient(135deg, #a55eea, #4b7bec)';
        startBtn.style.color = '#fff';
        startBtn.style.cursor = 'pointer';
        startBtn.style.opacity = '1';
    } 
    // Case 2: 오늘 무료 도전 실패 후 재도전 미사용 -> 5P 소모 재도전 가능
    else if (!challengeDailyRetryUsed) {
        startBtn.disabled = false;
        startBtn.onclick = () => startChallengeMatchSimulation(true);
        startBtn.innerHTML = `<i class="fa-solid fa-fire" style="margin-right: 8px; color: #ffd700;"></i>5P 소모하고 재도전하기 (현재: ${userPoints} FP)`;
        startBtn.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
        startBtn.style.color = '#fff';
        startBtn.style.cursor = 'pointer';
        startBtn.style.opacity = '1';
    } 
    // Case 3: 오늘 완료 (승리하여 다음 스테이지 진출 또는 재도전까지 소진)
    else {
        startBtn.disabled = true;
        startBtn.onclick = null;
        startBtn.innerHTML = `<i class="fa-solid fa-check-circle" style="margin-right: 8px; color: #00ff87;"></i>오늘의 도전 완료 (내일 다음 경기 가능)`;
        startBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        startBtn.style.color = 'var(--text-muted)';
        startBtn.style.cursor = 'not-allowed';
        startBtn.style.opacity = '0.7';
    }
}

// 우측 패널: 1~10 스테이지 로드맵 & 시즌 우승 보상 쇼케이스 렌더링
function renderChallengeRoadmap() {
    const tablePanel = document.querySelector('#matchLayoutFriendly .league-table-panel');
    if (!tablePanel) return;

    // 보상 카드 정보 (시즌 1: 슈퍼 리오넬 메시)
    const rewardCardId = "super_messi";
    const rewardCard = (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[rewardCardId]) ? CARDS_DATABASE[rewardCardId] : null;

    let stagesHtml = '';
    CHALLENGE_STAGES_PRESET.forEach((team) => {
        const isCurrent = (team.stage === challengeStage);
        const isCleared = (team.stage < challengeStage);
        const isLocked = (team.stage > challengeStage);

        let rowStyle = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);';
        let statusBadgeHtml = '';

        if (isCleared) {
            rowStyle = 'background: rgba(0, 255, 135, 0.06); border: 1px solid rgba(0, 255, 135, 0.25);';
            statusBadgeHtml = `<span style="color: #00ff87; font-weight: 800; font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> 클리어</span>`;
        } else if (isCurrent) {
            rowStyle = 'background: linear-gradient(90deg, rgba(165, 94, 234, 0.2) 0%, rgba(255, 0, 127, 0.1) 100%); border: 1.5px solid #a55eea; box-shadow: 0 0 12px rgba(165, 94, 234, 0.35);';
            statusBadgeHtml = `<span style="color: #ffd700; font-weight: 900; font-size: 0.72rem; animation: pulseGlow 1.5s infinite;"><i class="fa-solid fa-swords"></i> 도전 중</span>`;
        } else {
            statusBadgeHtml = `<span style="color: var(--text-muted); font-size: 0.7rem;"><i class="fa-solid fa-lock"></i> 잠김</span>`;
        }

        stagesHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; border-radius: 10px; margin-bottom: 6px; ${rowStyle}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-weight: 900; font-size: 0.75rem; color: ${isCurrent ? '#ffd700' : isCleared ? '#00ff87' : 'var(--text-muted)'}; min-width: 22px;">
                        ${team.stage}R
                    </div>
                    <div style="width: 28px; height: 28px; background: ${team.bg}; border: 1.5px solid ${team.border}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; color: ${team.fg};">
                        ${team.initials}
                    </div>
                    <div>
                        <div style="font-size: 0.82rem; font-weight: 800; color: ${isCurrent ? '#fff' : isCleared ? '#dcdde1' : 'var(--text-muted)'};">
                            ${team.name} ${team.isFinalBoss ? '<i class="fa-solid fa-crown" style="color: #ffd700; margin-left: 2px;"></i>' : ''}
                        </div>
                        <div style="font-size: 0.68rem; color: var(--text-muted);">
                            대표: ${team.bestPlayerName}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="sb-ovr-tag" style="font-size: 0.7rem; padding: 2px 6px; ${isCurrent ? 'color: #ffd700; border-color: rgba(255,215,0,0.3);' : 'color: #cbd5e1; border-color: rgba(255,255,255,0.1);'}">
                        OVR <strong>${team.rating}</strong>
                    </span>
                    <div style="min-width: 60px; text-align: right;">
                        ${statusBadgeHtml}
                    </div>
                </div>
            </div>
        `;
    });

    tablePanel.innerHTML = `
        <div class="squad-header" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="deck-title" style="font-size: 1.1rem; color: #fff; margin: 0;">
                <i class="fa-solid fa-trophy" style="margin-right: 8px; color: #ffd700;"></i>도전모드 스테이지 로드맵
            </h3>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span id="challengeSeasonBadge" style="font-size: 0.68rem; color: #ffd700; background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.35); padding: 2px 8px; border-radius: 12px; font-weight: 800;">
                    시즌 ${challengeSeason} 진행 중
                </span>
            </div>
        </div>

        <!-- 10개 스테이지 스크롤 리스트 -->
        <div style="max-height: 280px; overflow-y: auto; padding-right: 4px; margin-bottom: 1rem;">
            ${stagesHtml}
        </div>

        <!-- 시즌 우승 특별 보상 쇼케이스 카드 -->
        <div style="background: linear-gradient(135deg, rgba(255, 0, 127, 0.12) 0%, rgba(0, 242, 254, 0.08) 100%); border: 1.5px solid rgba(255, 0, 127, 0.35); border-radius: 14px; padding: 0.9rem; position: relative; overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 900; color: #fff;">
                    <i class="fa-solid fa-gift" style="color: #ffd700;"></i>
                    <span>시즌 ${challengeSeason} 우승 보상</span>
                </div>
                <span style="font-size: 0.65rem; font-weight: 900; background: linear-gradient(135deg, #ff007f, #00f2fe); color: #fff; padding: 2px 6px; border-radius: 10px; box-shadow: 0 0 8px rgba(255,0,127,0.5);">
                    ⚡ SUPER 6각성
                </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
                <div style="position: relative; width: 50px; height: 50px; border-radius: 50%; overflow: hidden; border: 2px solid #00f2fe; box-shadow: 0 0 10px rgba(0, 242, 254, 0.6); flex-shrink: 0;">
                    <img src="${rewardCard ? rewardCard.image : 'player2/슈퍼 메시.png'}" alt="S메시" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.92rem; font-weight: 900; color: #fff; text-shadow: 0 0 8px rgba(255,0,127,0.6);">
                        ${rewardCard ? rewardCard.name : 'S메시'}
                    </div>
                    <div style="font-size: 0.72rem; color: #ffd700; font-weight: 700; margin-top: 2px;">
                        ★6 각성 완료 (실질 OVR 100 / 슈팅 93)
                    </div>
                    <div style="font-size: 0.68rem; color: #cbd5e1; margin-top: 2px;">
                        10경기 전승 우승 시 내 덱에 즉시 지급!
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 하위 호환 별칭
function renderFriendlyTable() {
    renderChallengeRoadmap();
}

// 데이터 강제 리프레시
function refreshFriendlyOpponentsForce() {
    initChallengeState();
    showToast("🔄 도전모드 상태 및 스테이지 로드맵을 새로고침했습니다.");
}

// 도전 매치 시뮬레이션 개시 (isRetry: boolean)
function startChallengeMatchSimulation(isRetry = false) {
    if (isMatchRunning) {
        showToast("이미 경기가 진행 중입니다!");
        return;
    }

    // 일일 제한 검사
    if (!isRetry) {
        if (challengeDailyFreeUsed) {
            showToast("오늘의 무료 도전은 이미 사용하셨습니다! 재도전(5P) 버튼을 이용해주세요.");
            return;
        }
    } else {
        if (!challengeDailyFreeUsed) {
            showToast("먼저 오늘의 무료 1경기를 진행해주세요!");
            return;
        }
        if (challengeDailyRetryUsed) {
            showToast("오늘의 재도전 기회(1회)를 이미 모두 사용하셨습니다. 내일 다시 도전해주세요!");
            return;
        }
        if (userPoints < 5) {
            showToast(`⚠️ 포인트(FP)가 부족합니다! (현재: ${userPoints} FP / 필요: 5 FP)`);
            return;
        }

        // 5 포인트 소모
        userPoints = Math.max(0, userPoints - 5);
        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
        } catch(e) {}
        if (typeof renderUserPoints === 'function') renderUserPoints();
        challengeDailyRetryUsed = true;
        saveChallengeState();
        showToast("🔥 5 FP를 소모하여 당일 1회 재도전을 시작합니다!");
    }

    const opponent = getCurrentChallengeOpponent();
    if (!opponent) return;

    isMatchRunning = true;
    updateChallengeButtonState();

    // 중계창 초기화
    const commBox = document.getElementById('friendlyCommentaryScroll');
    if (commBox) {
        commBox.innerHTML = '';
    }

    const liveIndicator = document.getElementById('friendlyLivePulseIndicator');
    if (liveIndicator) liveIndicator.style.display = 'inline-block';

    const fHomeScore = document.getElementById('friendlyHomeScore');
    const fAwayScore = document.getElementById('friendlyAwayScore');
    if (fHomeScore) fHomeScore.innerText = '0';
    if (fAwayScore) fAwayScore.innerText = '0';

    const timeDisplay = document.getElementById('friendlySbTimeDisplay');
    if (timeDisplay) {
        timeDisplay.textContent = "0'";
        timeDisplay.classList.add('live-ticking');
    }

    if (typeof playSound === 'function') {
        try { playSound('reveal'); } catch(e) {}
    }

    // 선수 이름 헬퍼
    let playerScorerName = "스트라이커";
    let playerAssisterName = "미드필더";
    try {
        if (typeof squadFormation !== 'undefined' && squadFormation["ST"] && CARDS_DATABASE[squadFormation["ST"]]) {
            playerScorerName = CARDS_DATABASE[squadFormation["ST"]].name;
        }
        if (typeof getFormationMidfielders === 'function') {
            const mfs = getFormationMidfielders(currentFormation, squadFormation);
            if (mfs.length > 0) playerAssisterName = mfs[0].name;
        } else if (typeof squadFormation !== 'undefined' && squadFormation["CM"] && CARDS_DATABASE[squadFormation["CM"]]) {
            playerAssisterName = CARDS_DATABASE[squadFormation["CM"]].name;
        }
    } catch(e) {}

    const playerLwName = () => (squadFormation && squadFormation["LW"] && CARDS_DATABASE[squadFormation["LW"]]) ? CARDS_DATABASE[squadFormation["LW"]].name : "윙어";
    const playerRwName = () => (squadFormation && squadFormation["RW"] && CARDS_DATABASE[squadFormation["RW"]]) ? CARDS_DATABASE[squadFormation["RW"]].name : "윙어";
    const playerGkName = () => (squadFormation && squadFormation["GK"] && CARDS_DATABASE[squadFormation["GK"]]) ? CARDS_DATABASE[squadFormation["GK"]].name : "골키퍼";

    // 전술 및 상성 보너스 계산
    const formTactic = (typeof getPlayerFormationTacticBonuses === 'function') ? getPlayerFormationTacticBonuses() : { formationBonus: 0, formationAttackBoost: 0, formationScoreBoost: 0 };
    const formationAttackBoost = formTactic.formationAttackBoost || 0;
    const formationScoreBoost = formTactic.formationScoreBoost || 0;
    const formationTacticDetailsHtml = formTactic.formationTacticDetailsHtml || '';

    const detailedTactic = (typeof getPlayerDetailedTacticBonuses === 'function') ? getPlayerDetailedTacticBonuses() : { detailedTacticBonus: 0, suitabilityBonus: 0, detailedTacticLabel: '', suitabilityLabel: '' };
    const detailedTacticBonus = detailedTactic.detailedTacticBonus || 0;
    const suitabilityBonus = detailedTactic.suitabilityBonus || 0;
    const detailedTacticLabel = detailedTactic.detailedTacticLabel || '';
    const suitabilityLabel = detailedTactic.suitabilityLabel || '';

    const isHome = true; // 도전모드는 내 구단이 홈
    const finalOvrs = (typeof calculateFinalMatchOvrs === 'function') 
        ? calculateFinalMatchOvrs('neutral', isHome, opponent.rating, false)
        : { playerOvr: getPlayerPureOvr() + (formTactic.formationBonus || 0), opponentOvr: opponent.rating };
    
    const playerOvr = finalOvrs.playerOvr;
    const opponentOvr = finalOvrs.opponentOvr;
    const diff = playerOvr - opponentOvr;

    const maxProb = 0.80;
    const minProb = 0.20;

    const oppFormation = opponent.activeFormation || "4-3-3";
    const compBonus = (typeof getFormationCompatibilityBonus === 'function') ? getFormationCompatibilityBonus(currentFormation, oppFormation) : 0;
    const compatibilityBonus = compBonus * 0.05;
    const playerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (diff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus + compatibilityBonus - (isHardMode ? 0.05 : 0)));

    let activeDiff = diff;
    let activePlayerAttackProb = playerAttackProb;

    const userTeamName = (typeof getActiveUserTeamName === 'function') ? getActiveUserTeamName() : '나의 구단';

    const commentaryData = {
        playerTeamName: userTeamName,
        playerOvr: playerOvr,
        opponentName: opponent.name,
        opponentOvr: opponentOvr,
        isPlayerHome: isHome,
        playerScoreVal: 0,
        opponentScoreVal: 0,
        activeGk: playerGkName(),
        detailedTacticLabel: detailedTacticLabel,
        suitabilityLabel: suitabilityLabel,
        playerAttackProb: playerAttackProb,
        compatibilityBonus: compatibilityBonus,
        currentFormation: currentFormation,
        userTotalOvr: playerOvr,
        oppOvr: opponentOvr
    };

    let playerScoreVal = 0;
    let opponentScoreVal = 0;

    const addCommentary = (min, text, type = 'normal') => {
        if (!commBox) return;
        const item = document.createElement('div');
        item.className = `comm-item comm-${type}`;
        const timestamp = (min === 'SYSTEM' || min === 'FT' || min === 'HT' || min === '종료' || min === 'PK' || String(min).startsWith('PK')) 
            ? '' 
            : `<strong style="color:#ffd700; margin-right: 6px;">${min}'</strong>`;
        item.innerHTML = `${timestamp}${text}`;
        commBox.appendChild(item);
        commBox.scrollTop = commBox.scrollHeight;
    };

    // 경기 시작 전 전술 분석 코멘터리 출력 (리그/컵/챔스와 100% 동일)
    if (typeof getMatchEventCommentary === 'function') {
        addCommentary('SYSTEM', getMatchEventCommentary('PRE_ANALYZE', commentaryData, false), 'system');
        if (formationTacticDetailsHtml) addCommentary('SYSTEM', formationTacticDetailsHtml, 'attack');
        if (detailedTacticLabel || suitabilityLabel) {
            addCommentary('SYSTEM', getMatchEventCommentary('TACTIC_ANALYZE', commentaryData, false), 'attack');
        }
    }

    const matchMinutes = [0, 15, 30, 45, 52, 63, 74, 82, 88, 90];
    const eventMins = [15, 45, 63, 82, 88];

    // 승부차기(PK) 실제 경기 루틴 (컵대회/공통 엔진 연동)
    const runChallengePenaltyShootout = (regularScore1, regularScore2) => {
        if (timeDisplay) {
            timeDisplay.textContent = "PK";
            timeDisplay.classList.remove('live-ticking');
        }

        const pkData = {
            team1Name: userTeamName,
            team2Name: opponent.name,
            rating1: playerOvr,
            rating2: opponentOvr,
            isTeam1Jeonbuk: true
        };

        const pkResult = (typeof simulatePenaltyShootoutEngine === 'function')
            ? simulatePenaltyShootoutEngine(pkData)
            : { pkScore1: 4, pkScore2: 3, winner: 'team1', events: [] };

        const finalizePkMatch = () => {
            const isPkWinner = pkResult.winner === 'team1';
            finalizeChallengeResult(isPkWinner, pkResult.pkScore1, pkResult.pkScore2, regularScore1, regularScore2);
        };

        if (isDeveloperMode) {
            pkResult.events.forEach(ev => {
                if (ev.round > 0) {
                    if (fHomeScore) fHomeScore.innerText = `${regularScore1} (${ev.score1})`;
                    if (fAwayScore) fAwayScore.innerText = `${regularScore2} (${ev.score2})`;
                }
                addCommentary('PK', ev.text, ev.type === 'system' ? 'system' : (ev.success ? 'goal' : 'normal'));
            });
            finalizePkMatch();
            return;
        }

        let pkTick = 0;
        const pkTimer = setInterval(() => {
            if (pkTick < pkResult.events.length) {
                const ev = pkResult.events[pkTick];
                if (ev.round > 0) {
                    if (fHomeScore) fHomeScore.innerText = `${regularScore1} (${ev.score1})`;
                    if (fAwayScore) fAwayScore.innerText = `${regularScore2} (${ev.score2})`;
                }

                if (ev.success && typeof playSound === 'function') {
                    try { playSound('goal'); } catch(e) {}
                }

                addCommentary('PK', ev.text, ev.type === 'system' ? 'system' : (ev.success ? 'goal' : 'normal'));
                pkTick++;
            } else {
                clearInterval(pkTimer);
                finalizePkMatch();
            }
        }, 1100);
    };

    // 최종 결과 확정 처리
    const finalizeChallengeResult = (isWinner, pkScore1 = null, pkScore2 = null, reg1 = 0, reg2 = 0) => {
        if (liveIndicator) liveIndicator.style.display = 'none';
        if (timeDisplay) {
            timeDisplay.classList.remove('live-ticking');
            timeDisplay.innerText = "FT";
        }

        if (isWinner) {
            if (pkScore1 !== null && pkScore2 !== null) {
                addCommentary('FT', `🏆 <strong>[승부차기 승리!]</strong> ${userTeamName}이 승부차기 스코어 ${pkScore1} - ${pkScore2}로 ${opponent.name}을 꺾고 승리했습니다!`, 'goal');
            } else {
                if (typeof getMatchEventCommentary === 'function') {
                    addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'goal');
                } else {
                    addCommentary('FT', `🎉 [경기 종료] ${userTeamName} ${reg1} - ${reg2} ${opponent.name} (승리!)`, 'goal');
                }
            }

            challengeHistory.w += 1;
            challengeHistory.totalGames += 1;
            
            if (!isRetry) challengeDailyFreeUsed = true;
            else challengeDailyRetryUsed = true;

            // 10스테이지 전승 달성 시 시즌 우승
            if (challengeStage === 10) {
                setTimeout(() => {
                    triggerChallengeSeasonVictory(challengeSeason);
                }, 1000);
            } else {
                challengeStage += 1;
                saveChallengeState();
                if (typeof saveUserProgress === 'function') saveUserProgress();
                showToast(`🎉 Stage ${challengeStage - 1} 클리어! 다음 스테이지로 진출했습니다. (내일 다음 경기 가능)`);
            }
        } else {
            if (pkScore1 !== null && pkScore2 !== null) {
                addCommentary('FT', `😢 <strong>[승부차기 패배]</strong> ${userTeamName}이 승부차기 스코어 ${pkScore1} - ${pkScore2}로 아쉽게 석패했습니다.`, 'normal');
            } else {
                if (typeof getMatchEventCommentary === 'function') {
                    addCommentary('FT', getMatchEventCommentary('FULLTIME', commentaryData, false), 'normal');
                } else {
                    addCommentary('FT', `😢 [경기 종료] ${userTeamName} ${reg1} - ${reg2} ${opponent.name} (패배)`, 'normal');
                }
            }

            challengeHistory.l += 1;
            challengeHistory.totalGames += 1;
            
            if (!isRetry) challengeDailyFreeUsed = true;
            else challengeDailyRetryUsed = true;
            
            saveChallengeState();
            if (typeof saveUserProgress === 'function') saveUserProgress();
            
            if (!isRetry && !challengeDailyRetryUsed) {
                showToast(`패배하여 스테이지 클리어에 실패했습니다. 당일 1회 5P로 재도전할 수 있습니다!`);
            } else {
                showToast(`아쉽게 패배했습니다. 내일 무료 기회로 다시 도전해주세요!`);
            }
        }

        isMatchRunning = false;
        updateChallengeMatchPreview();
        renderChallengeRoadmap();
    };

    // 정규 90분 경기 종료 처리
    const finishMatch = () => {
        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;

        commentaryData.playerScoreVal = playerScoreVal;
        commentaryData.opponentScoreVal = opponentScoreVal;

        if (isDraw) {
            addCommentary('SYSTEM', "⚖️ 정규시간 90분 혈투 끝 무승부! 다음 스테이지 진출을 가리기 위한 운명의 승부차기(PK)로 돌입합니다.", "system");
            setTimeout(() => {
                runChallengePenaltyShootout(playerScoreVal, opponentScoreVal);
            }, isDeveloperMode ? 0 : 1200);
            return;
        }

        finalizeChallengeResult(isWinner, null, null, playerScoreVal, opponentScoreVal);
    };

    // 개별 틱 이벤트 실행 엔진
    const processTick = (currentMin) => {
        if (currentMin === 0) {
            if (typeof getMatchEventCommentary === 'function') {
                addCommentary(0, getMatchEventCommentary('KICKOFF', commentaryData, false), 'normal');
            } else {
                addCommentary(0, `⚽ 주심의 휘슬과 함께 ${userTeamName} vs ${opponent.name} 경기가 킥오프되었습니다!`, 'normal');
            }
        } else if (eventMins.includes(currentMin)) {
            // 돌발 변수 체크 (PK, 레드카드 등)
            const activePlayers = { ST: playerScorerName, LW: playerLwName(), RW: playerRwName(), CM: playerAssisterName, GK: playerGkName() };
            const specialEvent = (typeof rollSpecialMatchEvent === 'function') ? rollSpecialMatchEvent(activePlayers, opponent.name) : null;

            if (specialEvent) {
                addCommentary(currentMin, specialEvent.eventDesc, 'system');
                if (specialEvent.type === "pk_player") {
                    const isGoal = (window.forceChallengeWin === true) ? true : specialEvent.isGoal;
                    if (isGoal) {
                        playerScoreVal++;
                        if (fHomeScore) fHomeScore.innerText = playerScoreVal;
                        addCommentary(currentMin, specialEvent.eventGoal, 'goal');
                        if (typeof playSound === 'function') try { playSound('goal'); } catch(e) {}
                    } else {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else if (specialEvent.type === "pk_opponent") {
                    const isGoal = (window.forceChallengeWin === true) ? false : specialEvent.isGoal;
                    if (isGoal) {
                        opponentScoreVal++;
                        if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
                        let pkCommentaryText = specialEvent.eventGoal;
                        if (opponent.bestPlayerName) {
                            pkCommentaryText = `⚽ <strong>[PK 실점]</strong> 상대 키커 <strong>${opponent.bestPlayerName}</strong>의 강력한 슛이 그대로 그물을 출렁입니다!`;
                        }
                        addCommentary(currentMin, pkCommentaryText, 'normal');
                    } else {
                        addCommentary(currentMin, specialEvent.eventFail, 'normal');
                    }
                } else if (specialEvent.type === "red_opponent") {
                    activeDiff += specialEvent.ovrChange; // +5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                    addCommentary(currentMin, specialEvent.eventFail, 'normal');
                } else if (specialEvent.type === "red_player") {
                    activeDiff += specialEvent.ovrChange; // -5
                    activePlayerAttackProb = Math.min(maxProb, Math.max(minProb, 0.40 + (activeDiff * 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus - (isHardMode ? 0.05 : 0)));
                    addCommentary(currentMin, specialEvent.eventFail, 'normal');
                }
            } else {
                const isPlayerAttack = (window.forceChallengeWin === true) ? true : (Math.random() < activePlayerAttackProb);
                if (isPlayerAttack) {
                    let selectedOption = 1;
                    if (Math.random() < 0.10) {
                        selectedOption = 3; // 🚀 찬스의 10% 확률로 CM 대포알 중거리슛
                    } else {
                        let attackOptions = [0, 1, 2];
                        if (currentFormation === '4-2-3-1') attackOptions.push(5);
                        selectedOption = attackOptions[Math.floor(Math.random() * attackOptions.length)];
                    }

                    let chancePlayerStat = 75;

                    if (selectedOption === 0) {
                        const lwCardId = squadFormation['LW'];
                        if (lwCardId && CARDS_DATABASE[lwCardId] && typeof getWingerChanceStat === 'function') {
                            chancePlayerStat = getWingerChanceStat('LW', (typeof getAwakenedCard === 'function') ? getAwakenedCard(lwCardId) : CARDS_DATABASE[lwCardId]);
                        }
                    } else if (selectedOption === 1) {
                        const stCardId = squadFormation['ST'];
                        if (stCardId && CARDS_DATABASE[stCardId] && typeof getStrikerChanceStat === 'function') {
                            chancePlayerStat = getStrikerChanceStat('ST', (typeof getAwakenedCard === 'function') ? getAwakenedCard(stCardId) : CARDS_DATABASE[stCardId], (typeof strikerStyles !== 'undefined') ? strikerStyles : {});
                        }
                    } else if (selectedOption === 2) {
                        const rwCardId = squadFormation['RW'];
                        if (rwCardId && CARDS_DATABASE[rwCardId] && typeof getWingerChanceStat === 'function') {
                            chancePlayerStat = getWingerChanceStat('RW', (typeof getAwakenedCard === 'function') ? getAwakenedCard(rwCardId) : CARDS_DATABASE[rwCardId]);
                        }
                    } else if (selectedOption === 3) {
                        const mfList = (typeof getFormationMidfielders === 'function')
                            ? getFormationMidfielders(currentFormation, squadFormation, playerDeck)
                            : [];
                        if (mfList.length > 0) {
                            chancePlayerStat = Math.max(...mfList.map(m => m.sho));
                        } else {
                            chancePlayerStat = 75;
                        }
                    } else if (selectedOption === 5) {
                        const cmCardId = squadFormation['CM'];
                        if (cmCardId && CARDS_DATABASE[cmCardId]) {
                            const awakened = (typeof getAwakenedCard === 'function') ? getAwakenedCard(cmCardId) : CARDS_DATABASE[cmCardId];
                            chancePlayerStat = (awakened.stats && awakened.stats.dri) ? awakened.stats.dri : 75;
                        }
                    }

                    const scoreProb = (typeof calculatePlayerScoreProb === 'function')
                        ? calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentOvr, formationScoreBoost, suitabilityBonus)
                        : (0.45 + (activeDiff * 0.01));
                    
                    const isGoal = (window.forceChallengeWin === true) ? true : (Math.random() < scoreProb);

                    if (typeof getDetailedTacticCommentary === 'function') {
                        const isTacticActive = detailedTacticBonus > 0;
                        const { eventDesc, eventGoal, eventFail } = getDetailedTacticCommentary(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, (typeof wingerStyles !== 'undefined' ? wingerStyles : {}), (typeof strikerStyles !== 'undefined' ? strikerStyles : {}));
                        
                        addCommentary(currentMin, eventDesc, 'attack');
                        if (isGoal) {
                            playerScoreVal++;
                            if (fHomeScore) fHomeScore.innerText = playerScoreVal;
                            addCommentary(currentMin, eventGoal, 'goal');
                            if (typeof playSound === 'function') try { playSound('goal'); } catch(e) {}
                        } else {
                            addCommentary(currentMin, eventFail, 'normal');
                        }
                    } else {
                        if (isGoal) {
                            playerScoreVal++;
                            if (fHomeScore) fHomeScore.innerText = playerScoreVal;
                            addCommentary(currentMin, `⚽ <strong>[득점!]</strong> ${playerScorerName}의 환상적인 슈팅이 골망을 가릅니다! (${playerScoreVal}-${opponentScoreVal})`, 'goal');
                            if (typeof playSound === 'function') try { playSound('goal'); } catch(e) {}
                        } else {
                            addCommentary(currentMin, `⚡ ${playerScorerName}의 날카로운 슛이 아쉽게 골대를 벗어납니다.`, 'normal');
                        }
                    }
                } else {
                    let playerGkStat = 70;
                    const gkCardId = squadFormation['GK'];
                    if (gkCardId && CARDS_DATABASE[gkCardId]) {
                        const awakened = (typeof getAwakenedCard === 'function') ? getAwakenedCard(gkCardId) : CARDS_DATABASE[gkCardId];
                        playerGkStat = (awakened.stats && awakened.stats.def) ? awakened.stats.def : (awakened.rating || 70);
                    }

                    const oppScoreProb = (typeof calculateOpponentScoreProb === 'function')
                        ? calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat)
                        : (0.35 - (activeDiff * 0.01));
                    
                    const isGoal = (window.forceChallengeWin === true) ? false : (Math.random() < oppScoreProb);

                    if (typeof getMatchEventCommentary === 'function') {
                        addCommentary(currentMin, getMatchEventCommentary('OPP_ATTACK', commentaryData, false), 'attack');
                        if (isGoal) {
                            opponentScoreVal++;
                            if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
                            const goalCommentaryData = { ...commentaryData, opponentScorerName: opponent.bestPlayerName, opponentAssisterName: opponent.name };
                            addCommentary(currentMin, getMatchEventCommentary('OPP_GOAL', goalCommentaryData, false), 'normal');
                        } else {
                            addCommentary(currentMin, getMatchEventCommentary('GK_SAVE', commentaryData, false), 'normal');
                        }
                    } else {
                        if (isGoal) {
                            opponentScoreVal++;
                            if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
                            addCommentary(currentMin, `⚠️ <strong>[실점]</strong> ${opponent.name}의 ${opponent.bestPlayerName}에게 실점을 허용합니다. (${playerScoreVal}-${opponentScoreVal})`, 'normal');
                        } else {
                            addCommentary(currentMin, `🛡️ 골키퍼 ${playerGkName()}의 슈퍼세이브로 위기를 넘깁니다!`, 'normal');
                        }
                    }
                }
            }
        } else if (currentMin === 45) {
            commentaryData.playerScoreVal = playerScoreVal;
            commentaryData.opponentScoreVal = opponentScoreVal;
            if (typeof getMatchEventCommentary === 'function') {
                addCommentary('HT', getMatchEventCommentary('HALFTIME', commentaryData, false), 'system');
            } else {
                addCommentary('HT', `⏱️ 전반전 종료 (${playerScoreVal} - ${opponentScoreVal})`, 'system');
            }
        }
    };

    // 개발자 모드 시 즉시 처리
    if (isDeveloperMode) {
        matchMinutes.forEach(currentMin => {
            processTick(currentMin);
        });

        if (fHomeScore) fHomeScore.innerText = playerScoreVal;
        if (fAwayScore) fAwayScore.innerText = opponentScoreVal;
        finishMatch();
        return;
    }

    // 일반 라이브 중계 타이머 (10개 틱 단계별 렌더링)
    let stepIndex = 0;
    const intervalId = setInterval(() => {
        if (stepIndex >= matchMinutes.length) {
            clearInterval(intervalId);
            finishMatch();
            return;
        }

        const currentMin = matchMinutes[stepIndex];
        if (timeDisplay && currentMin > 0 && currentMin < 90) {
            timeDisplay.innerText = currentMin === 45 ? "HT" : `${currentMin}'`;
        }

        processTick(currentMin);
        stepIndex++;
    }, 1200);
}

// 하위 호환 별칭
function startFriendlyMatchSimulation() {
    startChallengeMatchSimulation(false);
}

// 도전모드 시즌 우승 처리 (슈퍼 6각성 특별 선수 지급)
function triggerChallengeSeasonVictory(season) {
    const todayStr = getFriendlyTodayDateString();
    
    // 시즌 1 우승 보상: 슈퍼 리오넬 메시 (super_messi) 6각성
    const rewardCardId = "super_messi";
    const rewardCardObj = (typeof CARDS_DATABASE !== 'undefined' && CARDS_DATABASE[rewardCardId]) ? CARDS_DATABASE[rewardCardId] : null;

    if (rewardCardObj) {
        // 덱에 6각성 카드로 자동 지급
        playerDeck[rewardCardId] = {
            card: rewardCardObj,
            quantity: 1,
            awakening: 6,
            awakeLevel: 6,
            condition: 0,
            conditionDate: todayStr,
            isStored: false
        };

        try {
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        } catch(e) {}
        
        if (typeof renderDeck === 'function') renderDeck();
        if (typeof updateTotalCardCount === 'function') updateTotalCardCount();
    }

    // 시즌 갱신 (다음 시즌 리셋)
    challengeSeason += 1;
    challengeStage = 1;
    challengeDailyFreeUsed = true; // 오늘 우승 완료
    challengeDailyRetryUsed = true;
    saveChallengeState();
    
    if (typeof saveUserProgress === 'function') {
        saveUserProgress();
    }

    // 우승 축하 모달 표시
    showChallengeVictoryModal(season, rewardCardObj);
}

// 시즌 우승 축하 모달 팝업
function showChallengeVictoryModal(season, cardObj) {
    let modal = document.getElementById('challengeSeasonCloseModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'challengeSeasonCloseModal';
        document.body.appendChild(modal);
    }

    // 화면 정중앙 고정 오버레이 스타일
    modal.className = 'challenge-victory-modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        padding: 1rem;
        box-sizing: border-box;
    `;

    const cardName = cardObj ? cardObj.name : "S메시";
    const cardImg = cardObj ? cardObj.image : "player2/슈퍼 메시.png";

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px; width: 100%; max-height: 90vh; overflow-y: auto; text-align: center; background: linear-gradient(135deg, #0b0f19 0%, #170d28 100%); border: 2px solid #ff007f; box-shadow: 0 0 40px rgba(255,0,127,0.6); border-radius: 24px; padding: 1.8rem 1.4rem; position: relative; margin: auto; animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;">
            <div style="font-size: 3.2rem; margin-bottom: 0.4rem; animation: bounceIn 1s ease;">🏆</div>
            <h2 style="color: #ffd700; font-size: 1.55rem; font-weight: 900; margin: 0 0 0.5rem 0; text-shadow: 0 0 12px rgba(255,215,0,0.6); letter-spacing: -0.5px;">
                도전모드 시즌 ${season} 전승 우승!
            </h2>
            <p style="color: #cbd5e1; font-size: 0.86rem; line-height: 1.5; margin: 0 0 1.3rem 0; word-break: keep-all;">
                10개 스테이지의 유럽 최강 구단들을 모두 격파하고<br>
                영광스러운 <strong>시즌 ${season} 챔피언</strong>에 등극하셨습니다!
            </p>

            <!-- 특별 보상 카드 쇼케이스 -->
            <div style="background: rgba(255, 0, 127, 0.12); border: 1.5px solid #00f2fe; border-radius: 18px; padding: 1.2rem; margin-bottom: 1.3rem; box-shadow: 0 0 25px rgba(0, 242, 254, 0.25);">
                <span style="font-size: 0.72rem; font-weight: 900; background: linear-gradient(135deg, #ff007f, #00f2fe); color: #fff; padding: 3px 12px; border-radius: 20px; letter-spacing: 1px; display: inline-block; margin-bottom: 0.8rem;">
                    ⚡ 슈퍼(SUPER) 등급 ★6각성 카드 획득!
                </span>
                <div style="width: 105px; height: 105px; border-radius: 50%; overflow: hidden; margin: 0 auto 0.8rem auto; border: 3px solid #ff007f; box-shadow: 0 0 25px rgba(255,0,127,0.8);">
                    <img src="${cardImg}" alt="${cardName}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="font-size: 1.3rem; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(255,215,0,0.8);">
                    ${cardName}
                </div>
                <div style="font-size: 0.85rem; color: #00ff87; font-weight: 800; margin-top: 4px;">
                    ★6각성 기본 적용 (실질 OVR 100 / 슈팅 93)
                </div>
                <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 6px;">
                    내 선수 덱(컬렉션)에 안전하게 영입 완료되었습니다!
                </div>
            </div>

            <button onclick="closeChallengeSeasonModal()" style="width: 100%; padding: 0.95rem; border-radius: 14px; border: none; background: linear-gradient(135deg, #ff007f, #7928ca); color: #fff; font-size: 1rem; font-weight: 900; cursor: pointer; box-shadow: 0 0 20px rgba(255,0,127,0.6); transition: transform 0.2s ease;">
                🎉 보상 수령 & 시즌 ${season + 1} 준비하기
            </button>
        </div>
    `;

    modal.style.display = 'flex';
    if (typeof playSound === 'function') playSound('rank_up');
}

// 시즌 우승 모달 닫기
function closeChallengeSeasonModal() {
    const modal = document.getElementById('challengeSeasonCloseModal');
    if (modal) modal.style.display = 'none';

    updateChallengeMatchPreview();
    renderChallengeRoadmap();
    showToast(`🎉 새로운 시즌 ${challengeSeason}이 시작되었습니다!`);
}

// 하위 호환 별칭
function closeFriendlyCloseModal() {
    closeChallengeSeasonModal();
}
