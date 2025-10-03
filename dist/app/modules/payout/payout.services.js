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
exports.PayoutService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const balance_services_1 = require("../balance/balance.services");
const payment_utils_1 = require("../payment/payment.utils");
const pagination_1 = __importDefault(require("../../utils/pagination"));
const createPayoutRequest = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const balance = yield balance_services_1.BalanceService.getCounsellorBalance(data.counsellor_id);
    if (Number(balance.current_balance) < data.amount) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Insufficient balance for payout request');
    }
    const counsellor = yield prisma_1.default.user.findUnique({
        where: { id: data.counsellor_id },
        select: { is_stripe_connected: true, stripe_account_id: true },
    });
    if (!(counsellor === null || counsellor === void 0 ? void 0 : counsellor.is_stripe_connected) || !counsellor.stripe_account_id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Stripe account must be connected before requesting payout');
    }
    const existingPendingRequest = yield prisma_1.default.payoutRequest.findFirst({
        where: {
            counsellor_id: data.counsellor_id,
            status: 'PENDING',
        },
    });
    if (existingPendingRequest) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You already have a pending payout request');
    }
    const payoutRequest = yield prisma_1.default.payoutRequest.create({
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
});
const getCounsellorPayoutRequests = (counsellor_id, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {
        counsellor_id,
    };
    if (filters.status) {
        whereClause.status = filters.status;
    }
    const orderBy = {};
    if (sort_by === 'amount') {
        orderBy.amount = sort_order;
    }
    else if (sort_by === 'status') {
        orderBy.status = sort_order;
    }
    else if (sort_by === 'processed_at') {
        orderBy.processed_at = sort_order;
    }
    else {
        orderBy.requested_at = sort_order;
    }
    const [requests, total] = yield Promise.all([
        prisma_1.default.payoutRequest.findMany({
            where: whereClause,
            orderBy,
            skip,
            take: limit,
        }),
        prisma_1.default.payoutRequest.count({ where: whereClause }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { requests, total, totalPages };
});
const getAllPayoutRequests = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const whereClause = {};
    if (filters.status) {
        whereClause.status = filters.status;
    }
    if (filters.counsellor_id) {
        whereClause.counsellor_id = filters.counsellor_id;
    }
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
    else if (sort_by === 'amount') {
        orderBy.amount = sort_order;
    }
    else if (sort_by === 'status') {
        orderBy.status = sort_order;
    }
    else if (sort_by === 'processed_at') {
        orderBy.processed_at = sort_order;
    }
    else {
        orderBy.requested_at = sort_order;
    }
    const [requests, total] = yield Promise.all([
        prisma_1.default.payoutRequest.findMany({
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
        prisma_1.default.payoutRequest.count({ where: whereClause }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { requests, total, totalPages };
});
const processPayoutRequest = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const payoutRequest = yield tx.payoutRequest.findUnique({
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
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Payout request not found');
        }
        if (payoutRequest.status !== 'PENDING') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payout request is not pending');
        }
        if (data.action === 'reject') {
            const updatedRequest = yield tx.payoutRequest.update({
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
        if (data.action === 'approve') {
            const balance = yield tx.counsellorBalance.findUnique({
                where: { counsellor_id: payoutRequest.counsellor_id },
            });
            if (!balance ||
                Number(balance.current_balance) < Number(payoutRequest.amount)) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Insufficient balance for payout');
            }
            const updatedRequest = yield tx.payoutRequest.update({
                where: { id: data.payout_request_id },
                data: {
                    status: 'APPROVED',
                    processed_at: new Date(),
                    processed_by: data.processed_by,
                },
            });
            return updatedRequest;
        }
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid action');
    }));
});
const executePayout = (payout_request_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const payoutRequest = yield tx.payoutRequest.findUnique({
            where: { id: payout_request_id },
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
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Payout request not found');
        }
        if (payoutRequest.status !== 'APPROVED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payout request is not approved');
        }
        if (!payoutRequest.counsellor.stripe_account_id) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Counsellor Stripe account not found');
        }
        yield tx.payoutRequest.update({
            where: { id: payout_request_id },
            data: { status: 'PROCESSING' },
        });
        try {
            const transfer = yield payment_utils_1.stripe.transfers.create({
                amount: Math.round(Number(payoutRequest.amount) * 100),
                currency: 'aud',
                destination: payoutRequest.counsellor.stripe_account_id,
                description: `Payout for ${payoutRequest.counsellor.name} - Request #${payoutRequest.id.slice(-8)}`,
            });
            yield balance_services_1.BalanceService.deductBalance(payoutRequest.counsellor_id, Number(payoutRequest.amount), `Payout transfer - Request #${payoutRequest.id.slice(-8)}`, payout_request_id, 'payout_request');
            const completedRequest = yield tx.payoutRequest.update({
                where: { id: payout_request_id },
                data: {
                    status: 'COMPLETED',
                    stripe_transfer_id: transfer.id,
                },
            });
            return completedRequest;
        }
        catch (error) {
            yield tx.payoutRequest.update({
                where: { id: payout_request_id },
                data: { status: 'FAILED' },
            });
            console.error('Stripe transfer failed:', error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Payout transfer failed');
        }
    }));
});
const getPayoutRequestById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.payoutRequest.findUnique({
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
});
exports.PayoutService = {
    createPayoutRequest,
    getCounsellorPayoutRequests,
    getAllPayoutRequests,
    processPayoutRequest,
    executePayout,
    getPayoutRequestById,
};
