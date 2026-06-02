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
    
    // 포메이션 전술 완성 보너스 계산 (각 +1, 최대 +2)
    let hasKeyPlayer = false;
    let hasTeamTactic = false;
    let detailsLabel = "";
    
    if (currentFormation === '4-3-3') {
        const cmCardId = squadFormation['CM'];
        hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.pas >= 80;
        const avgPas = getTeamAverageStat('pas');
        hasTeamTactic = avgPas >= 70;
    } else if (currentFormation === '3-4-3') {
        const cmCardId = squadFormation['CM'];
        hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgDri = getTeamAverageStat('dri');
        hasTeamTactic = avgDri >= 70;
    } else if (currentFormation === '5-4-1') {
        const lwCardId = squadFormation['LW'];
        const rwCardId = squadFormation['RW'];
        
        if (lwCardId && getAwakenedCard(lwCardId).stats && getAwakenedCard(lwCardId).stats.pac >= 80) hasKeyPlayer = true;
        if (rwCardId && getAwakenedCard(rwCardId).stats && getAwakenedCard(rwCardId).stats.pac >= 80) hasKeyPlayer = true;
        
        const avgDef = getTeamAverageStat('def');
        hasTeamTactic = avgDef >= 60; // 수비 기준 60 이상으로 수정!
    } else if (currentFormation === '4-2-3-1') {
        const cmCardId = squadFormation['CM'];
        hasKeyPlayer = cmCardId && getAwakenedCard(cmCardId).stats && getAwakenedCard(cmCardId).stats.dri >= 80;
        const avgDri = getTeamAverageStat('dri');
        hasTeamTactic = avgDri >= 70; // 4-2-3-1은 팀 평균 70이상으로 완화!
    }
    
    let formationBonus = 0;
    if (currentFormation !== '4-4-2') {
        if (hasKeyPlayer) formationBonus += 1;
        if (hasTeamTactic) formationBonus += 1;
        
        if (formationBonus > 0) {
            detailsLabel = ` (+${formationBonus} 전술 완성)`;
        }
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
    let isDetailedActive = false;
    
    if (currentFormation === '4-3-3') {
        detailedTacticName = "타겟맨 (Target Man)";
        detailedTacticDesc = "ST 피지컬 80 이상";
        const stCardId = squadFormation['ST'];
        isDetailedActive = stCardId && getAwakenedCard(stCardId).stats && getAwakenedCard(stCardId).stats.phy >= 80;
    } else if (currentFormation === '3-4-3') {
        detailedTacticName = "전방압박 (Gegenpressing)";
        detailedTacticDesc = "공격수 2명 속도 90 이상";
        let fastAttackersCount = 0;
        const attackers = ["LW", "ST", "RW"];
        attackers.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pac >= 90) {
                fastAttackersCount++;
            }
        });
        isDetailedActive = fastAttackersCount >= 2;
    } else if (currentFormation === '5-4-1') {
        detailedTacticName = "다이렉트 패스 (Direct Pass)";
        detailedTacticDesc = "패스 80이상 수비수 출전";
        let passDefendersCount = 0;
        const defenders = ["LB", "LCB", "CM", "RCB", "RB"];
        defenders.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && CARDS_DATABASE[cardId]) {
                const card = getAwakenedCard(cardId);
                const isRealDefender = ['CB', 'LB', 'RB'].includes(card.position);
                if (isRealDefender && card.stats && card.stats.pas >= 80) {
                    passDefendersCount++;
                }
            }
        });
        isDetailedActive = passDefendersCount >= 1;
    } else if (currentFormation === '4-2-3-1') {
        detailedTacticName = "티키타카 (Tiki-Taka)";
        detailedTacticDesc = "미드필더 3명 패스 모두 83 이상";
        let passMidfieldersCount = 0;
        const midfielders = ["LCM", "CM", "RCM"];
        midfielders.forEach(pos => {
            const cardId = squadFormation[pos];
            if (cardId && getAwakenedCard(cardId).stats && getAwakenedCard(cardId).stats.pas >= 83) {
                passMidfieldersCount++;
            }
        });
        isDetailedActive = passMidfieldersCount === 3;
    }

    const detailedTacticNameEl = document.getElementById('detailed-tactic-name');
    const detailedTacticDescEl = document.getElementById('detailed-tactic-desc');
    const detailedTacticStatusEl = document.getElementById('detailed-tactic-status');
    
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

// 3. 포메이션 세부 전술 연동 매치 코멘터리 생성 (리그 & 친선경기 시뮬레이터 공용)
function getDetailedTacticCommentary(option, formation, isTacticActive, activePlayers) {
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
            } else if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                eventDesc = `측면에서 ${activeWinger}(이/가) 문전을 향해 높고 날카로운 크로스 장전! 박스 중앙에서 거구의 ${ST}(이/가) 압도적인 타점으로 솟구쳐 오릅니다!`;
                eventGoal = `골!!! ${ST}의 완벽한 고공 폭격! 상대 골키퍼가 꼼짝도 못 하는 괴물 같은 헤더 슈팅으로 골망을 시원하게 흔듭니다! ⚽`;
                eventFail = `아! 헤더 경합에는 성공했지만 골키퍼가 엄청난 반사신경으로 쳐내며 득점으로 연결되진 못합니다.`;
            }
        } else if (formation === '3-4-3') {
            if (option === 1) {
                eventDesc = `쾌속 공격진 ${LW}와 ${RW}의 미친 듯한 스프린트 압박! 당황해 횡패스 실수를 범한 상대 수비진의 공을 ${ST}(이/가) 번개처럼 가로채 단독 1대1 찬스를 잡습니다!`;
                eventGoal = `골!!! 전술적인 전방 압박의 완벽한 결실! ${ST}(이/가) 뛰쳐나온 키퍼의 옆을 가볍게 지나쳐 골망 흔들기에 성공합니다! ⚽`;
                eventFail = `아! 너무 온 힘을 다해 압박 스피드를 올렸던 탓일까요, 슈팅 순간 밸런스가 무너지며 골대 위로 솟구칩니다.`;
            } else if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                eventDesc = `최전방 압박으로 탈취한 공이 단숨에 빈 공간으로 연결됩니다! 시속 90 이상의 무시무시한 주력으로 질주하는 ${activeWinger}의 총알 같은 침투 슛!`;
                eventGoal = `골!!! 수비수가 따라잡을 엄두조차 내지 못한 역대급 속도전! ${activeWinger}의 번개 같은 니어포스트 슈팅이 꽂힙니다! ⚽`;
                eventFail = `상대 골키퍼가 각도를 좁히며 몸으로 가까스로 블로킹! 질식할 듯한 속도전이었으나 아쉽게 무산됩니다.`;
            }
        } else if (formation === '5-4-1') {
            if (option === 0 || option === 2) {
                const activeWinger = option === 0 ? LW : RW;
                eventDesc = `수비 라인 깊숙한 곳에서 패스 장인 수비수가 배후 공간을 완전히 열어젖히는 낮고 정교한 다이렉트 롱 패스를 뿌립니다! 수비 라인을 무력화하며 수신한 ${activeWinger}의 슛!`;
                eventGoal = `골!!! 한 번의 패스로 경기장 전체를 종으로 갈랐습니다! ${activeWinger}의 절묘한 논스톱 발리 슛이 구석에 꽂히며 원더골이 완성됩니다! ⚽`;
                eventFail = `골포스트 강타! 수비진을 붕괴시킨 대단한 롱 패스와 슛이었으나 골대를 때리고 나오며 탄성을 자아냅니다.`;
            } else if (option === 1) {
                eventDesc = `상대 공격을 커트하자마자 수비진에서 최전방의 ${ST}를 겨냥해 거리를 다이렉트로 관통하는 레이저 패스 배송! 하프라인을 넘는 카운터 시작!`;
                eventGoal = `골!!! 패스 한 번에 완전 오프사이드 트랩이 해체되었습니다! ${ST}(이/가) 침착하게 골망 흔들기에 성공하며 역습의 마침표를 찍습니다! ⚽`;
                eventFail = `아아! 패스가 살짝 길어 골키퍼가 먼저 슬라이딩하며 잡아내어 역습 찬스가 아쉽게 소멸됩니다.`;
            }
        } else if (formation === '4-2-3-1') {
            if (option === 5 || option === 1) {
                eventDesc = `평균 패스 83 이상의 미드필더 삼총사가 좁은 공간에서 환상적인 삼각 패스와 극상의 원터치 연계로 상대를 유인한 후, 플레이메이커 ${CM}의 가랑이를 꿰뚫는 스루패스!`;
                eventGoal = `골!!! 패스 마술사들의 완벽한 그라운드 지배! 촘촘히 엮어 짜낸 조직적인 패스 콤비네이션이 기어코 완벽한 작품 골을 빚어냅니다! ⚽`;
                eventFail = `앗! 완벽한 패스워크의 끝에 마지막 슈팅이 상대 수비수의 필사적인 슬라이딩 태클에 굴절되며 아웃됩니다.`;
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
        playerAttackProb = 0.5
    } = data || {};

    if (type === 'PRE_ANALYZE') {
        if (isFriendly) {
            return `⚽ 🤝 친선 경기 매칭 전력 분석 | 나의 구단 OVR ${playerOvr} vs 상대 ${opponentName} OVR ${opponentOvr} (홈 ADV: 0)`;
        } else {
            return `경기 시작 전력 분석 | 전북 OVR ${playerOvr} (${isPlayerHome ? '홈' : '원정'}) vs ${opponentName} OVR ${opponentOvr}`;
        }
    }

    if (type === 'TACTIC_ANALYZE') {
        return `⚙️ <strong>[세부 전술 및 적합 분석]</strong>${detailedTacticLabel}${suitabilityLabel} 반영 완료! (공격 찬스 확률: ${Math.round(playerAttackProb * 100)}%)`;
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
        return `실점! 상대 공격수의 기습적인 헤더 슛이 ${activeGk} 골키퍼의 손끝을 스치며 골문으로 밀려 들어갑니다.`;
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
        isTeam1Jeonbuk = true
    } = data;
    
    let etScore1 = score1;
    let etScore2 = score2;
    const etEvents = [];
    
    etEvents.push({ min: "91'", type: "system", text: "연장 전반전이 킥오프됩니다. 체력의 한계를 넘어선 마지막 30분의 혈투가 시작됩니다!" });
    
    const diff = rating1 - rating2;
    const prob1 = 0.15 + (diff * 0.01);
    const prob2 = 0.15 - (diff * 0.01);
    
    const p1Scored = Math.random() < Math.max(0.05, Math.min(prob1, 0.4));
    const p2Scored = Math.random() < Math.max(0.05, Math.min(prob2, 0.4));
    
    const scorer1 = isTeam1Jeonbuk ? playerScorerName : `${team1Name} 공격수`;
    const scorer2 = !isTeam1Jeonbuk ? playerScorerName : `${team2Name} 공격수`;

    if (p1Scored) {
        etScore1++;
        etEvents.push({
            min: "103'",
            type: "goal",
            side: "team1",
            text: `[골!!!] 연장 전반 극적인 득점! ${team1Name}의 ${scorer1}가 혼신을 다한 논스톱 슈팅으로 그물을 가릅니다!`,
            score1: etScore1,
            score2: etScore2
        });
    } else {
        etEvents.push({
            min: "103'",
            type: "attack",
            side: "team1",
            text: `${team1Name}의 공격수 ${scorer1}가 아크 정면에서 과감한 슈팅을 시도했으나, 상대 골키퍼의 손끝에 맞고 아슬아슬하게 골대 밖으로 빗나갑니다.`,
            score1: etScore1,
            score2: etScore2
        });
    }
    
    etEvents.push({ min: "105'", type: "system", text: "연장 전반전 종료. 코트 교대 후 곧바로 후반전으로 이어집니다." });
    
    if (p2Scored) {
        etScore2++;
        etEvents.push({
            min: "115'",
            type: "goal",
            side: "team2",
            text: `[골!!!] 연장 후반 극적인 골! ${team2Name}의 ${scorer2}가 페널티 에어리어에서 날카로운 슈팅으로 수비 벽을 뚫어내며 승부를 바꿉니다!`,
            score1: etScore1,
            score2: etScore2
        });
    } else {
        etEvents.push({
            min: "115'",
            type: "attack",
            side: "team2",
            text: `${team2Name}의 ${scorer2}가 회심의 크로스 공격을 전개하여 헤더 슛까지 연결했으나, 상대 수비수들의 집중 견제에 막혀 무산됩니다.`,
            score1: etScore1,
            score2: etScore2
        });
    }
    
    etEvents.push({ min: "120'", type: "system", text: "연장전 120분이 종료되었습니다! 스코어는 여전히 균형을 이루고 있습니다." });
    
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
    
    for (let r = 1; r <= rounds; r++) {
        const success1 = Math.random() < 0.75;
        const success2 = Math.random() < 0.72;
        
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
        const success1 = Math.random() < 0.70;
        const success2 = Math.random() < 0.70;
        
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

