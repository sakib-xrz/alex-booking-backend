import { PayoutRequest, PayoutStatus, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { BalanceService } from '../balance/balance.services';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { stripe } from '../payment/payment.utils';

interface CreatePayoutRequestData {
  counsellor_id: string;
  amount: number;
  notes?: string;
}

interface PayoutFilters {
  search?: string;
  status?: PayoutStatus;
  counsellor_id?: string;
}

interface ProcessPayoutData {
  payout_request_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
  processed_by: string;
}

// Create payout request
const createPayoutRequest = async (
  data: CreatePayoutRequestData,
): Promise<PayoutRequest> => {
  // Check if counsellor has sufficient balance
  const balance = await BalanceService.getCounsellorBalance(data.counsellor_id);

  if (Number(balance.current_balance) < data.amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Insufficient balance for payout request',
    );
  }

  // Check if counsellor has Stripe account connected
  const counsellor = await prisma.user.findUnique({
    where: { id: data.counsellor_id },
    select: { is_stripe_connected: true, stripe_account_id: true },
  });

  if (!counsellor?.is_stripe_connected || !counsellor.stripe_account_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account must be connected before requesting payout',
    );
  }

  // Check if there's already a pending payout request
  const existingPendingRequest = await prisma.payoutRequest.findFirst({
    where: {
      counsellor_id: data.counsellor_id,
      status: 'PENDING',
    },
  });

  if (existingPendingRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a pending payout request',
    );
  }

  // Create payout request
  const payoutRequest = await prisma.payoutRequest.create({
    data: {
      counsellor_id: data.counsellor_id,
      amount: data.amount,
      notes: data.notes,
      status: 'PENDING',
    },
    include: {
      counsellor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return payoutRequest;
};

// Get payout requests for a counsellor
const getCounsellorPayoutRequests = async (
  counsellor_id: string,
  filters: PayoutFilters,
  paginationOptions: IPaginationOptions,
): Promise<{
  data: PayoutRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.PayoutRequestWhereInput = {
    counsellor_id,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  }

  const orderBy: Prisma.PayoutRequestOrderByWithRelationInput = {};
  if (sort_by === 'amount') {
    orderBy.amount = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'status') {
    orderBy.status = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'processed_at') {
    orderBy.processed_at = sort_order as Prisma.SortOrder;
  } else {
    orderBy.requested_at = sort_order as Prisma.SortOrder;
  }

  const [requests, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.payoutRequest.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: requests,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// Get all payout requests (for super admin)
const getAllPayoutRequests = async (
  filters: PayoutFilters,
  paginationOptions: IPaginationOptions,
): Promise<{
  data: (PayoutRequest & { counsellor: { name: string; email: string } })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.PayoutRequestWhereInput = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.counsellor_id) {
    whereClause.counsellor_id = filters.counsellor_id;
  }

  // Add search functionality
  if (filters.search) {
    whereClause.counsellor = {
      OR: [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  const orderBy: Prisma.PayoutRequestOrderByWithRelationInput = {};
  if (sort_by === 'name' || sort_by === 'email') {
    orderBy.counsellor = { [sort_by]: sort_order as Prisma.SortOrder };
  } else if (sort_by === 'amount') {
    orderBy.amount = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'status') {
    orderBy.status = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'processed_at') {
    orderBy.processed_at = sort_order as Prisma.SortOrder;
  } else {
    orderBy.requested_at = sort_order as Prisma.SortOrder;
  }

  const [requests, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: whereClause,
      include: {
        counsellor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.payoutRequest.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: requests,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// Process payout request (approve/reject)
const processPayoutRequest = async (
  data: ProcessPayoutData,
): Promise<PayoutRequest> => {
  return await prisma.$transaction(async (tx) => {
    // Get payout request
    const payoutRequest = await tx.payoutRequest.findUnique({
      where: { id: data.payout_request_id },
      include: {
        counsellor: {
          select: {
            stripe_account_id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payoutRequest) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');
    }

    if (payoutRequest.status !== 'PENDING') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Payout request is not pending',
      );
    }

    if (data.action === 'reject') {
      // Reject the payout request
      const updatedRequest = await tx.payoutRequest.update({
        where: { id: data.payout_request_id },
        data: {
          status: 'REJECTED',
          processed_at: new Date(),
          processed_by: data.processed_by,
          rejection_reason: data.rejection_reason,
        },
      });

      return updatedRequest;
    }

    // Approve the payout request
    if (data.action === 'approve') {
      // Check if counsellor still has sufficient balance
      const balance = await tx.counsellorBalance.findUnique({
        where: { counsellor_id: payoutRequest.counsellor_id },
      });

      if (
        !balance ||
        Number(balance.current_balance) < Number(payoutRequest.amount)
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Insufficient balance for payout',
        );
      }

      // Update payout request status to APPROVED
      const updatedRequest = await tx.payoutRequest.update({
        where: { id: data.payout_request_id },
        data: {
          status: 'APPROVED',
          processed_at: new Date(),
          processed_by: data.processed_by,
        },
      });

      return updatedRequest;
    }

    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid action');
  });
};

// Execute payout - Automated Stripe Connect transfer
const executePayout = async (
  payout_request_id: string,
): Promise<PayoutRequest> => {
  return await prisma.$transaction(async (tx) => {
    // Get approved payout request
    const payoutRequest = await tx.payoutRequest.findUnique({
      where: { id: payout_request_id },
      include: {
        counsellor: {
          select: {
            stripe_account_id: true,
            stripe_payouts_enabled: true,
            stripe_onboarding_complete: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payoutRequest) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');
    }

    if (payoutRequest.status !== 'APPROVED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Payout request is not approved',
      );
    }

    if (!payoutRequest.counsellor.stripe_account_id) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Counsellor has not connected their Stripe account. Please ask them to complete Stripe onboarding first.',
      );
    }

    if (!payoutRequest.counsellor.stripe_payouts_enabled) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Counsellor Stripe account is not yet enabled for payouts. They may need to complete onboarding or verification.',
      );
    }

    // Update status to PROCESSING
    await tx.payoutRequest.update({
      where: { id: payout_request_id },
      data: { status: 'PROCESSING' },
    });

    try {
      // Create Stripe transfer to counsellor's Connected Account
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(payoutRequest.amount) * 100), // Convert to cents
        currency: 'aud',
        destination: payoutRequest.counsellor.stripe_account_id,
        description: `Payout for ${payoutRequest.counsellor.name} - Request #${payoutRequest.id.slice(-8)}`,
        metadata: {
          payout_request_id: payoutRequest.id,
          counsellor_id: payoutRequest.counsellor_id,
          counsellor_name: payoutRequest.counsellor.name,
        },
      });

      console.log(
        `✅ Stripe transfer created: ${transfer.id} for $${payoutRequest.amount} AUD`,
      );

      // Deduct balance from counsellor
      await BalanceService.deductBalance(
        payoutRequest.counsellor_id,
        Number(payoutRequest.amount),
        `Payout transfer - Request #${payoutRequest.id.slice(-8)}`,
        payout_request_id,
        'payout_request',
      );

      // Update payout request with transfer details
      const completedRequest = await tx.payoutRequest.update({
        where: { id: payout_request_id },
        data: {
          status: 'COMPLETED',
          stripe_transfer_id: transfer.id,
        },
      });

      console.log(
        `✅ Payout completed: ${payoutRequest.id} - Transfer ID: ${transfer.id}`,
      );

      return completedRequest;
    } catch (error) {
      // Update status to FAILED
      await tx.payoutRequest.update({
        where: { id: payout_request_id },
        data: { status: 'FAILED' },
      });

      console.error('❌ Stripe transfer failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Payout transfer failed: ${errorMessage}`,
      );
    }
  });
};

// Get payout request by ID
const getPayoutRequestById = async (
  id: string,
): Promise<PayoutRequest | null> => {
  return await prisma.payoutRequest.findUnique({
    where: { id },
    include: {
      counsellor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const PayoutService = {
  createPayoutRequest,
  getCounsellorPayoutRequests,
  getAllPayoutRequests,
  processPayoutRequest,
  executePayout,
  getPayoutRequestById,
};
