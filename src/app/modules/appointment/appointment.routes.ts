import express from 'express';
import AppointmentController from './appointment.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(auth(Role.SUPER_ADMIN, Role.COUNSELOR));

router.get('/', AppointmentController.GetCounselorAppointments);
router.get(
  '/:appointmentId',
  AppointmentController.GetCounselorAppointmentDetailsById,
);

export const AppointmentRoutes = router;
