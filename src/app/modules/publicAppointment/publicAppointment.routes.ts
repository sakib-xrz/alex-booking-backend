import express from 'express';
import PublicAppointmentController from './publicAppointment.controller';

const router = express.Router();

router.post('/', PublicAppointmentController.PostAppointment);

export const PublicAppointmentRoutes = router;
