import { Router } from 'express';
import { StripeController } from './stripe.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import StripeValidation from './stripe.validation';

const router = Router();

// Routes for counsellors to manage their Stripe accounts
router.post('/connect', 
  auth(Role.COUNSELOR), 
  validateRequest(StripeValidation.connectStripeAccountSchema),
  StripeController.connectStripeAccount
);

router.patch('/update', 
  auth(Role.COUNSELOR), 
  validateRequest(StripeValidation.updateStripeAccountSchema),
  StripeController.updateStripeAccount
);

router.delete('/disconnect', 
  auth(Role.COUNSELOR), 
  StripeController.disconnectStripeAccount
);

router.get('/status', 
  auth(Role.COUNSELOR), 
  StripeController.getStripeAccountStatus
);

router.get('/verify', 
  auth(Role.COUNSELOR), 
  StripeController.verifyStripeAccount
);

// Routes for super admin
router.get('/counsellor/:counsellor_id/status', 
  auth(Role.SUPER_ADMIN), 
  StripeController.getCounsellorStripeStatus
);

export const StripeRoutes = router;
