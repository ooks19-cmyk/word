# 🤖 FC STAR AI Agent Core Guide

두 대의 PC에서 소스 코드만 동기화되고 대화 기록은 연동되지 않는 환경을 위한 **최종 에이전트 간략 가이드**입니다.

## 📌 1. 공동 작업 기본 원칙
* 새로운 세션이 시작될 때마다 **이 파일(`agent.md`)과 `log.md`를 즉시 로딩**하여 정합성을 동기화합니다.
* 모든 기능 추가나 알고리즘 수정 시 변경점은 `log.md`에 기록하고, 본 파일의 **핵심 공식** 및 **Todo 리스트**를 최신화하십시오.
* **로컬 파일(`file://`) 실행 유지**: ES6 `import/export` 대신 `<script>` 순차 전역 스코프 로딩 방식을 엄수합니다.

## 🏗️ 2. 핵심 파일 및 역할 구조
* `index.html` / `style.css` (UI 및 반응형 3D 연출)
* `app.js` (전체 생명주기 및 탭 스위칭, PWA 등록)
* `quiz.js` / `quiz_data.js` (날짜별 스케줄러 기반 5문항 퀴즈 출제 및 스마트 유사 채점 엔진)
* `js/state.js` (유저 재화 `userPoints`, `userLevel`, `playerDeck`, `careerStats` 전역 전송 상태)
* `js/match.js` / `player/other_teams_data.js` (K리그 11개 구단 매치 시뮬레이터 & 스코어보드)
* `js/pack.js` (1% 전설 가챠) / `js/squad.js` (포메이션) / `js/auth.js` (Firestore & 로그인 보상)

## 🎯 3. 핵심 비즈니스 로직 & 수학 공식

### 💎 A. 전설/스페셜 등급 개별 1% 독립 확률 가챠 (`js/pack.js`)
* 전설($legend$) 카드 개수 $N_L$ 및 스페셜($special$) 카드 개수 $N_S$에 대해 전체 프리미엄 획득 확률은 $(N_L + N_S) \times 1\%$로 잡고 판정합니다.
  * `Math.random() < 0.01 * (N_L + N_S)` ➔ 프리미엄 풀 진입 (당해 풀 카드 중 무작위 1장 분배 ➔ 개별 카드 확률 정확히 1% 유지)
  * `Math.random() >= 0.01 * (N_L + N_S)` ➔ 일반 풀 진입 (일반 카드 중 균등 1장 분배)

### 📚 B. 영어 단어 퀴즈 및 레벨 보상 (`quiz.js`, `js/auth.js`)
* **퀴즈**: 오늘 날짜($YYMMDD$)를 기준으로 `QUIZ_WORDS_BY_DATE`에서 오늘 단어 풀을 가져와 셔플한 뒤 **5문제** 출제. 
* **레벨 보상**: 퀴즈 1회(5문제 완수) 시 `userLevel` 1 증가.
  * **Lv. 2**: 목표 달성 안내 팝업 출력.
  * **Lv. 10 / 20 / 30 / 40 / 50**: 각각 이승우 / 손흥민(전설) / 이강인(전설) / 이승우(스페셜) / 박지성(전설) 지급 (보유 시 각성 +1).
  * **Lv. 60, 70... (10배수)**: DB 내 무작위 1명 지급 (보유 시 각성 +1).

### ⚔️ C. 경기 시뮬레이터 수학 공식 (`js/match.js`)
* **공격 찬스 획득 확률 ($playerAttackProb$, 상한 80% / 하한 20%)**:
  $$playerAttackProb = 0.40 + (diff \times 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus$$
  *(단, 홈 경기 시 전북 OVR에 +3, 원정 시 상대 OVR에 +3 보정이 diff에 자동 연동)*
* **슛 득점 확률 ($scoreProb$, 상한 60% / 하한 10%)**:
  $$scoreProb = 0.20 + (diff \times 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus$$
  *(상대팀 슛 확률 $oppScoreProb$는 기본 35% 베이스에서 OVR 차이 및 전북 GK 수비력으로 상쇄)*

## 📋 4. 향후 대기 작업 (Todo)
- [ ] **실시간 단어 퀴즈 형태 다변화** (주관식 입력 외 4지선다형 카드 선택 모드)
- [ ] **슈팅 아케이드 미니게임 모드** (경기 중 결정적 찬스 발생 시 게이지 맞추기 타이밍 액션 시스템 탑재)
