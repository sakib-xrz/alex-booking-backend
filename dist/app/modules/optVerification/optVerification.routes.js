"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptVerificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const optVerification_controller_1 = __importDefault(require("./optVerification.controller"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const optVerification_validation_1 = __importDefault(require("./optVerification.validation"));
const router = express_1.default.Router();
router.post('/send', (0, validateRequest_1.default)(optVerification_validation_1.default.createOTPValidation), optVerification_controller_1.default.PostOtp);
router.post('/verify', (0, validateRequest_1.default)(optVerification_validation_1.default.verifyOTPValidation), optVerification_controller_1.default.VerifyOtp);
exports.OptVerificationRoutes = router;
