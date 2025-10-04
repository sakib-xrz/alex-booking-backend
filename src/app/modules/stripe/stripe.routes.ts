import { Router } from 'express';
import { StripeController } from './stripe.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Routes for counsellors to manage their Stripe Connect accounts
router.post(
  '/connect/create',
  auth(Role.COUNSELOR),
  StripeController.createConnectAccount,
);

router.post(
  '/connect/account-link',
  auth(Role.COUNSELOR),
  StripeController.createAccountLink,
);

router.post(
  '/connect/refresh',
  auth(Role.COUNSELOR),
  StripeController.refreshAccountStatus,
);

router.get(
  '/connect/login-link',
  auth(Role.COUNSELOR),
  StripeController.createLoginLink,
);

router.delete(
  '/connect/disconnect',
  auth(Role.COUNSELOR),
  StripeController.disconnectStripeAccount,
);

router.get(
  '/status',
  auth(Role.COUNSELOR),
  StripeController.getStripeAccountStatus,
);

router.get(
  '/details',
  auth(Role.COUNSELOR),
  StripeController.getStripeAccountDetails,
);

// Routes for super admin
router.get(
  '/counsellor/:counsellor_id/status',
  auth(Role.SUPER_ADMIN),
  StripeController.getCounsellorStripeStatus,
);

router.get(
  '/counsellor/:counsellor_id/details',
  auth(Role.SUPER_ADMIN),
  StripeController.getCounsellorStripeDetails,
);

export const StripeRoutes = router;
