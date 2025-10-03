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
exports.StripeService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const connectStripeAccount = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testStripe = require('stripe')(data.stripe_secret_key);
        yield testStripe.balance.retrieve();
    }
    catch (error) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid Stripe secret key');
    }
    const encryptedSecretKey = yield bcrypt_1.default.hash(data.stripe_secret_key, 12);
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: data.counsellor_id },
        data: {
            stripe_public_key: data.stripe_public_key,
            stripe_secret_key: encryptedSecretKey,
            is_stripe_connected: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            is_stripe_connected: true,
            stripe_public_key: true,
            created_at: true,
            updated_at: true,
        },
    });
    return updatedUser;
});
const updateStripeAccount = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (data.stripe_public_key) {
        updateData.stripe_public_key = data.stripe_public_key;
    }
    if (data.stripe_secret_key) {
        try {
            const testStripe = require('stripe')(data.stripe_secret_key);
            yield testStripe.balance.retrieve();
        }
        catch (error) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid Stripe secret key');
        }
        updateData.stripe_secret_key = yield bcrypt_1.default.hash(data.stripe_secret_key, 12);
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: data.counsellor_id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            is_stripe_connected: true,
            stripe_public_key: true,
            created_at: true,
            updated_at: true,
        },
    });
    return updatedUser;
});
const disconnectStripeAccount = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const pendingPayouts = yield prisma_1.default.payoutRequest.findFirst({
        where: {
            counsellor_id,
            status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
        },
    });
    if (pendingPayouts) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot disconnect Stripe account while you have pending payout requests');
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: counsellor_id },
        data: {
            stripe_account_id: null,
            stripe_public_key: null,
            stripe_secret_key: null,
            is_stripe_connected: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            is_stripe_connected: true,
            stripe_public_key: true,
            created_at: true,
            updated_at: true,
        },
    });
    return updatedUser;
});
const getStripeAccountStatus = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: {
            is_stripe_connected: true,
            stripe_public_key: true,
            stripe_account_id: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return {
        is_connected: user.is_stripe_connected,
        public_key: user.stripe_public_key || undefined,
        account_id: user.stripe_account_id || undefined,
    };
});
const verifyStripeAccount = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: {
            stripe_secret_key: true,
            is_stripe_connected: true,
        },
    });
    if (!user || !user.is_stripe_connected || !user.stripe_secret_key) {
        return {
            is_valid: false,
            error: 'Stripe account not connected',
        };
    }
    try {
        return {
            is_valid: true,
            balance: { available: [{ amount: 0, currency: 'aud' }] },
        };
    }
    catch (error) {
        return {
            is_valid: false,
            error: 'Invalid Stripe credentials',
        };
    }
});
exports.StripeService = {
    connectStripeAccount,
    updateStripeAccount,
    disconnectStripeAccount,
    getStripeAccountStatus,
    verifyStripeAccount,
};
