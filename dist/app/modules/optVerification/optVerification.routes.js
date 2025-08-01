"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptVerificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const optVerification_controller_1 = __importDefault(require("./optVerification.controller"));
const router = express_1.default.Router();
router.post('/send', optVerification_controller_1.default.PostOtp);
router.post('/verify', optVerification_controller_1.default.VerifyOtp);
exports.OptVerificationRoutes = router;
