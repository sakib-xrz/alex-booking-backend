import express from 'express';
import PublicCalendarController from './publicCalendar.controller';

const router = express.Router();

router.get('/:counselorId', PublicCalendarController.GetCounselorCalendar);
router.get(
  '/slots/:calenderId',
  PublicCalendarController.GetCounselorDateSlots,
);

export const PublicCalendarRoutes = router;
