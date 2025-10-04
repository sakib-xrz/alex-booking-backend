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
exports.StripeController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const stripe_services_1 = require("./stripe.services");
const createConnectAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.createConnectAccount({
        counsellor_id,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe Connect account link created successfully',
        data: result,
    });
}));
const refreshAccountStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.refreshAccountStatus(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe account status refreshed successfully',
        data: result,
    });
}));
const createAccountLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.createAccountLink(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe onboarding link created successfully',
        data: result,
    });
}));
const disconnectStripeAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.disconnectStripeAccount(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe account disconnected successfully',
        data: result,
    });
}));
const getStripeAccountStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.getStripeAccountStatus(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe account status retrieved successfully',
        data: result,
    });
}));
const getStripeAccountDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.getStripeAccountDetails(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe account details retrieved successfully',
        data: result,
    });
}));
const createLoginLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield stripe_services_1.StripeService.createLoginLink(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Stripe dashboard login link created successfully',
        data: result,
    });
}));
const getCounsellorStripeStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { counsellor_id } = req.params;
    const result = yield stripe_services_1.StripeService.getStripeAccountStatus(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Counsellor Stripe account status retrieved successfully',
        data: result,
    });
}));
const getCounsellorStripeDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { counsellor_id } = req.params;
    const result = yield stripe_services_1.StripeService.getStripeAccountDetails(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Counsellor Stripe account details retrieved successfully',
        data: result,
    });
}));
exports.StripeController = {
    createConnectAccount,
    refreshAccountStatus,
    createAccountLink,
    disconnectStripeAccount,
    getStripeAccountStatus,
    getStripeAccountDetails,
    createLoginLink,
    getCounsellorStripeStatus,
    getCounsellorStripeDetails,
};
