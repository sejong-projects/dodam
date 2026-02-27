# CLAUDE.md 템플릿 킷

> Claude Code 프로젝트용 **CLAUDE.md 작성을 위한 범용 템플릿 키트**

---

## 파일 구성

| 파일 | 설명 | 용도 |
| ------ | ------ | ------ |
| [CLAUDE_MD_TEMPLATE.md](./CLAUDE_MD_TEMPLATE.md) | **CLAUDE.md 템플릿 (메인)** | 새 CLAUDE.md 작성 시 복사하여 사용 |
| [CLAUDE_MD_WRITING_GUIDE.md](./CLAUDE_MD_WRITING_GUIDE.md) | **작성 가이드** | 템플릿 사용법, 원칙, 팁 참고 |
| [CLAUDE_MD_CHECKLIST.md](./CLAUDE_MD_CHECKLIST.md) | **품질 검증 체크리스트** | CLAUDE.md 완성 후 품질 검증 |

---

## 사용 방법

### 1. 새 CLAUDE.md 작성

```bash
# CLAUDE_MD_TEMPLATE.md를 복사하여 프로젝트 CLAUDE.md 생성
cp CLAUDE_MD_TEMPLATE.md CLAUDE.md
```

### 2. 가이드 참고하며 작성

- `CLAUDE_MD_WRITING_GUIDE.md`에서 섹션별 작성 팁 확인
- 프로젝트 기술 스택과 컨벤션에 맞게 내용 조정
- 명시적 규칙 선언 원칙 준수

### 3. 품질 검증

- `CLAUDE_MD_CHECKLIST.md`로 자체 평가
- 모든 필수 항목 충족 후 프로젝트에 적용

---

## 설계 원칙

- **명시적 > 암시적** — 모든 규칙과 제약을 명시적으로 선언
- **간결함 유지** — 300줄 이하 권장, LLM 컨텍스트 한계 고려
- **코드 예시 우선** — 산문보다 코드 블록으로 규칙 시연
- **YAGNI** — 현재 프로젝트에 필요한 규칙만 포함

---

## 참고 자료

- [LLM 개발 지시 가이드](../../GUIDE/LLM_DEV_INSTRUCTION_GUIDE.md)
- [Builder.io - CLAUDE.md Guide](https://www.builder.io/blog/claude-md-guide)
- [Anthropic - Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
