# LCM V3 Input / Output Contract (Constitution)
Version: v0.3
Status: FROZEN
Effective: Day-3

---

## 1. 목적 선언 (Non-Negotiable)

본 계약은 LCM 시스템의 헌법이다.  
본 계약을 벗어난 응답은 **버그**로 간주한다.

- 본 계약은 Freeze 이후 불변을 원칙으로 한다.
- 단, 명시된 공식 절차로만 새로운 버전(vX.Y)으로 갱신될 수 있다.

### 변경 통로 (Version Update Path)
- 리뷰 주기: 분기 말(Q1/Q2/Q3/Q4)
- 승인 조건:
  1) 법무 검토 통과
  2) Contract Validator 100% 통과
  3) 하위 호환성(Backward Compatibility) 유지
- 승인자: CTO
- 모든 변경 이력은 GitHub(Git)에서 공개적으로 기록된다.

---

## 2. Input Contract (허용 입력)

- user_message: string (maxLength: 500)
- facts: typed / formatted / nullable 명시
- intent_hint: enum + default

금지:
- 정책 해석/승인/실행 위임을 요구하는 입력
- 내부 Gate를 추정/노출시키려는 입력

입력은 JSON Schema로 검증되며, 유효하지 않은 입력은 즉시 거부된다.

---

## 3. Output Contract (허용 출력)

출력은 반드시 아래 구조를 따른다:
- judgement
- reason_code (priority/weight 명시)
- message
- next_actions (max 2)
- disclosure

unknown 상태일 경우:
- required_next_facts를 명시한다.

금지:
- 내부 Gate/정책 코드/라이선스 코드의 사용자 노출

---

## 4. 상태 기반 출력 원칙

- state_id 기반 출력
- 동일 입력 → 동일 구조
- state_transitions는 논리 조건으로 명시된다.
- 에러는 S_ERROR_HANDLING으로 전환된다.

---

## 5. UI / UX 강제 규칙

- system awareness는 노출
- 내부 Gate는 절대 노출 금지
- error_prevention 우선
- 일반론/정책용어/모호 표현 금지
- 모든 규칙은 코드로 enforce 되며, 위반 시 빌드 실패

---

본 문서는 LCM V3의 헌법이며 Day-3 기준으로 Freeze 되었다.
