import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import PublicCalendarController from './publicCalendar.controller';
import PublicCalendarValidation from './publicCalendar.validation';

const router = express.Router();

router.get(
  '/:counselorId',
  validateRequest(PublicCalendarValidation.getCounselorCalendarSchema),
  PublicCalendarController.GetCounselorCalendar,
);

router.get(
  '/slots/:calenderId',
  validateRequest(PublicCalendarValidation.getCounselorSlotsSchema),
  PublicCalendarController.GetCounselorDateSlots,
);

export const PublicCalendarRoutes = router;
