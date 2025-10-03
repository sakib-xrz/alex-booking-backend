import {
  CounsellorBalance,
  BalanceTransaction,
  BalanceTransactionType,
  Prisma,
} from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';

interface BalanceFilters {
  search?: string;
}

// Get or create counsellor balance
const getOrCreateCounsellorBalance = async (
  counsellor_id: string,
): Promise<CounsellorBalance> => {
  let balance = await prisma.counsellorBalance.findUnique({
    where: { counsellor_id },
  });

  if (!balance) {
    balance = await prisma.counsellorBalance.create({
      data: {
        counsellor_id,
        current_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      },
    });
  }

  return balance;
};

// Get counsellor balance
const getCounsellorBalance = async (
  counsellor_id: string,
): Promise<CounsellorBalance> => {
  return await getOrCreateCounsellorBalance(counsellor_id);
};

// Add balance to counsellor (after successful payment)
const addBalance = async (
  counsellor_id: string,
  amount: number,
  description: string,
  reference_id?: string,
  reference_type?: string,
): Promise<{ balance: CounsellorBalance; transaction: BalanceTransaction }> => {
  return await prisma.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.counsellorBalance.findUnique({
      where: { counsellor_id },
    });

    if (!currentBalance) {
      throw new AppError(httpStatus.NOT_FOUND, 'Counsellor balance not found');
    }

    const balanceBefore = Number(currentBalance.current_balance);
    const balanceAfter = balanceBefore + amount;

    // Update balance
    const updatedBalance = await tx.counsellorBalance.update({
      where: { counsellor_id },
      data: {
        current_balance: balanceAfter,
        total_earned: Number(currentBalance.total_earned) + amount,
      },
    });

    // Create transaction record
    const transaction = await tx.balanceTransaction.create({
      data: {
        counsellor_id,
        type: BalanceTransactionType.CREDIT,
        amount,
        description,
        reference_id,
        reference_type,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
      },
    });

    return { balance: updatedBalance, transaction };
  });
};

// Deduct balance from counsellor (for payouts)
const deductBalance = async (
  counsellor_id: string,
  amount: number,
  description: string,
  reference_id?: string,
  reference_type?: string,
  processed_by?: string,
): Promise<{ balance: CounsellorBalance; transaction: BalanceTransaction }> => {
  return await prisma.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.counsellorBalance.findUnique({
      where: { counsellor_id },
    });

    if (!currentBalance) {
      throw new AppError(httpStatus.NOT_FOUND, 'Counsellor balance not found');
    }

    const balanceBefore = Number(currentBalance.current_balance);

    if (balanceBefore < amount) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient balance');
    }

    const balanceAfter = balanceBefore - amount;

    // Update balance
    const updatedBalance = await tx.counsellorBalance.update({
      where: { counsellor_id },
      data: {
        current_balance: balanceAfter,
        total_withdrawn: Number(currentBalance.total_withdrawn) + amount,
      },
    });

    // Create transaction record
    const transaction = await tx.balanceTransaction.create({
      data: {
        counsellor_id,
        type: BalanceTransactionType.DEBIT,
        amount,
        description,
        reference_id,
        reference_type,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        processed_by,
      },
    });

    return { balance: updatedBalance, transaction };
  });
};

// Manual balance adjustment (for super admin)
const adjustBalance = async (
  counsellor_id: string,
  amount: number,
  description: string,
  processed_by: string,
): Promise<{ balance: CounsellorBalance; transaction: BalanceTransaction }> => {
  return await prisma.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.counsellorBalance.findUnique({
      where: { counsellor_id },
    });

    if (!currentBalance) {
      throw new AppError(httpStatus.NOT_FOUND, 'Counsellor balance not found');
    }

    const balanceBefore = Number(currentBalance.current_balance);
    const balanceAfter = balanceBefore + amount;

    // Update balance
    const updatedBalance = await tx.counsellorBalance.update({
      where: { counsellor_id },
      data: {
        current_balance: balanceAfter,
        total_earned:
          amount > 0
            ? Number(currentBalance.total_earned) + amount
            : currentBalance.total_earned,
      },
    });

    // Create transaction record
    const transaction = await tx.balanceTransaction.create({
      data: {
        counsellor_id,
        type: BalanceTransactionType.MANUAL_ADJUSTMENT,
        amount: Math.abs(amount),
        description,
        reference_type: 'manual_adjustment',
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        processed_by,
      },
    });

    return { balance: updatedBalance, transaction };
  });
};

// Get balance transactions for a counsellor
const getBalanceTransactions = async (
  counsellor_id: string,
  filters: BalanceFilters,
  paginationOptions: IPaginationOptions,
): Promise<{
  data: BalanceTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.BalanceTransactionWhereInput = {
    counsellor_id,
  };

  const orderBy: Prisma.BalanceTransactionOrderByWithRelationInput = {};
  if (sort_by === 'amount') {
    orderBy.amount = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'type') {
    orderBy.type = sort_order as Prisma.SortOrder;
  } else {
    orderBy.created_at = sort_order as Prisma.SortOrder;
  }

  const [transactions, total] = await Promise.all([
    prisma.balanceTransaction.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.balanceTransaction.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: transactions,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// Get all counsellor balances (for super admin)
const getAllCounsellorBalances = async (
  filters: BalanceFilters,
  paginationOptions: IPaginationOptions,
): Promise<{
  data: (CounsellorBalance & {
    counsellor: { name: string; email: string };
  })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);

  const whereClause: Prisma.CounsellorBalanceWhereInput = {};

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

  const orderBy: Prisma.CounsellorBalanceOrderByWithRelationInput = {};
  if (sort_by === 'name' || sort_by === 'email') {
    orderBy.counsellor = { [sort_by]: sort_order as Prisma.SortOrder };
  } else if (
    sort_by === 'current_balance' ||
    sort_by === 'total_earned' ||
    sort_by === 'total_withdrawn'
  ) {
    orderBy[sort_by] = sort_order as Prisma.SortOrder;
  } else {
    orderBy.updated_at = sort_order as Prisma.SortOrder;
  }

  const [balances, total] = await Promise.all([
    prisma.counsellorBalance.findMany({
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
    prisma.counsellorBalance.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: balances,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// Set balance values (for super admin - direct balance manipulation)
const setBalanceValues = async (
  counsellor_id: string,
  current_balance: number,
  total_earned: number,
  total_withdrawn: number,
  processed_by: string,
): Promise<{ balance: CounsellorBalance; transaction: BalanceTransaction }> => {
  return await prisma.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.counsellorBalance.findUnique({
      where: { counsellor_id },
    });

    if (!currentBalance) {
      throw new AppError(httpStatus.NOT_FOUND, 'Counsellor balance not found');
    }

    const balanceBefore = Number(currentBalance.current_balance);

    // Update balance with new values
    const updatedBalance = await tx.counsellorBalance.update({
      where: { counsellor_id },
      data: {
        current_balance,
        total_earned,
        total_withdrawn,
      },
    });

    // Create transaction record for the balance change
    const balanceDifference = current_balance - balanceBefore;
    const transaction = await tx.balanceTransaction.create({
      data: {
        counsellor_id,
        type: BalanceTransactionType.MANUAL_ADJUSTMENT,
        amount: Math.abs(balanceDifference),
        description: `Balance values updated - Current: ${current_balance}, Total Earned: ${total_earned}, Total Withdrawn: ${total_withdrawn}`,
        reference_type: 'balance_update',
        balance_before: balanceBefore,
        balance_after: current_balance,
        processed_by,
      },
    });

    return { balance: updatedBalance, transaction };
  });
};

export const BalanceService = {
  getOrCreateCounsellorBalance,
  getCounsellorBalance,
  addBalance,
  deductBalance,
  adjustBalance,
  setBalanceValues,
  getBalanceTransactions,
  getAllCounsellorBalances,
};
