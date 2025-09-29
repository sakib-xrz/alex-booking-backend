import express from 'express';
import PublicUsersController from './publicUsers.controller';

const router = express.Router();

router.get('/counselors', PublicUsersController.GetPublicCounselors);

export const PublicUsersRoutes = router;
