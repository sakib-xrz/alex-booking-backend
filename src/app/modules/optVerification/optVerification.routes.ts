import express from 'express';
import OptVerificationController from './optVerification.controller';

const router = express.Router();

router.post('/send', OptVerificationController.PostOtp);
router.post('/verify', OptVerificationController.VerifyOtp);

export const OptVerificationRoutes = router;
