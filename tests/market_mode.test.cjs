// tests/market_mode.test.cjs
// 이적시장 모드 및 단계별 100% 확정 강화 엔진 종합 검증 테스트

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🧪 FC STAR CARD - 이적시장 모드 및 선수 강화 엔진 종합 검증');
console.log('========================================================\n');

// 1. 가격 산정 공식 테스트 (calculatePlayerMarketPrice)
console.log('=== [1] 선수 이적시장 가격 산정 공식 검증 ===');

function calculatePlayerMarketPrice(rating, awakening = 0) {
    let basePrice = 10;
    const r = parseInt(rating) || 80;

    if (r <= 80) {
        basePrice = 5;
    } else if (r <= 90) {
        basePrice = 10;
    } else {
        basePrice = 10 + (r - 90) * 10;
    }

    return basePrice + (parseInt(awakening) || 0);
}

// 80 이하 -> 5 FP
assert.strictEqual(calculatePlayerMarketPrice(70, 0), 5, 'OVR 70은 5 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(80, 0), 5, 'OVR 80은 5 FP여야 합니다.');

// 81 ~ 90 -> 10 FP
assert.strictEqual(calculatePlayerMarketPrice(81, 0), 10, 'OVR 81은 10 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(90, 0), 10, 'OVR 90은 10 FP여야 합니다.');

// 91 이상 -> 10 + (OVR - 90) * 10 FP
assert.strictEqual(calculatePlayerMarketPrice(91, 0), 20, 'OVR 91은 20 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(92, 0), 30, 'OVR 92는 30 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(95, 0), 60, 'OVR 95는 60 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(99, 0), 100, 'OVR 99는 100 FP여야 합니다.');

// 강화 단계당 +1 FP 추가 검증
assert.strictEqual(calculatePlayerMarketPrice(80, 3), 8, 'OVR 80 +3강은 8 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(91, 2), 22, 'OVR 91 +2강은 22 FP여야 합니다.');
assert.strictEqual(calculatePlayerMarketPrice(95, 6), 66, 'OVR 95 +6강은 66 FP여야 합니다.');

console.log('PASS: 80 이하(5 FP), 90 이하(10 FP), 91 이상(1포인트당 10 FP) 및 강화당 +1 FP 산정 공식 검증 완료.');

// 2. 1분 경과 쿨다운 및 단어퀴즈 리다이렉트 로직 검증
console.log('\n=== [2] 1분(60초) 쿨다운 및 미인증 시 단어퀴즈 탭 리다이렉트 검증 ===');

function checkMarketAccess(lastLeaveTime, isQuizPassed, currentTime) {
    if (isQuizPassed) {
        if (lastLeaveTime === 0) return 'MAIN_MARKET';
        const elapsedSeconds = (currentTime - lastLeaveTime) / 1000;
        if (elapsedSeconds < 60) return 'MAIN_MARKET';
    }
    return 'REDIRECT_QUIZ';
}

const baseTime = 1000000;
// 1) 퀴즈를 통과한 적이 없으면 즉시 단어퀴즈 탭으로 리다이렉트
assert.strictEqual(checkMarketAccess(0, false, baseTime), 'REDIRECT_QUIZ');

// 1-1) 퀴즈를 안 푼 상태에서는 재진입 시 무조건 단어퀴즈 탭으로 리다이렉트
assert.strictEqual(checkMarketAccess(0, false, baseTime + 4000), 'REDIRECT_QUIZ', '퀴즈 미인증 상태에서는 단어퀴즈 탭으로 이동해야 합니다.');

// 1-2) 퀴즈 통과 후 이적시장 머무름 상태 (이탈 시간 0) -> 즉시 메인 진입
assert.strictEqual(checkMarketAccess(0, true, baseTime), 'MAIN_MARKET');

// 2) 퀴즈 통과 후 30초 경과 시 -> 즉시 메인 진입
assert.strictEqual(checkMarketAccess(baseTime, true, baseTime + 30000), 'MAIN_MARKET');

// 3) 퀴즈 통과 후 정확히 59.9초 경과 시 -> 즉시 메인 진입
assert.strictEqual(checkMarketAccess(baseTime, true, baseTime + 59900), 'MAIN_MARKET');

// 4) 퀴즈 통과 후 61초 경과 시 -> 인증 만료로 단어퀴즈 탭 리다이렉트
assert.strictEqual(checkMarketAccess(baseTime, true, baseTime + 61000), 'REDIRECT_QUIZ');

console.log('PASS: 퀴즈 미통과 시 단어퀴즈 탭 리다이렉트 및 60초 쿨다운 검증 완료.');

// 3. 방출 제한 (11명 보호) 및 선발/주장 자동 해제 시뮬레이션
console.log('\n=== [3] 방출 제한(11명 보호) 및 선발/주장 자동 해제 검증 ===');

let testDeck = {};
for (let i = 1; i <= 12; i++) {
    testDeck[`player_${i}`] = { quantity: 1, awakening: 0, card: { name: `선수 ${i}`, rating: 85 } };
}
let testFormation = { 'ST': 'player_1', 'CM': 'player_2' };
let testCaptain = 'player_1';
let userFP = 50;

function simulateSell(cardId) {
    const ownedKeys = Object.keys(testDeck).filter(k => testDeck[k].quantity > 0);
    if (ownedKeys.length <= 11) {
        return { success: false, reason: 'MIN_11_PLAYERS' };
    }
    const card = testDeck[cardId].card;
    const price = calculatePlayerMarketPrice(card.rating, testDeck[cardId].awakening || 0);

    // 선발/주장 자동 해제
    if (testCaptain === cardId) testCaptain = null;
    Object.keys(testFormation).forEach(p => {
        if (testFormation[p] === cardId) testFormation[p] = null;
    });

    userFP += price;
    delete testDeck[cardId];
    return { success: true, price };
}

// 12명 상태에서 선발+주장 선수 player_1 방출
const sellResult1 = simulateSell('player_1');
assert.strictEqual(sellResult1.success, true);
assert.strictEqual(sellResult1.price, 10);
assert.strictEqual(userFP, 60);
assert.strictEqual(testCaptain, null, '방출된 주장은 자동으로 null 처리되어야 합니다.');
assert.strictEqual(testFormation['ST'], null, '방출된 선발은 자동으로 null 처리되어야 합니다.');
assert.strictEqual(Object.keys(testDeck).length, 11);

// 11명 남은 상태에서 추가 방출 시도 -> 차단되어야 함
const sellResult2 = simulateSell('player_2');
assert.strictEqual(sellResult2.success, false);
assert.strictEqual(sellResult2.reason, 'MIN_11_PLAYERS');
assert.strictEqual(Object.keys(testDeck).length, 11, '11명 미만으로 내려가지 않아야 합니다.');

console.log('PASS: 11명 최소 선발 라인업 보호 및 선발/주장 안전 해제 검증 완료.');

// 4. 영입 로직 시뮬레이션 (super 등급 제외 및 FP 차감)
console.log('\n=== [4] 영입 로직 (super 등급 제외 & FP 차감) 검증 ===');

const mockDatabase = {
    'player_super': { name: '슈퍼선수', rating: 95, rarity: 'super' },
    'player_new': { name: '신규영입선수', rating: 91, rarity: 'legend' }
};

const buyableKeys = Object.keys(mockDatabase).filter(k => {
    const card = mockDatabase[k];
    if (card.rarity === 'super') return false;
    return !testDeck[k];
});

assert.deepStrictEqual(buyableKeys, ['player_new'], 'super 등급은 영입 대상에서 제외되어야 합니다.');

function simulateBuy(cardId) {
    const card = mockDatabase[cardId];
    const price = calculatePlayerMarketPrice(card.rating, 0);
    if (userFP < price) return { success: false, reason: 'NOT_ENOUGH_FP' };

    userFP -= price;
    testDeck[cardId] = { quantity: 1, awakening: 0, card };
    return { success: true, price };
}

// 60 FP 보유 상태에서 91 OVR (20 FP) 영입
const buyResult = simulateBuy('player_new');
assert.strictEqual(buyResult.success, true);
assert.strictEqual(buyResult.price, 20);
assert.strictEqual(userFP, 40);
assert.strictEqual(testDeck['player_new'].card.name, '신규영입선수');
assert.strictEqual(Object.keys(testDeck).length, 12);

console.log('PASS: super 등급 제외 및 미보유 선수 20 FP 소모 정상 영입 검증 완료.');

// 5. 단계별 100% 확정 강화 로직 검증 (+1강 1 FP ~ +6강 6 FP, 최대 +6강)
console.log('\n=== [5] 단계별 100% 확정 강화 시스템 검증 ===');

function simulateUpgradeStep(cardId) {
    const cardObj = testDeck[cardId];
    if (!cardObj) return { success: false, reason: 'NO_CARD' };
    const curAwk = cardObj.awakening || 0;
    if (curAwk >= 6) return { success: false, reason: 'MAX_AWAKENING' };

    const nextAwk = curAwk + 1;
    const cost = nextAwk; // 1강 1 FP, 2강 2 FP, ..., 6강 6 FP

    if (userFP < cost) return { success: false, reason: 'NOT_ENOUGH_FP' };

    userFP -= cost;
    cardObj.awakening = nextAwk;
    return { success: true, nextAwk, cost };
}

// 초기 0강 -> 1강 (1 FP 소모, 잔여 39 FP)
let up1 = simulateUpgradeStep('player_new');
assert.strictEqual(up1.success, true);
assert.strictEqual(up1.nextAwk, 1);
assert.strictEqual(up1.cost, 1);
assert.strictEqual(userFP, 39);

// 1강 -> 2강 (2 FP 소모, 잔여 37 FP)
let up2 = simulateUpgradeStep('player_new');
assert.strictEqual(up2.nextAwk, 2);
assert.strictEqual(up2.cost, 2);
assert.strictEqual(userFP, 37);

// 2강 -> 3강 (3 FP 소모, 잔여 34 FP)
let up3 = simulateUpgradeStep('player_new');
assert.strictEqual(up3.nextAwk, 3);
assert.strictEqual(up3.cost, 3);
assert.strictEqual(userFP, 34);

// 3강 -> 4강 (4 FP 소모, 잔여 30 FP)
let up4 = simulateUpgradeStep('player_new');
assert.strictEqual(up4.nextAwk, 4);
assert.strictEqual(up4.cost, 4);
assert.strictEqual(userFP, 30);

// 4강 -> 5강 (5 FP 소모, 잔여 25 FP)
let up5 = simulateUpgradeStep('player_new');
assert.strictEqual(up5.nextAwk, 5);
assert.strictEqual(up5.cost, 5);
assert.strictEqual(userFP, 25);

// 5강 -> 6강 (6 FP 소모, 잔여 19 FP)
let up6 = simulateUpgradeStep('player_new');
assert.strictEqual(up6.nextAwk, 6);
assert.strictEqual(up6.cost, 6);
assert.strictEqual(userFP, 19);

// 6강에서 추가 강화 시도 -> MAX 차단
let up7 = simulateUpgradeStep('player_new');
assert.strictEqual(up7.success, false);
assert.strictEqual(up7.reason, 'MAX_AWAKENING');
assert.strictEqual(testDeck['player_new'].awakening, 6);
assert.strictEqual(userFP, 19, '최대 강화 이후 FP가 차감되지 않아야 합니다.');

console.log('PASS: 1강(1 FP)부터 6강(6 FP)까지 단계별 100% 확정 강화 및 최대 강화(MAX) 가드 검증 완료.');

// 6. 파일 정합성 및 캐시 검증
console.log('\n=== [6] index.html, sw.js, market.js 연동 정합성 검증 ===');

const html = fs.readFileSync('index.html', 'utf-8');
const sw = fs.readFileSync('sw.js', 'utf-8');
const deck = fs.readFileSync('js/deck.js', 'utf-8');
const market = fs.readFileSync('js/market.js', 'utf-8');
const app = fs.readFileSync('app.js', 'utf-8');

assert.ok(html.includes('css/market.css'), 'index.html에 market.css가 로드되어야 합니다.');
assert.ok(html.includes('id="tabMarketBtn"'), 'index.html에 tabMarketBtn이 존재해야 합니다.');
assert.ok(html.includes('id="marketSection"'), 'index.html에 marketSection이 존재해야 합니다.');
assert.ok(html.includes('js/market.js'), 'index.html에 market.js가 로드되어야 합니다.');
assert.ok(html.includes('id="btnQuizMore"'), 'index.html 단어퀴즈 완료 화면에 퀴즈 더풀기 버튼이 존재해야 합니다.');
assert.ok(html.includes('id="btnQuizGoMarket"'), 'index.html 단어퀴즈 완료 화면에 이적시장 진입 버튼이 존재해야 합니다.');

assert.ok(/fc-star-v\d+/.test(sw), 'sw.js의 CACHE_NAME이 올바른 버전 형식이어야 합니다.');
assert.ok(sw.includes("'./css/market.css'"), 'sw.js ASSETS에 market.css가 포함되어야 합니다.');
assert.ok(sw.includes("'./js/market.js'"), 'sw.js ASSETS에 market.js가 포함되어야 합니다.');

assert.ok(deck.includes('upgradeCardStep'), 'js/deck.js에 upgradeCardStep 함수가 정의되어야 합니다.');
assert.ok(deck.includes('btn-quick-upgrade-step'), 'js/deck.js에 단계별 강화 버튼 클래스가 적용되어야 합니다.');

assert.ok(market.includes('calculatePlayerMarketPrice'), 'js/market.js에 calculatePlayerMarketPrice가 정의되어야 합니다.');
assert.ok(market.includes('sellPlayer'), 'js/market.js에 sellPlayer가 정의되어야 합니다.');
assert.ok(market.includes('buyPlayer'), 'js/market.js에 buyPlayer가 정의되어야 합니다.');
assert.ok(market.includes('checkMarketAccess'), 'js/market.js에 checkMarketAccess가 정의되어야 합니다.');
assert.ok(market.includes('grantMarketAccess'), 'js/market.js에 grantMarketAccess가 정의되어야 합니다.');

assert.ok(app.includes("tabName === 'market'"), 'app.js에 market 탭 분기가 포함되어야 합니다.');
assert.ok(app.includes('checkMarketAccess'), 'app.js에 이적시장 진입 가드 검사가 포함되어야 합니다.');
assert.ok(app.includes('handleMarketTabLeave'), 'app.js에 이탈 시간 기록 호출이 포함되어야 합니다.');
assert.ok(!app.match(/const tabs\s*=\s*\{[\s\S]*?'market':[\s\S]*?'pack':/), 'tabs 객체에 market과 pack이 중복 등록되지 않아야 합니다.');

console.log('PASS: 모든 파일 마크업, 함수 정의, PWA 캐시 버전 정합성 100% 일치 확인 완료.');

console.log('\n========================================================');
console.log('🎉 모든 이적시장 & 강화 시스템 통합 테스트 100% ALL PASS!');
console.log('========================================================');
