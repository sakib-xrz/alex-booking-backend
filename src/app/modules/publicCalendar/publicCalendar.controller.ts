import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import PublicCalendarService from './publicCalendar.services';
import { SessionType } from '@prisma/client';

const GetCounselorCalendar = catchAsync(async (req, res) => {
  const result = await PublicCalendarService.GetCounselorCalendar(
    req.params.counselorId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Counselor calendar retrieved successfully',
    data: result,
  });
});

const GetCounselorDateSlots = catchAsync(async (req, res) => {
  const type = req.query.type as SessionType;
  const result = await PublicCalendarService.GetCounselorDateSlots(
    req.params.counselorId,
    req.params.date,
    type,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Calendar slots retrieved successfully',
    data: result,
  });
});

const PublicCalendarController = {
  GetCounselorCalendar,
  GetCounselorDateSlots,
};

export default PublicCalendarController;
