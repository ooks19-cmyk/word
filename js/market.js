// js/market.js - FC STAR CARD 이적시장(Transfer Market) 비즈니스 엔진

// 1. 이적시장 상태 변수
let currentMarketSubTab = 'sell'; // 'sell' (방출) 또는 'buy' (영입)
let currentMarketPosFilter = 'all'; // 'all', 'FW', 'MF', 'DF', 'GK'
let isMarketQuizPassed = false;
let lastMarketLeaveTimestamp = 0;

// 이적시장 전용 퀴즈 상태 (일반 단어 퀴즈 탭과 격리)
let marketQuizQueue = [];
let marketQuizIndex = 0;
let marketQuizSolvedCount = 0;
let isMarketQuizAnswering = false;

// 로컬 스토리지로부터 이적시장 진입 인증 상태 복원
function loadMarketAuthState() {
    try {
        const savedPassed = localStorage.getItem('fc_star_market_quiz_passed');
        isMarketQuizPassed = (savedPassed === 'true');

        const savedLeaveTime = localStorage.getItem('fc_star_market_leave_time');
        lastMarketLeaveTimestamp = savedLeaveTime ? (parseInt(savedLeaveTime) || 0) : 0;
    } catch (e) {
        console.warn("이적시장 상태 복원 실패:", e);
    }
}
loadMarketAuthState();

// 퀴즈 1세트 완료 시 이적시장 진입 권한 부여 함수 (이적시장 퀴즈 및 일반 단어 퀴즈 공통 연동)
function grantMarketAccess() {
    isMarketQuizPassed = true;
    lastMarketLeaveTimestamp = 0; // 이적시장 진입 준비 완료 (아직 나가지 않음)
    try {
        localStorage.setItem('fc_star_market_quiz_passed', 'true');
        localStorage.setItem('fc_star_market_leave_time', '0');
    } catch(e) {}
    console.log("[이적시장 인증 완료] 퀴즈 1세트 완료로 이적시장 진입 권한이 부여되었습니다.");
}

// 2. 이적시장 탭 진입 핸들러
function initMarketTab() {
    try {
        loadMarketAuthState(); // 항상 최신 스토리지 상태 동기화
        const now = Date.now();
        
        let elapsedSeconds = 999999;
        if (lastMarketLeaveTimestamp > 0) {
            elapsedSeconds = (now - lastMarketLeaveTimestamp) / 1000;
        }
        
        console.log(`[이적시장 진입 검사] 지난 이탈 후 경과 시간: ${lastMarketLeaveTimestamp > 0 ? Math.round(elapsedSeconds) + '초' : '없음(최초/머무름)'}, 인증 상태: ${isMarketQuizPassed}`);

        // [핵심 조건 1] 퀴즈를 풀고 진입 권한이 있는 경우:
        if (isMarketQuizPassed) {
            // Case A: 다른 페이지로 나간 적이 없음 (lastMarketLeaveTimestamp === 0)
            // Case B: 다른 페이지로 나갔지만 1분(60초) 이내에 다시 복귀함 (elapsedSeconds < 60)
            if (lastMarketLeaveTimestamp === 0 || elapsedSeconds < 60) {
                // 이적시장 안으로 복귀했으므로 이탈 타이머 리셋
                lastMarketLeaveTimestamp = 0;
                try {
                    localStorage.setItem('fc_star_market_leave_time', '0');
                } catch(e) {}
                showMarketMainView();
                return;
            }
        }

        // [핵심 조건 2] 퀴즈를 아직 안 풀었거나, 이탈 후 1분(60초) 이상 경과한 경우:
        // 인증 만료 및 퀴즈 게이트웨이 화면 강제
        isMarketQuizPassed = false;
        lastMarketLeaveTimestamp = 0;
        try {
            localStorage.setItem('fc_star_market_quiz_passed', 'false');
            localStorage.setItem('fc_star_market_leave_time', '0');
        } catch(e) {}
        showMarketQuizView();
    } catch (e) {
        console.error("initMarketTab 에러:", e);
        showMarketQuizView();
    }
}

// 다른 탭으로 나갈 때 이탈 시간 기록 (app.js에서 탭 전환 시 호출됨)
function handleMarketTabLeave() {
    loadMarketAuthState();
    // 퀴즈를 풀어 이적시장에 정식 진입한 상태(isMarketQuizPassed === true)에서 나갈 때만 1분 쿨다운 유효시간 기록
    if (isMarketQuizPassed) {
        lastMarketLeaveTimestamp = Date.now();
        try {
            localStorage.setItem('fc_star_market_leave_time', lastMarketLeaveTimestamp.toString());
        } catch(e) {}
        console.log(`[이적시장 이탈 기록] ${new Date(lastMarketLeaveTimestamp).toLocaleTimeString()} (1분 쿨다운 타이머 시작)`);
    } else {
        // 퀴즈를 안 풀고 나간 경우 이적시장에 진입한 것이 아니므로 항상 0으로 초기화
        lastMarketLeaveTimestamp = 0;
        try {
            localStorage.setItem('fc_star_market_leave_time', '0');
        } catch(e) {}
        console.log(`[이적시장 미인증 상태 이탈] 퀴즈 미통과 상태 유지`);
    }
}

// 3. 화면 전환 (퀴즈 게이트웨이 vs 이적시장 메인)
function showMarketQuizView() {
    const quizView = document.getElementById('marketQuizView');
    const mainView = document.getElementById('marketMainView');
    if (quizView) quizView.style.display = 'block';
    if (mainView) mainView.style.display = 'none';

    startMarketQuiz();
}

function showMarketMainView() {
    const quizView = document.getElementById('marketQuizView');
    const mainView = document.getElementById('marketMainView');
    if (quizView) quizView.style.display = 'none';
    if (mainView) mainView.style.display = 'block';

    renderMarket();
}

// 4. 이적시장 전용 퀴즈 엔진
function startMarketQuiz() {
    try {
        // 단어 풀 가져오기 (quiz.js의 getScheduledWordPool 함수 활용)
        const wordPool = (typeof getScheduledWordPool === 'function') ? getScheduledWordPool() : [];
        if (!wordPool || wordPool.length === 0) {
            console.warn("단어 풀이 비어있어 즉시 메인으로 진입합니다.");
            showMarketMainView();
            return;
        }

        // 셔플 후 5문제 선별
        const shuffled = [...wordPool].sort(() => 0.5 - Math.random());
        marketQuizQueue = shuffled.slice(0, 5);
        marketQuizIndex = 0;
        marketQuizSolvedCount = 0;
        isMarketQuizAnswering = false;

        // UI 초기화
        const completeOverlay = document.getElementById('marketQuizCompleteOverlay');
        if (completeOverlay) completeOverlay.style.display = 'none';

        const feedbackBox = document.getElementById('marketQuizFeedbackBox');
        if (feedbackBox) feedbackBox.style.display = 'none';

        renderMarketQuizCurrent();
    } catch (e) {
        console.error("startMarketQuiz 에러:", e);
        showMarketMainView();
    }
}

function renderMarketQuizCurrent() {
    try {
        if (!marketQuizQueue || marketQuizQueue.length === 0 || marketQuizIndex >= marketQuizQueue.length) {
            return;
        }

        const currentItem = marketQuizQueue[marketQuizIndex];
        if (!currentItem) return;

        // 단어 설정
        const qWordEl = document.getElementById('marketQuizQuestionWord');
        if (qWordEl) qWordEl.innerText = currentItem.word || "";

        // 진행도 텍스트 (예: 1 / 5)
        const qProgTextEl = document.getElementById('marketQuizProgressText');
        if (qProgTextEl) qProgTextEl.innerText = `${Math.min(5, marketQuizSolvedCount + 1)} / 5`;

        // 진행도 게이지 바
        const qBarEl = document.getElementById('marketQuizProgressBar');
        if (qBarEl) {
            const pct = (marketQuizSolvedCount / 5) * 100;
            qBarEl.style.width = `${pct}%`;
        }

        // 목·금요일 복습일은 객관식, 타 요일은 주관식 (quiz.js의 isReviewDay 활용)
        const isMultipleChoice = (typeof isReviewDay === 'function') ? isReviewDay() : false;
        const choicesWrapper = document.getElementById('marketQuizChoicesWrapper');
        const inputWrapper = document.getElementById('marketQuizInputWrapper');
        const btnSubmit = document.getElementById('btnMarketQuizSubmit');
        const actionButtons = document.getElementById('marketQuizActionButtons');
        const qLabel = document.getElementById('marketQuizQuestionLabel');

        if (isMultipleChoice) {
            // 4지선다형 객관식
            if (qLabel) qLabel.innerText = "다음 영어 단어의 올바른 뜻을 선택하세요";
            if (inputWrapper) inputWrapper.style.display = 'none';
            if (btnSubmit) btnSubmit.style.display = 'none';
            if (actionButtons) actionButtons.style.gridTemplateColumns = '1fr';
            if (choicesWrapper) {
                choicesWrapper.style.display = 'grid';
                generateMarketQuizChoices(currentItem, choicesWrapper);
            }
        } else {
            // 주관식 직접 입력
            if (qLabel) qLabel.innerText = "다음 영어 단어의 뜻을 입력하세요";
            if (choicesWrapper) choicesWrapper.style.display = 'none';
            if (inputWrapper) inputWrapper.style.display = 'block';
            if (btnSubmit) btnSubmit.style.display = 'inline-flex';
            if (actionButtons) actionButtons.style.gridTemplateColumns = '1fr 1.5fr';

            const inputField = document.getElementById('marketQuizAnswerInput');
            if (inputField) {
                inputField.value = '';
                inputField.style.borderColor = '';
                inputField.style.boxShadow = '';
                inputField.disabled = false;
                setTimeout(() => inputField.focus(), 60);
            }
        }

        // TTS 발음 자동 재생
        if (typeof isQuizTtsAutoplay !== 'undefined' && isQuizTtsAutoplay && typeof speakCurrentWord === 'function') {
            setTimeout(() => speakCurrentWord(true), 150);
        }
    } catch (e) {
        console.error("renderMarketQuizCurrent 에러:", e);
    }
}

// 이적시장 퀴즈 4지선다 보기 생성
function generateMarketQuizChoices(currentItem, wrapperEl) {
    try {
        wrapperEl.innerHTML = '';
        const activePool = (typeof getScheduledWordPool === 'function') ? getScheduledWordPool() : [];
        let wrongCandidates = activePool.filter(w => w.word !== currentItem.word && w.meaning !== currentItem.meaning);
        if (wrongCandidates.length < 3 && typeof QUIZ_WORDS !== 'undefined') {
            wrongCandidates = QUIZ_WORDS.filter(w => w.word !== currentItem.word && w.meaning !== currentItem.meaning);
        }

        const uniqueWrongMeanings = [];
        const seenMeanings = new Set([currentItem.meaning]);
        const shuffledWrongs = [...wrongCandidates].sort(() => 0.5 - Math.random());

        for (let cand of shuffledWrongs) {
            if (!seenMeanings.has(cand.meaning)) {
                seenMeanings.add(cand.meaning);
                uniqueWrongMeanings.push(cand.meaning);
                if (uniqueWrongMeanings.length === 3) break;
            }
        }

        const allChoices = [currentItem.meaning, ...uniqueWrongMeanings].sort(() => 0.5 - Math.random());
        allChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'btn-choice';
            btn.innerText = choice;
            btn.onclick = () => selectMarketQuizChoice(btn, choice, currentItem.meaning);
            wrapperEl.appendChild(btn);
        });
    } catch(e) {
        console.error("generateMarketQuizChoices 에러:", e);
    }
}

// 이적시장 퀴즈 객관식 보기 선택
function selectMarketQuizChoice(btnEl, selectedChoice, correctMeaning) {
    if (isMarketQuizAnswering) return;
    isMarketQuizAnswering = true;

    const buttons = document.querySelectorAll('#marketQuizChoicesWrapper .btn-choice');
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = (selectedChoice === correctMeaning);
    if (isCorrect) {
        btnEl.classList.add('correct');
        if (typeof createSparkParticles === 'function') createSparkParticles(true, '#00ff87');

        setTimeout(() => {
            handleMarketQuizCorrect();
        }, 800);
    } else {
        btnEl.classList.add('incorrect');
        if (typeof playSound === 'function') playSound('rumble', 0.3);
        if (typeof showToast === 'function') showToast("오답입니다! 다시 한 번 생각해보세요.");

        setTimeout(() => {
            btnEl.classList.remove('incorrect');
            buttons.forEach(btn => btn.disabled = false);
            isMarketQuizAnswering = false;
        }, 800);
    }
}

// 이적시장 퀴즈 주관식 정답 제출
function submitMarketQuizAnswer() {
    if (isMarketQuizAnswering) return;
    if (!marketQuizQueue || marketQuizIndex >= marketQuizQueue.length) return;

    const currentItem = marketQuizQueue[marketQuizIndex];
    const inputField = document.getElementById('marketQuizAnswerInput');
    if (!inputField || !currentItem) return;

    const userAns = inputField.value.trim();
    if (!userAns) {
        if (typeof showToast === 'function') showToast("답변을 입력해주세요!");
        return;
    }

    const isCorrect = (typeof checkKoreanAnswer === 'function') ? checkKoreanAnswer(userAns, currentItem.meaning) : (userAns === currentItem.meaning);

    if (isCorrect) {
        isMarketQuizAnswering = true;
        inputField.disabled = true;
        inputField.style.borderColor = '#00ff87';
        inputField.style.boxShadow = '0 0 25px rgba(0, 255, 135, 0.6)';
        if (typeof createSparkParticles === 'function') createSparkParticles(true, '#00ff87');

        setTimeout(() => {
            handleMarketQuizCorrect();
        }, 800);
    } else {
        inputField.classList.add('shake-input');
        inputField.style.borderColor = '#ef4444';
        inputField.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
        if (typeof playSound === 'function') playSound('rumble', 0.3);
        if (typeof showToast === 'function') showToast("오답입니다! 다시 한 번 생각해보세요.");

        setTimeout(() => {
            inputField.classList.remove('shake-input');
            inputField.style.borderColor = '';
            inputField.style.boxShadow = '';
            inputField.value = '';
            inputField.focus();
        }, 800);
    }
}

// 이적시장 퀴즈 패스(모름)
function passMarketQuizQuestion() {
    if (isMarketQuizAnswering) return;
    if (!marketQuizQueue || marketQuizIndex >= marketQuizQueue.length) return;

    isMarketQuizAnswering = true;
    const currentItem = marketQuizQueue[marketQuizIndex];
    if (typeof playSound === 'function') playSound('rumble', 0.3);

    // 큐 뒤로 이동
    const passedWord = marketQuizQueue[marketQuizIndex];
    marketQuizQueue.push(passedWord);
    marketQuizQueue.splice(marketQuizIndex, 1);
    if (marketQuizIndex >= marketQuizQueue.length) marketQuizIndex = 0;

    const feedbackBox = document.getElementById('marketQuizFeedbackBox');
    const feedbackMsg = document.getElementById('marketQuizFeedbackMessage');

    if (feedbackBox && feedbackMsg) {
        feedbackMsg.innerHTML = `정답은 <strong>${currentItem.meaning}</strong> 입니다!<br><span style="font-size: 0.8rem; opacity: 0.8; font-weight: normal; display: block; margin-top: 5px; color: #ffd700;"><i class="fa-solid fa-hand-pointer"></i> 화면을 누르거나 Enter를 누르면 다음 문제로 진행합니다</span>`;
        feedbackBox.style.display = 'flex';
        feedbackBox.style.cursor = 'pointer';

        const closeFeedback = () => {
            feedbackBox.style.display = 'none';
            feedbackBox.onclick = null;
            document.removeEventListener('keydown', handleKeyClose);
            isMarketQuizAnswering = false;
            renderMarketQuizCurrent();
        };

        const handleKeyClose = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.isComposing) return;
                e.preventDefault();
                closeFeedback();
            }
        };

        feedbackBox.onclick = closeFeedback;
        document.addEventListener('keydown', handleKeyClose);
    }
}

// 이적시장 퀴즈 정답 공통 처리 (5문제 완료 시 보상 및 이적시장 진입 버튼 노출)
function handleMarketQuizCorrect() {
    marketQuizSolvedCount++;
    marketQuizQueue.splice(marketQuizIndex, 1);

    if (marketQuizSolvedCount >= 5) {
        // 5문제 풀이 완료 -> 보상 지급
        const fpGain = (typeof isHardMode !== 'undefined' && isHardMode) ? 2 : 1;
        userPoints += fpGain;
        userRP = (typeof userRP !== 'undefined' ? userRP : 0) + 1;
        userLevel += 1;

        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
            localStorage.setItem('fc_star_user_rp', userRP.toString());
            localStorage.setItem('fc_star_user_level', userLevel.toString());
        } catch(e) {}

        if (typeof renderUserPoints === 'function') renderUserPoints();
        if (typeof renderUserLevel === 'function') renderUserLevel();
        if (typeof saveUserProgress === 'function') saveUserProgress(true);

        // 레벨업 보상 연동
        if (typeof checkLevelUpRewards === 'function') checkLevelUpRewards(userLevel);

        // 인증 플래그 설정 및 로컬 저장
        grantMarketAccess();

        // 완료 오버레이 표시
        const rewardTextEl = document.getElementById('marketQuizRewardPointVal');
        if (rewardTextEl) rewardTextEl.innerText = `+${fpGain} FP (이적 자금) · +1 RP 획득!`;

        const compOverlay = document.getElementById('marketQuizCompleteOverlay');
        if (compOverlay) compOverlay.style.display = 'flex';

        if (typeof playSound === 'function') playSound('reveal', 0.3);
        if (typeof createSparkParticles === 'function') createSparkParticles(true, '#ffd700');
    } else {
        isMarketQuizAnswering = false;
        if (marketQuizIndex >= marketQuizQueue.length) marketQuizIndex = 0;
        renderMarketQuizCurrent();
    }
}

// [이적시장 진입하기] 버튼 클릭 핸들러
function enterMarketplaceFromQuiz() {
    const compOverlay = document.getElementById('marketQuizCompleteOverlay');
    if (compOverlay) compOverlay.style.display = 'none';

    showMarketMainView();
    if (typeof showToast === 'function') {
        showToast("🏪 이적시장에 성공적으로 입장했습니다!");
    }
}

// 5. 선수 가격 계산 함수 (방출/영입 공통)
function calculatePlayerMarketPrice(rating, awakening = 0) {
    let basePrice = 10;
    const r = parseInt(rating) || 80;

    if (r <= 80) {
        basePrice = 5;
    } else if (r <= 90) {
        basePrice = 10;
    } else {
        // 91 이상: 1포인트당 10 FP (91은 20, 95는 60)
        basePrice = 10 + (r - 90) * 10;
    }

    // 강화 수치당 +1 FP 추가
    return basePrice + (parseInt(awakening) || 0);
}

// 6. 이적시장 탭/필터 조작 및 렌더링
function switchMarketSubTab(tab) {
    currentMarketSubTab = tab;

    const btnSell = document.getElementById('btnSubTabSell');
    const btnBuy = document.getElementById('btnSubTabBuy');

    if (btnSell) btnSell.classList.toggle('active', tab === 'sell');
    if (btnBuy) btnBuy.classList.toggle('active', tab === 'buy');

    renderMarket();
}

function setMarketPosFilter(pos) {
    currentMarketPosFilter = pos;

    const filterBtns = document.querySelectorAll('.btn-pos-filter');
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-pos') === pos);
    });

    renderMarket();
}

// 포지션 카테고리 매칭 헬퍼
function matchPositionCategory(playerPos, category) {
    if (!category || category === 'all') return true;
    const p = (playerPos || '').toUpperCase();

    if (category === 'FW') {
        return ['ST', 'CF', 'LW', 'RW'].includes(p);
    }
    if (category === 'MF') {
        return ['CM', 'AM', 'CAM', 'DM', 'CDM', 'LM', 'RM'].includes(p);
    }
    if (category === 'DF') {
        return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p);
    }
    if (category === 'GK') {
        return p === 'GK';
    }
    return true;
}

// 등급 한글 라벨 헬퍼
function getRarityBadgeHtml(rarity) {
    const r = (rarity || 'normal').toLowerCase();
    let text = '노멀';
    let cls = 'market-rarity-normal';

    if (r === 'legend') {
        text = '전설';
        cls = 'market-rarity-legend';
    } else if (r === 'worldclass') {
        text = '월드클래스';
        cls = 'market-rarity-worldclass';
    } else if (r === 'special') {
        text = '스페셜';
        cls = 'market-rarity-special';
    }

    return `<span class="market-rarity-badge ${cls}">${text}</span>`;
}

// 이적시장 메인 렌더링 함수
function renderMarket() {
    try {
        const grid = document.getElementById('marketPlayerGrid');
        const countBadge = document.getElementById('marketCountVal');
        if (!grid) return;

        grid.innerHTML = '';

        if (currentMarketSubTab === 'sell') {
            // [방출 탭] 내가 보유한 선수 목록
            renderMarketSellList(grid, countBadge);
        } else {
            // [영입 탭] 내가 미보유한 전체 선수 목록
            renderMarketBuyList(grid, countBadge);
        }
    } catch (e) {
        console.error("renderMarket 에러:", e);
    }
}

// 7. [방출 탭] 렌더링
function renderMarketSellList(grid, countBadge) {
    if (typeof playerDeck === 'undefined') return;

    // 보유 선수 카드 목록 필터링
    const ownedKeys = Object.keys(playerDeck).filter(k => {
        const item = playerDeck[k];
        return item && (item.quantity > 0 || (typeof item.count === 'number' && item.count > 0));
    });

    // 포지션 필터링
    const filteredKeys = ownedKeys.filter(k => {
        const card = (typeof getAwakenedCard === 'function') ? getAwakenedCard(k) : (CARDS_DATABASE[k] || playerDeck[k].card);
        if (!card) return false;
        return matchPositionCategory(card.position, currentMarketPosFilter);
    });

    // OVR 내림차순 정렬
    filteredKeys.sort((a, b) => {
        const cardA = (typeof getAwakenedCard === 'function') ? getAwakenedCard(a) : (CARDS_DATABASE[a] || playerDeck[a].card);
        const cardB = (typeof getAwakenedCard === 'function') ? getAwakenedCard(b) : (CARDS_DATABASE[b] || playerDeck[b].card);
        return (cardB?.rating || 0) - (cardA?.rating || 0);
    });

    if (countBadge) countBadge.innerText = filteredKeys.length;

    if (filteredKeys.length === 0) {
        grid.innerHTML = `
            <div class="market-empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>해당 포지션 조건에 맞는 방출 가능한 선수가 없습니다.</p>
            </div>
        `;
        return;
    }

    filteredKeys.forEach(k => {
        const deckItem = playerDeck[k];
        const card = (typeof getAwakenedCard === 'function') ? getAwakenedCard(k) : (CARDS_DATABASE[k] || deckItem.card);
        if (!card) return;

        const baseRating = CARDS_DATABASE[k]?.rating || card.rating;
        const currentAwk = deckItem.awakening || 0;
        const sellPrice = calculatePlayerMarketPrice(baseRating, currentAwk);

        // 선발 출전 및 주장 여부
        const isStarting = (typeof squadFormation !== 'undefined') && Object.values(squadFormation).includes(k);
        const isCaptain = (typeof squadCaptainId !== 'undefined') && squadCaptainId === k;

        const cardEl = document.createElement('div');
        cardEl.className = 'market-player-card';

        const stats = card.stats || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 };
        const awkBadge = currentAwk > 0 ? `<span style="color: #ffd700; font-weight: 800; font-size: 0.8rem; margin-left: 4px;">★+${currentAwk}</span>` : '';
        const startingBadge = isStarting ? `<span style="background: rgba(0, 255, 135, 0.15); border: 1px solid #00ff87; color: #00ff87; font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; font-weight: 800;">선발</span>` : '';
        const captainBadge = isCaptain ? `<span style="background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; font-weight: 800;">주장</span>` : '';

        cardEl.innerHTML = `
            <div>
                <div class="market-card-top">
                    <div class="market-card-thumb" style="background: radial-gradient(circle, ${card.theme?.glow || '#ffd700'}22 0%, #0c1122 100%);">
                        <img src="${card.image}" alt="${card.name}" onerror="this.src='https://placehold.co/48x48/005a3c/ffd700?text=${encodeURIComponent(card.name)}'">
                    </div>
                    <div class="market-card-info">
                        <div class="market-card-name-row">
                            <h4 class="market-card-name">${card.name}</h4>
                            <span class="market-ovr-badge">OVR ${card.rating}</span>
                            ${getRarityBadgeHtml(card.rarity)}
                            ${awkBadge}
                            ${startingBadge}
                            ${captainBadge}
                        </div>
                        <div class="market-card-sub">
                            <span class="pos-tag">${typeof formatCardPosition === 'function' ? formatCardPosition(card.position) : card.position}</span>
                            <span>•</span>
                            <span>${card.club || 'FC STAR'}</span>
                            <span>•</span>
                            <span>${card.nation || ''}</span>
                        </div>
                    </div>
                </div>

                <div class="market-stats-row" style="margin-top: 0.75rem;">
                    <span class="market-stat-chip" style="background: rgba(255, 62, 108, 0.12); color: #ff3e6c;">속도 ${stats.pac}</span>
                    <span class="market-stat-chip" style="background: rgba(255, 159, 67, 0.12); color: #ff9f43;">슈팅 ${stats.sho}</span>
                    <span class="market-stat-chip" style="background: rgba(255, 215, 0, 0.12); color: #ffd700;">패스 ${stats.pas}</span>
                    <span class="market-stat-chip" style="background: rgba(0, 255, 135, 0.12); color: #00ff87;">드리블 ${stats.dri}</span>
                    <span class="market-stat-chip" style="background: rgba(0, 210, 252, 0.12); color: #00d2fc;">수비 ${stats.def}</span>
                    <span class="market-stat-chip" style="background: rgba(165, 88, 234, 0.12); color: #a55eea;">체력 ${stats.phy}</span>
                </div>
            </div>

            <div class="market-card-bottom">
                <div class="market-price-tag">
                    <span class="market-price-label">방출 가격</span>
                    <span class="market-price-val">+${sellPrice} <small style="font-size: 0.75rem; color: #cbd5e1;">FP</small></span>
                </div>
                <button class="btn-market-action btn-market-sell" onclick="sellPlayer('${k}')">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> 방출하기
                </button>
            </div>
        `;

        grid.appendChild(cardEl);
    });
}

// 8. [영입 탭] 렌더링
function renderMarketBuyList(grid, countBadge) {
    if (typeof CARDS_DATABASE === 'undefined') return;

    // 내가 미보유한 선수 (super 등급 제외)
    const availableKeys = Object.keys(CARDS_DATABASE).filter(k => {
        const card = CARDS_DATABASE[k];
        if (!card || card.rarity === 'super') return false;

        const isOwned = playerDeck && playerDeck[k] && (playerDeck[k].quantity > 0 || playerDeck[k].count > 0);
        return !isOwned;
    });

    // 포지션 필터링
    const filteredKeys = availableKeys.filter(k => {
        const card = CARDS_DATABASE[k];
        return matchPositionCategory(card.position, currentMarketPosFilter);
    });

    // OVR 내림차순 정렬
    filteredKeys.sort((a, b) => (CARDS_DATABASE[b]?.rating || 0) - (CARDS_DATABASE[a]?.rating || 0));

    if (countBadge) countBadge.innerText = filteredKeys.length;

    if (filteredKeys.length === 0) {
        grid.innerHTML = `
            <div class="market-empty-state">
                <i class="fa-solid fa-trophy"></i>
                <p>현재 영입 가능한 모든 선수를 이미 구단에 보유하고 있습니다!</p>
            </div>
        `;
        return;
    }

    filteredKeys.forEach(k => {
        const card = CARDS_DATABASE[k];
        const buyPrice = calculatePlayerMarketPrice(card.rating, 0);

        const cardEl = document.createElement('div');
        cardEl.className = 'market-player-card';

        const stats = card.stats || { pac: 70, sho: 70, pas: 70, dri: 70, def: 70, phy: 70 };

        cardEl.innerHTML = `
            <div>
                <div class="market-card-top">
                    <div class="market-card-thumb" style="background: radial-gradient(circle, ${card.theme?.glow || '#00d2fc'}22 0%, #0c1122 100%);">
                        <img src="${card.image}" alt="${card.name}" onerror="this.src='https://placehold.co/48x48/005a3c/ffd700?text=${encodeURIComponent(card.name)}'">
                    </div>
                    <div class="market-card-info">
                        <div class="market-card-name-row">
                            <h4 class="market-card-name">${card.name}</h4>
                            <span class="market-ovr-badge">OVR ${card.rating}</span>
                            ${getRarityBadgeHtml(card.rarity)}
                        </div>
                        <div class="market-card-sub">
                            <span class="pos-tag">${typeof formatCardPosition === 'function' ? formatCardPosition(card.position) : card.position}</span>
                            <span>•</span>
                            <span>${card.club || 'FC STAR'}</span>
                            <span>•</span>
                            <span>${card.nation || ''}</span>
                        </div>
                    </div>
                </div>

                <div class="market-stats-row" style="margin-top: 0.75rem;">
                    <span class="market-stat-chip" style="background: rgba(255, 62, 108, 0.12); color: #ff3e6c;">속도 ${stats.pac}</span>
                    <span class="market-stat-chip" style="background: rgba(255, 159, 67, 0.12); color: #ff9f43;">슈팅 ${stats.sho}</span>
                    <span class="market-stat-chip" style="background: rgba(255, 215, 0, 0.12); color: #ffd700;">패스 ${stats.pas}</span>
                    <span class="market-stat-chip" style="background: rgba(0, 255, 135, 0.12); color: #00ff87;">드리블 ${stats.dri}</span>
                    <span class="market-stat-chip" style="background: rgba(0, 210, 252, 0.12); color: #00d2fc;">수비 ${stats.def}</span>
                    <span class="market-stat-chip" style="background: rgba(165, 88, 234, 0.12); color: #a55eea;">체력 ${stats.phy}</span>
                </div>
            </div>

            <div class="market-card-bottom">
                <div class="market-price-tag">
                    <span class="market-price-label">영입 가격</span>
                    <span class="market-price-val">${buyPrice} <small style="font-size: 0.75rem; color: #cbd5e1;">FP</small></span>
                </div>
                <button class="btn-market-action btn-market-buy" onclick="buyPlayer('${k}')">
                    <i class="fa-solid fa-cart-plus"></i> 영입하기
                </button>
            </div>
        `;

        grid.appendChild(cardEl);
    });
}

// 9. 선수 방출 실행 함수
function sellPlayer(cardId) {
    try {
        if (!playerDeck || !playerDeck[cardId]) return;

        // 전체 보유 선수 수 11명 미만 방출 차단
        const ownedKeys = Object.keys(playerDeck).filter(k => {
            const item = playerDeck[k];
            return item && (item.quantity > 0 || (typeof item.count === 'number' && item.count > 0));
        });

        if (ownedKeys.length <= 11) {
            alert("⚠️ 경기에 출전할 최소 선발 인원(11명)을 유지해야 하므로 더 이상 방출할 수 없습니다!");
            return;
        }

        const deckItem = playerDeck[cardId];
        const card = CARDS_DATABASE[cardId] || deckItem.card;
        const currentAwk = deckItem.awakening || 0;
        const price = calculatePlayerMarketPrice(card.rating, currentAwk);

        // 선발 출전 및 주장 여부 확인
        const isStarting = (typeof squadFormation !== 'undefined') && Object.values(squadFormation).includes(cardId);
        const isCaptain = (typeof squadCaptainId !== 'undefined') && squadCaptainId === cardId;

        if (isStarting || isCaptain) {
            const roleDesc = isCaptain ? "선발 라인업 및 구단 주장" : "선발 라인업";
            const confirmRelease = confirm(`⚠️ '${card.name}' 선수는 현재 [${roleDesc}]에 등록되어 있습니다.\n선발/주장에서 해제하고 ${price} FP에 방출하시겠습니까?`);
            if (!confirmRelease) return;

            // 선발 포메이션에서 해제
            if (typeof squadFormation !== 'undefined') {
                Object.keys(squadFormation).forEach(pos => {
                    if (squadFormation[pos] === cardId) {
                        squadFormation[pos] = null;
                    }
                });
            }
            // 주장 해제
            if (isCaptain && typeof squadCaptainId !== 'undefined') {
                squadCaptainId = null;
                try {
                    localStorage.removeItem('fc_star_squad_captain_id');
                } catch(e) {}
            }
        } else {
            const confirmSell = confirm(`'${card.name}' 선수를 방출하고 ${price} FP를 획득하시겠습니까?`);
            if (!confirmSell) return;
        }

        // 방출 실행: FP 증가 및 덱에서 제거
        userPoints += price;
        delete playerDeck[cardId];

        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
            if (typeof squadFormation !== 'undefined') {
                localStorage.setItem('fc_star_squad_formation', JSON.stringify(squadFormation));
            }
        } catch(e) {}

        if (typeof saveUserProgress === 'function') {
            saveUserProgress(true);
        }

        if (typeof renderUserPoints === 'function') renderUserPoints();
        if (typeof renderDeck === 'function') renderDeck();
        if (typeof renderSquadFormation === 'function') renderSquadFormation();
        if (typeof playSound === 'function') playSound('reveal', 0.2);

        renderMarket();

        if (typeof showToast === 'function') {
            showToast(`💸 ${card.name} 선수를 방출하여 +${price} FP를 획득했습니다!`);
        }
    } catch (e) {
        console.error("sellPlayer 에러:", e);
        alert("선수 방출 중 오류가 발생했습니다: " + e.message);
    }
}

// 10. 선수 영입 실행 함수
function buyPlayer(cardId) {
    try {
        if (!CARDS_DATABASE || !CARDS_DATABASE[cardId]) return;

        const card = CARDS_DATABASE[cardId];
        const price = calculatePlayerMarketPrice(card.rating, 0);

        if (typeof userPoints === 'undefined' || userPoints < price) {
            alert(`⚠️ 보유 포인트(FP)가 부족합니다!\n(필요: ${price} FP / 보유: ${userPoints || 0} FP)`);
            return;
        }

        const confirmBuy = confirm(`'${card.name}' 선수를 ${price} FP로 영입하시겠습니까?\n(영입 후 잔여: ${userPoints - price} FP)`);
        if (!confirmBuy) return;

        // 영입 실행: FP 차감 및 내 덱에 추가
        userPoints -= price;

        if (typeof playerDeck === 'undefined') playerDeck = {};
        playerDeck[cardId] = {
            id: cardId,
            quantity: 1,
            awakening: 0,
            isStored: false,
            card: card
        };

        try {
            localStorage.setItem('fc_star_user_points', userPoints.toString());
            localStorage.setItem('fc_star_player_deck', JSON.stringify(playerDeck));
        } catch(e) {}

        if (typeof saveUserProgress === 'function') {
            saveUserProgress(true);
        }

        if (typeof renderUserPoints === 'function') renderUserPoints();
        if (typeof renderDeck === 'function') renderDeck();
        if (typeof createSparkParticles === 'function') createSparkParticles(true, '#00d2fc');
        if (typeof playSound === 'function') playSound('reveal', 0.3);

        renderMarket();

        if (typeof showToast === 'function') {
            showToast(`🎉 ${card.name} 선수를 성공적으로 영입했습니다!`);
        }
    } catch (e) {
        console.error("buyPlayer 에러:", e);
        alert("선수 영입 중 오류가 발생했습니다: " + e.message);
    }
}
