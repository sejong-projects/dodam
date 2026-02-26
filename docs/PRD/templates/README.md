# PRD Template Kit

> 애플리케이션 개발을 위한 **범용 PRD(Product Requirements Document) 템플릿 키트**

---

## 파일 구성

| 파일 | 설명 | 용도 |
| ------ | ------ | ------ |
| [PRD_TEMPLATE.md](./PRD_TEMPLATE.md) | **PRD 템플릿 (메인)** | 새 PRD 작성 시 복사하여 사용 |
| [PRD_WRITING_GUIDE.md](./PRD_WRITING_GUIDE.md) | **작성 가이드** | 템플릿 사용법, 원칙, 팁 참고 |
| [PRD_CHECKLIST.md](./PRD_CHECKLIST.md) | **품질 검증 체크리스트** | PRD 완성 후 품질 검증 |
| [PRD_EXAMPLE.md](./PRD_EXAMPLE.md) | **작성 예제 (SoundFlow)** | 실제 작성 사례 참고 |

---

## 사용 방법

### 1. 새 PRD 작성

```bash
# PRD_TEMPLATE.md를 복사하여 프로젝트 PRD 생성
cp PRD_TEMPLATE.md my-project-prd.md
```

### 2. 가이드 참고하며 작성

- `PRD_WRITING_GUIDE.md`에서 섹션별 작성 팁 확인
- `PRD_EXAMPLE.md`에서 실제 작성 사례 참고
- 기능(WHAT)과 구조(HOW) 분리 원칙 준수

### 3. 품질 검증

- `PRD_CHECKLIST.md`로 자체 평가
- EXCELLENT 등급 달성 후 리뷰 제출

---

## 설계 원칙

- **간결하지만 실행 가능 (Implementation-ready)** — 모호함을 최소화하여 바로 구현에 착수 가능
- **기능(WHAT)과 구조(HOW) 분리** — 요구사항과 구현 구조를 명확히 분리
- **대규모 시스템 지향** — 모듈 의존성, 팀 간 병렬 개발 전제
- **실무 중심** — Stripe, Linear, Atlassian 등 선도 기업의 문서화 사례를 기반으로 설계

---

## 참고 자료

- [Atlassian - Product Requirements](https://www.atlassian.com/agile/product-management/requirements)
- [Wikipedia - Product Requirements Document](https://en.wikipedia.org/wiki/Product_requirements_document)
- [Linear Method - Write Issues Not User Stories](https://linear.app/method/write-issues-not-user-stories)
- [Hustle Badger - PRD Examples & Templates](https://www.hustlebadger.com/what-do-product-teams-do/prd-template-examples/)
