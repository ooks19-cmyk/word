const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const authSource = fs.readFileSync('js/auth.js', 'utf8');
const quizSource = fs.readFileSync('quiz.js', 'utf8');
const squadSource = fs.readFileSync('js/squad.js', 'utf8');
const signatureSource = authSource.match(/function getCardOwnershipSignature\(deck = playerDeck\) \{[\s\S]*?\r?\n\}\r?\n\r?\n\/\/ 캐시/);

assert.ok(signatureSource, 'the card ownership signature helper should exist');
assert.doesNotMatch(signatureSource[0], /isStored|condition/, 'position and storage state must not count as card ownership changes');

const context = {};
vm.createContext(context);
vm.runInContext(signatureSource[0].replace(/\r?\n\r?\n\/\/ 캐시[\s\S]*/, ''), context);

const positioned = vm.runInContext("getCardOwnershipSignature({player:{quantity:1,awakening:2,isStored:false}})", context);
const repositioned = vm.runInContext("getCardOwnershipSignature({player:{quantity:1,awakening:2,isStored:true}})", context);
const acquired = vm.runInContext("getCardOwnershipSignature({player:{quantity:2,awakening:2,isStored:true}})", context);
assert.equal(positioned, repositioned, 'position or storage changes must not bypass the save interval');
assert.notEqual(positioned, acquired, 'card quantity changes must still trigger immediate protection');

assert.match(authSource, /lastUploadedPoints = progressData\.userPoints;[\s\S]*lastUploadedDeckJson = getCardOwnershipSignature\(progressData\.playerDeck\);/, 'a successful upload must refresh the immediate-save baseline');
assert.match(quizSource, /일반 퀴즈 진행은 60초 지연 저장을 사용한다[\s\S]*saveUserProgress\(false\);/, 'ordinary quiz answers must use delayed cloud saving');
assert.equal((squadSource.match(/포지션 배치는 포인트·카드 보유 변화가 아니므로 60초 지연 저장을 사용한다\.[\s\S]{0,80}?saveUserProgress\(false\);/g) || []).length, 2, 'assigning and releasing a position must use delayed cloud saving');

console.log('PASS: ordinary quiz answers and squad position changes follow the cloud-save interval; point and card changes remain immediate.');
