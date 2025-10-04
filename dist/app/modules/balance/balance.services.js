"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const pagination_1 = __importDefault(require("../../utils/pagination"));
const getOrCreateCounsellorBalance = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    let balance = yield prisma_1.default.counsellorBalance.findUnique({
        where: { counsellor_id },
    });
    if (!balance) {
        balance = yield prisma_1.default.counsellorBalance.create({
            data: {
                counsellor_id,
                current_balance: 0,
                total_earned: 0,
                total_withdrawn: 0,
            },
        });
    }
    return balance;
});
const getCounsellorBalance = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield getOrCreateCounsellorBalance(counsellor_id);
});
const addBalance = (counsellor_id, amount, description, reference_id, reference_type) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentBalance = yield tx.counsellorBalance.findUnique({
            where: { counsellor_id },
        });
        if (!currentBalance) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Counsellor balance not found');
        }
        const balanceBefore = Number(currentBalance.current_balance);
        const balanceAfter = balanceBefore + amount;
        const updatedBalance = yield tx.counsellorBalance.update({
            where: { counsellor_id },
            data: {
                current_balance: balanceAfter,
                total_earned: Number(currentBalance.total_earned) + amount,
            },
        });
        const transaction = yield tx.balanceTransaction.create({
            data: {
                counsellor_id,
                type: client_1.BalanceTransactionType.CREDIT,
                amount,
                description,
                reference_id,
                reference_type,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
            },
        });
        return { balance: updatedBalance, transaction };
    }));
});
const deductBalance = (counsellor_id, amount, description, reference_id, reference_type, processed_by) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentBalance = yield tx.counsellorBalance.findUnique({
            where: { counsellor_id },
        });
        if (!currentBalance) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Counsellor balance not found');
        }
        const balanceBefore = Number(currentBalance.current_balance);
        if (balanceBefore < amount) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Insufficient balance');
        }
        const balanceAfter = balanceBefore - amount;
        const updatedBalance = yield tx.counsellorBalance.update({
            where: { counsellor_id },
            data: {
                current_balance: balanceAfter,
                total_withdrawn: Number(currentBalance.total_withdrawn) + amount,
            },
        });
        const transaction = yield tx.balanceTransaction.create({
            data: {
                counsellor_id,
                type: client_1.BalanceTransactionType.DEBIT,
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
    }));
});
const adjustBalance = (counsellor_id, amount, description, processed_by) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentBalance = yield tx.counsellorBalance.findUnique({
            where: { counsellor_id },
        });
        if (!currentBalance) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Counsellor balance not found');
        }
        const balanceBefore = Number(currentBalance.current_balance);
        const balanceAfter = balanceBefore + amount;
        const updatedBalance = yield tx.counsellorBalance.update({
            where: { counsellor_id },
            data: {
                current_balance: balanceAfter,
                total_earned: amount > 0
                    ? Number(currentBalance.total_earned) + amount
                    : currentBalance.total_earned,
            },
        });
        const transaction = yield tx.balanceTransaction.create({
            data: {
                counsellor_id,
                type: client_1.BalanceTransactionType.MANUAL_ADJUSTMENT,
                amount: Math.abs(amount),
                description,
                reference_type: 'manual_adjustment',
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                processed_by,
            },
        });
        return { balance: updatedBalance, transaction };
    }));
});
const getBalanceTransactions = (counsellor_id, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {
        counsellor_id,
    };
    const orderBy = {};
    if (sort_by === 'amount') {
        orderBy.amount = sort_order;
    }
    else if (sort_by === 'type') {
        orderBy.type = sort_order;
    }
    else {
        orderBy.created_at = sort_order;
    }
    const [transactions, total] = yield Promise.all([
        prisma_1.default.balanceTransaction.findMany({
            where: whereClause,
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.balanceTransaction.count({ where: whereClause }),
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
});
const getAllCounsellorBalances = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {};
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
    const orderBy = {};
    if (sort_by === 'name' || sort_by === 'email') {
        orderBy.counsellor = { [sort_by]: sort_order };
    }
    else if (sort_by === 'current_balance' ||
        sort_by === 'total_earned' ||
        sort_by === 'total_withdrawn') {
        orderBy[sort_by] = sort_order;
    }
    else {
        orderBy.updated_at = sort_order;
    }
    const [balances, total] = yield Promise.all([
        prisma_1.default.counsellorBalance.findMany({
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
        prisma_1.default.counsellorBalance.count({ where: whereClause }),
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
});
const setBalanceValues = (counsellor_id, current_balance, total_earned, total_withdrawn, processed_by) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentBalance = yield tx.counsellorBalance.findUnique({
            where: { counsellor_id },
        });
        if (!currentBalance) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Counsellor balance not found');
        }
        const balanceBefore = Number(currentBalance.current_balance);
        const updatedBalance = yield tx.counsellorBalance.update({
            where: { counsellor_id },
            data: {
                current_balance,
                total_earned,
                total_withdrawn,
            },
        });
        const balanceDifference = current_balance - balanceBefore;
        const transaction = yield tx.balanceTransaction.create({
            data: {
                counsellor_id,
                type: client_1.BalanceTransactionType.MANUAL_ADJUSTMENT,
                amount: Math.abs(balanceDifference),
                description: `Balance values updated - Current: ${current_balance}, Total Earned: ${total_earned}, Total Withdrawn: ${total_withdrawn}`,
                reference_type: 'balance_update',
                balance_before: balanceBefore,
                balance_after: current_balance,
                processed_by,
            },
        });
        return { balance: updatedBalance, transaction };
    }));
});
exports.BalanceService = {
    getOrCreateCounsellorBalance,
    getCounsellorBalance,
    addBalance,
    deductBalance,
    adjustBalance,
    setBalanceValues,
    getBalanceTransactions,
    getAllCounsellorBalances,
};
