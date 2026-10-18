// tests/quiz_subjective.test.cjs - 단어 퀴즈 주관식 전환 및 정답 채점 엔진 단위/통합 테스트
const assert = require('assert');
const fs = require('fs');

const quizSource = fs.readFileSync('quiz.js', 'utf8');
const appSource = fs.readFileSync('app.js', 'utf8');
const htmlSource = fs.readFileSync('index.html', 'utf8');
const swSource = fs.readFileSync('sw.js', 'utf8');

console.log('=== [1] 주관식 모드 설정 검증 ===');
// isMultipleChoice 변수가 false로 선언되어 있는지 검증
const mcMatch = quizSource.match(/const\s+isMultipleChoice\s*=\s*(false|true)\s*;/);
assert.ok(mcMatch, 'isMultipleChoice 변수가 선언되어 있어야 합니다.');
assert.strictEqual(mcMatch[1], 'false', '단어 퀴즈는 주관식 모드(isMultipleChoice = false)여야 합니다.');
console.log('PASS: isMultipleChoice = false 설정 확인 완료.');

console.log('=== [2] checkKoreanAnswer 채점 엔진 로직 검증 ===');
// checkKoreanAnswer 및 checkSingleKoreanAnswer 함수 추출 및 실행
const evalCode = quizSource.substring(
    quizSource.indexOf('function checkKoreanAnswer'),
    quizSource.indexOf('function getTodayYYMMDD')
);

// 전역 스코프에 함수 바인딩
const fn = new Function(`${evalCode}; return { checkKoreanAnswer, checkSingleKoreanAnswer };`);
const { checkKoreanAnswer } = fn();

// 2-1. 완벽 일치 및 단순 공백/기호 차이
assert.strictEqual(checkKoreanAnswer('사과', '사과'), true, '기본 단어 정답 일치');
assert.strictEqual(checkKoreanAnswer('사과 ', '사과'), true, '후행 공백 허용');
assert.strictEqual(checkKoreanAnswer(' 사과', '사과'), true, '선행 공백 허용');
assert.strictEqual(checkKoreanAnswer('바나나', '사과'), false, '오답 차단');

// 2-2. 복수 정답 (콤마, 슬래시)
assert.strictEqual(checkKoreanAnswer('년', '년, 해'), true, '콤마 분리 첫 번째 정답');
assert.strictEqual(checkKoreanAnswer('해', '년, 해'), true, '콤마 분리 두 번째 정답');
assert.strictEqual(checkKoreanAnswer('마시다', '마시다, 음료'), true, '마시다 정답');
assert.strictEqual(checkKoreanAnswer('음료', '마시다, 음료'), true, '음료 정답');

// 2-3. 물결표(~) 및 조사 접두/접미
assert.strictEqual(checkKoreanAnswer('전에', '~ 전에, ~의 앞에'), true, '물결표 제거 후 전에 정답');
assert.strictEqual(checkKoreanAnswer('앞에', '~ 전에, ~의 앞에'), true, '조사 및 물결표 완화 후 앞에 정답');

// 2-4. 괄호 및 상세 설명 포함 정답
const complexMeaning = '활동, 사용 기록 (예: 게임 이용 내역)';
assert.strictEqual(checkKoreanAnswer('활동', complexMeaning), true, '첫 번째 뜻 활동 일치');
assert.strictEqual(checkKoreanAnswer('사용 기록', complexMeaning), true, '두 번째 뜻 사용 기록 일치');
assert.strictEqual(checkKoreanAnswer('사용기록', complexMeaning), true, '공백 없는 사용기록 일치');

const lightMeaning = '빛, 불빛, (뇌를) 깨우는 불빛';
assert.strictEqual(checkKoreanAnswer('빛', lightMeaning), true, '빛 일치');
assert.strictEqual(checkKoreanAnswer('불빛', lightMeaning), true, '불빛 일치');

// 2-5. 대괄호 [kept], [met] 등 부가 표기 정규화
const bracketMeaning = '만나다 [met]';
assert.strictEqual(checkKoreanAnswer('만나다', bracketMeaning), true, '대괄호 제거 후 만나다 일치');
assert.strictEqual(checkKoreanAnswer('만남', bracketMeaning), true, '대괄호 제거 후 만남 어미 완화 일치');

// 2-6. 동사/형용사 어미 변형 (하다, 한, 다, 은, 기, 음, 임, 됨 등)
assert.strictEqual(checkKoreanAnswer('행복', '행복하다'), true, '행복 어근 일치');
assert.strictEqual(checkKoreanAnswer('행복한', '행복하다'), true, '행복한 어미 변형 일치');
assert.strictEqual(checkKoreanAnswer('따뜻하다', '따뜻한, 데운, 따스하게 하다'), true, '따뜻하다 일치');
assert.strictEqual(checkKoreanAnswer('따뜻', '따뜻한, 데운, 따스하게 하다'), true, '따뜻 어근 일치');

// 2-7. 하드코딩 예외 처리
assert.strictEqual(checkKoreanAnswer('할수있다', '할 수 있다'), true, '할수있다 일치');
assert.strictEqual(checkKoreanAnswer('가능하다', '할 수 있다'), true, '가능하다 일치');
assert.strictEqual(checkKoreanAnswer('치킨', '닭, 치킨'), true, '치킨 일치');
assert.strictEqual(checkKoreanAnswer('점심', '점심, 점심식사'), true, '점심 일치');

console.log('PASS: checkKoreanAnswer 20여 가지 케이스 전원 PASS.');

console.log('=== [3] app.js 한글 IME 엔터 중복 방지 검증 ===');
assert.ok(appSource.includes('e.isComposing'), 'app.js에 e.isComposing 체크가 포함되어야 합니다.');
console.log('PASS: app.js 단어 퀴즈 IME 중복 방지 확인 완료.');

console.log('=== [4] passQuizQuestion 키보드 및 피드백 검증 ===');
assert.ok(quizSource.includes('handleKeyClose'), 'quiz.js에 피드백 박스 키보드 Enter 닫기 지원이 포함되어야 합니다.');
console.log('PASS: 피드백 박스 키보드 Enter 조작 지원 확인 완료.');

console.log('=== [5] index.html & sw.js 버전 정합성 검증 ===');
assert.ok(htmlSource.includes('quiz.js?v=1.6'), 'index.html에 quiz.js?v=1.6이 로드되어야 합니다.');
assert.ok(htmlSource.includes('app.js?v=3.8'), 'index.html에 app.js?v=3.8이 로드되어야 합니다.');
assert.ok(swSource.includes("CACHE_NAME = 'fc-star-v457'"), 'sw.js의 CACHE_NAME이 fc-star-v457이어야 합니다.');
console.log('PASS: PWA 및 스크립트 캐시 버전 100% 일치 확인 완료.');

console.log('\n========================================');
console.log('🎉 모든 주관식 단어 퀴즈 테스트 100% 통과!');
console.log('========================================');
