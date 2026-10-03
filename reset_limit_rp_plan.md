# 📋 [개발 계획서] 4대 모드 초기화 제한 해제 및 RP 5 소모 시스템 개편

본 계획서는 **챔피언스리그(ACL), 컵대회(FA Cup), 국가대표 모드(National), 도전 모드(Challenge Mode)**의 초기화/재도전 제한을 풀고, 단어 퀴즈 풀이를 통해 획득하는 신규 재화 **RP(Reset Point)** 5개를 소모하여 초기화 및 재도전할 수 있도록 개편하는 작업의 세부 설계 및 실행 계획을 정의합니다.

---

## 1. 핵심 규칙 및 정책 정의

### 1.1 재화 획득 규칙 (단어 퀴즈)
- 단어 퀴즈 1세트(5문제) 완료 시:
  - **FP (Football Point)**: 기존 방식 유지 (일반 모드: `+1 FP`, 어려움 모드: `+2 FP`)
  - **RP (Reset Point)**: 일반/어려움 모드 구분 없이 **항상 `+1 RP` 고정 적립**

### 1.2 모드별 초기화 / 재도전 / 우승 / 일일 라운드 규칙
1. **🏆 챔피언스리그 (ACL/UCL)**:
   - 시즌당 1회 제한 해제 ➡️ 진행 중 또는 탈락 시 **5 RP 소모로 무제한 초기화 가능**.
   - ⚠️ **우승 시 초기화 차단**: 우승 달성 시 해당 시즌 초기화 불가 ("🏆 우승한 대회는 초기화할 수 없습니다. 다음 시즌으로 진행하세요.").
2. **🏆 컵대회 (FA Cup 등)**:
   - 시즌당 1회 제한 해제 ➡️ 진행 중 또는 탈락 시 **5 RP 소모로 무제한 초기화 가능**.
   - ⚠️ **우승 시 초기화 차단**: 우승 달성 시 해당 시즌 초기화 불가 ("🏆 우승한 대회는 초기화할 수 없습니다.").
3. **🌍 국가대표 모드 (National)**:
   - 대회당 1회 제한 해제 ➡️ 진행 중 또는 탈락 시 **5 RP 소모로 무제한 초기화 가능**.
   - ⚠️ **우승 시 초기화 차단 유지**: 우승 달성 시 초기화 불가 ("🏆 우승한 대회는 초기화할 수 없습니다.").
4. **⚡ 도전 모드 (Challenge Mode)**:
   - **무제한 재도전 지원 (5 RP 소모)**: 무료 1경기 실패 후 또는 패배 시, **5 RP를 소모하여 당일 스테이지 클리어할 때까지 무제한 재도전 가능** (찬스 +5% 보너스 적용).
   - ⚠️ **하루 1개 라운드(스테이지)만 개방**: **당일 라운드를 승리(클리어)하여 완료한 경우, 당일 더 이상의 도전은 즉시 차단**되며 내일 다음 라운드가 개방됩니다.
   - ⚠️ **10R 최종 우승 시**: 시즌 우승 보상 획득 및 우승 완료 상태로 보존.

---

## 2. 시스템 아키텍처 및 재화(RP) 설계

```mermaid
graph TD
    A[단어 퀴즈 풀이 5문제 완료] --> B1[FP 적립: 일반 1 FP / 하드 2 FP]
    A --> B2[RP 적립: 모드 무관 1 RP 고정]
    
    B2 --> C[보유 RP 계정 저장<br>userRP]
    
    C -->|5 RP 소모| D1[🏆 챔피언스리그 무제한 초기화<br>(탈락/진행중 가능, 우승시 차단)]
    C -->|5 RP 소모| D2[🏆 FA컵 대회 무제한 초기화<br>(탈락/진행중 가능, 우승시 차단)]
    C -->|5 RP 소모| D3[🌍 국대 토너먼트 무제한 초기화<br>(탈락/진행중 가능, 우승시 차단)]
    C -->|5 RP 소모| D4[⚡ 도전모드 무제한 재도전<br>(미승리시 무제한 재도전, 승리시 당일 완료 차단)]
    
    C --> E[클라우드 Firestore 백업 &<br>LocalStorage 실시간 동기화]
```

### 2.1 RP (Reset Point) 데이터 구조
- **변수명**: `let userRP = 0;` (`js/state.js` 전역 선언)
- **로컬 스토리지 키**: `fc_star_user_rp`
- **Firestore 클라우드 필드**: `userData.userRP` (정수형)
- **개발자 모드 연동**: `developerSetPoints()`를 확장하여 FP 및 RP를 함께 설정 가능하도록 지원.

### 2.2 상단 헤더 UI 개편 (`index.html`)
- 상단 포인트 위젯에 FP와 RP를 직관적으로 동시 표출:
  ```html
  <div class="header-points" id="headerPointsWidget" onclick="developerSetPoints()">
      <i class="fa-solid fa-coins" style="color: #ffd700; margin-right: 4px;"></i>
      <span>FP: <strong id="userPointsVal" style="color:#ffd700;">0</strong></span>
      <span style="color: rgba(255,255,255,0.3); margin: 0 5px;">|</span>
      <i class="fa-solid fa-rotate-left" style="color: #00d2fc; margin-right: 4px;"></i>
      <span>RP: <strong id="userRpVal" style="color:#00d2fc;">0</strong></span>
  </div>
  ```
- `renderUserRP()` 및 `renderUserPoints()` 헬퍼 함수를 통해 실시간 UI 반영.

---

## 3. 구현 상세 계획

### 3.1 `js/state.js`
- `let userRP = 0;` 선언 및 `preloadedUserData.userRP` / `localStorage.getItem('fc_star_user_rp')` 초기화 로직 구현.
- `resetStateToDefault()` 내 `userRP = 0;` 추가.

### 3.2 `js/utils.js`
- `renderUserPoints()` 내 `#userRpVal` 갱신 로직 추가 및 `renderUserRP()` 헬퍼 구현.

### 3.3 `js/auth.js`
- `developerSetPoints()`에서 FP와 RP를 각각 또는 일괄 설정할 수 있도록 확장.
- `collectCurrentUserProgressData()`에 `userRP` 포함 및 `applyUserDataToState(userData)`에서 `userRP` 복원.

### 3.4 `quiz.js`
- 퀴즈 5문제 풀이 완료 시:
  ```javascript
  userPoints += (typeof isHardMode !== 'undefined' && isHardMode) ? 2 : 1;
  userRP += 1;
  localStorage.setItem('fc_star_user_points', userPoints.toString());
  localStorage.setItem('fc_star_user_rp', userRP.toString());
  renderUserPoints();
  ```
- 퀴즈 완료 모달 텍스트: `+${(typeof isHardMode !== 'undefined' && isHardMode) ? 2 : 1} FP / +1 RP 획득!`

### 3.5 `js/cup.js`
- `cupState.hasResetThisSeason` 제한 삭제.
- 우승 검사: `if (cupState.currentRound === 1 || (cupState.rounds && cupState.rounds.length > 0 && isCupFinished(cupState))) { alert('🏆 우승한 대회는 초기화할 수 없습니다.'); return; }`
- `resetCupSeasonWithRP()`: 5 RP 소모 (`userRP -= 5`) 및 `localStorage.setItem('fc_star_user_rp', userRP.toString())` 후 대회 초기화.

### 3.6 `js/acl.js`
- `aclState.hasResetThisSeason` 제한 삭제.
- 우승 검사: `if (aclState.championId === aclState.selectedTeamId || aclState.currentRound === 1) { alert('🏆 우승한 대회는 초기화할 수 없습니다. 다음 시즌으로 진행하세요!'); return; }`
- `resetAclSeasonWithRP()`: 5 RP 소모 후 챔스 초기화.

### 3.7 `js/national.js`
- `state.resetUsed` 조건 삭제.
- 우승 검사 유지: `if (state.championId === state.selectedNationId) return showToast('🏆 우승한 대회는 초기화할 수 없습니다.');`
- `resetNationalTournament()`: 5 RP 소모 후 국대 토너먼트 초기화.
- UI 템플릿: 미우승 상태일 때 `초기화 (5 RP)` 버튼 노출.

### 3.8 `js/friendly.js` (도전 모드)
- **버튼 상태 분기**:
  - `challengeDailyFreeUsed`가 `false`일 때: `무료 도전 시작 (Stage ${challengeStage})`
  - `challengeDailyFreeUsed`가 `true`이고 아직 **당일 승리하지 않은 상태**: `5 RP 소모하고 재도전 (찬스 +5%🔥 / 보유: ${userRP} RP)`
  - 당일 라운드 **승리(클리어) 완료 시**: `오늘의 도전 완료 (내일 다음 경기 가능)` (당일 1라운드 완료 시 추가 도전 차단)
- **경기 실행 (`startChallengeMatchSimulation`)**:
  - `isRetry` 실행 시 5 RP 검사 (`if (userRP < 5) ...`) 및 5 RP 차감 (`userRP -= 5`).
  - 승리 시: `challengeDailyFreeUsed = true; challengeDailyRetryUsed = true;` (당일 라운드 완료 잠금).
  - 패배 시: `challengeDailyFreeUsed = true; challengeDailyRetryUsed = false;` (5 RP로 무제한 재도전 가능).

---

## 4. 버전 갱신 및 검증
- `sw.js` 캐시 버전 `CACHE_NAME = 'fc-star-v449'` 상향.
- `js/update_data.js` v3.5.0 릴리즈 노트 등록.
- `index.html` 스크립트 캐시 쿼리 버전 상향.
- `scratch/verify_rp_reset_system.py`를 통한 전체 시나리오 무결성 검증 100% PASS 확인.
