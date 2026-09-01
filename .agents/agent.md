# 🤖 FC STAR AI Agent Core Guide (Master Reference)

두 대 이상의 PC에서 소스 코드만 동기화되고 대화 기록은 연동되지 않는 환경을 위한 **AI 에이전트 마스터 가이드**입니다.  
새로운 개발 세션이 시작될 때마다 **이 파일(`.agents/agent.md`)과 `log.md`를 최우선으로 로딩**하여 프로젝트의 모든 비즈니스 로직과 최신 상태를 동기화하십시오.

---

## 📌 1. 공동 작업 기본 원칙 및 환경 규칙

1. **로그 및 문서 최신화 엄수**:
   - 모든 기능 추가, 밸런스 패치, 데이터 변경 시 반드시 [`log.md`](file:///c:/Users/김재욱/OneDrive/바탕%20화면/축구카드/log.md) 최하단에 번호(예: `105) ...`)를 매겨 변경 내역을 기록합니다.
   - 주요 규칙이나 공식이 변경되면 본 가이드(`.agents/agent.md`)도 즉시 갱신합니다.
2. **PWA 오프라인 캐시 및 브라우저 버전 관리 (필수!)**:
   - JS/CSS 코드나 데이터셋(`player_data.js`, `quiz_data.js`, `quiz.js` 등)을 수정할 경우:
     1. [`index.html`](file:///c:/Users/김재욱/OneDrive/바탕%20화면/축구카드/index.html) 내 해당 스크립트 태그의 쿼리 파라미터 버전을 상향합니다 (예: `quiz_data.js?v=2.0`).
     2. [`sw.js`](file:///c:/Users/김재욱/OneDrive/바탕%20화면/축구카드/sw.js)의 최상단 `CACHE_NAME`을 반드시 1 증가시킵니다 (예: `'fc-star-v290'`).
3. **로컬 파일(`file://`) 실행 및 스크립트 로딩 순서 보장**:
   - ES6 `import/export` 모듈 대신 `<script>` 순차 전역 스코프 로딩 방식을 엄수합니다.
4. **윈도우(PowerShell) UTF-8 인코딩 설정**:
   - 파이썬 CLI 스크립트 실행 시 한글 깨짐 방지를 위해 항상 `$env:PYTHONUTF8=1` 환경변수를 선행 적용합니다.

---

## 🏗️ 2. 핵심 파일 및 모듈별 역할 구조

```
축구카드/
├── .agents/
│   ├── agent.md                                        # AI 에이전트 마스터 가이드 (본 문서)
│   └── skills/                                         # 워크스페이스 전용 자동화 스킬
│       ├── add-quiz-words/                             # 📚 영단어 퀴즈 세트 추가 및 스케줄러 관리
│       │   ├── SKILL.md
│       │   └── quiz_vocabulary_schedule.md             # 📅 단어 DB 스케줄러 가이드 & 마일스톤
│       ├── js-to-csv/                                  # 📊 선수 데이터 JS -> 엑셀 호환 CSV 변환
│       │   ├── SKILL.md
│       │   └── scripts/convert_js_to_csv.py
│       └── xg-balance-check/                           # ⚔️ 매치 알고리즘 기대 득점(xG) 시뮬레이터
│           ├── SKILL.md
│           └── scripts/check_squad_balance.py
├── WORD/                                               # 📸 단어 교재 원본 이미지 보관 폴더
├── css/                                                # 🎨 모듈별 스타일시트 (card, match, quiz 등)
├── js/
│   ├── state.js                                        # 💾 전역 상태 (유저 레벨, 포인트, 덱, 전적)
│   ├── auth.js                                         # 🔐 Firebase 로그인 & 유저 데이터 클라우드 동기화
│   ├── card.js                                         # 🎴 3D 카드 렌더링 & 이펙트
│   ├── pack.js                                         # 💎 1% 전설 가챠 시스템 & 팩 개봉 연출
│   ├── squad.js / deck.js                              # ⚽ 포메이션, 덱 관리, 전술 적합도 계산
│   ├── match_algorithm.js                              # 🧠 매치 시뮬레이션 핵심 확률 연산 엔진
│   ├── league.js / cup.js / acl.js / friendly.js       # 🏆 리그, 코리아컵, 아시아 챔피언스리그, 친선전 루프
│   └── utils.js                                        # 🛠️ 사운드, 토스트, 파티클 등 유틸리티
├── player_data.js                                      # 🌟 K리그 및 해외파 선수 데이터베이스 (90+명)
├── other_teams_data.js / other_teams_data_epl.js       # 🛡️ K리그 11개 구단 및 EPL 구단 라인업 데이터
├── quiz.js / quiz_data.js                              # 📖 영단어 퀴즈 엔진 & 날짜별 스케줄러 데이터셋
├── 선수데이터.csv / 상대팀_주요선수.csv                 # 📑 엑셀 호환 UTF-8-SIG 선수 데이터 시트
├── 콘솔코드.txt / 콘솔코드_2.txt                        # 🧪 치트, 시즌 점프, 날짜 변경 테스트 콘솔 코드
├── app.js / index.html / style.css / sw.js             # 🚀 애플리케이션 코어 및 PWA 서비스 워커
└── log.md                                              # 📝 프로젝트 전체 개발 히스토리 (105+ 항목)
```

---

## 🎯 3. 핵심 비즈니스 로직 & 수학 공식

### 💎 A. 전설/스페셜 등급 개별 1% 독립 확률 가챠 (`js/pack.js`)
* 전설($legend$) 카드 개수 $N_L$ 및 스페셜($special$) 카드 개수 $N_S$에 대해 전체 프리미엄 획득 확률은 $(N_L + N_S) \times 1\%$로 잡고 판정합니다.
  * `Math.random() < 0.01 * (N_L + N_S)` $\rightarrow$ **프리미엄 풀 진입** (전체 전설/스페셜 카드 중 무작위 1장 분배 $\rightarrow$ **개별 카드 등장 확률 정확히 1% 유지**)
  * `Math.random() >= 0.01 * (N_L + N_S)` $\rightarrow$ **일반 풀 진입** (일반 카드 중 균등 분배)

### 📚 B. 영어 단어 퀴즈 시스템 & 요일별 복습 규칙 (`quiz.js`)
* **요일별 출제 분기**:
  * **📅 목요일·금요일 (복습 데이)**: 지금까지 학습한 **누적 과거 단어 풀에서 무작위 5문제를 선정**하며, 복습 편의를 위해 **항상 4지선다형 객관식**으로 출제 (`isReviewDay() === true`).
  * **📖 일반 요일 (토·일·월·화·수)**: 오늘 날짜($YYMMDD$) 기준 스케줄된 단어 세트에서 **무작위 5문제** 출제 (세트 시작 당일은 객관식 / 이후 유지 기간은 주관식 한글 직접 입력).
* **레벨업 및 보상 체계**:
  * 퀴즈 1회(5문제 완수) 시 `userLevel` 1 증가 및 FP 획득 (일반 +1 FP, 어려움 모드 +2 FP).
  * **Lv. 2**: 목표 달성 축하 팝업.
  * **레벨 10단위 특별 보상 선수 (보유 시 각성 +1)**:
    * `Lv.10`: 이승우 | `Lv.20`: 손흥민(전설) | `Lv.30`: 이강인(전설) | `Lv.40`: 이승우(스페셜)
    * `Lv.50`: 박지성(전설) | `Lv.60`: 기성용(전설) | `Lv.70`: 김민재(전설) | `Lv.80`: 이재성(스페셜)
    * `Lv.90`: 이동경(스페셜) | `Lv.100`: DB 내 무작위 1명 | `Lv.110`: 황인범(스페셜) | `Lv.120`: 황희찬(스페셜) | `Lv.130`: 세징야(스페셜)
  * **Lv. 140 이상 (10의 배수)**: +5 FP 보너스 지급.

### ⚔️ C. 경기 시뮬레이터 수학 공식 (`js/match_algorithm.js` & `js/league.js` 등)
* **전북 OVR 차이 ($diff$)**:
  $$diff = jeonbukOvr - opponentOvr + homeAwayBonus$$
  *(홈 경기 시 전북에 +2, 원정 경기 시 상대팀에 +2 보정 적용)*
* **공격 찬스 획득 확률 ($playerAttackProb$, 상한 80% / 하한 20%)**:
  $$playerAttackProb = 0.40 + (diff \times 0.019) + formationAttackBoost + suitabilityBonus + detailedTacticBonus$$
* **슛 득점 확률 ($scoreProb$, 상한 50% / 하한 10%)**:
  $$scoreProb = 0.24 + (diff \times 0.019) + formationScoreBoost + playerChanceBonus + suitabilityBonus$$
  *(상대팀 득점 확률 $oppScoreProb$는 40% 베이스에서 전북 평균 수비력 및 GK 선방력으로 상쇄)*
  *(전술 적합 보너스 $suitabilityBonus$는 포메이션 기준 스탯 초과 포인트당 +0.5% 가산)*

### 🏆 D. 도전모드(Challenge Mode) 10단계 스테이지 & PVE 규칙 (`js/friendly.js`)
* **10단계 스테이지 구성**: 셀틱부터 레알 마드리드까지 10개 명문 구단 격돌. 10스테이지 전승 시 '⚡ 슈퍼(Super) 등급' 기본 ★6각성 슈퍼 메시 지급.
* **일일 진행 및 재도전 규칙**:
  * 매일 1회 무료 도전 가능.
  * **승리 시**: 다음 스테이지로 진출하며 **당일 도전은 즉시 완료(추가 도전 불가, 내일 다음 스테이지 진행)**.
  * **패배 시에만**: 당일 1회에 한해 **5 FP를 소모하여 재도전 기회 부여**. (재도전 완료 시 승패 무관 당일 종료)
* **시즌 종료 시 다음 시즌 OVR 스케일링 공식**:
  * **다음 시즌 10R 보스 OVR**: 10R 경기 승리 시점 플레이어 팀 OVR + 1 ($OVR_{10} = \text{playerOvr} + 1$)
  * **다음 시즌 1R 시작 상대 OVR**: $OVR_1 = OVR_{10} - 5$
  * **스테이지별 OVR**: $OVR(stage) = OVR_1 + \left\lfloor \frac{(stage - 1) \times 5}{9} \right\rfloor$ (1R부터 10R 보스까지 순차적 등차 배열)
* **무승부 승부차기**: 정규 90분 무승부 시 전용 PK 승부차기 풀 루틴 진행.

---

## 🤖 4. 에이전트 자동화 매크로 명령어 (Macro Commands)

유저가 채팅으로 특정 키워드를 요청할 때 즉시 해당 워크플로우를 실행합니다:

1. **"단어 추가"** 혹은 **"WORD 폴더 단어 추가"**:
   * [`.agents/skills/add-quiz-words/SKILL.md`](file:///c:/Users/김재욱/OneDrive/바탕%20화면/축구카드/.agents/skills/add-quiz-words/SKILL.md) 절차에 따라 `WORD/` 이미지 파싱 $\rightarrow$ `quiz_data.js` 등록(22단어) $\rightarrow$ `quiz_vocabulary_schedule.md` 갱신 $\rightarrow$ `index.html` & `sw.js` PWA 버전 상향 $\rightarrow$ `log.md` 기록 $\rightarrow$ 무결성 검증까지 원클릭 수행.
2. **"선수데이터 csv 업데이트"** 혹은 **"선수데이터 업데이트"**:
   * `$env:PYTHONUTF8=1` 설정 후 변환 스크립트를 실행하여 CSV 파일 2종 동기화:
     ```powershell
     $env:PYTHONUTF8=1; python .agents/skills/js-to-csv/scripts/convert_js_to_csv.py -i player_data.js -o 선수데이터.csv; python .agents/skills/js-to-csv/scripts/convert_js_to_csv.py -i other_teams_data.js -o 상대팀_주요선수.csv
     ```
3. **"밸런스 체크"** 혹은 **"xG 시뮬레이션"**:
   * xG 시뮬레이터를 실행하여 기대 득점 및 승률 분포 리포트 생성:
     ```powershell
     python .agents/skills/xg-balance-check/scripts/check_squad_balance.py -u tomy0304 -d 2 -r 100000
     ```

---

## 📋 5. 향후 대기 작업 (Todo)
- [ ] **슈팅 아케이드 미니게임 모드**: 경기 중 결정적 찬스 발생 시 게이지 맞추기 타이밍 액션 시스템 탑재
- [ ] **선수 특성(Trait) 시스템**: '감아차기 마스터', '통곡의 벽' 등 고유 패시브 스킬 연동
