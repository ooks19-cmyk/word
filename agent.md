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
* `js/match_algorithm.js` / `player/other_teams_data.js` (K리그 11개 구단 매치 시뮬레이터 핵심 알고리즘 & 스탯 데이터)
* `js/league.js` / `js/cup.js` / `js/acl.js` / `js/friendly.js` (각 대회별 경기 진행 루프 및 해설 연출 제어)
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
  * **Lv. 10 / 20 / 30 / 40 / 50 / 60 / 70 / 80 / 90 / 110 / 120 / 130**: 각각 이승우 / 손흥민(전설) / 이강인(전설) / 이승우(스페셜) / 박지성(전설) / 기성용(전설) / 김민재(전설) / 이재성(스페셜) / 이동경(스페셜) / 황인범(스페셜) / 황희찬(스페셜) / 세징야(스페셜) 지급 (보유 시 각성 +1).
  * **Lv. 100**: DB 내 무작위 1명 지급 (보유 시 각성 +1).
  * **Lv. 140 이상 (10의 배수)**: 5 FP(포인트) 보너스 지급.

### ⚔️ C. 경기 시뮬레이터 수학 공식 (`js/match_algorithm.js` & `js/league.js` 등)
* **공격 찬스 획득 확률 ($playerAttackProb$, 상한 80% / 하한 20%)**:
  $$playerAttackProb = 0.40 + (diff \times 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus$$
  *(단, 홈 경기 시 전북 OVR에 +2, 원정 시 상대 OVR에 +2 보정이 diff에 자동 연동)*
* **슛 득점 확률 ($scoreProb$, 상한 50% / 하한 10%)**:
  $$scoreProb = 0.24 + (diff \times 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus$$
  *(상대팀 슛 확률 $oppScoreProb$는 기본 40% 베이스에서 OVR 차이, 전북 평균 수비력 및 GK 수비력으로 상쇄)*
  *(전술적합 보너스 $suitabilityBonus$는 포메이션별 기준 능력치 초과 포인트당 0.5%씩 가산)*

### 🤝 D. 친선 경기 상대 목록 로드 & 캐싱 폴백 (`js/friendly.js` & `js/match_algorithm.js`)
* **타임아웃 경쟁**: 가입된 유저 로스터를 `window.dbService.fetchRankings()`로 불러올 때 외부 API 무한 펜딩으로 인한 화면 멈춤을 방지하기 위해 `Promise.race`를 사용하여 5초 타임아웃 제한 적용.
* **캐시 및 오프라인 폴백**: API 성공 시 로스터를 캐싱. 타임아웃/에러 시 캐시를 복구하여 매칭을 중단 없이 지원하고, 캐시 로드 성공 시 네온 오렌지 Toast 경고를 노출함.

## 📋 4. 향후 대기 작업 (Todo)
- [ ] **실시간 단어 퀴즈 형태 다변화** (주관식 입력 외 4지선다형 카드 선택 모드)
- [ ] **슈팅 아케이드 미니게임 모드** (경기 중 결정적 찬스 발생 시 게이지 맞추기 타이밍 액션 시스템 탑재)

## 🤖 5. 에이전트 자동화 명령어 (Macro Commands)
* 유저가 채팅으로 특정 키워드를 요청할 때, 에이전트는 내부 스킬을 즉시 실행하여 관련 리소스를 자동 동기화해야 합니다.
* **"선수데이터 csv 업데이트"** 혹은 **"선수데이터 업데이트"** 요청 시:
  * 윈도우 환경(PowerShell)의 한글 깨짐 방지를 위해 `$env:PYTHONUTF8=1`을 설정하고 아래 스킬 명령어를 실행하여 엑셀 호환 CSV 파일 2종을 최신 상태로 자동 갱신합니다.
    ```powershell
    $env:PYTHONUTF8=1; python skills/js-to-csv/scripts/convert_js_to_csv.py -i player_data.js -o 선수데이터.csv; python skills/js-to-csv/scripts/convert_js_to_csv.py -i other_teams_data.js -o 상대팀_주요선수.csv
    ```
  * **주의사항**: 엑셀(EXCEL.EXE)에서 해당 CSV 파일을 열고 있는 경우 `PermissionError: [Errno 13] Permission denied`가 발생하므로, 실행 전에 반드시 관련 CSV 파일(예: `선수데이터.csv`)을 닫아야 합니다.
  * 작업 완수 후 [선수데이터.csv](file:///c:/Users/ooks1/OneDrive/바탕 화면/축구카드/선수데이터.csv) 및 [상대팀_주요선수.csv](file:///c:/Users/ooks1/OneDrive/바탕 화면/축구카드/상대팀_주요선수.csv)가 정상 갱신되었음을 리포트합니다.
* **"밸런스 체크"** 혹은 **"xG 시뮬레이션"** 요청 시:
  * Firebase 실시간 DB 유저 스쿼드 전술과 매치 알고리즘을 연동하여 기대 득점(xG) 및 승률 분포를 측정합니다.
    ```powershell
    python skills/xg-balance-check/scripts/check_squad_balance.py -u tomy0304 -d 2 -r 100000
    ```
  * 작업 결과를 [balance_check_tomy0304.md](file:///C:/Users/ooks1/.gemini/antigravity/brain/36b883c8-72b1-420d-b505-06de524b1647/balance_check_tomy0304.md) 등 분석 리포트 형식의 아티팩트로 출력합니다.

