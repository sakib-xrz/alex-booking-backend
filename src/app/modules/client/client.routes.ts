import express from 'express';

import ClientController from './client.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(auth(Role.SUPER_ADMIN, Role.COUNSELOR));

router.get('/', ClientController.GetCounselorClients);

export const ClientRoutes = router;
