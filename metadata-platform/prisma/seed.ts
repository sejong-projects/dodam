import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { RoleName } from '../src/generated/prisma/enums.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 역할 생성
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: '시스템 관리자 - 전체 권한' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.STANDARD_MANAGER },
      update: {},
      create: { name: RoleName.STANDARD_MANAGER, description: '표준 담당자 - 표준 데이터 등록/수정' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.APPROVER },
      update: {},
      create: { name: RoleName.APPROVER, description: '승인자 - 표준 데이터 승인/반려' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.VIEWER },
      update: {},
      create: { name: RoleName.VIEWER, description: '조회자 - 읽기 전용' },
    }),
  ])

  // 관리자 계정 생성
  const hashedPassword = await hashPassword('admin1234')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '시스템 관리자',
      department: '정보기술부',
      status: 'ACTIVE',
    },
  })

  // 관리자 credential 계정 (Better Auth 인증용)
  await prisma.account.upsert({
    where: { id: `credential-${admin.id}` },
    update: { password: hashedPassword },
    create: {
      id: `credential-${admin.id}`,
      userId: admin.id,
      accountId: admin.id,
      providerId: 'credential',
      password: hashedPassword,
    },
  })

  // 관리자 역할 부여
  const adminRole = roles.find((r) => r.name === RoleName.ADMIN)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  })

  // 테스트용 표준 담당자 계정
  const managerPassword = await hashPassword('manager1234')
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: { password: managerPassword },
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      name: '표준 담당자',
      department: '데이터관리부',
      status: 'ACTIVE',
    },
  })

  await prisma.account.upsert({
    where: { id: `credential-${manager.id}` },
    update: { password: managerPassword },
    create: {
      id: `credential-${manager.id}`,
      userId: manager.id,
      accountId: manager.id,
      providerId: 'credential',
      password: managerPassword,
    },
  })

  const managerRole = roles.find((r) => r.name === RoleName.STANDARD_MANAGER)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: managerRole.id } },
    update: {},
    create: { userId: manager.id, roleId: managerRole.id },
  })

  // 테스트용 승인자 계정
  const approverPassword = await hashPassword('approver1234')
  const approver = await prisma.user.upsert({
    where: { email: 'approver@example.com' },
    update: { password: approverPassword },
    create: {
      email: 'approver@example.com',
      password: approverPassword,
      name: '승인 담당자',
      department: '데이터관리부',
      status: 'ACTIVE',
    },
  })

  await prisma.account.upsert({
    where: { id: `credential-${approver.id}` },
    update: { password: approverPassword },
    create: {
      id: `credential-${approver.id}`,
      userId: approver.id,
      accountId: approver.id,
      providerId: 'credential',
      password: approverPassword,
    },
  })

  const approverRole = roles.find((r) => r.name === RoleName.APPROVER)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: approver.id, roleId: approverRole.id } },
    update: {},
    create: { userId: approver.id, roleId: approverRole.id },
  })

  // 샘플 표준 도메인 생성
  const domain = await prisma.standardDomain.upsert({
    where: { domainName: '한글명' },
    update: {},
    create: {
      domainName: '한글명',
      domainDescription: '한글로 된 이름을 저장하는 도메인',
      dataType: 'VARCHAR',
      length: 100,
      status: 'ACTIVE',
      createdBy: admin.id,
    },
  })

  console.log('Seed completed:', {
    roles: roles.length,
    admin: admin.email,
    manager: manager.email,
    approver: approver.email,
    domain: domain.domainName,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
