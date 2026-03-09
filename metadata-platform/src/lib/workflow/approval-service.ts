import { prisma } from '@/lib/db/prisma'
import {
  ApprovalAction,
  ApprovalStatus,
  RequestType,
  StandardStatus,
  TargetType,
} from '@/generated/prisma/client'
import type { PrismaClient } from '@/generated/prisma/client'

interface CreateApprovalRequestInput {
  targetType: TargetType
  targetId: string
  requestType: RequestType
  requesterId: string
  comment?: string
}

export async function createApprovalRequest({
  targetType,
  targetId,
  requestType,
  requesterId,
  comment,
}: CreateApprovalRequestInput) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.create({
      data: {
        targetType,
        targetId,
        requestType,
        requesterId,
        requestComment: comment,
        status: ApprovalStatus.PENDING,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId: request.id,
        action: ApprovalAction.SUBMITTED,
        actorId: requesterId,
        comment,
      },
    })

    return request
  })
}

export async function approveRequest(
  requestId: string,
  approverId: string,
  comment?: string,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new Error('NOT_FOUND')
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error('ALREADY_PROCESSED')
    }

    const updated = await tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.APPROVED,
        approverId,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId,
        action: ApprovalAction.APPROVED,
        actorId: approverId,
        comment,
      },
    })

    await activateTarget(tx, request.targetType, request.targetId)

    return updated
  })
}

export async function rejectRequest(
  requestId: string,
  approverId: string,
  comment: string,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new Error('NOT_FOUND')
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error('ALREADY_PROCESSED')
    }

    const updated = await tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.REJECTED,
        approverId,
      },
    })

    await tx.approvalHistory.create({
      data: {
        requestId,
        action: ApprovalAction.REJECTED,
        actorId: approverId,
        comment,
      },
    })

    return updated
  })
}

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

async function activateTarget(
  tx: TransactionClient,
  targetType: TargetType,
  targetId: string,
) {
  switch (targetType) {
    case TargetType.DOMAIN:
      await tx.standardDomain.update({
        where: { id: targetId },
        data: { status: StandardStatus.ACTIVE },
      })
      break
    case TargetType.TERM:
      await tx.standardTerm.update({
        where: { id: targetId },
        data: { status: StandardStatus.ACTIVE },
      })
      break
    case TargetType.CODE_GROUP:
      await tx.codeGroup.update({
        where: { id: targetId },
        data: { status: StandardStatus.ACTIVE },
      })
      break
  }
}
