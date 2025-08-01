import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppointmentService from './appointment.services';

const GetCounselorAppointments = catchAsync(async (req, res) => {
  const result = await AppointmentService.GetCounselorAppointmentsById(
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Appointments retrieved successfully',
    data: result,
  });
});
const AppointmentController = { GetCounselorAppointments };

export default AppointmentController;
