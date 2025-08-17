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
const express_1 = __importDefault(require("express"));
const networkTest_1 = require("../../utils/networkTest");
const emailQueue_1 = __importDefault(require("../../utils/emailQueue"));
const router = express_1.default.Router();
router.get('/network-test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield (0, networkTest_1.testSMTPConnectivity)();
        res.json({
            success: true,
            message: 'Network diagnostics completed',
            data: {
                results,
                recommendations: results.some((r) => !r.success)
                    ? [
                        'Check Digital Ocean firewall settings',
                        'Verify SMTP ports (25, 587, 465) are not blocked',
                        'Consider using a dedicated email service (SendGrid, Mailgun, AWS SES)',
                        'Contact your hosting provider about SMTP restrictions',
                    ]
                    : ['All network tests passed - SMTP should work properly'],
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Network diagnostics failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));
router.get('/email-queue', (req, res) => {
    res.json({
        success: true,
        message: 'Email queue status',
        data: {
            queueSize: emailQueue_1.default.getQueueSize(),
            isProcessing: emailQueue_1.default.isProcessing(),
        },
    });
});
router.post('/test-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required',
            });
        }
        const jobId = yield emailQueue_1.default.addEmail(email, 'SMTP Test Email', '<h1>Test Email</h1><p>If you receive this, SMTP is working!</p>');
        res.json({
            success: true,
            message: 'Test email queued successfully',
            data: { jobId },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to queue test email',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));
exports.default = router;
