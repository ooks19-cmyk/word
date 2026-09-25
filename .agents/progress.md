## 현재 작업
- 목표: son7 계정의 도전모드 진도를 시즌 2 스테이지 6 (`challengeSeason: 2`, `challengeStage: 6`)으로 변경
- 상태: 완료
- 주요 변경·검증:
  1. 원본 Firestore 데이터 백업: `scratch/son7_backup_20260925_221803.json`으로 백업 완료.
  2. Firestore REST API PATCH: `fc_star_users/son7` 문서의 `challengeSeason: 2`, `challengeStage: 6`, 최신 `updatedAt` 및 `localLastUpdated` 타임스탬프 갱신 완료.
  3. 실시간 검증: `patch_son7_challenge.py` 실행 결과 Firestore 정상 반영 확인.
- 다음 단계: 완료 보고.

## 이전 작업
- 목표: Firebase Firestore 유저 데이터 백업 (`backup_firestore.py` 실행)
- 상태: 완료
- 주요 변경·검증:
  1. `backup_firestore.py`를 실행하여 Firestore REST API로 `fc_star_users` 컬렉션의 전체 14개 계정 데이터 추출.
  2. 로컬 백업 파일 `fc_star_users_backup.json` 생성 완료 (14명 유저 데이터, 1.93MB, 75,834줄).
  3. 백업 계정 확인: `et`, `fc_tokyo`, `ooks`, `ooks12`, `sea`, `son7`, `test1`, `test12`, `tomy`, `tomy0304`, `vc`, `vltlzmffjq3`, `woals510`, `xt`.
- 다음 단계: 완료.

## 이전 작업
- 목표: 상단 헤더 절약 모드 배지 텍스트 제거 및 원형 아이콘 전용 배지로 간소화 + 즉시 깃 푸시
- 상태: 완료
- 주요 변경·검증:
  1. `index.html`: `#headerDataSaverBadge` 내 `<span>절약 모드</span>` 텍스트 제거, `<i class="fa-solid fa-leaf"></i>` 아이콘만 유지하고 hover 툴팁 보존.
  2. `css/global.css`: `.header-data-saver-badge`를 32x32px 원형 컴팩트 글래스모피즘 아이콘 배지로 스타일 리팩토링.
  3. PWA 캐시 및 스크립트 버전 상향: `index.html` (`css/global.css?v=3.2`), `sw.js` (`CACHE_NAME = 'fc-star-v431'`).
  4. 검증: 회귀 테스트 4종 전부 PASS.
- 다음 단계: 완료.

## 이전 작업
- 목표: 리그별 상대팀 다이내믹 스케일링 최대 OVR 상한(Cap) 차등 적용 (K리그 95, J리그 97, EPL 99)
- 상태: 완료
- 주요 변경·검증:
  1. `js/match_algorithm.js`: `getPlayerTop20Ovr(customCap)`에 인자 기반 상한값 전달 지원 추가 (기본 상한 99로 확장).
  2. `js/league.js`: `LEAGUE_CONFIGS`에 `maxOvrCap` 속성 정의 (`kleague1: 95`, `jleague: 97`, `epl: 99`). `resetLeagueSeasonState()`에서 `Math.min(maxCap, ...)`으로 강팀 및 중하위팀의 최대 오버롤 제한 적용.
  3. `js/cup.js`: `resetCupStateData()`에서 활성 리그의 `maxOvrCap`을 준수하도록 K2 및 J리그 하부 초청팀 스케일링 로직 보강.
  4. PWA 캐시 및 스크립트 버전 상향: `index.html` (`match_algorithm.js?v=3.6`, `league.js?v=5.1`, `cup.js?v=3.3`), `sw.js` (`CACHE_NAME = 'fc-star-v430'`).
  5. 검증: `scratch/test_league_caps.cjs`를 통해 OVR 105 덱 대상 K리그(95), J리그(97), EPL(99) 최대치 제한 100% 검증 통과 및 회귀 테스트 4종 전부 PASS.
- 다음 단계: 완료.

## 이전 작업
- 목표: J리그 상대팀 득점 시 주요선수 매핑 누락 버그 해결 (`[상대 공격수]` 대신 실제 스타 선수 출력)
- 상태: 완료
- 주요 변경·검증:
  1. `js/match_algorithm.js`: `determineOpponentScorerAndAssister`에서 `currentLeagueId === 'jleague'` 분기를 추가하여 `OTHER_TEAMS_PLAYERS_PRESET_JLEAGUE`의 11개 구단 22명 스타 플레이어 매핑 정상화.
  2. `js/acl.js`: `getActiveAclPlayersPreset()`에서 `jleague`일 때 J리그 선수 목록과 K리그 선수 목록을 병합하여 ACL에서도 매핑 지원.
  3. PWA 캐시 및 스크립트 버전 상향: `index.html` (`match_algorithm.js?v=3.5`, `acl.js?v=3.7`), `sw.js` (`CACHE_NAME = 'fc-star-v429'`).
  4. 검증: J리그 11개 전 구단 득점자/도움자 매핑 단위 검증 및 회귀 테스트 4종 전부 PASS.
- 다음 단계: 완료.

## 이전 작업
- 목표: 국대 모드에서 보관함(isStored: true)에 있는 선수 완전 제외
- 상태: 완료
- 주요 변경·검증:
  1. `js/national_squad.js`: `getNationalEligibleCards`에서 `!item.isStored` 조건을 추가하여 보관함에 보관 중인 선수가 후보 목록 및 선발 가능 목록에서 완전히 제외되도록 구현.
  2. `js/national_squad.js`: `getNationalSquadSummary`, `getNationalKeyPlayerStatus`, `nationalPitchCard`에서 보관함 카드가 유효하지 않은 카드로 취급되어 피치 렌더링 및 팀 OVR/핵심선수 보너스에서 자동 제외되도록 개선.
  3. `js/national.js`: `nationalRoleOvr`, `nationalPickPlayer`에서 보관함 카드가 포함되지 않도록 안전 가드 적용.
  4. `js/deck.js`: `moveToStorage` 실행 시 국대 모드 스쿼드(`nationalModeState.squad`) 및 국대 프리셋(`nationalSquadPresets`)에서도 보관함으로 이동된 카드가 자동 해제되도록 연동.
  5. 캐시 및 스크립트 버전 상향: `index.html` (`deck.js?v=2.9`, `national_squad.js?v=2.7`, `national.js?v=3.12`), `sw.js` (`CACHE_NAME = 'fc-star-v428'`).
  6. 검증: 회귀 테스트 4종(`national_mode`, `achievements_reconciliation`, `cloud_save_throttle`, `position_match_goal_bonus`) 전부 PASS.
- 다음 단계: 완료.

## 이전 작업
- 목표: 신규 슈퍼(Super) 등급 선수 카드 'S김승규' (OVR 94, DEF 94, GK) 생성 및 등록
- 상태: 완료
- 주요 변경·검증:
  1. `player_data.js`: `super_kim_seung_gyu` 카드 객체 등록 완료.
     - 이름: S김승규, 등급: super, 오버롤: 94, 포지션: GK, 국적: South Korea, 소속: KOREA
     - 6대 스탯: PAC 91, SHO 88, PAS 93, DRI 91, DEF 94(요청값), PHY 90
     - 이미지: `player2/슈퍼 김승규.png` (존재 확인 완료)
  2. `index.html`: `player_data.js?v=1.79` 캐시 쿼리 버전 상향.
  3. `sw.js`: PWA 서비스 워커 `CACHE_NAME = 'fc-star-v427'` 상향.
  4. `선수데이터.csv`: `convert_js_to_csv.py` 스크립트를 통해 총 101명 선수 데이터로 자동 동기화 완료 (102행).
  5. 무결성 검증:
     - Node.js 구문 검사(`player_data.js`, `sw.js`) 오류 없음.
     - 회귀 테스트 4종 전부 PASS.
- 다음 단계: 완료.

## 이전 작업
- 목표: 데이터 절약 모드 구현 (로그인/세션 복원 시에만 클라우드 백업, 플레이 중 자동 백업 차단, 계정 모달 토글 및 헤더 배지 UI)
- 상태: 완료
- 주요 변경·검증:
  1. `js/state.js`, `js/auth.js`: `isDataSaverMode` 상태 변수 선언, 로컬스토리지(`fc_star_data_saver`) 및 클라우드 동기화 연동. `state.js` 내 누락된 catch 구문 복원.
  2. `js/auth.js`: `saveUserProgress(forceImmediate, isLoginBackup)` 함수에 데이터 절약 모드 가드 추가. 절약 모드 가동 시 일상 플레이 중 발생하는 빈번한 Firestore 자동 백업을 완전 차단하고, 로컬 저장은 항상 안전하게 100% 실시간 보존.
  3. `js/auth.js`: `syncUserDataOnLogin` 및 로그인/세션 복원 완료 시점에 `saveUserProgress(true, true)`를 호출하여 접속 시점 1회 클라우드 동기화 보장. 토글 해제 시 즉시 1회 백업 실행.
  4. `index.html`, `css/global.css`: 계정 모달(`authLoggedInState`) 내 프리미엄 글래스모피즘 토글 스위치 및 상태 설명 추가. 상단 헤더에 `🌱 절약 모드` 배지(클릭 시 계정 모달 오픈) 배치.
  5. `js/update_data.js`: v3.4.1 데이터 절약 모드 릴리즈 노트 추가.
  6. PWA 캐시 버전 상향(`sw.js` v426, `css/global.css?v=3.1`, `js/state.js?v=3.1`, `js/auth.js?v=2.76`, `js/update_data.js?v=2.80`) 및 JS 문법 검사 통과.
- 다음 단계: 완료 보고. (Git 푸시는 사용자 지시 대기)




## 이전 작업
- 목표: tomy0304 아이디의 진행상황을 2046년 시즌 38라운드로 되돌리기 (Firestore 클라우드 유저 데이터 롤백 및 동기화)
- 상태: 완료.
- 주요 변경·검증:
  1. `scratch/tomy0304_backup.json`으로 롤백 전 전체 Firestore 계정 데이터(714KB) 안전 백업.
  2. 원격 Firestore `fc_star_users/tomy0304` 문서의 15개 핵심 필드 업데이트 완료:
     - `leagueYear`: 2046년
     - `leagueRound` / `leagueRoundEpl`: 38라운드 (최종전, 상대: 크리스탈 팰리스)
     - `leagueTeams` / `leagueTeamsEpl`: 37경기 시뮬레이션 순위표 (리버풀 1위: 33승 3무 1패, 승점 102점)
     - `leaguePlayerStats` / `leaguePlayerStatsEpl`: 득점 1위 미토마(22골), 도움 1위 S기성용(15도움) 및 타 구단 스타 선수 배분
     - `cupState` / `cupStateEpl` / `aclState` / `aclStateEpl` / `nationalModeState`: 2046년 연도 동기화
  3. REST API를 통해 실시간 검증 완료: 순위표 1위, 득점 1위 미토마, 도움 1위 S기성용, 보유 카드(97종) 및 FP(910) 무결성 확인.
- 다음 단계: 완료.



















## 이전 작업
- 목표: 국대 종료일 레코드로 리그 페이지의 다음 시즌 진행을 제어하고, 국대 대회 건너뛰기 경로를 제공.
- 상태: 완료.
- 주요 변경·검증: 국대 종료·건너뛰기 시 `nationalModeState.seasonTransition`에 `finishedOn`·`availableOn`·`status`를 생성하고 기존 종료 저장값도 같은 형식으로 자동 이관한다. 리그 종료 모달은 국대모드로 전환하며, 국대 종료일 레코드가 있으면 리그 페이지에 날짜 안내 또는 `다음 시즌 진행` 버튼을 표시한다. 종료 당일과 이전에는 차단 토스트를 출력하고 가능일에는 다음 시즌을 시작한다. 종료된 화면의 이전 경기 시작 버튼 폴백도 동일한 날짜 검사를 거친다. 리그의 가로 레이아웃에서도 안내가 상단 한 줄로 표시되도록 보정했다. 클라우드 직렬화·건너뛰기·구형 종료 데이터 이관 및 전환을 포함한 4개 회귀 테스트, JS 문법·diff 검사를 통과했다. national v3.10·PWA v408.
- 다음 단계: 실제 브라우저에서 리그 종료 → 국대 대회/건너뛰기 → 다음 날 리그 버튼의 흐름을 육안 확인. `선수데이터.csv`는 파일 잠금 해제 후 동기화.

## 이전 작업
- 목표: 선택한 국대팀을 다음 연도에도 자동 유지하고, 대회 시작 전에는 팀 변경 버튼으로 다시 선택 가능하게 수정.
- 상태: 완료. 연도 전환 시 직전 선택 국가를 승계하고 대회 시작 전 팀 변경 UI를 제공.
- 주요 변경·검증: 해당 연도에 저장값이 없으면 가장 최근 이전 연도의 선택 국가를 새 연도에 저장·적용. 대회 시작 전 경기 초기 화면·포메이션 설정 화면의 `국대팀 변경` 버튼으로 선택을 비우고 국가 선택 화면으로 복귀. 수동 해제는 null로 저장해 새로고침해도 이전 국가가 재선택되지 않으며, 대회가 시작된 뒤 변경 시도는 차단. 자동 승계·버튼·수동 해제와 국대·정포지션·업적 회귀, JS 문법 및 diff 검사 통과. national v3.0·global css v2.8·PWA v389.
- 다음 단계: 새 서비스 워커 캐시 적용 후 실제 다음 시즌 진입 및 대회 시작 전 국대팀 변경 버튼을 브라우저에서 육안 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 모드 연도를 계정의 현재 시즌 연도와 동기화하고, 완성된 4-3-3의 대회 시작 차단 오류 수정.
- 상태: 수정 완료. 로그인 복원 직후와 국대 화면 진입 시 현재 leagueYear로 국대 상태를 동기화.
- 주요 변경·검증: 2039 진입 시 2026 상태 대신 2039 아시안컵 생성, 기존 국대 기록 보존 확인. 국대는 일반 스쿼드와 별도 편성이므로 보관함 상태의 보유 카드도 후보·완성 판정에 인정해 완성 4-3-3 대회 시작 차단을 해소. 국대·정포지션·업적 회귀, 관련 JS 문법 및 diff 검사 통과. national_squad v1.8·national v2.1·auth v2.74·PWA v378.
- 다음 단계: 실제 2039 계정에서 새 캐시 적용 후 연도 표시와 월드컵/아시안컵 순환, 기존 4-3-3 시작 버튼을 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 포메이션 피치에 포메이션별 핵심 선수 자리를 기존 스쿼드 화면 방식으로 표시.
- 상태: 구현 완료. 기존 squad.css의 key-player-slot 황금 아우라·펄스를 국대 핵심 슬롯에 재사용.
- 주요 변경·검증: 4-3-3은 DM(PAS 80), 3-4-3·4-2-3-1은 AM(DRI 80) 핵심 슬롯을 피치에 ★핵심 배지로 표시. 상단 현황에 OVR +1 조건과 배치 선수의 활성·비활성 상태를 표시. 세 포메이션의 슬롯·역할·조건·활성 상태 테스트, 전체 회귀·문법·diff 검사 통과. global css v2.4·national_squad v1.7·PWA 캐시 v377.
- 다음 단계: 브라우저·모바일에서 핵심 배지와 포지션 라벨 간격 육안 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 화면의 정포지션 보너스 표시를 제거하고 포메이션·핵심 선수 보너스 적용 여부를 재검증.
- 상태: 완료. 정포지션 배지·안내는 제거하고 내부 득점 계산 +1은 유지.
- 주요 변경·검증: 4-3-3·3-4-3·4-2-3-1 모두 핵심 선수 조건, 팀 평균 조건, 비례 공격권 보너스, 전술 적합도, 세부 전술 +5% 및 최대 OVR +2가 국대 경기 엔진에 반영됨을 수치 테스트로 확인. global css v2.3·national_squad v1.6·PWA 캐시 v376 갱신. 전체 회귀·문법·diff 검사 통과.
- 다음 단계: 브라우저 육안 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 모드 버튼을 실제 국대 화면 진입 경로에 연결.
- 상태: 구현 완료. 경기 진행의 국대모드 버튼이 일반 사용자용 national 탭으로 직접 전환됨.
- 주요 변경·검증: HTML의 준비중 함수 연결과 app.js의 일반 진입 차단을 제거하고 renderNationalMode 경로를 활성화. app v3.4·PWA 캐시 v375 갱신. 국대·정포지션·업적 회귀 테스트, app/sw 문법 및 git diff --check 통과.
- 다음 단계: 브라우저에서 국대모드 버튼 클릭과 화면 표시를 육안 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 모드에 3-4-3·4-2-3-1 포메이션을 추가하고 포지션별 보너스를 적용.
- 상태: 구현 완료. 4-3-3·3-4-3·4-2-3-1을 국가별·포메이션별로 저장하며 기존 4-3-3 저장은 자동 이관.
- 주요 변경·검증: 포메이션 선택 UI·좌표·역할별 후보 필터·AM/CAM 및 DM/CM 구분·정포지션 득점 계산 6개 능력치 +1 표시를 추가. 선택 포메이션을 상성·전술 OVR·세부 전술·공격권·득점·수비·승부차기 엔진과 팀 표시 OVR에 연결. 국대·정포지션·업적 회귀 테스트, JS 문법 및 git diff --check 통과.
- 다음 단계: 브라우저에서 세 포메이션의 피치 배치와 모바일 버튼 배치를 육안 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 국대 모드 경기 종료 상태의 로컬·Firebase 백업 누락 수정.
- 상태: 수정 완료. 개발용 계정에서는 콘솔 개발 상태를 정식 `nationalModeState`에 반영하도록 사용자 승인됨.
- 주요 변경·검증: 국대 데이터·전용 4-3-3·연도별 대회·대진·초기화·명예의 전당·클라우드 저장 연동을 추가. 국대 경기에는 챔스와 같은 공용 최종 OVR, 포메이션·세부 전술, 정포지션 득점 보너스, 공격권·슈팅 확률, 특수 이벤트, 연장전·승부차기 엔진을 국대 스쿼드 컨텍스트로 연결. 상대 국가 포메이션도 대회 생성 시 저장해 상성 계산에 반영.
- 검증: 국대 4-3-3 구성·저장·재진입, 32강 진행·국가 기록, 공용 엔진 호출, 100경기 승자 결정·득실 일치 테스트 통과. 정포지션 득점 보너스·업적·초기 클라우드 동기화 회귀 테스트, 변경 JS 문법, git diff --check 통과.
- 다음 단계: 국대 모드 우승 시 토스트 대신 전용 우승 모달이 표시되도록 수정. 새 캐시 적용 후 실제 Firebase 계정에서 경기 종료 로그에 `forceImmediate` 및 백업 완료 메시지가 출력되는지도 확인. 커밋·푸시는 사용자 지시 대기.

## 이전 작업
- 목표: 박진섭 오버롤 89에 맞는 세부 스탯 조정
- 상태: 완료
- 주요 변경·검증: PAC 84, SHO 70, PAS 82, DRI 79, DEF 89, PHY 90으로 JS·CSV 2종 동기화. 선수 스크립트 v1.71·PWA 캐시 v359 갱신.
- 검증: 실제 JS 선수 객체의 등급·오버롤·스탯 및 CSV 2종 일치 확인. JS 문법·CRLF를 고려한 diff 검사 통과.
- 다음 단계: 완료. c4277cf를 origin/main에 푸시.

## 이전 작업
- 목표: 카드 표시 포지션과 실제 배치 포지션 일치 시 득점 확률 계산에만 각 능력치 +1 적용
- 상태: 완료
- 주요 변경·검증: 득점 계산 전용 +1 구현. 5개 포메이션 매핑 통일 및 실제 역할 오류 수정. 내 스쿼드·친구 스쿼드의 선수 박스 아래 포지션 라벨 추가. 8개 경기 찬스 경로·실시간·승부차기 회귀 테스트 통과.
- 검증: 5개 포메이션·6개 능력치·8개 경기 찬스·실시간·승부차기 테스트, 변경 JS 문법 및 git diff --check 통과. 브라우저 육안 검증 미수행.
- 다음 단계: 완료. main 및 origin/main 동기화.
