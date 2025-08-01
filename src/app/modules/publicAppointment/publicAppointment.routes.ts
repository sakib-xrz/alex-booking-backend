import express from 'express';
import PublicAppointmentController from './publicAppointment.controller';
import validateRequest from '../../middlewares/validateRequest';
import PublicAppointmentValidation from './publicAppointment.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(PublicAppointmentValidation.createPublicAppointmentZodSchema),
  PublicAppointmentController.PostAppointment,
);

export const PublicAppointmentRoutes = router;
