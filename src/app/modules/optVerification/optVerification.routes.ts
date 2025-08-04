import express from 'express';
import OptVerificationController from './optVerification.controller';
import validateRequest from '../../middlewares/validateRequest';
import OptVerificationValidation from './optVerification.validation';

const router = express.Router();

router.post(
  '/send',
  validateRequest(OptVerificationValidation.createOTPValidation),
  OptVerificationController.PostOtp,
);

router.post(
  '/verify',
  validateRequest(OptVerificationValidation.verifyOTPValidation),
  OptVerificationController.VerifyOtp,
);

export const OptVerificationRoutes = router;
