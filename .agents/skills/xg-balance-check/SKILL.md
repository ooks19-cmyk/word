---
name: xg-balance-check
description: Firebase Firestore 유저 덱/포메이션 데이터를 기반으로 전술 보너스 및 친선 매치 시뮬레이션 매커니즘을 시뮬레이트하여 기대 득점(xG) 및 승패 예측 확률을 검증하는 밸런스 체크 엔진 스킬입니다.
---

# FC Star Match xG Balance Check Skill (`xg-balance-check`)

이 스킬은 K리그 카드 게임에서 Firebase Firestore에 연동된 실제 유저 데이터를 실시간으로 가져와, 특정 OVR 격차를 가진 가상 상대팀과의 5회 찬스 매치 알고리즘을 100,000회 이상 시뮬레이션하고 기대 득점(xG) 및 승리 확률 분포를 계산하는 밸런스 검증 도구입니다.

## 디렉토리 구조

```
skills/xg-balance-check/
  ├── SKILL.md  (본 설명서)
  └── scripts/
        └── check_squad_balance.py  (전술 분석 및 몬테카를로 시뮬레이션 파이썬 엔진)
```

## 사용법 및 실행 명령어

이 스킬은 Python 3 환경에서 표준 라이브러리만을 활용하므로 별도의 의존성 패키지 설치 없이 즉시 실행 가능합니다.

### 1. 기본 실행 (유저: `tomy0304`, 상대 OVR: OVR +2)
```bash
python skills/xg-balance-check/scripts/check_squad_balance.py
```

### 2. 특정 유저 및 OVR 격차, 시뮬레이션 횟수 커스텀 지정
* **`-u / --user`**: Firestore 유저 아이디 (기본값: `tomy0304`)
* **`-d / --diff`**: 상대팀과 나 사이의 OVR 차이 (예: `2`는 상대 OVR이 나보다 +2 높음)
* **`-r / --runs`**: 몬테카를로 시뮬레이션 횟수 (기본값: `100000`)
* **`-p / --project`**: Firebase 프로젝트 ID (기본값: `my-family-ab699`)
* **`-db / --database`**: 로컬 선수 데이터베이스 파일 경로 (기본값: `player_data.js`)

#### 실행 예시:
```bash
python skills/xg-balance-check/scripts/check_squad_balance.py -u tomy0304 -d 2 -r 50000
```

## 검증 및 계산 로직 설명

* **공격 찬스 획득 비율 (`playerAttackProb`)**:
  `5-4-1`, `4-3-3`, `3-4-3`, `4-2-3-1` 각 포메이션의 세부 전술 및 전술적합도(DEF, PAS, PAC, DRI 등)를 자동 판정하여 찬스 획득 가중치 가산
* **슈팅 성공 확률 (`scoreProb`)**:
  선발된 11명의 개별 스탯(각성 가산 포함) 및 포메이션별 완성도 보너스를 합산하여 결정
* **상대팀 슈팅 확률 (`oppScoreProb`)**:
  유저 스쿼드의 수비 평균 스탯(DEF) 및 골키퍼(GK) 스탯에 따른 확률 차감
* **몬테카를로 시뮬레이션**:
  매치당 5회의 이벤트 타임라인에 따라 4% 확률의 돌발 특별 상황(패널티킥 성공/실패, 다이렉트 퇴장 버프/디버프 등)을 충실히 반영하여 확률적 안정성을 검증합니다.
