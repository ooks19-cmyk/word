# FC STAR CARD - 실시간 경기 시뮬레이션 알고리즘 명세서 (Match Engine)

본 명세서는 **FC STAR CARD** 게임의 실시간 경기 중계 및 승패 결정을 담당하는 핵심 경기 시뮬레이션 엔진(`js/match.js`)의 수학적 공식과 판정 규칙을 기술합니다.

---

## 1. 전력 비교 및 홈 버프 (Home Buff & Rating Difference)

경기가 시작될 때 홈 팀의 기량을 반영하기 위해 홈 팀에게 실질 OVR 보너스가 적용됩니다.

* **홈 어드밴티지 (Home Buff)**: 홈에서 경기를 진행하는 팀의 실질 OVR에 **`+2 OVR`**이 가산됩니다.
  * **전북 현대(플레이어)가 홈일 때**: 
    $$\text{전북 실질 OVR} = \text{전북 평균 OVR} + 2$$
  * **전북 현대(플레이어)가 원정일 때**: 
    $$\text{상대 실질 OVR} = \text{상대 평균 OVR} + 2$$
* **실질 OVR 격차 ($\text{diff}$)**:
  $$\text{diff} = \text{전북 실질 OVR} - \text{상대 실질 OVR}$$

---

## 2. 전술 버프 시스템 (Tactic Buff System)

활성화된 포메이션에 따라 공격권 획득률 및 득점력에 추가 버프를 부여하는 시스템입니다. 

### ① 세부전술 보너스 ($\text{detailedTacticBonus}$)
* **효과**: 세부전술 조건을 만족할 경우, **공격 찬스 획득 확률에 `+5.0% (0.05)` 가산** (슛 득점률에서는 제외되어 빌드업에만 영향을 줌).
* **포메이션별 고유 조건**:
  1. **4-3-3 (빌드업)**: `타겟맨 (Target Man)`
     * **조건**: 스트라이커(ST) 슬롯 카드의 피지컬 스탯 $\ge 80$
  2. **3-4-3 (유기적 스위칭)**: `전방압박 (Gegenpressing)`
     * **조건**: 공격진(LW, ST, RW) 중 2명 이상 속도(PAC) 스탯 $\ge 90$
  3. **5-4-1 (역습)**: `다이렉트 패스 (Direct Pass)`
     * **조건**: 수비진(LB, LCB, CB, RCB, RB) 중 1명 이상 **실제 카드 포지션이 CB, LB, RB** 이면서 패스(PAS) 스탯 $\ge 80$
  4. **4-2-3-1 (점유율 중시)**: `티키타카 (Tiki-Taka)`
     * **조건**: 미드필더진(LCM, CM, RCM) 3명 모두 패스(PAS) 스탯 $\ge 83$
  5. **4-4-2 (무전술)**: 세부 전술 조건이 존재하지 않습니다. ($\text{detailedTacticBonus} = 0$)

### ② 전술적합 보너스 ($\text{suitabilityBonus}$)
* **효과**: 포메이션별 주요 속성 평균이 기준치를 초과할 때 능력치 비례하여 가산되는 시너지 보너스입니다.
* **공식**:
  $$\text{suitabilityBonus} = \max(0, (\text{팀 평균 해당 속성} - \text{기준값}) \times 0.01)$$
  * *참고: OVR 70~80대 최정상 스쿼드 빌드업 시 확률이 지나치게 치솟는 문제를 조율하기 위해 계수가 기존 0.019에서 `0.01 (1점당 +1.0%)`로 안정화되어 있습니다.*
* **포메이션별 스탯 기준값**:
  * **4-3-3**: 패스(PAS) 평균 $\ge 70$ 기준
  * **3-4-3**: 드리블(DRI) 평균 $\ge 70$ 기준
  * **5-4-1**: 수비(DEF) 평균 $\ge 60$ 기준
  * **4-2-3-1**: 드리블(DRI) 평균 $\ge 70$ 기준
  * **4-4-2**: 적합 보너스가 발생하지 않습니다. ($\text{suitabilityBonus} = 0$)

### ③ 포메이션별 추가 가속 버프 ($\text{formationAttackBoost}$ & $\text{formationScoreBoost}$)
* **4-3-3 / 3-4-3 / 4-2-3-1 (공격권 보너스)**:
  $$\text{formationAttackBoost} = \max(0, (\text{핵심 선수 스탯} - 80) \times 0.005)$$
  * *핵심 선수 스탯: 4-3-3(CM 패스), 3-4-3(CM 드리블), 4-2-3-1(AM 드리블)*
* **5-4-1 (득점률 보너스)**:
  $$\text{formationScoreBoost} = \max(0, (\text{LM/RM 카드 중 더 높은 속도 스탯} - 80) \times 0.005)$$

---

## 3. 공격 찬스 획득 확률 (Attack Chance Probability)

90분의 경기 시간 중 무작위로 선정되는 5~6개의 분기 시점(`eventMins`)마다, 어느 팀이 공격 기회를 획득하는지 무작위 변수로 판정합니다.

* **플레이어(전북 현대) 공격 찬스 확률 ($\text{playerAttackProb}$)**:
  $$\text{Formula} = 0.40 + (\text{diff} \times 0.019) + \text{formationAttackBoost} + \text{suitabilityBonus} + \text{detailedTacticBonus}$$
  * **기본 베이스 확률**: `40% (0.40)` (원정 경기 및 강팀 대응력을 위해 45%에서 40%로 미세 하향)
  * **격차 가중 계수**: `0.019` (1 OVR 격차당 +1.9%)
  * **안전 임계치 제한 (Caps)**:
    * **하한선**: `20% (0.20)`
    * **상한선**: **`80% (0.80)`** (최강의 스쿼드로 약팀을 지배하더라도 긴장감을 제공하도록 85%에서 80%로 규제)
  * **최종 판정 식**:
    $$\text{playerAttackProb} = \min(0.80, \max(0.20, \text{Formula}))$$

* **상대팀 공격 찬스 확률 ($\text{oppAttackProb}$)**:
  $$\text{oppAttackProb} = 1.0 - \text{playerAttackProb}$$

* **공격팀 무작위 판정**:
  $$\text{Math.random()} < \text{playerAttackProb} \implies \text{플레이어 공격 수행}$$
  $$\text{Math.random()} \ge \text{playerAttackProb} \implies \text{상대팀 역공 수행}$$

---

## 4. 득점 성공 판정 (Goal Conversion Engine)

어느 한 팀이 공격 찬스를 획득했을 때, 최종적으로 슈팅이 골망을 흔들었는지 판단합니다.

### ① 플레이어(전북 현대) 슛 득점 확률 ($\text{scoreProb}$)
* **베이스 득점 확률**: **`20% (0.20)`** (현실적이고 쫀쫀한 스코어 연출을 위해 35%에서 20%로 대폭 하향 조정)
* **OVR 격차 영향**: $\text{diff} \times 0.019$
* **슈터 개인 기량 보너스 ($\text{playerChanceBonus}$)**:
  $$\text{playerChanceBonus} = (\text{찬스 타겟 선수의 주 스탯} - \text{상대팀 기본 OVR}) \times 0.01$$
  * *주 스탯 예시: ST의 SHO(슈팅), LW/RW의 PAC(속도), CM의 PAS(패스) 등 찬스 분기별로 차별 부여*
* **안전 임계치 제한 (Caps)**:
  * **하한선**: `10% (0.10)`
  * **상한선 (대량 득점 폭발 방지 캡)**: **`60% (0.60)`**
* **최종 판정 식**:
  $$\text{scoreProb} = \min(0.60, \max(0.10, 0.20 + (\text{diff} \times 0.019) + \text{formationScoreBoost} + \text{playerChanceBonus} + \text{suitabilityBonus}))$$
* **세부전술 보너스 미반영**: 다이렉트 패스 등의 세부전술 보너스(+5.0%)는 오직 **찬스 획득률($\text{playerAttackProb}$)**에만 가산되고, 순수 슛 성공률 판정에서는 제외되어 빌드업과 골 결정력의 밸런스가 서로 분리되도록 정밀 조율되었습니다.

### ② 상대팀 슛 득점 확률 ($\text{oppScoreProb}$)
* **베이스 득점 확률**: `35% (0.35)`
* **OVR 격차 영향**: $-\text{diff} \times 0.026$ (OVR 차이 극복력 완화)
* **상대 리그 가중치 ($\text{oppChanceBonus}$)**: K리그 구단별 등급 추가 보너스 (없을 시 0)
* **안전 임계치 제한 (Caps)**:
  * **하한선**: `8% (0.08)`
  * **상한선**: `90% (0.90)`
* **최종 판정 식**:
  $$\text{oppScoreProb} = \min(0.90, \max(0.08, 0.35 - (\text{diff} \times 0.026) + \text{oppChanceBonus}))$$

---

## 5. 실시간 중계 분기 확률 (50% Mixin Commentary)

세부전술 보너스($\text{detailedTacticBonus} > 0$)가 활성화되어 세부전술 전용 문자 묘사 조건이 충족되더라도, 매 공격 찬스 시점마다 전술의 묘사가 고정되어 송출되면 문자 중계가 단조로워집니다.

이를 방지하기 위해 다음 분기 시스템을 가동합니다.
* **50% 확률 (`Math.random() < 0.5`)**: 활성화된 고유 세부전술 특화 묘사 송출 (예: 다이렉트 패스를 통한 롱볼 역습 등)
* **50% 확률 (`Math.random() >= 0.5`)**: 일반 빌드업 및 측면 개인 돌파 등 다채로운 스탠다드 중계 묘사 송출

이 믹스인 필터 덕분에 전술이 가동되고 있는 상황에서도 중계에 입체감과 자연스러운 축구 경기 흐름의 생동감이 부여됩니다.
