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
exports.PayoutController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const pick_1 = __importDefault(require("../../utils/pick"));
const payout_services_1 = require("./payout.services");
const createPayoutRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { amount, notes } = req.body;
    const result = yield payout_services_1.PayoutService.createPayoutRequest({
        counsellor_id,
        amount,
        notes,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Payout request created successfully',
        data: result,
    });
}));
const getMyPayoutRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const counsellor_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const filters = (0, pick_1.default)(req.query, ['search', 'status', 'counsellor_id']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield payout_services_1.PayoutService.getCounsellorPayoutRequests(counsellor_id, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payout requests retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getAllPayoutRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = (0, pick_1.default)(req.query, ['search', 'status', 'counsellor_id']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield payout_services_1.PayoutService.getAllPayoutRequests(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'All payout requests retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getCounsellorPayoutRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { counsellor_id } = req.params;
    const filters = (0, pick_1.default)(req.query, ['search', 'status', 'counsellor_id']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield payout_services_1.PayoutService.getCounsellorPayoutRequests(counsellor_id, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Counsellor payout requests retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
}));
const getPayoutRequestById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield payout_services_1.PayoutService.getPayoutRequestById(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payout request retrieved successfully',
        data: result,
    });
}));
const processPayoutRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { action, rejection_reason } = req.body;
    const processed_by = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield payout_services_1.PayoutService.processPayoutRequest({
        payout_request_id: id,
        action,
        rejection_reason,
        processed_by,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: `Payout request ${action}d successfully`,
        data: result,
    });
}));
const executePayout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield payout_services_1.PayoutService.executePayout(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payout executed successfully',
        data: result,
    });
}));
exports.PayoutController = {
    createPayoutRequest,
    getMyPayoutRequests,
    getAllPayoutRequests,
    getCounsellorPayoutRequests,
    getPayoutRequestById,
    processPayoutRequest,
    executePayout,
};
