# CLAUDE.md Template Kit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a CLAUDE.md template kit (README, Writing Guide, Template, Checklist) under `docs/CLAUDE_MD/templates/`, targeting individual developers, mirroring the PRD kit's structure and conventions.

**Architecture:** Four standalone Markdown files in a new `docs/CLAUDE_MD/templates/` directory. All content in Korean, matching existing dodam conventions. The Writing Guide references but does not duplicate the LLM Dev Instruction Guide (section 9.1 already has a brief template). The Template is a copy-paste-ready fill-in document. The Checklist provides quality validation.

**Tech Stack:** Markdown documentation only. No application code.

---

### Task 1: Create directory structure and README.md

Files:

- Create: `docs/CLAUDE_MD/templates/README.md`

Step 1: Create the directory

```bash
mkdir -p docs/CLAUDE_MD/templates
```

Step 2: Write README.md

Write `docs/CLAUDE_MD/templates/README.md` (~50 lines) following the exact pattern of `docs/PRD/templates/README.md`:

- Title: `# CLAUDE.md 템플릿 킷`
- Subtitle quote: 설명 (Claude Code 프로젝트용 CLAUDE.md 작성을 위한 범용 템플릿 키트)
- **파일 구성** table with 3 files (Writing Guide, Template, Checklist — no Example file)
- **사용 방법** section with 3 steps:
  1. 새 CLAUDE.md 작성 (`cp CLAUDE_MD_TEMPLATE.md CLAUDE.md`)
  2. 가이드 참고하며 작성 (CLAUDE_MD_WRITING_GUIDE.md 참조)
  3. 품질 검증 (CLAUDE_MD_CHECKLIST.md 사용)
- **설계 원칙** section:
  - 명시적 > 암시적 — 모든 규칙과 제약을 명시적으로 선언
  - 간결함 유지 — 300줄 이하 권장, LLM 컨텍스트 한계 고려
  - 코드 예시 우선 — 산문보다 코드 블록으로 규칙 시연
  - YAGNI — 현재 프로젝트에 필요한 규칙만 포함
- **참고 자료** section with links:
  - `docs/GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md` (내부 참조)
  - Builder.io CLAUDE.md guide
  - Anthropic Claude Code best practices

Step 3: Verify file exists and formatting is correct

```bash
cat docs/CLAUDE_MD/templates/README.md | head -20
```

Step 4: Commit

```bash
git add docs/CLAUDE_MD/templates/README.md
git commit -m "docs: add CLAUDE.md template kit README"
```

---

### Task 2: Write CLAUDE_MD_WRITING_GUIDE.md

Files:

- Create: `docs/CLAUDE_MD/templates/CLAUDE_MD_WRITING_GUIDE.md`

Step 1: Write the Writing Guide

Write `docs/CLAUDE_MD/templates/CLAUDE_MD_WRITING_GUIDE.md` (~400-500 lines) following the structure of `docs/PRD/templates/PRD_WRITING_GUIDE.md`. Sections:

**Section 1: CLAUDE.md란?** (~30 lines)

- CLAUDE.md의 정의: Claude Code가 세션 시작 시 자동으로 읽는 프로젝트 지시서
- 역할: 코딩 규칙, 프로젝트 구조, 워크플로우, 경계 규칙을 AI에게 전달
- 왜 중요한가: 잘 작성된 CLAUDE.md는 AI 출력 품질을 극적으로 향상시킴
- 이 가이드와 LLM 개발 지시서 가이드의 관계 설명 (이 가이드 = CLAUDE.md 특화 심층 가이드)

**Section 2: 템플릿 구조 개요** (~20 lines)

- CLAUDE_MD_TEMPLATE.md의 섹션 구조를 트리 형태로 보여줌
- 각 섹션의 역할 한 줄 요약

**Section 3: 핵심 원칙** (~80 lines)
6가지 원칙 (LLM 가이드의 6대 원칙을 CLAUDE.md 맥락에 맞게 재해석):

1. 명시적으로 작성하라 — 암시적 규칙은 AI가 무시함
2. 구조화된 섹션 — 일관된 헤딩과 구조로 AI의 정보 검색 효율 향상
3. 코드 예시 우선 — "camelCase를 사용하세요"보다 코드 예시가 효과적
4. 경계 규칙 3단계 — Always Do / Ask First / Never Do 분리
5. 간결함 유지 — 300줄 이하 권장, 넘으면 `.claude/rules/`로 모듈화
6. 자체 검증 — 체크리스트를 활용해 품질 검증

각 원칙마다:

- 왜 중요한지 1-2문장
- 좋은 예시 (코드 블록)
- 나쁜 예시 (코드 블록)

**Section 4: 섹션별 작성 가이드** (~200 lines)
템플릿의 각 섹션에 대해 테이블 + 상세 가이드:

| 섹션 | 핵심 포인트 | 자주 하는 실수 |

그리고 각 섹션별 상세:

1. 프로젝트 개요 — 기술 스택, 버전 정보 포함 필수
2. 프로젝트 구조 — 디렉토리 트리 사용, 각 디렉토리 역할 명시
3. 개발 규칙 — 코드 예시로 보여주기, 추상적 설명 지양
4. 명령어 — 정확한 명령어와 예상 결과 포함
5. 워크플로우 규칙 — Git 규칙, PR/커밋 컨벤션
6. 경계 규칙 — Always/Ask/Never 3단계 분리
7. 테스트 — 테스트 명령어, 패턴, 커버리지 기대치
8. 의존성 및 도구 — 주요 라이브러리와 사용 목적

각 섹션마다 좋은 예시 vs 나쁜 예시 코드 블록 포함

**Section 5: 작성 팁** (~40 lines)

- 명령형 어조 사용 ("~하세요", "~사용합니다")
- 모호성 제거 (정량적 표현 우선)
- 리터럴 리딩 테스트 — 작성 후 글자 그대로 읽어보기
- 점진적 발전 — 처음부터 완벽할 필요 없음, 프로젝트와 함께 진화
- 팀 규칙 vs 개인 규칙 분리 (CLAUDE.md vs CLAUDE.local.md)

**Section 6: 안티패턴** (~50 lines)
흔한 CLAUDE.md 실수 5가지:

1. 너무 모호 — "깨끗한 코드를 작성하세요" → 구체적 규칙 필요
2. 너무 김 — 500줄+ 시 AI가 우선순위를 놓침
3. 모순되는 규칙 — "함수를 짧게" + "모든 에러를 처리" 충돌
4. 과잉 설계 — 프로젝트에 없는 패턴까지 규칙화
5. 업데이트 안 함 — 프로젝트 변경 시 CLAUDE.md도 함께 업데이트 필요

각 안티패턴마다 나쁜 예시 → 개선된 예시

**Section 7: 파일 위치 및 모듈화** (~30 lines)

- 파일 위치 계층 (우선순위 순): 프로젝트루트/CLAUDE.md → .claude/CLAUDE.md → ~/.claude/CLAUDE.md
- CLAUDE.local.md 사용법
- `.claude/rules/` 모듈화 전략 (300줄 초과 시)
- `@imports` 활용법

Step 2: Verify line count and formatting

```bash
wc -l docs/CLAUDE_MD/templates/CLAUDE_MD_WRITING_GUIDE.md
```

Expected: 400-500 lines

Step 3: Commit

```bash
git add docs/CLAUDE_MD/templates/CLAUDE_MD_WRITING_GUIDE.md
git commit -m "docs: add CLAUDE.md writing guide with best practices"
```

---

### Task 3: Write CLAUDE_MD_TEMPLATE.md

Files:

- Create: `docs/CLAUDE_MD/templates/CLAUDE_MD_TEMPLATE.md`

Step 1: Write the Template

Write `docs/CLAUDE_MD/templates/CLAUDE_MD_TEMPLATE.md` (~200-300 lines). This is a copy-paste-ready fill-in template. Reference the existing brief template in LLM guide section 9.1 but expand it significantly with more structure and placeholder guidance.

Structure:

```markdown
# [프로젝트명]

> 이 문서는 Claude Code가 프로젝트 컨텍스트를 이해하기 위한 지시서입니다.

## 프로젝트 개요

- **설명**: [프로젝트 한 줄 설명]
- **기술 스택**: [예: TypeScript, Next.js 14, PostgreSQL]
- **패키지 매니저**: [예: pnpm]
- **Node 버전**: [예: v20.x]

## 프로젝트 구조

[디렉토리 트리 + 각 디렉토리 역할 설명]

## 개발 규칙

### 코드 스타일
[네이밍 컨벤션, 포맷팅 규칙 — 코드 예시로]

### 패턴
[사용하는 디자인 패턴 — 코드 예시로]

### 임포트 규칙
[임포트 순서, 경로 별칭 등]

## 명령어

| 명령어 | 설명 |
[빌드, 테스트, 린트, 배포 명령어 테이블]

## 워크플로우 규칙

### Git 컨벤션
[브랜치 네이밍, 커밋 메시지 형식]

### PR 프로세스
[PR 생성, 리뷰, 머지 규칙]

## 경계 규칙

### ✅ Always Do
[항상 지켜야 할 규칙 목록]

### ⚠️ Ask First
[실행 전 확인이 필요한 작업 목록]

### 🚫 Never Do
[절대 하지 말아야 할 규칙 목록]

## 테스트

### 테스트 명령어
[테스트 실행 방법]

### 테스트 패턴
[테스트 작성 규칙 — 코드 예시]

### 커버리지
[커버리지 기대치]

## 의존성 및 도구

### 핵심 라이브러리
[주요 라이브러리와 사용 목적]

### 외부 서비스
[사용하는 외부 API/서비스]

### 개발 도구
[린터, 포맷터, CI/CD 도구]
```

각 섹션에:

- HTML 주석으로 작성 가이드 (`<!-- 여기에 ... -->`)
- 플레이스홀더 텍스트 (`[예: ...]`)
- 섹션 목적 설명

Step 2: Verify line count

```bash
wc -l docs/CLAUDE_MD/templates/CLAUDE_MD_TEMPLATE.md
```

Expected: 200-300 lines

Step 3: Commit

```bash
git add docs/CLAUDE_MD/templates/CLAUDE_MD_TEMPLATE.md
git commit -m "docs: add CLAUDE.md fill-in template"
```

---

### Task 4: Write CLAUDE_MD_CHECKLIST.md

Files:

- Create: `docs/CLAUDE_MD/templates/CLAUDE_MD_CHECKLIST.md`

Step 1: Write the Checklist

Write `docs/CLAUDE_MD/templates/CLAUDE_MD_CHECKLIST.md` (~100-150 lines) following the pattern of `docs/PRD/templates/PRD_CHECKLIST.md`.

Structure:

```markdown
# CLAUDE.md 품질 검증 체크리스트

> CLAUDE.md 작성 완료 후, 아래 체크리스트를 사용하여 품질을 검증하세요.

---

## 1. 프로젝트 개요
- [ ] 프로젝트 설명이 한 줄로 명확히 기술되어 있는가
- [ ] 기술 스택이 버전과 함께 명시되어 있는가
- [ ] 패키지 매니저가 명시되어 있는가

## 2. 프로젝트 구조
- [ ] 주요 디렉토리가 트리 형태로 표시되어 있는가
- [ ] 각 디렉토리의 역할이 설명되어 있는가
- [ ] 중요한 파일의 위치가 포함되어 있는가

## 3. 개발 규칙
- [ ] 네이밍 컨벤션이 코드 예시와 함께 있는가
- [ ] 사용하는 디자인 패턴이 코드로 시연되어 있는가
- [ ] 임포트 순서/규칙이 명시되어 있는가
- [ ] 추상적 표현("깨끗한 코드") 없이 구체적 규칙인가

## 4. 명령어
- [ ] 빌드, 테스트, 린트 명령어가 포함되어 있는가
- [ ] 명령어가 정확하고 실행 가능한가
- [ ] 환경별 명령어 차이가 있다면 명시되어 있는가

## 5. 워크플로우 규칙
- [ ] Git 브랜치 네이밍 규칙이 있는가
- [ ] 커밋 메시지 형식이 정의되어 있는가
- [ ] PR 프로세스가 기술되어 있는가

## 6. 경계 규칙
- [ ] Always Do / Ask First / Never Do가 분리되어 있는가
- [ ] 각 규칙이 구체적이고 실행 가능한가
- [ ] 규칙 간 모순이 없는가
- [ ] Never Do에 실제 위험한 작업이 포함되어 있는가

## 7. 테스트
- [ ] 테스트 실행 명령어가 포함되어 있는가
- [ ] 테스트 작성 패턴/규칙이 있는가
- [ ] 커버리지 기대치가 명시되어 있는가

## 8. 의존성 및 도구
- [ ] 핵심 라이브러리와 사용 목적이 명시되어 있는가
- [ ] 외부 서비스가 나열되어 있는가

## 9. 전체 품질
- [ ] 전체 길이가 300줄 이하인가 (초과 시 모듈화 고려)
- [ ] 산문 대신 코드 예시를 사용하고 있는가
- [ ] 모호한 표현("적절히", "깨끗하게")이 없는가
- [ ] 현재 프로젝트에 실제로 적용되는 규칙만 포함되어 있는가
- [ ] CLAUDE.md와 CLAUDE.local.md의 역할이 분리되어 있는가
```

점수 산정 테이블 포함 (PRD 체크리스트와 동일 형식):

- 섹션별 항목 수, 충족 수, 점수
- 등급 기준: EXCELLENT / GOOD / FAIR / INSUFFICIENT

Step 2: Verify line count

```bash
wc -l docs/CLAUDE_MD/templates/CLAUDE_MD_CHECKLIST.md
```

Expected: 100-150 lines

Step 3: Commit

```bash
git add docs/CLAUDE_MD/templates/CLAUDE_MD_CHECKLIST.md
git commit -m "docs: add CLAUDE.md quality validation checklist"
```

---

### Task 5: Cross-reference from LLM Guide (optional, lightweight)

Files:

- Modify: `docs/GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md` (add 2-3 lines near section 9.1)

Step 1: Add cross-reference

Near the section 9.1 header (`### 9.1 CLAUDE.md 템플릿`), add a note pointing to the new template kit:

```markdown
> 💡 더 상세한 CLAUDE.md 작성 가이드와 품질 체크리스트는 [CLAUDE.md 템플릿 킷](../CLAUDE_MD/templates/README.md)을 참고하세요.
```

Step 2: Commit

```bash
git add docs/GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md
git commit -m "docs: add cross-reference to CLAUDE.md template kit from LLM guide"
```

---

### Task 6: Final validation

Step 1: Verify all files exist

```bash
ls -la docs/CLAUDE_MD/templates/
```

Expected: README.md, CLAUDE_MD_WRITING_GUIDE.md, CLAUDE_MD_TEMPLATE.md, CLAUDE_MD_CHECKLIST.md

Step 2: Verify all internal links work

Check that relative links in README.md point to existing files:

```bash
grep -o '\./[^)]*' docs/CLAUDE_MD/templates/README.md
```

Verify each linked file exists.

Step 3: Verify no broken cross-references

Check the LLM guide cross-reference link resolves:

```bash
ls docs/CLAUDE_MD/templates/README.md
```

Step 4: Final commit (if any fixes needed)

```bash
git add -A docs/CLAUDE_MD/ docs/GUIDE/
git commit -m "docs: finalize CLAUDE.md template kit"
```
