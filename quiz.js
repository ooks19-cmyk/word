// quiz.js - 영어 단어 퀴즈 시스템 비즈니스 엔진

// 1. QUIZ SYSTEM STATE VARIABLES
let quizQueue = [];
let quizCurrentIndex = 0;
let quizSolvedCount = 0;
let isQuizAnswering = false;

// 로컬스토리지로부터 진행 상태 복원 시도
try {
    const savedQueue = localStorage.getItem('fc_star_quiz_queue');
    if (savedQueue) quizQueue = JSON.parse(savedQueue) || [];
    
    const savedSolvedCount = localStorage.getItem('fc_star_quiz_solved_count');
    if (savedSolvedCount !== null) quizSolvedCount = parseInt(savedSolvedCount) || 0;
    
    const savedCurrentIndex = localStorage.getItem('fc_star_quiz_current_index');
    if (savedCurrentIndex !== null) quizCurrentIndex = parseInt(savedCurrentIndex) || 0;
} catch (e) {
    console.warn("로컬 퀴즈 진행 상태 복원 실패:", e);
}

// 퀴즈 진행 상태 저장 및 클라우드 동기화 함수
function saveQuizState() {
    try {
        localStorage.setItem('fc_star_quiz_queue', JSON.stringify(quizQueue));
        localStorage.setItem('fc_star_quiz_solved_count', quizSolvedCount.toString());
        localStorage.setItem('fc_star_quiz_current_index', quizCurrentIndex.toString());
        localStorage.setItem('fc_star_quiz_offset', quizOffset.toString());
        localStorage.setItem('fc_star_quiz_last_date', quizLastDate);
        
        // 로그인 상태인 경우 클라우드에 즉시 백업 저장
        if (typeof currentUser !== 'undefined' && currentUser) {
            saveUserProgress();
        }
    } catch (e) {
        console.warn("퀴즈 진행 상태 로컬 저장 실패:", e);
    }
}


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
            alert("단어 데이터 QUIZ_WORDS가 정의되지 않았거나 비어있습니다. quiz_data.js가 정상적으로 로드되었는지 확인해주세요.");
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
        // 최근 20개의 단어 풀 설정 및 무작위 5개 추출
        const poolSize = Math.min(20, QUIZ_WORDS.length);
        const recentPool = QUIZ_WORDS.slice(-poolSize).reverse(); // 최신 등록 단어가 우선이 되도록 역순 배치

        // Fisher-Yates 무작위 셔플 알고리즘 적용
        const shuffled = [...recentPool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // 무작위 5개 단어를 퀴즈 큐로 선정 (단어가 5개보다 적다면 전체 복사)
        const selectCount = Math.min(5, shuffled.length);
        quizQueue = shuffled.slice(0, selectCount);
        quizOffset = 0; // 더 이상 순차 오프셋은 불필요하므로 0으로 기본화

        // Save progress to Firebase or LocalStorage
        try {
            const todayStr = new Date().toLocaleDateString('ko-KR');
            if (currentUser) {
                quizLastDate = todayStr;
                saveUserProgress();
            } else {
                localStorage.setItem('fc_star_quiz_last_date', todayStr);
                localStorage.setItem('fc_star_quiz_offset', '0');
            }
        } catch (saveErr) {
            console.warn("퀴즈 진행 상태 저장 실패:", saveErr);
        }
        
        quizCurrentIndex = 0;
        quizSolvedCount = 0;
        isQuizAnswering = false;

        // Save State locally & cloud
        saveQuizState();

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
        
        // Sync Autoplay checkbox and icon style
        const autoplayCheckbox = document.getElementById('quizAutoplayCheckbox');
        const volIcon = document.getElementById('autoplayVolumeIcon');
        if (autoplayCheckbox) {
            autoplayCheckbox.checked = isQuizTtsAutoplay;
        }
        if (volIcon) {
            volIcon.style.color = isQuizTtsAutoplay ? '#00ff87' : 'var(--text-muted)';
            volIcon.style.filter = isQuizTtsAutoplay ? 'drop-shadow(0 0 5px rgba(0, 255, 135, 0.5))' : '';
        }
        
        // Set Question
        const qWordEl = document.getElementById('quizQuestionWord');
        if (qWordEl) {
            qWordEl.innerText = currentItem.word || "";
        }
        
        // Set Progress text e.g. "1 / 5"
        const qProgTextEl = document.getElementById('quizProgressText');
        if (qProgTextEl) {
            qProgTextEl.innerText = `${Math.min(5, quizSolvedCount + 1)} / 5`;
        }
        
        // Set Progress bar percentage width
        const qBarEl = document.getElementById('quizProgressBar');
        if (qBarEl) {
            const pct = (quizSolvedCount / 5) * 100;
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

        // Auto-play TTS if enabled
        if (isQuizTtsAutoplay) {
            setTimeout(() => {
                speakCurrentWord(true); // true = autoplay trigger
            }, 150);
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
            
            // Sounds & Sparks (30% 효과음 볼륨 세팅)
            playSound('reveal', 0.3);
            createSparkParticles(true, '#00ff87');
            
            setTimeout(() => {
                try {
                    quizSolvedCount++;
                    
                    // Remove correctly solved word from the active queue
                    quizQueue.splice(quizCurrentIndex, 1);
                    
                    if (quizSolvedCount >= 5) {
                        // QUIZ COMPLETED!
                        userPoints += 1;
                        userLevel += 1; // 5문제를 완전 풀이 시 레벨 1 증가
                        
                        try {
                            localStorage.setItem('fc_star_user_points', userPoints.toString());
                            localStorage.setItem('fc_star_user_level', userLevel.toString());
                        } catch(e) {}
                        
                        renderUserPoints(); // Update points widget
                        if (typeof renderUserLevel === 'function') renderUserLevel(); // Update level UI
                        
                        // [즉시 보상 버그 해결] 레벨 10단위 특별 보상 즉시 연동 및 팝업 활성화
                        if (typeof checkLevelUpRewards === 'function') {
                            checkLevelUpRewards(userLevel);
                        }
                        
                        // Show Level Up in complete overlay
                        const compLvlVal = document.getElementById('completeLevelVal');
                        if (compLvlVal) compLvlVal.innerText = userLevel;
                        
                        // Show Success Screen
                        const compOverlay = document.getElementById('quizCompleteOverlay');
                        if (compOverlay) compOverlay.style.display = 'flex';
                        playSound('reveal', 0.3);
                        createSparkParticles(true, '#ffd700');
                        
                        // Save State locally & cloud
                        saveQuizState();
                    } else {
                        // Proceed to next
                        isQuizAnswering = false;
                        
                        // Adjust index: if current index is now out of bounds, wrap to 0
                        if (quizCurrentIndex >= quizQueue.length) {
                            quizCurrentIndex = 0;
                        }
                        
                        // Save State locally & cloud
                        saveQuizState();
                        
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
            playSound('rumble', 0.3);
            
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
        
        playSound('rumble', 0.3);

        // Move passed word to the end of queue to re-appear later
        const passedWord = quizQueue[quizCurrentIndex];
        quizQueue.push(passedWord);
        quizQueue.splice(quizCurrentIndex, 1);

        // Keep active index at the same numerical spot (unless wrap-around is needed),
        // because splice shifts all elements forward.
        if (quizCurrentIndex >= quizQueue.length) {
            quizCurrentIndex = 0;
        }

        // Save State locally & cloud
        saveQuizState();

        // Show correct answer in feedback box with click-to-close handler
        const feedbackBox = document.getElementById('quizFeedbackBox');
        const feedbackMsg = document.getElementById('feedbackMessage');
        
        if (feedbackBox && feedbackMsg) {
            feedbackMsg.innerHTML = `정답은 <strong>${currentItem.meaning}</strong> 입니다!<br><span style="font-size: 0.8rem; opacity: 0.8; font-weight: normal; display: block; margin-top: 5px; color: #ffd700;"><i class="fa-solid fa-hand-pointer"></i> 화면(여기)을 누르면 다음 문제로 진행합니다</span>`;
            feedbackBox.style.display = 'flex';
            feedbackBox.style.cursor = 'pointer';
            
            // 클릭 이벤트 리스너 바인딩
            feedbackBox.onclick = () => {
                feedbackBox.style.display = 'none';
                feedbackBox.onclick = null; // 이벤트 제거
                isQuizAnswering = false;
                renderQuizCurrent();
            };
        }
    } catch(e) {
        console.error("passQuizQuestion 에러 발생:", e);
        alert("퀴즈 패스(Pass) 중 에러 발생: " + e.message);
        isQuizAnswering = false;
    }
}

function startNewQuizRound() {
    initQuizRound();
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

// ==========================================================================
// 8. TEXT-TO-SPEECH (TTS) SYSTEM & PREFERENCE TOGGLE INTERACTION
// ==========================================================================

// 영어 단어 음성 발화 (TTS) 재생 함수
function speakCurrentWord(isAutoplayTrigger = false) {
    try {
        if (!quizQueue || quizQueue.length === 0 || quizCurrentIndex >= quizQueue.length) {
            return;
        }

        const currentItem = quizQueue[quizCurrentIndex];
        if (!currentItem || !currentItem.word) {
            return;
        }

        if ('speechSynthesis' in window) {
            // 연속 클릭 시 재생 대기열 겹침 방지 (기존 오디오 즉각 정지)
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(currentItem.word);
            utterance.lang = 'en-US'; // 영어 원어민 발음 설정

            // 모바일 및 다양한 기기 환경에서 가장 알맞은 영어 음성 검색 시도
            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
            if (enVoice) {
                utterance.voice = enVoice;
            }

            // 시각적 피드백 효과 연동 요소
            const ttsIcon = document.getElementById('quizTtsIcon');
            const wordWrapper = document.querySelector('.quiz-word-wrapper');

            utterance.onstart = () => {
                if (ttsIcon) ttsIcon.classList.add('speaking-active');
                if (wordWrapper) wordWrapper.classList.add('speaking');
            };

            utterance.onend = () => {
                if (ttsIcon) ttsIcon.classList.remove('speaking-active');
                if (wordWrapper) wordWrapper.classList.remove('speaking');
            };

            utterance.onerror = () => {
                if (ttsIcon) ttsIcon.classList.remove('speaking-active');
                if (wordWrapper) wordWrapper.classList.remove('speaking');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // 브라우저 미지원 시 대체 토스트 알림 (자동재생 트리거인 경우 무시)
            if (!isAutoplayTrigger) {
                showToast("⚠️ 이 브라우저는 영어 발음 듣기(TTS) 기능을 지원하지 않습니다.");
            }
        }
    } catch (err) {
        console.warn("TTS 발화 재생 실패:", err);
    }
}

// 자동 재생 옵션 토글 함수 (화면 스위치 연동)
function toggleQuizAutoplay(isChecked) {
    try {
        isQuizTtsAutoplay = isChecked;
        localStorage.setItem('fc_star_quiz_tts_autoplay', isChecked ? 'true' : 'false');
        
        // 상단 볼륨 아이콘 색상 및 필터 실시간 연동
        const volIcon = document.getElementById('autoplayVolumeIcon');
        if (volIcon) {
            volIcon.style.color = isChecked ? '#00ff87' : 'var(--text-muted)';
            if (isChecked) {
                volIcon.style.filter = 'drop-shadow(0 0 5px rgba(0, 255, 135, 0.5))';
            } else {
                volIcon.style.filter = '';
            }
        }
        
        showToast(isChecked ? "🔊 문제 전환 시 단어 발음이 자동으로 재생됩니다!" : "🔇 자동 발음이 해제되었습니다. 단어를 누르면 들으실 수 있습니다.");
        
        // 활성화 순간 검증 차원 즉시 1회 테스트 재생
        if (isChecked) {
            speakCurrentWord();
        }
    } catch (e) {
        console.warn("자동 재생 설정 저장 실패:", e);
    }
}

