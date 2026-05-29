// quiz.js - 영어 단어 퀴즈 시스템 비즈니스 엔진

// 1. QUIZ SYSTEM STATE VARIABLES
let quizQueue = [];
let quizCurrentIndex = 0;
let quizSolvedCount = 0;
let isQuizAnswering = false;

// 한국어 정답 유사도 검증 함수 (동사, 형용사 대략 비슷하게 적어도 정답 판정)
function checkKoreanAnswer(userAns, correctAns) {
    if (!userAns || !correctAns) return false;
    
    // 콤마(,), 슬래시(/), 또는 수직바(|) 기준으로 여러 개의 뜻이 기재되어 있을 경우 분할하여 개별 판정
    const candidates = correctAns.split(/[,/|]/).map(s => s.trim()).filter(s => s.length > 0);
    
    for (let cand of candidates) {
        if (checkSingleKoreanAnswer(userAns, cand)) {
            return true;
        }
    }
    return false;
}

function checkSingleKoreanAnswer(userAns, correctAns) {
    if (!userAns || !correctAns) return false;
    
    // 1. 공백 제거 및 부호 제거
    const cleanStr = (str) => {
        return str
            .replace(/\s+/g, '') // 모든 공백 제거
            .replace(/[~.,\/#!$%\^&\*;:{}=\-_`\"\'()?~]/g, '') // 문장부호 및 물결 기호 제거
            .trim();
    };

    const cleanUser = cleanStr(userAns);
    const cleanCorrect = cleanStr(correctAns);

    if (cleanUser === cleanCorrect) return true;

    // 2. 다양한 정답 형태 파싱 및 추출 (예: "안녕 (헤어질 때)" -> ["안녕", "헤어질때"])
    const getOptions = (str) => {
        const options = [];
        options.push(str);
        
        // 괄호 안의 단어 추출
        const parenRegex = /\(([^)]+)\)/g;
        let match;
        while ((match = parenRegex.exec(str)) !== null) {
            options.push(match[1]);
        }
        
        // 괄호 및 그 내용 완전 삭제한 단어 추출
        const withoutParen = str.replace(/\([^)]*\)/g, '').trim();
        options.push(withoutParen);
        
        return options.map(opt => cleanStr(opt)).filter(opt => opt.length > 0);
    };

    const correctOptions = getOptions(correctAns);

    if (correctOptions.includes(cleanUser)) return true;

    // 3. 특정 단어 조사/접사 필터링 및 동사/형용사 어근 유사성 검사
    for (let opt of correctOptions) {
        // 앞뒤의 조사나 물결 관련 기호 접두사 제거
        const stripParticles = (s) => {
            return s
                .replace(/^(을|를|에|의|에게|으로|로|에서|위에|아래로|안에|밖으로|밖에서)/, '')
                .replace(/(을|를|에|의|에게|으로|로|에서|위에|아래로|안에|밖으로|밖해서)$/, '');
        };

        const optStripped = stripParticles(opt);
        const userStripped = stripParticles(cleanUser);

        if (optStripped === userStripped && userStripped.length > 0) return true;

        // 동사, 형용사 어미 변형 완화 (예: "행복한", "행복하다", "행복" -> 어근 "행복" 추출)
        const stem = (s) => {
            return s
                .replace(/(하다|한|다|은|운|기|음|은것|는것|해|워|아|어)$/, '')
                .trim();
        };

        const optStem = stem(optStripped);
        const userStem = stem(userStripped);

        // 어근이 동일하고 어근 길이가 2글자 이상이면 정답 판정 (예: "수영" === "수영", "행복" === "행복")
        if (optStem === userStem && userStem.length >= 2) return true;

        // 부분 일치 검사 (예: "스케이트타다" 인데 사용자가 "스케이트"만 적은 경우)
        if (opt.includes(cleanUser) && cleanUser.length >= 2) return true;
        if (cleanUser.includes(opt) && opt.length >= 2) return true;

        // ㅂ-불규칙 동사/형용사 특수 지원 (예: "추운" -> "춥다", "추워")
        if (optStem.startsWith("추") && userStem.startsWith("춥") && optStem.length === 1 && userStem.length === 1) return true;
        if (optStem.startsWith("춥") && userStem.startsWith("추") && optStem.length === 1 && userStem.length === 1) return true;
        
        // 돕다/도와주다 (help)
        if (opt.includes("돕다") && (cleanUser.includes("돕") || cleanUser.includes("도와"))) return true;
    }

    // 4. 수작업 데이터베이스 하드코딩 예외 처리 (정확도 극대화)
    const lowerUser = cleanUser;
    
    // can (할 수 있다) -> 할수, 있다, 할수있다, 가능하다
    if (correctOptions.includes("할수있다")) {
        if (["할수", "있다", "가능", "가능하다", "할수있다", "할수있음"].includes(lowerUser)) return true;
    }
    // bye (안녕) / hello (안녕) / hi (안녕)
    if (correctOptions.some(o => o.includes("안녕"))) {
        if (lowerUser === "안녕" || lowerUser === "안녕하세요" || lowerUser === "하이" || lowerUser === "바이") return true;
    }
    // chicken (닭)
    if (correctOptions.includes("닭치킨")) {
        if (lowerUser === "닭" || lowerUser === "치킨" || lowerUser === "치킹") return true;
    }
    // lunch (점심)
    if (correctOptions.includes("점심점심식사")) {
        if (lowerUser === "점심" || lowerUser === "점심식사" || lowerUser === "밥") return true;
    }
    // please (제발)
    if (correctOptions.includes("제발부디")) {
        if (lowerUser === "제발" || lowerUser === "부디") return true;
    }
    // sure (물론)
    if (correctOptions.includes("물론확신하는")) {
        if (lowerUser === "물론" || lowerUser === "확신" || lowerUser === "확신한다" || lowerUser === "당연하지" || lowerUser === "당연") return true;
    }

    return false;
}

function initQuizRound() {
    try {
        console.log("initQuizRound() 시작");
        if (!QUIZ_WORDS || QUIZ_WORDS.length === 0) {
            showToast("오류: 단어 데이터를 불러오지 못했습니다.");
            alert("단어 데이터 QUIZ_WORDS가 정의되지 않았거나 비어있습니다. player/quiz_data.js가 정상적으로 로드되었는지 확인해주세요.");
            return;
        }

        // 일 단위 초기화 로직 적용 (날짜가 바뀌면 quizOffset을 0으로 리셋)
        try {
            const todayStr = new Date().toLocaleDateString('ko-KR');
            
            if (currentUser) {
                // Firebase / 로그인 유저 모드
                if (quizLastDate !== todayStr) {
                    quizOffset = 0;
                    quizLastDate = todayStr;
                    console.log("📅 [Firebase 모드] 새로운 날짜 감지: 퀴즈 출제 오프셋을 0으로 초기화합니다.");
                    saveUserProgress(); // 클라우드에 백업 저장
                }
            } else {
                // 비회원 로컬스토리지 모드
                const savedDate = localStorage.getItem('fc_star_quiz_last_date');
                if (savedDate !== todayStr) {
                    quizOffset = 0;
                    localStorage.setItem('fc_star_quiz_last_date', todayStr);
                    localStorage.setItem('fc_star_quiz_offset', '0');
                    console.log("📅 [로컬 모드] 새로운 날짜 감지: 퀴즈 출제 오프셋을 0으로 초기화합니다.");
                } else {
                    const savedOffset = localStorage.getItem('fc_star_quiz_offset');
                    if (savedOffset !== null) {
                        quizOffset = parseInt(savedOffset) || 0;
                    }
                }
            }
        } catch (dateErr) {
            console.warn("날짜 확인 중 오류 발생, 메모리상의 quizOffset을 사용합니다.", dateErr);
        }
        // 60개의 최신 단어 풀 설정 및 순환 출제 적용
        const poolSize = Math.min(60, QUIZ_WORDS.length);
        const recentPool = QUIZ_WORDS.slice(-poolSize).reverse(); // 최신 등록 단어가 우선이 되도록 역순 배치

        if (poolSize <= 10) {
            quizQueue = [...recentPool];
            quizOffset = 0;
        } else {
            if (quizOffset + 10 > poolSize) {
                quizOffset = 0; // 60개 단어 범위를 초과하면 다시 최신 단어부터 반복 순환
            }
            quizQueue = recentPool.slice(quizOffset, quizOffset + 10);
            
            // 다음 라운드를 위해 오프셋을 10만큼 증가
            quizOffset += 10;
        }

        // Save progress to Firebase or LocalStorage
        try {
            const todayStr = new Date().toLocaleDateString('ko-KR');
            if (currentUser) {
                quizLastDate = todayStr;
                saveUserProgress();
            } else {
                localStorage.setItem('fc_star_quiz_last_date', todayStr);
                localStorage.setItem('fc_star_quiz_offset', quizOffset.toString());
            }
        } catch (saveErr) {
            console.warn("퀴즈 오프셋 저장 실패:", saveErr);
        }
        
        quizCurrentIndex = 0;
        quizSolvedCount = 0;
        isQuizAnswering = false;

        // Reset UI displays
        const feedbackBox = document.getElementById('quizFeedbackBox');
        if (feedbackBox) feedbackBox.style.display = 'none';

        const completeOverlay = document.getElementById('quizCompleteOverlay');
        if (completeOverlay) completeOverlay.style.display = 'none';

        const ansInput = document.getElementById('quizAnswerInput');
        if (ansInput) {
            ansInput.value = '';
            ansInput.disabled = false;
            ansInput.style.borderColor = '';
            ansInput.style.boxShadow = '';
        }

        renderQuizCurrent();
    } catch (e) {
        console.error("initQuizRound 에러 발생:", e);
        alert("퀴즈 초기화 중 에러 발생: " + e.message);
    }
}

function renderQuizCurrent() {
    try {
        if (!quizQueue || quizQueue.length === 0 || quizCurrentIndex >= quizQueue.length) {
            console.warn("renderQuizCurrent: quizQueue가 없거나 인덱스를 초과함");
            return;
        }

        const currentItem = quizQueue[quizCurrentIndex];
        if (!currentItem) {
            console.error("renderQuizCurrent: 현재 퀴즈 아이템이 유효하지 않음");
            return;
        }
        
        // Set Question
        const qWordEl = document.getElementById('quizQuestionWord');
        if (qWordEl) {
            qWordEl.innerText = currentItem.word || "";
        }
        
        // Set Progress text e.g. "1 / 10"
        const qProgTextEl = document.getElementById('quizProgressText');
        if (qProgTextEl) {
            qProgTextEl.innerText = `${quizSolvedCount + 1} / 10`;
        }
        
        // Set Progress bar percentage width
        const qBarEl = document.getElementById('quizProgressBar');
        if (qBarEl) {
            const pct = (quizSolvedCount / 10) * 100;
            qBarEl.style.width = `${pct}%`;
        }

        // Focus input field
        const inputField = document.getElementById('quizAnswerInput');
        if (inputField) {
            inputField.value = '';
            inputField.style.borderColor = '';
            inputField.style.boxShadow = '';
            inputField.disabled = false;
            setTimeout(() => inputField.focus(), 50);
        }
    } catch(e) {
        console.error("renderQuizCurrent 에러 발생:", e);
    }
}

function submitQuizAnswer() {
    try {
        console.log("submitQuizAnswer() 호출됨, isQuizAnswering 상태:", isQuizAnswering);
        if (isQuizAnswering) return;
        if (!quizQueue || quizQueue.length === 0 || quizCurrentIndex >= quizQueue.length) {
            console.warn("퀴즈 큐가 유효하지 않음");
            return;
        }

        const currentItem = quizQueue[quizCurrentIndex];
        if (!currentItem || !currentItem.word) {
            console.error("현재 퀴즈 아이템이나 단어 정보가 부족합니다", currentItem);
            return;
        }

        const inputField = document.getElementById('quizAnswerInput');
        if (!inputField) {
            console.error("quizAnswerInput 요소를 찾을 수 없음");
            return;
        }

        const userAnswer = inputField.value.trim();
        const correctAnswer = currentItem.meaning.trim();

        if (userAnswer === "") {
            showToast("답변을 입력해주세요!");
            return;
        }

        if (checkKoreanAnswer(userAnswer, correctAnswer)) {
            // CORRECT ANSWER
            isQuizAnswering = true;
            inputField.disabled = true;
            
            // Green glow feedback
            inputField.style.borderColor = '#00ff87';
            inputField.style.boxShadow = '0 0 25px rgba(0, 255, 135, 0.6)';
            
            // Sounds & Sparks
            playSound('reveal');
            createSparkParticles(true, '#00ff87');
            
            setTimeout(() => {
                try {
                    quizSolvedCount++;
                    
                    // Remove correctly solved word from the active queue
                    quizQueue.splice(quizCurrentIndex, 1);
                    
                    if (quizSolvedCount >= 10) {
                        // QUIZ COMPLETED!
                        userPoints += 1;
                        userLevel += 1; // 10문제를 완전 풀이 시 레벨 1 증가
                        
                        try {
                            localStorage.setItem('fc_star_user_points', userPoints.toString());
                            localStorage.setItem('fc_star_user_level', userLevel.toString());
                        } catch(e) {}
                        
                        renderUserPoints(); // Update points widget
                        if (typeof renderUserLevel === 'function') renderUserLevel(); // Update level UI
                        
                        // Show Level Up in complete overlay
                        const compLvlVal = document.getElementById('completeLevelVal');
                        if (compLvlVal) compLvlVal.innerText = userLevel;
                        
                        // Show Success Screen
                        const compOverlay = document.getElementById('quizCompleteOverlay');
                        if (compOverlay) compOverlay.style.display = 'flex';
                        playSound('reveal');
                        createSparkParticles(true, '#ffd700');
                        
                        // Auto-save user data to cloud after quiz rewards
                        saveUserProgress();
                    } else {
                        // Proceed to next
                        isQuizAnswering = false;
                        
                        // Adjust index: if current index is now out of bounds, wrap to 0
                        if (quizCurrentIndex >= quizQueue.length) {
                            quizCurrentIndex = 0;
                        }
                        
                        renderQuizCurrent();
                    }
                } catch(innerErr) {
                    console.error("정답 처리 내부 타이머 오류:", innerErr);
                    isQuizAnswering = false;
                }
            }, 1000);
            
        } else {
            // INCORRECT ANSWER
            // Shake feedback effect on input
            inputField.classList.add('shake-input');
            inputField.style.borderColor = '#ef4444';
            inputField.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
            playSound('rumble');
            
            showToast("오답입니다! 다시 한 번 생각해보세요.");
            
            setTimeout(() => {
                inputField.classList.remove('shake-input');
                inputField.style.borderColor = '';
                inputField.style.boxShadow = '';
                inputField.value = '';
                inputField.focus();
            }, 800);
        }
    } catch (e) {
        console.error("submitQuizAnswer 전체 에러 발생:", e);
        alert("정답 검증 중 치명적 오류 발생: " + e.message);
        isQuizAnswering = false;
    }
}

function passQuizQuestion() {
    try {
        console.log("passQuizQuestion() 호출됨, isQuizAnswering 상태:", isQuizAnswering);
        if (isQuizAnswering) return;
        if (!quizQueue || quizQueue.length === 0 || quizCurrentIndex >= quizQueue.length) {
            console.warn("패스할 퀴즈가 존재하지 않음");
            return;
        }

        isQuizAnswering = true;
        const currentItem = quizQueue[quizCurrentIndex];
        if (!currentItem || !currentItem.word) {
            console.error("현재 퀴즈 정보 부족");
            isQuizAnswering = false;
            return;
        }

        const inputField = document.getElementById('quizAnswerInput');
        if (inputField) inputField.disabled = true;
        
        playSound('rumble');

        // Show correct answer in feedback box
        const feedbackBox = document.getElementById('quizFeedbackBox');
        const feedbackMsg = document.getElementById('feedbackMessage');
        
        if (feedbackBox && feedbackMsg) {
            feedbackMsg.innerHTML = `정답은 <strong>${currentItem.meaning}</strong> 입니다! 단어는 이번 라운드 후반부에 다시 출제됩니다.`;
            feedbackBox.style.display = 'flex';
        }

        // Move passed word to the end of queue to re-appear later
        const passedWord = quizQueue[quizCurrentIndex];
        quizQueue.push(passedWord);
        quizQueue.splice(quizCurrentIndex, 1);

        // Keep active index at the same numerical spot (unless wrap-around is needed),
        // because splice shifts all elements forward.
        if (quizCurrentIndex >= quizQueue.length) {
            quizCurrentIndex = 0;
        }

        setTimeout(() => {
            try {
                if (feedbackBox) feedbackBox.style.display = 'none';
                isQuizAnswering = false;
                renderQuizCurrent();
            } catch(innerErr) {
                console.error("패스 복구 타이머 오류:", innerErr);
                isQuizAnswering = false;
            }
        }, 2200); // Give user enough time to read and memorize the correct answer
    } catch(e) {
        console.error("passQuizQuestion 에러 발생:", e);
        alert("퀴즈 패스(Pass) 중 에러 발생: " + e.message);
        isQuizAnswering = false;
    }
}

function startNewQuizRound() {
    initQuizRound();
    if (typeof checkLevelUpRewards === 'function') {
        checkLevelUpRewards(userLevel);
    }
}

// 퀴즈 출제 순서 초기화 함수 (최신 단어부터 다시 출제되도록 세팅)
function resetQuizOffset() {
    const confirmReset = confirm("🔄 단어 퀴즈 출제 순서를 최신 등록 단어(마지막 단어)부터 시작하도록 초기화하시겠습니까?");
    if (!confirmReset) return;

    quizOffset = 0;
    const todayStr = new Date().toLocaleDateString('ko-KR');
    quizLastDate = todayStr;

    try {
        if (currentUser) {
            saveUserProgress();
        } else {
            localStorage.setItem('fc_star_quiz_last_date', todayStr);
            localStorage.setItem('fc_star_quiz_offset', '0');
        }
    } catch(e) {
        console.warn("퀴즈 초기화 진행도 세이브 실패:", e);
    }

    initQuizRound();
    showToast("🔄 단어 퀴즈가 최신 등록 순으로 초기화되었습니다!");
}
