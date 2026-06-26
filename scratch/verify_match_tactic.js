const fs = require('fs');
const path = require('path');

console.log("=== 포메이션 상성 시스템 검증 스크립트 실행 ===");

// 1.other_teams_data.js 파일에서 TEAM_FORMATIONS_PRESET 추출
const otherTeamsDataContent = fs.readFileSync(path.join(__dirname, '../other_teams_data.js'), 'utf8');

// TEAM_FORMATIONS_PRESET 객체를 파싱하기 위한 간이 Mock 환경 구축
let TEAM_FORMATIONS_PRESET = null;
eval(otherTeamsDataContent + "\nTEAM_FORMATIONS_PRESET = TEAM_FORMATIONS_PRESET;");

if (!TEAM_FORMATIONS_PRESET) {
    console.error("❌ 에러: TEAM_FORMATIONS_PRESET이 정의되지 않았습니다.");
    process.exit(1);
} else {
    console.log("✅ TEAM_FORMATIONS_PRESET 로드 성공.");
}

// seoul이 3-4-3으로 설정되어 있는지 확인
if (TEAM_FORMATIONS_PRESET["seoul"] === "3-4-3") {
    console.log("✅ FC 서울 포메이션 검증 통과 (3-4-3)");
} else {
    console.error(`❌ 에러: FC 서울 포메이션이 3-4-3이 아닌 ${TEAM_FORMATIONS_PRESET["seoul"]}으로 설정되었습니다.`);
    process.exit(1);
}

// 2. match_algorithm.js 파일에서 getFormationCompatibilityBonus 추출
const matchAlgoContent = fs.readFileSync(path.join(__dirname, '../js/match_algorithm.js'), 'utf8');
let getFormationCompatibilityBonus = null;
eval(matchAlgoContent + "\ngetFormationCompatibilityBonus = getFormationCompatibilityBonus;");

if (typeof getFormationCompatibilityBonus !== 'function') {
    console.error("❌ 에러: getFormationCompatibilityBonus 함수가 정의되지 않았습니다.");
    process.exit(1);
} else {
    console.log("✅ getFormationCompatibilityBonus 함수 로드 성공.");
}

// 3. 상성 계산 검증 테스트
const testCases = [
    { p: '3-4-3', o: '4-3-3', expected: 0.05, label: '3-4-3 vs 4-3-3 (우세)' },
    { p: '4-3-3', o: '5-4-1', expected: 0.05, label: '4-3-3 vs 5-4-1 (우세)' },
    { p: '5-4-1', o: '4-2-3-1', expected: 0.05, label: '5-4-1 vs 4-2-3-1 (우세)' },
    { p: '4-2-3-1', o: '3-4-3', expected: 0.05, label: '4-2-3-1 vs 3-4-3 (우세)' },
    
    { p: '4-3-3', o: '3-4-3', expected: -0.05, label: '4-3-3 vs 3-4-3 (열세)' },
    { p: '5-4-1', o: '4-3-3', expected: -0.05, label: '5-4-1 vs 4-3-3 (열세)' },
    { p: '4-2-3-1', o: '5-4-1', expected: -0.05, label: '4-2-3-1 vs 5-4-1 (열세)' },
    { p: '3-4-3', o: '4-2-3-1', expected: -0.05, label: '3-4-3 vs 4-2-3-1 (열세)' },
    
    { p: '4-4-2', o: '3-4-3', expected: 0, label: '4-4-2 vs 3-4-3 (무상성)' },
    { p: '3-4-3', o: '4-4-2', expected: 0, label: '3-4-3 vs 4-4-2 (무상성)' },
    { p: '4-3-3', o: '4-3-3', expected: 0, label: '동일 포메이션 대결 (무상성)' }
];

let failedTests = 0;
testCases.forEach(tc => {
    const result = getFormationCompatibilityBonus(tc.p, tc.o);
    if (Math.abs(result - tc.expected) < 0.0001) {
        console.log(`✅ 테스트 성공: ${tc.label} => 결과 ${result}`);
    } else {
        console.error(`❌ 테스트 실패: ${tc.label} => 기대값 ${tc.expected}, 실제결과 ${result}`);
        failedTests++;
    }
});

if (failedTests === 0) {
    console.log("\n🎉 모든 포메이션 상성 연산 검증을 성공적으로 통과했습니다!");
} else {
    console.error(`\n❌ 총 ${failedTests}개의 검증 테스트가 실패했습니다.`);
    process.exit(1);
}
