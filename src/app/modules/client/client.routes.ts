import express from 'express';

import ClientController from './client.controller';

const router = express.Router();

router.post('/', ClientController.CreateClient);

export const ClientRoutes = router;
