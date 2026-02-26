# PRD 작성 가이드 (Writing Guide)

> 이 문서는 `PRD_TEMPLATE.md`를 사용하여 효과적인 PRD를 작성하기 위한 가이드입니다.

---

## 1. PRD란?

**PRD(Product Requirements Document)** 는 제품이 무엇을 해야 하는지(WHAT)와 어떻게 구현할지(HOW)를 정의하는 문서입니다.

이 템플릿은 다음 특성을 가집니다:

- **범용 (Domain-agnostic)**: 특정 도메인에 종속되지 않는 범용 템플릿
- **실행 가능 (Implementation-ready)**: 모호함을 최소화하여 바로 구현에 착수 가능
- **대규모 시스템 지향**: 모듈 의존성, 팀 간 병렬 개발을 전제
- **개발자 친화적**: 간결하고 검증 가능한 요구사항 명세, 명확한 우선순위 표시

---

## 2. 템플릿 구조 개요

```
PRD_TEMPLATE.md
├── 메타 정보          → 문서 버전, 상태, 변경 이력
├── 섹션 1~4          → WHY & WHO (문제정의, 목표, 범위, 사용자)
├── 섹션 5~6          → WHAT (기능/비기능 요구사항)
├── 섹션 7~8          → HOW (구조 분해, 의존성 그래프) ★ 핵심
├── 섹션 9~10         → API & 데이터 흐름 (권장)
├── 섹션 11           → 리스크 & 오픈 이슈
├── 섹션 12~13        → 로드맵 & 롤아웃
├── 섹션 14           → 테스트 계획
├── 섹션 15~16        → 아키텍처 & 운영 (권장)
└── 부록              → 용어, 참고자료
```

---

## 3. 섹션별 작성 가이드

### 필수 섹션 (Must Include)

| 섹션            | 핵심 포인트                 | 자주 하는 실수                 |
| ------------- | ---------------------- | ------------------------ |
| **배경 & 문제정의** | 데이터 기반으로 문제를 객관적으로 기술  | 솔루션을 먼저 쓰고 문제를 끼워 맞춤     |
| **목표 & 비목표**  | 정량적 성공 기준 필수, 비목표 명시   | 비목표를 생략하여 Scope Creep 발생 |
| **범위 & 가정**   | 전제 조건의 검증 방법까지 명시      | 가정을 선언만 하고 검증 계획 누락      |
| **사용자 시나리오**  | 정상/예외 흐름 모두 포함         | 해피 패스만 기술                |
| **기능 요구사항**   | ID, 우선순위, 수락기준, 의존성 포함 | 기능과 구조를 혼합               |
| **비기능 요구사항**  | 정량적 목표값과 측정 방법 명시      | "빠르게", "안정적으로" 등 모호한 표현  |
| **의존성 그래프**   | 모든 의존성을 명시적으로 선언       | 암묵적 의존성 방치               |
| **테스트 계획**    | 모듈별 테스트 시나리오 구체적 기술    | 테스트 전략을 "나중에" 작성         |
| **리스크 & 이슈**  | 완화 전략과 결정 시한 포함        | 리스크를 나열만 하고 대응 누락        |

### 권장 섹션 (Recommended)

대규모 시스템이나 팀 간 협업이 필요한 프로젝트에서 추가하세요:

| 섹션 | 포함 시점 |
| ------ | ---------- |
| **API 명세 초안** | 외부 API 또는 서비스 간 통신이 있을 때 |
| **데이터 흐름** | 이벤트 기반 아키텍처 또는 복잡한 데이터 파이프라인이 있을 때 |
| **아키텍처 개요** | 신규 시스템이거나 아키텍처 변경이 수반될 때 |
| **운영 런북** | 프로덕션 서비스에 직접 영향을 줄 때 |
| **롤아웃 전략** | 단계적 배포 또는 마이그레이션이 필요할 때 |

---

## 4. 기능(WHAT) vs 구조(HOW) 분리 원칙

이 템플릿의 핵심 설계 원칙은 **기능과 구조의 분리**입니다.

### 잘못된 예

```
Capability: validation.js          ← 파일명이 기능명
Capability: src/utils/helpers.ts   ← 경로가 기능명
```

### 올바른 예

```
Capability: Data Validation        ← 기능 도메인명 (WHAT)
  → maps to: src/validation/       ← 구조 매핑 (HOW)
```

**왜 분리해야 하는가?**

- 기능과 구조가 혼합되면 요구사항 변경 시 문서 전체를 재작성해야 합니다
- 기능(WHAT)은 비즈니스 관점에서, 구조(HOW)는 기술 관점에서 독립적으로 논의해야 합니다
- Stripe와 같은 기업도 PRD에서 "무엇을(What)"과 "어떻게(How)"를 명확히 구분합니다

---

## 5. 의존성 그래프 작성 원칙

### 규칙 1: 모든 의존성을 명시적으로 선언

```
❌ Module: data-ingestion
   (schema-validator가 어딘가에 있겠지...)

✅ Module: data-ingestion
   Depends on: [schema-validator, config-manager]
```

### 규칙 2: Phase별로 그룹핑 (위상 정렬)

```
Phase 0: 의존성 없는 Foundation 모듈
Phase 1: Phase 0에만 의존하는 모듈
Phase 2: Phase 0~1에 의존하는 모듈
...
```

### 규칙 3: 순환 의존성 금지

```
❌ A → B → C → A  (순환!)
✅ A → B → C      (단방향)
```

**의존성 그래프가 중요한 이유:**

- 빌드 순서와 병렬 개발 가능 범위를 결정합니다
- 팀 간 작업 배분의 기초가 됩니다
- 변경의 영향 범위를 즉시 파악할 수 있습니다

---

## 6. 요구사항 ID 체계

| 접두사 | 의미 | 예시 |
| -------- | ------ | ------ |
| `G-` | 목표 (Goal) | G-001, G-002 |
| `NG-` | 비목표 (Non-Goal) | NG-001 |
| `A-` | 가정 (Assumption) | A-001 |
| `REQ-` | 기능 요구사항 | REQ-001, REQ-002 |
| `NFR-` | 비기능 요구사항 | NFR-P001 (Performance) |
| `RISK-` | 리스크 | RISK-001 |
| `ISSUE-` | 오픈 이슈 | ISSUE-001 |
| `AC-` | 수락 기준 | AC-001 |

고유 ID를 부여하면 다음이 가능합니다:
- 요구사항을 이슈 트래커(Jira, Linear 등)의 티켓과 연결
- 커밋 메시지나 PR에서 요구사항 참조
- 변경 시 영향 범위를 추적

---

## 7. MoSCoW 우선순위 가이드

| 우선순위 | 의미 | 기준 |
| ---------- | ------ | ------ |
| **Must** | 반드시 구현 | 이것 없이는 릴리즈 불가능 |
| **Should** | 강력히 권장 | 비즈니스 가치가 높지만 대안 존재 |
| **Could** | 있으면 좋음 | 사용자 경험 개선, 여력 있을 때 |
| **Won't** | 이번에 안 함 | 명시적으로 제외 (비목표와 연결) |

우선순위는 이해관계자들과 합의하여 정하고, 그 근거도 함께 공유하면 더욱 효과적입니다. P0/P1/P2 같은 숫자 기반 방식을 사용해도 무방하며, 팀의 기존 관행에 맞추세요.

---

## 8. 개발자 친화적인 PRD 작성 원칙

### 간결하고 모호하지 않은 요구사항 명세

- 한 문장당 하나의 요구사항을 담고, 수동태보다 능동형 표현을 사용합니다
- "시스템은 사용자가 주문 버튼을 누르면 주문 확인 이메일을 5초 내 발송해야 한다"처럼 검증 가능하게 작성합니다
- 너무 세세한 구현 방법까지 지정하는 것은 오히려 개발자의 재량을 제한하므로 피합니다

### API 및 데이터 계약 명세

- 백엔드/프론트엔드 간 API 명세(엔드포인트 URL, 요청/응답 JSON 필드, 에러 코드 등)를 포함합니다
- 주요 데이터 모델 구조를 문서에 담아 개발자들이 통합 작업의 기준으로 삼을 수 있게 합니다

### 수용 기준(Acceptance Criteria) 명시

- 각 요구사항이 충족되었는지 판단하는 기준을 함께 제시합니다
- 예: "주문 확인 이메일이 5초 이내에 발송되고, 이메일에는 주문 번호가 포함될 것"
- 수용 기준은 QA 엔지니어의 테스트 기준이 되며, 완료의 정의(Definition of Done)를 구체화합니다

### 용어 정의

- 전문 용어는 문서 부록에 정의하여 팀 전체가 같은 의미로 사용하도록 합니다
- 특히 도메인 특화 용어, 약어, 기술 용어는 반드시 정의를 포함합니다

---

## 9. PRD는 살아있는 문서 (Living Document)

PRD는 일회성 문서가 아닙니다. 구현 과정에서 발견한 사항을 지속적으로 반영하세요.

- **구현 중 발견된 기술적 제약** → 제약 조건 섹션 업데이트
- **새로운 의존성 발견** → 의존성 그래프 업데이트
- **오픈 이슈 해결** → 상태를 `Resolved`로 변경
- **스코프 변경** → 변경 이력에 기록하고 버전 업데이트

변경 사항이 생기면 문서를 바로 업데이트하고 모든 팀원에게 알려 누락을 방지합니다. PRD가 팀의 단일 진실 소스(Single Source of Truth)가 되도록 유지하세요.

---

## 10. 참고 스타일

| 스타일 | 특징 | 적용 대상 |
| -------- | ------ | ----------- |
| **Linear** | 짧고 명확, 스코프/비스코프 분명, 실행 중심 | 소규모~중규모 프로젝트 |
| **Stripe/Notion** | 개발자 친화적, 제약조건/엣지케이스 명시, API 명세 포함 | API 중심 프로젝트 |
| **GitHub/Atlassian** | 운영/릴리즈/프로세스 관점, 일관된 스타일 가이드 | 대규모 협업 프로젝트 |

이 템플릿은 위 세 가지 스타일의 장점을 결합하여, **간결하면서도 실행 가능한(Implementation-ready)** PRD를 지향합니다.

---

## 11. 실무 PRD 작성 팁

### 초안은 빠르게, 공유는 자주

PRD를 처음부터 완벽하게 쓰려고 하기보다 초안을 빠르게 작성한 뒤 팀원들과 수시로 공유하며 개선하세요. 초안 단계에서 "문제를 정확히 정의했는가?", "가설이 가치가 있는가?"를 개발자, 디자이너 등과 함께 검토하면 기획자가 미처 발견하지 못한 문제나 더 나은 해결책을 팀에서 찾을 수 있습니다.

### 개발자를 PRD 단계부터 참여시키기

PRD 단계부터 개발팀을 참여시켜 구현 가능성 피드백을 받으세요. 주요 기능 초안이 나오면 기술 검토 회의를 진행하여 예상 개발 난이도, 필요한 리소스를 함께 논의합니다. Must로 적힌 기능이 실제로 3달 걸리는 대형 항목이라면, 이를 쪼개거나 우선순위를 재조정하는 식으로 현실적인 계획으로 수정합니다.

### 이슈 트래커와 연계

PRD의 각 기능 요구사항에 해당하는 티켓(Jira, Linear, GitHub Issues 등)을 링크로 달아두세요. Atlassian이 강조하듯이, PRD와 이슈의 양방향 연동을 통해 요구사항의 구현 상태를 실시간으로 확인할 수 있습니다. 이는 "살아있는 문서"로서의 PRD를 가능하게 합니다.

### 시각 자료 적극 활용

글로 설명하기 복잡한 내용은 시각화하여 전달합니다:
- 사용자 흐름: 다이어그램/플로우 차트
- UI/UX: 와이어프레임/디자인 목업
- 아키텍처: 시스템 컨텍스트 다이어그램 (C4 모델 등)
- 데이터 모델: ERD

### 실행 후 회고와 개선

한 사이클이 끝나면 PRD 활용에 대한 팀 회고를 진행하세요. "이번에 API 명세가 모호했다"는 피드백이 나오면 다음에는 API 섹션을 더 보강하는 식으로 PRD 작성 역량이 점점 성숙해집니다.

---

## 12. 오픈소스 프로젝트의 설계 문서 참조 패턴

실무 PRD 작성 시 참고할 수 있는 오픈소스 프로젝트의 설계 문서 패턴입니다.

| 프로젝트       | 문서 유형 | 특징                                                       |
| -------------- | --------- | ---------------------------------------------------------- |
| Kubernetes     | KEP       | Summary, Motivation, Goals/Non-Goals, Graduation Criteria  |
| Rust           | RFC       | Guide-level/Reference-level 설명 분리, Prior Art 섹션      |
| OpenStack Nova | Spec      | Data/API/Security Impact 별도 섹션, Work Items 목록        |
| Django         | DEP       | Abstract, Specification, Backwards Compatibility 포함      |
| Stan           | Design Doc| Rust RFC 벤치마킹, GitHub Issue 연동, Unresolved Questions  |

이들 문서의 공통점:
- Markdown으로 작성하여 누구나 열람 가능
- 명확한 섹션 구조 (문제 → 목표 → 설계 → 구현 태스크)
- 이슈 트래커와 연동하여 설계-구현-검증의 추적 가능성 확보
- 대안(Alternatives)과 리스크를 명시하여 의사결정 근거를 투명하게 공개

---

## 13. 선도 기업의 PRD 사례에서 배우는 핵심 원칙

### Stripe — 군더더기 없는 명확성

- 문제 정의와 범위에 집중하는 간결한 PRD
- 비목표(Non-goals)를 명시적으로 정의
- PRD는 분량이 아닌 사전 사고 과정과 의사결정에 집중하는 '결정 프레임워크'

### Atlassian — 구조화된 템플릿과 도구 연계

- 목표, 가정, 사용자 스토리, 디자인, 제외 범위를 포함하는 체계적 섹션 구성
- Jira와의 양방향 연동으로 PRD의 요구사항이 곧 개발 이슈와 동기화
- PRD를 "단일 정보원(Single Source)"으로 활용

### Linear — 실행 중심의 간소한 문서

- Context(맥락) → Usage Scenarios(사용 시나리오) → Milestones(구현 단계) 3단 구성
- 장황한 사용자 스토리 대신 짧고 명확한 이슈로 작업 정의
- 충분한 사전 기획 후 빠른 실행으로 전환

### Notion — 통합된 동적 문서

- 요구 사항, 제품 사양, 기능 사양을 하나의 동적 문서로 통합
- 체크리스트, 데이터베이스 등을 활용한 요구사항의 시각적 관리
- 구현 진행 상황을 문서 내에서 직접 추적

### Amazon — "Working Backwards" 프레스 릴리스 기반

- 개발 전 가상 프레스 릴리스와 FAQ를 먼저 작성하여 고객 관점에서 사고
- 고객이 느낄 가치를 먼저 정의한 뒤 역방향으로 요구사항 도출
- 내부 PR/FAQ 문서가 사실상 PRD 역할을 수행

### Intercom — 한 페이지 PRD

- 문제, 솔루션, 성공 지표를 한 페이지 이내로 압축
- 핵심 의사결정에 집중하고 불필요한 세부사항은 배제
- 빠른 합의와 실행 속도를 우선시

### Figma — 디자인 중심 PRD

- 시각적 프로토타입과 디자인 스펙이 PRD의 핵심 구성요소
- 텍스트 설명보다 인터랙션 프로토타입으로 요구사항 전달
- 디자이너-엔지니어 간 해석 차이를 최소화

### ProdPad — Living PRD

- PRD를 고정 문서가 아닌 지속적으로 진화하는 "살아있는 문서"로 관리
- 고객 피드백, 시장 변화에 따라 요구사항을 점진적으로 업데이트
- 문서 버전 관리와 변경 이력 추적을 필수로 적용

### 공통 원칙 정리

| 원칙 | 설명 |
| ------ | ------ |
| 명확한 목표와 배경 | "왜 이 기능을 만드는가"를 분명히 합니다 |
| 범위 및 비범위 명시 | 스코프 경계와 제외 항목을 문서화합니다 |
| 수용 기준과 성공 지표 | 완료의 정의를 명시하여 검증 가능하게 합니다 |
| 개발 연계와 업데이트 | 문서가 개발 과정 내내 살아있는 가이드로 기능합니다 |
| 사용자 중심 시나리오 | 누가, 무엇을, 왜 사용하는지를 서술합니다 |
| 고객 관점 역방향 사고 | 결과물의 가치를 먼저 정의하고 역방향으로 요구사항을 도출합니다 |
| 간결함과 집중 | 문서 분량이 아닌 핵심 의사결정의 품질에 집중합니다 |

---

## 14. 자주 하는 실수와 대응

| 실수                        | 예시                                           | 올바른 방법                                          |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| 기능과 구조의 혼합          | `Capability: validation.js`                    | `Capability: Data Validation → maps to src/validation/` |
| 모호한 모듈 경계            | `Module: utils`                                | `Module: string-utilities (명확한 exports 정의 포함)` |
| 암묵적 의존성               | `Module: API handlers (validation이 필요함)`    | `Module: API handlers, Depends on: [validation, error-handling]` |
| 테스트 전략 누락            | "테스트는 나중에 작성"                          | PRD 내에 모듈별 테스트 시나리오 포함                  |
| PRD를 일회성 문서로 취급    | 한 번 작성 후 방치                              | 구현 중 발견 사항을 지속적으로 반영 (Living Document) |
| 모호한 비기능 요구사항      | "빠르게 동작해야 한다"                          | "API 응답 P95 ≤ 200ms" (정량적 목표값 명시)          |
| 비목표 생략                 | 범위 확장이 계속 발생                           | 비목표를 명시하여 Scope Creep 방지                    |

---

## 15. 참고 자료

- [Atlassian - Product Requirements](https://www.atlassian.com/agile/product-management/requirements)
- [Wikipedia - Product Requirements Document](https://en.wikipedia.org/wiki/Product_requirements_document)
- [Hustle Badger - PRD Examples & Templates](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)
- [Linear Method - Write Issues Not User Stories](https://linear.app/method/write-issues-not-user-stories)
- [How Linear Builds Product - Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-linear-builds-product)
- [Stripe Markdoc - Interactive Docs](https://stripe.com/blog/markdoc)
- [pmprompt.com - PRD Examples from Top Tech Companies](https://pmprompt.com/blog/prd-examples)
- [Valispace - How to Write Good Engineering Requirements](https://www.valispace.com/how-to-write-good-engineering-requirements-for-complex-hardware-projects/)
- [aqua-cloud.io - Requirements Specification Formats](https://aqua-cloud.io/requirements-specification-formats-brd-frd-urs/)
- [Amazon Working Backwards](https://www.productplan.com/glossary/working-backward-amazon-method/)
- [Intercom on Product Management](https://www.intercom.com/blog/product-management/)
- [GitHub Spec Kit - Specify, Plan, Tasks, Implement](https://github.com/spec-kit)
- [Addy Osmani - Software Engineering Blog](https://addyosmani.com/blog/)
