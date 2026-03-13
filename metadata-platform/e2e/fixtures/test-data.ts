export const USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin1234',
    name: '시스템 관리자',
  },
  manager: {
    email: 'manager@example.com',
    password: 'manager1234',
    name: '표준 담당자',
  },
  approver: {
    email: 'approver@example.com',
    password: 'approver1234',
    name: '승인 담당자',
  },
} as const

export function testDomain() {
  const ts = Date.now()
  return {
    name: `E2E-도메인-${ts}`,
    description: `E2E 테스트용 도메인 ${ts}`,
    dataType: 'VARCHAR',
  }
}

export function testTerm() {
  const ts = Date.now()
  return {
    termName: `E2E-용어-${ts}`,
    termEnglishName: `E2E-Term-${ts}`,
    termDescription: `E2E 테스트용 용어 ${ts}`,
  }
}

export function testCodeGroup() {
  const ts = Date.now()
  return {
    groupName: `E2E-코드그룹-${ts}`,
    groupEnglishName: `E2E_CODE_GROUP_${ts}`,
    groupDescription: `E2E 테스트용 코드 그룹 ${ts}`,
    items: [
      { code: 'A', name: '항목A', description: '첫 번째 항목' },
      { code: 'B', name: '항목B', description: '두 번째 항목' },
    ],
  }
}
