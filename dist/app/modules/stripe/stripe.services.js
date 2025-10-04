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
const payment_utils_1 = require("../payment/payment.utils");
const config_1 = __importDefault(require("../../config"));
const createConnectAccount = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const counsellor = yield prisma_1.default.user.findUnique({
        where: { id: data.counsellor_id },
        select: {
            id: true,
            name: true,
            email: true,
            stripe_account_id: true,
            is_stripe_connected: true,
        },
    });
    if (!counsellor) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Counsellor not found');
    }
    let accountId = counsellor.stripe_account_id;
    if (!accountId) {
        try {
            const account = yield payment_utils_1.stripe.accounts.create({
                type: 'express',
                country: 'AU',
                email: counsellor.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
                metadata: {
                    counsellor_id: counsellor.id,
                    counsellor_name: counsellor.name,
                },
            });
            accountId = account.id;
            yield prisma_1.default.user.update({
                where: { id: data.counsellor_id },
                data: {
                    stripe_account_id: accountId,
                },
            });
            console.log(`Created Stripe Connect account ${accountId} for ${counsellor.name}`);
        }
        catch (error) {
            console.error('Error creating Stripe Connect account:', error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create Stripe Connect account');
        }
    }
    try {
        const accountLink = yield payment_utils_1.stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${config_1.default.base_url.admin_frontend}/stripe/refresh`,
            return_url: `${config_1.default.base_url.admin_frontend}/stripe/success`,
            type: 'account_onboarding',
        });
        return {
            url: accountLink.url,
            account_id: accountId,
        };
    }
    catch (error) {
        console.error('Error creating account link:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create onboarding link');
    }
});
const refreshAccountStatus = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const counsellor = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: { stripe_account_id: true },
    });
    if (!(counsellor === null || counsellor === void 0 ? void 0 : counsellor.stripe_account_id)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No Stripe account found for this counsellor');
    }
    try {
        const account = yield payment_utils_1.stripe.accounts.retrieve(counsellor.stripe_account_id);
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: counsellor_id },
            data: {
                stripe_charges_enabled: account.charges_enabled,
                stripe_payouts_enabled: account.payouts_enabled,
                stripe_details_submitted: account.details_submitted,
                stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
                is_stripe_connected: account.charges_enabled || account.payouts_enabled,
            },
            select: {
                id: true,
                name: true,
                email: true,
                is_stripe_connected: true,
                stripe_account_id: true,
                stripe_charges_enabled: true,
                stripe_payouts_enabled: true,
                stripe_onboarding_complete: true,
                created_at: true,
                updated_at: true,
            },
        });
        return updatedUser;
    }
    catch (error) {
        console.error('Error refreshing account status:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to refresh account status');
    }
});
const createAccountLink = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const counsellor = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: { stripe_account_id: true, name: true },
    });
    if (!(counsellor === null || counsellor === void 0 ? void 0 : counsellor.stripe_account_id)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No Stripe account found. Please create one first.');
    }
    try {
        const accountLink = yield payment_utils_1.stripe.accountLinks.create({
            account: counsellor.stripe_account_id,
            refresh_url: `${config_1.default.base_url.admin_frontend}/stripe/refresh`,
            return_url: `${config_1.default.base_url.admin_frontend}/stripe/success`,
            type: 'account_onboarding',
        });
        return {
            url: accountLink.url,
            account_id: counsellor.stripe_account_id,
        };
    }
    catch (error) {
        console.error('Error creating account link:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create account link');
    }
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
    const counsellor = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: { stripe_account_id: true },
    });
    if (counsellor === null || counsellor === void 0 ? void 0 : counsellor.stripe_account_id) {
        try {
            yield payment_utils_1.stripe.accounts.del(counsellor.stripe_account_id);
            console.log(`Deleted Stripe Connect account ${counsellor.stripe_account_id}`);
        }
        catch (error) {
            console.error('Error deleting Stripe account:', error);
        }
    }
    const updatedUser = yield prisma_1.default.user.update({
        where: { id: counsellor_id },
        data: {
            stripe_account_id: null,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
            stripe_details_submitted: false,
            stripe_onboarding_complete: false,
            is_stripe_connected: false,
        },
        select: {
            id: true,
            name: true,
            email: true,
            is_stripe_connected: true,
            stripe_account_id: true,
            stripe_charges_enabled: true,
            stripe_payouts_enabled: true,
            stripe_onboarding_complete: true,
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
            stripe_account_id: true,
            stripe_charges_enabled: true,
            stripe_payouts_enabled: true,
            stripe_onboarding_complete: true,
            stripe_details_submitted: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return {
        is_connected: user.is_stripe_connected,
        account_id: user.stripe_account_id || undefined,
        charges_enabled: user.stripe_charges_enabled,
        payouts_enabled: user.stripe_payouts_enabled,
        onboarding_complete: user.stripe_onboarding_complete,
        details_submitted: user.stripe_details_submitted,
    };
});
const getStripeAccountDetails = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: {
            stripe_account_id: true,
            is_stripe_connected: true,
        },
    });
    if (!user || !user.is_stripe_connected || !user.stripe_account_id) {
        return null;
    }
    try {
        const account = yield payment_utils_1.stripe.accounts.retrieve(user.stripe_account_id);
        return account;
    }
    catch (error) {
        console.error('Error retrieving Stripe account:', error);
        return null;
    }
});
const createLoginLink = (counsellor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: counsellor_id },
        select: {
            stripe_account_id: true,
            is_stripe_connected: true,
        },
    });
    if (!user || !user.stripe_account_id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No Stripe account found for this counsellor');
    }
    try {
        const loginLink = yield payment_utils_1.stripe.accounts.createLoginLink(user.stripe_account_id);
        return { url: loginLink.url };
    }
    catch (error) {
        console.error('Error creating login link:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create Stripe dashboard link');
    }
});
exports.StripeService = {
    createConnectAccount,
    refreshAccountStatus,
    createAccountLink,
    disconnectStripeAccount,
    getStripeAccountStatus,
    getStripeAccountDetails,
    createLoginLink,
};
