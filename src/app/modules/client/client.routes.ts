import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import ClientController from './client.controller';
import ClientValidation from './client.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(ClientValidation.createClientSchema),
  ClientController.CreateClient,
);

router.get(
  '/:id',
  validateRequest(ClientValidation.verifyClientSchema),
  ClientController.GetClient,
);

router.patch(
  '/:id/verify',
  validateRequest(ClientValidation.verifyClientSchema),
  ClientController.VerifyClient,
);

export const ClientRoutes = router;
