# CLAUDE.md 작성 가이드 (Writing Guide)

> 이 문서는 Claude Code 프로젝트에서 효과적인 `CLAUDE.md`를 작성하기 위한 심층 가이드입니다.

---

## 1. CLAUDE.md란?

**CLAUDE.md**는 Claude Code가 세션을 시작할 때 **자동으로 읽어 들이는 프로젝트 지시서**입니다.

프로젝트의 코딩 규칙, 디렉터리 구조, 워크플로우, 경계 규칙 등을 마크다운으로 작성하면, Claude Code는 이를 기반으로 프로젝트에 맞는 코드를 생성합니다. 즉, CLAUDE.md는 **AI 코딩 어시스턴트의 행동 지침서**입니다.

### 왜 중요한가?

- **일관성 보장**: 팀원 누가 Claude Code를 사용하더라도 동일한 코딩 규칙이 적용됩니다
- **맥락 전달**: 프로젝트의 기술 스택, 구조, 컨벤션을 매번 설명할 필요가 없습니다
- **품질 향상**: 잘 작성된 CLAUDE.md는 AI 출력 품질을 극적으로 향상시킵니다
- **경계 설정**: AI가 해야 할 것과 하지 말아야 할 것을 명확히 구분합니다

### 이 가이드와 LLM 개발 지시서 가이드의 관계

[LLM 개발 지시서 작성 가이드](../../GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md)는 Claude Code, Cursor, Windsurf 등 **여러 LLM 도구를 아우르는 범용 가이드**입니다 (섹션 4.1, 9.1에서 CLAUDE.md를 간략히 다룸). 이 문서는 **CLAUDE.md에 특화된 심층 가이드**로, 범용 가이드의 6대 원칙을 CLAUDE.md 맥락에 맞게 재해석합니다. 두 문서를 함께 참조하면 가장 효과적입니다.

---

## 2. 템플릿 구조 개요

`CLAUDE_MD_TEMPLATE.md`의 전체 섹션 구조입니다:

```
CLAUDE_MD_TEMPLATE.md
├── 프로젝트 개요        -> 프로젝트명, 한 줄 설명, 기술 스택
├── 프로젝트 구조        -> 디렉터리 트리, 각 디렉터리의 역할
├── 개발 규칙           -> 네이밍 규칙, 코드 패턴, 스타일 가이드
├── 명령어              -> 개발/테스트/빌드/배포 명령어
├── 워크플로우 규칙      -> Git 브랜치 전략, 커밋 컨벤션, PR 규칙
├── 경계 규칙           -> Always Do / Ask First / Never Do
├── 테스트              -> 프레임워크, 패턴, 커버리지 기준
└── 의존성 및 도구       -> 주요 라이브러리, 사용 목적, 버전
```

각 섹션은 Claude Code가 코드를 생성할 때 **다른 관점의 맥락**을 제공합니다. 프로젝트 개요는 "무엇을 만드는가", 개발 규칙은 "어떻게 만드는가", 경계 규칙은 "무엇을 하지 말아야 하는가"를 알려줍니다.

---

## 3. 핵심 원칙

### 3.1 명시적으로 작성하라

**AI에게 전달하지 않은 규칙은 존재하지 않는 규칙입니다.** 암묵적으로 "당연히 알겠지"라고 가정하면 AI는 그 규칙을 무시합니다.

**좋은 예시:**
```markdown
## Code Style
- 함수는 50줄 이하로 유지합니다
- 모든 API 핸들러에서 try-catch로 감싸고, AppException을 throw합니다
- import 순서: 외부 패키지 -> 내부 모듈 -> 상대 경로
```

**나쁜 예시:**
```markdown
## Code Style
- 깨끗한 코드를 작성하세요
- 적절한 에러 처리를 해주세요
```

### 3.2 구조화된 섹션을 사용하라

**일관된 헤딩 구조는 AI의 정보 검색 효율을 높입니다.** 섹션이 체계적이면 올바른 규칙을 더 정확하게 적용합니다.

**좋은 예시:**
```markdown
## Commands
### 개발
- `npm run dev` -- 개발 서버 시작 (포트 3000)
### 테스트
- `npm run test` -- 전체 테스트 실행
### 코드 품질
- `npm run lint` -- ESLint 검사
```

**나쁜 예시:**
```markdown
npm run dev로 개발 서버를 실행하고, 테스트는 npm run test로 합니다.
린트는 npm run lint를 사용하세요.
```

### 3.3 코드 예시를 우선하라

**산문 설명보다 실제 코드 예시가 훨씬 효과적입니다.** GitHub의 2,500개 이상의 지시서 분석 결과, 코드 스니펫이 포함된 지시서가 더 정확한 코드를 생성하게 합니다.

**좋은 예시:**
```typescript
// 서비스 클래스 작성 규약
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return UserResponseDto.from(user);
  }
}
```

**나쁜 예시:**
```markdown
서비스 클래스는 Injectable 데코레이터를 사용하고,
생성자에서 의존성을 주입받아야 합니다.
```

### 3.4 경계 규칙을 3단계로 분리하라

**Always / Ask First / Never 3단계로 분류하여 AI에게 명확한 의사결정 프레임워크를 제공합니다.**

**좋은 예시:**
```markdown
### Always
- 새 API 엔드포인트에 단위 테스트를 작성합니다
### Ask First
- 새로운 외부 패키지를 추가할 때 먼저 확인합니다
### Never
- 시크릿/API 키를 코드에 하드코딩하지 않습니다
```

**나쁜 예시:**
```markdown
- 테스트를 작성하세요
- 패키지 추가 시 조심하세요
- 시크릿을 하드코딩하면 안 됩니다
```

### 3.5 간결함을 유지하라

**CLAUDE.md는 300줄 이하를 권장합니다.** 지시가 너무 많으면 AI의 주의력이 분산됩니다. 초과 시 `.claude/rules/`로 모듈화하세요.

**좋은 예시:**
```markdown
# CLAUDE.md (핵심만)
## Tech Stack
- Backend: NestJS + Fastify
## 상세 규칙 참조
- @.claude/rules/architecture.md
- @.claude/rules/testing.md
```

**나쁜 예시:** 600줄짜리 단일 파일에 모든 규칙을 나열

### 3.6 자체 검증 체크리스트를 포함하라

**검증 단계를 내장하면 AI가 코드 생성 후 스스로 품질을 확인합니다.**

**좋은 예시:**
```markdown
## Verification
코드 생성 후 반드시 다음을 확인합니다:
- [ ] 새로운 API 엔드포인트에 대한 단위 테스트가 작성되었는가
- [ ] DTO에 class-validator 데코레이터가 적용되었는가
- [ ] 에러 응답이 표준 에러 포맷(AppException)을 따르는가
```

**나쁜 예시:**
```markdown
잘 작성해 주세요. 테스트도 잊지 마세요.
```

---

## 4. 섹션별 작성 가이드

### 요약 테이블

| 섹션 | 핵심 포인트 | 자주 하는 실수 |
|------|------------|---------------|
| **프로젝트 개요** | 기술 스택, 버전 정보 포함 필수 | 버전 없이 "Node.js 사용"만 기재 |
| **프로젝트 구조** | 디렉터리 트리 + 각 역할 명시 | 트리 없이 산문으로 설명 |
| **개발 규칙** | 코드 예시로 보여주기 | "깔끔하게 작성하세요" 같은 추상적 설명 |
| **명령어** | 정확한 명령어 + 예상 결과 | 명령어만 나열하고 설명 누락 |
| **워크플로우 규칙** | Git 브랜치/커밋/PR 컨벤션 | 규칙 없이 "알아서 하세요" |
| **경계 규칙** | Always/Ask/Never 3단계 분리 | 모든 규칙을 한 목록에 혼합 |
| **테스트** | 프레임워크, 패턴, 커버리지 기준 | "테스트를 작성하세요"만 기재 |
| **의존성 및 도구** | 라이브러리명 + 사용 목적 | 목적 없이 라이브러리만 나열 |

---

### 4.1 프로젝트 개요

프로젝트가 무엇인지, 어떤 기술로 구성되었는지를 알려줍니다. **버전 정보를 반드시 포함하세요.** 버전에 따라 API가 크게 달라질 수 있습니다.

**좋은 예시:**
```markdown
# MyProject
사용자 인증 및 권한 관리 API 서버
## Tech Stack
- Runtime: Node.js 20 LTS
- Backend: NestJS 10 + Fastify 5
- Database: PostgreSQL 16
- ORM: Prisma 5.x
- Cache: Redis 7
```

**나쁜 예시:**
```markdown
# MyProject
이 프로젝트는 Node.js와 NestJS를 사용합니다.
```

### 4.2 프로젝트 구조

**디렉터리 트리를 사용하여 구조를 시각적으로 보여줍니다.** 각 디렉터리의 역할을 주석으로 명시하면 Claude Code가 새 파일을 올바른 위치에 생성합니다.

**좋은 예시:**
```text
src/
├── modules/           # 도메인별 모듈 (user, auth, order)
├── common/            # 공통 유틸, 데코레이터, 가드
├── config/            # 환경 설정 모듈
└── prisma/            # Prisma 스키마 및 마이그레이션
```

**나쁜 예시:** `소스 코드는 src 폴더에 있습니다. 모듈별로 나뉘어 있습니다.`

### 4.3 개발 규칙

**추상적인 설명 대신 코드 예시로 규칙을 보여줍니다.** 네이밍 규칙은 표로, 코드 패턴은 좋은 예/나쁜 예 코드 블록으로 작성합니다.

**좋은 예시:**
```markdown
| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 | kebab-case | `user-profile.service.ts` |
| 클래스 | PascalCase | `UserProfileService` |
| 함수/변수 | camelCase | `getUserProfile` |
```

**나쁜 예시:** `파일명은 kebab-case, 클래스는 PascalCase를 사용합니다.`

### 4.4 명령어

**정확한 명령어와 함께 예상 결과를 포함합니다.**

**좋은 예시:**
```markdown
### 개발
- `npm run dev` -- 개발 서버 시작 (http://localhost:3000)
### 테스트
- `npm run test` -- 전체 단위 테스트 실행
- `npm run test:cov` -- 커버리지 리포트 생성 (coverage/)
```

**나쁜 예시:** `npm run dev` / `npm run test` / `npm run lint` (설명 없이 나열)

### 4.5 워크플로우 규칙

**Git 브랜치 전략, 커밋 메시지 컨벤션, PR 규칙을 명시합니다.**

**좋은 예시:**
```markdown
### 브랜치: `[type]/[issue-number]-[description]` (예: `feat/123-user-auth`)
### 커밋: Conventional Commits `[type]([scope]): [description]`
### PR: 리뷰어 1인 이상 승인 후 머지
```

**나쁜 예시:** `깃 잘 사용하세요. 커밋 메시지는 명확하게 작성하세요.`

### 4.6 경계 규칙

**Always / Ask First / Never 3단계로 분리합니다.** AI의 자율 범위를 정의하는 가장 중요한 섹션입니다.

**좋은 예시:**
```markdown
### Always
- 새 API 엔드포인트에 단위 테스트를 작성합니다
- TypeScript strict 모드를 유지합니다
### Ask First
- 새로운 npm 패키지를 추가할 때
- 데이터베이스 스키마를 변경할 때
### Never
- 시크릿/API 키를 하드코딩하지 않습니다
- 기존 테스트를 삭제하지 않습니다
```

**나쁜 예시:** `조심해서 개발하세요. 중요한 것은 건드리지 마세요.`

### 4.7 테스트

**테스트 프레임워크, 파일 규칙, 커버리지 기준을 명확히 합니다.**

**좋은 예시:**
```markdown
- 프레임워크: Jest + @nestjs/testing
- 파일 규칙: `*.spec.ts` (소스 파일과 같은 디렉터리에 배치)
- 최소 커버리지: 라인 80% 이상
- 모킹: Prisma는 jest-mock-extended, 외부 API는 nock 사용
- 패턴: describe > beforeEach(모듈 구성) > it(개별 테스트)
```

**나쁜 예시:** `테스트를 작성해 주세요. Jest를 사용합니다.`

### 4.8 의존성 및 도구

**주요 라이브러리의 이름과 사용 목적을 함께 명시합니다.**

**좋은 예시:**
```markdown
| 패키지 | 용도 | 비고 |
|--------|------|------|
| `@nestjs/core` | 백엔드 프레임워크 | v10.x |
| `prisma` | ORM / 마이그레이션 | v5.x |
| `class-validator` | DTO 유효성 검증 | 모든 입력 DTO에 적용 |
```

**나쁜 예시:** `NestJS, Prisma, Redis, JWT 등을 사용합니다.`

---

## 5. 작성 팁

### 5.1 명령형 어조를 사용하세요

CLAUDE.md는 지시서입니다. "~하면 좋겠습니다"가 아니라 "~합니다" 또는 "~하세요"로 작성합니다.

```markdown
# 좋은 예
- TypeScript strict 모드를 유지합니다
- 모든 API 핸들러에 에러 처리를 적용합니다

# 나쁜 예
- TypeScript strict 모드를 유지하면 좋겠습니다
- 에러 처리를 고려해 보세요
```

### 5.2 모호성을 제거하세요

정량적 표현을 우선합니다. "짧게", "적절히", "빠르게"와 같은 모호한 표현은 AI가 임의로 해석합니다.

```markdown
# 좋은 예
- 함수는 50줄 이하로 유지합니다
- API 응답 시간 P95 <= 200ms
- 테스트 커버리지 80% 이상 유지합니다

# 나쁜 예
- 함수를 짧게 작성하세요
- API 응답이 빨라야 합니다
```

### 5.3 리터럴 리딩 테스트를 수행하세요

작성 후 CLAUDE.md를 **글자 그대로** 읽어보세요. AI는 행간의 의미를 읽지 못합니다. 작성한 그대로 해석했을 때 원하는 결과가 나오는지 확인하세요. 동료에게 CLAUDE.md만 보여주고 규칙을 올바르게 이해하는지 테스트하는 것도 좋은 방법입니다.

### 5.4 점진적으로 발전시키세요

처음부터 완벽한 CLAUDE.md를 작성할 필요는 없습니다. 프로젝트 초기에는 기술 스택과 기본 규칙만 작성하고, AI가 잘못된 코드를 생성할 때마다 해당 규칙을 추가하세요. CLAUDE.md는 프로젝트와 함께 진화하는 살아있는 문서입니다.

### 5.5 팀 규칙과 개인 규칙을 분리하세요

- **CLAUDE.md**: 팀 전체가 공유하는 규칙 (Git에 커밋)
- **CLAUDE.local.md**: 개인 선호 설정 (`.gitignore`에 추가)

```markdown
# CLAUDE.local.md (개인 설정 예시)
- 코드 설명은 한국어로 작성합니다
- 디버그 시 console.log 대신 Logger.debug를 사용합니다
```

---

## 6. 안티패턴

### 6.1 너무 모호한 규칙

구체적 기준 없이 추상적 지시를 내리면 AI가 자의적으로 해석합니다.

**나쁜 예시:**
```markdown
- 깨끗한 코드를 작성하세요
- 좋은 아키텍처를 따르세요
- 보안에 신경 쓰세요
```

**개선된 예시:**
```markdown
- 함수는 단일 책임 원칙을 따르며 50줄 이하로 유지합니다
- 모듈 간 의존성은 단방향으로 유지합니다: Controller -> Service -> Repository
- 모든 사용자 입력은 class-validator로 검증합니다
```

### 6.2 너무 긴 파일

500줄을 초과하면 AI가 우선순위를 놓치고 중요한 규칙을 간과합니다. 핵심만 200줄 이내로 작성하고, 상세 규칙은 `@.claude/rules/architecture.md` 등으로 모듈화하세요.

**나쁜 예시:**
```markdown
# CLAUDE.md (600줄짜리 단일 파일)
## Tech Stack
- Runtime: Node.js 20 LTS
- Backend: NestJS 10 + Fastify 5
...
## 아키텍처 규칙
- 레이어드 아키텍처를 따릅니다
- Controller -> Service -> Repository 단방향 의존성
... (100줄)
## 테스트 전략
- Jest + @nestjs/testing 사용
- 단위 테스트, 통합 테스트, E2E 테스트 패턴
... (100줄)
## API 컨벤션
- RESTful 네이밍 규칙
- 요청/응답 DTO 패턴
... (100줄)
## 보안 규칙
- 인증/인가 처리 방식
- 입력 검증 규칙
... (100줄)
## 배포 규칙
...
# -> AI가 뒤쪽 규칙을 놓치고 앞부분만 집중적으로 따름
```

**개선된 예시:**
```markdown
# CLAUDE.md (핵심 규칙 200줄 이내)
## Tech Stack
- Runtime: Node.js 20 LTS
- Backend: NestJS 10 + Fastify 5

## 핵심 개발 규칙
- Controller -> Service -> Repository 단방향 의존성
- 함수는 50줄 이하로 유지합니다

## 상세 규칙 참조
- @.claude/rules/architecture.md
- @.claude/rules/testing.md
- @.claude/rules/api-conventions.md
- @.claude/rules/security.md
```

### 6.3 모순되는 규칙

서로 충돌하는 규칙을 작성하면 AI가 예측 불가능한 행동을 합니다.

**나쁜 예시:**
```markdown
- 함수는 20줄 이하로 유지합니다
- 모든 에러 케이스를 함수 내에서 처리합니다
- 각 함수에 상세한 로깅을 추가합니다
# -> 에러 처리 + 로깅만으로 20줄을 초과할 수 있음
```

**개선된 예시:**
```markdown
- 함수는 50줄 이하로 유지합니다
- 에러 처리는 공통 에러 필터(ExceptionFilter)에 위임합니다
- 로깅은 NestJS 인터셉터로 자동화합니다
```

### 6.4 프로젝트에 없는 패턴까지 규칙화

실제로 사용하지 않는 패턴을 규칙으로 작성하면 AI가 불필요한 코드를 생성합니다. 예를 들어 모놀리스 프로젝트에서 `gRPC`, `Kafka`, `Circuit Breaker`를 규칙화하면 안 됩니다. 현재 프로젝트에서 실제로 사용하는 패턴만 작성하세요.

**나쁜 예시:**
```markdown
# 단순 REST API 프로젝트인데 과잉 규칙 작성
## 통신 규칙
- 서비스 간 통신은 gRPC를 사용합니다
- 이벤트 기반 처리는 Kafka를 사용합니다
## 장애 대응
- 외부 API 호출 시 Circuit Breaker 패턴을 적용합니다
- Retry 정책: 최대 3회, 지수 백오프 적용
## 캐싱 전략
- L1: 로컬 메모리 캐시 (node-cache)
- L2: 분산 캐시 (Redis Cluster)
- L3: CDN 캐시
# -> 실제로는 Express + PostgreSQL만 사용하는 단순 REST API
```

**개선된 예시:**
```markdown
# 실제 프로젝트에서 사용하는 패턴만 작성
## 통신 규칙
- REST API로 클라이언트와 통신합니다
- 응답 형식: { data, message, statusCode }
## 에러 처리
- 모든 API 핸들러에서 try-catch로 감싸고 AppException을 throw합니다
- HTTP 상태 코드는 표준을 따릅니다 (200, 201, 400, 401, 404, 500)
## 캐싱
- 자주 조회되는 사용자 정보는 Redis에 TTL 5분으로 캐싱합니다
```

### 6.5 업데이트하지 않는 CLAUDE.md

프로젝트가 변경되었는데 CLAUDE.md를 업데이트하지 않으면 AI가 오래된 규칙을 따릅니다. TypeORM에서 Prisma로, Mocha에서 Jest로, Node.js 16에서 20으로 전환했다면 CLAUDE.md도 즉시 업데이트하세요. 기술 스택 변경, 디렉터리 구조 변경, 새로운 컨벤션 도입 시 반드시 동기화합니다.

**나쁜 예시:**
```markdown
# 6개월 전에 작성 후 방치된 CLAUDE.md
## Tech Stack
- Runtime: Node.js 16
- ORM: TypeORM 0.3
- Test: Mocha + Chai
## 개발 규칙
- TypeORM 엔티티는 @Entity 데코레이터를 사용합니다
- 테스트는 describe/it 구문으로 Mocha를 사용합니다
- 빌드: `npm run build` (webpack 사용)
# -> 실제로는 Node.js 20, Prisma 5, Jest, Vite로 전환 완료된 상태
```

**개선된 예시:**
```markdown
# 현재 프로젝트 상태를 반영한 CLAUDE.md
## Tech Stack
- Runtime: Node.js 20 LTS
- ORM: Prisma 5.x
- Test: Jest + @nestjs/testing
## 개발 규칙
- Prisma 스키마는 prisma/schema.prisma에서 관리합니다
- 테스트는 Jest의 describe/it 구문으로 작성합니다
- 빌드: `npm run build` (Vite 사용)
```

---

## 7. 파일 위치 및 모듈화

### 7.1 파일 위치 계층

Claude Code는 다음 순서로 CLAUDE.md를 탐색합니다 (우선순위 순):

| 우선순위 | 위치 | 용도 |
|---------|------|------|
| 1 | `프로젝트루트/CLAUDE.md` | 팀 공유 규칙 (가장 일반적) |
| 2 | `프로젝트루트/.claude/CLAUDE.md` | 정리된 하위 디렉터리 방식 |
| 3 | `~/.claude/CLAUDE.md` | 사용자 레벨 전역 기본값 |

### 7.2 CLAUDE.local.md 사용법

개인 설정은 `CLAUDE.local.md`에 작성하고 `.gitignore`에 추가합니다. 팀 규칙과 개인 선호를 분리하여 불필요한 충돌을 방지합니다.

### 7.3 `.claude/rules/` 모듈화 전략

CLAUDE.md가 300줄을 초과하면 주제별로 파일을 분리합니다. `.claude/rules/` 디렉터리 내의 모든 `.md` 파일은 **자동으로 로딩**됩니다.

```
.claude/
├── CLAUDE.md                    # 핵심 규칙 (300줄 이하)
└── rules/
    ├── architecture.md          # 아키텍처 규칙
    ├── testing.md               # 테스트 전략
    ├── api-conventions.md       # API 컨벤션
    └── security.md              # 보안 규칙
```

### 7.4 `@imports` 활용법

CLAUDE.md에서 `@` 접두사로 외부 마크다운 파일을 참조할 수 있습니다. 프로젝트 내의 기존 문서를 중복 작성하지 않고 재사용할 때 유용합니다.

```markdown
# CLAUDE.md 내에서 외부 파일 참조
@docs/api-conventions.md
@docs/database-schema.md
@.claude/rules/security.md
```

이를 통해 CLAUDE.md는 핵심 규칙의 허브 역할을 하면서, 상세 규칙은 각 전문 문서에 위임할 수 있습니다.

---

## 참고 자료

- [LLM 개발 지시서 작성 가이드](../../GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md) -- 이 가이드의 상위 범용 가이드
- [CLAUDE_MD_TEMPLATE.md](./CLAUDE_MD_TEMPLATE.md) -- CLAUDE.md 작성 템플릿
- [Anthropic 공식 문서 - CLAUDE.md](https://docs.anthropic.com/en/docs/claude-code) -- Claude Code 공식 가이드
- [Builder.io - How to Write a Good CLAUDE.md File](https://www.builder.io/blog/claude-md-guide) -- CLAUDE.md 작성 실전 가이드
