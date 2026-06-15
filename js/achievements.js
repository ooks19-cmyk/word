// js/achievements.js - 업적(Achievements) 시스템 관리 모듈

const ACHIEVEMENTS_DB = {
    double: {
        id: 'double',
        name: '더블 (Double)',
        icon: 'fa-trophy',
        desc: '한 시즌 K리그1 우승과 코리아컵 우승을 동시 달성하세요.',
        checkProgress: () => {
            return userAchievements.double.unlocked ? 1 : 0;
        },
        maxVal: 1,
        unit: ''
    },
    treble: {
        id: 'treble',
        name: '트레블 (Treble)',
        icon: 'fa-crown',
        desc: '한 시즌 K리그1 우승, 코리아컵 우승, 그리고 AFC 챔피언스리그(ACL) 우승을 동시 달성하세요.',
        checkProgress: () => {
            return userAchievements.treble.unlocked ? 1 : 0;
        },
        maxVal: 1,
        unit: ''
    },
    invincible: {
        id: 'invincible',
        name: '무패 우승 (Invincible)',
        icon: 'fa-shield-halved',
        desc: '한 시즌 리그 진행 중 단 1패도 기록하지 않고 (0패) 리그 우승을 달성하세요.',
        checkProgress: () => {
            return userAchievements.invincible.unlocked ? 1 : 0;
        },
        maxVal: 1,
        unit: ''
    },
    threepeat: {
        id: 'threepeat',
        name: '리그 3연패 (Three-peat)',
        icon: 'fa-fire-flame-curved',
        desc: '연속 K리그1 우승 3회를 달성하세요.',
        checkProgress: () => {
            return consecutiveLeagueTitles;
        },
        maxVal: 3,
        unit: '회'
    },
    fivepeat: {
        id: 'fivepeat',
        name: '리그 5연패 (Five-peat)',
        icon: 'fa-skull',
        desc: '연속 K리그1 우승 5회를 달성하세요.',
        checkProgress: () => {
            return consecutiveLeagueTitles;
        },
        maxVal: 5,
        unit: '회'
    },
    collector: {
        id: 'collector',
        name: '위대한 수집가 (Collector)',
        icon: 'fa-images',
        desc: '★6 각성 카드 5장 이상을 보유하세요.',
        checkProgress: () => {
            let count = 0;
            if (typeof playerDeck === 'object' && playerDeck) {
                Object.keys(playerDeck).forEach(key => {
                    if (playerDeck[key] && playerDeck[key].awakening >= 6) {
                        count++;
                    }
                });
            }
            return count;
        },
        maxVal: 5,
        unit: '장'
    },
    worldclass: {
        id: 'worldclass',
        name: '월드 클래스 (World Class)',
        icon: 'fa-star',
        desc: '일반 모드 상태에서 전북 현대 최종 팀 OVR 90을 돌파하세요.',
        checkProgress: () => {
            return typeof getPlayerPureOvr === 'function' ? getPlayerPureOvr() : 0;
        },
        maxVal: 90,
        unit: 'OVR'
    },
    hardworldclass: {
        id: 'hardworldclass',
        name: '어려움 월드 클래스',
        icon: 'fa-bolt',
        desc: '어려움 모드 상태에서 전북 현대 최종 팀 OVR 90을 돌파하세요.',
        checkProgress: () => {
            return typeof getPlayerPureOvr === 'function' ? getPlayerPureOvr() : 0;
        },
        maxVal: 90,
        unit: 'OVR'
    },
    streak10: {
        id: 'streak10',
        name: '폭주 기관차 (10연승)',
        icon: 'fa-gauge-high',
        desc: '리그 경기 연속 10연승을 달성하세요.',
        checkProgress: () => {
            return maxWinStreak;
        },
        maxVal: 10,
        unit: '연승'
    },
    streak20: {
        id: 'streak20',
        name: '무적 함대 (20연승)',
        icon: 'fa-circle-play',
        desc: '리그 경기 연속 20연승을 달성하세요.',
        checkProgress: () => {
            return maxWinStreak;
        },
        maxVal: 20,
        unit: '연승'
    },
    streak30: {
        id: 'streak30',
        name: '전설의 팀 (30연승)',
        icon: 'fa-gem',
        desc: '리그 경기 연속 30연승을 달성하세요.',
        checkProgress: () => {
            return maxWinStreak;
        },
        maxVal: 30,
        unit: '연승'
    }
};

// 업적 그리드 렌더링 함수
function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(ACHIEVEMENTS_DB).forEach(key => {
        const ach = ACHIEVEMENTS_DB[key];
        const status = userAchievements[key] || { unlocked: false, rewarded: false };
        const currentProgress = ach.checkProgress();
        const percent = Math.min(100, Math.floor((currentProgress / ach.maxVal) * 100));

        const card = document.createElement('div');
        card.className = `achievement-card ${status.unlocked ? 'unlocked' : 'locked'}`;
        card.onclick = () => showAchievementDetail(ach.id);

        let buttonHtml = '';
        if (!status.unlocked) {
            buttonHtml = `<button class="btn-ach-claim disabled" disabled><i class="fa-solid fa-lock"></i> 미달성 (${percent}%)</button>`;
        } else if (!status.rewarded) {
            buttonHtml = `<button class="btn-ach-claim active" onclick="event.stopPropagation(); claimAchievementReward('${ach.id}')"><i class="fa-solid fa-gift"></i> 보상 받기 (+10 FP)</button>`;
        } else {
            buttonHtml = `<button class="btn-ach-claim claimed" disabled><i class="fa-solid fa-circle-check"></i> 수령 완료</button>`;
        }

        card.innerHTML = `
            <div class="ach-icon-wrapper">
                <i class="fa-solid ${ach.icon} ach-icon"></i>
            </div>
            <div class="ach-info">
                <h4 class="ach-name">${ach.name}</h4>
                <p class="ach-short-desc">${ach.desc}</p>
                <div class="ach-progress-bar-mini">
                    <div class="ach-progress-fill-mini" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="ach-action">
                ${buttonHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}

// 업적 상세 정보 모달 출력
function showAchievementDetail(id) {
    const ach = ACHIEVEMENTS_DB[id];
    if (!ach) return;

    const status = userAchievements[id] || { unlocked: false, rewarded: false };
    const currentProgress = ach.checkProgress();
    const percent = Math.min(100, Math.floor((currentProgress / ach.maxVal) * 100));

    // HTML 요소 주입
    document.getElementById('achModalName').innerText = ach.name;
    document.getElementById('achModalIcon').className = `fa-solid ${ach.icon} ${status.unlocked ? 'text-gold' : 'text-muted'}`;
    document.getElementById('achModalDesc').innerText = ach.desc;

    // 진행 텍스트 및 게이지 바 처리
    const progressText = `달성 상황: ${currentProgress} / ${ach.maxVal}${ach.unit} (${percent}%)`;
    document.getElementById('achModalProgressText').innerText = progressText;
    document.getElementById('achModalProgressBar').style.width = `${percent}%`;

    const statusBadge = document.getElementById('achModalStatusBadge');
    if (status.unlocked) {
        statusBadge.innerHTML = `<span class="badge-unlocked"><i class="fa-solid fa-circle-check"></i> 달성 완료</span>`;
    } else {
        statusBadge.innerHTML = `<span class="badge-locked"><i class="fa-solid fa-circle-xmark"></i> 미달성</span>`;
    }

    const actionContainer = document.getElementById('achModalActionContainer');
    if (!status.unlocked) {
        actionContainer.innerHTML = `<button class="btn-ach-claim disabled" style="width:100%;" disabled><i class="fa-solid fa-lock"></i> 조건을 충족하면 보상을 받으실 수 있습니다</button>`;
    } else if (!status.rewarded) {
        actionContainer.innerHTML = `<button class="btn-ach-claim active" style="width:100%; padding:0.8rem;" onclick="claimAchievementReward('${ach.id}'); closeAchievementModal()"><i class="fa-solid fa-gift"></i> 보상 10 FP 받기</button>`;
    } else {
        actionContainer.innerHTML = `<button class="btn-ach-claim claimed" style="width:100%;" disabled><i class="fa-solid fa-circle-check"></i> 보상 수령이 완료되었습니다</button>`;
    }

    // 모달 띄우기
    document.getElementById('achievementDetailModal').style.display = 'flex';
}

function closeAchievementModal() {
    document.getElementById('achievementDetailModal').style.display = 'none';
}

// 업적 보상 청구
function claimAchievementReward(id) {
    const status = userAchievements[id];
    if (status && status.unlocked && !status.rewarded) {
        userPoints += 10;
        status.rewarded = true;
        
        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
            localStorage.setItem('fc_star_user_achievements', JSON.stringify(userAchievements));
        } catch (e) {}

        renderUserPoints();
        renderAchievements();
        showToast(`🎁 업적 보상 수령! +10 FP가 지급되었습니다.`);
        
        // 클라우드 백업 자동 연동
        if (typeof saveUserProgress === 'function') {
            saveUserProgress();
        }
    }
}

// 업적 강제 언락 처리 공통 헬퍼
function unlockAchievement(id) {
    if (!userAchievements[id]) {
        userAchievements[id] = { unlocked: false, rewarded: false };
    }
    if (!userAchievements[id].unlocked) {
        userAchievements[id].unlocked = true;
        try {
            localStorage.setItem('fc_star_user_achievements', JSON.stringify(userAchievements));
        } catch(e) {}

        const ach = ACHIEVEMENTS_DB[id];
        const achName = ach ? ach.name : id;
        showToast(`🏆 새로운 업적 달성: [${achName}]!`);
        
        // 렌더 갱신
        renderAchievements();
        
        // 클라우드 백업 자동 연동
        if (typeof saveUserProgress === 'function') {
            saveUserProgress();
        }
    }
}

// 1. 수집가 업적 검사 (6성 5장 보유)
function checkCollectorAchievement() {
    let count = 0;
    if (typeof playerDeck === 'object' && playerDeck) {
        Object.keys(playerDeck).forEach(key => {
            if (playerDeck[key] && playerDeck[key].awakening >= 6) {
                count++;
            }
        });
    }
    if (count >= 5) {
        unlockAchievement('collector');
    }
}

// 2. 월드 클래스 업적 검사 (OVR 90 돌파)
function checkWorldClassAchievement() {
    const currentOvr = typeof getPlayerPureOvr === 'function' ? getPlayerPureOvr() : 0;
    if (currentOvr >= 90) {
        if (typeof isHardMode !== 'undefined' && isHardMode) {
            unlockAchievement('hardworldclass');
        } else {
            unlockAchievement('worldclass');
        }
    }
}

// 3. 연승 업적 검사
function checkWinStreakAchievements(streak) {
    if (streak >= 10) unlockAchievement('streak10');
    if (streak >= 20) unlockAchievement('streak20');
    if (streak >= 30) unlockAchievement('streak30');
}

// 4. 리그 종료 관련 업적 검사 (더블/트레블/무패우승/연속우승)
function checkLeagueEndAchievements(isWinner, losses) {
    if (!isWinner) return; // 리그 우승을 전제로 함

    // 1) 무패 우승 체크
    if (losses === 0) {
        unlockAchievement('invincible');
    }

    // 2) 3연패 & 5연패 체크
    if (consecutiveLeagueTitles >= 3) {
        unlockAchievement('threepeat');
    }
    if (consecutiveLeagueTitles >= 5) {
        unlockAchievement('fivepeat');
    }

    // 3) 더블 & 트레블 체크 (해당 시즌 코리아컵/아챔 동시 우승 여부)
    const hasCupWon = typeof cupState !== 'undefined' && cupState && cupState.isWinner;
    const hasAclWon = typeof aclState !== 'undefined' && aclState && aclState.isWinner;

    if (hasCupWon) {
        unlockAchievement('double');
    }
    if (hasCupWon && hasAclWon) {
        unlockAchievement('treble');
    }
}
