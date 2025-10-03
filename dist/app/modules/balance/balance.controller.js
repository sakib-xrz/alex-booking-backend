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
exports.BalanceController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const pick_1 = __importDefault(require("../../utils/pick"));
const balance_services_1 = require("./balance.services");
const getCounsellorBalance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { counsellor_id } = req.params;
    const result = yield balance_services_1.BalanceService.getCounsellorBalance(counsellor_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Counsellor balance retrieved successfully',
        data: result,
    });
}));
const getMyBalance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield balance_services_1.BalanceService.getCounsellorBalance(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Balance retrieved successfully',
        data: result,
    });
}));
const getBalanceTransactions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { counsellor_id } = req.params;
    const filters = (0, pick_1.default)(req.query, ['search']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield balance_services_1.BalanceService.getBalanceTransactions(counsellor_id, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Balance transactions retrieved successfully',
        data: result,
    });
}));
const getMyBalanceTransactions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const filters = (0, pick_1.default)(req.query, ['search']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield balance_services_1.BalanceService.getBalanceTransactions(userId, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Balance transactions retrieved successfully',
        data: result,
    });
}));
const getAllCounsellorBalances = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = (0, pick_1.default)(req.query, ['search']);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sort_by',
        'sort_order',
    ]);
    const result = yield balance_services_1.BalanceService.getAllCounsellorBalances(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'All counsellor balances retrieved successfully',
        data: result,
    });
}));
const adjustBalance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { counsellor_id } = req.params;
    const { amount, description } = req.body;
    const processed_by = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield balance_services_1.BalanceService.adjustBalance(counsellor_id, amount, description, processed_by);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Balance adjusted successfully',
        data: result,
    });
}));
exports.BalanceController = {
    getCounsellorBalance,
    getMyBalance,
    getBalanceTransactions,
    getMyBalanceTransactions,
    getAllCounsellorBalances,
    adjustBalance,
};
