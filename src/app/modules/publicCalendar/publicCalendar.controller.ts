import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

import CalendarService from '../calendar/calendar.services';

const GetCounselorCalendar = catchAsync(async (req, res) => {
  const result = await CalendarService.GetCalenders(req.params.counselorId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All calender dates',
    data: result,
  });
});

const GetCounselorDateSlots = catchAsync(async (req, res) => {
  const type = req.query.type;
  const result = await CalendarService.GetDateSlots(
    req.params.calenderId,
    type as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Calender date created successfully',
    data: result,
  });
});

const PublicCalendarController = {
  GetCounselorCalendar,
  GetCounselorDateSlots,
};

export default PublicCalendarController;
