import express from 'express';

import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';

import CalendarController from './calendar.controller';

const router = express.Router();

router.use(auth(Role.SUPER_ADMIN, Role.COUNSELOR));
router
  .route('/')
  .get(CalendarController.GetCalendar)
  .post(CalendarController.PostCalendarDate);

router
  .route('/:id/slots')
  .get(CalendarController.GetDateSlots)
  .post(CalendarController.PostDateSlots);

export const CalendarRoutes = router;
