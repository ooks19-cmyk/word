// js/match_algorithm.js - K리그1 & 친선전 공통 매치 알고리즘 및 OVR/전술 연산 엔진

// 1. 활성화된 베이스 스쿼드의 순수 평균 OVR 계산
function getPlayerPureOvr() {
    let totalOvr = 0;
    TACTICAL_POSITIONS.forEach(pos => {
        const cardId = squadFormation[pos];
        if (cardId && CARDS_DATABASE[cardId]) {
            totalOvr += getAwakenedCard(cardId).rating;
        } else {
            totalOvr += 70;
        }
    });
    return Math.round(totalOvr / 11);
}

// 2. 스쿼드 포메이션 전술/세부전술 보너스를 취합하여 전북 현대 최종 OVR 동기화 및 현황판 UI 업데이트
function syncJeonbukOvr() {
    let avgOvr = getPlayerPureOvr();
    
    // 포메이션 전술 완성 보너스 계산
    const formTactic = getPlayerFormationTacticBonuses();
    const hasKeyPlayer = formTactic.hasKeyPlayer;
    const hasTeamTactic = formTactic.hasTeamTactic;
    const formationBonus = formTactic.formationBonus;
    
    let detailsLabel = "";
    if (currentFormation !== '4-4-2' && formationBonus > 0) {
        detailsLabel = ` (+${formationBonus} 전술 완성)`;
    }
    
    avgOvr += formationBonus;
    
    const jb = leagueTeams.find(t => t.id === 'jeonbuk');
    if (jb) {
        jb.rating = avgOvr;
    }
    
    // UI 업데이트 (스쿼드 피치 상단 및 매치 프리뷰 영역 동기화)
    const teamOvrValEl = document.getElementById('teamOvrVal');
    if (teamOvrValEl) {
        teamOvrValEl.innerHTML = `${avgOvr}${detailsLabel ? `<span style="font-size: 0.72rem; color: #ffd700; font-weight: 800; margin-left: 5px; background: rgba(255,215,0,0.15); padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); vertical-align: middle;">${detailsLabel}</span>` : ''}`;
    }

    // 실시간 전술 완성 보너스 2종 달성 현황판 업데이트
    const bonusKeyStatusEl = document.getElementById('bonus-key-status');
    const bonusTeamStatusEl = document.getElementById('bonus-team-status');
    
    if (bonusKeyStatusEl && bonusTeamStatusEl) {
        if (currentFormation === '4-4-2') {
            bonusKeyStatusEl.innerText = "해당 없음 ➖";
            bonusKeyStatusEl.style.background = "rgba(255, 255, 255, 0.05)";
            bonusKeyStatusEl.style.color = "#cbd5e1";
            bonusKeyStatusEl.style.borderColor = "rgba(255, 255, 255, 0.15)";
            
            bonusTeamStatusEl.innerText = "해당 없음 ➖";
            bonusTeamStatusEl.style.background = "rgba(255, 255, 255, 0.05)";
            bonusTeamStatusEl.style.color = "#cbd5e1";
            bonusTeamStatusEl.style.borderColor = "rgba(255, 255, 255, 0.15)";
        } else {
            if (hasKeyPlayer) {
                bonusKeyStatusEl.innerText = "활성화 ⚡";
                bonusKeyStatusEl.style.background = "rgba(0, 255, 135, 0.18)";
                bonusKeyStatusEl.style.color = "#00ff87";
                bonusKeyStatusEl.style.borderColor = "#00ff87";
            } else {
                bonusKeyStatusEl.innerText = "미달성 ❌";
                bonusKeyStatusEl.style.background = "rgba(255, 62, 108, 0.18)";
                bonusKeyStatusEl.style.color = "#ff3e6c";
                bonusKeyStatusEl.style.borderColor = "#ff3e6c";
            }
            
            if (hasTeamTactic) {
                bonusTeamStatusEl.innerText = "활성화 ⚡";
                bonusTeamStatusEl.style.background = "rgba(0, 255, 135, 0.18)";
                bonusTeamStatusEl.style.color = "#00ff87";
                bonusTeamStatusEl.style.borderColor = "#00ff87";
            } else {
                bonusTeamStatusEl.innerText = "미달성 ❌";
                bonusTeamStatusEl.style.background = "rgba(255, 62, 108, 0.18)";
                bonusTeamStatusEl.style.color = "#ff3e6c";
                bonusTeamStatusEl.style.borderColor = "#ff3e6c";
            }
        }
    }

    // 실시간 세부 전술 달성 현황판 업데이트
    let detailedTacticName = "세부 전술 없음";
    let detailedTacticDesc = "해당 없음";
    
    if (currentFormation === '4-3-3') {
        detailedTacticName = "타겟맨 (Target Man)";
        detailedTacticDesc = "ST 피지컬 80 이상";
    } else if (currentFormation === '3-4-3') {
        detailedTacticName = "전방압박 (Gegenpressing)";
        detailedTacticDesc = "공격수 2명 속도 90 이상";
    } else if (currentFormation === '5-4-1') {
        detailedTacticName = "다이렉트 패스 (Direct Pass)";
        detailedTacticDesc = "패스 80이상 수비수 출전";
    } else if (currentFormation === '4-2-3-1') {
        detailedTacticName = "티키타카 (Tiki-Taka)";
        detailedTacticDesc = "미드필더 3명 패스 모두 83 이상";
    }

    const detailedTacticNameEl = document.getElementById('detailed-tactic-name');
    const detailedTacticDescEl = document.getElementById('detailed-tactic-desc');
    const detailedTacticStatusEl = document.getElementById('detailed-tactic-status');
    
    const detailedTactic = getPlayerDetailedTacticBonuses();
    const isDetailedActive = detailedTactic.detailedTacticBonus > 0;
    
    if (detailedTacticNameEl && detailedTacticDescEl && detailedTacticStatusEl) {
        detailedTacticNameEl.innerText = detailedTacticName;
        detailedTacticDescEl.innerText = detailedTacticDesc;
        
        if (currentFormation === '4-4-2') {
            detailedTacticStatusEl.innerText = "해당 없음 ➖";
            detailedTacticStatusEl.style.background = "rgba(255, 255, 255, 0.05)";
            detailedTacticStatusEl.style.color = "#cbd5e1";
            detailedTacticStatusEl.style.borderColor = "rgba(255, 255, 255, 0.15)";
        } else {
            if (isDetailedActive) {
                detailedTacticStatusEl.innerText = "활성화 ⚡";
                detailedTacticStatusEl.style.background = "rgba(0, 255, 135, 0.18)";
                detailedTacticStatusEl.style.color = "#00ff87";
                detailedTacticStatusEl.style.borderColor = "#00ff87";
            } else {
                detailedTacticStatusEl.innerText = "미달성 ❌";
                detailedTacticStatusEl.style.background = "rgba(255, 62, 108, 0.18)";
                detailedTacticStatusEl.style.color = "#ff3e6c";
                detailedTacticStatusEl.style.borderColor = "#ff3e6c";
            }
        }
    }
}

// 2a. 플레이어의 포메이션 전술 완성 보너스 및 비례 공격/득점 확률 계산
function getPlayerFormationTacticBonuses(formation = currentFormation, squad = squadFormation, deck = playerDeck) {
    let formationAttackBoost = 0;
    let formationScoreBoost = 0;
    let formationTacticDetailsHtml = "";
    let formationBonus = 0;
    let hasKeyPlayer = false;
    let hasTeamTactic = false;

    if (typeof formation !== 'undefined' && formation !== '4-4-2') {
        if (formation === '4-3-3') {
            const cmCardId = squad['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId, deck).stats && getAwakenedCard(cmCardId, deck).stats.pas >= 80;
            const avgPas = getTeamAverageStat('pas', squad, deck);
            hasTeamTactic = avgPas >= 70;

            if (hasKeyPlayer && hasTeamTactic) {
                const cmPas = getAwakenedCard(cmCardId, deck).stats.pas;
                formationAttackBoost = (cmPas - 80) * 0.005;
                formationTacticDetailsHtml = `⚽ <strong>[4-3-3 빌드업 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId, deck).name})의 패스 능력치(${cmPas}) 비례 공격권 획득 확률 <span style="color:#ffd700; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
            }
        } else if (formation === '3-4-3') {
            const cmCardId = squad['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId, deck).stats && getAwakenedCard(cmCardId, deck).stats.dri >= 80;
            const avgPac = getTeamAverageStat('pac', squad, deck);
            hasTeamTactic = avgPac >= 70;

            if (hasKeyPlayer && hasTeamTactic) {
                const cmDri = getAwakenedCard(cmCardId, deck).stats.dri;
                formationAttackBoost = (cmDri - 80) * 0.005;
                formationTacticDetailsHtml = `🌀 <strong>[3-4-3 스위칭 완성]</strong> 핵심 CM(${getAwakenedCard(cmCardId, deck).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00ff87; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
            }
        } else if (formation === '5-4-1') {
            const lwCardId = squad['LW'];
            const rwCardId = squad['RW'];
            let lwPac = 0;
            let rwPac = 0;

            if (lwCardId) {
                const card = getAwakenedCard(lwCardId, deck);
                if (card && card.stats && card.stats.pac >= 80) {
                    hasKeyPlayer = true;
                    lwPac = card.stats.pac;
                }
            }
            if (rwCardId) {
                const card = getAwakenedCard(rwCardId, deck);
                if (card && card.stats && card.stats.pac >= 80) {
                    hasKeyPlayer = true;
                    rwPac = card.stats.pac;
                }
            }

            const avgDef = getTeamAverageStat('def', squad, deck);
            hasTeamTactic = avgDef >= 60;

            if (hasKeyPlayer && hasTeamTactic) {
                const bestPac = Math.max(lwPac, rwPac);
                formationScoreBoost = (bestPac - 80) * 0.005;
                formationTacticDetailsHtml = `⚡ <strong>[5-4-1 역습 완성]</strong> 에이스 윙어 최고속도(${bestPac}) 비례 득점 성공 확률 <span style="color:#ff3e6c; font-weight:800;">+${(formationScoreBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
            }
        } else if (formation === '4-2-3-1') {
            const cmCardId = squad['CM'];
            hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId, deck).stats && getAwakenedCard(cmCardId, deck).stats.dri >= 80;
            const avgDri = getTeamAverageStat('dri', squad, deck);
            hasTeamTactic = avgDri >= 70;

            if (hasKeyPlayer && hasTeamTactic) {
                const cmDri = getAwakenedCard(cmCardId, deck).stats.dri;
                formationAttackBoost = (cmDri - 80) * 0.005;
                formationTacticDetailsHtml = `⚽ <strong>[4-2-3-1 점유율 완성]</strong> 핵심 AM(${getAwakenedCard(cmCardId, deck).name})의 드리블 능력치(${cmDri}) 비례 공격권 획득 확률 <span style="color:#00d2fc; font-weight:800;">+${(formationAttackBoost * 100).toFixed(1)}%</span> 부스트 탑재!`;
            }
        }

        if (hasKeyPlayer) formationBonus += 1;
        if (hasTeamTactic) formationBonus += 1;
    }

    return {
        formationAttackBoost,
        formationScoreBoost,
        formationTacticDetailsHtml,
        formationBonus,
        hasKeyPlayer,
        hasTeamTactic
    };
}

// 2b. 플레이어의 세부전술 및 전술 적합도 보너스 계산
function getPlayerDetailedTacticBonuses(formation = currentFormation, squad = squadFormation, deck = playerDeck) {
    let detailedTacticBonus = 0;
    let suitabilityBonus = 0;
    let detailedTacticLabel = "";
    let suitabilityLabel = "";

    if (typeof formation !== 'undefined') {
        if (formation === '4-3-3') {
            const stCardId = squad['ST'];
            const isDetailedActive = stCardId && getAwakenedCard(stCardId, deck).stats && getAwakenedCard(stCardId, deck).stats.phy >= 80;
            if (isDetailedActive) {
                detailedTacticBonus = 0.05;
                detailedTacticLabel = ` [세부전술: 타겟맨 활성 (+5.0%)]`;
            }
            const avgPas = getTeamAverageStat('pas', squad, deck);
            suitabilityBonus = Math.max(0, (avgPas - 70) * 0.005);
            if (suitabilityBonus > 0) {
                suitabilityLabel = ` [전술적합(PAS): +${(suitabilityBonus * 100).toFixed(1)}%]`;
            }
        } else if (formation === '3-4-3') {
            let fastAttackersCount = 0;
            const attackers = ["LW", "ST", "RW"];
            attackers.forEach(pos => {
                const cardId = squad[pos];
                if (cardId && getAwakenedCard(cardId, deck).stats && getAwakenedCard(cardId, deck).stats.pac >= 90) {
                    fastAttackersCount++;
                }
            });
            const isDetailedActive = fastAttackersCount >= 2;
            if (isDetailedActive) {
                detailedTacticBonus = 0.05;
                detailedTacticLabel = ` [세부전술: 전방압박 활성 (+5.0%)]`;
            }
            const avgPac = getTeamAverageStat('pac', squad, deck);
            suitabilityBonus = Math.max(0, (avgPac - 70) * 0.005);
            if (suitabilityBonus > 0) {
                suitabilityLabel = ` [전술적합(PAC): +${(suitabilityBonus * 100).toFixed(1)}%]`;
            }
        } else if (formation === '5-4-1') {
            let passDefendersCount = 0;
            const defenders = ["LB", "LCB", "CM", "RCB", "RB"];
            defenders.forEach(pos => {
                const cardId = squad[pos];
                if (cardId && CARDS_DATABASE[cardId]) {
                    const card = getAwakenedCard(cardId, deck);
                    const isRealDefender = ['CB', 'LB', 'RB'].includes(card.position);
                    if (isRealDefender && card.stats && card.stats.pas >= 80) {
                        passDefendersCount++;
                    }
                }
            });
            const isDetailedActive = passDefendersCount >= 1;
            if (isDetailedActive) {
                detailedTacticBonus = 0.05;
                detailedTacticLabel = ` [세부전술: 다이렉트 패스 활성 (+5.0%)]`;
            }
            const avgDef = getTeamAverageStat('def', squad, deck);
            suitabilityBonus = Math.max(0, (avgDef - 60) * 0.005);
            if (suitabilityBonus > 0) {
                suitabilityLabel = ` [전술적합(DEF): +${(suitabilityBonus * 100).toFixed(1)}%]`;
            }
        } else if (formation === '4-2-3-1') {
            let passMidfieldersCount = 0;
            const midfielders = ["LCM", "CM", "RCM"];
            midfielders.forEach(pos => {
                const cardId = squad[pos];
                if (cardId && getAwakenedCard(cardId, deck).stats && getAwakenedCard(cardId, deck).stats.pas >= 83) {
                    passMidfieldersCount++;
                }
            });
            const isDetailedActive = passMidfieldersCount === 3;
            if (isDetailedActive) {
                detailedTacticBonus = 0.05;
                detailedTacticLabel = ` [세부전술: 티키타카 활성 (+5.0%)]`;
            }
            const avgDri = getTeamAverageStat('dri', squad, deck);
            suitabilityBonus = Math.max(0, (avgDri - 70) * 0.005);
            if (suitabilityBonus > 0) {
                suitabilityLabel = ` [전술적합(DRI): +${(suitabilityBonus * 100).toFixed(1)}%]`;
            }
        }
    }

    return {
        detailedTacticBonus,
        suitabilityBonus,
        detailedTacticLabel,
        suitabilityLabel
    };
}

// 2c. 친선경기 상대(AI)의 포메이션 OVR 보너스 수치 계산
function getOpponentFormationTacticStatus(opponentData) {
    if (!opponentData) return 0;
    
    const formation = opponentData.squadFormation || {};
    const deck = opponentData.playerDeck || {};
    const currentFormation = opponentData.currentFormation || '4-4-2';
    
    let hasKeyPlayer = false;
    let hasTeamTactic = false;
    
    const getOpponentAwakenedCardLocal = (cardId) => {
        if (!cardId || !CARDS_DATABASE[cardId]) return null;
        const cardCopy = JSON.parse(JSON.stringify(CARDS_DATABASE[cardId]));
        if (deck && deck[cardId]) {
            const level = deck[cardId].awakening || 0;
            cardCopy.rating += level;
        }
        return cardCopy;
    };
    
    const getOpponentTeamAverageStatLocal = (statKey) => {
        let totalStat = 0;
        TACTICAL_POSITIONS.forEach(pos => {
            const cardId = formation[pos];
            const card = getOpponentAwakenedCardLocal(cardId);
            if (card && card.stats && card.stats[statKey] !== undefined) {
                totalStat += card.stats[statKey];
            } else {
                totalStat += 50;
            }
        });
        return Math.round(totalStat / 11);
    };
    
    if (currentFormation === '4-3-3') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCardLocal(cmCardId);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.pas >= 80;
        const avgPas = getOpponentTeamAverageStatLocal('pas');
        hasTeamTactic = avgPas >= 70;
    } else if (currentFormation === '3-4-3') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCardLocal(cmCardId);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.dri >= 80;
        const avgPac = getOpponentTeamAverageStatLocal('pac');
        hasTeamTactic = avgPac >= 70;
    } else if (currentFormation === '5-4-1') {
        const lwCardId = formation['LW'];
        const rwCardId = formation['RW'];
        const lwCard = getOpponentAwakenedCardLocal(lwCardId);
        const rwCard = getOpponentAwakenedCardLocal(rwCardId);
        if (lwCard && lwCard.stats && lwCard.stats.pac >= 80) hasKeyPlayer = true;
        if (rwCard && rwCard.stats && rwCard.stats.pac >= 80) hasKeyPlayer = true;
        const avgDef = getOpponentTeamAverageStatLocal('def');
        hasTeamTactic = avgDef >= 60;
    } else if (currentFormation === '4-2-3-1') {
        const cmCardId = formation['CM'];
        const cmCard = getOpponentAwakenedCardLocal(cmCardId);
        hasKeyPlayer = cmCard && cmCard.stats && cmCard.stats.dri >= 80;
        const avgDri = getOpponentTeamAverageStatLocal('dri');
        hasTeamTactic = avgDri >= 70;
    }
    
    let formationBonus = 0;
    if (currentFormation !== '4-4-2') {
        if (hasKeyPlayer) formationBonus += 1;
        if (hasTeamTactic) formationBonus += 1;
    }
    
    return formationBonus;
}

/**
 * 플레이어 포메이션과 상대팀 포메이션 간의 상성을 비교하여 찬스 확률 보너스를 반환합니다.
 * 3-4-3 > 4-3-3 > 5-4-1 > 4-2-3-1 > 3-4-3 순으로 상성 우세가 적용됩니다.
 * @param {string} playerForm 플레이어 포메이션 (예: "3-4-3")
 * @param {string} oppForm 상대팀 포메이션 (예: "4-3-3")
 * @returns {number} 찬스 확률 보너스 (+0.05, -0.05, 또는 0)
 */
function getFormationCompatibilityBonus(playerForm, oppForm) {
    if (!playerForm || !oppForm) return 0;
    
    const pForm = playerForm.trim();
    const oForm = oppForm.trim();
    
    if (pForm === oForm) return 0;
    
    const compatibility = {
        '3-4-3': '4-3-3',
        '4-3-3': '5-4-1',
        '5-4-1': '4-2-3-1',
        '4-2-3-1': '3-4-3'
    };
    
    if (compatibility[pForm] === oForm) {
        return 0.10; // 플레이어 우세 (+10% 찬스)
    } else if (compatibility[oForm] === pForm) {
        return -0.10; // 상대 우세 (-10% 찬스)
    }
    
    return 0; // 상성 없음 (4-4-2 등)
}

// 상대팀 분위기 글로벌 상태 및 제어 변수/함수
let currentOpponentMood = null;
let lastOpponentMood = null;

function prepareOpponentMood(opponentId) {
    if (currentOpponentMood && currentOpponentMood.opponentId === opponentId) {
        return currentOpponentMood;
    }
    const moods = [
        { modifier: 1, label: "최상", emoji: "😆" },
        { modifier: 1, label: "좋음", emoji: "🙂" },
        { modifier: 0, label: "보통", emoji: "😐" },
        { modifier: -1, label: "저조", emoji: "😕" },
        { modifier: -1, label: "최악", emoji: "😢" }
    ];
    const rolled = moods[Math.floor(Math.random() * moods.length)];
    currentOpponentMood = {
        opponentId: opponentId,
        modifier: rolled.modifier,
        label: rolled.label,
        emoji: rolled.emoji
    };
    return currentOpponentMood;
}

// 2d. 최종 매치 OVR 통합 연산 (홈어드밴티지 및 친선전 유도 포함)
function calculateFinalMatchOvrs(venueType, isPlayerHome, opponentBaseOvr, isFriendlyMode = false, opponentData = null) {
    let playerOvr = getPlayerPureOvr();
    let opponentOvr = opponentBaseOvr;
    
    // 리그 모드인 경우에만 상대팀 분위기 보정 적용
    if (venueType === 'league' && currentOpponentMood) {
        opponentOvr += currentOpponentMood.modifier;
        lastOpponentMood = currentOpponentMood; // 코멘터리용 백업
        currentOpponentMood = null; // 사용 완료 후 즉시 소비
    } else {
        lastOpponentMood = null;
    }
    
    if (!isFriendlyMode) {
        // 리그와 컵 모드는 포메이션 OVR 완성 보너스 적용
        const formTactic = getPlayerFormationTacticBonuses();
        playerOvr += formTactic.formationBonus;
    }
    
    if (venueType === 'league') {
        if (isPlayerHome) {
            playerOvr += 2;
        } else {
            opponentOvr += 2;
        }
    }
    
    // 최종 매치 상대팀 OVR 최대 92 제한
    opponentOvr = Math.min(opponentOvr, 92);
    
    return { playerOvr, opponentOvr };
}

// 3. 포메이션 세부 전술 연동 매치 코멘터리 생성 (리그 & 친선경기 시뮬레이터 공용)
function getDetailedTacticCommentary(option, formation, isTacticActive, activePlayers, squad = squadFormation, deck = playerDeck) {
    lastTacticGoalData = null; // Reset for each new commentary evaluation
    const { ST, LW, RW, CM } = activePlayers;
    
    let eventDesc = "";
    let eventGoal = "";
    let eventFail = "";
    
    const lwGoals = [
        `골!!! ${LW}의 환상적인 감아차기 슛이 골문 오른쪽 구석에 정확히 꽂힙니다! 전북 득점!! 🎉`,
        `골!!! 수비수 2명을 환상적인 스피드로 허문 ${LW}! 키퍼 가랑이 사이를 꿰뚫는 절묘한 슈팅으로 골망을 흔듭니다! ⚽`
    ];
    const selectedLwGoal = lwGoals[Math.floor(Math.random() * lwGoals.length)];
    
    if (option === 0) {
        eventDesc = `${LW} 선수가 폭발적인 속도로 왼쪽 측면을 흔듭니다! 수비수를 제치고 강력하게 슛!`;
        eventGoal = selectedLwGoal;
        eventFail = `아아! 마지막 순간 상대 수비수의 육탄 방어에 가로막히며 코너킥으로 연결됩니다.`;
    } else if (option === 1) {
        eventDesc = `전방에서 강한 압박으로 공을 탈취한 ${ST}! 일대일 단독 찬스에 직면하여 슛 시도!`;
        eventGoal = `골!!! ${ST}가 침착하게 골키퍼 키를 넘기는 칩슛으로 골망을 흔듭니다! 그림 같은 선제골! ⚽`;
        eventFail = `앗! 슛이 너무 강했습니다. 크로스바를 살짝 빗나가며 아쉬움을 삼킵니다.`;
    } else if (option === 2) {
        eventDesc = `${CM} 선수의 창의적인 킬패스가 배후 공간을 무력화시킵니다! 뛰어 들어가는 ${RW}! 슛!`;
        eventGoal = `골!!! ${RW}가 몸을 날리는 멋진 발리 슛으로 골을 선사합니다! 멋진 팀워크 플레이! 🥳`;
        eventFail = `키퍼의 슈퍼세이브! 상대 수문장이 온몸으로 막아내며 아쉬운 득점 찬스가 무산됩니다.`;
    } else if (option === 5) {
        eventDesc = `[4-2-3-1 점유 지배] 플레이메이커 ${CM}(AM)가 화려한 탈압박과 시그니처 드리블로 상대 수비진 3명을 요리조리 벗겨내고 문전 앞 에이스에게 스루패스!`;
        eventGoal = `골!!! 에이스 ${CM}의 지휘 아래 그라운드를 완전히 지배하며 뽑아낸 아름다운 조직력의 승리골입니다! ⚽`;
        eventFail = `오프사이드 판정! 골망은 흔들었으나 간발의 차이로 선심의 깃발이 올라가며 아쉬운 간접 프리킥이 선언됩니다.`;
    }
    
    if (isTacticActive && Math.random() < 0.5) {
        if (formation === '4-3-3') {
            if (option === 1) {
                eventDesc = `압도적인 하드웨어를 가진 최전방의 ${ST}(이/가) 공중볼 경합에서 상대 센터백과의 강한 몸싸움을 거뜬히 이겨내고, 완벽한 포스트 플레이 후 터닝 발리 슛!`;
                eventGoal = `골!!! ${ST}의 파괴적인 피지컬이 진가를 발휘합니다! 수비를 등진 상태에서 우직하게 버틴 후 골대 구석을 강타하는 묵직한 쐐기골 작렬! ⚽`;
                eventFail = `아아! 피지컬로 수비를 힘으로 제압했으나, 골문을 아슬아슬하게 비껴 나가는 헤더 슛에 관중들이 머리를 감싸 쥡니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad["ST"] || null,
                    scorerName: ST,
                    assisterId: null,
                    assisterName: null
                };
            } else if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                const wingerPos = option === 0 ? "LW" : "RW";
                eventDesc = `측면에서 ${activeWinger}(이/가) 문전을 향해 높고 날카로운 크로스 장전! 박스 중앙에서 거구의 ${ST}(이/가) 압도적인 타점으로 솟구쳐 오릅니다!`;
                eventGoal = `골!!! ${ST}의 완벽한 고공 폭격! 상대 골키퍼가 꼼짝도 못 하는 괴물 같은 헤더 슈팅으로 골망을 시원하게 흔듭니다! ⚽`;
                eventFail = `아! 헤더 경합에는 성공했지만 골키퍼가 엄청난 반사신경으로 쳐내며 득점으로 연결되진 못합니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad["ST"] || null,
                    scorerName: ST,
                    assisterId: squad[wingerPos] || null,
                    assisterName: activeWinger
                };
            }
        } else if (formation === '3-4-3') {
            if (option === 1) {
                eventDesc = `쾌속 공격진 ${LW}와 ${RW}의 미친 듯한 스프린트 압박! 당황해 횡패스 실수를 범한 상대 수비진의 공을 ${ST}(이/가) 번개처럼 가로채 단독 1대1 찬스를 잡습니다!`;
                eventGoal = `골!!! 전술적인 전방 압박의 완벽한 결실! ${ST}(이/가) 뛰쳐나온 키퍼의 옆을 가볍게 지나쳐 골망 흔들기에 성공합니다! ⚽`;
                eventFail = `아! 너무 온 힘을 다해 압박 스피드를 올렸던 탓일까요, 슈팅 순간 밸런스가 무너지며 골대 위로 솟구칩니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad["ST"] || null,
                    scorerName: ST,
                    assisterId: null,
                    assisterName: null
                };
            } else if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                const wingerPos = option === 0 ? "LW" : "RW";
                eventDesc = `최전방 압박으로 탈취한 공이 단숨에 빈 공간으로 연결됩니다! 시속 90 이상의 무시무시한 주력으로 질주하는 ${activeWinger}의 총알 같은 침투 슛!`;
                eventGoal = `골!!! 수비수가 따라잡을 엄두조차 내지 못한 역대급 속도전! ${activeWinger}의 번개 같은 니어포스트 슈팅이 꽂힙니다! ⚽`;
                eventFail = `상대 골키퍼가 각도를 좁히며 몸으로 가까스로 블로킹! 질식할 듯한 속도전이었으나 아쉽게 무산됩니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad[wingerPos] || null,
                    scorerName: activeWinger,
                    assisterId: null,
                    assisterName: null
                };
            }
        } else if (formation === '5-4-1') {
            let passDefenderId = null;
            let passDefenderName = null;
            let maxPas = -1;
            
            const defPositions = ["LB", "LCB", "CM", "RCB", "RB"];
            defPositions.forEach(pos => {
                const cardId = squad[pos];
                if (cardId && CARDS_DATABASE[cardId]) {
                    const card = getAwakenedCard(cardId, deck);
                    const isRealDefender = ['CB', 'LB', 'RB'].includes(card.position);
                    if (isRealDefender && card.stats && card.stats.pas >= 80) {
                        if (card.stats.pas > maxPas) {
                            maxPas = card.stats.pas;
                            passDefenderId = cardId;
                            passDefenderName = card.name;
                        }
                    }
                }
            });
            
            const defenderLabel = passDefenderName || "수비수";
 
            if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                const wingerPos = option === 0 ? "LW" : "RW";
                eventDesc = `수비 라인 깊숙한 곳에서 패스 장인 수비수 ${defenderLabel}가 배후 공간을 완전히 열어젖히는 낮고 정교한 다이렉트 롱 패스를 뿌립니다! 수비 라인을 무력화하며 수신한 ${activeWinger}의 슛!`;
                eventGoal = `골!!! 한 번의 패스로 경기장 전체를 종으로 갈랐습니다! ${activeWinger}의 절묘한 논스톱 발리 슛이 구석에 꽂히며 원더골이 완성됩니다! ⚽`;
                eventFail = `골포스트 강타! 수비진을 붕괴시킨 대단한 롱 패스와 슛이었으나 골대를 때리고 나오며 탄성을 자아냅니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad[wingerPos] || null,
                    scorerName: activeWinger,
                    assisterId: passDefenderId,
                    assisterName: passDefenderName
                };
            } else if (option === 1) {
                eventDesc = `상대 공격을 커트하자마자 수비진의 ${defenderLabel}에서 최전방의 ${ST}를 겨냥해 거리를 다이렉트로 관통하는 레이저 패스 배송! 하프라인을 넘는 카운터 시작!`;
                eventGoal = `골!!! 패스 한 번에 완전 오프사이드 트랩이 해체되었습니다! ${ST}(이/가) 침착하게 골망 흔들기에 성공하며 역습의 마침표를 찍습니다! ⚽`;
                eventFail = `아아! 패스가 살짝 길어 골키퍼가 먼저 슬라이딩하며 잡아내어 역습 찬스가 아쉽게 소멸됩니다.`;
                lastTacticGoalData = {
                    option: option,
                    scorerId: squad["ST"] || null,
                    scorerName: ST,
                    assisterId: passDefenderId,
                    assisterName: passDefenderName
                };
            }
        } else if (formation === '4-2-3-1') {
            if (option === 5 || option === 1) {
                eventDesc = `평균 패스 83 이상의 미드필더 삼총사가 좁은 공간에서 환상적인 삼각 패스와 극상의 원터치 연계로 상대를 유인한 후, 플레이메이커 ${CM}의 가랑이를 꿰뚫는 스루패스!`;
                eventGoal = `골!!! 패스 마술사들의 완벽한 그라운드 지배! 촘촘히 엮어 짜낸 조직적인 패스 콤비네이션이 기어코 완벽한 작품 골을 빚어냅니다! ⚽`;
                eventFail = `앗! 완벽한 패스워크의 끝에 마지막 슈팅이 상대 수비수의 필사적인 슬라이딩 태클에 굴절되며 아웃됩니다.`;
                
                if (option === 1) {
                    lastTacticGoalData = {
                        option: option,
                        scorerId: squad["ST"] || null,
                        scorerName: ST,
                        assisterId: squad["CM"] || null,
                        assisterName: CM
                    };
                } else if (option === 5) {
                    const rand = Math.random();
                    let scorerPos = "ST";
                    let scorerName = ST;
                    if (rand < 0.6) {
                        scorerPos = "ST";
                        scorerName = ST;
                    } else if (rand < 0.8) {
                        scorerPos = "LW";
                        scorerName = LW;
                    } else {
                        scorerPos = "RW";
                        scorerName = RW;
                    }
                    lastTacticGoalData = {
                        option: option,
                        scorerId: squad[scorerPos] || null,
                        scorerName: scorerName,
                        assisterId: squad["CM"] || null,
                        assisterName: CM
                    };
                }
            }
        }
    }
    
    return { eventDesc, eventGoal, eventFail };
}

// 4. 경기 진행 관련 상황별 코멘터리를 중앙 관리하는 엔진 함수
function getMatchEventCommentary(type, data, isFriendly = false, isDevMode = false) {
    const {
        playerOvr = 70,
        opponentName = "상대팀",
        opponentOvr = 70,
        isPlayerHome = true,
        playerScoreVal = 0,
        opponentScoreVal = 0,
        activeGk = "무명 골키퍼",
        detailedTacticLabel = "",
        suitabilityLabel = "",
        playerAttackProb = 0.5,
        compatibilityBonus = 0
    } = data || {};

    if (type === 'PRE_ANALYZE') {
        if (isFriendly) {
            return `⚽ 🤝 친선 경기 매칭 전력 분석 | 나의 구단 OVR ${playerOvr} vs 상대 ${opponentName} OVR ${opponentOvr} (홈 ADV: 0)`;
        } else {
            let moodText = "";
            if (lastOpponentMood) {
                const modifierSign = lastOpponentMood.modifier > 0 ? `+${lastOpponentMood.modifier}` : (lastOpponentMood.modifier < 0 ? `${lastOpponentMood.modifier}` : '0');
                moodText = ` [상대 분위기: ${lastOpponentMood.label} ${lastOpponentMood.emoji} OVR ${modifierSign}]`;
            }
            return `경기 시작 전력 분석 | 전북 OVR ${playerOvr} (${isPlayerHome ? '홈' : '원정'}) vs ${opponentName} OVR ${opponentOvr}${moodText}`;
        }
    }

    if (type === 'TACTIC_ANALYZE') {
        let compatibilityText = "";
        if (compatibilityBonus > 0) {
            compatibilityText = " [포메이션 상성 우세: 찬스 확률 +5.0% ⚡]";
        } else if (compatibilityBonus < 0) {
            compatibilityText = " [포메이션 상성 열세: 찬스 확률 -5.0% ⚠️]";
        }
        return `⚙️ <strong>[세부 전술 및 적합 분석]</strong>${detailedTacticLabel}${suitabilityLabel}${compatibilityText} 반영 완료! (공격 찬스 확률: ${Math.round(playerAttackProb * 100)}%)`;
    }

    if (type === 'KICKOFF') {
        if (isFriendly) {
            if (isDevMode) {
                return `주심의 힘찬 휘슬 소리와 함께 친선 경기가 시작됩니다! 양 팀 당찬 표정으로 첫 그라운드를 밟습니다.`;
            } else {
                return `주심의 킥오프 휘슬 소리와 함께 친선 경기가 개시됩니다!`;
            }
        } else {
            return `주심의 힘찬 휘슬 소리와 함께 전반전 경기가 시작됩니다! 양 팀 조심스러운 탐색전이 이어집니다.`;
        }
    }

    if (type === 'HALFTIME') {
        if (isFriendly) {
            if (isDevMode) {
                return `치열한 공방 끝 전반전이 종료되었습니다. 스코어 ${playerScoreVal} - ${opponentScoreVal}`;
            } else {
                return `치열했던 전반전 종료. 현재 스코어 ${playerScoreVal} - ${opponentScoreVal} 양 팀 휴식에 들어갑니다.`;
            }
        } else {
            return `치열했던 전반전 경기가 마무리됩니다. 라커룸으로 향하는 선수들. 현재 스코어 ${isPlayerHome ? playerScoreVal : opponentScoreVal} - ${isPlayerHome ? opponentScoreVal : playerScoreVal}`;
        }
    }

    if (type === 'FULLTIME') {
        if (isFriendly) {
            return `삐- 삐- 삐--! 주심의 경기 종료 휘슬 소리와 함께 친선 경기가 종료됩니다!`;
        } else {
            return `삐- 삐- 삐--! 경기 종료! 양 팀 피땀 흘린 치열한 승부가 마침내 막을 내립니다!`;
        }
    }

    if (type === 'RESULT') {
        const isWinner = playerScoreVal > opponentScoreVal;
        const isDraw = playerScoreVal === opponentScoreVal;
        if (isFriendly) {
            if (isWinner) {
                return `승리!!! 나의 구단이 완벽한 전술 제어로 상대 ${opponentName}를 ${playerScoreVal} - ${opponentScoreVal}로 제압합니다! 🏆`;
            } else if (isDraw) {
                return `무승부! 접전 끝에 양 팀 ${playerScoreVal} - ${opponentScoreVal} 스코어로 승부를 가리지 못했습니다.`;
            } else {
                return `패배! 상대 ${opponentName}의 화력에 수비 벽이 뚫려 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 패배를 맛봅니다.`;
            }
        } else {
            if (isWinner) {
                return `승리!!! 전북 현대가 완벽한 전술 장악과 에이스들의 빛나는 골 활약에 힘입어 ${playerScoreVal} - ${opponentScoreVal} 짜릿한 승리를 챙깁니다! 🏆`;
            } else if (isDraw) {
                return `무승부! 양 팀 승부를 가리지 못하며 ${playerScoreVal} - ${opponentScoreVal} 로 승점 1점씩 나누어 가집니다. 다음 라운드 반등을 노립니다.`;
            } else {
                return `패배! 전북 현대가 분전했으나 상대의 기습 카운터 공격을 넘지 못하며 ${playerScoreVal} - ${opponentScoreVal} 아쉬운 승점 3점을 내줍니다. 피드백이 필요합니다.`;
            }
        }
    }

    if (type === 'OPP_ATTACK') {
        if (isFriendly) {
            return `상대팀 ${opponentName}가 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`;
        } else {
            return `상대팀이 중원에서 패스워크를 맞추며 우리 진영을 위협합니다. 문전 앞 혼전 상황!`;
        }
    }

    if (type === 'OPP_GOAL') {
        const { opponentScorerName, opponentAssisterName } = data || {};
        const scorerText = opponentScorerName ? `상대팀 <strong>[${opponentScorerName}]</strong>` : "상대 공격수";
        const assistText = opponentAssisterName ? ` (도움: <strong>${opponentAssisterName}</strong>)` : "";
        return `실점! ${scorerText}의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.${assistText} ⚽`;
    }

    if (type === 'GK_SAVE') {
        const gkSaveTexts = [
            `${activeGk} 골키퍼의 빛나는 판단력! 침착하게 날아오는 크로스를 캐칭해 냅니다. 위기를 넘깁니다!`,
            `미친 세이브!!! 전북의 수호신 ${activeGk} 골키퍼가 한 마리 새처럼 날아올라 손끝으로 공을 쳐냅니다! 전주성이 열광의 도가니에 빠집니다! 🧤`
        ];
        return gkSaveTexts[Math.floor(Math.random() * gkSaveTexts.length)];
    }

    return "";
}

// 5. 공통 연장전 시뮬레이션 엔진
function simulateExtraTimeEngine(data) {
    const {
        team1Name = "홈팀",
        team2Name = "원정팀",
        rating1 = 70,
        rating2 = 70,
        score1 = 0,
        score2 = 0,
        playerScorerName = "이승우",
        playerAssisterName = "송민규",
        isTeam1Jeonbuk = true,
        opponentTeamId = null
    } = data;
    
    let etScore1 = score1;
    let etScore2 = score2;
    const etEvents = [];
    
    etEvents.push({ min: "91'", type: "system", text: "연장 전반전이 킥오프됩니다. 체력의 한계를 넘어선 마지막 30분의 혈투가 시작됩니다!" });
    
    const diff = rating1 - rating2;
    let prob1, prob2;
    if (isTeam1Jeonbuk) {
        prob1 = 0.35 + (diff * 0.01); // 플레이어 (기본 35%)
        prob2 = 0.30 - (diff * 0.01); // 상대방 (기본 30%)
    } else {
        prob1 = 0.30 + (diff * 0.01); // 상대방 (기본 30%)
        prob2 = 0.35 - (diff * 0.01); // 플레이어 (기본 35%)
    }
    
    const p1Scored = Math.random() < Math.max(0.05, Math.min(prob1, 0.5));
    const p2Scored = Math.random() < Math.max(0.05, Math.min(prob2, 0.5));
    
    // 상대팀 주요 선수 정보 획득
    let oppScorerName = isTeam1Jeonbuk ? `${team2Name} 공격수` : `${team1Name} 공격수`;
    let oppAssisterName = null;
    if (opponentTeamId) {
        const oppGoalData = determineOpponentScorerAndAssister(opponentTeamId);
        oppScorerName = oppGoalData.scorerName;
        oppAssisterName = oppGoalData.assisterName;
    }
    
    const scorer1 = isTeam1Jeonbuk ? playerScorerName : oppScorerName;
    const scorer2 = !isTeam1Jeonbuk ? playerScorerName : oppScorerName;

    if (p1Scored) {
        etScore1++;
        const assisterText = (!isTeam1Jeonbuk && oppAssisterName) ? ` (도움: <strong>${oppAssisterName}</strong>)` : (isTeam1Jeonbuk && playerAssisterName ? ` (도움: <strong>${playerAssisterName}</strong>)` : "");
        etEvents.push({
            min: "103'",
            type: "goal",
            side: "team1",
            text: `[골!!!] 연장 전반 극적인 득점! ${team1Name}의 <strong>${scorer1}</strong>가 혼신을 다한 논스톱 슈팅으로 그물을 가릅니다!${assisterText}`,
            score1: etScore1,
            score2: etScore2,
            scorerName: scorer1,
            assisterName: isTeam1Jeonbuk ? playerAssisterName : oppAssisterName
        });
    } else {
        etEvents.push({
            min: "103'",
            type: "attack",
            side: "team1",
            text: `${team1Name}의 <strong>${scorer1}</strong>가 아크 정면에서 과감한 슈팅을 시도했으나, 상대 골키퍼의 손끝에 맞고 아슬아슬하게 골대 밖으로 빗나갑니다.`,
            score1: etScore1,
            score2: etScore2
        });
    }
    
    etEvents.push({ min: "105'", type: "system", text: "연장 전반전 종료. 코트 교대 후 곧바로 후반전으로 이어집니다." });
    
    if (p2Scored) {
        etScore2++;
        const assisterText = (isTeam1Jeonbuk && oppAssisterName) ? ` (도움: <strong>${oppAssisterName}</strong>)` : (!isTeam1Jeonbuk && playerAssisterName ? ` (도움: <strong>${playerAssisterName}</strong>)` : "");
        etEvents.push({
            min: "115'",
            type: "goal",
            side: "team2",
            text: `[골!!!] 연장 후반 극적인 골! ${team2Name}의 <strong>${scorer2}</strong>가 페널티 에어리어에서 날카로운 슈팅으로 수비 벽을 뚫어내며 승부를 바꿉니다!${assisterText}`,
            score1: etScore1,
            score2: etScore2,
            scorerName: scorer2,
            assisterName: !isTeam1Jeonbuk ? playerAssisterName : oppAssisterName
        });
    } else {
        etEvents.push({
            min: "115'",
            type: "attack",
            side: "team2",
            text: `${team2Name}의 <strong>${scorer2}</strong>가 회심의 크로스 공격을 전개하여 헤더 슛까지 연결했으나, 상대 수비수들의 집중 견제에 막혀 무산됩니다.`,
            score1: etScore1,
            score2: etScore2
        });
    }
    
    etEvents.push({ min: "120'", type: "system", text: "연장전 120분이 종료되었습니다!" });
    
    return {
        score1: etScore1,
        score2: etScore2,
        events: etEvents
    };
}

// 6. 공통 승부차기 시뮬레이션 엔진
function simulatePenaltyShootoutEngine(data) {
    const {
        team1Name = "홈팀",
        team2Name = "원정팀",
        rating1 = 70,
        rating2 = 70,
        isTeam1Jeonbuk = true
    } = data;
    
    const pkEvents = [];
    pkEvents.push({ round: 0, type: "system", text: "승부차기(PK)가 시작됩니다! 골문 앞 키커와 골키퍼의 피 말리는 1대1 심리전이 펼쳐집니다." });
    
    let pkScore1 = 0;
    let pkScore2 = 0;
    let rounds = 5;
    
    // 일괄적으로 우리팀(전북 현대) 성공 확률 70%, 상대팀 성공 확률 60% 적용
    const prob1 = isTeam1Jeonbuk ? 0.70 : 0.60;
    const prob2 = isTeam1Jeonbuk ? 0.60 : 0.70;
    
    for (let r = 1; r <= rounds; r++) {
        const success1 = Math.random() < prob1;
        const success2 = Math.random() < prob2;
        
        if (success1) pkScore1++;
        pkEvents.push({
            round: r,
            side: "team1",
            success: success1,
            score1: pkScore1,
            score2: pkScore2,
            text: success1 ? `[O] ${team1Name} ${r}번 키커: 깔끔하게 골대 구석으로 차 넣으며 성공시킵니다!` : `[X] ${team1Name} ${r}번 키커: 실축! 슈팅이 골키퍼 선방에 걸리고 맙니다!`
        });
        
        if (success2) pkScore2++;
        pkEvents.push({
            round: r,
            side: "team2",
            success: success2,
            score1: pkScore1,
            score2: pkScore2,
            text: success2 ? `[O] ${team2Name} ${r}번 키커: 골키퍼의 타이밍을 빼앗으며 침착하게 밀어 넣습니다!` : `[X] ${team2Name} ${r}번 키커: 실축! 골대를 강타하며 실축합니다!`
        });
    }
    
    let sdRound = 6;
    while (pkScore1 === pkScore2) {
        const success1 = Math.random() < prob1;
        const success2 = Math.random() < prob2;
        
        if (success1) pkScore1++;
        pkEvents.push({
            round: sdRound,
            side: "team1",
            success: success1,
            score1: pkScore1,
            score2: pkScore2,
            text: success1 ? `[O] ${team1Name} ${sdRound}번 키커: 성공! 침착함을 유지합니다.` : `[X] ${team1Name} ${sdRound}번 키커: 실축! 긴장한 기색이 역력했던 슛이 빗나갑니다.`
        });
        
        if (success2) pkScore2++;
        pkEvents.push({
            round: sdRound,
            side: "team2",
            success: success2,
            score1: pkScore1,
            score2: pkScore2,
            text: success2 ? `[O] ${team2Name} ${sdRound}번 키커: 성공! 골문 구석을 관통합니다.` : `[X] ${team2Name} ${sdRound}번 키커: 실축! 골키퍼의 기막힌 펀칭 세이브!`
        });
        
        sdRound++;
        if (sdRound > 20) break; // 무한루프 방지 안전장치
    }
    
    return {
        pkScore1: pkScore1,
        pkScore2: pkScore2,
        winner: pkScore1 > pkScore2 ? "team1" : "team2",
        events: pkEvents
    };
}

let lastTacticGoalData = null;

// 7. 공격 옵션별 동적 득점자/도움자 판정 함수
function determineScorerAndAssister(selectedOption, squad = squadFormation) {
    if (lastTacticGoalData && lastTacticGoalData.option === selectedOption) {
        const data = {
            scorerId: lastTacticGoalData.scorerId,
            scorerName: lastTacticGoalData.scorerName,
            assisterId: lastTacticGoalData.assisterId,
            assisterName: lastTacticGoalData.assisterName
        };
        lastTacticGoalData = null;
        return data;
    }
    lastTacticGoalData = null; // Clear if it doesn't match
    const activeST = (typeof squad !== 'undefined' && squad["ST"] && CARDS_DATABASE[squad["ST"]]) ? CARDS_DATABASE[squad["ST"]].name : "무명 스트라이커";
    const activeLW = (typeof squad !== 'undefined' && squad["LW"] && CARDS_DATABASE[squad["LW"]]) ? CARDS_DATABASE[squad["LW"]].name : "무명 윙어";
    const activeRW = (typeof squad !== 'undefined' && squad["RW"] && CARDS_DATABASE[squad["RW"]]) ? CARDS_DATABASE[squad["RW"]].name : "무명 윙백";
    const activeCM = (typeof squad !== 'undefined' && squad["CM"] && CARDS_DATABASE[squad["CM"]]) ? CARDS_DATABASE[squad["CM"]].name : "무명 미드필더";
    const activeLCM = (typeof squad !== 'undefined' && squad["LCM"] && CARDS_DATABASE[squad["LCM"]]) ? CARDS_DATABASE[squad["LCM"]].name : "무명 미드필더";
    const activeRCM = (typeof squad !== 'undefined' && squad["RCM"] && CARDS_DATABASE[squad["RCM"]]) ? CARDS_DATABASE[squad["RCM"]].name : "무명 미드필더";

    let scorerId = null;
    let scorerName = "무명 선수";
    let assisterId = null;
    let assisterName = null;

    if (selectedOption === 0) { // LW 돌파
        scorerId = squad["LW"];
        scorerName = activeLW;
        const rand = Math.random();
        if (rand < 0.4) {
            assisterId = squad["ST"];
            assisterName = activeST;
        } else if (rand < 0.6) {
            assisterId = squad["CM"];
            assisterName = activeCM;
        } else if (rand < 0.8) {
            assisterId = squad["RW"];
            assisterName = activeRW;
        }
    } else if (selectedOption === 1) { // ST 돌파
        scorerId = squad["ST"];
        scorerName = activeST;
        const rand = Math.random();
        if (rand < 0.3) {
            assisterId = squad["LW"];
            assisterName = activeLW;
        } else if (rand < 0.6) {
            assisterId = squad["RW"];
            assisterName = activeRW;
        } else if (rand < 0.8) {
            assisterId = squad["CM"];
            assisterName = activeCM;
        }
    } else if (selectedOption === 2) { // RW 돌파
        scorerId = squad["RW"];
        scorerName = activeRW;
        const rand = Math.random();
        if (rand < 0.4) {
            assisterId = squad["ST"];
            assisterName = activeST;
        } else if (rand < 0.6) {
            assisterId = squad["CM"];
            assisterName = activeCM;
        } else if (rand < 0.8) {
            assisterId = squad["LW"];
            assisterName = activeLW;
        }
    } else if (selectedOption === 5) { // AM/CM 돌파 (4-2-3-1 연출)
        // AM(CM)이 스루패스 도움을 주고, 전방의 ST, LW, RW가 득점함
        const rand = Math.random();
        if (rand < 0.6) {
            scorerId = squad["ST"];
            scorerName = activeST;
        } else if (rand < 0.8) {
            scorerId = squad["LW"];
            scorerName = activeLW;
        } else {
            scorerId = squad["RW"];
            scorerName = activeRW;
        }
        assisterId = squad["CM"];
        assisterName = activeCM;
    }

    return { scorerId, scorerName, assisterId, assisterName };
}

// 8. 경기 특별 돌발 변수 판정 공통 엔진 (패널티킥 및 퇴장)
function rollSpecialMatchEvent(activePlayers, opponentName) {
    if (Math.random() >= 0.04) return null; // 4% 확률로 경기 중 돌발 변수 발생

    const { ST, LW, RW, CM, GK } = activePlayers || {};
    const activeST = ST || "스트라이커";
    const activeLW = LW || "윙어";
    const activeRW = RW || "윙백";
    const activeGK = GK || "골키퍼";

    const rand = Math.random();

    if (rand < 0.50) { // 1. 플레이어 패널티킥 획득 (확률 50%)
        const isGoal = Math.random() < 0.80; // 플레이어 PK 성공률 80%
        return {
            type: "pk_player",
            isGoal: isGoal,
            ovrChange: 0,
            eventDesc: `[패널티킥 획득] 앗! 패널티 에어리어 안으로 침투하며 크로스를 올리려던 ${activeST} 선수가 상대 수비수의 깊은 슬라이딩 백태클에 걸려 넘어집니다! 주심이 지체 없이 패널티 마크를 가리킵니다!`,
            eventGoal: `골!!! 키커로 나선 ${activeST} 선수가 침착하게 골키퍼 타이밍을 빼앗아 왼쪽 골대 모서리로 정확하게 찔러 넣습니다! 패널티킥 선제 득점 성공! ⚽`,
            eventFail: `아아! 패널티킥 실축! 키커 ${activeST} 선수의 강력한 슛이 골키퍼 선방에 막힌 후 크로스바 위로 벗어납니다! 완벽한 기회가 무산되며 깊은 탄식이 흐릅니다.`
        };
    } else { // 2. 상대팀 패널티킥 획득 (확률 50%)
        const isGoal = Math.random() < 0.75; // 상대팀 PK 성공률 75%
        return {
            type: "pk_opponent",
            isGoal: isGoal,
            ovrChange: 0,
            eventDesc: `[패널티킥 허용] 위기! 상대팀 공격수가 박스 모퉁이에서 현란한 드리블로 돌파를 시도하는 과정에서 전북 수비수의 다리에 걸려 쓰러집니다. 주심의 킥오프 휘슬과 함께 패널티킥이 선언됩니다.`,
            eventGoal: `실점! 상대 키커가 골키퍼 손끝을 스치고 빠르게 지나가는 레이저 슈팅으로 패널티킥 득점을 올립니다.`,
            eventFail: `키퍼의 미친 슈퍼세이브!!! 전북의 수호신 ${activeGK} 골키퍼가 한 마리 새처럼 날아올라 상대의 날카로운 PK 슛을 손끝으로 쳐냅니다! 전주성이 엄청난 환호와 흥분으로 물듭니다! 🧤`
        };
    }
}

// 9. 상대팀 전용 동적 득점자/도움자 판정 함수
function determineOpponentScorerAndAssister(opponentTeamId) {
    if (typeof OTHER_TEAMS_PLAYERS_PRESET === 'undefined') {
        return {
            scorerId: "opp_generic_scorer",
            scorerName: "상대 공격수",
            assisterId: null,
            assisterName: null
        };
    }
    
    const normalizedTeamId = opponentTeamId ? opponentTeamId.toString().trim() : "";
    const squadPlayers = OTHER_TEAMS_PLAYERS_PRESET.filter(p => p.teamId === normalizedTeamId);
    
    if (squadPlayers.length === 0) {
        return {
            scorerId: `opp_generic_${normalizedTeamId}_scorer`,
            scorerName: "상대 공격수",
            assisterId: null,
            assisterName: null
        };
    }
    
    const scorerIdx = Math.floor(Math.random() * squadPlayers.length);
    const scorer = squadPlayers[scorerIdx];
    
    let assister = null;
    if (Math.random() < 0.50 && squadPlayers.length > 1) {
        const potentialAssisters = squadPlayers.filter((_, idx) => idx !== scorerIdx);
        const assisterIdx = Math.floor(Math.random() * potentialAssisters.length);
        assister = potentialAssisters[assisterIdx];
    }
    
    return {
        scorerId: scorer.id,
        scorerName: scorer.name,
        assisterId: assister ? assister.id : null,
        assisterName: assister ? assister.name : null
    };
}

// 10. 공통 슛 득점 확률 계산 함수 (플레이어 및 상대팀)
function calculatePlayerScoreProb(activeDiff, chancePlayerStat, opponentRating, formationScoreBoost, suitabilityBonus) {
    const playerChanceBonus = Math.max(0, (chancePlayerStat - opponentRating) * 0.01);
    const maxScoreProb = 0.50;
    const minScoreProb = 0.10;
    const calculated = 0.24 + (activeDiff * 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus;
    const prob = Math.min(maxScoreProb, Math.max(minScoreProb, calculated));
    
    console.log(`[시뮬레이션] 🟢 플레이어 슈팅 연산:
    - OVR 차이 보정: ${(activeDiff * 0.019 * 100).toFixed(1)}% (격차: ${activeDiff})
    - 슈팅 스탯 보정: ${(playerChanceBonus * 100).toFixed(1)}% (슈팅: ${chancePlayerStat} vs 수비: ${opponentRating})
    - 전술/포메이션 보정: ${(formationScoreBoost * 100).toFixed(1)}%
    - 전술 적합도 보정: ${(suitabilityBonus * 100).toFixed(1)}%
    - 최종 계산 득점 확률: ${(prob * 100).toFixed(1)}% (보정 전: ${(calculated * 100).toFixed(1)}%)`);
    
    return prob;
}

function calculateOpponentScoreProb(activeDiff, opponentOvr, playerGkStat) {
    const playerDef = getTeamAverageStat('def');
    const playerDefBonus = Math.max(0, (playerDef - 70) * 0.01);
    const gkBonus = (playerGkStat + 5 - opponentOvr) * 0.01;
    const calculated = 0.40 - (activeDiff * 0.026) - playerDefBonus - gkBonus;
    const prob = Math.min(0.50, Math.max(0.10, calculated));
    
    console.log(`[시뮬레이션] 🔴 상대팀 슈팅 연산:
    - OVR 차이 보정: ${(-activeDiff * 0.026 * 100).toFixed(1)}% (격차: ${activeDiff})
    - 수비력(DEF) 보정: ${(-playerDefBonus * 100).toFixed(1)}% (평균수비: ${playerDef})
    - 골키퍼(GK) 보정: ${(-gkBonus * 100).toFixed(1)}% (GK수비: ${playerGkStat} vs 상대OVR: ${opponentOvr})
    - 최종 계산 실점 확률: ${(prob * 100).toFixed(1)}% (보정 전: ${(calculated * 100).toFixed(1)}%)`);
    
    return prob;
}
